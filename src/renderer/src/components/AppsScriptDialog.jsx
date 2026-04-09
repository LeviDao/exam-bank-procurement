import React, { useState } from 'react'

const SCRIPT_TEMPLATE = `/** @OnlyCurrentDoc */

/**
 * Mã tự động sinh bởi Exam Bank Manager.
 * Hướng dẫn: Mở Google Sheet chứa dữ liệu CSV >> Vào Tiện ích mở rộng >> Apps Script >> Dán mã này.
 *
 * CẢNH BÁO QUAN TRỌNG: 
 * API của Google Apps Script có giới hạn thi hành (Timeout) khoảng 6 phút.
 * Nếu bộ câu hỏi của bạn LỚN HƠN 300 câu, quy trình có thể không hoàn thành đúng lúc.
 * Khuyến nghị: Hãy tách nhỏ kho dữ liệu hoặc báo cáo nếu gặp timeout.
 */
function createFormFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert("Sheet không có dữ liệu!");
    return;
  }

  // Khởi tạo Google Form
  const form = FormApp.create("Exam Form " + new Date().toISOString().slice(0, 10));
  form.setIsQuiz(true); // Đặt chế độ Bài kiểm tra

  // Xác định vị trí các cột
  const headers = data[0];
  const sttIdx = headers.findIndex(h => /stt/i.test(h));
  const contentIdx = headers.findIndex(h => /(nội dung|noi dung|content)/i.test(h));
  const answerIdx = headers.findIndex(h => /(đáp án|dap an|answer)/i.test(h));
  
  const optionIndexes = [];
  for (let c = 0; c < headers.length; c++) {
    if (/(phương án|phuong an|option)/i.test(headers[c])) {
      optionIndexes.push(c);
    }
  }

  // Duyệt và sinh câu hỏi trắc nghiệm
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const content = row[contentIdx];
    const stt = row[sttIdx]; // Lấy thêm giá trị STT
    
    if (!content) continue;

    const answer = (row[answerIdx] || "").toString().trim().toUpperCase();
    const answerIndexMap = { "A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7, "I": 8, "J": 9 };
    const correctIdx = answerIndexMap[answer];

    const item = form.addMultipleChoiceItem();
    
    // Ghép STT vào tiêu đề (Ví dụ: "Câu 1: Nội dung...")
    item.setTitle(\`Câu \${stt}: \${content.toString()}\`); 
    
    // [YÊU CẦU PRD]: Mặc định Google Form KHÔNG xáo trộn đáp án, 
    // nên tính ánh xạ tĩnh (A=0, B=1...) được bảo toàn tự nhiên.

    const choices = [];
    for (let optIdx = 0; optIdx < optionIndexes.length; optIdx++) {
      const optVal = row[optionIndexes[optIdx]];
      if (optVal && optVal.toString().trim() !== "") {
        const isCorrect = (optIdx === correctIdx);
        choices.push(item.createChoice(optVal.toString(), isCorrect));
      }
    }
    
    if (choices.length > 0) {
      item.setChoices(choices);
    }
    count++;

    // [YÊU CẦU PRD]: Chèn flush sau mỗi 50 câu để tránh tràn bộ nhớ và tắc nghẽn API
    if (count % 50 === 0) {
      SpreadsheetApp.flush();
      Utilities.sleep(100); 
    }
  }

  // Kết thúc
  const formUrl = form.getEditUrl();
  SpreadsheetApp.getUi().alert("Tạo Form thành công! URL: " + formUrl);
  Logger.log("Form Edit URL: " + formUrl);
}
`

export function AppsScriptDialog({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(SCRIPT_TEMPLATE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Mã Google Apps Script</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✖</button>
        </div>

        <div style={{ marginTop: '10px', fontSize: '13px', background: '#fffbe6', padding: '12px', borderRadius: '4px', border: '1px solid #ffe58f', maxHeight: '200px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#d48806' }}>💡 Hướng dẫn vận hành (Rất quan trọng):</p>
          <div style={{ color: '#555', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 4px' }}><strong>Phần 1: Chuẩn bị dữ liệu</strong></p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '20px' }}>
              <li>Xuất file dữ liệu hiện tại sang định dạng <strong>CSV</strong>.</li>
              <li>Tạo một Google Sheet mới và <strong>Import</strong> file CSV vừa tải.</li>
              <li>Vào tab <strong>Tiện ích mở rộng &gt; Apps Script</strong>.</li>
            </ul>

            <p style={{ margin: '0 0 4px' }}><strong>Bước 1: Hiển thị file cấu hình ẩn (appsscript.json)</strong></p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '20px' }}>
              <li>Trong giao diện Google Apps Script, click vào icon <strong>Cài đặt</strong> (hình bánh răng).</li>
              <li>Tích chọn <strong>"Hiển thị tệp kê khai 'appsscript.json' trong trình chỉnh sửa"</strong>.</li>
            </ul>

            <p style={{ margin: '0 0 4px' }}><strong>Bước 2: Khai báo quyền thủ công</strong></p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '20px' }}>
              <li>Quay lại tab <strong>Trình chỉnh sửa</strong> (icon &lt; &gt;).</li>
              <li>Click vào file <strong>appsscript.json</strong> vừa xuất hiện.</li>
              <li>Thay thế toàn bộ nội dung bằng đoạn code JSON bên dưới:</li>
            </ul>
            <pre style={{ background: '#fff', padding: '8px', border: '1px solid #ddd', fontSize: '11px', overflowX: 'auto' }}>
{`{
  "timeZone": "Asia/Ho_Chi_Minh",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/forms"
  ],
  "runtimeVersion": "V8"
}`}
            </pre>
            <p style={{ fontSize: '11px', fontStyle: 'italic', marginTop: '4px' }}>(Ghi chú: Giúp giới hạn quyền chỉ thao tác trên file hiện hành và tạo Form).</p>
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <textarea
            readOnly
            value={SCRIPT_TEMPLATE}
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              resize: 'none',
              background: '#fafafa',
              color: '#333',
              lineHeight: '1.4'
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: '10px',
              right: '25px',
              padding: '4px 12px',
              background: copied ? '#52c41a' : '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            {copied ? '✔ Đã sao chép' : '📋 Chép mã'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} style={closeBtnStyle}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const dialogStyle = {
  background: '#fff',
  width: '650px',
  maxHeight: '90vh',
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
}

const closeBtnStyle = {
  padding: '6px 20px',
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 500
}
