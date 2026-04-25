export function detectFormat(value: string): DetectedFormat | null {
  if (isGeolocation(value)) {
    const data = parseGeolocation(value);
    if (data) {
      return { type: "geolocation", data };
    }
  }
  if (isISBN(value)) {
    const data = parseISBN(value);
    if (data) {
      return { type: "isbn", data };
    }
  }
  if (isIBAN(value)) {
    const data = parseIBAN(value);
    if (data) {
      return { type: "iban", data };
    }
  }
  if (isRegex(value)) {
    return { type: "regex", data: parseRegex(value) };
  }
  if (isSemanticColor(value)) {
    const data = parseSemanticColor(value);
    if (data) {
      return { type: "semanticColor", data };
    }
  }
  return null;
}

export type DetectedFormat =
  | { type: "geolocation"; data: GeolocationData }
  | { type: "isbn"; data: ISBNData }
  | { type: "iban"; data: IBANData }
  | { type: "regex"; data: RegexData }
  | { type: "semanticColor"; data: SemanticColorData };

export interface GeolocationData {
  latitude: number;
  longitude: number;
  original: string;
}

export interface ISBNData {
  isbn: string;
  isbn10?: string;
  isbn13?: string;
  type: "ISBN-10" | "ISBN-13";
}

export interface IBANData {
  iban: string;
  countryCode: string;
  countryName: string;
  flag: string;
  formatted: string;
}

export interface RegexData {
  pattern: string;
  flags: string;
  isValid: boolean;
}

export interface SemanticColorData {
  name: string;
  hex: string;
}

const GEOLOCATION_PATTERNS = [
  /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
  /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/,
  /^(-?\d+\.?\d*)°?\s*([NS])?\s*,\s*(-?\d+\.?\d*)°?\s*([EW])?$/i,
];

export function isGeolocation(value: string): boolean {
  const trimmed = value.trim();
  for (const pattern of GEOLOCATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      const data = parseGeolocation(trimmed);
      if (data) {
        return (
          data.latitude >= -90 &&
          data.latitude <= 90 &&
          data.longitude >= -180 &&
          data.longitude <= 180
        );
      }
    }
  }
  return false;
}

export function parseGeolocation(value: string): GeolocationData | null {
  const trimmed = value.trim();
  
  for (const pattern of GEOLOCATION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      let lat: number, lng: number;
      
      if (match.length === 3) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      } else if (match.length === 5) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[3]);
        
        if (match[2] && match[2].toUpperCase() === 'S') lat = -Math.abs(lat);
        if (match[4] && match[4].toUpperCase() === 'W') lng = -Math.abs(lng);
      } else {
        continue;
      }
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          original: trimmed,
        };
      }
    }
  }
  
  return null;
}

const ISBN10_PATTERN = /^(?:ISBN(?:-10)?:?\s*)?(\d{9}[\dX])$/i;
const ISBN13_PATTERN = /^(?:ISBN(?:-13)?:?\s*)?(97[89]\d{10})$/i;
const ISBN_WITH_HYPHENS = /^(?:ISBN(?:-1[03])?:?\s*)?([\d-]{10,17}[\dX])$/i;

export function isISBN(value: string): boolean {
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase();
  
  if (ISBN10_PATTERN.test(cleaned)) {
    return validateISBN10(cleaned.match(ISBN10_PATTERN)![1]);
  }
  if (ISBN13_PATTERN.test(cleaned)) {
    return validateISBN13(cleaned.match(ISBN13_PATTERN)![1]);
  }
  return false;
}

function validateISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i);
  }
  
  const check = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
  sum += check;
  
  return sum % 11 === 0;
}

function validateISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(isbn[12]);
}

export function parseISBN(value: string): ISBNData | null {
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase();
  
  let isbn10: string | undefined;
  let isbn13: string | undefined;
  let type: "ISBN-10" | "ISBN-13";
  
  const match10 = cleaned.match(ISBN10_PATTERN);
  const match13 = cleaned.match(ISBN13_PATTERN);
  
  if (match13 && validateISBN13(match13[1])) {
    isbn13 = match13[1];
    type = "ISBN-13";
  } else if (match10 && validateISBN10(match10[1])) {
    isbn10 = match10[1];
    type = "ISBN-10";
  } else {
    return null;
  }
  
  return {
    isbn: isbn13 || isbn10!,
    isbn10,
    isbn13,
    type,
  };
}

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

