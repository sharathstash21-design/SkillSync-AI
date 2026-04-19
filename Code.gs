// --- CONFIGURATION ---
const SHEET_NAME = "DailyTracker";
const CRED_SHEET = "StaffCredentials";
const HEADERS = ["Date", "Email", "Staff Name", "Role", "Category", "Task Description", "Status", "Rating", "Remarks", "Task ID", "Resources", "Batch ID"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🦁 NUERA Admin')
      .addItem('📥 Import AI Schedule', 'showImportDialog')
      .addItem('🗑️ Delete Specific Batch', 'showDeleteBatchDialog')
      .addToUi();
}

// --- 1. LOGIN LOGIC ---
function autoLogin(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName(CRED_SHEET);
  if(!credSheet) return { error: "Database missing! Run setup." };
  
  if (!email || email.trim() === '') return { error: "No email provided." };
  
  const data = credSheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++) {
    if(String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
      const staffName = data[i][1];
      const role = String(staffName).toLowerCase() === 'admin' ? 'admin' : 'staff';
      // Log last login
      credSheet.getRange(i+1, 4).setValue(new Date());
      return { success: true, role: role, name: staffName, email: email };
    }
  }
  return { error: "Unregistered Email: " + email };
}

function loginUser(name, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName(CRED_SHEET);
  
  if(!credSheet) return { error: "Database missing! Run Import first." };
  
  // ADMIN CHECK
  if(String(name).toLowerCase() === "admin") {
     const data = credSheet.getDataRange().getValues();
     const adminRow = data.find(r => String(r[0]).toLowerCase() === 'admin');
     if(adminRow) {
        if(String(adminRow[1]) === String(password)) return { success: true, role: 'admin', name: 'Admin' };
     } else {
        if(password === 'admin123') return { success: true, role: 'admin', name: 'Admin' };
     }
  }

  // STAFF CHECK
  const data = credSheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++) {
    if(String(data[i][0]).toLowerCase() === String(name).toLowerCase() && String(data[i][1]) === String(password)) {
      return { success: true, role: 'staff', name: data[i][0] };
    }
  }
  return { error: "Wrong Password!" };
}

// --- 2. DATA FETCHING ---
function getStaffList() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(CRED_SHEET);
  if (!s || s.getLastRow() <= 1) return ["Admin"];
  return s.getRange(2, 1, s.getLastRow() - 1).getValues().flat().filter(String);
}

function getStaffTasks(staffName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if(!sheet) return { tasks: [], progress: 0 };
  
  const data = sheet.getDataRange().getValues();
  const tasks = [];
  let total = 0, completed = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === staffName) { 
      // Column 'Status' is index 6
      const isDone = (data[i][6] === "Done" || data[i][6] === "Completed");
      total++;
      if(isDone) completed++;
      tasks.push({
        row: i + 1,
        date: Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "dd-MMM"),
        category: data[i][4],
        desc: data[i][5],
        status: data[i][6],
        id: data[i][9],
        link: data[i][10] // Resources link
      });
    }
  }
  return { tasks: tasks, progress: total===0 ? 0 : Math.round((completed/total)*100) };
}

function getAdminSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if(!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const stats = {};
  
  for(let i=1; i<data.length; i++) {
    const name = data[i][2]; // Staff Name is index 2
    if(!name) continue;
    if(!stats[name]) stats[name] = { name: name, total: 0, done: 0 };
    stats[name].total++;
    if(data[i][6] === "Done" || data[i][6] === "Completed") stats[name].done++;
  }
  return Object.values(stats).map(s => ({
    name: s.name, total: s.total, done: s.done,
    pct: s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
  }));
}

// --- 3. UPDATES & IMPORTS ---
function markTaskDone(r, rating, rem) { 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.getRange(r, 7).setValue("Done");  // Status is col G (7)
  sheet.getRange(r, 8).setValue(rating);  // Rating is col H (8)
  sheet.getRange(r, 9).setValue(rem);     // Remarks is col I (9)
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const sheetsToCreate = [
    { 
      name: "DailyTracker", 
      headers: HEADERS 
    },
    { 
      name: "StaffCredentials", 
      headers: ["Email", "Staff Name", "Password", "Last Login"] 
    }
  ];

  sheetsToCreate.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers])
           .setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
      sheet.setFrozenRows(1);
    }
  });

  return ss.getSheetByName("DailyTracker");
}

