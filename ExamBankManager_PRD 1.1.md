**EXAM BANK MANAGER**  

*Product Requirements Document (PRD)*  

Phiên bản 1.1 · 2025  

# 1. Tổng Quan Dự Án  

Exam Bank Manager là ứng dụng desktop giúp giáo viên, học sinh và sinh viên quản lý, chỉnh sửa, phân loại và xuất các bộ đề thi trắc nghiệm dựa trên định dạng Markdown. Điểm mới trong phiên bản 1.1 là **hỗ trợ sinh mã Google Apps Script** – người dùng có thể copy script mẫu và chạy trực tiếp trong Google Sheets để tạo Google Form chỉ với một cú nhấp chuột, không cần viết code thủ công.  

| **Thuộc tính** | **Chi tiết** |
| --- | --- |
| Loại ứng dụng | Desktop Application (Electron.js) — Windows & macOS |
| Đối tượng | Giáo viên, học sinh, sinh viên biên soạn ngân hàng câu hỏi |
| Quy mô dữ liệu | Tối ưu cho 390 – 500 câu hỏi |
| Mục tiêu cốt lõi | Tạo file .md / .csv chuẩn + cung cấp Google Apps Script để tự động hoá việc tạo Google Form |

*⚠ Ngoài phạm vi (Out of Scope): Không hỗ trợ chèn hình ảnh, công thức toán phức tạp, hay chế độ thi thử trực tiếp trong app.*  

# 2. Tech Stack  

| **Tầng** | **Công nghệ** | **Ghi chú** |
| --- | --- | --- |
| Core Framework | Electron.js | Đóng gói web app thành desktop app |
| Frontend | React.js + HTML/CSS | Quản lý state bảng dữ liệu hiệu quả |
| Bảng dữ liệu | TanStack Table | Xử lý bảng lớn mượt mà |
| Markdown Parser | markdown-it | Đọc và render file .md |

# 3. Tính Năng Cốt Lõi  

## 3.1 Import Markdown  

* Người dùng tải lên hoặc kéo thả file .md vào ứng dụng.  
* App đọc file và tự động chuyển bảng Markdown thành bảng tương tác trên UI.  
* Mỗi lần mở file là một profile độc lập — người dùng tự quản lý file trên máy.  
* Khi import file mới, app mở trong cửa sổ/tab riêng, không ghi đè dữ liệu cũ.  

## 3.2 Hiển Thị & Chỉnh Sửa Trực Tiếp (Editable Table)  

Bảng dữ liệu gồm 5 cột cố định:  

| **Cột** | **Nội dung** | **Ghi chú** |
| --- | --- | --- |
| STT | Định danh duy nhất của câu hỏi | Không tự động renumber khi xóa |
| Nội dung | Nội dung câu hỏi |  |
| Phương án trả lời | Chứa các đáp án con phần tách biệt | Dữ liệu ngầm là mảng (Array). Edit qua Sub-form có các ô text độc lập. App tự gen `A.` và `<br>` khi xuất `.md`. Có thể hỗ trợ linh hoạt số lượng đáp án (VD: Đúng/Sai có 2 đáp án, hoặc câu hỏi có 5 đáp án). |
| Đáp án | Phương án đúng | App tự động cảnh báo (Validation) nếu đáp án điền vào không khớp với các phương án trả lời, hoặc để trống. |
| Tags | Nhãn phân loại | VD: #Chuong1 #Kho |

* Tất cả ô đều có thể click để chỉnh sửa inline (như Excel). Riêng cột **Phương án trả lời**, người dùng click để mở một popup/sub-form nhập độc lập cho từng đáp án con, không cần tự gõ thẻ `<br>`.  
* Thêm câu hỏi mới: người dùng tự nhập STT, app không tự sinh.  
* Xóa câu hỏi: STT giữ nguyên, không renumber.  
* **Validation (Xử lý lỗi):** Cảnh báo lỗi trực tiếp trên giao diện nếu câu hỏi thiếu nội dung, hụt phương án trả lời, hoặc điền sai đáp án so với phương án đã chọn.

## 3.3 Hệ Thống Tag & Bộ Lọc  

* Gắn tag: người dùng gõ tự do, một hoặc nhiều tag cho mỗi câu hỏi. App tự động format và loại bỏ khoảng trắng hoặc ký tự đặc biệt để đảm bảo hợp lệ (VD: `#Dia Lý` chuyển thành `#Dia_Ly`).  
* Bộ lọc: sidebar liệt kê tất cả tag đang có, người dùng tick chọn.  
* Logic AND: chọn nhiều tag thì chỉ hiện câu chứa tất cả tag được chọn.  
* Sắp xếp kết quả theo thứ tự tag được tick.  

*⚠ Lưu ý UX: Nếu kết quả trống, UI hiển thị thông báo rõ ràng để người dùng biết đang áp dụng AND logic, tránh nhầm lẫn.*  

## 3.4 Xuất Dữ Liệu (Export)  

App cung cấp 3 tùy chọn xuất file — bao gồm cả .md và .csv:  

| **Tùy chọn** | **Mô tả** | **Format** |
| --- | --- | --- |
| Xuất toàn bộ | Tải xuống toàn bộ bộ câu hỏi | .md hoặc .csv |
| Xuất theo STT | Nhập dải số hoặc danh sách STT (VD: 1-50, 75, 80) | .md hoặc .csv |
| Xuất theo Tag | Xuất các câu đang hiển thị sau khi áp dụng bộ lọc tag | .md hoặc .csv |

