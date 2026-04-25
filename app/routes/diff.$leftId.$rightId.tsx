import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
  ThrownResponse,
  useCatch,
  useLoaderData,
  useLocation,
  useParams,
} from "remix";
import invariant from "tiny-invariant";
import { deleteDocument, getDocument, JSONDocument } from "~/jsonDoc.server";
import { JsonDocProvider } from "~/hooks/useJsonDoc";
import { useEffect, useMemo } from "react";
import { JsonProvider } from "~/hooks/useJson";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { InfoPanel } from "~/components/InfoPanel";
import Resizable from "~/components/Resizable";
import { SideBar } from "~/components/SideBar";
import { JsonColumnViewProvider } from "~/hooks/useJsonColumnView";
import { JsonSchemaProvider } from "~/hooks/useJsonSchema";
import safeFetch from "~/utilities/safeFetch";
import { JsonTreeViewProvider } from "~/hooks/useJsonTree";
import { JsonSearchProvider } from "~/hooks/useJsonSearch";
import { LargeTitle } from "~/components/Primitives/LargeTitle";
import { ExtraLargeTitle } from "~/components/Primitives/ExtraLargeTitle";
import { Body } from "~/components/Primitives/Body";
import { PageNotFoundTitle } from "~/components/Primitives/PageNotFoundTitle";
import { SmallSubtitle } from "~/components/Primitives/SmallSubtitle";
import { Logo } from "~/components/Icons/Logo";
import {
  commitSession,
  getSession,
  setErrorMessage,
  setSuccessMessage,
} from "~/services/toast.server";
import { getRandomUserAgent } from "~/utilities/getRandomUserAgent";
import { computeJsonDiff, DiffResult } from "~/utilities/jsonDiff";
import {
  JsonDiffSyncProvider,
  useJsonDiffSync,
} from "~/hooks/useJsonDiffSync";
import { JsonDiffView } from "~/components/JsonDiffView";

export const loader: LoaderFunction = async ({ params, request }) => {
  invariant(params.leftId, "expected params.leftId");
  invariant(params.rightId, "expected params.rightId");

  const leftDoc = await getDocument(params.leftId);
  const rightDoc = await getDocument(params.rightId);

  if (!leftDoc || !rightDoc) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const path = getPathFromRequest(request);
  const minimal = getMinimalFromRequest(request);

  let leftJson: unknown;
  let rightJson: unknown;

  if (leftDoc.type == "url") {
    console.log(`Fetching ${leftDoc.url}...`);
    const jsonResponse = await safeFetch(leftDoc.url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
      },
    });

    if (!jsonResponse.ok) {
      const jsonResponseText = await jsonResponse.text();
      const error = `Failed to fetch ${leftDoc.url}. HTTP status: ${jsonResponse.status} (${jsonResponseText}})`;
      console.error(error);
      throw new Response(error, {
        status: jsonResponse.status,
      });
    }
    leftJson = await jsonResponse.json();
  } else {
    leftJson = JSON.parse(leftDoc.contents);
  }

  if (rightDoc.type == "url") {
    console.log(`Fetching ${rightDoc.url}...`);
    const jsonResponse = await safeFetch(rightDoc.url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
      },
    });

    if (!jsonResponse.ok) {
      const jsonResponseText = await jsonResponse.text();
      const error = `Failed to fetch ${rightDoc.url}. HTTP status: ${jsonResponse.status} (${jsonResponseText}})`;
      console.error(error);
      throw new Response(error, {
        status: jsonResponse.status,
      });
    }
    rightJson = await jsonResponse.json();
  } else {
    rightJson = JSON.parse(rightDoc.contents);
  }

  return {
    leftDoc,
    rightDoc,
    leftJson,
    rightJson,
    path,
    minimal,
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "DELETE") {
    return;
  }

  invariant(params.leftId, "expected params.leftId");
  invariant(params.rightId, "expected params.rightId");

  const toastCookie = await getSession(request.headers.get("cookie"));

  const leftDocument = await getDocument(params.leftId);
  const rightDocument = await getDocument(params.rightId);

  if (!leftDocument || !rightDocument) {
    setErrorMessage(toastCookie, "Document not found", "Error");
    return redirect(`/`);
  }

  if (leftDocument.readOnly || rightDocument.readOnly) {
    setErrorMessage(toastCookie, "Document is read-only", "Error");
    return redirect(`/diff/${params.leftId}/${params.rightId}`);
  }

  await deleteDocument(params.leftId);
  await deleteDocument(params.rightId);

  setSuccessMessage(toastCookie, "Documents deleted successfully", "Success");

  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(toastCookie) },
  });
};

function getPathFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return null;
  if (path.startsWith("$.")) return path;
  return `$.${path}`;
}

function getMinimalFromRequest(request: Request): boolean | undefined {
  const url = new URL(request.url);
  const minimal = url.searchParams.get("minimal");
  if (!minimal) return;
  return minimal === "true";
}

type LoaderData = {
  leftDoc: JSONDocument;
  rightDoc: JSONDocument;
  leftJson: unknown;
  rightJson: unknown;
  path?: string;
  minimal?: boolean;
};

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  let title = "JSON Hero - Diff";
  if (data?.leftDoc?.title && data?.rightDoc?.title) {
    title += ` - ${data.leftDoc.title} vs ${data.rightDoc.title}`;
  }
  return {
    title,
    "og:title": title,
    robots: "noindex,nofollow",
  };
};

