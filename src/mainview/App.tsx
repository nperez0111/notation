import { useCallback, useEffect, useState } from "react";
import { useRpc } from "./electroview";
import { useTheme } from "./themeContext";
import type { Collection, Document, Property } from "../shared/types";
import { DocumentSidebar } from "./components/documents/DocumentSidebar";
import { DocumentEditor } from "./components/editor/DocumentEditor";
import { SettingsModal } from "./components/settings/SettingsModal";
import { parseDocumentContent } from "./lib/parseContent";
import { parseDocumentProperties } from "./lib/propertyValues";

const DEFAULT_USER = "user";

export default function App() {
	const rpc = useRpc();
	const { theme, setTheme, resolved: resolvedTheme } = useTheme();
	const [collections, setCollections] = useState<Collection[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [propertyDefinitions, setPropertyDefinitions] = useState<Property[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
	const [loading, setLoading] = useState(true);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const refetchFromDatabase = useCallback(() => {
		setLoading(true);
		setSelectedId(null);
		setCurrentDoc(null);
		Promise.all([
			rpc.getCollections({}),
			rpc.getDocuments({}),
			rpc.getPropertyDefinitions({}),
		]).then(([colls, list, defs]) => {
			setCollections(colls);
			setDocuments(list);
			setPropertyDefinitions(defs);
			setLoading(false);
			if (list.length > 0) {
				const firstId = list[0].id;
				setSelectedId(firstId);
				rpc.getDocument({ id: firstId }).then((doc) => setCurrentDoc(doc ?? null));
			}
		});
	}, [rpc]);

	// Bootstrap: collections, document list, property definitions, and initial selection.
	useEffect(() => {
		refetchFromDatabase();
	}, [refetchFromDatabase]);

	// When user selects a document, load it (no useEffect: run in the callback).
	const onSelectDocument = useCallback(
		(id: number) => {
			setSelectedId(id);
			setCurrentDoc(null);
			rpc.getDocument({ id }).then((doc) => setCurrentDoc(doc ?? null));
		},
		[rpc],
	);

	const onCreateDocument = useCallback(
		async (collectionId: number, parentId?: number | null) => {
			const doc = await rpc.createDocument({
				title: "",
				content: "[]",
				createdBy: DEFAULT_USER,
				updatedBy: DEFAULT_USER,
				properties: "{}",
				collectionId,
				parentId: parentId ?? null,
			});
			setDocuments((prev) => [doc, ...prev]);
			onSelectDocument(doc.id);
		},
		[rpc, onSelectDocument],
	);

	const onCreateCollection = useCallback(async () => {
		const coll = await rpc.createCollection({ name: "New collection" });
		setCollections((prev) => [...prev, coll]);
	}, [rpc]);

	const onRenameCollection = useCallback(
		async (id: number, name: string) => {
			const updated = await rpc.updateCollection({ id, name });
			if (!updated) return;
			setCollections((prev) =>
				prev.map((c) => (c.id === id ? updated : c)),
			);
		},
		[rpc],
	);

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

	const onIconChange = useCallback(
		async (documentId: number, icon: Document["icon"]) => {
			const updated = await rpc.updateDocument({
				id: documentId,
				updatedBy: DEFAULT_USER,
				icon: icon ?? null,
			});
			if (!updated) return;
			const next: Document = { ...updated, updatedAt: updated.updatedAt ?? new Date().toISOString() };
			setCurrentDoc((prev) => (prev?.id === documentId ? next : prev));
			setDocuments((prev) =>
				prev.map((d) => (d.id === documentId ? next : d)),
			);
		},
		[rpc],
	);

	const onCreateProperty = useCallback(
		async (label: string, type: Property["type"]) => {
			const created = await rpc.createPropertyDefinition({ label, type });
			setPropertyDefinitions((prev) => [...prev, created]);
		},
		[rpc],
	);
	const onUpdateProperty = useCallback(
		async (id: number, label?: string, type?: Property["type"]) => {
			const updated = await rpc.updatePropertyDefinition({ id, label, type });
			if (!updated) return;
			setPropertyDefinitions((prev) =>
				prev.map((p) => (p.id === id ? updated : p)),
			);
		},
		[rpc],
	);
	const onDeleteProperty = useCallback(
		async (id: number) => {
			await rpc.deletePropertyDefinition({ id });
			setPropertyDefinitions((prev) => prev.filter((p) => p.id !== id));
		},
		[rpc],
	);
	const onReorderProperties = useCallback(
		async (orderedIds: number[]) => {
			await rpc.reorderPropertyDefinitions({ orderedIds });
			setPropertyDefinitions((prev) => {
				const byId = new Map(prev.map((p) => [p.id, p]));
				return orderedIds.map((id) => byId.get(id)!).filter(Boolean);
			});
		},
		[rpc],
	);

	return (
		<div className="flex min-h-screen bg-[var(--color-surface-elevated)] text-[var(--color-text)]">
			<DocumentSidebar
				collections={collections}
				documents={documents}
				selectedId={selectedId}
				onSelectDocument={onSelectDocument}
				onCreateDocument={onCreateDocument}
				onCreateCollection={onCreateCollection}
				onRenameCollection={onRenameCollection}
				onIconChange={onIconChange}
				onOpenSettings={() => setSettingsOpen(true)}
			/>
			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				theme={theme}
				onThemeChange={setTheme}
				onDatabaseReload={refetchFromDatabase}
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
							onClick={() =>
								collections[0] &&
								onCreateDocument(collections[0].id, null)
							}
							className="text-accent hover:underline"
							disabled={collections.length === 0}
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
						documentId={currentDoc.id}
						initialBlocks={parseDocumentContent(currentDoc.content)}
						initialTitle={currentDoc.title ?? ""}
						initialIcon={currentDoc.icon ?? null}
						initialPropertyValues={parseDocumentProperties(
							currentDoc.properties ?? "{}",
						)}
						propertyDefinitions={propertyDefinitions}
						theme={resolvedTheme}
						onSave={onSaveDocument}
						onIconChange={onIconChange}
						onCreateProperty={onCreateProperty}
						onUpdateProperty={onUpdateProperty}
						onDeleteProperty={onDeleteProperty}
						onReorderProperties={onReorderProperties}
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
