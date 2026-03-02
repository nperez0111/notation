import type { Document } from "../../../shared/types";
import { StatefulPopover } from "baseui/popover";
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

const sidebarPopoverOverrides = {
	Body: {
		style: {
			borderRadius: "8px",
			boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
			backgroundColor: "var(--color-surface)",
			border: "1px solid var(--color-border)",
			minWidth: "140px",
		},
	},
	Inner: { style: {} },
};

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
	const indent = depth * DEPTH_PADDING;

	return (
		<div className="group relative flex min-w-0 items-center gap-1 overflow-hidden" style={{ paddingLeft: indent + 6 }}>
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
				className={`flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 text-left text-sm transition-colors ${
					isSelected
						? "bg-accent-muted text-accent-text font-medium"
						: "text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
				}`}
				title={title}
			>
				<span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
					{onIconChange ? (
						<span
							className={`shrink-0 pt-0.5 transition-opacity ${
								hasChildren ? "group-hover:opacity-0" : ""
							}`}
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
						<span
							className={`shrink-0 pt-0.5 transition-opacity ${
								hasChildren ? "group-hover:opacity-0" : ""
							}`}
						>
							<DocumentIconView icon={doc.icon} size={18} className="block" />
						</span>
					) : null}
					{hasChildren && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleExpand?.();
							}}
							className="absolute inset-[-2px] flex items-center justify-center rounded text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-hover hover:text-[var(--color-text)]"
							aria-expanded={expanded}
							aria-label={expanded ? "Collapse nested documents" : "Expand nested documents"}
						>
							<span
								className={`inline-block text-xs transition-transform ${
									expanded ? "rotate-90" : ""
								}`}
								aria-hidden
							>
								▸
							</span>
						</button>
					)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate">{title}</span>
				</span>
			</div>
			{onCreateChild && (
				<div className="pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onCreateChild();
						}}
						className="pointer-events-auto rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-[var(--color-text)]"
						title="Add sub-note"
						aria-label="Add sub-note"
					>
						+
					</button>
					<StatefulPopover
						placement="bottomRight"
						content={({ close }) => (
							<div className="min-w-[140px] py-1" role="menu">
								<button
									type="button"
									role="menuitem"
									className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
									onClick={() => {
										onCreateChild();
										close();
									}}
								>
									Add sub-note
								</button>
							</div>
						)}
						overrides={sidebarPopoverOverrides}
					>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="pointer-events-auto rounded p-1 text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
							aria-label="More options"
							aria-haspopup="menu"
						>
							⋯
						</button>
					</StatefulPopover>
				</div>
			)}
		</div>
	);
}
