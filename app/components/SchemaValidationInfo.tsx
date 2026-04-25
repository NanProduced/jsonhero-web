import { ExclamationIcon, ChevronRightIcon } from "@heroicons/react/outline";
import { useMemo } from "react";
import { useSelectedInfo } from "~/hooks/useSelectedInfo";
import { useJsonColumnViewState } from "~/hooks/useJsonColumnView";
import {
  useSchemaValidationAPI,
  useSchemaValidationState,
} from "~/hooks/useSchemaValidation";
import { Body } from "./Primitives/Body";
import { Mono } from "./Primitives/Mono";
import { SmallTitle } from "./Primitives/SmallTitle";

export function SchemaValidationInfo() {
  const selectedInfo = useSelectedInfo();
  const { selectedNodeId } = useJsonColumnViewState();
  const { validationResult, validationMode } = useSchemaValidationState();
  const api = useSchemaValidationAPI();

  const errors = useMemo(() => {
    if (validationMode !== "external" || !validationResult) {
      return [];
    }

    if (selectedNodeId) {
      return api.getErrorsForPath(selectedNodeId);
    }

    return validationResult.errors;
  }, [selectedNodeId, validationMode, validationResult, api]);

  const fieldFrequency = useMemo(() => {
    if (!selectedNodeId) return null;

    const parentPath = selectedNodeId.substring(0, selectedNodeId.lastIndexOf("."));
    const parentFreq = api.getFrequencyForPath(parentPath);
    if (!parentFreq) return null;

    const fieldName = selectedNodeId.substring(selectedNodeId.lastIndexOf(".") + 1);
    return parentFreq.frequencies.find((f) => f.fieldName === fieldName);
  }, [selectedNodeId, api]);

  const arrayFrequencies = useMemo(() => {
    if (!selectedNodeId) return null;
    return api.getFrequencyForPath(selectedNodeId);
  }, [selectedNodeId, api]);

  if (validationMode !== "external" && !fieldFrequency && !arrayFrequencies) {
    return <></>;
  }

  return (
    <div className="mt-4">
      {validationMode === "external" && validationResult && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <SmallTitle className="text-slate-600 dark:text-slate-400">
              Validation
            </SmallTitle>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                validationResult.valid
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {validationResult.valid
                ? "Valid"
                : `${validationResult.errorCount} error${validationResult.errorCount !== 1 ? "s" : ""}`}
            </span>
          </div>

          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <ExclamationIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mono className="text-red-700 dark:text-red-400 text-sm font-medium">
                          {error.keyword}
                        </Mono>
                        {error.path !== "$" && (
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <ChevronRightIcon className="w-3 h-3" />
                            <Mono>{error.path}</Mono>
                          </span>
                        )}
                      </div>
                      <Body className="text-slate-700 dark:text-slate-300 text-sm">
                        {error.message}
                      </Body>
                      {Object.keys(error.params).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                            Show details
                          </summary>
                          <Mono className="text-xs text-slate-600 dark:text-slate-400 mt-1 block bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            {JSON.stringify(error.params, null, 2)}
                          </Mono>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(fieldFrequency || arrayFrequencies) && (
        <div>
          <SmallTitle className="text-slate-600 dark:text-slate-400 mb-2">
            Field Frequency
          </SmallTitle>

          {fieldFrequency && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <Mono className="text-blue-700 dark:text-blue-400 text-sm font-medium">
                  {fieldFrequency.fieldName}
                </Mono>
                <span
                  className={`text-sm font-bold ${
                    fieldFrequency.frequency === 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : fieldFrequency.frequency >= 75
                      ? "text-blue-600 dark:text-blue-400"
                      : fieldFrequency.frequency >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fieldFrequency.frequency.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fieldFrequency.frequency === 100
                      ? "bg-emerald-500"
                      : fieldFrequency.frequency >= 75
                      ? "bg-blue-500"
                      : fieldFrequency.frequency >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${fieldFrequency.frequency}%` }}
                />
              </div>
              <Body className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Present in {fieldFrequency.presentCount} of {fieldFrequency.totalCount} items
              </Body>
            </div>
          )}

          {arrayFrequencies && (
            <div className="space-y-2 mt-2">
              <Body className="text-xs text-slate-500 dark:text-slate-400">
                {arrayFrequencies.totalItems} items analyzed
              </Body>
              {arrayFrequencies.frequencies.slice(0, 10).map((freq, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <Mono className="text-slate-700 dark:text-slate-300">
                    {freq.fieldName}
                  </Mono>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                    <Mono
                      className={`text-xs w-8 text-right ${
                        freq.frequency === 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : freq.frequency >= 75
                          ? "text-blue-600 dark:text-blue-400"
                          : freq.frequency >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {freq.frequency.toFixed(0)}%
                    </Mono>
                  </div>
                </div>
              ))}
              {arrayFrequencies.frequencies.length > 10 && (
                <Body className="text-xs text-slate-500 dark:text-slate-400">
                  +{arrayFrequencies.frequencies.length - 10} more fields...
                </Body>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
