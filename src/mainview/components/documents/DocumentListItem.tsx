import type { Document } from "../../../shared/types";

type DocumentListItemProps = {
	document: Document;
	isSelected: boolean;
	onSelect: () => void;
	/** Nesting depth for indentation (0 = top-level in collection). */
	depth?: number;
	/** Called to create a child document under this one. */
	onCreateChild?: () => void;
};

const DEPTH_PADDING = 12; // px per nesting level

export function DocumentListItem({
	document: doc,
	isSelected,
	onSelect,
	depth = 0,
	onCreateChild,
}: DocumentListItemProps) {
	const title = doc.title?.trim() || "Untitled";
	const date = new Date(doc.updatedAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const indent = depth * DEPTH_PADDING;

	return (
		<li className="group relative">
			<button
				type="button"
				onClick={onSelect}
				style={{ paddingLeft: indent + 12 }}
				className={`w-full rounded-lg py-2.5 pr-8 text-left text-sm transition-colors ${
					isSelected
						? "bg-accent-muted text-accent-text font-medium"
						: "text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
				}`}
				title={title}
			>
				<span className="block truncate">{title}</span>
				<span className="mt-0.5 block text-xs text-text-subtle">{date}</span>
			</button>
			{onCreateChild && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onCreateChild();
					}}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-subtle opacity-0 hover:bg-surface-hover hover:text-[var(--color-text)] group-hover:opacity-100"
					title="Add sub-note"
					aria-label="Add sub-note"
				>
					+
				</button>
			)}
		</li>
	);
}
