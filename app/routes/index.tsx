import { NewFile } from "~/components/NewFile";
import {
  commitSession,
  getSession,
  ToastMessage,
} from "../services/toast.server";
import { json, useLoaderData } from "remix";
import ToastPopover from "../components/UI/ToastPopover";

type LoaderData = { toastMessage?: ToastMessage };

export async function loader({ request }: { request: Request }) {
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);
  const toastMessage = session.get("toastMessage") as ToastMessage;

  return json(
    { toastMessage },
    {
      headers: { "Set-Cookie": await commitSession(session) },
    }
  );
}

export default function Index() {
  const { toastMessage } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen bg-slate-900">
      {toastMessage && (
        <ToastPopover
          message={toastMessage.message}
          title={toastMessage.title}
          type={toastMessage.type}
          key={toastMessage.id}
        />
      )}

      <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">JH</span>
            </div>
            <h1 className="text-xl font-bold text-white">JSON Hero</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            A beautiful JSON viewer
          </h2>
          <p className="text-slate-400 text-lg">
            Paste a URL, drag & drop a file, or paste JSON directly
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 shadow-xl">
          <NewFile />
        </div>
      </main>

      <footer className="border-t border-slate-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          JSON Hero - A beautiful JSON viewer for the web
        </div>
      </footer>
    </div>
  );
}
