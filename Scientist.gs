function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const requiredSheets = {
    'StaffCredentials': ['Email', 'Staff Name', 'Password', 'Last Login'],
    'DailyTracker': ['Date', 'Email', 'Staff Name', 'Role', 'Category',
                     'Task Description', 'Status', 'Rating', 'Remarks',
                     'Task ID', 'Resources', 'Batch ID']
  };

  for (const sheetName in requiredSheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    const targetHeaders = requiredSheets[sheetName];
    sheet.getRange(1, 1, 1, targetHeaders.length)
         .setValues([targetHeaders])
         .setFontWeight('bold')
         .setBackground('#0f172a')
         .setFontColor('white');
    sheet.setFrozenRows(1);
  }

  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

  Logger.log('✅ Database setup complete.');
}
