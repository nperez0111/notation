import { useCallback, useEffect, useMemo, useState } from "react";
import { useRpc } from "./electroview";
import { useTheme } from "./themeContext";
import type { Collection, Document, Property, SettingsInfo } from "../shared/types";
import { DocumentSidebar } from "./components/documents/DocumentSidebar";
import {
  buildDocumentTree,
  getChildDocuments,
  getDescendantIds,
} from "./components/documents/documentTree";
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
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const refetchFromDatabase = useCallback(() => {
    setLoading(true);
    setSelectedId(null);
    setCurrentDoc(null);
    setPropertyDefinitions([]);
    void Promise.all([rpc.getCollections({}), rpc.getDocuments({}), rpc.getSettings({})]).then(
      ([colls, list, s]) => {
        setCollections(colls);
        setDocuments(list);
        setSettings(s);
        if (s.sidebarWidth != null) setSidebarWidth(s.sidebarWidth);
        setLoading(false);
        if (list.length > 0) {
          const firstId = list[0].id;
          setSelectedId(firstId);
          void rpc.getDocument({ id: firstId }).then((doc) => setCurrentDoc(doc ?? null));
        }
      },
    );
  }, [rpc]);

  const onSwitchDatabase = useCallback(
    async (directory: string) => {
      await rpc.setDatabaseLocation({ directory, mode: "new" });
      await rpc.reloadDatabase({});
      refetchFromDatabase();
    },
    [rpc, refetchFromDatabase],
  );

  const onDatabaseMetadataChange = useCallback(
    async (name?: string, icon?: string | null) => {
      await rpc.setDatabaseMetadata({ name, icon });
      const s = await rpc.getSettings({});
      setSettings(s);
    },
    [rpc],
  );

  // Bootstrap: collections, document list, and initial selection.
  useEffect(() => {
    refetchFromDatabase();
  }, [refetchFromDatabase]);

  // Open Settings when triggered from the application menu (e.g. Note Taker → Settings).
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, []);

  // Load property definitions for the current document's collection.
  const currentDocId = currentDoc?.id;
  const currentCollectionId = currentDoc?.collectionId;
  useEffect(() => {
    if (!currentCollectionId) {
      setPropertyDefinitions([]);
      return;
    }
    void rpc
      .getPropertyDefinitions({ collectionId: currentCollectionId })
      .then(setPropertyDefinitions);
  }, [currentDocId, currentCollectionId, rpc]);

  // When user selects a document, load it (no useEffect: run in the callback).
  const onSelectDocument = useCallback(
    (id: number) => {
      setSelectedId(id);
      setCurrentDoc(null);
      void rpc.getDocument({ id }).then((doc) => setCurrentDoc(doc ?? null));
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

  const onDeleteDocument = useCallback(
    async (id: number) => {
      await rpc.deleteDocument({ id });
      // Re-fetch documents since children get cascade-deleted
      const list = await rpc.getDocuments({});
      setDocuments(list);
      if (selectedId === id) {
        const next = list.length > 0 ? list[0].id : null;
        setSelectedId(next);
        if (next != null) {
          void rpc.getDocument({ id: next }).then((doc) => setCurrentDoc(doc ?? null));
        } else {
          setCurrentDoc(null);
        }
      }
    },
    [rpc, selectedId],
  );

  const onCreateCollection = useCallback(async () => {
    const coll = await rpc.createCollection({ name: "New collection" });
    setCollections((prev) => [...prev, coll]);
  }, [rpc]);

  const onRenameCollection = useCallback(
    async (id: number, name: string) => {
      const updated = await rpc.updateCollection({ id, name });
      if (!updated) return;
      setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [rpc],
  );

  const onSaveDocument = useCallback(
    async (payload: { content: string; title?: string; properties?: string }) => {
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
      setDocuments((prev) => prev.map((d) => (d.id === currentDoc.id ? next : d)));
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
      const next: Document = {
        ...updated,
        updatedAt: updated.updatedAt ?? new Date().toISOString(),
      };
      setCurrentDoc((prev) => (prev?.id === documentId ? next : prev));
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? next : d)));
    },
    [rpc],
  );

  const onReparentDocument = useCallback(
    async (
      documentId: number,
      collectionId: number,
      parentId: number | null,
      insertAtIndex?: number,
    ) => {
      // No-op if move would make the document its own ancestor (parent into itself or into a descendant)
      const byParent = buildDocumentTree(documents, collectionId);
      const descendantsOfSource = getDescendantIds(byParent, documentId);
      if (parentId !== null && (parentId === documentId || descendantsOfSource.has(parentId))) {
        return;
      }
      const updated = await rpc.updateDocument({
        id: documentId,
        collectionId,
        parentId,
        updatedBy: DEFAULT_USER,
      });
      if (!updated) return;
      const next: Document = {
        ...updated,
        updatedAt: updated.updatedAt ?? new Date().toISOString(),
      };
      setCurrentDoc((prev) => (prev?.id === documentId ? next : prev));

      // Build new sibling order and persist childOrder
      const siblings = documents.filter(
        (d) => d.collectionId === collectionId && d.parentId === parentId,
      );
      const siblingIds = siblings
        .sort((a, b) => (a.childOrder ?? 0) - (b.childOrder ?? 0))
        .map((d) => d.id);
      const withoutMoved = siblingIds.filter((id) => id !== documentId);
      const at = insertAtIndex ?? withoutMoved.length;
      const orderedIds = [...withoutMoved];
      orderedIds.splice(Math.min(at, orderedIds.length), 0, documentId);

      await rpc.reorderChildDocuments({ collectionId, parentId, orderedIds });

      const movedIndex = orderedIds.indexOf(documentId);
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === documentId) return { ...next, childOrder: movedIndex };
          const i = orderedIds.indexOf(d.id);
          if (i >= 0 && d.parentId === parentId) return { ...d, childOrder: i };
          return d;
        }),
      );
    },
    [rpc, documents],
  );

  const onCreateProperty = useCallback(
    async (label: string, type: Property["type"]) => {
      if (currentDoc == null) return;
      const created = await rpc.createPropertyDefinition({
        collectionId: currentDoc.collectionId,
        label,
        type,
      });
      setPropertyDefinitions((prev) => [...prev, created]);
    },
    [rpc, currentDoc],
  );
  const onUpdateProperty = useCallback(
    async (id: number, label?: string, type?: Property["type"]) => {
      const updated = await rpc.updatePropertyDefinition({ id, label, type });
      if (!updated) return;
      setPropertyDefinitions((prev) => prev.map((p) => (p.id === id ? updated : p)));
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

  const onSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const onSidebarWidthChangeEnd = useCallback(
    async (width: number) => {
      setSidebarWidth(width);
      await rpc.setSidebarWidth({ width });
    },
    [rpc],
  );

  const currentCollection = useMemo(
    () => (currentDoc ? (collections.find((c) => c.id === currentDoc.collectionId) ?? null) : null),
    [currentDoc, collections],
  );

  const parentHierarchy = useMemo(() => {
    if (!currentDoc) return [];
    const byId = new Map(documents.map((d) => [d.id, d]));
    const chain: { id: number; title: string }[] = [];
    let parentId = currentDoc.parentId;
    let safety = 0;
    while (parentId != null && safety < 16) {
      const parent = byId.get(parentId);
      if (!parent) break;
      chain.unshift({ id: parent.id, title: parent.title });
      parentId = parent.parentId;
      safety += 1;
    }
    return chain;
  }, [currentDoc, documents]);

  const childDocuments = useMemo(() => {
    if (!currentDoc) return [];
    const byParent = buildDocumentTree(documents, currentDoc.collectionId);
    return getChildDocuments(byParent, currentDoc.id);
  }, [currentDoc, documents]);

  const onReorderChildDocuments = useCallback(
    async (orderedIds: number[]) => {
      if (!currentDoc || orderedIds.length === 0) return;
      await rpc.reorderChildDocuments({
        collectionId: currentDoc.collectionId,
        parentId: currentDoc.id,
        orderedIds,
      });
      setDocuments((prev) =>
        prev.map((d) => {
          const i = orderedIds.indexOf(d.id);
          if (i >= 0 && d.parentId === currentDoc.id) return { ...d, childOrder: i };
          return d;
        }),
      );
    },
    [rpc, currentDoc],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-elevated)] text-[var(--color-text)]">
      <DocumentSidebar
        settings={settings}
        collections={collections}
        documents={documents}
        selectedId={selectedId}
        onSelectDocument={onSelectDocument}
        onCreateDocument={onCreateDocument}
        onCreateCollection={onCreateCollection}
        onRenameCollection={onRenameCollection}
        onIconChange={onIconChange}
        onDeleteDocument={onDeleteDocument}
        onReparentDocument={onReparentDocument}
        onOpenSettings={() => setSettingsOpen(true)}
        onSwitchDatabase={onSwitchDatabase}
        onDatabaseMetadataChange={onDatabaseMetadataChange}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={onSidebarWidthChange}
        onSidebarWidthChangeEnd={onSidebarWidthChangeEnd}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        onDatabaseReload={refetchFromDatabase}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-6 text-text-muted">
            Loading…
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-text-muted">
            <p>No notes yet.</p>
            <button
              type="button"
              onClick={() => {
                if (collections[0]) void onCreateDocument(collections[0].id, null);
              }}
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
          <div className="pt-2 pr-2 pb-12 mb-2 mr-2 mt-2 pl-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-auto">
            <DocumentEditor
              key={currentDoc.id}
              documentId={currentDoc.id}
              initialBlocks={parseDocumentContent(currentDoc.content)}
              initialTitle={currentDoc.title ?? ""}
              initialIcon={currentDoc.icon ?? null}
              initialPropertyValues={parseDocumentProperties(currentDoc.properties ?? "{}")}
              propertyDefinitions={propertyDefinitions}
              theme={resolvedTheme}
              contextCollectionName={currentCollection?.name}
              contextHierarchy={parentHierarchy}
              onNavigateToDocument={onSelectDocument}
              onSave={onSaveDocument}
              onIconChange={onIconChange}
              onCreateProperty={onCreateProperty}
              onUpdateProperty={onUpdateProperty}
              onDeleteProperty={onDeleteProperty}
              onReorderProperties={onReorderProperties}
              childDocuments={childDocuments}
              onReorderChildDocuments={onReorderChildDocuments}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-text-muted">
            Select a note
          </div>
        )}
      </main>
    </div>
  );
}
