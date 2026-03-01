import type { Collection, Document } from "../../../shared/types";
import { CollectionSection } from "./CollectionSection";

type DocumentListProps = {
	collections: Collection[];
	documents: Document[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onCreateDocument: (collectionId: number, parentId?: number | null) => void;
	onCreateCollection?: () => void;
	onRenameCollection?: (id: number, name: string) => void;
};

export function DocumentList({
	collections,
	documents,
	selectedId,
	onSelect,
	onCreateDocument,
	onCreateCollection,
	onRenameCollection,
}: DocumentListProps) {
	return (
		<>
			<div className="flex flex-col gap-1 border-b border-border p-3">
				{onCreateCollection && (
					<button
						type="button"
						onClick={onCreateCollection}
						className="rounded-lg px-3 py-2 text-left text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
					>
						+ New collection
					</button>
				)}
			</div>
			<ul className="flex-1 overflow-auto py-2" role="list">
				{collections.map((coll) => (
					<li key={coll.id}>
						<CollectionSection
							collection={coll}
							documents={documents}
							selectedId={selectedId}
							onSelect={onSelect}
							onCreateDocument={onCreateDocument}
							onRenameCollection={onRenameCollection}
						/>
					</li>
				))}
			</ul>
		</>
	);
}
