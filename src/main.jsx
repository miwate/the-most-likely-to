import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            background: "#383F51",
            color: "#fff",
            border: "none",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
