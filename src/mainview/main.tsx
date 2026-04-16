import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RpcProvider } from "./electroview";
import { ThemeProvider } from "./themeContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RpcProvider>
        <App />
      </RpcProvider>
    </ThemeProvider>
  </StrictMode>,
);
