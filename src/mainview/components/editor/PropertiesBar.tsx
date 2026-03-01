type PropertiesBarProps = {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
};

export function PropertiesBar({ value, onChange, onBlur }: PropertiesBarProps) {
	return (
		<div className="shrink-0 border-b border-border bg-surface px-6 py-2">
			<label className="mb-1 block text-xs font-medium text-text-muted">
				Properties (JSON)
			</label>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
				rows={2}
				className="w-full resize-none rounded border border-border bg-surface-elevated px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				placeholder='{"key": "value"}'
				aria-label="Document properties (JSON)"
			/>
		</div>
	);
}
