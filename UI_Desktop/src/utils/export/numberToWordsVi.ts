/**
 * numberToWordsVi.ts - Convert number to Vietnamese words
 * 
 * Chuyển đổi số tiền thành chữ tiếng Việt
 * VD: 123000 → "Một trăm hai mươi ba nghìn"
 */

const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

/**
 * Chuyển nhóm 3 chữ số thành chữ
 */
function convertGroup(num: number): string {
  if (num === 0) return '';

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  const ten = Math.floor(remainder / 10);
  const one = remainder % 10;

  let result = '';

  // Hàng trăm
  if (hundred > 0) {
    result += ones[hundred] + ' trăm';
    if (remainder > 0) {
      result += ' ';
    }
  }

  // Hàng chục và đơn vị
  if (remainder >= 10 && remainder < 20) {
    // 10-19
    if (remainder === 15) {
      result += 'mười lăm';
    } else {
      result += teens[remainder - 10];
    }
  } else if (remainder >= 20) {
    // 20-99
    result += tens[ten];
    if (one > 0) {
      result += ' ';
      if (one === 1 && ten > 1) {
        result += 'mốt'; // 21, 31, 41...
      } else if (one === 5 && ten > 0) {
        result += 'lăm'; // 25, 35, 45...
      } else {
        result += ones[one];
      }
    }
  } else if (remainder > 0 && remainder < 10) {
    // 1-9
    if (hundred > 0) {
      result += 'lẻ ' + ones[one];
    } else {
      result += ones[one];
    }
  }

  return result;
}

/**
 * Chuyển số nguyên thành chữ tiếng Việt
 * @param num - Số cần chuyển (0 - 999,999,999,999,999)
 * @returns Chuỗi số bằng chữ (chưa viết hoa chữ đầu)
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không';

  // Làm tròn về số nguyên
  num = Math.floor(num);

  if (num < 0) {
    return 'âm ' + numberToVietnameseWords(-num);
  }

  const groups: number[] = [];
  let temp = num;

  // Chia thành các nhóm 3 chữ số
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i];
    if (groupValue > 0) {
      const groupText = convertGroup(groupValue);
      const scale = scales[i];
      parts.push(groupText + (scale ? ' ' + scale : ''));
    }
  }

  let result = parts.join(' ').trim();

  // Chuẩn hóa khoảng trắng
  result = result.replace(/\s+/g, ' ');

  return result;
}

/**
 * Chuyển số tiền thành chữ tiếng Việt với đơn vị tiền tệ
 * @param amount - Số tiền
 * @param currency - Đơn vị tiền tệ (mặc định "đồng")
 * @param capitalize - Viết hoa chữ cái đầu (mặc định true)
 * @returns VD: "Một trăm hai mươi ba nghìn đồng chẵn"
 */
export function amountToVietnameseWords(
  amount: number,
  currency: string = 'đồng',
  capitalize: boolean = true
): string {
  let result = numberToVietnameseWords(amount);

  if (result === 'không') {
    result = 'Không ' + currency;
  } else {
    result = result + ' ' + currency;
    
    // Thêm "chẵn" nếu số tiền chia hết cho 1000
    if (amount >= 1000 && amount % 1000 === 0) {
      result += ' chẵn';
    }
  }

  // Viết hoa chữ cái đầu
  if (capitalize && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}
