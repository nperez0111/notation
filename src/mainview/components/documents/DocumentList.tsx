import type { Document } from "../../../shared/types";
import { Button } from "../ui/Button";
import { DocumentListItem } from "./DocumentListItem";

type DocumentListProps = {
	documents: Document[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onCreate: () => void;
};

export function DocumentList({
	documents,
	selectedId,
	onSelect,
	onCreate,
}: DocumentListProps) {
	return (
		<>
			<div className="border-b border-border p-3">
				<Button variant="primary" className="w-full" onClick={onCreate}>
					New note
				</Button>
			</div>
			<ul className="flex-1 overflow-auto p-2" role="list">
				{documents.map((doc) => (
					<DocumentListItem
						key={doc.id}
						document={doc}
						isSelected={selectedId === doc.id}
						onSelect={() => onSelect(doc.id)}
					/>
				))}
			</ul>
		</>
	);
}