function setupProject() {
  setupSheet();
  const ui = SpreadsheetApp.getUi();
  const webAppUrl = ScriptApp.getService().getUrl();
  if (webAppUrl) {
    ui.alert("🚀 Email Identity Active!\n\nAccess Admin Panel:\n" + webAppUrl);
  } else {
    ui.alert("⚠️ Deploy as Web App first!");
  }
}

function processJSON(jsonString, startDateString, staffName, staffRole) {
  const sheet = setupSheet(); 
  try {
    const data = JSON.parse(jsonString); 
    const startDate = new Date(startDateString);
    const newRows = [];
    const batchId = "BATCH-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "ddHHmm");

    data.forEach((item, index) => {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + (item.day - 1));
      if (taskDate.getDay() === 0) taskDate.setDate(taskDate.getDate() + 1);

      newRows.push([
        Utilities.formatDate(taskDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        "", // Email
        staffName, staffRole, item.category, item.task, "Pending", "", "",
        `T-${Math.floor(Math.random()*10000)}`, item.resources, batchId
      ]);
    });

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      
      // Auto-add to credentials if new
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const credSheet = ss.getSheetByName(CRED_SHEET);
      const existingData = credSheet.getDataRange().getValues();
      const existingStaff = existingData.map(r => r[1]); // Staff Name index
      if(!existingStaff.includes(staffName)) credSheet.appendRow(["", staffName, "1234", ""]);

      return `✅ Imported ${newRows.length} tasks for ${staffName}.`;
    }
  } catch (e) { throw new Error("JSON Error: " + e.message); }
}

function deleteBatch(batchId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) { 
    if (data[i][11] == batchId) sheet.deleteRow(i + 1); // Batch ID is index 11
  }
}

// --- 4. UI HELPERS ---
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const p = payload.params || {};
    let result = {};
    
    switch(action) {
      case 'getStaffList': result = getStaffList(); break;
      case 'autoLogin': result = autoLogin(p.email); break;
      case 'loginUser': result = loginUser(p.name, p.password); break;
      case 'getStaffTasks': result = getStaffTasks(p.name); break;
      case 'markTaskDone': result = markTaskDone(p.row, p.rating, p.remarks); break;
      case 'getAdminSummary': result = getAdminSummary(); break;
      case 'processJSON': result = processJSON(p.json, p.date, p.name, p.role); break;
      case 'deleteBatch': deleteBatch(p.batchId); result = { success: true }; break;
      default: result = { error: "Unknown API action: " + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) { 
  // Integration endpoint for the Antigravity Desktop Monitor Python Tool
  if (e && e.parameter && e.parameter.action === 'getProgress') {
    return handleGetProgress();
  }

  // Provide raw index.html for backwards compatibility
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.activeEmail = Session.getActiveUser().getEmail() || '';
  } catch(err) {
    template.activeEmail = '';
  }
  return template.evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleGetProgress() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tasksSheet = ss.getSheetByName(SHEET_NAME);
    if (!tasksSheet) return ContentService.createTextOutput(JSON.stringify({error: "Database missing", completion: 0})).setMimeType(ContentService.MimeType.JSON);
    
    const data = tasksSheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({completion: 0, total: 0, completed: 0})).setMimeType(ContentService.MimeType.JSON);
    
    let total = 0, completed = 0;
    for (let i = 1; i < data.length; i++) {
      total++;
      if (data[i][6] && (data[i][6].toString().toLowerCase() === 'completed' || data[i][6].toString().toLowerCase() === 'done')) {
        completed++;
      }
    }
    
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return ContentService.createTextOutput(JSON.stringify({
      completion: percent, total: total, completed: completed, timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString(), completion: 0})).setMimeType(ContentService.MimeType.JSON);
  }
}

function showImportDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif;padding:10px;text-align:center">
      <textarea id="json" placeholder="Paste JSON..." style="width:100%;height:150px;margin-bottom:5px;border:1px solid #ccc;"></textarea>
      <input type="date" id="date" style="width:100%;margin-bottom:5px;">
      <input id="name" placeholder="Name" style="width:48%"> <input id="role" placeholder="Role" style="width:48%">
      <button onclick="google.script.run.withSuccessHandler(alert).processJSON(document.getElementById('json').value,document.getElementById('date').value,document.getElementById('name').value,document.getElementById('role').value)" style="margin-top:10px;padding:8px 20px;background:blue;color:white;border:none;border-radius:4px;">RUN</button>
    </div>`).setWidth(400).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import');
}

function showDeleteBatchDialog() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Batch ID to delete:');
  if (res.getSelectedButton() == ui.Button.OK) deleteBatch(res.getResponseText().trim());
}
