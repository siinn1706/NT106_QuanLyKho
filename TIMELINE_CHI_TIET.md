# TIMELINE CHI TIẾT - ỨNG DỤNG QUẢN LÝ NHẬP XUẤT KHO
## NHÓM 12 - NT106.Q13

---

## 📌 THÔNG TIN TỔNG QUAN

| Thành viên | Vai trò chính |
|------------|---------------|
| **Văn Nam** | Frontend Developer (UI/UX) |
| **Minh Thái** | Backend Developer (API/Logic) |
| **Minh Trí** | Backend Developer (API/Logic) + DevOps |
| **Trí Hoàng** | Security + Testing |

---

## 🎯 GIAI ĐOẠN 1-3: ĐÃ HOÀN THÀNH (16/9 - 31/10)
*(Giữ nguyên timeline cũ - đã hoàn thành)*

---

## 🚀 GIAI ĐOẠN 4: THỰC HIỆN ĐỒ ÁN (Chi tiết)

### TUẦN 1-2: SETUP & XÁC THỰC (1/11 - 18/11) ✅ ĐÃ HOÀN THÀNH

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | Người thực hiện | Trạng thái |
|-----|-----------|------------------------|-------------------------|-----------------|------------|
| 1.1 | **Đăng nhập** | | | | ✅ Hoàn thành |
| | - Input Email | `<input type="email">` với validation | `POST /auth/login` | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Input Password | `<input type="password">` + nút Show/Hide (FaEye) | Request: `{email, password}` | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Nút "Đăng nhập" | Button submit form | Response: `{user, token}` | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Checkbox "Ghi nhớ" | `<input type="checkbox">` | LocalStorage token | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Link "Quên mật khẩu?" | Navigate to `/forgot-password` | - | Nam (UI) | ✅ |
| | - Link "Đăng ký" | Navigate to `/register` | - | Nam (UI) | ✅ |
| 1.2 | **Đăng ký** | | | | ✅ Hoàn thành |
| | - Input Họ tên | `<input type="text">` min 2 chars | `POST /auth/register` | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Input Email | `<input type="email">` với validation | Request: `{name, email, password}` | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Input Mật khẩu | Password strength indicator (weak/medium/strong) | Response: Gửi OTP qua email | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Input Xác nhận MK | So sánh với password | - | Nam (UI) | ✅ |
| | - Nút "Đăng ký" | Button submit | - | Nam (UI) / Trí Hoàng (BE) | ✅ |
| | - Modal OTP | 6 input ô số + countdown 60s | `POST /auth/verify-otp` | Nam (UI) / Minh Trí (BE) | ✅ |
| | - Nút "Gửi lại OTP" | Resend button | `POST /auth/resend-otp` | Nam (UI) / Minh Trí (BE) | ✅ |
| 1.3 | **Quên mật khẩu** | | | | ✅ Hoàn thành |
| | - Input Email | Email với icon FaEnvelope | `POST /auth/forgot-password` | Nam (UI) / Minh Trí (BE) | ✅ |
| | - Nút "Gửi email" | Submit button | Request: `{email}` | Nam (UI) / Minh Trí (BE) | ✅ |
| | - Thông báo thành công | Success message với icon | Response: `{message}` | Nam (UI) | ✅ |
| | - Nút "Quay lại đăng nhập" | Navigate to `/login` | - | Nam (UI) | ✅ |
| 1.4 | **Đăng xuất** | | | | ✅ Hoàn thành |
| | - Nút "Đăng xuất" (Sidebar) | Dropdown menu trong User profile | `POST /auth/logout` | Nam (UI) / Minh Trí (BE) | ✅ |
| | - Confirm dialog | `confirm()` trước khi logout | Clear token + redirect | Nam (UI) / Minh Trí (BE) | ✅ |

---

### TUẦN 3-4: CHỨC NĂNG CHÍNH (19/11 - 6/12)

