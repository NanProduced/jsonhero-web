import { useState, useMemo, useCallback } from "react";
import { Body } from "~/components/Primitives/Body";
import { Title } from "~/components/Primitives/Title";
import { PreviewBox } from "../PreviewBox";

export type PreviewRegexProps = {
  pattern: string;
  flags?: string;
};

export function PreviewRegex({ pattern, flags }: PreviewRegexProps) {
  const [testString, setTestString] = useState(
    "The quick brown fox jumps over the lazy dog. Email: test@example.com, Phone: 123-456-7890"
  );
  const [showReplace, setShowReplace] = useState(false);
  const [replaceText, setReplaceText] = useState("[$&]");
  const [globalMode, setGlobalMode] = useState(flags?.includes("g") ?? true);
  const [caseInsensitive, setCaseInsensitive] = useState(flags?.includes("i") ?? false);
  const [multiline, setMultiline] = useState(flags?.includes("m") ?? false);
  const [dotAll, setDotAll] = useState(flags?.includes("s") ?? false);
  const [unicode, setUnicode] = useState(flags?.includes("u") ?? false);
  const [sticky, setSticky] = useState(flags?.includes("y") ?? false);

  const computedFlags = useMemo(() => {
    let f = "";
    if (globalMode) f += "g";
    if (caseInsensitive) f += "i";
    if (multiline) f += "m";
    if (dotAll) f += "s";
    if (unicode) f += "u";
    if (sticky) f += "y";
    return f;
  }, [globalMode, caseInsensitive, multiline, dotAll, unicode, sticky]);

  const regexResult = useMemo(() => {
    try {
      const regex = new RegExp(pattern, computedFlags);
      const matches: Array<{
        match: string;
        index: number;
        groups?: Record<string, string>;
      }> = [];

      if (computedFlags.includes("g")) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });
        }
      }

      const highlightedText = highlightMatches(testString, matches);

      const replacedText = showReplace
        ? testString.replace(new RegExp(pattern, computedFlags), replaceText)
        : null;

      return {
        valid: true,
        matches,
        matchCount: matches.length,
        highlightedText,
        replacedText,
        error: null,
      };
    } catch (e) {
      return {
        valid: false,
        matches: [],
        matchCount: 0,
        highlightedText: null,
        replacedText: null,
        error: e instanceof Error ? e.message : "Invalid regex pattern",
      };
    }
  }, [pattern, computedFlags, testString, showReplace, replaceText]);

  const handleTestStringChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTestString(e.target.value);
    },
    []
  );

  return (
    <div>
      <PreviewBox>
        <div className="space-y-4">
          <div>
            <Title className="text-slate-700 dark:text-slate-400 mb-2">
              Regular Expression Tester
            </Title>

            <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm">
              <span className="text-slate-500 dark:text-slate-400">/</span>
              <span className="text-slate-800 dark:text-slate-200 break-all">{pattern}</span>
              <span className="text-slate-500 dark:text-slate-400">/</span>
              <span className="text-purple-600 dark:text-purple-400">{computedFlags}</span>
            </div>

            {regexResult.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 rounded-md border border-red-200 dark:border-red-800">
                <Body className="text-red-600 dark:text-red-300 text-sm">
                  ⚠ {regexResult.error}
                </Body>
              </div>
            )}
          </div>

          <div>
            <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
              Flags
            </Body>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "g", label: "Global", value: globalMode, setter: setGlobalMode },
                { key: "i", label: "Insensitive", value: caseInsensitive, setter: setCaseInsensitive },
                { key: "m", label: "Multiline", value: multiline, setter: setMultiline },
                { key: "s", label: "DotAll", value: dotAll, setter: setDotAll },
                { key: "u", label: "Unicode", value: unicode, setter: setUnicode },
                { key: "y", label: "Sticky", value: sticky, setter: setSticky },
              ].map(({ key, label, value, setter }) => (
                <button
                  key={key}
                  onClick={() => setter(!value)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    value
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  {key} <span className="opacity-70">({label})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Body className="text-sm text-slate-500 dark:text-slate-500">
                Test String
              </Body>
              {regexResult.valid && (
                <Body
                  className={`text-sm font-medium ${
                    regexResult.matchCount > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-500"
                  }`}
                >
                  {regexResult.matchCount} match{regexResult.matchCount !== 1 ? "es" : ""}
                </Body>
              )}
            </div>
            <textarea
              value={testString}
              onChange={handleTestStringChange}
              className="w-full h-24 p-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
              placeholder="Enter text to test against the regex..."
            />
          </div>

          {regexResult.valid && regexResult.highlightedText && (
            <div>
              <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
                Highlighted Matches
              </Body>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-sm whitespace-pre-wrap break-all">
                {regexResult.highlightedText}
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowReplace(!showReplace)}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <span
                className={`transform transition-transform ${showReplace ? "rotate-90" : ""}`}
              >
                ▶
              </span>
              Replace
            </button>

            {showReplace && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full p-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  placeholder="Replacement text (use $1, $2, etc. for groups)"
                />

                {regexResult.replacedText !== null && (
                  <div>
                    <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
                      Result
                    </Body>
                    <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-md font-mono text-sm whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                      {regexResult.replacedText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {regexResult.valid && regexResult.matches.length > 0 && (
            <div>
              <Body className="text-sm text-slate-500 dark:text-slate-500 mb-2">
                Match Details
              </Body>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {regexResult.matches.slice(0, 10).map((match, index) => (
                  <div
                    key={index}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        Match {index + 1}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        at index {match.index}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-sm text-slate-800 dark:text-slate-200 break-all">
                      "{match.match}"
                    </div>
                    {match.groups && Object.keys(match.groups).length > 0 && (
                      <div className="mt-1 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Groups: </span>
                        {Object.entries(match.groups).map(([key, value]) => (
                          <span key={key} className="text-purple-600 dark:text-purple-400">
                            {key}: "{value}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {regexResult.matches.length > 10 && (
                  <Body className="text-sm text-slate-500 dark:text-slate-500 text-center">
                    ... and {regexResult.matches.length - 10} more matches
                  </Body>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <Body className="text-xs text-slate-500 dark:text-slate-400">
              Replace tokens: $&amp; (match), $1, $2... (groups), $$ (literal $)
            </Body>
          </div>
        </div>
      </PreviewBox>
    </div>
  );
}

function highlightMatches(
  text: string,
  matches: Array<{ match: string; index: number }>
): React.ReactNode {
  if (matches.length === 0) {
    return text;
  }

  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

  const nonOverlapping: typeof matches = [];
  let lastEnd = 0;

  for (const match of sortedMatches) {
    if (match.index >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.index + match.match.length;
    }
  }

  const segments: React.ReactNode[] = [];
  let currentIndex = 0;

  for (let i = 0; i < nonOverlapping.length; i++) {
    const match = nonOverlapping[i];
    const matchEnd = match.index + match.match.length;

    if (match.index > currentIndex) {
      segments.push(
        <span key={`text-${i}`} className="text-slate-800 dark:text-slate-200">
          {text.slice(currentIndex, match.index)}
        </span>
      );
    }

    segments.push(
      <mark
        key={`match-${i}`}
        className="bg-yellow-200 dark:bg-yellow-700 text-slate-900 dark:text-slate-100 rounded px-0.5"
      >
        {text.slice(match.index, matchEnd)}
      </mark>
    );

    currentIndex = matchEnd;
  }

  if (currentIndex < text.length) {
    segments.push(
      <span key="text-end" className="text-slate-800 dark:text-slate-200">
        {text.slice(currentIndex)}
      </span>
    );
  }

  return segments;
}
