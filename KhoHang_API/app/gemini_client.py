"""Gemini client wrapper.

Tách riêng việc gọi API Gemini để main.py gọn.
"""
import time
import re
from typing import Optional, Tuple

GENAI_LIB = None
genai_types = None
genai_client = None

# Primary: new google.genai client
try:  # pragma: no cover - optional dependency
    import google.genai as genai  # type: ignore
    from google.genai import types as genai_types  # type: ignore
    GENAI_LIB = "google.genai"
except ImportError:
    try:
        import google.generativeai as genai  # type: ignore
        GENAI_LIB = "google.generativeai"
    except ImportError:  # graceful fallback if package missing
        genai = None  # type: ignore

# Try to import google.api_core for better exception handling
try:  # pragma: no cover - optional dependency
    from google.api_core import exceptions as google_exceptions  # type: ignore
except ImportError:
    google_exceptions = None  # type: ignore

from .config import GEMINI_API_KEY

MODEL_NAME = "gemini-2.5-pro"
FALLBACK_MODEL_NAME = "gemini-2.5-flash"  # Model fallback mới hơn, quota cao hơn

def is_configured() -> bool:
    return bool(GEMINI_API_KEY) and genai is not None

def init_client() -> None:
    if not is_configured():
        return
    global genai_client
    if GENAI_LIB == "google.genai":
        genai_client = genai.Client(api_key=GEMINI_API_KEY)  # type: ignore
    else:
        # Legacy google.generativeai
        genai.configure(api_key=GEMINI_API_KEY)  # type: ignore

_initialized = False

class QuotaExceededError(Exception):
    """Lỗi khi vượt quá quota của Gemini API"""
    def __init__(self, message: str, retry_after: Optional[float] = None):
        super().__init__(message)
        self.retry_after = retry_after