#### 📦 MODULE 1: QUẢN LÝ HÀNG HÓA (`Items_List_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **1.1** | **Danh sách hàng hóa** | | | | | |
| | - Bảng hiển thị | Table với columns: Tên, SKU, Số lượng, Đơn vị, Giá, Danh mục, Thao tác | `GET /items` | Nam | Thái | 🔄 Đang làm |
| | - Ô tìm kiếm | Input search với placeholder "Tìm kiếm hàng hoá..." | `GET /items?search={keyword}` | Nam | Thái | ⏳ Chưa làm |
| | - Loading state | Spinner + text "Đang tải..." | - | Nam | - | ✅ Hoàn thành |
| | - Empty state | Text "Không có hàng hoá nào" | - | Nam | - | ✅ Hoàn thành |
| **1.2** | **Thêm hàng hóa** | | | | | |
| | - Nút "Thêm hàng hoá" | Button màu success (xanh lá) | - | Nam | - | 🔄 Đang làm |
| | - Modal thêm mới | Form với các field: | `POST /items` | Nam | Thái | ⏳ Chưa làm |
| | + Tên hàng | `<input>` required | Request body: | Nam | Thái | ⏳ |
| | + Mã SKU | `<input>` required | `{name, sku, quantity, unit, price, category, supplier_id}` | Nam | Thái | ⏳ |
| | + Số lượng | `<input type="number">` min=0 | | Nam | Thái | ⏳ |
| | + Đơn vị | `<select>` (Cái/Hộp/Thùng/Kg/Lít/Bộ) | | Nam | Thái | ⏳ |
| | + Giá | `<input type="number">` min=0 | | Nam | Thái | ⏳ |
| | + Danh mục | `<select>` hoặc `<input>` | | Nam | Thái | ⏳ |
| | + Nhà cung cấp | `<select>` load từ API | `GET /suppliers` để load dropdown | Nam | Thái | ⏳ |
| | - Nút "Lưu" | Submit button | Response: `{id, name, ...}` | Nam | Thái | ⏳ |
| | - Nút "Hủy" | Close modal | - | Nam | - | ⏳ |
| **1.3** | **Sửa hàng hóa** | | | | | |
| | - Nút "Sửa" (mỗi row) | Button màu primary trong cột Thao tác | - | Nam | - | 🔄 Đang làm |
| | - Modal sửa | Pre-fill data từ item hiện tại | `PUT /items/{id}` | Nam | Thái | ⏳ Chưa làm |
| | - Các field như modal Thêm | Cho phép sửa tất cả trừ ID | Request: `{field: newValue}` | Nam | Thái | ⏳ |
| | - Nút "Cập nhật" | Submit button | Response: Updated item | Nam | Thái | ⏳ |
| **1.4** | **Xóa hàng hóa** | | | | | |
| | - Nút "Xoá" (mỗi row) | Button màu danger (đỏ) | - | Nam | - | 🔄 Đang làm |
| | - Confirm dialog | `confirm("Bạn có chắc muốn xóa?")` | `DELETE /items/{id}` | Nam | Thái | ⏳ Chưa làm |
| | - Toast thông báo | Success/Error message | Response: 204 No Content | Nam | Thái | ⏳ |

---

#### 📊 MODULE 2: THEO DÕI HÀNG HÓA (`Items_Tracking_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **2.1** | **Thẻ thống kê** | | | | | |
| | - Card "Tổng số mặt hàng" | Số lớn + icon 📦 + nút "Xem chi tiết" | `GET /items` (count) | Nam | Thái | 🔄 Đang làm |
| | - Card "Cần nhập lại" | Số + icon ⚠️ + badge warning | `GET /items/low-stock-count` | Nam | Thái | ⏳ Chưa làm |
| | - Card "Sắp hết hạn" | Số + icon ⏳ + badge info | `GET /items/expiring-soon` | Nam | Thái | ⏳ Chưa làm |
| **2.2** | **Biểu đồ Top 5** | | | | | |
| | - Chart "Top 5 hàng xuất nhiều nhất" | Horizontal bar chart | `GET /items/top-items` | Nam | Trí | ⏳ Chưa làm |
| | | Progress bars với tên + số lượng | Response: `[{name, value}]` | Nam | Trí | ⏳ |
| **2.3** | **Biểu đồ xu hướng** | | | | | |
| | - Chart "Xu hướng tồn kho theo tháng" | Vertical bar chart 12 tháng | `GET /items/monthly-trend` | Nam | Trí | ⏳ Chưa làm |
| | | Bars với label tháng (T1-T12) | Response: `[{month, value}]` | Nam | Trí | ⏳ |
| **2.4** | **Phân bố danh mục** | | | | | |
| | - Chart "Phân bố theo danh mục" | Pie/Donut chart | `GET /items/category-distribution` | Nam | Trí | ⏳ Chưa làm |
| | | Legend với màu + % | Response: `[{name, value, color}]` | Nam | Trí | ⏳ |

