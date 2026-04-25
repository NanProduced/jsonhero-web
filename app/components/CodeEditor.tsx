import { json as jsonLang } from "@codemirror/lang-json";
import {
  EditorView,
  TransactionSpec,
  useCodeMirror,
  ViewUpdate,
  Decoration,
  DecorationSet,
} from "@uiw/react-codemirror";
import { useRef, useEffect, useMemo, useState } from "react";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { getEditorSetup } from "~/utilities/codeMirrorSetup";
import { darkTheme, lightTheme } from "~/utilities/codeMirrorTheme";
import { useTheme } from "./ThemeProvider";
import { useHotkeys } from "react-hotkeys-hook";
import { Extension } from "@codemirror/state";

export type CodeEditorProps = {
  content: string;
  language?: "json";
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onUpdate?: (update: ViewUpdate) => void;
  selection?: { start: number; end: number };
  errorRanges?: Array<{ start: number; end: number; path: string }>;
};

const languages = {
  json: jsonLang,
};

type CodeEditorDefaultProps = Required<
  Omit<CodeEditorProps, "content" | "onChange" | "onUpdate">
>;

const defaultProps: CodeEditorDefaultProps = {
  language: "json",
  readOnly: true,
  selection: { start: 0, end: 0 },
  errorRanges: [],
};

function createErrorDecorations(
  errorRanges: Array<{ start: number; end: number; path: string }>,
  doc: { length: number }
): DecorationSet {
  const decorations: Array<{ from: number; to: number; value: Decoration }> = [];

  errorRanges.forEach(({ start, end }) => {
    const from = Math.max(0, start);
    const to = Math.min(end, doc.length);

    if (from < to) {
      decorations.push({
        from,
        to,
        value: Decoration.mark({
          class: "cm-error-highlight",
        }),
      });
    }
  });

  return Decoration.set(
    decorations.sort((a, b) => a.from - b.from)
  );
}

export function CodeEditor(opts: CodeEditorProps) {
  const { content, language, readOnly, onChange, onUpdate, selection, errorRanges } = {
    ...defaultProps,
    ...opts,
  };

  const [theme] = useTheme();
  const [currentDecorations, setCurrentDecorations] = useState<DecorationSet>(Decoration.none);

  const extensions = useMemo<Extension[]>(() => {
    const exts = getEditorSetup();
    const languageExtension = languages[language];
    exts.push(languageExtension());

    exts.push(
      EditorView.theme({
        ".cm-error-highlight": {
          backgroundColor: "rgba(239, 68, 68, 0.3)",
          borderBottom: "2px solid #ef4444",
        },
      })
    );

    return exts;
  }, [language]);

  const editor = useRef(null);
  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    extensions,
    editable: !readOnly,
    contentEditable: !readOnly,
    value: content,
    autoFocus: false,
    theme: theme === "light" ? lightTheme() : darkTheme(),
    indentWithTab: false,
    basicSetup: false,
    onChange,
    onUpdate,
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  const setSelectionRef = useRef(false);

  useEffect(() => {
    if (setSelectionRef.current) {
      return;
    }

    if (view) {
      setSelectionRef.current = true;

      const selectionStart = selection?.start ?? defaultProps.selection.start;
      const selectionEnd = selection?.end ?? defaultProps.selection.end;

      const transactionSpec: TransactionSpec = {
        selection: { anchor: selectionStart, head: selectionEnd },
        effects: EditorView.scrollIntoView(selectionStart, {
          y: "start",
          yMargin: 100,
        }),
      };

      view.dispatch(transactionSpec);
    }
  }, [selection, view, setSelectionRef.current]);

  useEffect(() => {
    if (!view || !errorRanges || errorRanges.length === 0) {
      if (currentDecorations !== Decoration.none) {
        setCurrentDecorations(Decoration.none);
      }
      return;
    }

    const newDecorations = createErrorDecorations(errorRanges, view.state.doc);
    setCurrentDecorations(newDecorations);
  }, [view, errorRanges, currentDecorations]);

  const { minimal } = useJsonDoc();

  useHotkeys(
    "ctrl+a,meta+a,command+a",
    (e) => {
      e.preventDefault();
      view?.dispatch({ selection: { anchor: 0, head: state?.doc.length } });
    },
    [view, state]
  );

  return (
    <div>
      <div
        className={`${
          minimal ? "h-jsonViewerHeightMinimal" : "h-jsonViewerHeight"
        } overflow-y-auto no-scrollbar`}
        ref={editor}
      />
    </div>
  );
}
