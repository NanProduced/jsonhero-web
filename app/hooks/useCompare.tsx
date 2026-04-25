import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { computeJsonDiff, DiffResult, DiffType } from "~/utilities/jsonDiff";
import { JSONDocument } from "~/jsonDoc.server";
import { ColumnViewNode } from "~/useColumnView";

export type CompareScope = "left" | "right";

export interface CompareSyncSettings {
  syncScroll: boolean;
  syncSelection: boolean;
  syncExpand: boolean;
}

export interface CompareDocumentState {
  doc?: JSONDocument;
  json: unknown;
  selectedPath?: string;
  highlightedPath?: string;
  scrollPosition: { left: number; top: number };
  expandedPaths: Set<string>;
}

export interface CompareState {
  isCompareMode: boolean;
  left: CompareDocumentState;
  right: CompareDocumentState;
  diffResult: DiffResult | null;
  syncSettings: CompareSyncSettings;
  activeView: "column" | "tree" | "editor";
}

export interface CompareActions {
  enterCompareMode: (rightDoc?: JSONDocument, rightJson?: unknown) => void;
  exitCompareMode: () => void;
  updateLeftJson: (json: unknown) => void;
  updateRightJson: (json: unknown) => void;
  updateRightDocument: (doc: JSONDocument, json: unknown) => void;
  selectPath: (scope: CompareScope, path: string, source?: string) => void;
  updateScrollPosition: (
    scope: CompareScope,
    position: { left: number; top: number }
  ) => void;
  toggleExpandPath: (scope: CompareScope, path: string) => void;
  setSyncSettings: (settings: Partial<CompareSyncSettings>) => void;
  setActiveView: (view: "column" | "tree" | "editor") => void;
}

export interface CompareContextType extends CompareState, CompareActions {}

const initialDocumentState: CompareDocumentState = {
  json: null,
  scrollPosition: { left: 0, top: 0 },
  expandedPaths: new Set(),
};