---

#### ⚠️ MODULE 3: CẢNH BÁO TỒN KHO (`Items_Alerts_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **3.1** | **Thẻ tổng quan cảnh báo** | | | | | |
| | - Card "Tổng cảnh báo" | Badge số + icon FaBell | `GET /items/alerts` | Nam | Thái | ⏳ Chưa làm |
| | - Card "Cực kỳ thấp" | Badge đỏ + icon FaArrowDown | Response: `[{id, name, sku, currentStock, minStock, maxStock, status}]` | Nam | Thái | ⏳ |
| | - Card "Thấp" | Badge vàng | `status: 'critical' \| 'warning' \| 'low' \| 'overstock'` | Nam | Thái | ⏳ |
| | - Card "Cần nhập thêm" | Badge xanh dương | | Nam | Thái | ⏳ |
| | - Card "Tồn kho quá nhiều" | Badge tím | | Nam | Thái | ⏳ |
| **3.2** | **Tab lọc** | | | | | |
| | - Nút "Tất cả" | Filter button active state | Client-side filter | Nam | - | 🔄 Đang làm |
| | - Nút "Cực kỳ thấp" | Filter status='critical' | - | Nam | - | 🔄 |
| | - Nút "Thấp" | Filter status='warning' | - | Nam | - | 🔄 |
| | - Nút "Cần nhập thêm" | Filter status='low' | - | Nam | - | 🔄 |
| | - Nút "Tồn kho quá nhiều" | Filter status='overstock' | - | Nam | - | 🔄 |
| **3.3** | **Danh sách cảnh báo** | | | | | |
| | - Bảng cảnh báo | Columns: Tên, SKU, Tồn kho, Ngưỡng tối thiểu, Trạng thái, Thao tác | `GET /items/alerts` | Nam | Thái | ⏳ Chưa làm |
| | - Nút "Nhập kho" (mỗi row) | Quick action -> navigate to Stock In với pre-fill | - | Nam | - | ⏳ |
| | - Progress bar tồn kho | Hiển thị % so với min/max | - | Nam | - | 🔄 |

---

#### 📥 MODULE 4: NHẬP KHO (`Stock_In_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **4.1** | **Form nhập kho** | | | | | |
| | - Input "Tên hàng hoá" | `<input>` required + icon FaBox | - | Nam | - | 🔄 Đang làm |
| | - Input "Mã hàng" | `<input>` required (SKU/barcode) | `GET /items?sku={code}` để autocomplete | Nam | Thái | ⏳ Chưa làm |
| | - Input "Số lượng" | `<input type="number">` min=1 | - | Nam | - | 🔄 |
| | - Select "Đơn vị" | `<select>` (Cái/Hộp/Thùng/Kg/Lít/Bộ) | - | Nam | - | 🔄 |
| | - Input "Giá nhập" | `<input type="number">` min=0 + suffix "₫" | - | Nam | - | 🔄 |
| | - Input "Nhà cung cấp" | `<input>` + autocomplete từ API | `GET /suppliers?search={name}` | Nam | Thái | ⏳ Chưa làm |
| | - Input "Ngày nhập" | `<input type="date">` default=today | - | Nam | - | 🔄 |
| | - Textarea "Ghi chú" | `<textarea>` optional | - | Nam | - | 🔄 |
| **4.2** | **Hành động** | | | | | |
| | - Nút "Hủy" | Navigate back | - | Nam | - | 🔄 Đang làm |
| | - Nút "Xác nhận nhập kho" | Submit form | `POST /stock/transactions` | Nam | Thái | ⏳ Chưa làm |
| | | Màu success (xanh lá) | Request: `{type: 'in', item_id, quantity, note, supplier_id, price}` | | | |
| | | | Response: `{id, type, item_id, quantity, timestamp}` | | | |
| **4.3** | **Lịch sử nhập kho** | | | | | |
| | - Danh sách gần đây | List items với: Tên, Số lượng (+), NCC, Thời gian | `GET /stock/transactions?type=in&limit=5` | Nam | Thái | ⏳ Chưa làm |
| | | Badge màu success | Response: `[{item_name, quantity, supplier, timestamp}]` | | | |

