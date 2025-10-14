🚀 MiniDrive P2P - Đồ án Lập trình Mạng Căn bản
Mã môn học: NT106.Q13

Trường: Đại học Công nghệ Thông tin - ĐHQG TP.HCM (UIT)

Nhóm thực hiện: Nhóm 12

Một ứng dụng desktop mô phỏng Google Drive kết hợp với tính năng chia sẻ file ngang hàng (P2P) tốc độ cao trong mạng nội bộ, tương tự AirDrop.

💡 Mô tả dự án
MiniDrive P2P là giải pháp lưu trữ và chia sẻ file "2 trong 1", được xây dựng cho môn học Lập trình Mạng Căn bản. Ứng dụng giải quyết hai nhu cầu chính của người dùng:

Lưu trữ đám mây (Cloud Storage): Người dùng có thể tải lên, tải xuống và quản lý các tệp tin của mình từ bất kỳ đâu có Internet, dữ liệu được lưu trữ an toàn trên nền tảng Firebase.

Chia sẻ nội bộ (Local Sharing): Khi ở trong cùng một mạng LAN (ví dụ: mạng Wi-Fi của trường, công ty, gia đình), người dùng có thể "bắn" file trực tiếp cho nhau với tốc độ tối đa của mạng mà không cần tải file lên Internet, giúp tiết kiệm thời gian và băng thông.

Dự án này là sự kết hợp giữa mô hình Client-Server (cho lưu trữ đám mây) và Peer-to-Peer (cho chia sẻ nội bộ), thể hiện sự am hiểu sâu sắc về các kiến trúc mạng hiện đại.

✨ Tính năng chính
Xác thực người dùng: Đăng ký, đăng nhập an toàn sử dụng Firebase Authentication.

Quản lý file trên Cloud (MiniDrive):

Tải file lên Firebase Storage với thanh tiến trình (progress bar).

Xem danh sách file/folder dưới dạng cây thư mục.

Tải file về máy.

Xóa file.

Chia sẻ qua mã QR: Tạo link tải file công khai và hiển thị dưới dạng mã QR tiện lợi.

Chia sẻ ngang hàng (P2P AirDrop):

Tự động quét và phát hiện các người dùng khác đang mở ứng dụng trong cùng mạng LAN.

Gửi file trực tiếp cho người dùng được chọn.

Nhận file từ người dùng khác với thông báo và tùy chọn chấp nhận/từ chối.

Tốc độ truyền file cực nhanh, không bị giới hạn bởi tốc độ Internet.

🛠️ Công nghệ sử dụng
Lĩnh vực

Công nghệ

Lý do lựa chọn

Nền tảng



Xây dựng ứng dụng desktop đa nền tảng từ công nghệ web (JS, HTML, CSS).

Frontend



Ngôn ngữ lập trình chính cho giao diện và logic phía client.

Styling



Framework CSS utility-first giúp xây dựng giao diện nhanh chóng và nhất quán.

Backend (BaaS)



Cung cấp dịch vụ Authentication, Firestore (DB), và Storage, giảm tải cho việc tự xây dựng server.

Networking P2P



Sử dụng module net (TCP) và dgram (UDP) tích hợp để xây dựng logic P2P.

🚀 Cài đặt và Chạy thử
Clone repository:

git clone [https://github.com/your-username/minidrive-p2p.git](https://github.com/your-username/minidrive-p2p.git)
cd minidrive-p2p

Cài đặt dependencies:

npm install

Cấu hình Firebase:

Tạo một dự án mới trên Firebase Console.

Bật các dịch vụ: Authentication (Email/Password), Firestore, Storage.

Lấy file cấu hình Firebase (firebaseConfig) và điền vào file src/firebaseConfig.js.

Chạy ứng dụng ở chế độ development:

npm start

Build ứng dụng thành file thực thi:

npm run build
