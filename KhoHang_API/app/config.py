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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not FIREBASE_API_KEY:
    raise RuntimeError("FIREBASE_API_KEY is not set in .env")

if not GEMINI_API_KEY:
    # Không bắt buộc nếu chưa dùng AI nhưng cảnh báo rõ ràng
    print("[WARN] GEMINI_API_KEY is not set. /ai/chat endpoint will return 501.")