---

#### 📤 MODULE 5: XUẤT KHO (`Stock_Out_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **5.1** | **Tìm kiếm hàng** | | | | | |
| | - Input "Mã hàng" | `<input>` + nút Search (FaSearch) | `GET /items/{sku}` hoặc `GET /items?sku={code}` | Nam | Thái | ⏳ Chưa làm |
| | - Hiển thị tồn kho | Alert box: "Tồn kho hiện tại: X sản phẩm" | Response: `{quantity}` | Nam | Thái | ⏳ |
| **5.2** | **Form xuất kho** | | | | | |
| | - Input "Tên hàng hoá" | `<input>` auto-fill sau khi search | - | Nam | - | 🔄 Đang làm |
| | - Input "Số lượng xuất" | `<input type="number">` max=availableStock | Validation: không được vượt tồn kho | Nam | Thái | ⏳ Chưa làm |
| | | Error message nếu vượt quá | | | | |
| | - Select "Đơn vị" | `<select>` match với item | - | Nam | - | 🔄 |
| | - Input "Người nhận" | `<input>` required | - | Nam | - | 🔄 |
| | - Input "Ngày xuất" | `<input type="date">` default=today | - | Nam | - | 🔄 |
| | - Select "Mục đích" | `<select>` (Bán hàng/Chuyển kho/Sử dụng nội bộ/Bảo hành/Khác) | - | Nam | - | 🔄 |
| | - Textarea "Ghi chú" | `<textarea>` optional | - | Nam | - | 🔄 |
| **5.3** | **Hành động** | | | | | |
| | - Nút "Hủy" | Navigate back | - | Nam | - | 🔄 Đang làm |
| | - Nút "Xác nhận xuất kho" | Submit form (màu warning) | `POST /stock/transactions` | Nam | Thái | ⏳ Chưa làm |
| | | | Request: `{type: 'out', item_id, quantity, note, recipient, purpose}` | | | |
| **5.4** | **Lịch sử xuất kho** | | | | | |
| | - Danh sách gần đây | List items với: Tên, Số lượng (-), Người nhận, Thời gian | `GET /stock/transactions?type=out&limit=5` | Nam | Thái | ⏳ Chưa làm |
| | | Badge màu warning | | | | |

---

#### 🏢 MODULE 6: NHÀ CUNG CẤP (`Suppliers_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **6.1** | **Danh sách NCC** | | | | | |
| | - Bảng hiển thị | Columns: Tên NCC, Liên hệ, Địa chỉ, Thao tác | `GET /suppliers` | Nam | Thái | 🔄 Đang làm |
| | - Loading/Empty state | Tương tự Items | Response: `[{id, name, contact, address}]` | Nam | - | ✅ |
| **6.2** | **Thêm NCC** | | | | | |
| | - Nút "Thêm NCC" | Button màu success | - | Nam | - | 🔄 Đang làm |
| | - Modal thêm mới | Form với: | `POST /suppliers` | Nam | Thái | ⏳ Chưa làm |
| | + Tên NCC | `<input>` required | Request: `{name, contact, address}` | | | |
| | + Liên hệ (SĐT) | `<input>` với validation số | | | | |
| | + Địa chỉ | `<input>` hoặc `<textarea>` | Response: `{id, name, contact, address}` | | | |
| | - Nút "Lưu" / "Hủy" | Submit/Cancel buttons | | | | |
| **6.3** | **Sửa NCC** | | | | | |
| | - Nút "Sửa" (mỗi row) | Button primary | `PUT /suppliers/{id}` | Nam | Thái | ⏳ Chưa làm |
| | - Modal sửa | Pre-fill data | Request: `{field: newValue}` | | | |
| **6.4** | **Xóa NCC** | | | | | |
| | - Nút "Xoá" (mỗi row) | Button danger + confirm | `DELETE /suppliers/{id}` | Nam | Thái | ⏳ Chưa làm |

---

