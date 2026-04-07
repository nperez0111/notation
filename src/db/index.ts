/**
 * Database state and CRUD operations for the note-taker app.
 * Portable: no Electrobun or platform-specific dependencies (uses bun:sqlite).
 */

import Database from "bun:sqlite";
import type {
  Collection,
  Document,
  DocumentIcon,
  Property,
  PropertyType,
  PublishStatus,
} from "../shared/types";
import { INIT_SCHEMA, runMigrations, ensureDefaultCollection } from "./schema";
import { computeContentHash } from "./bluesky";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

type DatabaseInstance = InstanceType<typeof Database>;
type PreparedStatement = ReturnType<DatabaseInstance["prepare"]>;

export const DB_FILENAME = "documents.db";

const docColumns =
  "id, title, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content, properties, collection_id as collectionId, parent_id as parentId, icon, child_order as childOrder, published_uri as publishedUri, published_cid as publishedCid, published_at as publishedAt, content_hash as contentHash";
const collColumns = "id, name, created_at as createdAt, updated_at as updatedAt";
const propColumns = "id, collection_id as collectionId, label, type";

export type DbState = {
  db: DatabaseInstance;
  dbPath: string;
  dbDirectory: string;
  getAllCollections: PreparedStatement;
  getCollectionById: PreparedStatement;
  insertCollection: PreparedStatement;
  updateCollectionStmt: PreparedStatement;
  deleteCollectionStmt: PreparedStatement;
  getAllDocuments: PreparedStatement;
  getDocumentById: PreparedStatement;
  insertDocument: PreparedStatement;
  updateDocumentStmt: PreparedStatement;
  updateDocumentChildOrder: PreparedStatement;
  deleteDocumentStmt: PreparedStatement;
  getPropertiesByCollection: PreparedStatement;
  getPropertyById: PreparedStatement;
  insertProperty: PreparedStatement;
  updatePropertyStmt: PreparedStatement;
  deletePropertyStmt: PreparedStatement;
  updatePropertyPosition: PreparedStatement;
  getBlueskyAuth: PreparedStatement;
  upsertBlueskyAuth: PreparedStatement;
  deleteBlueskyAuth: PreparedStatement;
  updateDocPublish: PreparedStatement;
  clearDocPublish: PreparedStatement;
};

export function createDbState(dbDirectory: string): DbState {
  if (!existsSync(dbDirectory)) {
    mkdirSync(dbDirectory, { recursive: true });
  }
  const dbPath = join(dbDirectory, DB_FILENAME);
  const db = new Database(dbPath, { create: true });

  db.exec(INIT_SCHEMA);
  runMigrations(db);
  ensureDefaultCollection(db);

  return {
    db,
    dbPath,
    dbDirectory,
    getAllCollections: db.prepare(`SELECT ${collColumns} FROM collections ORDER BY name`),
    getCollectionById: db.prepare(`SELECT ${collColumns} FROM collections WHERE id = ?`),
    insertCollection: db.prepare(
      `INSERT INTO collections (name) VALUES (?) RETURNING ${collColumns}`,
    ),
    updateCollectionStmt: db.prepare(
      `UPDATE collections SET name = ?, updated_at = datetime('now') WHERE id = ? RETURNING ${collColumns}`,
    ),
    deleteCollectionStmt: db.prepare("DELETE FROM collections WHERE id = ?"),
    getAllDocuments: db.prepare(
      `SELECT ${docColumns} FROM documents ORDER BY collection_id, updated_at DESC`,
    ),
    getDocumentById: db.prepare(`SELECT ${docColumns} FROM documents WHERE id = ?`),
    insertDocument: db.prepare(
      `INSERT INTO documents (title, content, created_by, updated_by, properties, collection_id, parent_id, icon, child_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${docColumns}`,
    ),
    updateDocumentStmt: db.prepare(
      `UPDATE documents SET title = COALESCE(?, title), content = COALESCE(?, content), updated_by = ?, updated_at = datetime('now'), properties = COALESCE(?, properties), collection_id = COALESCE(?, collection_id), parent_id = ?, icon = ?, child_order = COALESCE(?, child_order) WHERE id = ? RETURNING ${docColumns}`,
    ),
    updateDocumentChildOrder: db.prepare(
      "UPDATE documents SET child_order = ?, updated_at = datetime('now') WHERE id = ?",
    ),
    deleteDocumentStmt: db.prepare("DELETE FROM documents WHERE id = ?"),
    getPropertiesByCollection: db.prepare(
      `SELECT ${propColumns} FROM property_definitions WHERE collection_id = ? ORDER BY position ASC, id ASC`,
    ),
    getPropertyById: db.prepare(`SELECT ${propColumns} FROM property_definitions WHERE id = ?`),
    insertProperty: db.prepare(
      `INSERT INTO property_definitions (collection_id, label, type) VALUES (?, ?, ?) RETURNING ${propColumns}`,
    ),
    updatePropertyStmt: db.prepare(
      `UPDATE property_definitions SET label = COALESCE(?, label), type = COALESCE(?, type) WHERE id = ? RETURNING ${propColumns}`,
    ),
    deletePropertyStmt: db.prepare("DELETE FROM property_definitions WHERE id = ?"),
    updatePropertyPosition: db.prepare("UPDATE property_definitions SET position = ? WHERE id = ?"),
    getBlueskyAuth: db.prepare(
      "SELECT handle, did, service, access_jwt as accessJwt, refresh_jwt as refreshJwt, publication_uri as publicationUri FROM bluesky_auth WHERE id = 1",
    ),
    upsertBlueskyAuth: db.prepare(
      "INSERT OR REPLACE INTO bluesky_auth (id, handle, did, service, access_jwt, refresh_jwt, publication_uri, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))",
    ),
    deleteBlueskyAuth: db.prepare("DELETE FROM bluesky_auth WHERE id = 1"),
    updateDocPublish: db.prepare(
      "UPDATE documents SET published_uri = ?, published_cid = ?, published_at = datetime('now'), content_hash = ? WHERE id = ?",
    ),
    clearDocPublish: db.prepare(
      "UPDATE documents SET published_uri = NULL, published_cid = NULL, published_at = NULL, content_hash = NULL WHERE id = ?",
    ),
  };
}

