import React, { useEffect, useRef } from "react";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import {
  useJsonDiffSync,
  useOptionalJsonDiffSync,
  DiffSide,
} from "~/hooks/useJsonDiffSync";
import { useHotkeys } from "react-hotkeys-hook";
import { Columns } from "./Columns";
import { CopySelectedNodeShortcut } from "./CopySelectedNode";
import { DiffType } from "~/utilities/jsonDiff";
import { createContext, useContext, useMemo, useState } from "react";

export interface JsonDiffViewContextType {
  side: DiffSide;
  getDiffType: (path: string) => DiffType | null;
  hasDiff: (path: string) => boolean;
  onSelectPath: (path: string, source?: string) => void;
  onTogglePath: (path: string) => void;
  onScroll: (position: { left: number; top: number }) => void;
}

const JsonDiffViewContext = createContext<JsonDiffViewContextType | undefined>(
  undefined
);

export function useJsonDiffViewContext(): JsonDiffViewContextType {
  const context = useContext(JsonDiffViewContext);
  if (!context) {
    throw new Error(
      "useJsonDiffViewContext must be used within a JsonDiffViewContext.Provider"
    );
  }
  return context;
}

export function useOptionalJsonDiffViewContext(): JsonDiffViewContextType | undefined {
  return useContext(JsonDiffViewContext);
}

export interface JsonDiffViewProps {
  side: DiffSide;
  title?: string;
}