*⚠ Quan trọng: Format export phải nhất quán tuyệt đối — không có khoảng trắng thừa, `<br>` không bị escape — để đảm bảo script Google Apps Script đọc đúng.*  

## 3.5 Tích Hợp Google Apps Script (Tính năng mới)  

Đây là điểm nhấn của phiên bản 1.1, giúp người dùng không cần tự viết script.  

### 3.5.1 Sinh mã Apps Script mẫu  

Sau khi xuất file .csv, người dùng nhấn nút **"Lấy mã Apps Script"** trong ứng dụng. App sẽ hiển thị một hộp thoại chứa toàn bộ mã Google Apps Script hoàn chỉnh, bao gồm:  

- Hàm `onOpen()` để tạo menu tuỳ chỉnh trong Google Sheets.  
- Hàm `createGoogleFormFromCSV()` đọc dữ liệu từ sheet hiện tại (theo đúng cấu trúc định sẵn).  
- Tự động tạo Google Form ở chế độ **Làm bài kiểm tra (Quiz)** (`isQuiz: true`).
- Tự động thiết lập thông số mặc định (Hard-code trong script): Bắt buộc trả lời (Required: true), 1 điểm mỗi câu, có xáo trộn phương án.  
- Tự động tạo mỗi câu hỏi là một item trắc nghiệm, đáp án đúng được đánh dấu.  
- Ghi lại ID của Form vào sheet để dễ quản lý.  

Người dùng chỉ cần **Copy** đoạn mã này, mở Google Sheets (đã upload CSV), vào menu **Extensions → Apps Script**, paste và chạy.  

### 3.5.2 Hướng dẫn từng bước (built-in)  

App cung cấp một popup hướng dẫn trực quan (có ảnh chụp màn hình minh hoạ) với 4 bước:  

1. Export CSV từ app.  
2. Upload CSV lên Google Sheets.  
3. Mở Apps Script, paste mã mẫu, lưu và chạy hàm `createGoogleFormFromCSV`.  
4. Google Form được tạo tự động, có thể chỉnh sửa thêm.  

### 3.5.3 Đảm bảo tương thích CSV  

Để Apps Script hoạt động trơn tru, app sẽ xuất CSV theo **RFC 4180** nghiêm ngặt:  
- Các ô có chứa dấu phẩy, xuống dòng, dấu ngoặc kép được bao bởi dấu `"`.  
- Khi export CSV, dữ liệu Mảng nền tảng của cột "Phương án trả lời" sẽ tự động được lấy giá trị thô (không có chữ A, B, C, D ở đầu) và dàn đều vào các cột CSV phương án riêng rẽ một cách an toàn tuyệt đối. Nếu câu hỏi có ít hơn định dạng chuẩn (VD câu Đúng/Sai chỉ có 2 đáp án), các cột phương án bị khuyết sẽ được điền chuỗi rỗng.  

# 4. Định Dạng Dữ Liệu Chuẩn  

## 4.1 Markdown Table (Input / Output .md)  

| STT | Nội dung | Phương án trả lời | Đáp án | Tags |
|-----|---------|-------------|--------|------|
| 1 | Thủ đô của Việt Nam là? | A. Huế <br> B. Hà Nội <br> C. Đà Nẵng <br> D. TP.HCM | B | #DiaLy #De |

> *Ghi chú: Khi tạo/lưu file Markdown, App tự kết nối mảng các đáp án, chèn tiền tố `A. `, `B. ` và dải `<br>`. Khi đọc file, App bóc tách thông minh thành mảng raw text để đưa lên UI thao tác thân thiện hơn.*

## 4.2 CSV (Output .csv — feed vào Google Sheets / Apps Script)  

```csv
STT,Nội dung,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án,Tags
1,"Thủ đô của Việt Nam là?","Huế","Hà Nội","Đà Nẵng","TP.HCM","B","#DiaLy #De"
```

# 5. Tính năng save & Trải nghiệm Desktop
Người dùng có thể ấn nút "Lưu tài liệu" hoặc Ctrl + S để lưu tài liệu. App sẽ tự động lưu tài liệu vào file .md hoặc .csv đè lên file cũ một cách ngầm định (silently overwrite) giống như Microsoft Word, hoặc hiện popup tải file tạo file mới nếu chưa lưu lần nào.

**Cảnh báo mất dữ liệu (Unsaved changes):**
- Khi bảng thông tin có chỉnh sửa, tên file ở thanh Toolbar (hoặc thanh tiêu đề cửa sổ) xuất hiện dấu sao `*` để báo hiệu đây là trạng thái Chưa Lưu. 
- Khi người dùng vô tình nhấn phím đóng (X) ứng dụng mà chưa nhấn Ctrl+S, hệ thống sẽ bật Prompt Dialog hỏi *"Bạn có muốn lưu thay đổi trước khi thoát không?"*.

# 6. Yêu Cầu Kỹ Thuật & UX

## 6.1 Yêu Cầu Kỹ Thuật

- Sử dụng Electron.js để đóng gói ứng dụng.
- Sử dụng React.js để quản lý state và UI.
- Sử dụng TanStack Table để hiển thị bảng dữ liệu.
- Sử dụng markdown-it để parse file .md.
- Sử dụng chuẩn RFC 4180 để export CSV.

## 6.2 Yêu Cầu UX

- Giao diện thân thiện, dễ sử dụng.
- Hiển thị bảng dữ liệu rõ ràng, dễ đọc.
- Có thể chỉnh sửa trực tiếp trên bảng.
- Có thể lọc theo tag.
- Có thể xuất file .md hoặc .csv.
- Có thể sinh mã Google Apps Script để tạo Google Form.
- Có thể lưu tài liệu.


