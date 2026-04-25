import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import {
  useCompare,
  useOptionalCompare,
  useCompareScope,
  CompareScope,
  CompareScopeState,
} from "~/hooks/useCompare";
import { JsonProvider } from "~/hooks/useJson";
import { JsonColumnViewProvider } from "~/hooks/useJsonColumnView";
import { JsonSchemaProvider } from "~/hooks/useJsonSchema";
import { JsonSearchProvider } from "~/hooks/useJsonSearch";
import { JsonTreeViewProvider } from "~/hooks/useJsonTree";
import { useJson } from "~/hooks/useJson";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { JSONDocument } from "~/jsonDoc.server";
import { InfoPanel } from "./InfoPanel";
import Resizable from "./Resizable";
import { Body } from "./Primitives/Body";
import { SmallTitle } from "./Primitives/SmallTitle";
import { JsonTreeView } from "./JsonTreeView";
import { JsonEditor } from "./JsonEditor";
import { DiffType } from "~/utilities/jsonDiff";
import {
  ChevronRightIcon,
  LockOpenIcon,
  LockClosedIcon,
  TemplateIcon,
  CodeIcon,
} from "@heroicons/react/outline";
import { TreeIcon } from "./Icons/TreeIcon";
import { ColumnViewNode } from "~/useColumnView";
import { colorForItemAtPath } from "~/utilities/colors";
import { ToolTip } from "./ToolTip";

export interface CompareLayoutProps {
  loaderData: {
    doc: JSONDocument;
    json: unknown;
    path?: string;
    minimal?: boolean;
  };
}

type CompareViewType = "column" | "tree" | "editor";

