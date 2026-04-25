import { FormatConverter, ConversionResult } from "./types";
import convertFromRawXml from "../xml/convertFromRawXml";
import isXML from "../xml/isXML";

export class XmlConverter implements FormatConverter {
  name = "XML";
  format = "xml";
  mimeTypes = ["application/xml", "text/xml"];
  fileExtensions = [".xml"];

  canConvert(content: string): boolean {
    try {
      return isXML(content);
    } catch {
      return false;
    }
  }

  convert(content: string): ConversionResult {
    try {
      const result = convertFromRawXml(content);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown XML conversion error",
      };
    }
  }
}