export const IBAN_COUNTRIES: Record<string, { name: string; length: number; flag: string }> = {
  AD: { name: "Andorra", length: 24, flag: "🇦🇩" },
  AE: { name: "United Arab Emirates", length: 23, flag: "🇦🇪" },
  AL: { name: "Albania", length: 28, flag: "🇦🇱" },
  AT: { name: "Austria", length: 20, flag: "🇦🇹" },
  AZ: { name: "Azerbaijan", length: 28, flag: "🇦🇿" },
  BA: { name: "Bosnia and Herzegovina", length: 20, flag: "🇧🇦" },
  BE: { name: "Belgium", length: 16, flag: "🇧🇪" },
  BG: { name: "Bulgaria", length: 22, flag: "🇧🇬" },
  BH: { name: "Bahrain", length: 22, flag: "🇧🇭" },
  BR: { name: "Brazil", length: 29, flag: "🇧🇷" },
  BY: { name: "Belarus", length: 28, flag: "🇧🇾" },
  CH: { name: "Switzerland", length: 21, flag: "🇨🇭" },
  CR: { name: "Costa Rica", length: 22, flag: "🇨🇷" },
  CY: { name: "Cyprus", length: 28, flag: "🇨🇾" },
  CZ: { name: "Czech Republic", length: 24, flag: "🇨🇿" },
  DE: { name: "Germany", length: 22, flag: "🇩🇪" },
  DK: { name: "Denmark", length: 18, flag: "🇩🇰" },
  DO: { name: "Dominican Republic", length: 28, flag: "🇩🇴" },
  EE: { name: "Estonia", length: 20, flag: "🇪🇪" },
  EG: { name: "Egypt", length: 29, flag: "🇪🇬" },
  ES: { name: "Spain", length: 24, flag: "🇪🇸" },
  FI: { name: "Finland", length: 18, flag: "🇫🇮" },
  FO: { name: "Faroe Islands", length: 18, flag: "🇫🇴" },
  FR: { name: "France", length: 27, flag: "🇫🇷" },
  GB: { name: "United Kingdom", length: 22, flag: "🇬🇧" },
  GE: { name: "Georgia", length: 22, flag: "🇬🇪" },
  GI: { name: "Gibraltar", length: 23, flag: "🇬🇮" },
  GL: { name: "Greenland", length: 18, flag: "🇬🇱" },
  GR: { name: "Greece", length: 27, flag: "🇬🇷" },
  GT: { name: "Guatemala", length: 28, flag: "🇬🇹" },
  HR: { name: "Croatia", length: 21, flag: "🇭🇷" },
  HU: { name: "Hungary", length: 28, flag: "🇭🇺" },
  IE: { name: "Ireland", length: 22, flag: "🇮🇪" },
  IL: { name: "Israel", length: 23, flag: "🇮🇱" },
  IM: { name: "Isle of Man", length: 22, flag: "🇮🇲" },
  IQ: { name: "Iraq", length: 23, flag: "🇮🇶" },
  IS: { name: "Iceland", length: 26, flag: "🇮🇸" },
  IT: { name: "Italy", length: 27, flag: "🇮🇹" },
  JO: { name: "Jordan", length: 30, flag: "🇯🇴" },
  KW: { name: "Kuwait", length: 30, flag: "🇰🇼" },
  KZ: { name: "Kazakhstan", length: 20, flag: "🇰🇿" },
  LB: { name: "Lebanon", length: 28, flag: "🇱🇧" },
  LI: { name: "Liechtenstein", length: 21, flag: "🇱🇮" },
  LT: { name: "Lithuania", length: 20, flag: "🇱🇹" },
  LU: { name: "Luxembourg", length: 20, flag: "🇱🇺" },
  LV: { name: "Latvia", length: 21, flag: "🇱🇻" },
  MC: { name: "Monaco", length: 27, flag: "🇲🇨" },
  MD: { name: "Moldova", length: 24, flag: "🇲🇩" },
  ME: { name: "Montenegro", length: 22, flag: "🇲🇪" },
  MK: { name: "North Macedonia", length: 19, flag: "🇲🇰" },
  MR: { name: "Mauritania", length: 27, flag: "🇲🇷" },
  MT: { name: "Malta", length: 31, flag: "🇲🇹" },
  MU: { name: "Mauritius", length: 30, flag: "🇲🇺" },
  NL: { name: "Netherlands", length: 18, flag: "🇳🇱" },
  NO: { name: "Norway", length: 15, flag: "🇳🇴" },
  PK: { name: "Pakistan", length: 24, flag: "🇵🇰" },
  PL: { name: "Poland", length: 28, flag: "🇵🇱" },
  PS: { name: "Palestine", length: 29, flag: "🇵🇸" },
  PT: { name: "Portugal", length: 25, flag: "🇵🇹" },
  QA: { name: "Qatar", length: 29, flag: "🇶🇦" },
  RO: { name: "Romania", length: 24, flag: "🇷🇴" },
  RS: { name: "Serbia", length: 22, flag: "🇷🇸" },
  SA: { name: "Saudi Arabia", length: 24, flag: "🇸🇦" },
  SC: { name: "Seychelles", length: 31, flag: "🇸🇨" },
  SE: { name: "Sweden", length: 24, flag: "🇸🇪" },
  SI: { name: "Slovenia", length: 19, flag: "🇸🇮" },
  SK: { name: "Slovakia", length: 24, flag: "🇸🇰" },
  SM: { name: "San Marino", length: 27, flag: "🇸🇲" },
  ST: { name: "Sao Tome and Principe", length: 25, flag: "🇸🇹" },
  SV: { name: "El Salvador", length: 28, flag: "🇸🇻" },
  TL: { name: "Timor-Leste", length: 23, flag: "🇹🇱" },
  TN: { name: "Tunisia", length: 24, flag: "🇹🇳" },
  TR: { name: "Turkey", length: 26, flag: "🇹🇷" },
  UA: { name: "Ukraine", length: 29, flag: "🇺🇦" },
  VA: { name: "Vatican City", length: 22, flag: "🇻🇦" },
  VG: { name: "British Virgin Islands", length: 24, flag: "🇻🇬" },
  XK: { name: "Kosovo", length: 20, flag: "🇽🇰" },
};

