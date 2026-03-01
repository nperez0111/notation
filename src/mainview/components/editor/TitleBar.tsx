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
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
				placeholder={placeholder}
				className="w-full bg-transparent text-xl font-semibold text-[var(--color-text)] placeholder:text-text-subtle focus:outline-none"
				aria-label="Document title"
			/>
		</div>
	);
}
