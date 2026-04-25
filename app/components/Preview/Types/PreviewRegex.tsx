import { useState, useCallback, useMemo } from "react";
import { Body } from "~/components/Primitives/Body";
import { SmallBody } from "~/components/Primitives/SmallBody";
import { Mono } from "~/components/Primitives/Mono";
import { RegexData } from "~/utilities/formatDetectors";
import { PreviewBox } from "../PreviewBox";

export type PreviewRegexProps = {
  data: RegexData;
};

function highlightMatches(text: string, regex: RegExp): React.ReactNode {
  if (!regex.global) {
    const match = text.match(regex);
    if (!match) return text;

    const index = match.index || 0;
    const matchedText = match[0];

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-300 dark:bg-yellow-600 text-slate-900 dark:text-slate-100 px-0.5 rounded">
          {matchedText}
        </span>
        {text.substring(index + matchedText.length)}
      </>
    );
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    parts.push(
      <span
        key={`match-${match.index}`}
        className="bg-yellow-300 dark:bg-yellow-600 text-slate-900 dark:text-slate-100 px-0.5 rounded"
      >
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function PreviewRegex({ data }: PreviewRegexProps) {
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState(data.flags || "g");
  const [matches, setMatches] = useState<{
    count: number;
    results: Array<{ match: string; index: number; groups?: Record<string, string> }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(() => {
    if (!testString) {
      setMatches(null);
      setError(null);
      return;
    }

    try {
      const regex = new RegExp(data.pattern, flags);
      const results: Array<{ match: string; index: number; groups?: Record<string, string> }> = [];

      if (flags.includes("g")) {
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });

          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = testString.match(regex);
        if (match) {
          results.push({
            match: match[0],
            index: match.index || 0,
            groups: match.groups,
          });
        }
      }

      setMatches({
        count: results.length,
        results,
      });
      setError(null);
    } catch (err) {
      setError("Invalid regular expression");
      setMatches(null);
    }
  }, [data.pattern, flags, testString]);

  const highlightedTestString = useMemo(() => {
    if (!testString || !data.isValid) return testString;

    try {
      const regex = new RegExp(data.pattern, flags);
      return highlightMatches(testString, regex);
    } catch {
      return testString;
    }
  }, [testString, data.pattern, flags, data.isValid]);

  const availableFlags = [
    { flag: "g", label: "Global", description: "Find all matches" },
    { flag: "i", label: "Insensitive", description: "Case-insensitive" },
    { flag: "m", label: "Multiline", description: "^ and $ match line start/end" },
    { flag: "s", label: "DotAll", description: ". matches newline" },
    { flag: "u", label: "Unicode", description: "Unicode support" },
    { flag: "y", label: "Sticky", description: "Sticky matching" },
  ];

  return (
    <PreviewBox>
      <div className="space-y-4">
        <div>
          <Body className="font-medium">Regular Expression</Body>
          <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-sm">
            <Mono className="text-lg">
              <span className="text-slate-500">/</span>
              <span className="text-rose-500">{data.pattern}</span>
              <span className="text-slate-500">/</span>
              <span className="text-indigo-500">{flags || "(no flags)"}</span>
            </Mono>
          </div>
          {!data.isValid && (
            <SmallBody className="text-rose-500 mt-1">
              Invalid regular expression pattern
            </SmallBody>
          )}
        </div>

        {data.isValid && (
          <>
            <div>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-medium mb-2">
                Flags
              </SmallBody>
              <div className="flex flex-wrap gap-2">
                {availableFlags.map((f) => (
                  <button
                    key={f.flag}
                    onClick={() => {
                      if (flags.includes(f.flag)) {
                        setFlags(flags.replace(f.flag, ""));
                      } else {
                        setFlags(flags + f.flag);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                      flags.includes(f.flag)
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    }`}
                    title={f.description}
                  >
                    {f.flag}
                    <span className="ml-1 text-xs opacity-70">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-medium mb-2">
                Test String
              </SmallBody>
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter a string to test against the regex..."
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                rows={3}
              />
            </div>

            <button
              onClick={runTest}
              disabled={!testString}
              className="w-full py-2 px-4 bg-indigo-500 text-white rounded-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Regex
            </button>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-sm">
                <SmallBody className="text-rose-600 dark:text-rose-400">
                  {error}
                </SmallBody>
              </div>
            )}

            {matches && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                    Results
                  </SmallBody>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      matches.count > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {matches.count} match{matches.count !== 1 ? "es" : ""}
                  </span>
                </div>

                {testString && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-sm">
                    <SmallBody className="text-slate-500 dark:text-slate-400 mb-1 block">
                      With matches highlighted:
                    </SmallBody>
                    <Mono className="whitespace-pre-wrap break-all">
                      {highlightedTestString}
                    </Mono>
                  </div>
                )}

                {matches.results.length > 0 && (
                  <div className="space-y-2">
                    <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                      Match Details
                    </SmallBody>
                    {matches.results.slice(0, 10).map((result, index) => (
                      <div
                        key={index}
                        className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-sm"
                      >
                        <div className="flex items-center justify-between">
                          <SmallBody className="text-slate-500 dark:text-slate-400">
                            Match {index + 1}
                          </SmallBody>
                          <SmallBody className="text-slate-400 dark:text-slate-500">
                            Index: {result.index}
                          </SmallBody>
                        </div>
                        <Mono className="text-sm mt-1">
                          "{result.match}"
                        </Mono>
                        {result.groups && Object.keys(result.groups).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <SmallBody className="text-slate-500 dark:text-slate-400 mb-1">
                              Named Groups:
                            </SmallBody>
                            {Object.entries(result.groups).map(([name, value]) => (
                              <div key={name} className="flex items-center gap-2">
                                <SmallBody className="text-indigo-500">
                                  {name}:
                                </SmallBody>
                                <Mono className="text-sm">"{value}"</Mono>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {matches.results.length > 10 && (
                      <SmallBody className="text-slate-400 dark:text-slate-500">
                        ... and {matches.results.length - 10} more matches
                      </SmallBody>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PreviewBox>
  );
}
