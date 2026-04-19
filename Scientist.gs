// ============================================================
// SkillSync AI | Scientist.gs
// Self-healing database setup script
// ============================================================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // These headers MUST match Code.gs exactly
  const requiredSheets = {
    'StaffCredentials': ['Email', 'Staff Name', 'Password', 'Last Login'],
    'DailyTracker': ['Date', 'Email', 'Staff Name', 'Role', 'Category',
                     'Task Description', 'Status', 'Rating', 'Remarks',
                     'Task ID', 'Resources', 'Batch ID']
  };

  for (const sheetName in requiredSheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Created sheet: ' + sheetName);
    }
    // Always overwrite headers to fix any mismatch
    const targetHeaders = requiredSheets[sheetName];
    sheet.getRange(1, 1, 1, targetHeaders.length)
         .setValues([targetHeaders])
         .setFontWeight('bold')
         .setBackground('#0f172a')
         .setFontColor('white');
    sheet.setFrozenRows(1);
    Logger.log('Headers fixed: ' + sheetName);
  }

  // Remove default Sheet1 if present
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('✅ Database setup complete.');
}

// Run this to add test staff accounts
// Admin password: admin123
// Staff PIN: 1234
function seedTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName('StaffCredentials');
  if (!credSheet) {
    Logger.log('Run setupDatabase() first!');
    return;
  }

  // Clear existing rows (keep header)
  if (credSheet.getLastRow() > 1) {
    credSheet.getRange(2, 1, credSheet.getLastRow() - 1, 4).clearContent();
  }

  // Email | Staff Name | Password | Last Login
  credSheet.appendRow(['admin', 'Admin', 'admin123', '']);
  credSheet.appendRow(['', 'Priya', '1234', '']);
  credSheet.appendRow(['', 'Ravi', '1234', '']);

  Logger.log('✅ Test data seeded successfully.');
}
