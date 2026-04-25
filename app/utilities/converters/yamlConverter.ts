import { load } from "js-yaml";
import { FormatConverter, ConversionResult } from "./types";

export class YamlConverter implements FormatConverter {
  name = "YAML";
  format = "yaml";
  mimeTypes = ["text/yaml", "application/yaml", "application/x-yaml"];
  fileExtensions = [".yaml", ".yml"];

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
      
      const yamlIndicators = [
        /^---\s*$/m,
        /^\s*-\s+\S/m,
        /^\s*[\w-]+:\s*/m,
        /^\s*[\w-]+:\s*\|/m,
        /^\s*[\w-]+:\s*>/m,
      ];
      
      const hasYamlIndicator = yamlIndicators.some(pattern => pattern.test(trimmed));
      
      if (!hasYamlIndicator) {
        return false;
      }
      
      try {
        const result = load(trimmed);
        return result !== undefined;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  convert(content: string): ConversionResult {
    try {
      const data = load(content);
      
      if (data === undefined) {
        return {
          success: false,
          error: "YAML content is empty or undefined",
        };
      }
      
      return {
        success: true,
        data: JSON.stringify(data, (key, value) => {
          if (typeof value === "bigint") {
            return value.toString();
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }, 2),
      };
    } catch (error) {
      let errorMessage = "Unknown YAML conversion error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === "YAMLException") {
          errorMessage = `YAML parsing error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
