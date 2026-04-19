// ============================================================
// SkillSync AI | Code.gs — Main Backend
// ============================================================

const SHEET_NAME = "DailyTracker";
const CRED_SHEET = "StaffCredentials";
const HEADERS = ["Date", "Email", "Staff Name", "Role", "Category", "Task Description", "Status", "Rating", "Remarks", "Task ID", "Resources", "Batch ID"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🦁 NUERA Admin')
    .addItem('📥 Import AI Schedule', 'showImportDialog')
    .addItem('🗑️ Delete Specific Batch', 'showDeleteBatchDialog')
    .addItem('⚙️ Setup / Fix Database', 'setupProject')
    .addToUi();
}

// --- 1. SETUP ---
function setupProject() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const sheetsToCreate = [
    {
      name: "DailyTracker",
      headers: ["Date", "Email", "Staff Name", "Role", "Category", "Task Description", "Status", "Rating", "Remarks", "Task ID", "Resources", "Batch ID"]
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
    }
    // Always fix headers to ensure correct column order
    sheet.getRange(1, 1, 1, s.headers.length)
         .setValues([s.headers])
         .setFontWeight("bold")
         .setBackground("#0f172a")
         .setFontColor("white");
    sheet.setFrozenRows(1);
  });

  const webAppUrl = ScriptApp.getService().getUrl();
  if (webAppUrl) {
    ui.alert("✅ Database configured!\n\nWeb App URL:\n" + webAppUrl);
  } else {
    ui.alert("✅ Database configured!\n\n⚠️ Deploy as Web App to get your URL.");
  }
}

// --- 2. LOGIN ---
function autoLogin(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName(CRED_SHEET);
  if (!credSheet) return { error: "Database missing! Run Setup from menu." };
  if (!email || email.trim() === '') return { error: "No email provided." };

  const data = credSheet.getDataRange().getValues();
  // Col A = Email (index 0), Col B = Staff Name (index 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
      const staffName = data[i][1];
      const role = String(staffName).toLowerCase() === 'admin' ? 'admin' : 'staff';
      credSheet.getRange(i + 1, 4).setValue(new Date()); // Update Last Login
      return { success: true, role: role, name: staffName, email: email };
    }
  }
  return { error: "Unregistered Google Account: " + email };
}

function loginUser(name, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName(CRED_SHEET);
  if (!credSheet) return { error: "Database missing! Run Setup from menu." };

  const data = credSheet.getDataRange().getValues();

  // ADMIN CHECK — Col A = Email/Name (index 0), Col C = Password (index 2)
  if (String(name).toLowerCase() === "admin") {
    const adminRow = data.find(r => String(r[0]).toLowerCase() === 'admin');
    if (adminRow) {
      if (String(adminRow[2]) === String(password)) return { success: true, role: 'admin', name: 'Admin' };
    } else {
      if (password === 'admin123') return { success: true, role: 'admin', name: 'Admin' };
    }
    return { error: "Wrong admin password!" };
  }

  // STAFF CHECK — match by Staff Name (Col B = index 1), Password (Col C = index 2)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === String(name).toLowerCase() &&
        String(data[i][2]) === String(password)) {
      credSheet.getRange(i + 1, 4).setValue(new Date()); // Update Last Login
      return { success: true, role: 'staff', name: data[i][1] };
    }
  }
  return { error: "Wrong password!" };
}

// --- 3. DATA FETCHING ---
function getStaffList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(CRED_SHEET);
  if (!s || s.getLastRow() <= 1) return ["Admin"];
  // Col B = Staff Name (index 1, column 2)
  return s.getRange(2, 2, s.getLastRow() - 1, 1).getValues().flat().filter(String);
}

function getStaffTasks(staffName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return { tasks: [], progress: 0 };

  const data = sheet.getDataRange().getValues();
  const tasks = [];
  let total = 0, completed = 0;

  for (let i = 1; i < data.length; i++) {
    // Col C = Staff Name (index 2)
    if (String(data[i][2]).toLowerCase() === String(staffName).toLowerCase()) {
      // Col G = Status (index 6)
      const isDone = (data[i][6] === "Done" || data[i][6] === "Completed");
      total++;
      if (isDone) completed++;

      if (!isDone) { // Only return pending tasks to the staff view
        tasks.push({
          row: i + 1,
          date: data[i][0] ? Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "dd-MMM") : "",
          category: data[i][4],   // Col E = Category
          desc: data[i][5],       // Col F = Task Description
          status: data[i][6],     // Col G = Status
          id: data[i][9],         // Col J = Task ID
          link: data[i][10]       // Col K = Resources
        });
      }
    }
  }
  return {
    tasks: tasks,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

function getAdminSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const stats = {};

  for (let i = 1; i < data.length; i++) {
    const name = data[i][2]; // Col C = Staff Name
    if (!name) continue;
    if (!stats[name]) stats[name] = { name: name, total: 0, done: 0 };
    stats[name].total++;
    const status = String(data[i][6]).toLowerCase(); // Col G = Status
    if (status === 'done' || status === 'completed') stats[name].done++;
  }

  return Object.values(stats).map(s => ({
    name: s.name,
    total: s.total,
    done: s.done,
    pct: s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
  }));
}

