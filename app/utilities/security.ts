export function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  
  if (parts.length !== 4 || parts.some((part) => isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  if (parts[0] === 10) return true;
  
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  if (parts[0] === 127) return true;
  
  if (parts[0] === 0) return true;
  
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  
  if (parts[0] === 169 && parts[1] === 254) return true;
  
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
  
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
  
  if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
  
  if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
  
  if (parts[0] >= 224 && parts[0] <= 239) return true;
  
  if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

  return false;
}

export function isLoopback(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "localhost.") return true;
  
  if (hostname.endsWith(".localhost") || hostname.endsWith(".localhost.")) return true;
  
  return false;
}

export function isInternalHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().trim();
  
  if (isLoopback(normalizedHostname)) return true;
  
  if (normalizedHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return isPrivateIp(normalizedHostname);
  }
  
  const ipv6Match = normalizedHostname.match(/^\[([0-9a-f:.]+)\]$/i);
  if (ipv6Match) {
    const ipv6 = ipv6Match[1].toLowerCase();
    if (ipv6 === "::1" || ipv6 === "0:0:0:0:0:0:0:1") return true;
    if (ipv6.startsWith("fc00:") || ipv6.startsWith("fd00:")) return true;
    if (ipv6.startsWith("fe80:")) return true;
    if (ipv6 === "::" || ipv6 === "0:0:0:0:0:0:0:0") return true;
  }
  
  if (normalizedHostname.includes("localhost")) return true;
  
  if (normalizedHostname === "metadata" || 
      normalizedHostname === "metadata.google.internal" ||
      normalizedHostname.endsWith(".internal")) return true;

  return false;
}

export function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const url = new URL(urlString);
    
    const protocol = url.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return {
        valid: false,
        error: `Invalid protocol: ${protocol}. Only HTTP and HTTPS are allowed.`,
      };
    }
    
    const hostname = url.hostname;
    
    if (isInternalHostname(hostname)) {
      return {
        valid: false,
        error: "Access to internal/loopback addresses is not allowed for security reasons.",
      };
    }
    
    if (url.port && url.port !== "80" && url.port !== "443") {
      return {
        valid: false,
        error: `Port ${url.port} is not allowed. Only standard ports (80, 443) are permitted.`,
      };
    }
    
    return { valid: true, url };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid URL",
    };
  }
}

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const blockedHeaders = [
    "host",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "upgrade",
    "sec-websocket-key",
    "sec-websocket-extensions",
    "sec-websocket-accept",
    "sec-websocket-protocol",
    "sec-websocket-version",
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (!blockedHeaders.includes(lowerKey)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function parseCurlCommand(curlCommand: string): {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
} {
  const result: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  } = {
    url: "",
    method: "GET",
    headers: {},
  };

  const tokens: string[] = [];
  let currentToken = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < curlCommand.length; i++) {
    const char = curlCommand[i];

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar && curlCommand[i - 1] !== "\\") {
      inQuotes = false;
      quoteChar = "";
    } else if (!inQuotes && (char === " " || char === "\t" || char === "\n")) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "curl") continue;

    if ((token === "-X" || token === "--request") && i + 1 < tokens.length) {
      result.method = tokens[i + 1].toUpperCase();
      i++;
      continue;
    }

    if ((token === "-H" || token === "--header") && i + 1 < tokens.length) {
      const headerStr = tokens[i + 1];
      const colonIndex = headerStr.indexOf(":");
      if (colonIndex > 0) {
        const key = headerStr.slice(0, colonIndex).trim();
        const value = headerStr.slice(colonIndex + 1).trim();
        result.headers[key] = value;
      }
      i++;
      continue;
    }

    if ((token === "-d" || token === "--data" || token === "--data-raw") && i + 1 < tokens.length) {
      result.body = tokens[i + 1];
      if (!result.method || result.method === "GET") {
        result.method = "POST";
      }
      i++;
      continue;
    }

    if ((token === "-F" || token === "--form") && i + 1 < tokens.length) {
      if (!result.method || result.method === "GET") {
        result.method = "POST";
      }
      i++;
      continue;
    }

    if (token === "-G" || token === "--get") {
      result.method = "GET";
      continue;
    }

    if (token === "--head" || token === "-I") {
      result.method = "HEAD";
      continue;
    }

    if (token.match(/^https?:\/\//i)) {
      result.url = token;
      continue;
    }

    if (token.match(/^www\./i)) {
      result.url = "https://" + token;
      continue;
    }
  }

  return result;
}
