import { html } from "htm/react";
import { createRoot } from "react-dom/client";
import App from "./src/App";

const { app } = await Pear.versions();

const root = createRoot(document.querySelector("#root"));
root.render(html` <${App} app="${app}" /> `);
