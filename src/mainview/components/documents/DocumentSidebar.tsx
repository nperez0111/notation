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
};

export function DocumentSidebar({
	collections,
	documents,
	selectedId,
	onSelectDocument,
	onCreateDocument,
	onCreateCollection,
	onRenameCollection,
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
			/>
		</Sidebar>
	);
}
