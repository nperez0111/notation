import { createDarkTheme, createLightTheme } from "baseui";

const primaryColors = {
	primary: "#6366f1",
	primary50: "#1e1b4b",
	primary100: "#312e81",
	primary200: "#3730a3",
	primary300: "#4f46e5",
	primary400: "#6366f1",
	primary500: "#818cf8",
	primary600: "#818cf8",
	primary700: "#a5b4fc",
};

/**
 * Dark theme aligned with the app palette. Base Web components use this.
 */
export const appDarkTheme = createDarkTheme({
	colors: primaryColors,
});

/**
 * Light theme with same accent palette for consistency.
 */
export const appLightTheme = createLightTheme({
	colors: {
		...primaryColors,
		primary50: "#eef2ff",
		primary100: "#e0e7ff",
		primary200: "#c7d2fe",
		primary700: "#4338ca",
	},
});
