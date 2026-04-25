import Papa from "papaparse";
import { FormatConverter, ConversionResult } from "./types";

interface ParseResult {
  data: any[];
  errors: any[];
  meta: any;
}

export class CsvConverter implements FormatConverter {
  name = "CSV";
  format = "csv";
  mimeTypes = ["text/csv", "application/csv"];
  fileExtensions = [".csv"];

  canConvert(content: string): boolean {
    try {
      if (!content || content.trim().length === 0) {
        return false;
      }
      
      const trimmed = content.trim();
      
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        return false;
      }
      
      if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
        return false;
      }
      
      const lines = trimmed.split(/\r?\n/);
      if (lines.length < 2) {
        return false;
      }
      
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      
      if (commaCount > 0 && commaCount >= lines.length - 1) {
        return true;
      }
      
      if (tabCount > 0 && tabCount >= lines.length - 1) {
        return true;
      }
      
      if (commaCount > 0) {
        const sample = lines.slice(0, Math.min(5, lines.length));
        const consistent = sample.every(line => {
          const lineCommas = (line.match(/,/g) || []).length;
          return lineCommas === commaCount || lineCommas === 0;
        });
        return consistent;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  convert(content: string): ConversionResult {
    try {
      const result = (Papa.parse as any)(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      }) as ParseResult;

      const hasFatalErrors = (result.errors || []).filter(
        (err: any) => err.code !== "TooManyFields" && err.code !== "TooFewFields"
      );

      if (hasFatalErrors.length > 0) {
        const errorMessages = hasFatalErrors.slice(0, 5).map((err: any) => 
          `Row ${err.row}: ${err.message}`
        ).join("; ");
        
        return {
          success: false,
          error: `CSV parsing errors: ${errorMessages}`,
        };
      }

      const jsonData = result.data || [];
      
      return {
        success: true,
        data: JSON.stringify(jsonData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown CSV conversion error",
      };
    }
  }
}
