# Đồ án Lập trình Mạng Căn bản: Ứng dụng Desktop Quản lý Nhập Xuất Kho

![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)

Đây là dự án học phần Lập trình Mạng Căn bản, xây dựng một ứng dụng desktop (WinForms) hoàn chỉnh để quản lý nghiệp vụ nhập, xuất, và tồn kho. Hệ thống sử dụng C# WinForms cho giao diện và Google Firebase (Cloud Firestore, Authentication) làm backend và cơ sở dữ liệu thời gian thực.

``

---

## ✨ Tính năng nổi bật

Dự án được xây dựng với các lớp tính năng từ cơ bản đến nâng cao:

### 🔑 Lớp 1: Hệ thống Xác thực & Nghiệp vụ cơ bản
* **Xác thực:** Đăng nhập, Đăng ký tài khoản, Quên mật khẩu (gửi email khôi phục).
* **Quản lý Sản phẩm:** Thêm, Sửa, Xóa, Tìm kiếm sản phẩm.
* **Quản lý Kho (1 kho):** Tạo phiếu nhập kho, tạo phiếu xuất kho. Tự động cập nhật số lượng tồn kho sau mỗi giao dịch.

### 🏢 Lớp 2: Kiến trúc Mở rộng
* **Quản lý Nhiều kho hàng:** Nâng cấp hệ thống để có thể quản lý dữ liệu cho nhiều kho/chi nhánh khác nhau.
* **CRUD Kho:** Thêm, sửa, xóa thông tin các kho hàng.
* **Lọc dữ liệu:** Toàn bộ dữ liệu sản phẩm, phiếu nhập/xuất đều được lọc và hiển thị theo kho mà người dùng đã chọn.

### 📊 Lớp 3: Tính năng Nâng cao
* **Dashboard trực quan:** Hiển thị các chỉ số quan trọng (Tổng tồn kho, Sản phẩm sắp hết...) và biểu đồ (sử dụng LiveCharts2) để cung cấp cái nhìn tổng quan.
* **Phân quyền người dùng:**
    * **Admin:** Toàn bộ quyền quản trị, bao gồm cả việc quản lý tài khoản người dùng và quản lý kho.
    * **Manager/Staff:** Giới hạn quyền, chỉ có thể thực hiện các nghiệp vụ nhập/xuất kho trong phạm vi kho được giao.

---

## 🛠️ Công nghệ sử dụng

* **Ngôn ngữ lập trình:** C#
* **Nền tảng:** .NET Framework
* **Giao diện (Frontend):** Windows Forms (WinForms)
* **Backend & Cơ sở dữ liệu:** Google Firebase
    * **Firebase Authentication:** Xử lý đăng nhập, đăng ký, khôi phục mật khẩu.
    * **Cloud Firestore:** Lưu trữ toàn bộ dữ liệu (người dùng, sản phẩm, kho, phiếu nhập/xuất) dưới dạng NoSQL.
* **Thư viện (Libraries):**
    * `Google.Cloud.Firestore`: Thư viện chính thức để kết nối C# với Cloud Firestore.
    * `LiveChartsCore.SkiaSharpView.WinForms`: Thư viện vẽ biểu đồ cho Dashboard.
    * *(Nếu dùng) Bunifu UI Framework / Siticone UI:* Thư viện hỗ trợ làm đẹp giao diện.

---

## 🚀 Cài đặt & Chạy dự án

Để chạy dự án này trên máy của bạn, hãy làm theo các bước sau:

**1. Clone Repository**
```bash
git clone [link-github-cua-ban]
cd [ten-thu-muc-du-an]