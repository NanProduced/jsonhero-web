/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare-workers/globals" />
/// <reference types="@cloudflare/workers-types" />

declare module "@remix-run/server-runtime" {
  interface AppLoadContext {
    waitUntil: (promise: Promise<unknown>) => void;
  }
}