const initialSyncSettings: CompareSyncSettings = {
  syncScroll: true,
  syncSelection: true,
  syncExpand: true,
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<CompareState>({
    isCompareMode: false,
    left: initialDocumentState,
    right: initialDocumentState,
    diffResult: null,
    syncSettings: initialSyncSettings,
    activeView: "column",
  });

  const enterCompareMode = useCallback(
    (rightDoc?: JSONDocument, rightJson?: unknown) => {
      setState((prev) => ({
        ...prev,
        isCompareMode: true,
        right: {
          ...prev.right,
          doc: rightDoc,
          json: rightJson ?? null,
        },
      }));
    },
    []
  );

  const exitCompareMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCompareMode: false,
      right: initialDocumentState,
      diffResult: null,
    }));
  }, []);

  const updateLeftJson = useCallback((json: unknown) => {
    setState((prev) => {
      const newDiffResult =
        prev.isCompareMode && prev.right.json !== undefined
          ? computeJsonDiff(json, prev.right.json)
          : null;
      return {
        ...prev,
        left: { ...prev.left, json },
        diffResult: newDiffResult,
      };
    });
  }, []);

  const updateRightJson = useCallback((json: unknown) => {
    setState((prev) => {
      const newDiffResult =
        prev.isCompareMode && prev.left.json !== undefined
          ? computeJsonDiff(prev.left.json, json)
          : null;
      return {
        ...prev,
        right: { ...prev.right, json },
        diffResult: newDiffResult,
      };
    });
  }, []);

  const updateRightDocument = useCallback(
    (doc: JSONDocument, json: unknown) => {
      setState((prev) => {
        const newDiffResult =
          prev.left.json !== undefined
            ? computeJsonDiff(prev.left.json, json)
            : null;
        return {
          ...prev,
          right: {
            ...prev.right,
            doc,
            json,
          },
          diffResult: newDiffResult,
        };
      });
    },
    []
  );

  const selectPath = useCallback(
    (scope: CompareScope, path: string, source?: string) => {
      setState((prev) => {
        if (!prev.isCompareMode) return prev;

        const currentPath = scope === "left" ? prev.left.selectedPath : prev.right.selectedPath;
        const otherPath = scope === "left" ? prev.right.selectedPath : prev.left.selectedPath;

        if (currentPath === path) {
          if (!prev.syncSettings.syncSelection) {
            return prev;
          }
          if (otherPath === path) {
            return prev;
          }
        }

        const newState = { ...prev };

        if (scope === "left") {
          if (currentPath !== path) {
            newState.left = { ...prev.left, selectedPath: path };
          }
          if (prev.syncSettings.syncSelection && otherPath !== path) {
            newState.right = { ...prev.right, selectedPath: path };
          }
        } else {
          if (currentPath !== path) {
            newState.right = { ...prev.right, selectedPath: path };
          }
          if (prev.syncSettings.syncSelection && otherPath !== path) {
            newState.left = { ...prev.left, selectedPath: path };
          }
        }

        if (newState.left === prev.left && newState.right === prev.right) {
          return prev;
        }

        return newState;
      });
    },
    []
  );

  const updateScrollPosition = useCallback(
    (scope: CompareScope, position: { left: number; top: number }) => {
      setState((prev) => {
        if (!prev.isCompareMode) return prev;

        const newState = { ...prev };

        if (scope === "left") {
          newState.left = { ...prev.left, scrollPosition: position };
          if (prev.syncSettings.syncScroll) {
            newState.right = { ...prev.right, scrollPosition: position };
          }
        } else {
          newState.right = { ...prev.right, scrollPosition: position };
          if (prev.syncSettings.syncScroll) {
            newState.left = { ...prev.left, scrollPosition: position };
          }
        }

        return newState;
      });
    },
    []
  );

  const toggleExpandPath = useCallback(
    (scope: CompareScope, path: string) => {
      setState((prev) => {
        if (!prev.isCompareMode) return prev;

        const newState = { ...prev };

        if (scope === "left") {
          const newExpandedPaths = new Set(prev.left.expandedPaths);
          if (newExpandedPaths.has(path)) {
            newExpandedPaths.delete(path);
          } else {
            newExpandedPaths.add(path);
          }
          newState.left = { ...prev.left, expandedPaths: newExpandedPaths };

          if (prev.syncSettings.syncExpand) {
            newState.right = { ...prev.right, expandedPaths: newExpandedPaths };
          }
        } else {
          const newExpandedPaths = new Set(prev.right.expandedPaths);
          if (newExpandedPaths.has(path)) {
            newExpandedPaths.delete(path);
          } else {
            newExpandedPaths.add(path);
          }
          newState.right = { ...prev.right, expandedPaths: newExpandedPaths };

          if (prev.syncSettings.syncExpand) {
            newState.left = { ...prev.left, expandedPaths: newExpandedPaths };
          }
        }

        return newState;
      });
    },
    []
  );

  const setSyncSettings = useCallback(
    (settings: Partial<CompareSyncSettings>) => {
      setState((prev) => ({
        ...prev,
        syncSettings: { ...prev.syncSettings, ...settings },
      }));
    },
    []
  );

  const setActiveView = useCallback((view: "column" | "tree" | "editor") => {
    setState((prev) => ({ ...prev, activeView: view }));
  }, []);

  const contextValue: CompareContextType = useMemo(
    () => ({
      ...state,
      enterCompareMode,
      exitCompareMode,
      updateLeftJson,
      updateRightJson,
      updateRightDocument,
      selectPath,
      updateScrollPosition,
      toggleExpandPath,
      setSyncSettings,
      setActiveView,
    }),
    [
      state,
      enterCompareMode,
      exitCompareMode,
      updateLeftJson,
      updateRightJson,
      updateRightDocument,
      selectPath,
      updateScrollPosition,
      toggleExpandPath,
      setSyncSettings,
      setActiveView,
    ]
  );

  return (
    <CompareContext.Provider value={contextValue}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextType {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}

export function useOptionalCompare(): CompareContextType | undefined {
  return useContext(CompareContext);
}

export interface CompareScopeState {
  isCompareMode: boolean;
  doc: JSONDocument | undefined;
  json: unknown | undefined;
  selectedPath: string | undefined;
  scrollPosition: { left: number; top: number };
  expandedPaths: Set<string>;
  diffResult: DiffResult | null;
  getDiffType: (path: string) => DiffType | null;
  hasDiff: (path: string) => boolean;
}

export function useCompareScope(scope: CompareScope): CompareScopeState {
  const compare = useOptionalCompare();

  return useMemo((): CompareScopeState => {
    if (!compare || !compare.isCompareMode) {
      return {
        isCompareMode: false,
        doc: undefined,
        json: undefined,
        selectedPath: undefined,
        scrollPosition: { left: 0, top: 0 },
        expandedPaths: new Set<string>(),
        diffResult: null,
        getDiffType: () => null,
        hasDiff: () => false,
      };
    }

    const docState = scope === "left" ? compare.left : compare.right;

    return {
      isCompareMode: true,
      doc: docState.doc,
      json: docState.json,
      selectedPath: docState.selectedPath,
      scrollPosition: docState.scrollPosition,
      expandedPaths: docState.expandedPaths,
      diffResult: compare.diffResult,
      getDiffType: (path: string): DiffType | null => {
        if (!compare.diffResult) return null;
        const diff = compare.diffResult.diffs.get(path);
        if (!diff) return null;
        if (diff.type === "unchanged") return "unchanged";
        if (scope === "left") {
          if (diff.type === "deleted") return "deleted";
          if (diff.type === "modified") return "modified";
          return null;
        } else {
          if (diff.type === "added") return "added";
          if (diff.type === "modified") return "modified";
          return null;
        }
      },
      hasDiff: (path: string): boolean => {
        if (!compare.diffResult) return false;
        return (
          compare.diffResult.addedPaths.has(path) ||
          compare.diffResult.deletedPaths.has(path) ||
          compare.diffResult.modifiedPaths.has(path)
        );
      },
    };
  }, [compare, scope]);
}
