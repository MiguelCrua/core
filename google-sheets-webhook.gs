/** CORE Workbook — install in a Google Apps Script project owned by CORE.
 * Set WEBHOOK_SECRET in Project settings > Script properties before publishing.
 * Run setupCoreWorkbook once; then deploy as a Web app, execute as yourself.
 * Access: Anyone. The server-held secret authorizes writes; the Sheet stays private.
 */
function setupCoreWorkbook() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    const book = SpreadsheetApp.create('CORE — Contactos Workbook');
    const sheet = book.getSheets()[0];
    sheet.setName('Contactos');
    sheet.getRange(1, 1, 1, 4).setValues([['Data UTC', 'Nome', 'Email', 'Origem']]);
    sheet.getRange(1, 1, 1, 4).setBackground('#1b1b1b').setFontColor('#f2f0ef').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 210);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 180);
    id = book.getId();
    props.setProperty('SHEET_ID', id);
  }
  console.log(SpreadsheetApp.openById(id).getUrl());
}

function doPost(event) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(event.postData.contents);
    const secret = props.getProperty('WEBHOOK_SECRET');
    if (!secret || data.secret !== secret) return reply({ok: false});
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ok: false});
    if (!lock.tryLock(10000)) return reply({ok: false});
    const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName('Contactos');
    // Prefix user input to prevent spreadsheet formula injection.
    const safe = text => /^[=+@\-]/.test(text) ? "'" + text : text;
    const emailRange = sheet.getLastRow() > 1 ? sheet.getRange(2, 3, sheet.getLastRow() - 1, 1) : null;
    const existing = emailRange && emailRange.createTextFinder(safe(email)).matchEntireCell(true).useRegularExpression(false).findNext();
    if (!existing) sheet.appendRow([new Date().toISOString(), safe(name), safe(email), 'core-workbook']);
    SpreadsheetApp.flush();
    return reply({ok: true});
  } catch (_) {
    return reply({ok: false});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
