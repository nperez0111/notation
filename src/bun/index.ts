import Electrobun, {
  ApplicationMenu,
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

type DatabaseInstance = InstanceType<typeof Database>;
type PreparedStatement = ReturnType<DatabaseInstance["prepare"]>;
import { join, basename } from "path";
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

type SettingsJson = {
  dbDirectory?: string;
  databaseName?: string;
  databaseIcon?: string; // base64 data URL or empty
  recentDbDirectories?: string[];
  sidebarWidth?: number;
};

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
  "id, title, created_at as createdAt, updated_at as updatedAt, created_by as createdBy, updated_by as updatedBy, content, properties, collection_id as collectionId, parent_id as parentId, icon, child_order as childOrder";
const collColumns =
  "id, name, created_at as createdAt, updated_at as updatedAt";
const propColumns = "id, collection_id as collectionId, label, type";

type DbState = {
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
};

const INIT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS property_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'date', 'time', 'checkbox')),
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Unnamed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
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
    parent_id INTEGER REFERENCES documents(id),
    icon TEXT,
    child_order INTEGER NOT NULL DEFAULT 0
  );
`;

function createDbState(dbDirectory: string): DbState {
  if (!existsSync(dbDirectory)) {
    mkdirSync(dbDirectory, { recursive: true });
  }
  const dbPath = join(dbDirectory, DB_FILENAME);
  const db = new Database(dbPath, { create: true });

  db.exec(INIT_SCHEMA);

  // Single migration: ensure columns exist for DBs created before final schema (no multi-stage).
  try {
    db.exec("ALTER TABLE documents ADD COLUMN icon TEXT");
  } catch {
    // Column already exists
  }
  // Migration: property_definitions per collection (add collection_id, backfill, then enforce).
  try {
    db.exec(
      "ALTER TABLE property_definitions ADD COLUMN collection_id INTEGER REFERENCES collections(id)",
    );
    db.exec(
      "UPDATE property_definitions SET collection_id = (SELECT id FROM collections LIMIT 1) WHERE collection_id IS NULL",
    );
  } catch {
    // Column already exists (new schema)
  }
  try {
    db.exec(
      "ALTER TABLE documents ADD COLUMN child_order INTEGER NOT NULL DEFAULT 0",
    );
  } catch {
    // Column already exists
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
    getPropertyById: db.prepare(
      `SELECT ${propColumns} FROM property_definitions WHERE id = ?`,
    ),
    insertProperty: db.prepare(
      `INSERT INTO property_definitions (collection_id, label, type) VALUES (?, ?, ?) RETURNING ${propColumns}`,
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
/** Returns set of all descendant document ids under the given document (by parent_id chain). */
function getDescendantIds(
  documents: Document[],
  parentId: number,
): Set<number> {
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
          dbState.db
            .prepare(
              "UPDATE documents SET collection_id = ? WHERE collection_id = ?",
            )
            .run(other.id, id);
        } else {
          dbState.db
            .prepare("DELETE FROM documents WHERE collection_id = ?")
            .run(id);
        }
        dbState.db
          .prepare("DELETE FROM property_definitions WHERE collection_id = ?")
          .run(id);
        dbState.deleteCollectionStmt.run(id);
        return { success: true };
      },
      getDocuments: () => dbState.getAllDocuments.all() as Document[],
      getDocument: ({ id }) =>
        (dbState.getDocumentById.get(id) as Document) ?? null,
      createDocument: ({
        title,
        content,
        createdBy,
        updatedBy,
        properties,
        collectionId,
        parentId,
        icon,
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
          icon ?? null,
          0, // child_order
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
        icon,
      }) => {
        const row = dbState.getDocumentById.get(id) as Document | undefined;
        if (!row) return null;
        const newTitle = title ?? row.title;
        const newContent = content ?? row.content;
        const newProps = properties ?? row.properties;
        const newCollectionId = collectionId ?? row.collectionId;
        const newParentId = parentId !== undefined ? parentId : row.parentId;
        const newIcon =
          icon !== undefined ? icon : (row as { icon?: string | null }).icon;

        // Enforce: cannot move a document into itself or into one of its descendants (no-op)
        if (parentId !== undefined && newParentId !== null) {
          if (newParentId === id) return row;
          const allDocs = dbState.getAllDocuments.all() as Document[];
          const inCollection = allDocs.filter(
            (d) => d.collectionId === newCollectionId,
          );
          const descendantsOfSource = getDescendantIds(inCollection, id);
          if (descendantsOfSource.has(newParentId)) return row;
        }

        const currentChildOrder =
          (row as { childOrder?: number }).childOrder ?? 0;
        const updated = dbState.updateDocumentStmt.get(
          newTitle,
          newContent,
          updatedBy,
          newProps,
          newCollectionId,
          newParentId,
          newIcon ?? null,
          currentChildOrder, // leave unchanged unless reorderChildDocuments
          id,
        ) as Document | undefined;
        return updated ?? null;
      },
      deleteDocument: ({ id }) => {
        dbState.db
          .prepare("UPDATE documents SET parent_id = NULL WHERE parent_id = ?")
          .run(id);
        dbState.deleteDocumentStmt.run(id);
        return { success: true };
      },
      getPropertyDefinitions: ({ collectionId }) =>
        dbState.getPropertiesByCollection.all(collectionId) as Property[],
      createPropertyDefinition: ({ collectionId, label, type }) =>
        dbState.insertProperty.get(collectionId, label, type) as Property,
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
      reorderChildDocuments: ({ orderedIds }) => {
        orderedIds.forEach((id, index) => {
          dbState.updateDocumentChildOrder.run(index, id);
        });
      },
      getSettings: (): SettingsInfo => {
        const count = (
          dbState.db.query("SELECT COUNT(*) as c FROM documents").get() as {
            c: number;
          }
        ).c;
        const s = loadSettings();
        const dbName = s.databaseName ?? basename(dbState.dbDirectory);
        const recentRaw = (s.recentDbDirectories ?? []).filter(
          (d) => d !== dbState.dbDirectory,
        );
        const recent = [dbState.dbDirectory, ...recentRaw].slice(0, 10);
        return {
          dbPath: dbState.dbPath,
          dbDirectory: dbState.dbDirectory,
          documentCount: count,
          databaseName: dbName,
          databaseIcon: s.databaseIcon ?? null,
          recentDatabases: recent.map((dir) => ({
            directory: dir,
            name:
              dir === dbState.dbDirectory && s.databaseName
                ? s.databaseName
                : basename(dir),
          })),
          sidebarWidth: s.sidebarWidth,
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
        const s = loadSettings();
        const recent = [
          directory,
          ...(s.recentDbDirectories ?? []).filter((d) => d !== directory),
        ].slice(0, 10);
        saveSettings({
          ...s,
          dbDirectory: directory,
          recentDbDirectories: recent,
        });
        return { success: true };
      },
      setDatabaseMetadata: ({
        name,
        icon,
      }: {
        name?: string;
        icon?: string | null;
      }) => {
        const s = loadSettings();
        saveSettings({
          ...s,
          databaseName: name !== undefined ? name : s.databaseName,
          databaseIcon: icon !== undefined ? icon || undefined : s.databaseIcon,
        });
        return { success: true };
      },
      setSidebarWidth: ({ width }: { width: number }) => {
        const s = loadSettings();
        saveSettings({ ...s, sidebarWidth: width });
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

const APP_NAME = "Note Taker";
const isMac = process.platform === "darwin";

// Application menu: set after window + deferred so native bridge receives the config (fixes macOS "Unable to parse empty data").
// macOS: first item is { submenu } only (app menu); Windows: File first with Settings.
function buildApplicationMenu(): Parameters<
  typeof ApplicationMenu.setApplicationMenu
>[0] {
  const appSubmenu = [
    { label: "Settings…", action: "open-settings", accelerator: "," },
    { type: "separator" as const },
    { role: "hide" },
    { role: "hideOthers" },
    { role: "showAll" },
    { type: "separator" as const },
    { label: "Quit", role: "quit", accelerator: "q" },
  ];
  const fileSubmenu = [
    ...(isMac
      ? []
      : [{ label: "Settings…", action: "open-settings", accelerator: "," }]),
    { type: "separator" as const },
    { role: "close" },
  ];
  const editSubmenu = [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" as const },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
    { role: "pasteAndMatchStyle" },
    { role: "delete" },
    { role: "selectAll" },
  ];
  const viewSubmenu = [{ role: "toggleFullScreen" }];
  const windowSubmenu = isMac
    ? [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" as const },
        { role: "bringAllToFront" },
      ]
    : [{ role: "minimize" }, { role: "zoom" }, { role: "close" }];

  const topLevel: Parameters<typeof ApplicationMenu.setApplicationMenu>[0] = [];
  if (isMac) {
    topLevel.push(
      { submenu: appSubmenu },
      { label: "File", submenu: fileSubmenu },
    );
  } else {
    topLevel.push({ label: "File", submenu: fileSubmenu });
  }
  topLevel.push(
    { label: "Edit", submenu: editSubmenu },
    { label: "View", submenu: viewSubmenu },
    { label: "Window", submenu: windowSubmenu },
  );
  return topLevel;
}

Electrobun.events.on("application-menu-clicked", (e) => {
  const action = (e?.data as { action?: string } | undefined)?.action;
  if (action === "open-settings") {
    mainWindow.webview?.rpc?.request?.("openSettings", {});
  }
});

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
  title: APP_NAME,
  url,
  rpc: documentRPC,
  frame: {
    width: 1200,
    height: 800,
    x: 0,
    y: 0,
  },
});

// Defer so native bridge has the string when it reads it (macOS); same pattern on Windows for consistency.
setTimeout(() => {
  ApplicationMenu.setApplicationMenu(buildApplicationMenu());
}, 100);

console.log("Note Taker started!");
console.log(`Database: ${dbState.dbPath}`);