/** Returns set of all descendant document ids under the given document (by parent_id chain). */
export function getDescendantIds(documents: Document[], parentId: number): Set<number> {
  const byParent = new Map<number | null, Document[]>();
  for (const d of documents) {
    const key = d.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(d);
  }
  const out = new Set<number>();
  const stack = [parentId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const children = byParent.get(id) ?? [];
    for (const c of children) {
      out.add(c.id);
      stack.push(c.id);
    }
  }
  return out;
}

// --- CRUD Functions ---

export function getAllCollections(state: DbState): Collection[] {
  return state.getAllCollections.all() as Collection[];
}

export function getCollection(state: DbState, id: number): Collection | null {
  return (state.getCollectionById.get(id) as Collection) ?? null;
}

export function createCollection(state: DbState, name: string): Collection {
  return state.insertCollection.get(name) as Collection;
}

export function updateCollection(state: DbState, id: number, name: string): Collection | null {
  const updated = state.updateCollectionStmt.get(name, id) as Collection | undefined;
  return updated ?? null;
}

export function deleteCollection(state: DbState, id: number): { success: boolean } {
  const other = state.db.prepare("SELECT id FROM collections WHERE id != ? LIMIT 1").get(id) as
    | { id: number }
    | undefined;
  if (other) {
    state.db
      .prepare("UPDATE documents SET collection_id = ? WHERE collection_id = ?")
      .run(other.id, id);
  } else {
    state.db.prepare("DELETE FROM documents WHERE collection_id = ?").run(id);
  }
  state.db.prepare("DELETE FROM property_definitions WHERE collection_id = ?").run(id);
  state.deleteCollectionStmt.run(id);
  return { success: true };
}

export function getAllDocuments(state: DbState): Document[] {
  return state.getAllDocuments.all() as Document[];
}

export function getDocument(state: DbState, id: number): Document | null {
  return (state.getDocumentById.get(id) as Document) ?? null;
}

export function createDocument(
  state: DbState,
  params: {
    title: string;
    content: string;
    createdBy: string;
    updatedBy: string;
    properties?: string;
    collectionId: number;
    parentId?: number | null;
    icon?: DocumentIcon;
  },
): Document {
  const props = params.properties ?? "{}";
  return state.insertDocument.get(
    params.title,
    params.content,
    params.createdBy,
    params.updatedBy,
    props,
    params.collectionId,
    params.parentId ?? null,
    params.icon ?? null,
    0,
  ) as Document;
}

