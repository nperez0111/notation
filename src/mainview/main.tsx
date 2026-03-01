import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import { BaseProvider } from "baseui";
import { appDarkTheme } from "./theme";
import "./index.css";
import { RpcProvider } from "./electroview";
import App from "./App";

const styletron = new Styletron();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<StyletronProvider value={styletron}>
			<BaseProvider theme={appDarkTheme}>
				<RpcProvider>
					<App />
				</RpcProvider>
			</BaseProvider>
		</StyletronProvider>
	</StrictMode>,
);
