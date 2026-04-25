import { ChevronDownIcon, ChevronRightIcon, ExclamationIcon } from "@heroicons/react/outline";
import { useEffect, useMemo, useRef } from "react";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { JsonTreeViewNode, useJsonTreeViewContext } from "~/hooks/useJsonTree";
import { VirtualNode } from "~/hooks/useVirtualTree";
import { CopySelectedNodeShortcut } from "./CopySelectedNode";
import { Body } from "./Primitives/Body";
import { Mono } from "./Primitives/Mono";
import { useSchemaValidationAPI, useSchemaValidationState } from "~/hooks/useSchemaValidation";

export function JsonTreeView() {
  const { selectedNodeId, selectedNodeSource } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();

  const { tree, parentRef } = useJsonTreeViewContext();

  const scrolledToNodeRef = useRef(false);

  useEffect(() => {
    if (!scrolledToNodeRef.current && selectedNodeId) {
      tree.scrollToNode(selectedNodeId);
      scrolledToNodeRef.current = true;
    }
  }, [selectedNodeId, scrolledToNodeRef]);

  const focusCount = useRef<number>(0);

  useEffect(() => {
    if (
      tree.focusedNodeId &&
      selectedNodeId &&
      tree.focusedNodeId !== selectedNodeId
    ) {
      if (selectedNodeId === "$") {
        return;
      }

      if (selectedNodeSource !== "tree" && focusCount.current > 0) {
        focusCount.current = focusCount.current + 1;
        tree.focusNode(selectedNodeId);
        tree.scrollToNode(selectedNodeId);
      }
    }
  }, [tree.focusedNodeId, goToNodeId, selectedNodeId, selectedNodeSource]);

  const previousFocusedNodeId = useRef<string | null>(null);

  useEffect(() => {
    let updated = false;

    if (!previousFocusedNodeId.current) {
      previousFocusedNodeId.current = tree.focusedNodeId;
      updated = true;
    }

    if (
      tree.focusedNodeId &&
      (updated || previousFocusedNodeId.current !== tree.focusedNodeId)
    ) {
      previousFocusedNodeId.current = tree.focusedNodeId;
      goToNodeId(tree.focusedNodeId, "tree");
    }
  }, [previousFocusedNodeId, tree.focusedNodeId, tree.focusNode, goToNodeId]);

  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.focus({ preventScroll: true });
    }
  }, [treeRef.current]);

  const { minimal } = useJsonDoc();

  return (
    <>
      <CopySelectedNodeShortcut />
      <div
        className="text-white w-full"
        ref={parentRef}
        style={{
          height: `calc(100vh - ${minimal ? "66px" : "106px"})`,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          className="relative w-full outline-none"
          style={{ height: `${tree.totalSize}px` }}
          {...tree.getTreeProps()}
          ref={treeRef}
        >
          {tree.nodes.map((virtualNode) => (
            <TreeViewNode
              virtualNode={virtualNode}
              key={virtualNode.node.id}
              onToggle={(node, e) => tree.toggleNode(node.id, e)}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function TreeViewNode({
  virtualNode,
  onToggle,
  selectedNodeId,
}: {
  virtualNode: VirtualNode<JsonTreeViewNode>;
  selectedNodeId?: string;
  onToggle?: (node: JsonTreeViewNode, e: MouseEvent) => void;
}) {
  const { node, virtualItem, depth } = virtualNode;
  const api = useSchemaValidationAPI();
  const { validationMode } = useSchemaValidationState();

  const hasErrors = useMemo(() => {
    if (validationMode !== "external") return false;
    return api.hasErrorsAtPath(node.id);
  }, [node.id, api, validationMode]);

  const fieldFrequency = useMemo(() => {
    const parentPath = node.id.substring(0, node.id.lastIndexOf("."));
    const parentFreq = api.getFrequencyForPath(parentPath);
    if (!parentFreq) return null;

    const fieldName = node.id.substring(node.id.lastIndexOf(".") + 1);
    return parentFreq.frequencies.find((f) => f.fieldName === fieldName);
  }, [node.id, api]);

  const indentClassName = computeTreeNodePaddingClass(depth);

  const isSelected = selectedNodeId === node.id;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualNode.size}px`,
        transform: `translateY(${virtualNode.start}px)`,
      }}
      key={virtualNode.node.id}
      {...virtualNode.getItemProps()}
    >
      <div
        className={`h-full flex pl-5 rounded-sm select-none ${
          isSelected
            ? "bg-indigo-700"
            : hasErrors
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            : virtualItem.index % 2
            ? "dark:bg-slate-900"
            : "bg-slate-100 bg-opacity-90 dark:bg-slate-800 dark:bg-opacity-30"
        }`}
      >
        <div className={`pl-2 w-2/6 items-center flex`}>
          {node.children && node.children.length > 0 && (
            <span
              onClick={(e) => {
                if (onToggle) {
                  e.preventDefault();
                  onToggle(node, e.nativeEvent);
                }
              }}
            >
              {virtualNode.isCollapsed ? (
                <ChevronRightIcon
                  className={`w-4 h-4 mr-1 -ml-5  ${
                    isSelected
                      ? "text-slate-100"
                      : "text-slate-600 dark:text-slate-100"
                  }`}
                />
              ) : (
                <ChevronDownIcon
                  className={`w-4 h-4 mr-1 -ml-5 ${
                    isSelected
                      ? "text-slate-100"
                      : "text-slate-600 dark:text-slate-100"
                  }`}
                />
              )}
            </span>
          )}

          <div className="flex items-center">
            {hasErrors ? (
              <ExclamationIcon
                className={`w-4 h-4 mr-1 ${
                  isSelected ? "text-red-200" : "text-red-500"
                }`}
              />
            ) : (
              node.icon && (
                <span className="mr-2">
                  <node.icon
                    className={`h-5 w-5 ${
                      isSelected
                        ? "text-slate-100"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                </span>
              )
            )}

            <Body
              className={`${indentClassName} leading-8 truncate whitespace-nowrap pl-2 pr-2 ${
                isSelected
                  ? "text-slate-100"
                  : hasErrors
                  ? "text-red-700 dark:text-red-300"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {node.longTitle ?? node.name}
            </Body>

            {fieldFrequency && fieldFrequency.frequency < 100 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : fieldFrequency.frequency >= 75
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : fieldFrequency.frequency >= 50
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {fieldFrequency.frequency.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex w-4/6 items-center">
          {node.subtitle && (
            <Mono
              className={`truncate pr-1 transition ${
                isSelected
                  ? "text-slate-100"
                  : hasErrors
                  ? "text-red-500 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-200"
              }`}
            >
              {node.subtitle}
            </Mono>
          )}
        </div>
      </div>
    </div>
  );
}

function computeTreeNodePaddingClass(depth: number) {
  switch (depth) {
    case 0:
      return "ml-[4px] border-l border-slate-400/70";
    case 1:
      return "ml-[calc(12px_+_4px)] border-l border-pink-400/70";
    case 2:
      return "ml-[calc(12px_*_2_+_4px)] border-l border-blue-400/70";
    case 3:
      return "ml-[calc(12px_*_3_+_4px)] border-l border-orange-400/70";
    case 4:
      return "ml-[calc(12px_*_4_+_4px)] border-l border-emerald-400/70";
    case 5:
      return "ml-[calc(12px_*_5_+_4px)] border-l border-pink-400/70";
    case 6:
      return "ml-[calc(12px_*_6_+_4px)] border-l border-blue-400/70";
    case 7:
      return "ml-[calc(12px_*_7_+_4px)] border-l border-orange-400/70";
    case 8:
      return "ml-[calc(12px_*_8_+_4px)] border-l border-emerald-400/70";
    case 9:
      return "ml-[calc(12px_*_9_+_4px)] border-l border-pink-400/70";
    case 10:
      return "ml-[calc(12px_*_10_+_4px)] border-l border-orange-400/70";
    default:
      return "ml-[calc(12px_*_11_+_4px)] border-l border-slate-400/70";
  }
}