export function CompareLayout({ loaderData }: CompareLayoutProps) {
  const compare = useCompare();
  const { left, right, syncSettings, setSyncSettings, activeView, setActiveView } = compare;

  if (!right.json) {
    return (
      <div className="main-container flex justify-items-stretch h-full items-center justify-center">
        <div className="text-center p-8">
          <SmallTitle className="mb-2">Compare Mode</SmallTitle>
          <Body className="text-slate-500 dark:text-slate-400">
            No comparison data loaded. Click "Compare" button in header to add a document to compare.
          </Body>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container flex justify-items-stretch h-full">
      <CompareSideBar
        syncSettings={syncSettings}
        setSyncSettings={setSyncSettings}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between p-1 bg-slate-200 border-slate-300 border-b-[1px] transition dark:bg-slate-900 dark:border-slate-600">
          <CompareViewToolbar activeView={activeView} setActiveView={setActiveView} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <ComparePanelHeader
              title={loaderData.doc.title}
              side="left"
            />
            <div className="flex-1 overflow-hidden">
              <ComparePanelContent
                side="left"
                activeView={activeView}
              />
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <ComparePanelHeader
              title={right.doc?.title || "Comparison"}
              side="right"
            />
            <div className="flex-1 overflow-hidden">
              <JsonProvider initialJson={right.json}>
                <JsonSchemaProvider>
                  <JsonColumnViewProvider>
                    <JsonSearchProvider>
                      <JsonTreeViewProvider overscan={25}>
                        <ComparePanelContent
                          side="right"
                          activeView={activeView}
                        />
                      </JsonTreeViewProvider>
                    </JsonSearchProvider>
                  </JsonColumnViewProvider>
                </JsonSchemaProvider>
              </JsonProvider>
            </div>
          </div>
        </div>
      </div>

      <Resizable
        isHorizontal={true}
        initialSize={500}
        minimumSize={280}
        maximumSize={900}
      >
        <div className="info-panel flex-grow h-full">
          <InfoPanel />
        </div>
      </Resizable>
    </div>
  );
}

interface CompareViewToolbarProps {
  activeView: CompareViewType;
  setActiveView: (view: CompareViewType) => void;
}

function CompareViewToolbar({ activeView, setActiveView }: CompareViewToolbarProps) {
  return (
    <div className="flex items-center space-x-1">
      <CompareViewButton
        view="column"
        activeView={activeView}
        setActiveView={setActiveView}
        icon={TemplateIcon}
        label="Column view"
      />
      <CompareViewButton
        view="editor"
        activeView={activeView}
        setActiveView={setActiveView}
        icon={CodeIcon}
        label="JSON view"
      />
      <CompareViewButton
        view="tree"
        activeView={activeView}
        setActiveView={setActiveView}
        icon={TreeIcon}
        label="Tree view"
      />
    </div>
  );
}

interface CompareViewButtonProps {
  view: CompareViewType;
  activeView: CompareViewType;
  setActiveView: (view: CompareViewType) => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function CompareViewButton({ view, activeView, setActiveView, icon: Icon, label }: CompareViewButtonProps) {
  const isActive = activeView === view;

  const classes = isActive
    ? "relative w-8 h-8 text-white bg-indigo-700 rounded-sm cursor-pointer transition"
    : "relative w-8 h-8 text-slate-700 hover:bg-slate-300 rounded-sm cursor-pointer transition dark:text-white dark:hover:bg-slate-700";

  return (
    <div className="relative">
      <ToolTip arrow="bottom">
        <Body>{label}</Body>
      </ToolTip>
      <button
        className={classes}
        onClick={() => setActiveView(view)}
      >
        <Icon className="p-1.5 w-full h-full" />
      </button>
    </div>
  );
}

function CompareSideBar({
  syncSettings,
  setSyncSettings,
}: {
  syncSettings: {
    syncScroll: boolean;
    syncSelection: boolean;
    syncExpand: boolean;
  };
  setSyncSettings: (settings: Partial<{
    syncScroll: boolean;
    syncSelection: boolean;
    syncExpand: boolean;
  }>) => void;
  activeView: CompareViewType;
  setActiveView: (view: CompareViewType) => void;
}) {
  return (
    <div className="w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
      <div className="space-y-4">
        <SmallTitle className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Compare Mode
        </SmallTitle>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Sync Settings
          </div>

          <div className="space-y-2">
            <SyncToggle
              label="Sync Scroll"
              checked={syncSettings.syncScroll}
              onChange={(checked) => setSyncSettings({ syncScroll: checked })}
            />
            <SyncToggle
              label="Sync Selection"
              checked={syncSettings.syncSelection}
              onChange={(checked) => setSyncSettings({ syncSelection: checked })}
            />
            <SyncToggle
              label="Sync Expand"
              checked={syncSettings.syncExpand}
              onChange={(checked) => setSyncSettings({ syncExpand: checked })}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Legend
          </div>

          <div className="space-y-1.5 text-xs">
            <LegendItem color="green" label="Added (Right)" />
            <LegendItem color="red" label="Deleted (Left)" />
            <LegendItem color="yellow" label="Modified" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {label}
      </span>
      {checked ? (
        <LockClosedIcon className="w-3 h-3 text-green-500" />
      ) : (
        <LockOpenIcon className="w-3 h-3 text-slate-400" />
      )}
    </label>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: "green" | "red" | "yellow";
  label: string;
}) {
  const colorClasses = {
    green: "bg-green-200 dark:bg-green-800",
    red: "bg-red-200 dark:bg-red-800",
    yellow: "bg-yellow-200 dark:bg-yellow-800",
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded ${colorClasses[color]}`}></div>
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
}

function ComparePanelHeader({
  title,
  side,
}: {
  title: string;
  side: CompareScope;
}) {
  const sideColor =
    side === "left"
      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
      : "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 border-b ${sideColor} border-l-4`}
    >
      <div className="flex items-center space-x-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            side === "left"
              ? "text-indigo-700 dark:text-indigo-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {side === "left" ? "Left" : "Right"}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
          {title}
        </span>
      </div>
    </div>
  );
}

interface CompareDiffContextType {
  isCompareMode: boolean;
  getDiffType: (path: string) => DiffType | null;
  hasDiff: (path: string) => boolean;
}

const CompareDiffContext = React.createContext<CompareDiffContextType | undefined>(
  undefined
);

export function useCompareDiffContext(): CompareDiffContextType | undefined {
  return React.useContext(CompareDiffContext);
}

interface ComparePanelContentProps {
  side: CompareScope;
  activeView: CompareViewType;
}

function ComparePanelContent({
  side,
  activeView,
}: ComparePanelContentProps) {
  const compareScope = useCompareScope(side);

  const contextValue: CompareDiffContextType | undefined = useMemo(() => {
    if (!compareScope.isCompareMode) {
      return undefined;
    }
    return {
      isCompareMode: true,
      getDiffType: compareScope.getDiffType,
      hasDiff: compareScope.hasDiff,
    };
  }, [compareScope]);

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {activeView === "column" && <CompareColumnView side={side} />}
        {activeView === "tree" && <JsonTreeView />}
        {activeView === "editor" && <JsonEditor />}
      </div>
    </div>
  );

  if (!contextValue) {
    return content;
  }

  return (
    <CompareDiffContext.Provider value={contextValue}>
      {content}
    </CompareDiffContext.Provider>
  );
}

