const URDU_DIGITS = ['صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو'];
const URDU_ONES = [
  'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
  'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
];
const URDU_TENS = ['', '', 'بیس', 'تیس', 'چالیس', 'پچاس', 'ساٹھ', 'ستر', 'اسی', 'نوے'];

export const ROOM_PHRASES: Record<string, string> = {
  room1: 'کمرہ نمبر ایک',
  room2: 'کمرہ نمبر دو',
};

function tokenDigitsToUrdu(tokenNumber: number | string): string {
  return String(tokenNumber)
    .split('')
    .map((d) => URDU_DIGITS[parseInt(d, 10)] || d)
    .join(' ');
}

export function tokenToUrduNumber(tokenNumber: number | string): string {
  const n = parseInt(String(tokenNumber), 10);
  if (Number.isNaN(n) || n < 0) return String(tokenNumber);
  if (n < 20) return URDU_ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones ? `${URDU_TENS[tens]} ${URDU_ONES[ones]}` : URDU_TENS[tens];
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundreds === 1 ? 'سو' : `${URDU_ONES[hundreds]} سو`;
    if (!rest) return hundredPart;
    return `${hundredPart} ${tokenToUrduNumber(rest)}`;
  }
  return tokenDigitsToUrdu(tokenNumber);
}

export function buildAnnouncement(tokenNumber: number | string, roomKey: string): string {
  const token = tokenToUrduNumber(tokenNumber);
  const room = ROOM_PHRASES[roomKey] ?? roomKey;
  return `ٹوکن نمبر ${token}، ${room} میں آ جائیں`;
}
