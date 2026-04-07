import Electrobun, {
  ApplicationMenu,
  BrowserView,
  BrowserWindow,
  Updater,
  Utils,
} from "electrobun/bun";
import type { BlueskySession, DocumentRPC, SettingsInfo } from "../shared/types";
import {
  type BlueskyAuthRow,
  blocksToPlaintext,
  clearSession,
  computeContentHash,
  login as blueskyLogin,
  publishDocument as blueskyPublishDocument,
  unpublishDocument as blueskyUnpublishDocument,
  ensurePublication,
  resumeSession,
} from "../db/bluesky";
import { createLexiconContent } from "../shared/atproto/serialize";
import type { PartialBlock } from "@blocknote/core";
import {
  type DbState,
  DB_FILENAME,
  createDbState,
  getAllCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPropertyDefinitions,
  createPropertyDefinition,
  updatePropertyDefinition,
  deletePropertyDefinition,
  reorderPropertyDefinitions,
  reorderChildDocuments,
  getPublishStatus,
  getDocumentCount,
} from "../db";
import { join, basename } from "path";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "fs";
import { execSync } from "child_process";

const SETTINGS_FILE = "settings.json";

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
  databaseIcon?: string;
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
  void Bun.write(getSettingsPath(), JSON.stringify(settings, null, 2));
}

