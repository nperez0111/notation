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
	SettingsInfo,
} from "../shared/types";
import Database from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "fs";
import { execSync } from "child_process";

const SETTINGS_FILE = "settings.json";
const DB_FILENAME = "documents.db";

// Ensure data directory exists
const dataDir = Utils.paths.userData;
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

function getSettingsPath(): string {
	return join(dataDir, SETTINGS_FILE);
}

type SettingsJson = { dbDirectory?: string };

function loadSettings(): SettingsJson {
	const path = getSettingsPath();
	if (!existsSync(path)) return {};
	try {
		const data = readFileSync(path, "utf-8");
		return JSON.parse(data) as SettingsJson;
	} catch {
		return {};
	}
}

function saveSettings(settings: SettingsJson): void {
	Bun.write(getSettingsPath(), JSON.stringify(settings, null, 2));
}

const docColumns =
	"id, title, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content, properties, collection_id as collectionId, parent_id as parentId";
const collColumns =
	"id, name, created_at as createdAt, updated_at as updatedAt";
const propColumns = "id, label, type";

type DbState = {
	db: Database.Database;
	dbPath: string;
	dbDirectory: string;
	getAllCollections: ReturnType<Database.Database["prepare"]>;
	getCollectionById: ReturnType<Database.Database["prepare"]>;
	insertCollection: ReturnType<Database.Database["prepare"]>;
	updateCollectionStmt: ReturnType<Database.Database["prepare"]>;
	deleteCollectionStmt: ReturnType<Database.Database["prepare"]>;
	getAllDocuments: ReturnType<Database.Database["prepare"]>;
	getDocumentById: ReturnType<Database.Database["prepare"]>;
	insertDocument: ReturnType<Database.Database["prepare"]>;
	updateDocumentStmt: ReturnType<Database.Database["prepare"]>;
	deleteDocumentStmt: ReturnType<Database.Database["prepare"]>;
	getAllProperties: ReturnType<Database.Database["prepare"]>;
	getPropertyById: ReturnType<Database.Database["prepare"]>;
	insertProperty: ReturnType<Database.Database["prepare"]>;
	updatePropertyStmt: ReturnType<Database.Database["prepare"]>;
	deletePropertyStmt: ReturnType<Database.Database["prepare"]>;
	updatePropertyPosition: ReturnType<Database.Database["prepare"]>;
};

function createDbState(dbDirectory: string): DbState {
	if (!existsSync(dbDirectory)) {
		mkdirSync(dbDirectory, { recursive: true });
	}
	const dbPath = join(dbDirectory, DB_FILENAME);
	const db = new Database(dbPath, { create: true });

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

	db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Unnamed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

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
		db.prepare(
			"UPDATE documents SET collection_id = ? WHERE collection_id IS NULL",
		).run(defaultCollId);
	}
	if (!hasParentId) {
		db.exec("ALTER TABLE documents ADD COLUMN parent_id INTEGER REFERENCES documents(id)");
	}

	if (!(db.query("SELECT id FROM collections LIMIT 1").get() as unknown)) {
		db.exec("INSERT INTO collections (name) VALUES ('Default')");
	}

	return {
		db,
		dbPath,
		dbDirectory,
		getAllCollections: db.prepare(
			`SELECT ${collColumns} FROM collections ORDER BY name`,
		),
		getCollectionById: db.prepare(
			`SELECT ${collColumns} FROM collections WHERE id = ?`,
		),
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
		getDocumentById: db.prepare(
			`SELECT ${docColumns} FROM documents WHERE id = ?`,
		),
		insertDocument: db.prepare(
			`INSERT INTO documents (title, content, created_by, updated_by, properties, collection_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ${docColumns}`,
		),
		updateDocumentStmt: db.prepare(
			`UPDATE documents SET title = COALESCE(?, title), content = COALESCE(?, content), updated_by = ?, updated_at = datetime('now'), properties = COALESCE(?, properties), collection_id = COALESCE(?, collection_id), parent_id = ? WHERE id = ? RETURNING ${docColumns}`,
		),
		deleteDocumentStmt: db.prepare("DELETE FROM documents WHERE id = ?"),
		getAllProperties: db.prepare(
			`SELECT ${propColumns} FROM property_definitions ORDER BY position ASC, id ASC`,
		),
		getPropertyById: db.prepare(
			`SELECT ${propColumns} FROM property_definitions WHERE id = ?`,
		),
		insertProperty: db.prepare(
			`INSERT INTO property_definitions (label, type) VALUES (?, ?) RETURNING ${propColumns}`,
		),
		updatePropertyStmt: db.prepare(
			`UPDATE property_definitions SET label = COALESCE(?, label), type = COALESCE(?, type) WHERE id = ? RETURNING ${propColumns}`,
		),
		deletePropertyStmt: db.prepare(
			"DELETE FROM property_definitions WHERE id = ?",
		),
		updatePropertyPosition: db.prepare(
			"UPDATE property_definitions SET position = ? WHERE id = ?",
		),
	};
}

