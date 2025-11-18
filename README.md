# NT106_QuanLyKho_Nhom12 — Ứng dụng Quản lý Nhập Xuất Kho

Mô tả ngắn
Ứng dụng hiện tại gồm 2 thành phần chính:
- UI_Desktop/: giao diện Desktop (React + Vite + Tailwind CSS + Tauri)
- KhoHang_API/: backend (Python FastAPI + SQLite) kèm client AI (Gemini API)

Mục tiêu: quản lý hàng hóa, nghiệp vụ nhập/xuất kho, thống kê báo cáo và hỗ trợ người dùng qua chatbot AI.

Nhóm phát triển
- Hoàng Xuân Minh Trí - 24521829
- Trương Minh Thái - 24521599
- Nguyễn Võ Minh Trí - 24521840
- Nguyễn Văn Nam - 24521120

Tính năng chính
- Quản lý sản phẩm: thêm, sửa, xóa, tìm kiếm
- Quản lý kho: tạo phiếu nhập, xuất; cập nhật tồn kho tự động
- Hỗ trợ nhiều kho/chi nhánh (cấu trúc mở rộng)
- Dashboard thống kê: tồn kho, cảnh báo sắp hết, biểu đồ
- Phân quyền người dùng: Admin / Manager / Staff
- Chatbot AI: hỗ trợ tra cứu, hướng dẫn (Gemini API)

Công nghệ chính
- Frontend: React, TypeScript, Vite, Tailwind CSS, Tauri (Desktop)
- Backend: Python 3.11+, FastAPI, SQLite
- AI: Gemini API (client đặt trong KhoHang_API)
- Ngôn ngữ chính trong repo: TypeScript, Python

Cấu trúc thư mục
- KhoHang_API/ — mã nguồn backend (FastAPI), database, client AI, file cấu hình
- UI_Desktop/ — mã nguồn frontend React + cấu hình Tauri
- (legacy/) — (nếu còn) mã nguồn ứng dụng WinForms cũ (tóm tắt ở phần Legacy)

Hướng dẫn chạy nhanh (Quickstart)

A. Backend (FastAPI)
1. Mở terminal, chuyển thư mục:
   cd KhoHang_API
2. Tạo virtual environment:
   python -m venv .venv
3. Kích hoạt venv:
   - Windows (PowerShell): .venv\Scripts\Activate.ps1
   - Windows (cmd): .venv\Scripts\activate
   - macOS / Linux: source .venv/bin/activate
4. Cài dependencies:
   pip install -r requirements.txt
5. Thiết lập biến môi trường (xem .env.example), ví dụ:
   - GEMINI_API_KEY=your_api_key
   - DATABASE_URL=sqlite:///./data.db
6. Chạy server phát triển:
   uvicorn app.main:app --reload
7. API mặc định chạy tại http://127.0.0.1:8000 và tài liệu Swagger tại /docs

B. Frontend (React + Tauri)
1. Mở terminal mới, chuyển thư mục:
   cd UI_Desktop
2. Cài package:
   npm install
3. Chạy ứng dụng:
   - Chạy Desktop (Tauri): npm run tauri dev
   - Hoặc chạy web (Vite): npm run dev

Lưu ý khi chạy Tauri (Desktop)
- Cần Rust & Cargo để build và chạy Tauri Desktop.
- Trên Windows (PowerShell) cài Rust nếu chưa có:
  winget install --id Rustlang.Rustup -e
- Sau khi cài, khởi động lại terminal để Rust toolchain có hiệu lực.

File cấu hình môi trường
- Không commit file .env chứa khóa bí mật. Thay vào đó cung cấp .env.example (các biến mẫu):
  - GEMINI_API_KEY=
  - DATABASE_URL=sqlite:///./data.db
  - FASTAPI_HOST=127.0.0.1
  - FASTAPI_PORT=8000
  - OTHER_SECRETS=

Lưu ý chia sẻ & đóng gói
- Không đính kèm node_modules, .venv, __pycache__, build artifacts trong ZIP hoặc khi upload.
- Khi gửi project qua Google Drive / Email: xóa thư viện lớn và tạo file .env riêng để gửi nếu cần.
- Kiểm tra kỹ các khóa API trước khi chia sẻ mã nguồn công khai.

Legacy (thông tin từ README cũ)
Dự án ban đầu là một ứng dụng Desktop WinForms viết bằng C# kết nối Firebase (Firebase Authentication + Cloud Firestore) với các tính năng tương tự (quản lý sản phẩm, phiếu nhập/xuất, dashboard, phân quyền). Các thông tin, tài liệu và code cũ vẫn nằm trong repository (nếu có) để tham khảo.

Gợi ý phát triển & đóng góp
- Tách rõ cấu hình dev/production cho database
- Thêm file README riêng cho mỗi thư mục (KhoHang_API/README.md và UI_Desktop/README.md) nếu cần hướng dẫn chi tiết hơn
- Sử dụng GitHub Issues/PR để theo dõi thay đổi và review

License
- Chưa chỉ định. Thêm tệp LICENSE nếu muốn công khai bản quyền.