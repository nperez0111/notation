import { useCallback, useEffect, useMemo, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import { useRpc } from "./electroview";
import type { Document } from "../shared/types";

const DEFAULT_USER = "user";

function DocumentList({
	documents,
	selectedId,
	onSelect,
	onCreate,
}: {
	documents: Document[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onCreate: () => void;
}) {
	return (
		<aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50/80 flex flex-col">
			<div className="p-3 border-b border-gray-200">
				<button
					type="button"
					onClick={onCreate}
					className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
				>
					New note
				</button>
			</div>
			<ul className="flex-1 overflow-auto p-2">
				{documents.map((doc) => (
					<li key={doc.id}>
						<button
							type="button"
							onClick={() => onSelect(doc.id)}
							className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate ${
								selectedId === doc.id
									? "bg-indigo-100 text-indigo-800"
									: "text-gray-700 hover:bg-gray-100"
							}`}
							title={doc.title || "Untitled"}
						>
							<span className="block truncate font-medium">
								{doc.title || "Untitled"}
							</span>
							<span className="block text-xs text-gray-500 mt-0.5">
								{new Date(doc.updatedAt).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
						</button>
					</li>
				))}
			</ul>
		</aside>
	);
}

function Editor({
	documentId,
	initialContent,
	initialTitle,
	initialProperties,
	onSave,
}: {
	documentId: number;
	initialContent: string;
	initialTitle: string;
	initialProperties: string;
	onSave: (payload: { content: string; title?: string; properties?: string }) => void;
}) {
	const parsed = useMemo((): PartialBlock[] | undefined => {
		try {
			const blocks = JSON.parse(initialContent || "[]") as PartialBlock[];
			return Array.isArray(blocks) && blocks.length > 0 ? blocks : undefined;
		} catch {
			return undefined;
		}
	}, [initialContent]);

	const editor = useCreateBlockNote({
		initialContent: parsed,
	});

	const [title, setTitle] = useState(initialTitle);

	const [properties] = useState(initialProperties);

	const debouncedSave = useMemo(() => {
		let timer: ReturnType<typeof setTimeout>;
		return (doc: Block[], titleValue?: string) => {
			clearTimeout(timer);
			timer = setTimeout(
				() =>
					onSave({
						content: JSON.stringify(doc),
						title: titleValue,
						properties,
					}),
				500,
			);
		};
	}, [onSave, properties]);

	if (!editor) return <div className="p-4 text-gray-500">Loading editor…</div>;

	return (
		<div className="flex-1 min-w-0 flex flex-col">
			<div className="shrink-0 border-b border-gray-200 px-4 py-2 bg-gray-50/80">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={() => debouncedSave(editor.document as Block[], title)}
					placeholder="Untitled"
					className="w-full text-lg font-semibold bg-transparent border-0 focus:ring-0 focus:outline-none"
				/>
			</div>
			<BlockNoteView
				editor={editor}
				className="flex-1 min-h-0"
				onChange={() => debouncedSave(editor.document as Block[], title)}
			/>
		</div>
	);
}

export default function App() {
	const rpc = useRpc();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
	const [loading, setLoading] = useState(true);

	const loadDocuments = useCallback(async () => {
		const list = await rpc.getDocuments({});
		setDocuments(list);
		if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
		setLoading(false);
	}, [selectedId]);

	useEffect(() => {
		loadDocuments();
	}, [loadDocuments]);

	useEffect(() => {
		if (selectedId == null) {
			setCurrentDoc(null);
			return;
		}
		let cancelled = false;
		rpc.getDocument({ id: selectedId }).then((doc) => {
			if (!cancelled) setCurrentDoc(doc);
		});
		return () => {
			cancelled = true;
		};
	}, [selectedId, rpc]);

	const createDocument = useCallback(async () => {
		const doc = await rpc.createDocument({
			title: "",
			content: "[]",
			createdBy: DEFAULT_USER,
			updatedBy: DEFAULT_USER,
			properties: "{}",
		});
		setDocuments((prev) => [doc, ...prev]);
		setSelectedId(doc.id);
	}, [rpc]);

	const saveDocument = useCallback(
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
			const next = {
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
		<div className="min-h-screen bg-white text-gray-900 flex">
			<DocumentList
				documents={documents}
				selectedId={selectedId}
				onSelect={setSelectedId}
				onCreate={createDocument}
			/>
			<main className="flex-1 min-w-0 flex flex-col">
				{loading ? (
					<div className="p-6 text-gray-500">Loading…</div>
				) : selectedId == null && documents.length === 0 ? (
					<div className="p-6 flex flex-col items-center justify-center gap-4 text-gray-500">
						<p>No notes yet.</p>
						<button
							type="button"
							onClick={createDocument}
							className="px-4 py-2 text-indigo-600 hover:underline"
						>
							Create your first note
						</button>
					</div>
				) : currentDoc ? (
					<Editor
						key={currentDoc.id}
						documentId={currentDoc.id}
						initialContent={currentDoc.content}
						initialTitle={currentDoc.title ?? ""}
						initialProperties={currentDoc.properties ?? "{}"}
						onSave={saveDocument}
					/>
				) : (
					<div className="p-6 text-gray-500">Select a note</div>
				)}
			</main>
		</div>
	);
}
