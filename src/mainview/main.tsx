import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RpcProvider } from "./electroview";
import App from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RpcProvider>
			<App />
		</RpcProvider>
	</StrictMode>,
);
