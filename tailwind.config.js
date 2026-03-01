/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				surface: "var(--color-surface)",
				"surface-elevated": "var(--color-surface-elevated)",
				"surface-hover": "var(--color-surface-hover)",
				"surface-active": "var(--color-surface-active)",
				"text-muted": "var(--color-text-muted)",
				"text-subtle": "var(--color-text-subtle)",
				border: "var(--color-border)",
				"border-strong": "var(--color-border-strong)",
				accent: "var(--color-accent)",
				"accent-hover": "var(--color-accent-hover)",
				"accent-muted": "var(--color-accent-muted)",
				"accent-text": "var(--color-accent-text)",
			},
			fontFamily: { sans: "var(--font-sans)" },
			borderRadius: { DEFAULT: "var(--radius)", sm: "var(--radius-sm)" },
		},
	},
	plugins: [],
};
