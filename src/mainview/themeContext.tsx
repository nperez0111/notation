import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { BaseProvider } from "baseui";
import { appDarkTheme, appLightTheme } from "./theme";

const THEME_STORAGE_KEY = "note-taker-theme";

export type ThemeOption = "light" | "dark" | "system";

function getResolvedTheme(preference: ThemeOption): "light" | "dark" {
	if (preference === "system") {
		return typeof window !== "undefined" &&
			window.matchMedia("(prefers-color-scheme: light)").matches
			? "light"
			: "dark";
	}
	return preference;
}

const ThemeContext = createContext<{
	theme: ThemeOption;
	setTheme: (t: ThemeOption) => void;
	resolved: "light" | "dark";
} | null>(null);

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<ThemeOption>(() => {
		try {
			const stored = localStorage.getItem(THEME_STORAGE_KEY);
			if (stored === "light" || stored === "dark" || stored === "system")
				return stored;
		} catch {}
		return "system";
	});

	const [resolved, setResolved] = useState<"light" | "dark">(() =>
		getResolvedTheme(theme),
	);

	const setTheme = (value: ThemeOption) => {
		setThemeState(value);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, value);
		} catch {}
	};

	useEffect(() => {
		const next = getResolvedTheme(theme);
		setResolved(next);
		document.documentElement.setAttribute("data-theme", next);
	}, [theme]);

	useEffect(() => {
		if (theme !== "system") return;
		const m = window.matchMedia("(prefers-color-scheme: light)");
		const handler = () => {
			const next = m.matches ? "light" : "dark";
			setResolved(next);
			document.documentElement.setAttribute("data-theme", next);
		};
		m.addEventListener("change", handler);
		return () => m.removeEventListener("change", handler);
	}, [theme]);

	const themeObject = resolved === "light" ? appLightTheme : appDarkTheme;
	const value = useMemo(
		() => ({ theme, setTheme, resolved }),
		[theme, resolved],
	);

	return (
		<ThemeContext.Provider value={value}>
			<BaseProvider theme={themeObject}>{children}</BaseProvider>
		</ThemeContext.Provider>
	);
}
