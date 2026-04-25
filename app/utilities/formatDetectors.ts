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
  format: "decimal" | "dms";
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
  flagUrl: string;
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

function dmsToDecimal(
  degrees: number,
  minutes: number = 0,
  seconds: number = 0,
  direction: string = "N"
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === "S" || direction === "W") {
    decimal = -decimal;
  }
  return decimal;
}

const GEOLOCATION_PATTERNS: Array<{
  pattern: RegExp;
  parser: (match: RegExpMatchArray) => { lat: number; lng: number; format: "decimal" | "dms" } | null;
}> = [
  {
    pattern: /^(-?\d+\.?\d*)\s*[,，]\s*(-?\d+\.?\d*)$/,
    parser: (match) => {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, format: "decimal" as const };
      }
      return null;
    },
  },
  {
    pattern: /^(-?\d+\.?\d*)°?\s*([NSns])?\s*[,，]\s*(-?\d+\.?\d*)°?\s*([EWew])?$/,
    parser: (match) => {
      let lat = parseFloat(match[1]);
      let lng = parseFloat(match[3]);
      
      if (match[2] && match[2].toUpperCase() === 'S') lat = -Math.abs(lat);
      if (match[4] && match[4].toUpperCase() === 'W') lng = -Math.abs(lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, format: "decimal" as const };
      }
      return null;
    },
  },
  {
    pattern: /^(\d+)°\s*(\d+)'?\s*(\d+\.?\d*)?["”]?\s*([NSns])?\s*[,，]\s*(\d+)°\s*(\d+)'?\s*(\d+\.?\d*)?["”]?\s*([EWew])?$/,
    parser: (match) => {
      const latDeg = parseInt(match[1]);
      const latMin = parseInt(match[2]);
      const latSec = match[3] ? parseFloat(match[3]) : 0;
      const latDir = match[4]?.toUpperCase() || "N";
      
      const lngDeg = parseInt(match[5]);
      const lngMin = parseInt(match[6]);
      const lngSec = match[7] ? parseFloat(match[7]) : 0;
      const lngDir = match[8]?.toUpperCase() || "E";
      
      const lat = dmsToDecimal(latDeg, latMin, latSec, latDir);
      const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, format: "dms" as const };
      }
      return null;
    },
  },
  {
    pattern: /^(\d+)°\s*(\d+\.?\d*)'?\s*([NSns])?\s*[,，]\s*(\d+)°\s*(\d+\.?\d*)'?\s*([EWew])?$/,
    parser: (match) => {
      const latDeg = parseInt(match[1]);
      const latMin = parseFloat(match[2]);
      const latDir = match[3]?.toUpperCase() || "N";
      
      const lngDeg = parseInt(match[4]);
      const lngMin = parseFloat(match[5]);
      const lngDir = match[6]?.toUpperCase() || "E";
      
      const lat = dmsToDecimal(latDeg, latMin, 0, latDir);
      const lng = dmsToDecimal(lngDeg, lngMin, 0, lngDir);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, format: "dms" as const };
      }
      return null;
    },
  },
];

export function isGeolocation(value: string): boolean {
  const trimmed = value.trim();
  for (const { pattern, parser } of GEOLOCATION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const result = parser(match);
      if (result) {
        return (
          result.lat >= -90 &&
          result.lat <= 90 &&
          result.lng >= -180 &&
          result.lng <= 180
        );
      }
    }
  }
  return false;
}

export function parseGeolocation(value: string): GeolocationData | null {
  const trimmed = value.trim();
  
  for (const { pattern, parser } of GEOLOCATION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const result = parser(match);
      if (result) {
        return {
          latitude: result.lat,
          longitude: result.lng,
          original: trimmed,
          format: result.format,
        };
      }
    }
  }
  
  return null;
}

const ISBN_RAW_PATTERN = /^(?:ISBN(?:-1[03])?:?\s*)?([\dX-]{10,})$/i;
const ISBN10_CLEAN = /^\d{9}[\dX]$/i;
const ISBN13_CLEAN = /^97[89]\d{10}$/;

