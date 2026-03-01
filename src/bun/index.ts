import {
	BrowserView,
	BrowserWindow,
	Updater,
	Utils,
} from "electrobun/bun";
import type { Document, DocumentRPC } from "../shared/types";
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

// Create documents table: id, metadata (createdAt, updatedAt, createdBy, updatedBy), content (BlockNote JSON)
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '[]'
  )
`);

// Prepared statements
const getAllDocuments = db.prepare(
	"SELECT id, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content FROM documents ORDER BY updated_at DESC",
);
const getDocumentById = db.prepare(
	"SELECT id, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content FROM documents WHERE id = ?",
);
const insertDocument = db.prepare(
	"INSERT INTO documents (content, created_by, updated_by) VALUES (?, ?, ?) RETURNING id, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content",
);
const updateDocumentStmt = db.prepare(
	"UPDATE documents SET content = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ? RETURNING id, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content",
);
const deleteDocumentStmt = db.prepare("DELETE FROM documents WHERE id = ?");

const documentRPC = BrowserView.defineRPC<DocumentRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getDocuments: () => getAllDocuments.all() as Document[],
			getDocument: ({ id }) => (getDocumentById.get(id) as Document) ?? null,
			createDocument: ({ content, createdBy, updatedBy }) => {
				return insertDocument.get(
					content,
					createdBy,
					updatedBy,
				) as Document;
			},
			updateDocument: ({ id, content, updatedBy }) => {
				const row = updateDocumentStmt.get(content, updatedBy, id) as
					| Document
					| undefined;
				return row ?? null;
			},
			deleteDocument: ({ id }) => {
				deleteDocumentStmt.run(id);
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