export function isIBAN(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  
  if (!IBAN_PATTERN.test(cleaned)) {
    return false;
  }
  
  const countryCode = cleaned.substring(0, 2);
  const countryInfo = IBAN_COUNTRIES[countryCode];
  
  if (!countryInfo) {
    return false;
  }
  
  if (cleaned.length !== countryInfo.length) {
    return false;
  }
  
  return validateIBANChecksum(cleaned);
}

function validateIBANChecksum(iban: string): boolean {
  const rearranged = iban.substring(4) + iban.substring(0, 4);
  
  let numeric = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }
  
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i])) % 97;
  }
  
  return remainder === 1;
}

export function parseIBAN(value: string): IBANData | null {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  
  if (!isIBAN(value)) {
    return null;
  }
  
  const countryCode = cleaned.substring(0, 2);
  const countryInfo = IBAN_COUNTRIES[countryCode];
  
  const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
  
  return {
    iban: cleaned,
    countryCode,
    countryName: countryInfo.name,
    flag: countryInfo.flag,
    formatted,
  };
}

const REGEX_DELIMITED_PATTERN = /^\/(.*)\/([gimsuy]*)$/;

export function isRegex(value: string): boolean {
  const trimmed = value.trim();
  
  if (REGEX_DELIMITED_PATTERN.test(trimmed)) {
    const match = trimmed.match(REGEX_DELIMITED_PATTERN);
    if (match) {
      try {
        new RegExp(match[1], match[2]);
        return true;
      } catch {
        return false;
      }
    }
  }
  
  if (trimmed.length > 0 && trimmed.length < 100) {
    const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(trimmed);
    if (hasRegexChars) {
      try {
        new RegExp(trimmed);
        return true;
      } catch {
        return false;
      }
    }
  }
  
  return false;
}

export function parseRegex(value: string): RegexData {
  const trimmed = value.trim();
  
  const delimitedMatch = trimmed.match(REGEX_DELIMITED_PATTERN);
  if (delimitedMatch) {
    try {
      new RegExp(delimitedMatch[1], delimitedMatch[2]);
      return {
        pattern: delimitedMatch[1],
        flags: delimitedMatch[2],
        isValid: true,
      };
    } catch {
      return {
        pattern: delimitedMatch[1],
        flags: delimitedMatch[2],
        isValid: false,
      };
    }
  }
  
  try {
    new RegExp(trimmed);
    return {
      pattern: trimmed,
      flags: '',
      isValid: true,
    };
  } catch {
    return {
      pattern: trimmed,
      flags: '',
      isValid: false,
    };
  }
}

export const CSS_COLOR_NAMES: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

export function isSemanticColor(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return CSS_COLOR_NAMES.hasOwnProperty(lower);
}

export function parseSemanticColor(value: string): SemanticColorData | null {
  const lower = value.trim().toLowerCase();
  const hex = CSS_COLOR_NAMES[lower];
  
  if (hex) {
    return {
      name: value.trim(),
      hex,
    };
  }
  
  return null;
}
