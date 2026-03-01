import type { Document } from "../../../shared/types";

type DocumentListItemProps = {
	document: Document;
	isSelected: boolean;
	onSelect: () => void;
	/** Nesting depth for indentation (0 = top-level in collection). */
	depth?: number;
	/** Called to create a child document under this one. */
	onCreateChild?: () => void;
	/** Whether this document has nested children (shows expand/collapse chevron). */
	hasChildren?: boolean;
	/** Whether nested children are currently expanded. */
	expanded?: boolean;
	/** Toggle expand/collapse of nested children. */
	onToggleExpand?: () => void;
};

const DEPTH_PADDING = 12; // px per nesting level

export function DocumentListItem({
	document: doc,
	isSelected,
	onSelect,
	depth = 0,
	onCreateChild,
	hasChildren = false,
	expanded = true,
	onToggleExpand,
}: DocumentListItemProps) {
	const title = doc.title?.trim() || "Untitled";
	const date = new Date(doc.updatedAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const indent = depth * DEPTH_PADDING;

	return (
		<li
			className="group relative flex min-w-0 items-center gap-0 overflow-hidden"
			style={hasChildren ? { paddingLeft: indent } : undefined}
		>
			{hasChildren && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleExpand?.();
					}}
					className="flex shrink-0 items-center justify-center rounded p-0.5 text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)] w-5 min-w-[20px]"
					aria-expanded={expanded}
					aria-label={expanded ? "Collapse nested documents" : "Expand nested documents"}
				>
					<span
						className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}
						aria-hidden
					>
						▸
					</span>
				</button>
			)}
			<button
				type="button"
				onClick={onSelect}
				style={{ paddingLeft: hasChildren ? 8 : indent + 12 }}
				className={`min-w-0 flex-1 rounded-lg py-2.5 pr-8 text-left text-sm transition-colors ${
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
