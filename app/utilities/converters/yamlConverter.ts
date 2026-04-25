import yaml from "js-yaml";
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
        /^\s*-\s+\w/m,
        /^\s*\w+:\s*/m,
        /^\s*\w+:\s*\|/m,
        /^\s*\w+:\s*>/m,
      ];
      
      const hasYamlIndicator = yamlIndicators.some(pattern => pattern.test(trimmed));
      
      if (!hasYamlIndicator) {
        return false;
      }
      
      try {
        yaml.load(trimmed);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  convert(content: string): ConversionResult {
    try {
      const data = yaml.load(content);
      
      if (data === undefined || data === null) {
        return {
          success: false,
          error: "YAML content is empty or null",
        };
      }
      
      return {
        success: true,
        data: JSON.stringify(data, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown YAML conversion error",
      };
    }
  }
}
