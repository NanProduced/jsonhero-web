import Ajv from "ajv";
import addFormats from "ajv-formats";
import { JSONSchema7 } from "json-schema";

export interface FieldFrequency {
  fieldName: string;
  frequency: number;
  totalCount: number;
  presentCount: number;
}

export interface SchemaValidationError {
  path: string;
  message: string;
  keyword: string;
  params: Record<string, unknown>;
  schemaPath?: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  errorCount: number;
}

export interface FieldFrequencyResult {
  path: string;
  frequencies: FieldFrequency[];
  totalItems: number;
}

export function calculateFieldFrequencies(data: unknown): FieldFrequencyResult[] {
  const results: FieldFrequencyResult[] = [];

  function processValue(value: unknown, currentPath: string): void {
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
        const frequencies = calculateArrayFieldFrequencies(value);
        results.push({
          path: currentPath,
          frequencies,
          totalItems: value.length,
        });

        value.forEach((item, index) => {
          processValue(item, `${currentPath}[${index}]`);
        });
      }
    } else if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      Object.entries(obj).forEach(([key, val]) => {
        processValue(val, currentPath === "$" ? `$.${key}` : `${currentPath}.${key}`);
      });
    }
  }

  processValue(data, "$");
  return results;
}

function calculateArrayFieldFrequencies(array: unknown[]): FieldFrequency[] {
  const fieldCounts: Map<string, number> = new Map();
  const totalItems = array.length;

  array.forEach((item) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      Object.keys(obj).forEach((key) => {
        fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1);
      });
    }
  });

  const frequencies: FieldFrequency[] = [];
  fieldCounts.forEach((count, fieldName) => {
    frequencies.push({
      fieldName,
      frequency: totalItems > 0 ? (count / totalItems) * 100 : 0,
      totalCount: totalItems,
      presentCount: count,
    });
  });

  return frequencies.sort((a, b) => b.frequency - a.frequency);
}

export function createAjvValidator(): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

export function validateAgainstSchema(
  data: unknown,
  schema: JSONSchema7,
  ajvInstance?: Ajv
): SchemaValidationResult {
  const ajv = ajvInstance || createAjvValidator();

  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      return {
        valid: true,
        errors: [],
        errorCount: 0,
      };
    }

    const errors: SchemaValidationError[] = (validate.errors || []).map((error) => ({
      path: jsonPointerToPath(error.instancePath),
      message: error.message || "Validation error",
      keyword: error.keyword,
      params: error.params,
      schemaPath: error.schemaPath,
    }));

    return {
      valid: false,
      errors,
      errorCount: errors.length,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: "$",
          message: error instanceof Error ? error.message : "Invalid schema",
          keyword: "schema",
          params: {},
        },
      ],
      errorCount: 1,
    };
  }
}

function jsonPointerToPath(pointer: string): string {
  if (!pointer || pointer === "") {
    return "$";
  }

  const parts = pointer
    .replace(/^\//, "")
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));

  let result = "$";
  parts.forEach((part) => {
    if (/^\d+$/.test(part)) {
      result += `[${part}]`;
    } else {
      result += `.${part}`;
    }
  });

  return result;
}

export function getErrorsForPath(
  errors: SchemaValidationError[],
  path: string
): SchemaValidationError[] {
  return errors.filter((error) => {
    if (error.path === path) {
      return true;
    }
    if (error.path.startsWith(path + ".") || error.path.startsWith(path + "[")) {
      return true;
    }
    return false;
  });
}

export function hasErrorsAtPath(errors: SchemaValidationError[], path: string): boolean {
  return errors.some((error) => {
    if (error.path === path) {
      return true;
    }
    if (error.path.startsWith(path + ".") || error.path.startsWith(path + "[")) {
      return true;
    }
    return false;
  });
}

export function parseSchema(schemaString: string): JSONSchema7 | null {
  try {
    const schema = JSON.parse(schemaString) as JSONSchema7;
    if (typeof schema === "object" && schema !== null) {
      return schema;
    }
    return null;
  } catch {
    return null;
  }
}
