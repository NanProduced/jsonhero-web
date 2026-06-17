import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";
import { load } from "fathom-client";

hydrateRoot(document, <RemixBrowser />);

load("ROBFNTET", {
  spa: "history",
  excludedDomains: ["localhost"],
  includedDomains: ["jsonhero.io"],
});
