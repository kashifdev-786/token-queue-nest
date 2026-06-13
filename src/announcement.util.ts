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

/** Hindi script for TTS — phonetically matches spoken Urdu (Swara voice reads this clearly). */
const HINDI_ONES = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
];
const HINDI_TENS = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];

const ROOM_PHRASES_SPOKEN: Record<string, string> = {
  room1: 'कमरा नंबर एक',
  room2: 'कमरा नंबर दो',
};

const MAX_TOKEN_NUMBER = 1000;

function tokenDigitsToUrdu(tokenNumber: number | string): string {
  return String(tokenNumber)
    .split('')
    .map((d) => URDU_DIGITS[parseInt(d, 10)] || d)
    .join(' ');
}

export function tokenToUrduNumber(tokenNumber: number | string): string {
  const n = parseInt(String(tokenNumber), 10);
  if (Number.isNaN(n) || n < 0) return String(tokenNumber);
  if (n === MAX_TOKEN_NUMBER) return 'ایک ہزار';
  if (n < 20) return URDU_ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones ? `${URDU_TENS[tens]} ${URDU_ONES[ones]}` : URDU_TENS[tens];
  }
  if (n < MAX_TOKEN_NUMBER) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundreds === 1 ? 'سو' : `${URDU_ONES[hundreds]} سو`;
    if (!rest) return hundredPart;
    return `${hundredPart} ${tokenToUrduNumber(rest)}`;
  }
  return tokenDigitsToUrdu(tokenNumber);
}

function tokenToSpokenNumber(tokenNumber: number | string): string {
  const n = parseInt(String(tokenNumber), 10);
  if (Number.isNaN(n) || n < 0) return String(tokenNumber);
  if (n === MAX_TOKEN_NUMBER) return 'एक हज़ार';
  if (n < 20) return HINDI_ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones ? `${HINDI_TENS[tens]} ${HINDI_ONES[ones]}` : HINDI_TENS[tens];
  }
  if (n < MAX_TOKEN_NUMBER) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundreds === 1 ? 'सौ' : `${HINDI_ONES[hundreds]} सौ`;
    if (!rest) return hundredPart;
    return `${hundredPart} ${tokenToSpokenNumber(rest)}`;
  }
  return String(tokenNumber)
    .split('')
    .map((d) => HINDI_ONES[parseInt(d, 10)] ?? d)
    .join(' ');
}

/** Urdu text for on-screen display and captions. */
export function buildAnnouncement(tokenNumber: number | string, roomKey: string): string {
  const token = tokenToUrduNumber(tokenNumber);
  const room = ROOM_PHRASES[roomKey] ?? roomKey;
  return `ٹوکن نمبر ${token}، ${room} میں آ جائیں`;
}

/** Spoken announcement — pure Hindi/Urdu phrasing for Swara (avoid English loanwords like टोकन). */
export function buildSpokenAnnouncement(tokenNumber: number | string, roomKey: string): string {
  const token = tokenToSpokenNumber(tokenNumber);
  const room = ROOM_PHRASES_SPOKEN[roomKey] ?? roomKey;
  return `براہ کرم ٹوکن نمبر ${token}، ${room} میں تشریف لے جائیں`;
}

export function buildSpokenTestAnnouncement(): string {
  return buildSpokenAnnouncement(1, 'room1');
}
