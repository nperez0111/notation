import type { Document } from "../../../shared/types";

type DocumentListItemProps = {
	document: Document;
	isSelected: boolean;
	onSelect: () => void;
};

export function DocumentListItem({
	document: doc,
	isSelected,
	onSelect,
}: DocumentListItemProps) {
	const title = doc.title?.trim() || "Untitled";
	const date = new Date(doc.updatedAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<li>
			<button
				type="button"
				onClick={onSelect}
				className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
					isSelected
						? "bg-accent-muted text-accent-text font-medium"
						: "text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
				}`}
				title={title}
			>
				<span className="block truncate">{title}</span>
				<span className="mt-0.5 block text-xs text-text-subtle">{date}</span>
			</button>
		</li>
	);
}
