import { ChevronRightIcon, ExclamationIcon } from "@heroicons/react/outline";
import { Mono } from "./Primitives/Mono";
import { memo, useEffect, useMemo, useRef } from "react";
import { ColumnViewNode } from "~/useColumnView";
import { colorForItemAtPath } from "~/utilities/colors";
import { Body } from "./Primitives/Body";
import { useSchemaValidationAPI, useSchemaValidationState } from "~/hooks/useSchemaValidation";

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
  const api = useSchemaValidationAPI();
  const { validationMode } = useSchemaValidationState();

  const hasErrors = useMemo(() => {
    if (validationMode !== "external") return false;
    return api.hasErrorsAtPath(item.id);
  }, [item.id, api, validationMode]);

  const fieldFrequency = useMemo(() => {
    const freqResult = api.getFrequencyForPath(item.id);
    if (!freqResult) return null;

    const parentPath = item.id.substring(0, item.id.lastIndexOf("."));
    const parentFreq = api.getFrequencyForPath(parentPath);
    if (!parentFreq) return null;

    const fieldName = item.id.substring(item.id.lastIndexOf(".") + 1);
    return parentFreq.frequencies.find((f) => f.fieldName === fieldName);
  }, [item.id, api]);

  const showArrow = item.children.length > 0;

  const stateStyle = useMemo<string>(() => {
    if (hasErrors) {
      if (isHighlighted) {
        return "bg-red-200 text-red-900 hover:bg-red-300 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-red-900 dark:bg-opacity-[25%] dark:text-red-200 border border-red-400 dark:border-red-600";
      }
      if (isSelected) {
        return "bg-red-100 hover:bg-red-200 transition duration-75 ease-out dark:bg-red-900 dark:bg-opacity-[15%] dark:hover:bg-red-900 dark:hover:bg-opacity-[20%] dark:text-red-300 border border-red-300 dark:border-red-700";
      }
      return "bg-red-50 hover:bg-red-100 transition duration-75 ease-out dark:hover:bg-red-900 dark:hover:bg-opacity-[10%] dark:text-red-400 border border-red-200 dark:border-red-800";
    }

    if (isHighlighted) {
      return "bg-slate-300 text-slate-700 hover:bg-slate-400 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[15%] dark:text-slate-100";
    }

    if (isSelected) {
      return "bg-slate-200 hover:bg-slate-300 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[5%] dark:hover:bg-white dark:hover:bg-opacity-[10%] dark:text-slate-200";
    }

    return "hover:bg-slate-100 transition duration-75 ease-out dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:text-slate-400";
  }, [isSelected, isHighlighted, hasErrors]);

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

  return (
    <div
      className={`flex h-9 items-center justify-items-stretch mx-1 px-1 py-1 my-1 rounded-sm ${stateStyle}`}
      onClick={() => onClick && onClick(item.id)}
      ref={htmlElement}
    >
      <div className="w-4 flex-none flex-col justify-items-center">
        {hasErrors ? (
          <ExclamationIcon
            className={`h-5 w-5 ${
              isSelected && isHighlighted
                ? "text-red-700 dark:text-red-300"
                : "text-red-500"
            }`}
          />
        ) : (
          item.icon && (
            <item.icon
              className={`h-5 w-5 ${
                isSelected && isHighlighted
                  ? "text-slate-900 dark:text-slate-300"
                  : "text-slate-500"
              }`}
            />
          )
        )}
      </div>

      <div className="flex flex-grow flex-shrink items-baseline justify-between truncate">
        <div className="flex items-center flex-grow flex-shrink-0 pl-3 pr-2">
          <Body className="flex-grow flex-shrink-0">{item.title}</Body>
          {fieldFrequency && fieldFrequency.frequency < 100 && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                fieldFrequency.frequency >= 75
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

      {showArrow && (
        <ChevronRightIcon className="flex-none w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

export const ColumnItem = memo(ColumnItemElement);