interface CompareColumnViewProps {
  side: CompareScope;
}

function CompareColumnView({ side }: CompareColumnViewProps) {
  const { getColumnViewProps, columns, selectedNodeId } =
    useJsonColumnViewState();
  const api = useJsonColumnViewAPI();
  const compare = useOptionalCompare();
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const compareRef = React.useRef(compare);
  React.useEffect(() => {
    compareRef.current = compare;
  }, [compare]);

  const sideRef = React.useRef(side);
  React.useEffect(() => {
    sideRef.current = side;
  }, [side]);

  const previousSelectedPathRef = React.useRef<string | undefined>(undefined);
  const isSyncingRef = React.useRef(false);

  React.useEffect(() => {
    if (!selectedNodeId || isSyncingRef.current) return;
    if (previousSelectedPathRef.current === selectedNodeId) return;
    
    previousSelectedPathRef.current = selectedNodeId;
    compareRef.current?.selectPath(sideRef.current, selectedNodeId);
  }, [selectedNodeId]);

  React.useEffect(() => {
    if (
      !compare ||
      !compare.syncSettings.syncSelection
    ) {
      return;
    }

    const otherSelectedPath =
      side === "left" ? compare.right.selectedPath : compare.left.selectedPath;

    if (
      otherSelectedPath &&
      otherSelectedPath !== selectedNodeId &&
      otherSelectedPath !== previousSelectedPathRef.current
    ) {
      isSyncingRef.current = true;
      previousSelectedPathRef.current = otherSelectedPath;
      api.goToNodeId(otherSelectedPath, "sync");
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }
  }, [compare, side, selectedNodeId, api.goToNodeId]);

  return (
    <div {...getColumnViewProps()} ref={containerRef} className="h-full overflow-auto">
      <CompareColumns columns={columns} />
    </div>
  );
}

interface CompareColumnsProps {
  columns: Array<{
    id: string;
    title: string;
    icon?: any;
    items: ColumnViewNode[];
  }>;
}

function CompareColumns({ columns }: CompareColumnsProps) {
  const [json] = useJson();
  const { selectedPath, highlightedPath, highlightedNodeId } =
    useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const compareDiff = useCompareDiffContext();

  const highlightedItemIsValue = React.useMemo<boolean>(() => {
    if (highlightedNodeId == null) {
      return false;
    }

    const { JSONHeroPath } = require("@jsonhero/path");
    const path = new JSONHeroPath(highlightedNodeId);
    let item = path.first(json);

    return typeof item !== "object";
  }, [highlightedPath, json]);

  return (
    <div className="columns flex flex-grow overflow-x-auto focus:outline-none no-scrollbar">
      {columns.map((column) => {
        return (
          <ColumnWrapper key={column.id} column={column}>
            {column.items.map((item) => (
              <CompareColumnItem
                key={item.id}
                item={item}
                json={json}
                isSelected={selectedPath.includes(item.id)}
                isHighlighted={
                  highlightedPath[highlightedPath.length - 1] === item.id
                }
                onClick={(id) => goToNodeId(id, "columnView")}
                compareDiff={compareDiff}
              />
            ))}
          </ColumnWrapper>
        );
      })}
      {highlightedItemIsValue ? <BlankColumnWrapper /> : null}
    </div>
  );
}

