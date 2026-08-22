/**
 * Standard Vietnamese Number-to-Words Converter for Electronic Invoices & Financial Documents
 * Convert numbers into words (e.g., 229250000 -> "Hai trăm hai mươi chín triệu hai trăm năm mươi nghìn đồng chẵn")
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(n: number, showZeroHundred = false): string {
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  const ten = Math.floor(remainder / 10);
  const unit = remainder % 10;

  const words: string[] = [];

  if (hundred > 0 || showZeroHundred) {
    words.push(`${DIGITS[hundred]} trăm`);
  }

  if (ten > 1) {
    words.push(`${DIGITS[ten]} mươi`);
    if (unit === 1) {
      words.push('mốt');
    } else if (unit === 5) {
      words.push('lăm');
    } else if (unit > 0) {
      words.push(DIGITS[unit]);
    }
  } else if (ten === 1) {
    words.push('mười');
    if (unit === 5) {
      words.push('lăm');
    } else if (unit > 0) {
      words.push(DIGITS[unit]);
    }
  } else {
    // ten === 0
    if ((hundred > 0 || showZeroHundred) && unit > 0) {
      words.push('lẻ');
      words.push(DIGITS[unit]);
    } else if (unit > 0) {
      words.push(DIGITS[unit]);
    }
  }

  return words.join(' ');
}

export function numberToWordsVietnamese(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return 'Không đồng';

  const groups: number[] = [];
  let temp = rounded;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const resultWords: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const showZero = i < groups.length - 1;
      const groupText = readThreeDigits(groupVal, showZero);
      const scaleText = SCALES[i];
      resultWords.push(scaleText ? `${groupText} ${scaleText}` : groupText);
    }
  }

  let finalStr = resultWords.join(' ').replace(/\s+/g, ' ').trim();
  if (finalStr.length > 0) {
    finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
  }

  return `${finalStr} đồng chẵn`;
}
