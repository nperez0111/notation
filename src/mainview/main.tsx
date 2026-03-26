import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import "./index.css";
import { RpcProvider } from "./electroview";
import { ThemeProvider } from "./themeContext";
import App from "./App";

const styletron = new Styletron();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StyletronProvider value={styletron}>
      <ThemeProvider>
        <RpcProvider>
          <App />
        </RpcProvider>
      </ThemeProvider>
    </StyletronProvider>
  </StrictMode>,
);
