import type { DocumentIcon } from "../../../shared/types";
import { Input } from "baseui/input";
import { DocumentIconView } from "../documents/DocumentIconView";
import { DocumentIconPicker } from "../documents/DocumentIconPicker";

type TitleBarProps = {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	icon?: DocumentIcon;
	onIconChange?: (icon: DocumentIcon) => void;
};

export function TitleBar({
	value,
	onChange,
	onBlur,
	placeholder = "Untitled",
	icon,
	onIconChange,
}: TitleBarProps) {
	return (
		<div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-3">
			{onIconChange && (
				<DocumentIconPicker
					value={icon ?? null}
					onSelect={onIconChange}
					theme="dark"
				>
					{icon ? (
						<DocumentIconView icon={icon} size={28} className="block shrink-0" />
					) : (
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm text-text-subtle hover:bg-surface-hover">
							+
						</span>
					)}
				</DocumentIconPicker>
			)}
			<Input
				value={value}
				onChange={(e) => onChange((e.target as HTMLInputElement).value)}
				onBlur={onBlur}
				placeholder={placeholder}
				aria-label="Document title"
				overrides={{
					Root: {
						style: { flex: 1, minWidth: 0, backgroundColor: "transparent" },
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
