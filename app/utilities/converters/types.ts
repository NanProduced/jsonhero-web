export type ConversionResult = {
  success: boolean;
  data?: string;
  error?: string;
};

export interface FormatConverter {
  name: string;
  format: string;
  mimeTypes: string[];
  fileExtensions: string[];
  
  canConvert(content: string): boolean;
  convert(content: string): ConversionResult;
}
