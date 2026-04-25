import { JSONSchema7 } from "json-schema";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import invariant from "tiny-invariant";
import { useJson } from "~/hooks/useJson";
import {
  FieldFrequency,
  FieldFrequencyResult,
  SchemaValidationError,
  SchemaValidationResult,
  calculateFieldFrequencies,
  validateAgainstSchema,
  parseSchema,
  hasErrorsAtPath,
  getErrorsForPath,
  findArrayFrequencyForField,
  findParentArrayPath,
} from "~/utilities/schemaUtils";

export type ValidationMode = "inferred" | "external";

export interface SchemaValidationState {
  validationMode: ValidationMode;
  externalSchema: JSONSchema7 | null;
  externalSchemaString: string;
  validationResult: SchemaValidationResult | null;
  fieldFrequencies: FieldFrequencyResult[];
  isSchemaValid: boolean;
  schemaError: string | null;
}

export interface SchemaValidationAPI {
  setValidationMode: (mode: ValidationMode) => void;
  setExternalSchema: (schema: JSONSchema7 | null) => void;
  setExternalSchemaString: (schemaString: string) => void;
  loadExternalSchema: (schemaString: string) => boolean;
  revalidate: () => void;
  clearExternalSchema: () => void;
  getErrorsForPath: (path: string) => SchemaValidationError[];
  hasErrorsAtPath: (path: string) => boolean;
  getFrequencyForPath: (path: string) => FieldFrequencyResult | undefined;
  findArrayFrequencyForField: (path: string) => FieldFrequency | null;
  findParentArrayPath: (path: string) => string | null;
}

type SchemaValidationContextType = {
  state: SchemaValidationState;
  api: SchemaValidationAPI;
};

const SchemaValidationContext = createContext<SchemaValidationContextType | undefined>(
  undefined
);

export function SchemaValidationProvider({ children }: { children: ReactNode }) {
  const [json] = useJson();
  const [validationMode, setValidationModeState] = useState<ValidationMode>("inferred");
  const [externalSchema, setExternalSchema] = useState<JSONSchema7 | null>(null);
  const [externalSchemaString, setExternalSchemaString] = useState<string>("");
  const [validationResult, setValidationResult] = useState<SchemaValidationResult | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const fieldFrequencies = useMemo(() => {
    return calculateFieldFrequencies(json);
  }, [json]);

  const isSchemaValid = useMemo(() => {
    return externalSchema !== null;
  }, [externalSchema]);

  const runValidation = useCallback(() => {
    if (validationMode === "external" && externalSchema) {
      const result = validateAgainstSchema(json, externalSchema);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [json, validationMode, externalSchema]);

  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const setValidationMode = useCallback(
    (mode: ValidationMode) => {
      setValidationModeState(mode);
    },
    []
  );

  const loadExternalSchema = useCallback(
    (schemaString: string): boolean => {
      setExternalSchemaString(schemaString);
      const schema = parseSchema(schemaString);

      if (schema === null) {
        setSchemaError("Invalid JSON Schema format");
        setExternalSchema(null);
        return false;
      }

      setSchemaError(null);
      setExternalSchema(schema);
      setValidationModeState("external");
      return true;
    },
    []
  );

  const clearExternalSchema = useCallback(() => {
    setExternalSchema(null);
    setExternalSchemaString("");
    setValidationResult(null);
    setSchemaError(null);
    setValidationModeState("inferred");
  }, []);

  const revalidate = useCallback(() => {
    runValidation();
  }, [runValidation]);

  const getErrorsForPathFn = useCallback(
    (path: string): SchemaValidationError[] => {
      if (!validationResult || validationResult.errors.length === 0) {
        return [];
      }
      return getErrorsForPath(validationResult.errors, path);
    },
    [validationResult]
  );

  const hasErrorsAtPathFn = useCallback(
    (path: string): boolean => {
      if (!validationResult || validationResult.errors.length === 0) {
        return false;
      }
      return hasErrorsAtPath(validationResult.errors, path);
    },
    [validationResult]
  );

  const getFrequencyForPath = useCallback(
    (path: string): FieldFrequencyResult | undefined => {
      return fieldFrequencies.find((f) => f.path === path);
    },
    [fieldFrequencies]
  );

  const findArrayFrequencyForFieldFn = useCallback(
    (path: string): FieldFrequency | null => {
      return findArrayFrequencyForField(fieldFrequencies, path);
    },
    [fieldFrequencies]
  );

  const findParentArrayPathFn = useCallback(
    (path: string): string | null => {
      return findParentArrayPath(fieldFrequencies, path);
    },
    [fieldFrequencies]
  );

  const api: SchemaValidationAPI = useMemo(
    () => ({
      setValidationMode,
      setExternalSchema,
      setExternalSchemaString,
      loadExternalSchema,
      revalidate,
      clearExternalSchema,
      getErrorsForPath: getErrorsForPathFn,
      hasErrorsAtPath: hasErrorsAtPathFn,
      getFrequencyForPath,
      findArrayFrequencyForField: findArrayFrequencyForFieldFn,
      findParentArrayPath: findParentArrayPathFn,
    }),
    [
      setValidationMode,
      loadExternalSchema,
      revalidate,
      clearExternalSchema,
      getErrorsForPathFn,
      hasErrorsAtPathFn,
      getFrequencyForPath,
      findArrayFrequencyForFieldFn,
      findParentArrayPathFn,
    ]
  );

  const state: SchemaValidationState = useMemo(
    () => ({
      validationMode,
      externalSchema,
      externalSchemaString,
      validationResult,
      fieldFrequencies,
      isSchemaValid,
      schemaError,
    }),
    [
      validationMode,
      externalSchema,
      externalSchemaString,
      validationResult,
      fieldFrequencies,
      isSchemaValid,
      schemaError,
    ]
  );

  return (
    <SchemaValidationContext.Provider value={{ state, api }}>
      {children}
    </SchemaValidationContext.Provider>
  );
}

export function useSchemaValidation(): SchemaValidationContextType {
  const context = useContext(SchemaValidationContext);

  invariant(
    context,
    "useSchemaValidation must be used within a SchemaValidationProvider"
  );

  return context;
}

export function useSchemaValidationState(): SchemaValidationState {
  const context = useContext(SchemaValidationContext);

  invariant(
    context,
    "useSchemaValidationState must be used within a SchemaValidationProvider"
  );

  return context.state;
}

export function useSchemaValidationAPI(): SchemaValidationAPI {
  const context = useContext(SchemaValidationContext);

  invariant(
    context,
    "useSchemaValidationAPI must be used within a SchemaValidationProvider"
  );

  return context.api;
}
