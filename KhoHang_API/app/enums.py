"""enums.py - Centralized constants using Python Enum to prevent Magic Strings.

This module defines all application-wide constants that were previously hardcoded
as strings (magic strings). Using Enum provides:
- Type safety and IDE autocomplete
- Prevents typos and spelling mistakes (e.g., "canceled" vs "cancelled")
- Single source of truth for all constants
- Easy refactoring across the codebase
"""

from enum import Enum


# ========== TRANSACTION TYPES ==========
class TransactionType(str, Enum):
    """Loại giao dịch kho (Stock transaction types)."""
    IN = "in"           # Nhập kho
    OUT = "out"         # Xuất kho


# ========== RECORD STATUS ==========
class RecordStatus(str, Enum):
    """Trạng thái của phiếu kho (Status of stock records)."""
    COMPLETED = "completed"   # Hoàn thành
    CANCELLED = "cancelled"   # Đã hủy
    PENDING = "pending"       # Chờ xử lý (nếu cần)


# ========== PAYMENT METHODS ==========
class PaymentMethod(str, Enum):
    """Phương thức thanh toán (Payment methods)."""
    CASH = "tiền_mặt"              # Tiền mặt
    BANK_TRANSFER = "chuyển_khoản"  # Chuyển khoản
    CREDIT = "công_nợ"              # Công nợ


# ========== INVENTORY STATUS ==========
class InventoryStatus(str, Enum):
    """Trạng thái tồn kho (Inventory status)."""
    NORMAL = "normal"              # Bình thường
    LOW_STOCK = "low_stock"        # Tồn kho thấp
    OUT_OF_STOCK = "out_of_stock"  # Hết hàng
    DAMAGED = "damaged"             # Hàng hư hỏng


# ========== HELPER FUNCTIONS ==========
def get_all_payment_methods() -> list[str]:
    """Return list of all valid payment methods."""
    return [method.value for method in PaymentMethod]


def get_all_statuses() -> list[str]:
    """Return list of all valid record statuses."""
    return [status.value for status in RecordStatus]


def get_all_transaction_types() -> list[str]:
    """Return list of all valid transaction types."""
    return [tx_type.value for tx_type in TransactionType]


def get_all_inventory_statuses() -> list[str]:
    """Return list of all valid inventory statuses."""
    return [status.value for status in InventoryStatus]