export function JsonDiffView({ side, title }: JsonDiffViewProps) {
  const diffSync = useOptionalJsonDiffSync();
  const { getColumnViewProps, columns, selectedNodeId, selectedNodeSource } =
    useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const getDiffType = useMemo(() => {
    return (path: string): DiffType | null => {
      if (!diffSync) return null;
      return diffSync.getDiffType(path, side);
    };
  }, [diffSync, side]);

  const hasDiff = useMemo(() => {
    return (path: string): boolean => {
      if (!diffSync) return false;
      return diffSync.hasDiff(path);
    };
  }, [diffSync]);

  const onSelectPath = useMemo(() => {
    return (path: string, source?: string) => {
      if (!diffSync) return;
      diffSync.selectPath(path, side, source);
    };
  }, [diffSync, side]);

  const onTogglePath = useMemo(() => {
    return (path: string) => {
      if (!diffSync) return;
      diffSync.togglePath(path, side);
    };
  }, [diffSync, side]);

  const onScroll = useMemo(() => {
    return (position: { left: number; top: number }) => {
      if (!diffSync || isSyncing) return;
      diffSync.updateScrollPosition(side, position);
    };
  }, [diffSync, side, isSyncing]);

  useEffect(() => {
    if (!diffSync) return;

    const { syncState } = diffSync;
    const selectedPath = syncState.selectedPath;
    const selectedSide = syncState.selectedSide;

    if (
      syncState.syncSelection &&
      selectedPath &&
      selectedPath !== selectedNodeId &&
      selectedSide !== side
    ) {
      setIsSyncing(true);
      goToNodeId(selectedPath, "sync");
      setTimeout(() => setIsSyncing(false), 50);
    }
  }, [
    diffSync,
    selectedNodeId,
    goToNodeId,
    side,
  ]);

  useEffect(() => {
    if (selectedNodeId && !isSyncing) {
      onSelectPath(selectedNodeId, selectedNodeSource);
    }
  }, [selectedNodeId, selectedNodeSource, isSyncing, onSelectPath]);

  useEffect(() => {
    if (!diffSync || !containerRef.current) return;

    const { syncState } = diffSync;
    const scrollPositions = syncState.scrollPositions;
    const targetPosition = scrollPositions.get(side);

    if (syncState.syncScroll && targetPosition) {
      const currentScrollTop = containerRef.current.scrollTop;
      const currentScrollLeft = containerRef.current.scrollLeft;

      if (
        Math.abs(currentScrollTop - targetPosition.top) > 1 ||
        Math.abs(currentScrollLeft - targetPosition.left) > 1
      ) {
        setIsSyncing(true);
        containerRef.current.scrollTo({
          top: targetPosition.top,
          left: targetPosition.left,
          behavior: "smooth",
        });
        setTimeout(() => setIsSyncing(false), 100);
      }
    }
  }, [diffSync, side]);

  const contextValue: JsonDiffViewContextType = {
    side,
    getDiffType,
    hasDiff,
    onSelectPath,
    onTogglePath,
    onScroll,
  };

  const sideLabel = side === "left" ? "Left" : "Right";
  const sideColor = side === "left" ? "border-indigo-500" : "border-emerald-500";
  const sideBg = side === "left" ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-emerald-50 dark:bg-emerald-900/20";

  return (
    <JsonDiffViewContext.Provider value={contextValue}>
      <div className="flex flex-col h-full">
        <div
          className={`flex items-center justify-between px-4 py-2 border-b ${sideBg} ${sideColor} border-l-4`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                side === "left"
                  ? "text-indigo-700 dark:text-indigo-400"
                  : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {sideLabel}
            </span>
            {title && (
              <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                {title}
              </span>
            )}
          </div>
          <DiffStats side={side} />
        </div>

        <div className="flex-grow overflow-hidden">
          <JsonDiffViewContent containerRef={containerRef} />
        </div>
      </div>
    </JsonDiffViewContext.Provider>
  );
}

function DiffStats({ side }: { side: DiffSide }) {
  const diffSync = useOptionalJsonDiffSync();

  if (!diffSync) return null;

  const { diffResult } = diffSync;

  let addedCount = 0;
  let deletedCount = 0;
  let modifiedCount = 0;

  if (side === "right") {
    addedCount = diffResult.addedPaths.size;
  } else {
    deletedCount = diffResult.deletedPaths.size;
  }
  modifiedCount = diffResult.modifiedPaths.size;

  return (
    <div className="flex items-center space-x-3 text-xs">
      {side === "right" && addedCount > 0 && (
        <span className="flex items-center space-x-1 text-green-700 dark:text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>+{addedCount}</span>
        </span>
      )}
      {side === "left" && deletedCount > 0 && (
        <span className="flex items-center space-x-1 text-red-700 dark:text-red-400">
          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
          <span>-{deletedCount}</span>
        </span>
      )}
      {modifiedCount > 0 && (
        <span className="flex items-center space-x-1 text-yellow-700 dark:text-yellow-400">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          <span>~{modifiedCount}</span>
        </span>
      )}
    </div>
  );
}

interface JsonDiffViewContentProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

function JsonDiffViewContent({ containerRef }: JsonDiffViewContentProps) {
  const { getColumnViewProps, columns } = useJsonColumnViewState();
  const diffViewContext = useOptionalJsonDiffViewContext();

  useEffect(() => {
    if (!containerRef.current || !diffViewContext) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      diffViewContext.onScroll({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
    };

    const element = containerRef.current;
    element.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, diffViewContext]);

  return (
    <>
      <KeyboardShortcuts />
      <div
        {...getColumnViewProps()}
        ref={containerRef}
        className="h-full overflow-auto"
      >
        <Columns columns={columns} />
      </div>
    </>
  );
}

function KeyboardShortcuts() {
  const api = useJsonColumnViewAPI();
  const diffViewContext = useOptionalJsonDiffViewContext();

  useHotkeys(
    "down",
    (e) => {
      e.preventDefault();
      api.goToNextSibling();
    },
    { enabled: true },
    [api]
  );

  useHotkeys(
    "up",
    (e) => {
      e.preventDefault();
      api.goToPreviousSibling();
    },
    [api]
  );

  useHotkeys(
    "right",
    (e) => {
      e.preventDefault();
      api.goToChildren();
    },
    [api]
  );

  useHotkeys(
    "left,alt+left",
    (e) => {
      e.preventDefault();
      api.goToParent({ source: e });
    },
    [api]
  );

  useHotkeys(
    "esc",
    (e) => {
      e.preventDefault();
      api.resetSelection();
    },
    [api]
  );

  return (
    <>
      <CopySelectedNodeShortcut />
    </>
  );
}
