import sys
import os
from sqlalchemy import text

# Thêm thư mục hiện tại vào hệ thống để có thể import module 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal

def reset_all_data():
    """
    Xóa toàn bộ dữ liệu trong tất cả các bảng nhưng giữ nguyên cấu trúc.
    """
    print("--- ĐANG BẮT ĐẦU RESET DATABASE ---")
    db = SessionLocal()
    try:
        # 1. Tắt kiểm tra khóa ngoại (Foreign Keys) để tránh lỗi ràng buộc khi xóa
        db.execute(text("PRAGMA foreign_keys = OFF;"))

        # 2. Lấy danh sách các bảng từ Metadata của SQLAlchemy
        # sorted_tables giúp sắp xếp thứ tự ưu tiên các bảng có ràng buộc
        for table in reversed(Base.metadata.sorted_tables):
            print(f" -> Đang xóa dữ liệu trong bảng: {table.name}")
            db.execute(table.delete())

        # 3. Reset các thanh đếm ID tự tăng (autoincrement) về 0
        # Trong SQLite, thông tin này nằm ở bảng hệ thống 'sqlite_sequence'
        try:
            db.execute(text("DELETE FROM sqlite_sequence;"))
            print(" -> Đã reset các thanh đếm ID (Auto-increment).")
        except Exception:
            # Một số DB mới có thể chưa có bảng này, có thể bỏ qua
            pass

        # 4. Lưu thay đổi (Commit)
        db.commit()

        # 5. Bật lại kiểm tra khóa ngoại
        db.execute(text("PRAGMA foreign_keys = ON;"))
        print("\n--- THÀNH CÔNG: Toàn bộ dữ liệu đã được dọn sạch. ---")
        print("Cấu trúc các bảng và ràng buộc vẫn được giữ nguyên.")

    except Exception as e:
        db.rollback()
        print(f"\n[LỖI] Quá trình reset thất bại: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Yêu cầu xác nhận trước khi xóa
    confirm = input("CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu người dùng, hàng hóa, giao dịch... \nBạn có chắc chắn muốn tiếp tục? (y/n): ")
    if confirm.lower() == 'y':
        reset_all_data()
    else:
        print("Đã hủy bỏ thao tác reset.")