import { ActionFunction, redirect } from "remix";
import invariant from "tiny-invariant";
import { createFromUrlOrRawJson } from "~/jsonDoc.server";
import { sendEvent } from "~/graphJSON.server";
import {
  commitSession,
  getSession,
  setErrorMessage,
} from "../../services/toast.server";

type CreateFromContentError = {
  content?: boolean;
};

export const action: ActionFunction = async ({ request, context }) => {
  const formData = await request.formData();
  const toastCookie = await getSession(request.headers.get("cookie"));
  const content = formData.get("content");
  const filename = formData.get("filename") as string;
  const action = formData.get("action") as string;

  const errors: CreateFromContentError = {};
  if (!content) errors.content = true;

  if (Object.keys(errors).length) {
    return errors;
  }

  invariant(typeof content === "string", "content must be a string");

  try {
    const doc = await createFromUrlOrRawJson(content, filename || "Untitled");

    if (!doc) {
      setErrorMessage(
        toastCookie,
        "Unknown error",
        "Could not create document. Please try again."
      );

      return redirect("/", {
        headers: { "Set-Cookie": await commitSession(toastCookie) },
      });
    }

    const requestUrl = new URL(request.url);

    context.waitUntil(
      sendEvent({
        type: "create",
        from: action || "content",
        id: doc.id,
        source:
          requestUrl.searchParams.get("utm_source") ?? requestUrl.hostname,
        metadata: {
          originalFormat: doc.originalFormat,
          filename: filename,
        },
      })
    );

    return redirect(`/j/${doc.id}`);
  } catch (e) {
    if (e instanceof Error) {
      setErrorMessage(toastCookie, e.message, "Failed to parse content");
    } else {
      setErrorMessage(toastCookie, "Unknown error", "Something went wrong");
    }

    return redirect("/", {
      headers: { "Set-Cookie": await commitSession(toastCookie) },
    });
  }
};