export default function JsonDiffRoute() {
  const loaderData = useLoaderData<LoaderData>();

  const location = useLocation();

  useEffect(() => {
    if (loaderData.path) {
      window.history.replaceState({}, "", location.pathname);
    }
  }, [loaderData.path]);

  const diffResult = useMemo(() => {
    return computeJsonDiff(loaderData.leftJson, loaderData.rightJson);
  }, [loaderData.leftJson, loaderData.rightJson]);

  return (
    <JsonDiffSyncProvider diffResult={diffResult}>
      <div>
        <div className="block md:hidden fixed bg-black/80 h-screen w-screen z-50 text-white">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LargeTitle>JSON Hero Diff only works on desktop</LargeTitle>
            <LargeTitle>👇</LargeTitle>
            <Body>(For now!)</Body>
            <a
              href="/"
              className="mt-8 text-white bg-lime-500 rounded-sm px-4 py-2"
            >
              Back to Home
            </a>
          </div>
        </div>
        <div className="h-screen flex flex-col sm:overflow-hidden">
          {!loaderData.minimal && <Header />}
          <div className="bg-slate-50 flex-grow transition dark:bg-slate-900 overflow-y-auto">
            <div className="main-container flex justify-items-stretch h-full">
              <DiffSideBar
                leftDoc={loaderData.leftDoc}
                rightDoc={loaderData.rightDoc}
              />
              <DiffContentView
                leftDoc={loaderData.leftDoc}
                rightDoc={loaderData.rightDoc}
                leftJson={loaderData.leftJson}
                rightJson={loaderData.rightJson}
                path={loaderData.path}
                minimal={loaderData.minimal}
              />
            </div>
          </div>
          <Footer></Footer>
        </div>
      </div>
    </JsonDiffSyncProvider>
  );
}

function DiffSideBar({
  leftDoc,
  rightDoc,
}: {
  leftDoc: JSONDocument;
  rightDoc: JSONDocument;
}) {
  const { syncState, toggleSyncScroll, toggleSyncSelection, toggleSyncExpand } =
    useJsonDiffSync();

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="space-y-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Diff Mode
        </div>
        
        <div className="space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Left: {leftDoc.title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Right: {rightDoc.title}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Sync Settings
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncState.syncScroll}
                onChange={toggleSyncScroll}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Sync Scroll
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncState.syncSelection}
                onChange={toggleSyncSelection}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Sync Selection
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncState.syncExpand}
                onChange={toggleSyncExpand}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Sync Expand
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Legend
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 dark:bg-green-900 rounded"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Added (Right)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 dark:bg-red-900 rounded"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Deleted (Left)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900 rounded"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Modified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffContentView({
  leftDoc,
  rightDoc,
  leftJson,
  rightJson,
  path,
  minimal,
}: {
  leftDoc: JSONDocument;
  rightDoc: JSONDocument;
  leftJson: unknown;
  rightJson: unknown;
  path?: string;
  minimal?: boolean;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <JsonDocProvider doc={leftDoc} path={path} minimal={minimal} key={`left-${leftDoc.id}`}>
        <JsonProvider initialJson={leftJson}>
          <JsonSchemaProvider>
            <JsonColumnViewProvider>
              <JsonSearchProvider>
                <JsonTreeViewProvider overscan={25}>
                  <div className="w-1/2 border-r border-slate-200 dark:border-slate-700">
                    <JsonDiffView side="left" title={leftDoc.title} />
                  </div>
                </JsonTreeViewProvider>
              </JsonSearchProvider>
            </JsonColumnViewProvider>
          </JsonSchemaProvider>
        </JsonProvider>
      </JsonDocProvider>

      <JsonDocProvider doc={rightDoc} path={path} minimal={minimal} key={`right-${rightDoc.id}`}>
        <JsonProvider initialJson={rightJson}>
          <JsonSchemaProvider>
            <JsonColumnViewProvider>
              <JsonSearchProvider>
                <JsonTreeViewProvider overscan={25}>
                  <div className="w-1/2">
                    <JsonDiffView side="right" title={rightDoc.title} />
                  </div>
                </JsonTreeViewProvider>
              </JsonSearchProvider>
            </JsonColumnViewProvider>
          </JsonSchemaProvider>
        </JsonProvider>
      </JsonDocProvider>
    </div>
  );
}

export function CatchBoundary() {
  const error = useCatch();
  const params = useParams();
  console.log("error", error);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[rgb(56,52,139)]">
      <div className="w-2/3">
        <div className="text-center text-lime-300">
          <div className="">
            <Logo />
          </div>
          <PageNotFoundTitle className="text-center leading-tight">
            {error.status}
          </PageNotFoundTitle>
        </div>
        <div className="text-center leading-snug text-white">
          <ExtraLargeTitle className="text-slate-200 mb-8">
            <b>Sorry</b>! Something went wrong...
          </ExtraLargeTitle>
          <SmallSubtitle className="text-slate-200 mb-8">
            {error.data ||
              (error.status === 404 ? (
                <>
                  We couldn't find the Diff page{' '}
                  <b>'https://jsonhero.io/diff/{params.leftId}/{params.rightId}'</b>
                </>
              ) : (
                "Unknown error occurred."
              ))}
          </SmallSubtitle>
          <a
            href="/"
            className="mx-auto w-24 bg-lime-500 text-slate-900 text-lg font-bold px-5 py-1 rounded-sm uppercase whitespace-nowrap cursor-pointer opacity-90 hover:opacity-100 transition"
          >
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}
