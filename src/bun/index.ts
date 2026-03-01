import {
	BrowserView,
	BrowserWindow,
	Updater,
	Utils,
} from "electrobun/bun";
import type {
	Collection,
	Document,
	DocumentRPC,
	Property,
} from "../shared/types";
import Database from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// Ensure data directory exists
const dataDir = Utils.paths.userData;
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = join(dataDir, "documents.db");
const db = new Database(dbPath, { create: true });

// Property definitions: shared label + type (values live in documents.properties as Record<id, string>)
db.exec(`
  CREATE TABLE IF NOT EXISTS property_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'date', 'time', 'checkbox')),
    position INTEGER NOT NULL DEFAULT 0
  )
`);
try {
	db.exec(`ALTER TABLE property_definitions ADD COLUMN position INTEGER NOT NULL DEFAULT 0`);
} catch {
	// Column already exists
}

// Collections: groups of documents
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Unnamed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Documents: properties column is JSON Record<propertyId, string>; collection_id and parent_id for grouping/nesting
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '[]',
    properties TEXT NOT NULL DEFAULT '{}',
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    parent_id INTEGER REFERENCES documents(id)
  )
`);

// Migration: add collection_id and parent_id if table already existed without them
const docInfo = db.query("PRAGMA table_info(documents)").all() as { name: string }[];
const hasCollectionId = docInfo.some((c) => c.name === "collection_id");
const hasParentId = docInfo.some((c) => c.name === "parent_id");
if (!hasCollectionId) {
	db.exec("ALTER TABLE documents ADD COLUMN collection_id INTEGER REFERENCES collections(id)");
	let defaultCollId: number;
	const existing = db.query("SELECT id FROM collections LIMIT 1").get() as { id: number } | undefined;
	if (existing) {
		defaultCollId = existing.id;
	} else {
		db.exec("INSERT INTO collections (name) VALUES ('Default')");
		defaultCollId = (db.query("SELECT last_insert_rowid() as id").get() as { id: number }).id;
	}
	const updateCollId = db.prepare(
		"UPDATE documents SET collection_id = ? WHERE collection_id IS NULL",
	);
	updateCollId.run(defaultCollId);
}
if (!hasParentId) {
	db.exec("ALTER TABLE documents ADD COLUMN parent_id INTEGER REFERENCES documents(id)");
}

// Ensure at least one collection exists (new DB or after migration)
if (!(db.query("SELECT id FROM collections LIMIT 1").get() as unknown)) {
	db.exec("INSERT INTO collections (name) VALUES ('Default')");
}

const docColumns =
	"id, title, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content, properties, collection_id as collectionId, parent_id as parentId";

// Collection statements
const collColumns =
	"id, name, created_at as createdAt, updated_at as updatedAt";
const getAllCollections = db.prepare(
	`SELECT ${collColumns} FROM collections ORDER BY name`,
);
const getCollectionById = db.prepare(
	`SELECT ${collColumns} FROM collections WHERE id = ?`,
);
const insertCollection = db.prepare(
	`INSERT INTO collections (name) VALUES (?) RETURNING ${collColumns}`,
);
const updateCollectionStmt = db.prepare(
	`UPDATE collections SET name = ?, updated_at = datetime('now') WHERE id = ? RETURNING ${collColumns}`,
);
const deleteCollectionStmt = db.prepare("DELETE FROM collections WHERE id = ?");

// Prepared statements (documents)
const getAllDocuments = db.prepare(
	`SELECT ${docColumns} FROM documents ORDER BY collection_id, updated_at DESC`,
);
const getDocumentById = db.prepare(
	`SELECT ${docColumns} FROM documents WHERE id = ?`,
);
const insertDocument = db.prepare(
	`INSERT INTO documents (title, content, created_by, updated_by, properties, collection_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ${docColumns}`,
);
const updateDocumentStmt = db.prepare(
	`UPDATE documents SET title = COALESCE(?, title), content = COALESCE(?, content), updated_by = ?, updated_at = datetime('now'), properties = COALESCE(?, properties), collection_id = COALESCE(?, collection_id), parent_id = ? WHERE id = ? RETURNING ${docColumns}`,
);
const deleteDocumentStmt = db.prepare("DELETE FROM documents WHERE id = ?");

const propColumns = "id, label, type";
const getAllProperties = db.prepare(
	`SELECT ${propColumns} FROM property_definitions ORDER BY position ASC, id ASC`,
);
const getPropertyById = db.prepare(
	`SELECT ${propColumns} FROM property_definitions WHERE id = ?`,
);
const insertProperty = db.prepare(
	`INSERT INTO property_definitions (label, type) VALUES (?, ?) RETURNING ${propColumns}`,
);
const updatePropertyStmt = db.prepare(
	`UPDATE property_definitions SET label = COALESCE(?, label), type = COALESCE(?, type) WHERE id = ? RETURNING ${propColumns}`,
);
const deletePropertyStmt = db.prepare(
	"DELETE FROM property_definitions WHERE id = ?",
);
const updatePropertyPosition = db.prepare(
	"UPDATE property_definitions SET position = ? WHERE id = ?",
);

const documentRPC = BrowserView.defineRPC<DocumentRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getCollections: () => getAllCollections.all() as Collection[],
			getCollection: ({ id }) =>
				(getCollectionById.get(id) as Collection) ?? null,
			createCollection: ({ name }) =>
				insertCollection.get(name) as Collection,
			updateCollection: ({ id, name }) => {
				const updated = updateCollectionStmt.get(name, id) as
					| Collection
					| undefined;
				return updated ?? null;
			},
			deleteCollection: ({ id }) => {
				const other = db
					.prepare("SELECT id FROM collections WHERE id != ? LIMIT 1")
					.get(id) as { id: number } | undefined;
				if (other) {
					db.prepare("UPDATE documents SET collection_id = ? WHERE collection_id = ?").run(
						other.id,
						id,
					);
				} else {
					db.prepare("DELETE FROM documents WHERE collection_id = ?").run(id);
				}
				deleteCollectionStmt.run(id);
				return { success: true };
			},
			getDocuments: () => getAllDocuments.all() as Document[],
			getDocument: ({ id }) => (getDocumentById.get(id) as Document) ?? null,
			createDocument: ({
				title,
				content,
				createdBy,
				updatedBy,
				properties,
				collectionId,
				parentId,
			}) => {
				const props = properties ?? "{}";
				return insertDocument.get(
					title,
					content,
					createdBy,
					updatedBy,
					props,
					collectionId,
					parentId ?? null,
				) as Document;
			},
			updateDocument: ({
				id,
				title,
				content,
				updatedBy,
				properties,
				collectionId,
				parentId,
			}) => {
				const row = getDocumentById.get(id) as Document | undefined;
				if (!row) return null;
				const newTitle = title ?? row.title;
				const newContent = content ?? row.content;
				const newProps = properties ?? row.properties;
				const newCollectionId = collectionId ?? row.collectionId;
				const newParentId =
					parentId !== undefined ? parentId : row.parentId;
				const updated = updateDocumentStmt.get(
					newTitle,
					newContent,
					updatedBy,
					newProps,
					newCollectionId,
					newParentId,
					id,
				) as Document | undefined;
				return updated ?? null;
			},
			deleteDocument: ({ id }) => {
				db.prepare("UPDATE documents SET parent_id = NULL WHERE parent_id = ?").run(id);
				deleteDocumentStmt.run(id);
				return { success: true };
			},
			getPropertyDefinitions: () => getAllProperties.all() as Property[],
			createPropertyDefinition: ({ label, type }) =>
				insertProperty.get(label, type) as Property,
			updatePropertyDefinition: ({ id, label, type }) => {
				const row = getPropertyById.get(id) as Property | undefined;
				if (!row) return null;
				const updated = updatePropertyStmt.get(
					label ?? row.label,
					type ?? row.type,
					id,
				) as Property | undefined;
				return updated ?? null;
			},
			deletePropertyDefinition: ({ id }) => {
				deletePropertyStmt.run(id);
				return { success: true };
			},
			reorderPropertyDefinitions: ({ orderedIds }) => {
				orderedIds.forEach((id, position) => {
					updatePropertyPosition.run(position, id);
				});
				return undefined;
			},
		},
		messages: {},
	},
});

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "Note Taker",
	url,
	rpc: documentRPC,
	frame: {
		width: 900,
		height: 700,
		x: 200,
		y: 200,
	},
});

console.log("Note Taker started!");
console.log(`Database: ${dbPath}`);
