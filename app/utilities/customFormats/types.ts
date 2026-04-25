export type GeoCoordinateFormat = {
  name: "geoCoordinate";
  latitude: number;
  longitude: number;
  variant: "latLngComma" | "latLngSpace" | "latLngNamed";
};

export type ISBNFormat = {
  name: "isbn";
  isbn: string;
  variant: "isbn10" | "isbn13";
};

export type IBANFormat = {
  name: "iban";
  iban: string;
  countryCode: string;
  bankCode?: string;
  accountNumber?: string;
  valid: boolean;
};

export type RegexFormat = {
  name: "regex";
  pattern: string;
  flags?: string;
};

export type SemanticColorFormat = {
  name: "semanticColor";
  colorName: string;
  hexValue: string;
};

export type CustomStringFormat =
  | GeoCoordinateFormat
  | ISBNFormat
  | IBANFormat
  | RegexFormat
  | SemanticColorFormat;

export interface GeoCoordinateResult {
  type: "geoCoordinate";
  latitude: number;
  longitude: number;
  variant: "latLngComma" | "latLngSpace" | "latLngNamed";
}

export interface ISBNResult {
  type: "isbn";
  isbn: string;
  variant: "isbn10" | "isbn13";
}

export interface IBANResult {
  type: "iban";
  iban: string;
  countryCode: string;
  bankCode?: string;
  accountNumber?: string;
  valid: boolean;
}

export interface RegexResult {
  type: "regex";
  pattern: string;
  flags?: string;
}

export interface SemanticColorResult {
  type: "semanticColor";
  colorName: string;
  hexValue: string;
}

export type CustomRecognitionResult =
  | GeoCoordinateResult
  | ISBNResult
  | IBANResult
  | RegexResult
  | SemanticColorResult;
