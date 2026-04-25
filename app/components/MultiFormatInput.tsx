import { useState, useCallback, useRef } from "react";
import { Form, useSubmit, useTransition } from "remix";
import { useDropzone } from "react-dropzone";
import { ArrowCircleDownIcon } from "@heroicons/react/outline";
import invariant from "tiny-invariant";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import cx from "~/utilities/classnames";

export type InputMethod = "paste" | "url" | "curl" | "file";

export type AdvancedRequestOptions = {
  method: string;
  headers: string;
  body: string;
  showAdvanced: boolean;
};

const SUPPORTED_FORMATS = ["JSON", "XML", "CSV", "YAML"];
const SUPPORTED_EXTENSIONS = [".json", ".xml", ".csv", ".yaml", ".yml"];
const SUPPORTED_MIME_TYPES = [
  "application/json",
  "text/json",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/csv",
  "text/yaml",
  "application/yaml",
  "application/x-yaml",
];

function TabTrigger({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cx(
        "group inline-flex items-center space-x-2",
        "px-4 py-2 text-sm font-medium rounded-t-sm transition-all",
        "text-slate-400 hover:text-slate-200",
        "radix-state-active:text-white radix-state-active:bg-slate-800/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-opacity-50"
      )}
    >
      {icon}
      <span>{label}</span>
    </TabsPrimitive.Trigger>
  );
}

function TabContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Content
      value={value}
      className="mt-2 focus:outline-none"
    >
      {children}
    </TabsPrimitive.Content>
  );
}

function PasteInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (content: string) => void;
  isLoading: boolean;
}) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === "string") {
              setContent(result);
            } else if (result instanceof ArrayBuffer) {
              const decoder = new TextDecoder("utf-8");
              setContent(decoder.decode(result));
            }
          };
          reader.readAsText(file);
          break;
        }
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Paste your content (supports: {SUPPORTED_FORMATS.join(", ")})
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder={`Paste JSON, XML, CSV, or YAML content here...

Examples:
- JSON: {"key": "value"}
- XML: <root><item>value</item></root>
- CSV: name,age\nJohn,30
- YAML: key: value`}
          className="w-full h-40 p-3 text-sm font-mono text-slate-200 bg-slate-900/60 border border-slate-600 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 placeholder:text-slate-500"
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Tip: You can also paste files directly (Ctrl+V / Cmd+V)
        </p>
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-lime-500 hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-lime-500 transition"
        >
          {isLoading ? "Loading..." : "View"}
        </button>
      </div>
    </form>
  );
}

function UrlInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (url: string, options?: Partial<AdvancedRequestOptions>) => void;
  isLoading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url, {
        method,
        headers,
        body,
        showAdvanced,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Enter URL or paste curl command
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/data.json  or  curl https://api.example.com -H 'Authorization: Bearer token'"
          className="w-full p-3 text-sm text-slate-200 bg-slate-900/60 border border-slate-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 placeholder:text-slate-500"
          disabled={isLoading}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition"
        disabled={isLoading}
      >
        <span>{showAdvanced ? "▼" : "▶"}</span>
        <span>Advanced options (Headers, POST body, etc.)</span>
      </button>

      {showAdvanced && (
        <div className="p-3 bg-slate-800/40 rounded-sm space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              HTTP Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-2 text-sm text-slate-200 bg-slate-900/60 border border-slate-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              disabled={isLoading}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Headers (JSON format, e.g. {`{"Authorization": "Bearer token"}`})
            </label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer xxx"}'
              className="w-full h-20 p-2 text-sm font-mono text-slate-200 bg-slate-900/60 border border-slate-600 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 placeholder:text-slate-600"
              disabled={isLoading}
            />
          </div>

          {(method === "POST" || method === "PUT" || method === "PATCH") && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Request Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-24 p-2 text-sm font-mono text-slate-200 bg-slate-900/60 border border-slate-600 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 placeholder:text-slate-600"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-lime-500 hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-lime-500 transition"
        >
          {isLoading ? "Loading..." : "Fetch & View"}
        </button>
      </div>
    </form>
  );
}

function FileDropInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (content: string, filename: string) => void;
  isLoading: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const filenameInputRef = useRef<HTMLInputElement>(null);
  const rawContentInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      if (!formRef.current || !filenameInputRef.current) {
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const firstFile = acceptedFiles[0];

      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        if (reader.result == null) {
          return;
        }

        let content: string;

        if (typeof reader.result === "string") {
          content = reader.result;
        } else {
          const decoder = new TextDecoder("utf-8");
          content = decoder.decode(reader.result);
        }

        invariant(rawContentInputRef.current, "rawContentInputRef is null");
        invariant(filenameInputRef.current, "filenameInputRef is null");
        invariant(content, "content is undefined");

        rawContentInputRef.current.value = content;
        filenameInputRef.current.value = firstFile.name;

        onSubmit(content, firstFile.name);
      };
      reader.readAsArrayBuffer(firstFile);
    },
    [onSubmit]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: onDrop,
    maxFiles: 1,
    maxSize: 1024 * 1024 * 10,
    multiple: false,
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Drop or select a file
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Supported formats: {SUPPORTED_FORMATS.join(", ")} (extensions:{" "}
          {SUPPORTED_EXTENSIONS.join(", ")})
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`block min-w-[300px] cursor-pointer rounded-sm border-2 border-dashed p-6 text-center transition ${
          isDragActive
            ? "border-lime-500 bg-lime-500/10"
            : "border-slate-600 bg-slate-900/40 hover:border-slate-500"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} disabled={isLoading} />
        <ArrowCircleDownIcon
          className={`mx-auto h-10 w-10 mb-2 ${
            isDragActive ? "text-lime-500" : "text-slate-500"
          }`}
        />
        <p className={`text-base ${isDragActive ? "text-lime-400" : "text-slate-300"}`}>
          {isLoading
            ? "Processing..."
            : isDragActive
            ? "Drop the file here..."
            : "Drop a file here, or click to select"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Max size: 10MB
        </p>
      </div>

      <form ref={formRef} className="hidden">
        <input type="hidden" name="filename" ref={filenameInputRef} />
        <input type="hidden" name="rawContent" ref={rawContentInputRef} />
      </form>
    </div>
  );
}

export function MultiFormatInput() {
  const transition = useTransition();
  const submit = useSubmit();
  const [activeTab, setActiveTab] = useState<InputMethod>("paste");
  const [error, setError] = useState<string | null>(null);

  const isLoading = transition.state !== "idle";

  const handlePasteSubmit = (content: string) => {
    setError(null);
    submit(
      { action: "createFromContent", content },
      { method: "post", action: "/actions/createFromContent" }
    );
  };

  const handleUrlSubmit = (
    url: string,
    options?: Partial<AdvancedRequestOptions>
  ) => {
    setError(null);
    
    const formData: Record<string, string> = { url };
    
    if (options?.method) {
      formData.method = options.method;
    }
    if (options?.headers) {
      formData.headers = options.headers;
    }
    if (options?.body) {
      formData.body = options.body;
    }

    submit(formData, { method: "post", action: "/api/proxy" });
  };

  const handleFileSubmit = (content: string, filename: string) => {
    setError(null);
    submit(
      { action: "createFromContent", content, filename },
      { method: "post", action: "/actions/createFromContent" }
    );
  };

  const tabs = [
    { value: "paste", label: "Paste" },
    { value: "url", label: "URL / cURL" },
    { value: "file", label: "File" },
  ];

  return (
    <div className="bg-indigo-700 text-white rounded-sm shadow-md w-full max-w-2xl p-4 transition">
      <div className="flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-sm">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <TabsPrimitive.Root
          defaultValue={tabs[0].value}
          onValueChange={(value) => setActiveTab(value as InputMethod)}
        >
          <TabsPrimitive.List className="flex border-b border-slate-600/50 mb-2">
            {tabs.map(({ value, label }) => (
              <TabTrigger key={value} value={value} label={label} />
            ))}
          </TabsPrimitive.List>

          <TabContent value="paste">
            <PasteInput onSubmit={handlePasteSubmit} isLoading={isLoading} />
          </TabContent>

          <TabContent value="url">
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
          </TabContent>

          <TabContent value="file">
            <FileDropInput onSubmit={handleFileSubmit} isLoading={isLoading} />
          </TabContent>
        </TabsPrimitive.Root>
      </div>
    </div>
  );
}
