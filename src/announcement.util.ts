const URDU_DIGITS = ['صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو'];

/** Compound Urdu number words 0–99 (22 = بائیس, not بیس دو). */
const URDU_NUMBERS = [
  'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
  'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس', 'بیس',
  'اکیس', 'بائیس', 'تئیس', 'چوبیس', 'پچیس', 'چھبیس', 'ستائیس', 'اٹھائیس', 'انتیس', 'تیس',
  'اکتیس', 'بتیس', 'تینتیس', 'چونتیس', 'پینتیس', 'چھتیس', 'سینتیس', 'اڑتیس', 'انتالیس', 'چالیس',
  'اکتالیس', 'بیالیس', 'تینتالیس', 'چوالیس', 'پینتالیس', 'چھیالیس', 'سینتالیس', 'اڑتالیس', 'انچاس', 'پچاس',
  'اکاون', 'باون', 'ترپن', 'چون', 'پچپن', 'چھپن', 'ستاون', 'اٹھاون', 'انسٹھ', 'ساٹھ',
  'اکسٹھ', 'باسٹھ', 'تریسٹھ', 'چونسٹھ', 'پینسٹھ', 'چھاسٹھ', 'سڑسٹھ', 'اڑسٹھ', 'انہتر', 'ستر',
  'اکہتر', 'بہتر', 'تہتر', 'چوہتر', 'پچھتر', 'چھہتر', 'ستتر', 'اٹھتر', 'اناسی', 'اسی',
  'اکاسی', 'بیاسی', 'تراسی', 'چوراسی', 'پچاسی', 'چھیاسی', 'ستاسی', 'اٹاسی', 'نواسی', 'نوے',
  'اکانوے', 'بانوے', 'ترانوے', 'چورانوے', 'پچانوے', 'چھیانوے', 'ستانوے', 'اٹھانوے', 'ننانوے',
];

export const ROOM_PHRASES: Record<string, string> = {
  room1: 'کمرہ نمبر ایک',
  room2: 'کمرہ نمبر دو',
};

/** Compound Hindi number words 0–99 for Swara TTS (22 = बाईस, not बीस दो). */
const HINDI_NUMBERS = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकत्तीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सतावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अठ्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

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
  if (n < 100) return URDU_NUMBERS[n];
  if (n < MAX_TOKEN_NUMBER) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundreds === 1 ? 'سو' : `${URDU_NUMBERS[hundreds]} سو`;
    if (!rest) return hundredPart;
    return `${hundredPart} ${tokenToUrduNumber(rest)}`;
  }
  return tokenDigitsToUrdu(tokenNumber);
}

function tokenToSpokenNumber(tokenNumber: number | string): string {
  const n = parseInt(String(tokenNumber), 10);
  if (Number.isNaN(n) || n < 0) return String(tokenNumber);
  if (n === MAX_TOKEN_NUMBER) return 'एक हज़ार';
  if (n < 100) return HINDI_NUMBERS[n];
  if (n < MAX_TOKEN_NUMBER) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredPart = hundreds === 1 ? 'सौ' : `${HINDI_NUMBERS[hundreds]} सौ`;
    if (!rest) return hundredPart;
    return `${hundredPart} ${tokenToSpokenNumber(rest)}`;
  }
  return String(tokenNumber)
    .split('')
    .map((d) => HINDI_NUMBERS[parseInt(d, 10)] ?? d)
    .join(' ');
}

/** Urdu text for on-screen display and captions. */
export function buildAnnouncement(tokenNumber: number | string, roomKey: string): string {
  const token = tokenToUrduNumber(tokenNumber);
  const room = ROOM_PHRASES[roomKey] ?? roomKey;
  return `ٹوکن نمبر ${token}، ${room} میں آ جائیں`;
}

/** Spoken announcement — pure Devanagari for Swara (Urdu script is skipped/mangled by hi-IN voice). */
export function buildSpokenAnnouncement(tokenNumber: number | string, roomKey: string): string {
  const token = tokenToSpokenNumber(tokenNumber);
  const room = ROOM_PHRASES_SPOKEN[roomKey] ?? roomKey;
  return `बराए मेहरबानी, टोकन नंबर ${token}, ${room} में आ जाइए`;
}

export function buildSpokenTestAnnouncement(): string {
  return buildSpokenAnnouncement(1, 'room1');
}
