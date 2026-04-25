import { useState, useRef } from "react";
import { useCompare } from "~/hooks/useCompare";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./UI/Popover";
import { Body } from "./Primitives/Body";
import { SmallTitle } from "./Primitives/SmallTitle";
import { CodeIcon, ArrowRightIcon } from "@heroicons/react/outline";
import { JSONDocument } from "~/jsonDoc.server";

export interface CompareDialogProps {
  trigger: React.ReactNode;
}

export function CompareDialog({ trigger }: CompareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputType, setInputType] = useState<"id" | "json" | "url">("id");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enterCompareMode } = useCompare();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    if (!inputValue.trim()) {
      setError("Please enter a value");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (inputType === "id") {
        const response = await fetch(`/api/create.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlOrJson: inputValue.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to load document");
        }

        const result = await response.json();
        if (result.json !== undefined) {
          enterCompareMode(undefined, result.json);
        } else {
          throw new Error("Invalid response");
        }
      } else if (inputType === "json") {
        try {
          const json = JSON.parse(inputValue.trim());
          enterCompareMode(undefined, json);
        } catch {
          throw new Error("Invalid JSON");
        }
      } else if (inputType === "url") {
        const response = await fetch(`/api/create.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlOrJson: inputValue.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to load URL");
        }

        const result = await response.json();
        if (result.json !== undefined) {
          enterCompareMode(undefined, result.json);
        } else {
          throw new Error("Invalid response");
        }
      }

      setIsOpen(false);
      setInputValue("");
    } catch (e: any) {
      setError(e.message || "Failed to compare");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCompare();
    }
  };

  const getPlaceholder = () => {
    switch (inputType) {
      case "id":
        return "Enter document ID or URL...";
      case "json":
        return "Paste JSON here...";
      case "url":
        return "Enter JSON URL...";
      default:
        return "";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="bottom" sideOffset={8} className="w-96">
        <div className="space-y-4">
          <div>
            <SmallTitle className="mb-2">Compare with...</SmallTitle>
            <div className="flex space-x-2 mb-3">
              <CompareTypeButton
                active={inputType === "id"}
                onClick={() => setInputType("id")}
              >
                Document
              </CompareTypeButton>
              <CompareTypeButton
                active={inputType === "json"}
                onClick={() => setInputType("json")}
              >
                JSON
              </CompareTypeButton>
              <CompareTypeButton
                active={inputType === "url"}
                onClick={() => setInputType("url")}
              >
                URL
              </CompareTypeButton>
            </div>
          </div>

          <div>
            {inputType === "json" ? (
              <textarea
                ref={inputRef as any}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="w-full h-24 px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            )}
          </div>

          {error && (
            <Body className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </Body>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCompare}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  Compare
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
        <PopoverArrow
          className="fill-current text-indigo-700"
          offset={60}
        />
      </PopoverContent>
    </Popover>
  );
}

function CompareTypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded transition ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