#### 📈 MODULE 7: BÁO CÁO (`Reports_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **7.1** | **Nút chọn loại báo cáo** | | | | | |
| | - Nút "Tồn kho" | Card button + icon FaChartPie | - | Nam | - | 🔄 Đang làm |
| | - Nút "Xu hướng" | Card button + icon FaChartLine | - | Nam | - | 🔄 |
| | - Nút "Cảnh báo" | Card button + icon FaChartBar | - | Nam | - | 🔄 |
| | - Nút "Hư hỏng" | Card button + icon FaChartBar | - | Nam | - | 🔄 |
| **7.2** | **Nút xuất báo cáo** | | | | | |
| | - Nút "Xuất báo cáo" | Button màu info + icon FaFileExport | `GET /reports/export?type={type}&format=pdf` | Nam | Trí | ⏳ Chưa làm |
| | | Download file PDF/Excel | Response: File binary | | | |
| **7.3** | **Báo cáo tồn kho** | | | | | |
| | - Biểu đồ phân bố | Horizontal bar chart theo danh mục | `GET /reports/inventory-by-category` | Nam | Trí | ⏳ Chưa làm |
| | | Mỗi bar có màu + % | Response: `[{category, value, color}]` | | | |
| | - Card "Tổng hàng hoá" | Số lớn + label | Từ data trên | Nam | - | ⏳ |
| | - Card "Danh mục" | Số danh mục | Từ data trên | Nam | - | ⏳ |
| | - Card "Danh mục lớn nhất" | Max value | Từ data trên | Nam | - | ⏳ |
| **7.4** | **Báo cáo xu hướng** | | | | | |
| | - Legend: Nhập kho / Xuất kho | 2 màu (primary/success) | - | Nam | - | ⏳ Chưa làm |
| | - Biểu đồ cột kép | 6 tháng, mỗi tháng 2 cột (nhập/xuất) | `GET /reports/monthly-trend` | Nam | Trí | ⏳ Chưa làm |
| | | Hover hiển thị số | Response: `[{month, import, export}]` | | | |
| **7.5** | **Báo cáo hàng sắp hết** | | | | | |
| | - Danh sách cảnh báo | Table với: Tên, Tồn kho, Ngưỡng, Status badge | `GET /reports/low-stock-items` | Nam | Trí | ⏳ Chưa làm |
| | | Badge danger/warning | Response: `[{name, stock, min, status}]` | | | |

---

#### 🏠 MODULE 8: DASHBOARD (`Dashboard_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **8.1** | **Cards thống kê** | | | | | |
| | - Card "Hiệu suất hệ thống" | Click -> navigate to `/reports` | `GET /dashboard/stats` | Nam | Trí | ⏳ Chưa làm |
| | | Số % + icon 📈 | Response: `{system_uptime, low_stock_count, warehouse_usage, total_items, recent_transactions}` | | | |
| | - Card "Cảnh báo tồn kho" | Click -> navigate to `/items/alerts` | | Nam | Trí | ⏳ |
| | | Số + icon ⚠️ | | | | |
| | - Card "Tỷ lệ sử dụng kho" | Click -> navigate to `/items/tracking` | | Nam | Trí | ⏳ |
| | | % + progress bar + icon 📦 | | | | |
| **8.2** | **Bộ lọc** | | | | | |
| | - Dropdown "Danh mục" | Select: Tất cả/Nguyên liệu/Thành phẩm/Bán thành phẩm | Query param: `?category={value}` | Nam | Trí | ⏳ Chưa làm |
| | - Dropdown "Thời gian" | Select: 7/15/30 ngày/Tháng trước | Query param: `?range={value}` | Nam | Trí | ⏳ |
| **8.3** | **Bảng giao dịch gần đây** | | | | | |
| | - Bảng | Columns: STT, Tiêu đề, Ghi chú, Thời gian, Trạng thái | Từ `recent_transactions` trong stats | Nam | Trí | ⏳ Chưa làm |
| | - Badge "Nhập kho" | Màu success | `type: 'in'` | Nam | - | ⏳ |
| | - Badge "Xuất kho" | Màu info | `type: 'out'` | Nam | - | ⏳ |

---