function ColumnWrapper({
  column,
  children,
}: {
  column: {
    id: string;
    title: string;
    icon?: any;
  };
  children: React.ReactNode;
}) {
  const { highlightedPath } = useJsonColumnViewState();

  return (
    <div
      className="flex flex-col w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700"
      data-column-id={column.id}
    >
      <div
        className={`flex items-center px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 ${
          highlightedPath[highlightedPath.length - 2] === column.id
            ? "bg-slate-100 dark:bg-slate-800"
            : "bg-slate-50 dark:bg-slate-900"
        }`}
      >
        {column.icon && <column.icon className="w-4 h-4 mr-1.5 text-slate-500" />}
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {column.title}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function BlankColumnWrapper() {
  return (
    <div className="flex flex-col w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
      <div className="flex-1" />
    </div>
  );
}

interface CompareColumnItemProps {
  item: ColumnViewNode;
  json: unknown;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick?: (id: string) => void;
  compareDiff?: CompareDiffContextType;
}

function CompareColumnItem({
  item,
  json,
  isSelected,
  isHighlighted,
  onClick,
  compareDiff,
}: CompareColumnItemProps) {
  const htmlElement = React.useRef<HTMLDivElement>(null);

  const showArrow = item.children && item.children.length > 0;

  const diffType: DiffType | null = React.useMemo(() => {
    if (!compareDiff || !compareDiff.isCompareMode) return null;
    return compareDiff.getDiffType(item.id);
  }, [compareDiff, item.id]);

  const diffBorderStyle = React.useMemo<string>(() => {
    if (!diffType) return "";

    switch (diffType) {
      case "added":
        return "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/20";
      case "deleted":
        return "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/20 line-through decoration-red-400/50";
      case "modified":
        return "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20";
      default:
        return "";
    }
  }, [diffType]);

  const stateStyle = React.useMemo<string>(() => {
    if (isHighlighted) {
      return "bg-slate-300 text-slate-700 hover:bg-slate-400 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[15%] dark:text-slate-100";
    }

    if (isSelected) {
      return "bg-slate-200 hover:bg-slate-300 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[5%] dark:hover:bg-white dark:hover:bg-opacity-[10%] dark:text-slate-200";
    }

    return "hover:bg-slate-100 transition duration-75 ease-out dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:text-slate-400";
  }, [isSelected, isHighlighted]);

  React.useEffect(() => {
    if (isSelected || isHighlighted) {
      htmlElement.current?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    }
  }, [isSelected, isHighlighted]);

  return (
    <div
      className={`flex h-9 items-center justify-items-stretch mx-1 px-1 py-1 my-1 rounded-sm ${stateStyle} ${diffBorderStyle}`}
      onClick={() => onClick && onClick(item.id)}
      ref={htmlElement}
    >
      <div className="w-4 flex-none flex-col justify-items-center">
        {item.icon && (
          <item.icon
            className={`h-5 w-5 ${
              isSelected && isHighlighted
                ? "text-slate-900 dark:text-slate-300"
                : "text-slate-500"
            }`}
          />
        )}
      </div>

      <div className="flex flex-grow flex-shrink items-baseline justify-between truncate">
        <span className="flex-grow flex-shrink-0 pl-3 pr-2 text-sm">{item.title}</span>
        {item.subtitle && (
          <span
            className={`truncate pr-1 transition duration-75 font-mono text-xs ${
              isHighlighted
                ? "text-gray-500 dark:text-slate-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {item.subtitle}
          </span>
        )}
      </div>

      {diffType && diffType !== "unchanged" && (
        <CompareDiffBadge type={diffType} />
      )}

      {showArrow && (
        <ChevronRightIcon className="flex-none w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

function CompareDiffBadge({ type }: { type: DiffType }) {
  const badgeStyle = React.useMemo(() => {
    switch (type) {
      case "added":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "modified":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  }, [type]);

  const badgeText = React.useMemo(() => {
    switch (type) {
      case "added":
        return "+";
      case "deleted":
        return "-";
      case "modified":
        return "~";
      default:
        return "";
    }
  }, [type]);

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ml-1 ${badgeStyle}`}
    >
      {badgeText}
    </span>
  );
}