def _extract_retry_delay(error_message: str) -> Optional[float]:
    """Trích xuất thời gian retry từ error message của Gemini API"""
    # Pattern: "Please retry in 54.742539982s"
    match = re.search(r'retry in ([\d.]+)s', error_message, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None

def _is_quota_error(exception: Exception) -> Tuple[bool, Optional[float]]:
    """Kiểm tra xem exception có phải lỗi quota không và trả về retry delay nếu có"""
    error_str = str(exception)
    
    # Kiểm tra các pattern lỗi quota
    quota_patterns = [
        r'quota.*exceeded',
        r'429',
        r'rate.*limit',
        r'free.*tier',
    ]
    
    is_quota = any(re.search(pattern, error_str, re.IGNORECASE) for pattern in quota_patterns)
    retry_delay = _extract_retry_delay(error_str) if is_quota else None
    
    # Kiểm tra google.api_core.exceptions.ResourceExhausted
    if google_exceptions:
        if isinstance(exception, google_exceptions.ResourceExhausted):
            is_quota = True
            retry_delay = retry_delay or 60.0  # Default 60 seconds
    
    return is_quota, retry_delay

def _is_model_not_found_error(exception: Exception) -> bool:
    """Kiểm tra xem exception có phải lỗi model không tồn tại (404) không"""
    error_str = str(exception)
    not_found_patterns = [
        r'404',
        r'not found',
        r'is not found',
        r'not supported',
    ]
    return any(re.search(pattern, error_str, re.IGNORECASE) for pattern in not_found_patterns)

def _generate_with_model(
    model_name: str, 
    prompt: str, 
    system_instruction: Optional[str] = None
) -> str:
    """Generate reply với model cụ thể"""
    default_md_instruction = (
        "Always answer in Vietnamese using valid Markdown (headings, lists, tables, code blocks where helpful)."
    )
    effective_instruction = (
        system_instruction if system_instruction else default_md_instruction
    )
    # New google.genai client
    if GENAI_LIB == "google.genai":
        config = None
        if genai_types:
            config = genai_types.GenerateContentConfig(system_instruction=effective_instruction)  # type: ignore
        response = genai_client.models.generate_content(  # type: ignore
            model=model_name,
            contents=prompt,
            config=config,
        )
    else:
        # Legacy google.generativeai
        model = genai.GenerativeModel(  # type: ignore
            model_name=model_name, system_instruction=effective_instruction
        )
        response = model.generate_content(prompt)  # type: ignore
    
    if hasattr(response, "text") and response.text:
        return response.text.strip()
    # Fallback
    try:
        return response.candidates[0].content.parts[0].text.strip()  # type: ignore
    except Exception:
        return "(Không có phản hồi từ mô hình)"

def generate_reply(
    prompt: str, 
    system_instruction: Optional[str] = None,
    max_retries: int = 2
) -> str:
    """Gọi Gemini với prompt, trả về text.
    
    Args:
        prompt: Câu hỏi/đề bài
        system_instruction: Hướng dẫn hệ thống tùy chọn
        max_retries: Số lần retry tối đa (default: 2)
    
    Raises:
        RuntimeError: Nếu chưa cấu hình API key
        QuotaExceededError: Nếu vượt quá quota với thông tin retry_after
    """
    global _initialized
    if not is_configured():
        raise RuntimeError("Gemini client not configured. Set GEMINI_API_KEY and install google-genai.")
    if not _initialized:
        init_client()
        _initialized = True

    # Chỉ thử fallback model nếu model chính gặp lỗi quota
    models_to_try = [MODEL_NAME]
    
    last_error = None
    should_try_fallback = False
    
    # Lần đầu thử với model chính
    for model_name in models_to_try:
        for attempt in range(max_retries + 1):
            try:
                return _generate_with_model(model_name, prompt, system_instruction)
            except Exception as e:
                last_error = e
                is_quota, retry_delay = _is_quota_error(e)
                is_not_found = _is_model_not_found_error(e)
                
                # Nếu model không tồn tại, raise error ngay
                if is_not_found:
                    raise RuntimeError(
                        f"Model '{model_name}' không khả dụng trong API Gemini. "
                        f"Vui lòng kiểm tra lại cấu hình model. "
                        f"Chi tiết: {str(e)[:200]}"
                    )
                
                if is_quota:
                    # Nếu là lỗi quota và là model chính, đánh dấu để thử fallback
                    if model_name == MODEL_NAME:
                        should_try_fallback = True
                        # Chờ một chút trước khi thử fallback
                        time.sleep(1)
                        break
                    else:
                        # Đã thử cả fallback, raise QuotaExceededError
                        raise QuotaExceededError(
                            f"Đã vượt quá quota API Gemini cho tất cả các model. Vui lòng thử lại sau. "
                            f"Chi tiết: {str(e)[:200]}",
                            retry_after=retry_delay
                        )
                
                # Nếu không phải lỗi quota và còn retry, chờ một chút rồi thử lại
                if attempt < max_retries:
                    wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, ...
                    time.sleep(wait_time)
                    continue
                else:
                    # Hết retry, thử model tiếp theo hoặc raise error
                    break
    
    # Nếu model chính hết quota, thử fallback model
    if should_try_fallback:
        try:
            return _generate_with_model(FALLBACK_MODEL_NAME, prompt, system_instruction)
        except Exception as e:
            is_quota_fallback, retry_delay_fallback = _is_quota_error(e)
            is_not_found_fallback = _is_model_not_found_error(e)
            
            if is_not_found_fallback:
                # Fallback model không tồn tại, chỉ báo lỗi quota của model chính
                raise QuotaExceededError(
                    f"Đã vượt quá quota API Gemini cho model '{MODEL_NAME}'. "
                    f"Fallback model không khả dụng. Vui lòng thử lại sau. "
                    f"Chi tiết: {str(last_error)[:200] if last_error else str(e)[:200]}",
                    retry_after=retry_delay
                )
            elif is_quota_fallback:
                # Cả hai model đều hết quota
                raise QuotaExceededError(
                    f"Đã vượt quá quota API Gemini cho tất cả các model. Vui lòng thử lại sau. "
                    f"Chi tiết: {str(e)[:200]}",
                    retry_after=retry_delay_fallback or retry_delay
                )
            else:
                # Lỗi khác với fallback model
                raise RuntimeError(
                    f"Lỗi khi gọi Gemini API với fallback model: {e}. "
                    f"Lỗi ban đầu: {last_error}"
                )
    
    # Nếu đến đây nghĩa là đã thử hết models và retries
    if last_error:
        is_quota, retry_delay = _is_quota_error(last_error)
        if is_quota:
            raise QuotaExceededError(
                f"Đã vượt quá quota API Gemini. Vui lòng thử lại sau. "
                f"Chi tiết: {str(last_error)[:200]}",
                retry_after=retry_delay
            )
        raise RuntimeError(f"Lỗi khi gọi Gemini API: {last_error}")
    
    raise RuntimeError("Không thể tạo phản hồi từ Gemini API")