#### 💬 MODULE 9: CHAT (`ChatWidget.tsx`, `ChatRoom.tsx`, `ChatSidebar.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **9.1** | **Chat Widget** | | | | | |
| | - Nút mở chat | FAB button góc phải dưới (FaCommentDots) | - | Nam | - | ✅ Hoàn thành |
| | - Nút thu nhỏ | FaMinus -> minimize to avatar | - | Nam | - | ✅ |
| | - Nút đóng | FaTimes -> close widget | - | Nam | - | ✅ |
| | - Avatar minimized | Click để restore chat | - | Nam | - | ✅ |
| **9.2** | **Chat Sidebar** | | | | | |
| | - List conversations | Avatar + Tên + Last message preview | `GET /chat/conversations` | Nam | Trí | ⏳ Chưa làm |
| | | | Response: `[{id, name, avatar, lastMessage}]` | | | |
| | - Tab "Chatbot AI" | Conversation với bot | `conversationId: 'bot'` | Nam | - | 🔄 Đang làm |
| | - Tab "Users" | Danh sách user khác | Load từ API | Nam | Trí | ⏳ Chưa làm |
| | - Nút toggle sidebar | Collapse/Expand sidebar | - | Nam | - | ✅ |
| **9.3** | **Chat Room** | | | | | |
| | - Input tin nhắn | `<input>` + nút Gửi | - | Nam | - | 🔄 Đang làm |
| | - Nút gửi | Submit message (Enter hoặc click) | `POST /chat/send` | Nam | Trí | ⏳ Chưa làm |
| | | | Request: `{user_id, message}` | | | |
| | | | Response: `{messages: [{role, content, timestamp}]}` | | | |
| | - Lịch sử tin nhắn | List messages với bubble UI | `GET /chat/history/{userId}` | Nam | Trí | ⏳ Chưa làm |
| | | | Response: `{user_id, messages}` | | | |
| | - Typing indicator | Animation khi bot đang trả lời | - | Nam | - | 🔄 Đang làm |
| | - Nút xóa lịch sử | Clear chat history | `DELETE /chat/history/{userId}` | Nam | Trí | ⏳ Chưa làm |
| **9.4** | **AI Chat (Gemini)** | | | | | |
| | - Gửi prompt | Message gửi đến AI | `POST /ai/chat` | Nam | Trí | ⏳ Chưa làm |
| | | | Request: `{prompt, system_instruction}` | | | |
| | | | Response: `{reply, model}` | | | |

---

#### ⚙️ MODULE 10: SETTINGS (`SettingsModal.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **10.1** | **Tab Chung** | | | | | |
| | - Toggle Dark Mode | Switch button (FaMoon/FaSun) | LocalStorage | Nam | - | ✅ Hoàn thành |
| | - Select Ngôn ngữ | Dropdown (Tiếng Việt/English) | LocalStorage (future: `PUT /users/settings`) | Nam | Trí | ⏳ Chưa làm |
| | - Nút "Xóa cache" | Button + confirm dialog | LocalStorage.clear() | Nam | - | ✅ |
| | - Nút "Xuất dữ liệu" | Button | `GET /data/export` | Nam | Trí | ⏳ Chưa làm |
| **10.2** | **Tab Tài khoản** | | | | | |
| | - Hiển thị thông tin user | Name, Email, Role | Từ auth store | Nam | - | ✅ Hoàn thành |
| | - Nút "Đổi mật khẩu" | Navigate to `/change-password` | - | Nam | - | ✅ |
| | - Nút "Đăng xuất" | Logout + redirect | `POST /auth/logout` | Nam | Trí | ✅ |
| **10.3** | **Tab Thông báo** | | | | | |
| | - Toggle "Hàng sắp hết" | Switch notification setting | `PUT /users/notification-settings` | Nam | Trí | ⏳ Chưa làm |
| | - Toggle "Đơn hàng mới" | Switch notification setting | Request: `{lowStock: bool, newOrders: bool, systemUpdates: bool}` | Nam | Trí | ⏳ |
| | - Toggle "Cập nhật hệ thống" | Switch notification setting | | Nam | Trí | ⏳ |
| **10.4** | **Tab Thông tin** | | | | | |
| | - Phiên bản app | Text: "1.0.0" | - | Nam | - | ✅ Hoàn thành |
| | - Ngày build | Text: "13/11/2025" | - | Nam | - | ✅ |
| | - Nút "Kiểm tra cập nhật" | Button | `GET /app/check-update` | Nam | Trí | ⏳ Chưa làm |

---

