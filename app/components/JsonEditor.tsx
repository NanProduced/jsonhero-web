import { JSONHeroPath } from "@jsonhero/path";
import { CodeEditor } from "./CodeEditor";
import { useJson } from "~/hooks/useJson";
import { useCallback, useMemo, useRef } from "react";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { ViewUpdate } from "@uiw/react-codemirror";
import jsonMap from "json-source-map";
import { useSchemaValidationAPI, useSchemaValidationState } from "~/hooks/useSchemaValidation";
import { usePreferences } from "~/components/PreferencesProvider";

export function JsonEditor() {
  const [json] = useJson();
  const { selectedNodeId } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const [preferences] = usePreferences();
  const { validationResult, validationMode } = useSchemaValidationState();
  const api = useSchemaValidationAPI();

  const jsonMapped = useMemo(() => {
    return jsonMap.stringify(json, null, preferences?.indent || 2);
  }, [json, preferences]);

  const errorRanges = useMemo<Array<{ start: number; end: number; path: string }>>(() => {
    if (validationMode !== "external" || !validationResult || validationResult.errors.length === 0) {
      return [];
    }

    const ranges: Array<{ start: number; end: number; path: string }> = [];

    validationResult.errors.forEach((error) => {
      const path = new JSONHeroPath(error.path);
      const pointer = path.jsonPointer();
      const location = jsonMapped.pointers[pointer];

      if (location) {
        const start = location.key ? location.key.pos : location.value.pos;
        const end = location.valueEnd.pos;
        ranges.push({ start, end, path: error.path });
      }
    });

    return ranges;
  }, [validationMode, validationResult, jsonMapped]);

  const selection = useMemo<{ start: number; end: number } | undefined>(() => {
    if (!selectedNodeId) {
      return;
    }

    const path = new JSONHeroPath(selectedNodeId);
    const pointer = path.jsonPointer();

    const location = jsonMapped.pointers[pointer];

    if (location) {
      if (location.key) {
        return { start: location.key.pos, end: location.valueEnd.pos };
      }

      return { start: location.value.pos, end: location.valueEnd.pos };
    }
  }, [selectedNodeId, jsonMapped]);

  const currentSelectedLine = useRef<number | undefined>(undefined);

  const onUpdate = useCallback(
    (update: ViewUpdate) => {
      if (!update.selectionSet) {
        return;
      }

      const range = update.state.selection.ranges[0];
      const line = update.state.doc.lineAt(range.anchor);

      if (
        currentSelectedLine.current &&
        currentSelectedLine.current === line.number
      ) {
        return;
      }

      currentSelectedLine.current = line.number;

      const pointerEntry = Object.entries(jsonMapped.pointers).find(
        ([pointer, info]) => {
          return info.value.line === line.number - 1;
        }
      );

      if (!pointerEntry) {
        return;
      }

      const [pointer] = pointerEntry;

      const path = JSONHeroPath.fromPointer(pointer);

      goToNodeId(path.toString(), "editor");
    },
    [goToNodeId, jsonMapped]
  );

  return (
    <div className="relative">
      <CodeEditor
        language="json"
        content={jsonMapped.json}
        readOnly={true}
        onUpdate={onUpdate}
        selection={selection}
        errorRanges={errorRanges.length > 0 ? errorRanges : undefined}
      />
      {validationMode === "external" && validationResult && !validationResult.valid && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
            {validationResult.errorCount} error{validationResult.errorCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
