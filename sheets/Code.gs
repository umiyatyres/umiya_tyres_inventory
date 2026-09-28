var HEADERS = ["id", "vehicle", "size", "price", "shop", "godown"];

function stockSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("Stock");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Stock");
  }
  if (String(sheet.getRange(1, 1).getValue()).trim().toLowerCase() !== "id") {
    sheet.insertRowBefore(1);
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

function rowsToItems_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0].map(function (cell) {
    return String(cell).trim().toLowerCase();
  });
  var index = {};
  HEADERS.forEach(function (name) {
    index[name] = header.indexOf(name);
  });
  var items = [];
  for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
    var row = values[rowIndex];
    var vehicle = index.vehicle >= 0 ? String(row[index.vehicle] || "").trim() : "";
    var size = index.size >= 0 ? String(row[index.size] || "").trim() : "";
    var price = index.price >= 0 ? String(row[index.price] || "").trim() : "";
    if (!vehicle || !size || !price) continue;
    var idCell = index.id >= 0 ? String(row[index.id] || "").trim() : "";
    items.push({
      id: idCell || ("row-" + (rowIndex + 1)),
      vehicle: vehicle,
      size: size,
      price: price,
      shop: Number(index.shop >= 0 ? row[index.shop] : 0) || 0,
      godown: Number(index.godown >= 0 ? row[index.godown] : 0) || 0
    });
  }
  return items;
}

function writeItems_(sheet, items) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (!items.length) return;
  var grid = items.map(function (item) {
    return [
      String(item.id || ""),
      String(item.vehicle || ""),
      String(item.size || ""),
      String(item.price || ""),
      Number(item.shop) || 0,
      Number(item.godown) || 0
    ];
  });
  sheet.getRange(2, 1, grid.length, HEADERS.length).setValues(grid);
}

function doGet(e) {
  var body = JSON.stringify(rowsToItems_(stockSheet_()));
  var callback = e && e.parameter ? e.parameter.callback : "";
  if (callback && /^[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + body + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var raw = "";
  if (e.parameter && e.parameter.payload) raw = e.parameter.payload;
  else if (e.postData && e.postData.contents) raw = e.postData.contents;
  var data = JSON.parse(raw);
  var items = data.items || data;
  if (!Array.isArray(items)) {
    throw new Error("Expected a list of tyres");
  }
  writeItems_(stockSheet_(), items);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, count: items.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
