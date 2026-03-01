import type { Collection, Document } from "../../../shared/types";
import { Sidebar } from "../layout/Sidebar";
import { DocumentList } from "./DocumentList";

type DocumentSidebarProps = {
	collections: Collection[];
	documents: Document[];
	selectedId: number | null;
	onSelectDocument: (id: number) => void;
	onCreateDocument: (collectionId: number, parentId?: number | null) => void;
	onCreateCollection?: () => void;
	onRenameCollection?: (id: number, name: string) => void;
	onIconChange?: (documentId: number, icon: Document["icon"]) => void;
	onOpenSettings?: () => void;
};

function GearIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	);
}

export function DocumentSidebar({
	collections,
	documents,
	selectedId,
	onSelectDocument,
	onCreateDocument,
	onCreateCollection,
	onRenameCollection,
	onIconChange,
	onOpenSettings,
}: DocumentSidebarProps) {
	return (
		<Sidebar>
			<DocumentList
				collections={collections}
				documents={documents}
				selectedId={selectedId}
				onSelect={onSelectDocument}
				onCreateDocument={onCreateDocument}
				onCreateCollection={onCreateCollection}
				onRenameCollection={onRenameCollection}
				onIconChange={onIconChange}
			/>
			{onOpenSettings && (
				<div className="shrink-0 border-t border-[var(--color-border)] p-2">
					<button
						type="button"
						onClick={onOpenSettings}
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
						aria-label="Open settings"
					>
						<GearIcon className="shrink-0" />
						Settings
					</button>
				</div>
			)}
		</Sidebar>
	);
}