const initialSettings = loadSettings();
const initialDbDirectory = initialSettings.dbDirectory ?? dataDir;
let dbState = createDbState(initialDbDirectory);

function reloadDatabase(): boolean {
	try {
		dbState.db.close(false);
	} catch {
		// ignore if already closed
	}
	const settings = loadSettings();
	const nextDir = settings.dbDirectory ?? dataDir;
	dbState = createDbState(nextDir);
	return true;
}

const documentRPC = BrowserView.defineRPC<DocumentRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			getCollections: () => dbState.getAllCollections.all() as Collection[],
			getCollection: ({ id }) =>
				(dbState.getCollectionById.get(id) as Collection) ?? null,
			createCollection: ({ name }) =>
				dbState.insertCollection.get(name) as Collection,
			updateCollection: ({ id, name }) => {
				const updated = dbState.updateCollectionStmt.get(name, id) as
					| Collection
					| undefined;
				return updated ?? null;
			},
			deleteCollection: ({ id }) => {
				const other = dbState.db
					.prepare("SELECT id FROM collections WHERE id != ? LIMIT 1")
					.get(id) as { id: number } | undefined;
				if (other) {
					dbState.db.prepare("UPDATE documents SET collection_id = ? WHERE collection_id = ?").run(
						other.id,
						id,
					);
				} else {
					dbState.db.prepare("DELETE FROM documents WHERE collection_id = ?").run(id);
				}
				dbState.deleteCollectionStmt.run(id);
				return { success: true };
			},
			getDocuments: () => dbState.getAllDocuments.all() as Document[],
			getDocument: ({ id }) => (dbState.getDocumentById.get(id) as Document) ?? null,
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
				return dbState.insertDocument.get(
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
				const row = dbState.getDocumentById.get(id) as Document | undefined;
				if (!row) return null;
				const newTitle = title ?? row.title;
				const newContent = content ?? row.content;
				const newProps = properties ?? row.properties;
				const newCollectionId = collectionId ?? row.collectionId;
				const newParentId =
					parentId !== undefined ? parentId : row.parentId;
				const updated = dbState.updateDocumentStmt.get(
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
				dbState.db.prepare("UPDATE documents SET parent_id = NULL WHERE parent_id = ?").run(id);
				dbState.deleteDocumentStmt.run(id);
				return { success: true };
			},
			getPropertyDefinitions: () => dbState.getAllProperties.all() as Property[],
			createPropertyDefinition: ({ label, type }) =>
				dbState.insertProperty.get(label, type) as Property,
			updatePropertyDefinition: ({ id, label, type }) => {
				const row = dbState.getPropertyById.get(id) as Property | undefined;
				if (!row) return null;
				const updated = dbState.updatePropertyStmt.get(
					label ?? row.label,
					type ?? row.type,
					id,
				) as Property | undefined;
				return updated ?? null;
			},
			deletePropertyDefinition: ({ id }) => {
				dbState.deletePropertyStmt.run(id);
				return { success: true };
			},
			reorderPropertyDefinitions: ({ orderedIds }) => {
				orderedIds.forEach((id, position) => {
					dbState.updatePropertyPosition.run(position, id);
				});
				return undefined;
			},
			getSettings: (): SettingsInfo => {
				const count = (dbState.db.query("SELECT COUNT(*) as c FROM documents").get() as { c: number }).c;
				return {
					dbPath: dbState.dbPath,
					dbDirectory: dbState.dbDirectory,
					documentCount: count,
				};
			},
			chooseDatabaseDirectory: (): string | null => {
				try {
					const result = execSync(
						"osascript -e 'return POSIX path of (choose folder with prompt \"Choose folder for database\")'",
						{ encoding: "utf-8" },
					);
					return result.trim() || null;
				} catch {
					return null;
				}
			},
			setDatabaseLocation: ({
				directory,
				mode,
			}: {
				directory: string;
				mode: "new" | "move";
			}) => {
				if (!existsSync(directory)) {
					mkdirSync(directory, { recursive: true });
				}
				const newDbPath = join(directory, DB_FILENAME);
				if (mode === "move" && existsSync(dbState.dbPath)) {
					copyFileSync(dbState.dbPath, newDbPath);
				}
				saveSettings({ dbDirectory: directory });
				return { success: true };
			},
			reloadDatabase: () => ({ success: reloadDatabase() }),
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
console.log(`Database: ${dbState.dbPath}`);
