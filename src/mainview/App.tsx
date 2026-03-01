import { useCallback, useEffect, useState } from "react";
import { useRpc } from "./electroview";
import type { Document } from "../shared/types";
import { DocumentSidebar } from "./components/documents/DocumentSidebar";
import { DocumentEditor } from "./components/editor/DocumentEditor";
import { parseDocumentContent } from "./lib/parseContent";

const DEFAULT_USER = "user";

export default function App() {
	const rpc = useRpc();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
	const [loading, setLoading] = useState(true);

	// Single data-loading effect: bootstrap document list and initial selection.
	useEffect(() => {
		let cancelled = false;
		rpc.getDocuments({}).then((list) => {
			if (cancelled) return;
			setDocuments(list);
			setLoading(false);
			if (list.length > 0) {
				const firstId = list[0].id;
				setSelectedId(firstId);
				rpc.getDocument({ id: firstId }).then((doc) => {
					if (!cancelled) setCurrentDoc(doc ?? null);
				});
			}
		});
		return () => {
			cancelled = true;
		};
	}, [rpc]);

	// When user selects a document, load it (no useEffect: run in the callback).
	const onSelectDocument = useCallback(
		(id: number) => {
			setSelectedId(id);
			setCurrentDoc(null);
			rpc.getDocument({ id }).then((doc) => setCurrentDoc(doc ?? null));
		},
		[rpc],
	);

	const onCreateDocument = useCallback(async () => {
		const doc = await rpc.createDocument({
			title: "",
			content: "[]",
			createdBy: DEFAULT_USER,
			updatedBy: DEFAULT_USER,
			properties: "{}",
		});
		setDocuments((prev) => [doc, ...prev]);
		onSelectDocument(doc.id);
	}, [rpc, onSelectDocument]);

	const onSaveDocument = useCallback(
		async (payload: {
			content: string;
			title?: string;
			properties?: string;
		}) => {
			if (currentDoc == null) return;
			const updated = await rpc.updateDocument({
				id: currentDoc.id,
				title: payload.title,
				content: payload.content,
				updatedBy: DEFAULT_USER,
				properties: payload.properties,
			});
			if (!updated) return;
			const next: Document = {
				...currentDoc,
				...updated,
				updatedAt: updated.updatedAt ?? new Date().toISOString(),
			};
			setCurrentDoc(next);
			setDocuments((prev) =>
				prev.map((d) => (d.id === currentDoc.id ? next : d)),
			);
		},
		[currentDoc, rpc],
	);

	return (
		<div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
			<DocumentSidebar
				documents={documents}
				selectedId={selectedId}
				onSelectDocument={onSelectDocument}
				onCreateDocument={onCreateDocument}
			/>
			<main className="flex min-w-0 flex-1 flex-col">
				{loading ? (
					<div className="flex flex-1 items-center justify-center p-6 text-text-muted">
						Loading…
					</div>
				) : documents.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-text-muted">
						<p>No notes yet.</p>
						<button
							type="button"
							onClick={onCreateDocument}
							className="text-accent hover:underline"
						>
							Create your first note
						</button>
					</div>
				) : selectedId !== null && currentDoc === null ? (
					<div className="flex flex-1 items-center justify-center p-6 text-text-muted">
						Loading…
					</div>
				) : currentDoc ? (
					<DocumentEditor
						key={currentDoc.id}
						initialBlocks={parseDocumentContent(currentDoc.content)}
						initialTitle={currentDoc.title ?? ""}
						initialProperties={currentDoc.properties ?? "{}"}
						onSave={onSaveDocument}
					/>
				) : (
					<div className="flex flex-1 items-center justify-center p-6 text-text-muted">
						Select a note
					</div>
				)}
			</main>
		</div>
	);
}
