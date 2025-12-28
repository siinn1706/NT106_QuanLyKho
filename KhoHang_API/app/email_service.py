"""email_service.py - Email sending service for OTP"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# SMTP Configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def send_otp_email(to_email: str, otp_code: str, purpose: str) -> bool:
    """
    Send OTP email
    
    Args:
        to_email: Recipient email
        otp_code: 6-digit OTP code
        purpose: register, reset_password, or change_passkey
        
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASS:
        print("[ERROR] SMTP credentials not configured")
        return False
    
    # Email subject and body based on purpose
    subjects = {
        "register": "Mã xác minh đăng ký tài khoản",
        "reset_password": "Mã xác minh đặt lại mật khẩu",
        "change_passkey": "Mã xác minh thay đổi passkey"
    }
    
    subject = subjects.get(purpose, "Mã xác minh")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">{subject}</h2>
            <p>Xin chào,</p>
            <p>Mã xác minh của bạn là:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">{otp_code}</span>
            </div>
            <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
                Email này được gửi tự động, vui lòng không trả lời.<br>
                © 2025 NT106 Quản Lý Kho
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        print(f"[INFO] OTP email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        return False


def send_welcome_email(to_email: str, username: str) -> bool:
    """Send welcome email after successful registration"""
    if not SMTP_USER or not SMTP_PASS:
        return False
    
    subject = "Chào mừng đến với Hệ thống Quản Lý Kho"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Chào mừng {username}!</h2>
            <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
            <p>Bạn có thể đăng nhập ngay bây giờ để sử dụng hệ thống quản lý kho.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
                © 2025 NT106 Quản Lý Kho
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send welcome email: {e}")
        return False
