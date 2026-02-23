import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "./App";
import "./index.css";
import { initTheme } from "./utils/theme";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
