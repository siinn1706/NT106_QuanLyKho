# app/config.py
from pathlib import Path
from dotenv import load_dotenv
import os

# BASE_DIR = thư mục KhoHang_API
BASE_DIR = Path(__file__).resolve().parent.parent

# Load file .env ở gốc project KhoHang_API/.env
load_dotenv(BASE_DIR / ".env")

# JWT Settings
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-key-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", "7"))

# SMTP Settings
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data.db")

# Gemini AI (optional)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Firebase (deprecated - kept for backward compatibility)
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
FIREBASE_AUTH_DOMAIN = os.getenv("FIREBASE_AUTH_DOMAIN", "")

if not JWT_SECRET or JWT_SECRET == "change-this-secret-key-in-production":
    print("[WARN] JWT_SECRET not set or using default. Please set in .env for production!")

if not SMTP_USER or not SMTP_PASS:
    print("[WARN] SMTP credentials not configured. Email OTP will not work!")

if not GEMINI_API_KEY:
    print("[INFO] GEMINI_API_KEY not set. /ai/chat endpoint will return 501.")