#### 🔐 MODULE 11: ĐỔI MẬT KHẨU (`Change_Password_Page.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **11.1** | **Form đổi mật khẩu** | | | | | |
| | - Input Email | Pre-fill từ user store | - | Nam | - | ✅ Hoàn thành |
| | - Input "Mật khẩu cũ" | Password + show/hide toggle | - | Nam | - | ✅ |
| | - Input "Mật khẩu mới" | Password + strength indicator | - | Nam | - | ✅ |
| | - Input "Xác nhận MK mới" | Password + match validation | - | Nam | - | ✅ |
| | - Nút "Đổi mật khẩu" | Submit button | `POST /auth/change-password` | Nam | Trí | ✅ Hoàn thành |
| | | | Request: `{email, old_password, new_password}` | | | |
| | - Nút "Quay lại" | Navigate back | - | Nam | - | ✅ |
| | - Success message | Auto logout sau 2s | Logout + redirect to login | Nam | Trí | ✅ |

---

#### 🧭 MODULE 12: LAYOUT & NAVIGATION (`Layout.tsx`)

| STT | Tính năng | UI Elements (Frontend) | API Endpoints (Backend) | FE | BE | Trạng thái |
|-----|-----------|------------------------|-------------------------|----|----|------------|
| **12.1** | **Sidebar** | | | | | |
| | - Logo + Brand | Image + "Quản lý Kho" | - | Nam | - | ✅ Hoàn thành |
| | - Nút collapse/expand | FaBars / FaChevronLeft | LocalStorage | Nam | - | ✅ |
| | - Menu "Trang chủ" | Navigate to `/dashboard` | - | Nam | - | ✅ |
| | - Menu "Hàng hoá" (expandable) | Sub-items: Danh sách, Theo dõi, Cảnh báo | - | Nam | - | ✅ |
| | - Menu "Nhập/Xuất kho" (expandable) | Sub-items: Nhập kho, Xuất kho | - | Nam | - | ✅ |
| | - Menu "Nhà cung cấp" | Navigate to `/suppliers` | - | Nam | - | ✅ |
| | - Menu "Báo cáo" | Navigate to `/reports` | - | Nam | - | ✅ |
| | - Badge số cảnh báo | Hiển thị số trên menu Nhập/Xuất | Từ dashboard stats | Nam | - | 🔄 Đang làm |
| **12.2** | **User Profile (sidebar bottom)** | | | | | |
| | - Avatar | Chữ cái đầu tên user | - | Nam | - | ✅ Hoàn thành |
| | - Tên + Email | Từ auth store | - | Nam | - | ✅ |
| | - Dropdown menu | Expand/collapse | - | Nam | - | ✅ |
| | - Nút "Cài đặt" | Open Settings Modal | - | Nam | - | ✅ |
| | - Nút "Đăng xuất" | Logout flow | `POST /auth/logout` | Nam | Trí | ✅ |
| **12.3** | **Header** | | | | | |
| | - Breadcrumb | "Module > Sub-module" | - | Nam | - | ✅ Hoàn thành |
| | - Ô tìm kiếm global | Search input | `GET /search?q={query}` | Nam | Trí | ⏳ Chưa làm |
| | | Placeholder: "Tìm kiếm hàng hoá, báo cáo..." | Response: `{items: [], reports: []}` | | | |
| | - Nút toggle Dark Mode | FaSun / FaMoon | LocalStorage | Nam | - | ✅ |

---

## 📋 TỔNG HỢP API ENDPOINTS CẦN IMPLEMENT

### Authentication APIs (Trí Hoàng + Minh Trí)
```
POST /auth/login              - Đăng nhập
POST /auth/register           - Đăng ký (gửi OTP)
POST /auth/verify-otp         - Xác thực OTP
POST /auth/resend-otp         - Gửi lại OTP
POST /auth/forgot-password    - Quên mật khẩu
POST /auth/change-password    - Đổi mật khẩu
POST /auth/logout             - Đăng xuất
```

### Items APIs (Minh Thái)
```
GET    /items                 - Danh sách hàng hóa
GET    /items?search={q}      - Tìm kiếm hàng hóa
GET    /items/{id}            - Chi tiết 1 hàng
POST   /items                 - Thêm hàng mới
PUT    /items/{id}            - Cập nhật hàng
DELETE /items/{id}            - Xóa hàng

GET    /items/alerts          - Danh sách cảnh báo tồn kho
GET    /items/low-stock-count - Đếm hàng sắp hết
GET    /items/expiring-soon   - Hàng sắp hết hạn
GET    /items/top-items       - Top 5 hàng xuất nhiều
GET    /items/monthly-trend   - Xu hướng theo tháng
GET    /items/category-distribution - Phân bố danh mục
```

