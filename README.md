<div align="center">

![Repo Badge](https://img.shields.io/badge/NT106_Quan_Ly_Kho_NHOM12-16a34a?style=for-the-badge&logo=github&logoColor=white)

# 📦 Ứng dụng Quản lý Nhập Xuất Kho
### NT106_QuanLyKho_Nhom12

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
![Python](https://img.shields.io/badge/Backend-FastAPI_%7C_Python-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_%7C_Tauri-61DAFB?style=flat-square&logo=react&logoColor=black)
![Status](https://img.shields.io/badge/Status-Developing-orange?style=flat-square)

<p><b>Mục tiêu:</b> Quản lý hàng hóa, nghiệp vụ nhập/xuất kho, báo cáo và trợ lý AI tích hợp.</p>

<img src="UI_Desktop/assets/screenshot.png" alt="App Screenshot" width="100%" style="border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);">

</div>

---

## 🔸 Tóm tắt nhanh
- Hệ thống 2 thành phần: **Backend FastAPI** + **Frontend React/Tauri** (desktop first, vẫn chạy web dev server).
- Auth JWT + OTP email, passkey bảo vệ thao tác phá hủy; phân quyền RBAC (Admin/Manager/Staff).
- Quản lý sản phẩm, nhà cung cấp, kho; phiếu nhập/xuất, hủy phiếu, cập nhật tồn kho.
- Xuất báo cáo Excel/PDF; tìm kiếm toàn cục; chatbot Gemini; chat realtime qua WebSocket, upload tệp.

## 🟢 Nhóm phát triển
| STT | Họ và tên | MSSV | Vai trò |
|:---:|:---:|:---:|:---|
| 1 | **Hoàng Xuân Minh Trí** | 24521829 | Fullstack / Leader |
| 2 | **Trương Minh Thái** | 24521599 | Frontend Dev |
| 3 | **Nguyễn Võ Minh Trí** | 24521840 | Backend Dev |
| 4 | **Nguyễn Văn Nam** | 24521120 | Fullstack |

## ✨ Tính năng chính
- 📦 Quản lý sản phẩm, nhà cung cấp, nhiều kho; cảnh báo tồn và tìm kiếm nâng cao.
- 📑 Nghiệp vụ nhập/xuất kho, hủy/cập nhật phiếu; log tồn kho chuẩn hóa.
- 🧾 Xuất báo cáo Excel/PDF (phiếu, chứng từ, danh sách hàng hóa).
- 🔒 Đăng nhập JWT + OTP email, đổi mật khẩu, passkey cho thao tác nguy hiểm.
- 🤖 Chatbot Gemini và chat realtime (WebSocket) hỗ trợ hướng dẫn, chia sẻ file.
- 🔍 Global search, gợi ý nhanh; tĩnh phục vụ uploads qua `/uploads/*`.

## 🏗️ Kiến trúc & thư mục
```tree
NT106_QuanLyKho/
├─ KhoHang_API/          # Backend FastAPI, SQLite/Postgres, AI client
│  ├─ app/               # Mã nguồn chính (auth, inventory, export, chat...)
│  ├─ data/              # Thư mục dữ liệu, uploads (tự tạo nếu chưa có)
│  └─ .env.example       # Cấu hình backend mẫu
├─ UI_Desktop/           # Frontend React + Tauri (desktop), Vite + Tailwind
│  ├─ src/               # UI, features, hooks, services
│  ├─ src-tauri/         # Cấu hình Tauri/Rust
│  └─ .env.example       # Cấu hình frontend mẫu
├─ start_app.bat         # Chạy backend + frontend cùng lúc (Windows)
├─ start_backend.bat     # Chạy FastAPI dev server
├─ start_frontend.bat    # Chạy Tauri dev
├─ start_client1.bat     # Chạy web dev tại port 5173
├─ start_client2.bat     # Chạy web dev tại port 5174
└─ README.md
```

## 🛠️ Yêu cầu
- Python 3.10+ (khuyến nghị 3.11), pip, venv
- Node.js 18+ và npm
- Rust + Cargo (bắt buộc nếu chạy Tauri desktop)
- SMTP (Gmail) cho OTP email; khóa Gemini API cho chatbot (tùy chọn)
- SQLite mặc định; có thể chuyển Postgres qua `DATABASE_URL`

## 🔧 Cấu hình môi trường
**Backend**: sao chép [KhoHang_API/.env.example](KhoHang_API/.env.example) thành `.env` và chỉnh:
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXP_DAYS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`
- `DATABASE_URL` (bỏ trống để dùng SQLite `data.db` mặc định)
- `GEMINI_API_KEY` (tùy chọn, bật chatbot)

**Frontend**: sao chép [UI_Desktop/.env.example](UI_Desktop/.env.example) thành `.env` và chỉnh:
- `VITE_API_BASE_URL=http://localhost:8000` (hoặc URL deployment)

## 🚀 Chạy nhanh (Windows)
1. Chạy tất cả: mở `start_app.bat` (tự cài deps, khởi động backend rồi frontend Tauri).
2. Hoặc tách rời:
   - `start_backend.bat`: khởi động FastAPI tại http://localhost:8000 (Docs `/docs`).
   - `start_frontend.bat`: khởi động Tauri desktop.
   - `start_client1.bat` / `start_client2.bat`: chạy web dev server (5173/5174, có `--host`).

## 🧩 Chạy thủ công (không dùng .bat)
**Backend (FastAPI)**
```bash
cd KhoHang_API
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API: http://localhost:8000 · Docs: http://localhost:8000/docs

**Frontend (React/Tauri)**
```bash
cd UI_Desktop
npm install
# Desktop
npm run tauri dev
# Hoặc web dev
npm run dev -- --port 5173 --host
```

## 📌 Lưu ý dữ liệu
- Uploads phục vụ tĩnh dưới `/uploads/*`, lưu tại `KhoHang_API/data/uploads` (tự tạo khi chạy).
- Các thư mục `rt_files`, `chat_files`, `chatbot`, `logos`, `avatars` được tạo tự động ở backend startup.
- Nếu dùng Postgres, đảm bảo `DATABASE_URL` đúng định dạng SQLAlchemy.

## 🤝 Contributing
- Fork dự án, tạo nhánh `feat/<ten-tinh-nang>` và gửi PR.
- Giữ nguyên chuẩn định dạng code, bổ sung test nếu có thay đổi nghiệp vụ.

<div align="center"><i>Dự án môn học NT106 - UIT</i><br><b>License MIT</b></div>
