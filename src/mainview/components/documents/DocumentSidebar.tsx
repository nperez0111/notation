import type { Document } from "../../../shared/types";
import { Sidebar } from "../layout/Sidebar";
import { DocumentList } from "./DocumentList";

type DocumentSidebarProps = {
	documents: Document[];
	selectedId: number | null;
	onSelectDocument: (id: number) => void;
	onCreateDocument: () => void;
};

export function DocumentSidebar({
	documents,
	selectedId,
	onSelectDocument,
	onCreateDocument,
}: DocumentSidebarProps) {
	return (
		<Sidebar>
			<DocumentList
				documents={documents}
				selectedId={selectedId}
				onSelect={onSelectDocument}
				onCreate={onCreateDocument}
			/>
		</Sidebar>
	);
}
