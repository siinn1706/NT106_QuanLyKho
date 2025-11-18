"""Gemini client wrapper.

Tách riêng việc gọi API Gemini để main.py gọn.
"""
from typing import Optional

try:
    import google.generativeai as genai  # type: ignore
except ImportError:  # graceful fallback if package missing
    genai = None  # type: ignore

from .config import GEMINI_API_KEY

MODEL_NAME = "gemini-2.5-pro"

def is_configured() -> bool:
    return bool(GEMINI_API_KEY) and genai is not None

def init_client() -> None:
    if not is_configured():
        return
    genai.configure(api_key=GEMINI_API_KEY)  # type: ignore

_initialized = False

def generate_reply(prompt: str, system_instruction: Optional[str] = None) -> str:
    """Gọi Gemini với prompt, trả về text.

    Nếu chưa cấu hình API key hoặc chưa cài package sẽ raise RuntimeError.
    """
    global _initialized
    if not is_configured():
        raise RuntimeError("Gemini client not configured. Set GEMINI_API_KEY and install google-generativeai.")
    if not _initialized:
        init_client()
        _initialized = True

    # Tạo model với hướng dẫn mặc định: trả lời bằng Markdown
    default_md_instruction = (
        "Always answer in Vietnamese using valid Markdown (headings, lists, tables, code blocks where helpful)."
    )
    effective_instruction = (
        system_instruction if system_instruction else default_md_instruction
    )
    model = genai.GenerativeModel(  # type: ignore
        model_name=MODEL_NAME, system_instruction=effective_instruction
    )

    response = model.generate_content(prompt)  # type: ignore
    # response có thể có .text hoặc candidates
    if hasattr(response, "text") and response.text:
        return response.text.strip()
    # Fallback
    try:
        return response.candidates[0].content.parts[0].text.strip()  # type: ignore
    except Exception:
        return "(Không có phản hồi từ mô hình)"
