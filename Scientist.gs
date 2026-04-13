// Scientist.gs
// This script acts as the "Scientist" described in the project spec.
// It auto-configures the Google Sheets database schema upon first execution.

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Define required sheets and their corresponding headers
  const requiredSheets = {
    'Staff': ['Staff ID', 'Name', 'Role', 'Email', 'Active'],
    'Tasks': ['Task ID', 'Staff ID', 'Task Name', 'Description', 'Status', 'Due Date'],
    'LearningPaths': ['Path ID', 'Staff ID', 'Original Prompt', 'AI Plan Data', 'Created At']
  };

  for (const sheetName in requiredSheets) {
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it does not exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Check and set headers
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    const targetHeaders = requiredSheets[sheetName];
    
    if (currentHeaders[0] !== targetHeaders[0]) {
      sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
      sheet.getRange(1, 1, 1, targetHeaders.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, targetHeaders.length).setBackground('#f3f4f6');
      
      // Freeze the top row
      sheet.setFrozenRows(1);
      
      Logger.log(`Configured headers for sheet: ${sheetName}`);
    } else {
      Logger.log(`Sheet "${sheetName}" is already configured.`);
    }
  }
  
  // Optionally remote default Sheet1 if unused
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

// Function to add a test user easily
function seedTestUser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('Staff');
  if (staffSheet) {
    staffSheet.appendRow(['STAFF-001', 'Jane Doe', 'Digital Marketing Strategist', 'jane@nuera.local', 'Yes']);
  }
}
