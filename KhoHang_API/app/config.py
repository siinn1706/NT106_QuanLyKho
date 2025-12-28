# app/config.py
from pathlib import Path
from dotenv import load_dotenv
import os

# BASE_DIR = thư mục KhoHang_API
BASE_DIR = Path(__file__).resolve().parent.parent

# Load file .env ở gốc project KhoHang_API/.env
load_dotenv(BASE_DIR / ".env")

FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
FIREBASE_AUTH_DOMAIN = os.getenv("FIREBASE_AUTH_DOMAIN")
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Email configuration for OTP
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USERNAME)
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "NT106 Quản Lý Kho")

# OTP settings
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))  # OTP hết hạn sau 5 phút

if not FIREBASE_API_KEY:
    raise RuntimeError("FIREBASE_API_KEY is not set in .env")

if not FIREBASE_SERVICE_ACCOUNT:
    print("[WARN] FIREBASE_SERVICE_ACCOUNT not set. Firestore features will be limited.")

if not GEMINI_API_KEY:
    # Không bắt buộc nếu chưa dùng AI nhưng cảnh báo rõ ràng
    print("[WARN] GEMINI_API_KEY is not set. /ai/chat endpoint will return 501.")

if not EMAIL_USERNAME or not EMAIL_PASSWORD:
    print("[WARN] Email credentials not set. OTP functionality will be limited.")
