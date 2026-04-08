export function getGasScriptTemplate(): string {
  return `/**
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Đảm bảo bạn đã import file CSV vào Google Sheets.
 * 2. Copy toàn bộ đoạn mã này.
 * 3. Trong Google Sheets, chọn menu Tiện ích mở rộng (Extensions) -> Apps Script.
 * 4. Paste mã vào trình chỉnh sửa, dán đè thay thế tất cả mọi thứ.
 * 5. Bấm Lưu (biểu tượng đĩa mềm) và ấn "Chạy" (Run) hàm onOpen hoặc tạo Form.
 * 6. Để tạo form, bạn có thể chạy hàm createGoogleFormFromCSV hoặc quay lại Google Sheets,
 *    một menu "Exam Bank Manager" sẽ xuất hiện, bạn click vào đó để tạo Form.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Exam Bank Manager')
      .addItem('Tạo Google Form từ bộ câu hỏi', 'createGoogleFormFromCSV')
      .addToUi();
}

function createGoogleFormFromCSV() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert("Không có liệu để tạo Form!");
    return;
  }

  // Tiêu đề của file sheet sẽ được lấy làm tiêu đề Form
  var formTitle = SpreadsheetApp.getActiveSpreadsheet().getName() + " - Quiz";
  
  var form = FormApp.create(formTitle);
  form.setIsQuiz(true);
  form.setShuffleQuestions(true);

  // Rows 0 là Header: STT, Nội dung, Phương án A, B, C, D, Đáp án, Tags
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var questionContent = row[1];
    var optA = row[2] ? row[2].toString().trim() : "";
    var optB = row[3] ? row[3].toString().trim() : "";
    var optC = row[4] ? row[4].toString().trim() : "";
    var optD = row[5] ? row[5].toString().trim() : "";
    var correctAns = row[6] ? row[6].toString().trim().toUpperCase() : "";
    
    if (!questionContent) continue; // Bỏ qua câu rỗng

    var item = form.addMultipleChoiceItem();
    item.setTitle(questionContent);
    item.setRequired(true);
    item.setPoints(1);

    var choices = [];
    if (optA) choices.push(item.createChoice(optA, correctAns === 'A'));
    if (optB) choices.push(item.createChoice(optB, correctAns === 'B'));
    if (optC) choices.push(item.createChoice(optC, correctAns === 'C'));
    if (optD) choices.push(item.createChoice(optD, correctAns === 'D'));

    item.setChoices(choices);
  }

  var formUrl = form.getEditUrl();
  var publishedUrl = form.getPublishedUrl();
  
  // Ghi URL của Form vừa tạo vào ô đầu tiên trống làm log
  sheet.getRange(1, 10).setValue("Form Edit URL");
  sheet.getRange(2, 10).setValue(formUrl);
  sheet.getRange(1, 11).setValue("Form Published URL");
  sheet.getRange(2, 11).setValue(publishedUrl);

  SpreadsheetApp.getUi().alert("Tạo Form thành công!\\nURL Edit: " + formUrl);
}
`;
}
