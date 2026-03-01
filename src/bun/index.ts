import {
	BrowserView,
	BrowserWindow,
	Updater,
	Utils,
} from "electrobun/bun";
import type { Document, DocumentRPC, Property } from "../shared/types";
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
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'date', 'time', 'checkbox'))
  )
`);

// Documents: properties column is JSON Record<propertyId, string>
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '[]',
    properties TEXT NOT NULL DEFAULT '{}'
  )
`);

const docColumns =
	"id, title, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content, properties";

// Prepared statements
const getAllDocuments = db.prepare(
	`SELECT ${docColumns} FROM documents ORDER BY updated_at DESC`,
);
const getDocumentById = db.prepare(
	`SELECT ${docColumns} FROM documents WHERE id = ?`,
);
const insertDocument = db.prepare(
	`INSERT INTO documents (title, content, created_by, updated_by, properties) VALUES (?, ?, ?, ?, ?) RETURNING ${docColumns}`,
);
const updateDocumentStmt = db.prepare(
	`UPDATE documents SET title = ?, content = ?, updated_by = ?, updated_at = datetime('now'), properties = ? WHERE id = ? RETURNING ${docColumns}`,
);
const deleteDocumentStmt = db.prepare("DELETE FROM documents WHERE id = ?");

const propColumns = "id, label, type";
const getAllProperties = db.prepare(
	`SELECT ${propColumns} FROM property_definitions ORDER BY id`,
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

const documentRPC = BrowserView.defineRPC<DocumentRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getDocuments: () => getAllDocuments.all() as Document[],
			getDocument: ({ id }) => (getDocumentById.get(id) as Document) ?? null,
			createDocument: ({ title, content, createdBy, updatedBy, properties }) => {
				const props = properties ?? "{}";
				return insertDocument.get(
					title,
					content,
					createdBy,
					updatedBy,
					props,
				) as Document;
			},
			updateDocument: ({ id, title, content, updatedBy, properties }) => {
				const row = getDocumentById.get(id) as Document | undefined;
				if (!row) return null;
				const newTitle = title ?? row.title;
				const newContent = content ?? row.content;
				const newProps = properties ?? row.properties;
				const updated = updateDocumentStmt.get(
					newTitle,
					newContent,
					updatedBy,
					newProps,
					id,
				) as Document | undefined;
				return updated ?? null;
			},
			deleteDocument: ({ id }) => {
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
