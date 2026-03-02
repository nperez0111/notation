import type { Document } from "../../../shared/types";
import { DocumentIconView } from "./DocumentIconView";
import { DocumentIconPicker } from "./DocumentIconPicker";

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
	/** Called when document icon changes. */
	onIconChange?: (documentId: number, icon: Document["icon"]) => void;
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
	onIconChange,
}: DocumentListItemProps) {
	const title = doc.title?.trim() || "Untitled";
	const date = new Date(doc.updatedAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const indent = depth * DEPTH_PADDING;

	return (
		<div
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
			<div
				role="button"
				tabIndex={0}
				onClick={onSelect}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onSelect();
					}
				}}
				style={{ paddingLeft: hasChildren ? 8 : indent + 12 }}
				className={`flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg py-2.5 pr-8 text-left text-sm transition-colors ${
					isSelected
						? "bg-accent-muted text-accent-text font-medium"
						: "text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
				}`}
				title={title}
			>
				{onIconChange ? (
					<span
						className="shrink-0 pt-0.5"
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<DocumentIconPicker
							value={doc.icon ?? null}
							onSelect={(icon) => onIconChange(doc.id, icon)}
							theme="dark"
						>
							{doc.icon ? (
								<DocumentIconView icon={doc.icon} size={18} className="block" />
							) : (
								<span className="flex h-[18px] w-[18px] items-center justify-center text-xs text-text-subtle">
									+
								</span>
							)}
						</DocumentIconPicker>
					</span>
				) : doc.icon ? (
					<span className="shrink-0 pt-0.5">
						<DocumentIconView icon={doc.icon} size={18} className="block" />
					</span>
				) : null}
				<span className="min-w-0 flex-1">
					<span className="block truncate">{title}</span>
					<span className="mt-0.5 block text-xs text-text-subtle">{date}</span>
				</span>
			</div>
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
		</div>
	);
}