// --- 4. UPDATES ---
function markTaskDone(row, rating, remarks) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  sheet.getRange(row, 7).setValue("Done");       // Col G = Status
  sheet.getRange(row, 8).setValue(rating);       // Col H = Rating
  sheet.getRange(row, 9).setValue(remarks);      // Col I = Remarks
}

// --- 5. IMPORT ---
function processJSON(jsonString, startDateString, staffName, staffRole) {
  const sheet = setupSheetOnly();
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data) || data.length === 0) throw new Error("JSON must be a non-empty Array.");

    const startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) throw new Error("Invalid start date.");

    const batchId = "BATCH-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "ddHHmm");
    const newRows = [];

    data.forEach(item => {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + (item.day - 1));
      // Skip Sundays — push to Monday
      if (taskDate.getDay() === 0) taskDate.setDate(taskDate.getDate() + 1);

      newRows.push([
        Utilities.formatDate(taskDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        "",           // Email (blank — matched by name)
        staffName,
        staffRole,
        item.category || "Routine",
        item.task || "",
        "Pending",
        "",           // Rating
        "",           // Remarks
        "T-" + Math.floor(Math.random() * 90000 + 10000),
        item.resources || "None",
        batchId
      ]);
    });

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);

      // Auto-add staff to credentials if not already there
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const credSheet = ss.getSheetByName(CRED_SHEET);
      const existingNames = credSheet.getDataRange().getValues().map(r => String(r[1]).toLowerCase());
      if (!existingNames.includes(String(staffName).toLowerCase())) {
        credSheet.appendRow(["", staffName, "1234", ""]);
      }
    }

    return "✅ Imported " + newRows.length + " tasks for " + staffName + " (Batch: " + batchId + ")";
  } catch (e) {
    throw new Error("Import failed: " + e.message);
  }
}

// Helper: ensure sheets exist without showing UI alerts
function setupSheetOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setValues([HEADERS])
         .setFontWeight("bold")
         .setBackground("#0f172a")
         .setFontColor("white");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// --- 6. DELETE BATCH ---
function deleteBatch(batchId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  // Delete from bottom up to avoid row index shifting
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][11]) === String(batchId)) sheet.deleteRow(i + 1); // Col L = Batch ID
  }
}

// --- 7. WEB APP ENTRY POINT ---
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getProgress') {
    return handleGetProgress();
  }
  const template = HtmlService.createTemplateFromFile('index');
  try {
    template.activeEmail = Session.getActiveUser().getEmail() || '';
  } catch (err) {
    template.activeEmail = '';
  }
  return template.evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleGetProgress() {
  try {
    const tasksSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!tasksSheet) return jsonResponse({ error: "DailyTracker sheet missing", completion: 0 });

    const data = tasksSheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ completion: 0, total: 0, completed: 0 });

    let total = 0, completed = 0;
    for (let i = 1; i < data.length; i++) {
      total++;
      const status = String(data[i][6]).toLowerCase();
      if (status === 'done' || status === 'completed') completed++;
    }

    return jsonResponse({
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      total: total,
      completed: completed,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ error: err.toString(), completion: 0 });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- 8. MENU DIALOGS ---
function showImportDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif;padding:15px">
      <p style="font-size:11px;color:#888;margin-bottom:10px">Paste the JSON array from the Prompt Generator here.</p>
      <textarea id="json" placeholder="Paste JSON array..." style="width:100%;height:120px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;padding:6px;font-size:12px;"></textarea>
      <input type="date" id="date" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #ccc;border-radius:4px;">
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <input id="name" placeholder="Staff Name" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;">
        <input id="role" placeholder="Role" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;">
      </div>
      <button onclick="
        google.script.run
          .withSuccessHandler(r => { document.getElementById('msg').innerText = r; })
          .withFailureHandler(e => { document.getElementById('msg').style.color='red'; document.getElementById('msg').innerText = e.message; })
          .processJSON(
            document.getElementById('json').value,
            document.getElementById('date').value,
            document.getElementById('name').value,
            document.getElementById('role').value
          )
      " style="width:100%;padding:10px;background:#3b82f6;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">
        Import Tasks
      </button>
      <p id="msg" style="margin-top:10px;font-size:12px;color:green;"></p>
    </div>
  `).setWidth(420).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, '📥 Import AI Schedule');
}

function showDeleteBatchDialog() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Enter Batch ID to delete (e.g. BATCH-121530):');
  if (res.getSelectedButton() == ui.Button.OK) {
    deleteBatch(res.getResponseText().trim());
    ui.alert('✅ Batch deleted.');
  }
}
