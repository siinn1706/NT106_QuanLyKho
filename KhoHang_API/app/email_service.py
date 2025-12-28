# app/email_service.py
"""Email service for sending OTP codes"""

import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from .config import (
    EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD,
    EMAIL_FROM, EMAIL_FROM_NAME, OTP_EXPIRY_MINUTES
)
from .database import OTPModel


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def send_otp_email(email: str, otp_code: str, otp_type: str) -> bool:
    """
    Gửi email chứa OTP code
    
    Args:
        email: Email người nhận
        otp_code: Mã OTP 6 số
        otp_type: Loại OTP ('register' hoặc 'reset_password')
    
    Returns:
        True nếu gửi thành công, False nếu thất bại
    """
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        print("[ERROR] Email credentials not configured")
        return False
    
    try:
        # Tạo email content dựa vào loại OTP
        if otp_type == 'register':
            subject = "Mã xác thực đăng ký tài khoản"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 30px;">
                    <h2 style="color: #007AFF;">Chào mừng đến với NT106 Quản Lý Kho!</h2>
                    <p>Mã OTP của bạn để xác thực đăng ký là:</p>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #007AFF; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                    <p><strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>{OTP_EXPIRY_MINUTES} phút</strong>.</p>
                    <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">© 2025 NT106 Quản Lý Kho. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        else:  # reset_password
            subject = "Mã xác thực đặt lại mật khẩu"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 30px;">
                    <h2 style="color: #007AFF;">Đặt lại mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #007AFF; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                    <p><strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>{OTP_EXPIRY_MINUTES} phút</strong>.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và đảm bảo tài khoản của bạn được bảo mật.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">© 2025 NT106 Quản Lý Kho. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
        
        # Tạo email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        msg['To'] = email
        
        # Attach HTML body
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        # Gửi email qua SMTP
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(msg)
        
        print(f"[INFO] OTP email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send OTP email to {email}: {str(e)}")
        return False


def create_otp(db: Session, email: str, otp_type: str) -> str:
    """
    Tạo và lưu OTP vào database, đồng thời gửi email
    
    Args:
        db: Database session
        email: Email người dùng
        otp_type: Loại OTP ('register' hoặc 'reset_password')
    
    Returns:
        OTP code (6 digits)
    """
    # Vô hiệu hóa các OTP cũ chưa sử dụng của email này và loại tương tự
    old_otps = db.query(OTPModel).filter(
        OTPModel.email == email,
        OTPModel.otp_type == otp_type,
        OTPModel.is_used == False
    ).all()
    
    for old_otp in old_otps:
        old_otp.is_used = True
    db.commit()
    
    # Tạo OTP mới
    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    new_otp = OTPModel(
        email=email,
        otp_code=otp_code,
        otp_type=otp_type,
        expires_at=expires_at,
        is_used=False
    )
    
    db.add(new_otp)
    db.commit()
    db.refresh(new_otp)
    
    # Gửi email
    send_otp_email(email, otp_code, otp_type)
    
    return otp_code


def verify_otp(db: Session, email: str, otp_code: str, otp_type: str) -> bool:
    """
    Verify OTP code
    
    Args:
        db: Database session
        email: Email người dùng
        otp_code: Mã OTP cần verify
        otp_type: Loại OTP ('register' hoặc 'reset_password')
    
    Returns:
        True nếu OTP hợp lệ, False nếu không
    """
    otp = db.query(OTPModel).filter(
        OTPModel.email == email,
        OTPModel.otp_code == otp_code,
        OTPModel.otp_type == otp_type,
        OTPModel.is_used == False
    ).first()
    
    if not otp:
        return False
    
    # Kiểm tra expiry
    if datetime.now(timezone.utc) > otp.expires_at:
        return False
    
    # Đánh dấu OTP đã sử dụng
    otp.is_used = True
    db.commit()
    
    return True
