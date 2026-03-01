import { Input } from "baseui/input";

type TitleBarProps = {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
};

export function TitleBar({
	value,
	onChange,
	onBlur,
	placeholder = "Untitled",
}: TitleBarProps) {
	return (
		<div className="shrink-0 border-b border-border bg-surface-elevated px-6 py-3">
			<Input
				value={value}
				onChange={(e) => onChange((e.target as HTMLInputElement).value)}
				onBlur={onBlur}
				placeholder={placeholder}
				aria-label="Document title"
				overrides={{
					Root: {
						style: { width: "100%", backgroundColor: "transparent" },
					},
					Input: {
						style: ({ $theme }) => ({
							fontSize: "1.25rem",
							fontWeight: 600,
							backgroundColor: "transparent",
							"::placeholder": {
								color: $theme.colors.contentTertiary,
							},
						}),
					},
					InputContainer: {
						style: {
							backgroundColor: "transparent",
							borderWidth: 0,
							paddingLeft: 0,
							paddingRight: 0,
						},
					},
				}}
			/>
		</div>
	);
}