export function updateDocument(
  state: DbState,
  params: {
    id: number;
    title?: string;
    content?: string;
    updatedBy: string;
    properties?: string;
    collectionId?: number;
    parentId?: number | null;
    icon?: DocumentIcon;
  },
): Document | null {
  const row = state.getDocumentById.get(params.id) as Document | undefined;
  if (!row) return null;
  const newTitle = params.title ?? row.title;
  const newContent = params.content ?? row.content;
  const newProps = params.properties ?? row.properties;
  const newCollectionId = params.collectionId ?? row.collectionId;
  const newParentId = params.parentId !== undefined ? params.parentId : row.parentId;
  const newIcon = params.icon !== undefined ? params.icon : (row as { icon?: string | null }).icon;

  // Enforce: cannot move a document into itself or into one of its descendants
  if (params.parentId !== undefined && newParentId !== null) {
    if (newParentId === params.id) return row;
    const allDocs = state.getAllDocuments.all() as Document[];
    const inCollection = allDocs.filter((d) => d.collectionId === newCollectionId);
    const descendantsOfSource = getDescendantIds(inCollection, params.id);
    if (descendantsOfSource.has(newParentId)) return row;
  }

  const currentChildOrder = (row as { childOrder?: number }).childOrder ?? 0;
  const updated = state.updateDocumentStmt.get(
    newTitle,
    newContent,
    params.updatedBy,
    newProps,
    newCollectionId,
    newParentId,
    newIcon ?? null,
    currentChildOrder,
    params.id,
  ) as Document | undefined;
  return updated ?? null;
}

export function deleteDocument(state: DbState, id: number): { success: boolean } {
  const stack = [id];
  const toDelete: number[] = [];
  while (stack.length > 0) {
    const current = stack.pop()!;
    toDelete.push(current);
    const children = state.db
      .prepare("SELECT id FROM documents WHERE parent_id = ?")
      .all(current) as { id: number }[];
    for (const child of children) stack.push(child.id);
  }
  const placeholders = toDelete.map(() => "?").join(",");
  state.db.prepare(`DELETE FROM documents WHERE id IN (${placeholders})`).run(...toDelete);
  return { success: true };
}

export function getPropertyDefinitions(state: DbState, collectionId: number): Property[] {
  return state.getPropertiesByCollection.all(collectionId) as Property[];
}

export function createPropertyDefinition(
  state: DbState,
  collectionId: number,
  label: string,
  type: PropertyType,
): Property {
  return state.insertProperty.get(collectionId, label, type) as Property;
}

export function updatePropertyDefinition(
  state: DbState,
  id: number,
  label?: string,
  type?: PropertyType,
): Property | null {
  const row = state.getPropertyById.get(id) as Property | undefined;
  if (!row) return null;
  const updated = state.updatePropertyStmt.get(label ?? row.label, type ?? row.type, id) as
    | Property
    | undefined;
  return updated ?? null;
}

export function deletePropertyDefinition(state: DbState, id: number): { success: boolean } {
  state.deletePropertyStmt.run(id);
  return { success: true };
}

export function reorderPropertyDefinitions(state: DbState, orderedIds: number[]): void {
  orderedIds.forEach((id, position) => {
    state.updatePropertyPosition.run(position, id);
  });
}

export function reorderChildDocuments(state: DbState, orderedIds: number[]): void {
  orderedIds.forEach((id, index) => {
    state.updateDocumentChildOrder.run(index, id);
  });
}

export function getPublishStatus(state: DbState, id: number): PublishStatus | null {
  const doc = state.getDocumentById.get(id) as Document | undefined;
  if (!doc) return null;
  if (!doc.publishedUri) return { published: false };

  const currentHash = computeContentHash(doc.title, doc.content);
  return {
    published: true,
    uri: doc.publishedUri,
    cid: doc.publishedCid ?? undefined,
    publishedAt: doc.publishedAt ?? undefined,
    isModified: currentHash !== doc.contentHash,
  };
}

export function getDocumentCount(state: DbState): number {
  return (state.db.query("SELECT COUNT(*) as c FROM documents").get() as { c: number }).c;
}
