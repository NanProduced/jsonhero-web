import { ActionFunction, LoaderFunction, json } from "remix";
import { validateUrl, sanitizeHeaders, parseCurlCommand } from "~/utilities/security";
import { converterManager } from "~/utilities/converters";
import { createFromRawJson } from "~/jsonDoc.server";
import { sendEvent } from "~/graphJSON.server";

const REQUEST_TIMEOUT = 10000;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;

export type ProxyRequest = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  format?: string;
};

export type ProxyResponse = {
  success: boolean;
  data?: {
    id: string;
    title: string;
    type: string;
    originalFormat?: string;
  };
  error?: string;
  errorType?: string;
};

export const action: ActionFunction = async ({ request, context, params }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: ProxyRequest;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = {
        url: formData.get("url") as string,
        method: (formData.get("method") as string) || "GET",
        headers: formData.get("headers") ? JSON.parse(formData.get("headers") as string) : {},
        body: formData.get("body") as string,
        format: formData.get("format") as string,
      };
    } else {
      return json<ProxyResponse>(
        {
          success: false,
          error: "Unsupported content type. Use application/json or application/x-www-form-urlencoded.",
          errorType: "INVALID_CONTENT_TYPE",
        },
        { status: 400 }
      );
    }

    if (!body.url || body.url.trim() === "") {
      return json<ProxyResponse>(
        {
          success: false,
          error: "URL is required",
          errorType: "MISSING_URL",
        },
        { status: 400 }
      );
    }

    let requestConfig: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
    };

    if (body.url.trim().toLowerCase().startsWith("curl ")) {
      const parsed = parseCurlCommand(body.url);
      if (!parsed.url) {
        return json<ProxyResponse>(
          {
            success: false,
            error: "Could not extract URL from curl command",
            errorType: "INVALID_CURL_COMMAND",
          },
          { status: 400 }
        );
      }
      requestConfig = parsed;
    } else {
      requestConfig = {
        url: body.url,
        method: (body.method || "GET").toUpperCase(),
        headers: body.headers || {},
        body: body.body,
      };
    }

    const urlValidation = validateUrl(requestConfig.url);
    if (!urlValidation.valid || !urlValidation.url) {
      return json<ProxyResponse>(
        {
          success: false,
          error: urlValidation.error || "Invalid URL",
          errorType: "INVALID_URL",
        },
        { status: 400 }
      );
    }

    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    if (!validMethods.includes(requestConfig.method)) {
      return json<ProxyResponse>(
        {
          success: false,
          error: `Invalid method: ${requestConfig.method}. Allowed methods: ${validMethods.join(", ")}`,
          errorType: "INVALID_METHOD",
        },
        { status: 400 }
      );
    }

    const sanitizedHeaders = sanitizeHeaders(requestConfig.headers);
    
    if (!sanitizedHeaders["User-Agent"] && !sanitizedHeaders["user-agent"]) {
      sanitizedHeaders["User-Agent"] = "jsonhero-web/1.0";
    }

    if (!sanitizedHeaders["Accept"] && !sanitizedHeaders["accept"]) {
      sanitizedHeaders["Accept"] = "application/json, text/xml, text/csv, text/yaml, */*;q=0.8";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const fetchOptions: RequestInit = {
      method: requestConfig.method,
      headers: sanitizedHeaders as HeadersInit,
      signal: controller.signal,
    };

    if (requestConfig.body && ["POST", "PUT", "PATCH"].includes(requestConfig.method)) {
      fetchOptions.body = requestConfig.body;
      
      if (!sanitizedHeaders["Content-Type"] && !sanitizedHeaders["content-type"]) {
        try {
          JSON.parse(requestConfig.body);
          (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
        } catch {
          (fetchOptions.headers as Record<string, string>)["Content-Type"] = "text/plain";
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(urlValidation.url.href, fetchOptions);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === "AbortError") {
        return json<ProxyResponse>(
          {
            success: false,
            error: "Request timed out. The server took too long to respond.",
            errorType: "TIMEOUT",
          },
          { status: 408 }
        );
      }
      
      return json<ProxyResponse>(
        {
          success: false,
          error: `Failed to fetch URL: ${error instanceof Error ? error.message : "Unknown error"}`,
          errorType: "FETCH_ERROR",
        },
        { status: 502 }
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      return json<ProxyResponse>(
        {
          success: false,
          error: `Server returned error status: ${response.status} ${response.statusText}`,
          errorType: "HTTP_ERROR",
        },
        { status: response.status }
      );
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return json<ProxyResponse>(
        {
          success: false,
          error: `Response too large. Maximum allowed size is ${MAX_RESPONSE_SIZE / 1024 / 1024}MB.`,
          errorType: "RESPONSE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    let responseText: string;
    try {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_RESPONSE_SIZE) {
        return json<ProxyResponse>(
          {
            success: false,
            error: `Response too large. Maximum allowed size is ${MAX_RESPONSE_SIZE / 1024 / 1024}MB.`,
            errorType: "RESPONSE_TOO_LARGE",
          },
          { status: 413 }
        );
      }
      responseText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    } catch (error) {
      return json<ProxyResponse>(
        {
          success: false,
          error: `Failed to read response: ${error instanceof Error ? error.message : "Unknown error"}`,
          errorType: "READ_ERROR",
        },
        { status: 500 }
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      return json<ProxyResponse>(
        {
          success: false,
          error: "Empty response received from server.",
          errorType: "EMPTY_RESPONSE",
        },
        { status: 204 }
      );
    }

    const responseContentType = response.headers.get("content-type") || "";
    
    const conversionResult = converterManager.convertFromUrlResponse(
      responseText,
      responseContentType,
      urlValidation.url.href
    );

    if (!conversionResult.success || !conversionResult.data) {
      return json<ProxyResponse>(
        {
          success: false,
          error: conversionResult.error || "Failed to convert response to JSON",
          errorType: "CONVERSION_ERROR",
        },
        { status: 400 }
      );
    }

    const detectedConverter = converterManager.detectFormat(responseText);
    const originalFormat = detectedConverter?.name || "JSON";

    const title = urlValidation.url.hostname + urlValidation.url.pathname;
    
    const doc = await createFromRawJson(title, conversionResult.data);

    const requestUrl = new URL(request.url);
    context.waitUntil(
      sendEvent({
        type: "create",
        from: "proxy",
        id: doc.id,
        source: urlValidation.url.hostname,
        metadata: {
          originalFormat,
          method: requestConfig.method,
        },
      })
    );

    return json<ProxyResponse>({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        type: doc.type,
        originalFormat,
      },
    });
  } catch (error) {
    console.error("Proxy endpoint error:", error);
    return json<ProxyResponse>(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        errorType: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
};

export const loader: LoaderFunction = async ({ request, context, params }) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  const method = url.searchParams.get("method") || "GET";
  const format = url.searchParams.get("format");

  if (!targetUrl) {
    return json<ProxyResponse>(
      {
        success: false,
        error: "URL parameter is required",
        errorType: "MISSING_URL",
      },
      { status: 400 }
    );
  }

  const fakeRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      method,
      format,
    }),
  });

  return action({ request: fakeRequest, context, params });
};
