import { FormatConverter, ConversionResult } from "./types";
import { XmlConverter } from "./xmlConverter";
import { CsvConverter } from "./csvConverter";
import { YamlConverter } from "./yamlConverter";

export class ConverterManager {
  private converters: FormatConverter[] = [];

  constructor() {
    this.registerConverter(new XmlConverter());
    this.registerConverter(new CsvConverter());
    this.registerConverter(new YamlConverter());
  }

  registerConverter(converter: FormatConverter): void {
    this.converters.push(converter);
  }

  getConverters(): FormatConverter[] {
    return [...this.converters];
  }

  getConverterByFormat(format: string): FormatConverter | undefined {
    return this.converters.find(
      (c) => c.format.toLowerCase() === format.toLowerCase()
    );
  }

  getConverterByMimeType(mimeType: string): FormatConverter | undefined {
    return this.converters.find((c) =>
      c.mimeTypes.some(
        (mt) => mt.toLowerCase() === mimeType.toLowerCase()
      )
    );
  }

  getConverterByFileExtension(extension: string): FormatConverter | undefined {
    const normalizedExtension = extension.startsWith(".")
      ? extension.toLowerCase()
      : `.${extension.toLowerCase()}`;
    return this.converters.find((c) =>
      c.fileExtensions.some((ext) => ext.toLowerCase() === normalizedExtension)
    );
  }

  detectFormat(content: string): FormatConverter | undefined {
    return this.converters.find((converter) => converter.canConvert(content));
  }

  convertToJson(content: string, format?: string): ConversionResult {
    let converter: FormatConverter | undefined;

    if (format) {
      converter = this.getConverterByFormat(format);
    }

    if (!converter) {
      converter = this.detectFormat(content);
    }

    if (!converter) {
      try {
        JSON.parse(content);
        return {
          success: true,
          data: content,
        };
      } catch {
        return {
          success: false,
          error: "Unable to detect format. Please ensure the content is valid JSON, XML, CSV, or YAML.",
        };
      }
    }

    return converter.convert(content);
  }

  convertFromUrlResponse(
    content: string,
    contentType?: string,
    url?: string
  ): ConversionResult {
    let converter: FormatConverter | undefined;

    if (contentType) {
      const mimeType = contentType.split(";")[0].trim();
      converter = this.getConverterByMimeType(mimeType);
    }

    if (!converter && url) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        
        if (pathname.endsWith(".xml")) {
          converter = this.getConverterByFormat("xml");
        } else if (pathname.endsWith(".csv")) {
          converter = this.getConverterByFormat("csv");
        } else if (pathname.endsWith(".yaml") || pathname.endsWith(".yml")) {
          converter = this.getConverterByFormat("yaml");
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    if (!converter) {
      converter = this.detectFormat(content);
    }

    if (!converter) {
      try {
        JSON.parse(content);
        return {
          success: true,
          data: content,
        };
      } catch {
        return {
          success: false,
          error: "Unable to detect format from response. Please ensure the URL returns valid JSON, XML, CSV, or YAML.",
        };
      }
    }

    return converter.convert(content);
  }
}

export const converterManager = new ConverterManager();
