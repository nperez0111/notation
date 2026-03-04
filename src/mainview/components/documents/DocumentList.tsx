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
	onIconChange?: (documentId: number, icon: Document["icon"]) => void;
	onReparentDocument?: (documentId: number, collectionId: number, parentId: number | null) => void;
};

export function DocumentList({
	collections,
	documents,
	selectedId,
	onSelect,
	onCreateDocument,
	onCreateCollection,
	onRenameCollection,
	onIconChange,
	onReparentDocument,
}: DocumentListProps) {
	return (
		<ul className="flex-1 overflow-auto py-2 pr-1" role="list">
			{collections.map((coll) => (
				<li key={coll.id} className="px-1.5">
					<CollectionSection
						collection={coll}
						documents={documents}
						selectedId={selectedId}
						onSelect={onSelect}
						onCreateDocument={onCreateDocument}
						onRenameCollection={onRenameCollection}
						onIconChange={onIconChange}
						onReparentDocument={onReparentDocument}
					/>
				</li>
			))}
		</ul>
	);
}