const initialSettings = loadSettings();
const initialDbDirectory = initialSettings.dbDirectory ?? dataDir;
let dbState: DbState = createDbState(initialDbDirectory);

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
  maxRequestTime: 15000,
  handlers: {
    requests: {
      getCollections: () => getAllCollections(dbState),
      getCollection: ({ id }) => getCollection(dbState, id),
      createCollection: ({ name }) => createCollection(dbState, name),
      updateCollection: ({ id, name }) => updateCollection(dbState, id, name),
      deleteCollection: ({ id }) => deleteCollection(dbState, id),
      getDocuments: () => getAllDocuments(dbState),
      getDocument: ({ id }) => getDocument(dbState, id),
      createDocument: (params) => createDocument(dbState, params),
      updateDocument: (params) => updateDocument(dbState, params),
      deleteDocument: ({ id }) => deleteDocument(dbState, id),
      getPropertyDefinitions: ({ collectionId }) => getPropertyDefinitions(dbState, collectionId),
      createPropertyDefinition: ({ collectionId, label, type }) =>
        createPropertyDefinition(dbState, collectionId, label, type),
      updatePropertyDefinition: ({ id, label, type }) =>
        updatePropertyDefinition(dbState, id, label, type),
      deletePropertyDefinition: ({ id }) => deletePropertyDefinition(dbState, id),
      reorderPropertyDefinitions: ({ orderedIds }) => {
        reorderPropertyDefinitions(dbState, orderedIds);
        return undefined;
      },
      reorderChildDocuments: ({ orderedIds }) => {
        reorderChildDocuments(dbState, orderedIds);
      },
      getSettings: (): SettingsInfo => {
        const count = getDocumentCount(dbState);
        const s = loadSettings();
        const dbName = s.databaseName ?? basename(dbState.dbDirectory);
        const recentRaw = (s.recentDbDirectories ?? []).filter((d) => d !== dbState.dbDirectory);
        const recent = [dbState.dbDirectory, ...recentRaw].slice(0, 10);
        return {
          dbPath: dbState.dbPath,
          dbDirectory: dbState.dbDirectory,
          documentCount: count,
          databaseName: dbName,
          databaseIcon: s.databaseIcon ?? null,
          recentDatabases: recent.map((dir) => ({
            directory: dir,
            name: dir === dbState.dbDirectory && s.databaseName ? s.databaseName : basename(dir),
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
      setDatabaseLocation: ({ directory, mode }: { directory: string; mode: "new" | "move" }) => {
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
      setDatabaseMetadata: ({ name, icon }: { name?: string; icon?: string | null }) => {
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
      blueskyLogin: async ({ handle, appPassword }: { handle: string; appPassword: string }) => {
        try {
          const result = await blueskyLogin(handle, appPassword);
          dbState.upsertBlueskyAuth.run(
            result.handle,
            result.did,
            result.service,
            result.accessJwt,
            result.refreshJwt,
            null,
          );
          return { success: true, handle: result.handle, did: result.did };
        } catch (e) {
          console.error("[bluesky] login failed:", e);
          throw e;
        }
      },
      blueskyLogout: () => {
        clearSession();
        dbState.deleteBlueskyAuth.run();
        return { success: true };
      },
      blueskyGetSession: (): BlueskySession | null => {
        const auth = dbState.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
        if (!auth) return null;
        return { handle: auth.handle, did: auth.did };
      },
      publishDocument: async ({ id }: { id: number }) => {
        const auth = dbState.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
        if (!auth) throw new Error("Not logged in to Bluesky");

        const doc = getDocument(dbState, id);
        if (!doc) throw new Error("Document not found");

        const client = await resumeSession(auth, (accessJwt, refreshJwt) => {
          dbState.upsertBlueskyAuth.run(
            auth.handle,
            auth.did,
            auth.service,
            accessJwt,
            refreshJwt,
            auth.publicationUri,
          );
        });

        const publicationUri = await ensurePublication(client, auth.did, auth.publicationUri);
        if (publicationUri !== auth.publicationUri) {
          dbState.upsertBlueskyAuth.run(
            auth.handle,
            auth.did,
            auth.service,
            auth.accessJwt,
            auth.refreshJwt,
            publicationUri,
          );
        }

        const blocks = JSON.parse(doc.content) as PartialBlock[];
        const lexiconContent = createLexiconContent(blocks);
        const textContent = blocksToPlaintext(blocks);

        const result = await blueskyPublishDocument(
          client,
          auth.did,
          doc.title,
          lexiconContent,
          textContent,
          publicationUri,
          doc.publishedUri ?? null,
        );

        const hash = computeContentHash(doc.title, doc.content);
        dbState.updateDocPublish.run(result.uri, result.cid, hash, id);

        return { uri: result.uri, cid: result.cid };
      },
      unpublishDocument: async ({ id }: { id: number }) => {
        const auth = dbState.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
        if (!auth) throw new Error("Not logged in to Bluesky");

        const doc = getDocument(dbState, id);
        if (!doc) throw new Error("Document not found");
        if (!doc.publishedUri) throw new Error("Document is not published");

        const client = await resumeSession(auth, (accessJwt, refreshJwt) => {
          dbState.upsertBlueskyAuth.run(
            auth.handle,
            auth.did,
            auth.service,
            accessJwt,
            refreshJwt,
            auth.publicationUri,
          );
        });

        await blueskyUnpublishDocument(client, auth.did, doc.publishedUri);
        dbState.clearDocPublish.run(id);

        return { success: true };
      },
      openExternal: ({ url }: { url: string }): { success: boolean } => {
        const ok = Utils.openExternal(url);
        return { success: ok };
      },
      getPublishStatus: ({ id }) => getPublishStatus(dbState, id),
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
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
    }
  }
  return "views://mainview/index.html";
}

const APP_NAME = "Note Taker";
const isMac = process.platform === "darwin";

function buildApplicationMenu(): Parameters<typeof ApplicationMenu.setApplicationMenu>[0] {
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
    ...(isMac ? [] : [{ label: "Settings…", action: "open-settings", accelerator: "," }]),
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
    topLevel.push({ submenu: appSubmenu }, { label: "File", submenu: fileSubmenu });
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
    void mainWindow.webview?.rpc?.request?.("openSettings", {});
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

// Defer so native bridge has the string when it reads it (macOS)
setTimeout(() => {
  ApplicationMenu.setApplicationMenu(buildApplicationMenu());
}, 100);

console.log("Note Taker started!");
console.log(`Database: ${dbState.dbPath}`);
