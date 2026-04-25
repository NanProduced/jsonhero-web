import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DiffResult, DiffType } from "~/utilities/jsonDiff";

export type DiffSide = "left" | "right";

export interface SyncState {
  syncScroll: boolean;
  syncSelection: boolean;
  syncExpand: boolean;
  selectedPath?: string;
  selectedSide?: DiffSide;
  expandedPaths: Map<DiffSide, Set<string>>;
  scrollPositions: Map<DiffSide, { left: number; top: number }>;
}

export interface JsonDiffSyncContextType {
  diffResult: DiffResult;
  syncState: SyncState;
  toggleSyncScroll: () => void;
  toggleSyncSelection: () => void;
  toggleSyncExpand: () => void;
  selectPath: (path: string, side: DiffSide, source?: string) => void;
  expandPath: (path: string, side: DiffSide) => void;
  collapsePath: (path: string, side: DiffSide) => void;
  togglePath: (path: string, side: DiffSide) => void;
  updateScrollPosition: (
    side: DiffSide,
    position: { left: number; top: number }
  ) => void;
  getDiffType: (path: string, side: DiffSide) => DiffType | null;
  hasDiff: (path: string) => boolean;
}

const JsonDiffSyncContext = createContext<JsonDiffSyncContextType | undefined>(
  undefined
);

export function JsonDiffSyncProvider({
  children,
  diffResult,
  initialSyncScroll = true,
  initialSyncSelection = true,
  initialSyncExpand = true,
}: {
  children: ReactNode;
  diffResult: DiffResult;
  initialSyncScroll?: boolean;
  initialSyncSelection?: boolean;
  initialSyncExpand?: boolean;
}) {
  const [syncState, setSyncState] = useState<SyncState>({
    syncScroll: initialSyncScroll,
    syncSelection: initialSyncSelection,
    syncExpand: initialSyncExpand,
    expandedPaths: new Map([
      ["left", new Set<string>()],
      ["right", new Set<string>()],
    ]),
    scrollPositions: new Map([
      ["left", { left: 0, top: 0 }],
      ["right", { left: 0, top: 0 }],
    ]),
  });

  const isSyncingRef = useRef(false);

  const toggleSyncScroll = useCallback(() => {
    setSyncState((prev) => ({ ...prev, syncScroll: !prev.syncScroll }));
  }, []);

  const toggleSyncSelection = useCallback(() => {
    setSyncState((prev) => ({ ...prev, syncSelection: !prev.syncSelection }));
  }, []);

  const toggleSyncExpand = useCallback(() => {
    setSyncState((prev) => ({ ...prev, syncExpand: !prev.syncExpand }));
  }, []);

  const selectPath = useCallback(
    (path: string, side: DiffSide, source?: string) => {
      if (isSyncingRef.current) return;

      setSyncState((prev) => {
        const newState = { ...prev, selectedPath: path, selectedSide: side };

        if (prev.syncSelection) {
          isSyncingRef.current = true;
        }

        return newState;
      });
    },
    []
  );

  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
    }
  }, [syncState.selectedPath]);

  const expandPath = useCallback(
    (path: string, side: DiffSide) => {
      setSyncState((prev) => {
        const newExpandedPaths = new Map(prev.expandedPaths);
        const sidePaths = new Set(newExpandedPaths.get(side) || []);
        sidePaths.add(path);
        newExpandedPaths.set(side, sidePaths);

        if (prev.syncExpand) {
          const otherSide = side === "left" ? "right" : "left";
          const otherSidePaths = new Set(newExpandedPaths.get(otherSide) || []);
          otherSidePaths.add(path);
          newExpandedPaths.set(otherSide, otherSidePaths);
        }

        return { ...prev, expandedPaths: newExpandedPaths };
      });
    },
    []
  );

  const collapsePath = useCallback(
    (path: string, side: DiffSide) => {
      setSyncState((prev) => {
        const newExpandedPaths = new Map(prev.expandedPaths);
        const sidePaths = new Set(newExpandedPaths.get(side) || []);
        sidePaths.delete(path);
        newExpandedPaths.set(side, sidePaths);

        if (prev.syncExpand) {
          const otherSide = side === "left" ? "right" : "left";
          const otherSidePaths = new Set(newExpandedPaths.get(otherSide) || []);
          otherSidePaths.delete(path);
          newExpandedPaths.set(otherSide, otherSidePaths);
        }

        return { ...prev, expandedPaths: newExpandedPaths };
      });
    },
    []
  );

  const togglePath = useCallback(
    (path: string, side: DiffSide) => {
      setSyncState((prev) => {
        const newExpandedPaths = new Map(prev.expandedPaths);
        const sidePaths = new Set(newExpandedPaths.get(side) || []);
        const isExpanded = sidePaths.has(path);

        if (isExpanded) {
          sidePaths.delete(path);
        } else {
          sidePaths.add(path);
        }
        newExpandedPaths.set(side, sidePaths);

        if (prev.syncExpand) {
          const otherSide = side === "left" ? "right" : "left";
          const otherSidePaths = new Set(newExpandedPaths.get(otherSide) || []);
          if (isExpanded) {
            otherSidePaths.delete(path);
          } else {
            otherSidePaths.add(path);
          }
          newExpandedPaths.set(otherSide, otherSidePaths);
        }

        return { ...prev, expandedPaths: newExpandedPaths };
      });
    },
    []
  );

  const updateScrollPosition = useCallback(
    (side: DiffSide, position: { left: number; top: number }) => {
      if (isSyncingRef.current) return;

      setSyncState((prev) => {
        const newScrollPositions = new Map(prev.scrollPositions);
        newScrollPositions.set(side, position);

        if (prev.syncScroll) {
          isSyncingRef.current = true;
          const otherSide = side === "left" ? "right" : "left";
          newScrollPositions.set(otherSide, position);
        }

        return { ...prev, scrollPositions: newScrollPositions };
      });
    },
    []
  );

  useEffect(() => {
    if (isSyncingRef.current) {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
  }, [syncState.scrollPositions]);

  const getDiffType = useCallback(
    (path: string, side: DiffSide): DiffType | null => {
      const diff = diffResult.diffs.get(path);
      if (!diff) return null;

      if (diff.type === "unchanged") return "unchanged";

      if (side === "left") {
        if (diff.type === "deleted") return "deleted";
        if (diff.type === "modified") return "modified";
        return null;
      } else {
        if (diff.type === "added") return "added";
        if (diff.type === "modified") return "modified";
        return null;
      }
    },
    [diffResult]
  );

  const hasDiff = useCallback(
    (path: string): boolean => {
      return (
        diffResult.addedPaths.has(path) ||
        diffResult.deletedPaths.has(path) ||
        diffResult.modifiedPaths.has(path)
      );
    },
    [diffResult]
  );

  const contextValue: JsonDiffSyncContextType = {
    diffResult,
    syncState,
    toggleSyncScroll,
    toggleSyncSelection,
    toggleSyncExpand,
    selectPath,
    expandPath,
    collapsePath,
    togglePath,
    updateScrollPosition,
    getDiffType,
    hasDiff,
  };

  return (
    <JsonDiffSyncContext.Provider value={contextValue}>
      {children}
    </JsonDiffSyncContext.Provider>
  );
}

export function useJsonDiffSync(): JsonDiffSyncContextType {
  const context = useContext(JsonDiffSyncContext);
  if (!context) {
    throw new Error(
      "useJsonDiffSync must be used within a JsonDiffSyncProvider"
    );
  }
  return context;
}

export function useOptionalJsonDiffSync(): JsonDiffSyncContextType | undefined {
  return useContext(JsonDiffSyncContext);
}
