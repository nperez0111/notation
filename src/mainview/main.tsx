import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import "./index.css";
import { RpcProvider } from "./rpc/context";
import { ThemeProvider } from "./themeContext";
import App from "./App";
import { isElectrobun } from "./rpc/platform";
import type { RpcMethods } from "../shared/rpc-types";

const styletron = new Styletron();

let rpcClient: RpcMethods;
if (isElectrobun) {
  const { createElectrobunRpc } = await import("./rpc/electrobun-rpc");
  rpcClient = createElectrobunRpc();
} else {
  const { createWebRpc } = await import("./rpc/web-rpc");
  rpcClient = createWebRpc();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StyletronProvider value={styletron}>
      <ThemeProvider>
        <RpcProvider client={rpcClient}>
          <App />
        </RpcProvider>
      </ThemeProvider>
    </StyletronProvider>
  </StrictMode>,
);