### Stock Transaction APIs (Minh Thái)
```
GET    /stock/transactions              - Lịch sử giao dịch
GET    /stock/transactions?type=in      - Lịch sử nhập
GET    /stock/transactions?type=out     - Lịch sử xuất
POST   /stock/transactions              - Tạo giao dịch nhập/xuất
```

### Suppliers APIs (Minh Thái)
```
GET    /suppliers             - Danh sách NCC
GET    /suppliers?search={q}  - Tìm kiếm NCC
POST   /suppliers             - Thêm NCC
PUT    /suppliers/{id}        - Cập nhật NCC
DELETE /suppliers/{id}        - Xóa NCC
```

### Dashboard & Reports APIs (Minh Trí)
```
GET    /dashboard/stats               - Thống kê tổng quan
GET    /reports/inventory-by-category - Báo cáo tồn kho theo danh mục
GET    /reports/monthly-trend         - Xu hướng nhập/xuất 6 tháng
GET    /reports/low-stock-items       - Danh sách hàng sắp hết
GET    /reports/export?type=&format=  - Xuất báo cáo PDF/Excel
```

### Chat APIs (Minh Trí)
```
GET    /chat/history/{userId}         - Lịch sử chat
POST   /chat/send                     - Gửi tin nhắn (lưu DB)
DELETE /chat/history/{userId}         - Xóa lịch sử
GET    /chat/conversations            - Danh sách cuộc trò chuyện
POST   /ai/chat                       - Chat với AI (Gemini)
```

### Settings APIs (Minh Trí)
```
PUT    /users/settings                - Cập nhật settings user
PUT    /users/notification-settings   - Cập nhật notification
GET    /app/check-update              - Kiểm tra phiên bản mới
GET    /search?q={query}              - Tìm kiếm global
GET    /data/export                   - Xuất toàn bộ dữ liệu
```

---

## 🗓️ PHÂN BỔ THỜI GIAN CHI TIẾT

### Tuần 3 (19/11 - 25/11)
| Ngày | Văn Nam (FE) | Minh Thái (BE) | Minh Trí (BE) | Trí Hoàng (Security) |
|------|--------------|----------------|---------------|----------------------|
| 19-20 | Modal Thêm/Sửa Item | `GET/POST /items` | Dashboard stats API | Security Rules Firestore |
| 21-22 | Stock In form | `PUT/DELETE /items` | Reports APIs | Test Auth flows |
| 23-25 | Stock Out form | Stock transactions API | Chat history API | Test CRUD Items |

### Tuần 4 (26/11 - 2/12)
| Ngày | Văn Nam (FE) | Minh Thái (BE) | Minh Trí (BE) | Trí Hoàng (Security) |
|------|--------------|----------------|---------------|----------------------|
| 26-27 | Suppliers CRUD | Suppliers API | AI Chat integration | Test Stock transactions |
| 28-29 | Alerts page | Alerts API | Export reports | Test Suppliers |
| 30-2/12 | Chat integration | Search API | Settings API | Security audit |

### Tuần 5 (3/12 - 9/12)
| Ngày | Văn Nam (FE) | Minh Thái (BE) | Minh Trí (BE) | Trí Hoàng (Security) |
|------|--------------|----------------|---------------|----------------------|
| 3-5 | Bug fixes | Bug fixes | Bug fixes | Write test cases |
| 6-9 | UI Polish | API optimization | Deploy testing | Execute test cases |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Cho Frontend (Văn Nam):
1. Mỗi nút bấm phải có loading state
2. Mỗi form phải có validation trước khi gọi API
3. Luôn handle error từ API và hiển thị message
4. Comment rõ expected API response trong code

### Cho Backend (Minh Thái, Minh Trí):
1. **PHẢI** tuân thủ đúng contract API đã định nghĩa trong `api_client.ts`
2. Response format PHẢI match với interface TypeScript
3. Xử lý error trả về đúng format: `{detail: "error message"}`
4. Log đầy đủ cho debugging

### Cho Security (Trí Hoàng):
1. Test tất cả API với user unauthorized
2. Test CRUD với user không có quyền
3. Test input validation (SQL injection, XSS)
4. Document tất cả test cases

---

*Cập nhật lần cuối: 6/12/2025*
