import { getHexFromColorName, isValidCssColorName } from "./cssColorNames";
import { getCountryInfo, ibanCountryData } from "./ibanCountryData";
import type {
  CustomRecognitionResult,
  GeoCoordinateResult,
  IBANResult,
  ISBNResult,
  RegexResult,
  SemanticColorResult,
} from "./types";

export function recognizeGeoCoordinate(value: string): GeoCoordinateResult | null {
  const trimmed = value.trim();

  const latLngNamedPattern =
    /^\s*(?:lat|latitude)\s*[:=]\s*(-?\d+\.?\d*)\s*[,;]?\s*(?:lng|lon|longitude)\s*[:=]\s*(-?\d+\.?\d*)\s*$/i;
  const namedMatch = trimmed.match(latLngNamedPattern);
  if (namedMatch) {
    const lat = parseFloat(namedMatch[1]);
    const lng = parseFloat(namedMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        type: "geoCoordinate",
        latitude: lat,
        longitude: lng,
        variant: "latLngNamed",
      };
    }
  }

  const lngLatNamedPattern =
    /^\s*(?:lng|lon|longitude)\s*[:=]\s*(-?\d+\.?\d*)\s*[,;]?\s*(?:lat|latitude)\s*[:=]\s*(-?\d+\.?\d*)\s*$/i;
  const lngNamedMatch = trimmed.match(lngLatNamedPattern);
  if (lngNamedMatch) {
    const lng = parseFloat(lngNamedMatch[1]);
    const lat = parseFloat(lngNamedMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        type: "geoCoordinate",
        latitude: lat,
        longitude: lng,
        variant: "latLngNamed",
      };
    }
  }

  const commaPattern = /^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/;
  const commaMatch = trimmed.match(commaPattern);
  if (commaMatch) {
    const lat = parseFloat(commaMatch[1]);
    const lng = parseFloat(commaMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        type: "geoCoordinate",
        latitude: lat,
        longitude: lng,
        variant: "latLngComma",
      };
    }
  }

  const spacePattern = /^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/;
  const spaceMatch = trimmed.match(spacePattern);
  if (spaceMatch) {
    const lat = parseFloat(spaceMatch[1]);
    const lng = parseFloat(spaceMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        type: "geoCoordinate",
        latitude: lat,
        longitude: lng,
        variant: "latLngSpace",
      };
    }
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function recognizeISBN(value: string): ISBNResult | null {
  const trimmed = value.trim().replace(/[\s-]/g, "");

  if (/^\d{13}$/.test(trimmed)) {
    if (isValidISBN13(trimmed)) {
      return {
        type: "isbn",
        isbn: trimmed,
        variant: "isbn13",
      };
    }
  }

  if (/^\d{9}[\dX]$/i.test(trimmed)) {
    if (isValidISBN10(trimmed)) {
      return {
        type: "isbn",
        isbn: trimmed,
        variant: "isbn10",
      };
    }
  }

  return null;
}

function isValidISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }

  const lastChar = isbn[9].toUpperCase();
  const lastDigit = lastChar === "X" ? 10 : parseInt(lastChar, 10);
  if (isNaN(lastDigit)) return false;

  sum += lastDigit;
  return sum % 11 === 0;
}

function isValidISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = parseInt(isbn[12], 10);
  if (isNaN(checkDigit)) return false;

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return checkDigit === calculatedCheck;
}

export function recognizeIBAN(value: string): IBANResult | null {
  const trimmed = value.trim().replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(trimmed)) {
    return null;
  }

  const countryCode = trimmed.substring(0, 2);
  const countryInfo = getCountryInfo(countryCode);

  if (!countryInfo) {
    return {
      type: "iban",
      iban: trimmed,
      countryCode,
      valid: false,
    };
  }

  if (trimmed.length !== countryInfo.length) {
    return {
      type: "iban",
      iban: trimmed,
      countryCode,
      valid: false,
    };
  }

  const isValid = validateIBANChecksum(trimmed);

  let bankCode: string | undefined;
  let accountNumber: string | undefined;

  if (countryInfo.bankCodeStart !== undefined && countryInfo.bankCodeEnd !== undefined) {
    bankCode = trimmed.substring(countryInfo.bankCodeStart, countryInfo.bankCodeEnd);
  }

  if (countryInfo.accountNumberStart !== undefined && countryInfo.accountNumberEnd !== undefined) {
    accountNumber = trimmed.substring(countryInfo.accountNumberStart, countryInfo.accountNumberEnd);
  }

  return {
    type: "iban",
    iban: trimmed,
    countryCode,
    bankCode,
    accountNumber,
    valid: isValid,
  };
}

function validateIBANChecksum(iban: string): boolean {
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  let numeric = "";
  for (const char of rearranged) {
    if (char >= "A" && char <= "Z") {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }

  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i], 10)) % 97;
  }

  return remainder === 1;
}

export function recognizeRegex(value: string): RegexResult | null {
  const trimmed = value.trim();

  const regexLiteralPattern = /^\/(.*)\/([gimsuy]*)$/;
  const literalMatch = trimmed.match(regexLiteralPattern);

  if (literalMatch) {
    const pattern = literalMatch[1];
    const flags = literalMatch[2] || undefined;

    try {
      new RegExp(pattern, flags);
      return {
        type: "regex",
        pattern,
        flags,
      };
    } catch {
      return null;
    }
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    try {
      new RegExp(trimmed);
      const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(trimmed);
      if (hasRegexChars) {
        return {
          type: "regex",
          pattern: trimmed,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function recognizeSemanticColor(value: string): SemanticColorResult | null {
  const trimmed = value.trim().toLowerCase();

  if (isValidCssColorName(trimmed)) {
    const hexValue = getHexFromColorName(trimmed);
    if (hexValue) {
      return {
        type: "semanticColor",
        colorName: trimmed,
        hexValue,
      };
    }
  }

  return null;
}

export function recognizeCustomFormat(value: string): CustomRecognitionResult | null {
  const semanticColor = recognizeSemanticColor(value);
  if (semanticColor) return semanticColor;

  const isbn = recognizeISBN(value);
  if (isbn) return isbn;

  const iban = recognizeIBAN(value);
  if (iban) return iban;

  const geoCoordinate = recognizeGeoCoordinate(value);
  if (geoCoordinate) return geoCoordinate;

  const regex = recognizeRegex(value);
  if (regex) return regex;

  return null;
}

export { ibanCountryData };
export type { IBANCountryInfo } from "./ibanCountryData";