export function isISBN(value: string): boolean {
  const match = value.trim().match(ISBN_RAW_PATTERN);
  if (!match) return false;
  
  const cleaned = match[1].replace(/[-\s]/g, '').toUpperCase();
  
  if (ISBN13_CLEAN.test(cleaned)) {
    return validateISBN13(cleaned);
  }
  if (ISBN10_CLEAN.test(cleaned)) {
    return validateISBN10(cleaned);
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
  const match = value.trim().match(ISBN_RAW_PATTERN);
  if (!match) return null;
  
  const cleaned = match[1].replace(/[-\s]/g, '').toUpperCase();
  
  let isbn10: string | undefined;
  let isbn13: string | undefined;
  let type: "ISBN-10" | "ISBN-13";
  
  if (ISBN13_CLEAN.test(cleaned) && validateISBN13(cleaned)) {
    isbn13 = cleaned;
    type = "ISBN-13";
  } else if (ISBN10_CLEAN.test(cleaned) && validateISBN10(cleaned)) {
    isbn10 = cleaned;
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

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/i;

export interface IBANCountryInfo {
  name: string;
  length: number;
  flag: string;
  color: string;
}

export const IBAN_COUNTRIES: Record<string, IBANCountryInfo> = {
  AD: { name: "Andorra", length: 24, flag: "🇦🇩", color: "#10069F" },
  AE: { name: "United Arab Emirates", length: 23, flag: "🇦🇪", color: "#00732F" },
  AL: { name: "Albania", length: 28, flag: "🇦🇱", color: "#CC0033" },
  AT: { name: "Austria", length: 20, flag: "🇦🇹", color: "#ED2939" },
  AZ: { name: "Azerbaijan", length: 28, flag: "🇦🇿", color: "#00B5E2" },
  BA: { name: "Bosnia and Herzegovina", length: 20, flag: "🇧🇦", color: "#002395" },
  BE: { name: "Belgium", length: 16, flag: "🇧🇪", color: "#FAE042" },
  BG: { name: "Bulgaria", length: 22, flag: "🇧🇬", color: "#00966E" },
  BH: { name: "Bahrain", length: 22, flag: "🇧🇭", color: "#CE1126" },
  BI: { name: "Burundi", length: 27, flag: "🇧🇮", color: "#CE1126" },
  BR: { name: "Brazil", length: 29, flag: "🇧🇷", color: "#009C3B" },
  BY: { name: "Belarus", length: 28, flag: "🇧🇾", color: "#D22730" },
  CH: { name: "Switzerland", length: 21, flag: "🇨🇭", color: "#FF0000" },
  CR: { name: "Costa Rica", length: 22, flag: "🇨🇷", color: "#002B7F" },
  CY: { name: "Cyprus", length: 28, flag: "🇨🇾", color: "#D47500" },
  CZ: { name: "Czech Republic", length: 24, flag: "🇨🇿", color: "#D7141A" },
  DE: { name: "Germany", length: 22, flag: "🇩🇪", color: "#000000" },
  DK: { name: "Denmark", length: 18, flag: "🇩🇰", color: "#C8102E" },
  DJ: { name: "Djibouti", length: 27, flag: "🇩🇯", color: "#6AB2E7" },
  DO: { name: "Dominican Republic", length: 28, flag: "🇩🇴", color: "#00247D" },
  EE: { name: "Estonia", length: 20, flag: "🇪🇪", color: "#0072CE" },
  EG: { name: "Egypt", length: 29, flag: "🇪🇬", color: "#CE1126" },
  ES: { name: "Spain", length: 24, flag: "🇪🇸", color: "#AA151B" },
  FI: { name: "Finland", length: 18, flag: "🇫🇮", color: "#002F6C" },
  FK: { name: "Falkland Islands", length: 18, flag: "🇫🇰", color: "#00247D" },
  FO: { name: "Faroe Islands", length: 18, flag: "🇫🇴", color: "#005EB8" },
  FR: { name: "France", length: 27, flag: "🇫🇷", color: "#002395" },
  GA: { name: "Gabon", length: 27, flag: "🇬🇦", color: "#3E913B" },
  GB: { name: "United Kingdom", length: 22, flag: "🇬🇧", color: "#012169" },
  GE: { name: "Georgia", length: 22, flag: "🇬🇪", color: "#FFFFFF" },
  GI: { name: "Gibraltar", length: 23, flag: "🇬🇮", color: "#002D81" },
  GL: { name: "Greenland", length: 18, flag: "🇬🇱", color: "#FFFFFF" },
  GR: { name: "Greece", length: 27, flag: "🇬🇷", color: "#0D5EAF" },
  GT: { name: "Guatemala", length: 28, flag: "🇬🇹", color: "#4997D0" },
  HN: { name: "Honduras", length: 28, flag: "🇭🇳", color: "#002B7F" },
  HR: { name: "Croatia", length: 21, flag: "🇭🇷", color: "#FF0000" },
  HU: { name: "Hungary", length: 28, flag: "🇭🇺", color: "#CD2A3E" },
  IE: { name: "Ireland", length: 22, flag: "🇮🇪", color: "#009A49" },
  IL: { name: "Israel", length: 23, flag: "🇮🇱", color: "#0038B8" },
  IM: { name: "Isle of Man", length: 22, flag: "🇮🇲", color: "#C8102E" },
  IQ: { name: "Iraq", length: 23, flag: "🇮🇶", color: "#CE1126" },
  IS: { name: "Iceland", length: 26, flag: "🇮🇸", color: "#02529C" },
  IT: { name: "Italy", length: 27, flag: "🇮🇹", color: "#009246" },
  JO: { name: "Jordan", length: 30, flag: "🇯🇴", color: "#007A3D" },
  KW: { name: "Kuwait", length: 30, flag: "🇰🇼", color: "#007A3D" },
  KZ: { name: "Kazakhstan", length: 20, flag: "🇰🇿", color: "#00AFCA" },
  LB: { name: "Lebanon", length: 28, flag: "🇱🇧", color: "#ED1C24" },
  LC: { name: "Saint Lucia", length: 32, flag: "🇱🇨", color: "#87CEEB" },
  LI: { name: "Liechtenstein", length: 21, flag: "🇱🇮", color: "#002395" },
  LT: { name: "Lithuania", length: 20, flag: "🇱🇹", color: "#006A44" },
  LU: { name: "Luxembourg", length: 20, flag: "🇱🇺", color: "#00A3E0" },
  LV: { name: "Latvia", length: 21, flag: "🇱🇻", color: "#9E3039" },
  LY: { name: "Libya", length: 25, flag: "🇱🇾", color: "#239E46" },
  MC: { name: "Monaco", length: 27, flag: "🇲🇨", color: "#CE1126" },
  MD: { name: "Moldova", length: 24, flag: "🇲🇩", color: "#0051BA" },
  ME: { name: "Montenegro", length: 22, flag: "🇲🇪", color: "#C40308" },
  MK: { name: "North Macedonia", length: 19, flag: "🇲🇰", color: "#D20000" },
  MN: { name: "Mongolia", length: 20, flag: "🇲🇳", color: "#DA291C" },
  MR: { name: "Mauritania", length: 27, flag: "🇲🇷", color: "#006400" },
  MT: { name: "Malta", length: 31, flag: "🇲🇹", color: "#CF142B" },
  MU: { name: "Mauritius", length: 30, flag: "🇲🇺", color: "#EA2839" },
  NL: { name: "Netherlands", length: 18, flag: "🇳🇱", color: "#AE1C28" },
  NO: { name: "Norway", length: 15, flag: "🇳🇴", color: "#BA0C2F" },
  PK: { name: "Pakistan", length: 24, flag: "🇵🇰", color: "#01411C" },
  PL: { name: "Poland", length: 28, flag: "🇵🇱", color: "#DC143C" },
  PS: { name: "Palestine", length: 29, flag: "🇵🇸", color: "#007A3D" },
  PT: { name: "Portugal", length: 25, flag: "🇵🇹", color: "#006600" },
  QA: { name: "Qatar", length: 29, flag: "🇶🇦", color: "#8D1B3D" },
  RO: { name: "Romania", length: 24, flag: "🇷🇴", color: "#002B7F" },
  RS: { name: "Serbia", length: 22, flag: "🇷🇸", color: "#0C4076" },
  RU: { name: "Russia", length: 33, flag: "🇷🇺", color: "#D52B1E" },
  SA: { name: "Saudi Arabia", length: 24, flag: "🇸🇦", color: "#006C35" },
  SC: { name: "Seychelles", length: 31, flag: "🇸🇨", color: "#003A8C" },
  SD: { name: "Sudan", length: 18, flag: "🇸🇩", color: "#D21034" },
  SE: { name: "Sweden", length: 24, flag: "🇸🇪", color: "#004B87" },
  SI: { name: "Slovenia", length: 19, flag: "🇸🇮", color: "#0057A8" },
  SK: { name: "Slovakia", length: 24, flag: "🇸🇰", color: "#02468C" },
  SM: { name: "San Marino", length: 27, flag: "🇸🇲", color: "#5E96D0" },
  ST: { name: "Sao Tome and Principe", length: 25, flag: "🇸🇹", color: "#129647" },
  SV: { name: "El Salvador", length: 28, flag: "🇸🇻", color: "#003893" },
  TL: { name: "Timor-Leste", length: 23, flag: "🇹🇱", color: "#FF0000" },
  TN: { name: "Tunisia", length: 24, flag: "🇹🇳", color: "#E70013" },
  TR: { name: "Turkey", length: 26, flag: "🇹🇷", color: "#E30A17" },
  UA: { name: "Ukraine", length: 29, flag: "🇺🇦", color: "#005BBB" },
  VA: { name: "Vatican City", length: 22, flag: "🇻🇦", color: "#FFE600" },
  VG: { name: "British Virgin Islands", length: 24, flag: "🇻🇬", color: "#00247D" },
  XK: { name: "Kosovo", length: 20, flag: "🇽🇰", color: "#1A52B1" },
};

export const ISO_COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan",
  AX: "Åland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AI: "Anguilla",
  AQ: "Antarctica",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia",
  BQ: "Bonaire, Sint Eustatius and Saba",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BV: "Bouvet Island",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cabo Verde",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo, Democratic Republic of the",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Côte d'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CW: "Curaçao",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  SZ: "Eswatini",
  ET: "Ethiopia",
  FK: "Falkland Islands",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  TF: "French Southern Territories",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HM: "Heard Island and McDonald Islands",
  VA: "Vatican City",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "Korea, Democratic People's Republic of",
  KR: "Korea, Republic of",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Lao People's Democratic Republic",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  MK: "North Macedonia",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestine",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PN: "Pitcairn",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RU: "Russia",
  RW: "Rwanda",
  BL: "Saint Barthélemy",
  SH: "Saint Helena",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  MF: "Saint Martin",
  PM: "Saint Pierre and Miquelon",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SX: "Sint Maarten",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  GS: "South Georgia and the South Sandwich Islands",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard and Jan Mayen",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UM: "United States Minor Outlying Islands",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela",
  VN: "Viet Nam",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  WF: "Wallis and Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
  XK: "Kosovo",
};

export function getFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

export function isIBAN(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  
  if (!IBAN_PATTERN.test(cleaned)) {
    return false;
  }
  
  const countryCode = cleaned.substring(0, 2);
  const countryInfo = IBAN_COUNTRIES[countryCode];
  
  if (countryInfo) {
    if (cleaned.length !== countryInfo.length) {
      return false;
    }
  } else {
    if (cleaned.length < 15 || cleaned.length > 34) {
      return false;
    }
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
  
  const countryName = countryInfo?.name || ISO_COUNTRY_NAMES[countryCode] || countryCode;
  const flag = countryInfo?.flag || "";
  const flagUrl = getFlagUrl(countryCode);
  
  const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
  
  return {
    iban: cleaned,
    countryCode,
    countryName,
    flag,
    formatted,
    flagUrl,
  };
}

const REGEX_DELIMITED_PATTERN = /^\/(.*)\/([gimsuy]*)$/s;

const STRONG_REGEX_INDICATORS = [
  /\^/,
  /\$/,
  /\*/,
  /\+/,
  /\?[^a-zA-Z0-9]/,
  /\[.*\]/,
  /\(.*\)/,
  /\{.*\}/,
  /\|/,
  /\\[dDwWsSbB]/,
  /\\[\\^$.|?*+()\[\]{}]/,
];

const LIKELY_NON_REGEX_PATTERNS = [
  /^v?\d+\.\d+(\.\d+)?([-.][a-zA-Z0-9]+)?$/,
  /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/,
  /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/,
  /^[a-zA-Z0-9_]+$/,
];

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
  
  for (const pattern of LIKELY_NON_REGEX_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  
  let hasStrongIndicator = false;
  for (const indicator of STRONG_REGEX_INDICATORS) {
    if (indicator.test(trimmed)) {
      hasStrongIndicator = true;
      break;
    }
  }
  
  if (!hasStrongIndicator) {
    return false;
  }
  
  try {
    new RegExp(trimmed);
    return true;
  } catch {
    return false;
  }
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
