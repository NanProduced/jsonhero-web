import { useState, useCallback } from "react";
import { DocumentTextIcon, XIcon, CheckIcon, ExclamationIcon } from "@heroicons/react/outline";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./UI/Popover";
import { useSchemaValidation, useSchemaValidationAPI } from "~/hooks/useSchemaValidation";
import { Body } from "./Primitives/Body";
import { Mono } from "./Primitives/Mono";

export function SchemaManager() {
  const { state } = useSchemaValidation();
  const api = useSchemaValidationAPI();
  const [schemaInput, setSchemaInput] = useState(state.externalSchemaString);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLoadSchema = useCallback(() => {
    const success = api.loadExternalSchema(schemaInput);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [schemaInput, api]);

  const handleClearSchema = useCallback(() => {
    api.clearExternalSchema();
    setSchemaInput("");
  }, [api]);

  const handleRevalidate = useCallback(() => {
    api.revalidate();
  }, [api]);

  const hasErrors = state.validationResult && !state.validationResult.valid;
  const errorCount = state.validationResult?.errorCount || 0;

  return (
    <Popover>
      <PopoverTrigger>
        <button
          className={`flex items-center justify-center py-1 text-base font-bold px-2 py-1 rounded uppercase hover:cursor-pointer hover:bg-opacity-100 transition ${
            hasErrors
              ? "bg-red-500 text-white bg-opacity-90"
              : state.validationMode === "external"
              ? "bg-emerald-500 text-white bg-opacity-90"
              : "bg-slate-200 text-slate-800 bg-opacity-90"
          }`}
        >
          <DocumentTextIcon className="w-4 h-4 mr-0.5" />
          Schema
          {hasErrors && errorCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-700 rounded text-xs">
              {errorCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" sideOffset={8} className="w-[500px]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Body className="font-bold text-slate-800 dark:text-slate-200">
              Schema Validation
            </Body>
            <div className="flex gap-2">
              <button
                onClick={() => api.setValidationMode("inferred")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  state.validationMode === "inferred"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                Auto Infer
              </button>
              <button
                onClick={() => api.setValidationMode("external")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  state.validationMode === "external"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                External Schema
              </button>
            </div>
          </div>

          {state.validationMode === "external" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  JSON Schema
                </label>
                <textarea
                  value={schemaInput}
                  onChange={(e) => setSchemaInput(e.target.value)}
                  placeholder='{"type": "object", "properties": { ... }}'
                  className="w-full h-40 p-2 border border-slate-300 rounded text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                />
              </div>

              {state.schemaError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <ExclamationIcon className="w-5 h-5 text-red-500" />
                  <Mono className="text-red-600 dark:text-red-400 text-sm">
                    {state.schemaError}
                  </Mono>
                </div>
              )}

              {showSuccess && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                  <Mono className="text-emerald-600 dark:text-emerald-400 text-sm">
                    Schema loaded successfully!
                  </Mono>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleLoadSchema}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                >
                  <CheckIcon className="w-4 h-4" />
                  Load Schema
                </button>
                <button
                  onClick={handleClearSchema}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition text-sm font-medium dark:bg-slate-700 dark:text-slate-300"
                >
                  <XIcon className="w-4 h-4" />
                  Clear
                </button>
                {state.isSchemaValid && (
                  <button
                    onClick={handleRevalidate}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-sm font-medium"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Revalidate
                  </button>
                )}
              </div>

              {state.validationResult && (
                <div
                  className={`p-3 rounded ${
                    state.validationResult.valid
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {state.validationResult.valid ? (
                      <>
                        <CheckIcon className="w-5 h-5 text-emerald-500" />
                        <Mono className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Validation Passed
                        </Mono>
                      </>
                    ) : (
                      <>
                        <ExclamationIcon className="w-5 h-5 text-red-500" />
                        <Mono className="text-red-600 dark:text-red-400 font-medium">
                          Validation Failed: {state.validationResult.errorCount} error
                          {state.validationResult.errorCount !== 1 ? "s" : ""}
                        </Mono>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {state.validationMode === "inferred" && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Mono className="text-blue-600 dark:text-blue-400 text-sm">
                  Using auto-inferred schema from your JSON data.
                </Mono>
              </div>

              {state.fieldFrequencies.length > 0 && (
                <div>
                  <Body className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Field Frequencies
                  </Body>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {state.fieldFrequencies.map((freqResult, index) => (
                      <div
                        key={index}
                        className="p-2 bg-slate-50 dark:bg-slate-800 rounded"
                      >
                        <Mono className="text-indigo-600 dark:text-indigo-400 text-xs block mb-1">
                          {freqResult.path} ({freqResult.totalItems} items)
                        </Mono>
                        <div className="space-y-1">
                          {freqResult.frequencies.slice(0, 5).map((freq, fIdx) => (
                            <div key={fIdx} className="flex items-center justify-between text-sm">
                              <Mono className="text-slate-700 dark:text-slate-300">
                                {freq.fieldName}
                              </Mono>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      freq.frequency === 100
                                        ? "bg-emerald-500"
                                        : freq.frequency >= 75
                                        ? "bg-blue-500"
                                        : freq.frequency >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${freq.frequency}%` }}
                                  />
                                </div>
                                <Mono className="text-slate-500 dark:text-slate-400 text-xs w-10 text-right">
                                  {freq.frequency.toFixed(0)}%
                                </Mono>
                              </div>
                            </div>
                          ))}
                          {freqResult.frequencies.length > 5 && (
                            <Mono className="text-slate-400 text-xs">
                              +{freqResult.frequencies.length - 5} more fields...
                            </Mono>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <PopoverArrow
          className="fill-current text-indigo-700"
          offset={20}
        />
      </PopoverContent>
    </Popover>
  );
}
