import { ChevronRightIcon } from "@heroicons/react/outline";
import { Mono } from "./Primitives/Mono";
import { memo, useEffect, useMemo, useRef } from "react";
import { ColumnViewNode } from "~/useColumnView";
import { colorForItemAtPath } from "~/utilities/colors";
import { Body } from "./Primitives/Body";
import {
  useOptionalJsonDiffViewContext,
} from "./JsonDiffView";
import { DiffType } from "~/utilities/jsonDiff";

export type ColumnItemProps = {
  item: ColumnViewNode;
  json: unknown;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick?: (id: string) => void;
};

function ColumnItemElement({
  item,
  json,
  isSelected,
  isHighlighted,
  onClick,
}: ColumnItemProps) {
  const htmlElement = useRef<HTMLDivElement>(null);
  const diffViewContext = useOptionalJsonDiffViewContext();

  const showArrow = item.children.length > 0;

  const diffType: DiffType | null = useMemo(() => {
    if (!diffViewContext) return null;
    return diffViewContext.getDiffType(item.id);
  }, [diffViewContext, item.id]);

  const hasDiff: boolean = useMemo(() => {
    if (!diffViewContext) return false;
    return diffViewContext.hasDiff(item.id);
  }, [diffViewContext, item.id]);

  const diffBorderStyle = useMemo<string>(() => {
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

  const diffIndicatorStyle = useMemo<string>(() => {
    if (!hasDiff) return "";
    return "ring-1 ring-inset ring-slate-300/50 dark:ring-slate-600/50";
  }, [hasDiff]);

  const stateStyle = useMemo<string>(() => {
    if (isHighlighted) {
      return "bg-slate-300 text-slate-700 hover:bg-slate-400 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[15%] dark:text-slate-100";
    }

    if (isSelected) {
      return "bg-slate-200 hover:bg-slate-300 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[5%] dark:hover:bg-white dark:hover:bg-opacity-[10%] dark:text-slate-200";
    }

    return "hover:bg-slate-100 transition duration-75 ease-out dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:text-slate-400";
  }, [isSelected, isHighlighted]);

  const iconColor = useMemo<string>(
    () => colorForItemAtPath(item.id, json),
    [item.id, json]
  );

  useEffect(() => {
    if (isSelected || isHighlighted) {
      htmlElement.current?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    }
  }, [isSelected, isHighlighted]);

  const handleClick = () => {
    if (onClick) {
      onClick(item.id);
    }
  };

  return (
    <div
      className={`flex h-9 items-center justify-items-stretch mx-1 px-1 py-1 my-1 rounded-sm ${stateStyle} ${diffBorderStyle} ${diffIndicatorStyle}`}
      onClick={handleClick}
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
        <Body className="flex-grow flex-shrink-0 pl-3 pr-2 ">{item.title}</Body>
        {item.subtitle && (
          <Mono
            className={`truncate pr-1 transition duration-75 ${
              isHighlighted
                ? "text-gray-500 dark:text-slate-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {item.subtitle}
          </Mono>
        )}
      </div>

      {diffType && diffType !== "unchanged" && (
        <DiffBadge type={diffType} />
      )}

      {showArrow && (
        <ChevronRightIcon className="flex-none w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

function DiffBadge({ type }: { type: DiffType }) {
  const badgeStyle = useMemo(() => {
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

  const badgeText = useMemo(() => {
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

export const ColumnItem = memo(ColumnItemElement);
