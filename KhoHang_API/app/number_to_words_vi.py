"""
number_to_words_vi.py - Chuyển số thành chữ tiếng Việt

VD: 123000 -> "Một trăm hai mươi ba nghìn đồng"
"""

ONES = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
TEENS = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 
         'mười sáu', 'mười bảy', 'mười tám', 'mười chín']
TENS = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 
        'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi']
SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']


def _convert_group(num: int) -> str:
    """Chuyển nhóm 3 chữ số thành chữ"""
    if num == 0:
        return ''
    
    hundred = num // 100
    remainder = num % 100
    ten = remainder // 10
    one = remainder % 10
    
    result = ''
    
    # Hàng trăm
    if hundred > 0:
        result += ONES[hundred] + ' trăm'
        if remainder > 0:
            result += ' '
    
    # Hàng chục và đơn vị
    if remainder >= 10 and remainder < 20:
        # 10-19
        if remainder == 15:
            result += 'mười lăm'
        else:
            result += TEENS[remainder - 10]
    elif remainder >= 20:
        # 20-99
        result += TENS[ten]
        if one > 0:
            result += ' '
            if one == 1 and ten > 1:
                result += 'mốt'  # 21, 31, 41...
            elif one == 5 and ten > 0:
                result += 'lăm'  # 25, 35, 45...
            else:
                result += ONES[one]
    elif remainder > 0 and remainder < 10:
        # 1-9
        if hundred > 0:
            result += 'lẻ ' + ONES[one]
        else:
            result += ONES[one]
    
    return result


def number_to_vietnamese_words(num: int) -> str:
    """
    Chuyển số nguyên thành chữ tiếng Việt
    
    Args:
        num: Số cần chuyển (0 - 999,999,999,999,999)
    
    Returns:
        Chuỗi số bằng chữ (chưa viết hoa chữ đầu)
    """
    if num == 0:
        return 'không'
    
    # Làm tròn về số nguyên
    num = int(num)
    
    if num < 0:
        return 'âm ' + number_to_vietnamese_words(-num)
    
    groups = []
    temp = num
    
    # Chia thành các nhóm 3 chữ số
    while temp > 0:
        groups.append(temp % 1000)
        temp //= 1000
    
    parts = []
    
    for i in range(len(groups) - 1, -1, -1):
        group_value = groups[i]
        if group_value > 0:
            group_text = _convert_group(group_value)
            scale = SCALES[i] if i < len(SCALES) else ''
            parts.append(group_text + (' ' + scale if scale else ''))
    
    result = ' '.join(parts).strip()
    
    # Chuẩn hóa khoảng trắng
    import re
    result = re.sub(r'\s+', ' ', result)
    
    return result


def amount_to_vietnamese_words(
    amount: float,
    currency: str = 'đồng',
    capitalize: bool = True
) -> str:
    """
    Chuyển số tiền thành chữ tiếng Việt với đơn vị tiền tệ
    
    Args:
        amount: Số tiền
        currency: Đơn vị tiền tệ (mặc định "đồng")
        capitalize: Viết hoa chữ cái đầu (mặc định True)
    
    Returns:
        VD: "Một trăm hai mươi ba nghìn đồng chẵn"
    """
    result = number_to_vietnamese_words(int(amount))
    
    if result == 'không':
        result = 'Không ' + currency
    else:
        result = result + ' ' + currency
        
        # Thêm "chẵn" nếu số tiền chia hết cho 1000
        if amount >= 1000 and amount % 1000 == 0:
            result += ' chẵn'
    
    # Viết hoa chữ cái đầu
    if capitalize and len(result) > 0:
        result = result[0].upper() + result[1:]
    
    return result
