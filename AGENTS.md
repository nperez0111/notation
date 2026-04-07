# AGENTS.md — Project map for AI and developers

Use this file as a table of contents: **keywords → files**. Read the listed file first when working on that area.

---

## What this project is

**Prototype notion-like note-taking app** built on [ATProto](https://atproto.com/docs), targeting both a website and a native desktop application. The native app is built with [Electrobun](https://blackboard.sh/electrobun/llms.txt) (Bun main process + WebKit webview — not Electron). The web app uses [Nitro](https://nitro.build/llms.txt) (via Vite plugin) with XRPC-style API routes. Documents are stored locally in SQLite; ATProto integration is the foundation for syncing and identity.

- **[Electrobun](https://blackboard.sh/electrobun/llms.txt)** — desktop shell (Bun main process + webview), not Electron.
- **[Nitro](https://nitro.build/llms.txt)** — full-stack web server (Vite plugin), serves the same React frontend with XRPC API routes.
- **[ATProto](https://atproto.com/docs)** — decentralized protocol for identity and data sync.
- **[BlockNote](https://www.blocknotejs.org/llms.txt)** — block-based rich text editor.
- **Base UI** — component library for modals, pickers, etc. (with Styletron).
- **CSS variables** — theming (light/dark) in `index.css`; Base UI themes in `theme.ts`.

---

## Architecture overview

The app has **two targets** sharing the same React frontend:

1. **Desktop (Electrobun)**: `src/bun/index.ts` → Electrobun IPC → frontend
2. **Web (Nitro)**: `src/server/routes/xrpc/` → HTTP XRPC → frontend

Both targets share:

- **Database layer**: `src/db/` (SQLite schema, CRUD, Bluesky client)
- **Frontend**: `src/mainview/` (React + BlockNote + Base UI)
- **RPC abstraction**: `src/mainview/rpc/` (platform-agnostic `useRpc()` hook)
- **Shared types**: `src/shared/` (domain types + platform-agnostic RPC type map)

---

## Entry points and config

| Keyword                                   | File                    | Notes                                                                |
| ----------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| **Electrobun config**, build, views       | `electrobun.config.ts`  | App name, build copy (dist → views/mainview), watch ignore.          |
| **Main process**, Bun, window, RPC wiring | `src/bun/index.ts`      | BrowserWindow, RPC handlers (delegates to `src/db/`), settings.json. |
| **Frontend entry**, React root, providers | `src/mainview/main.tsx` | Platform detection, RpcProvider, Styletron, ThemeProvider, App.      |
| **Vite (desktop)**                        | `vite.config.ts`        | Bundling for Electrobun mainview.                                    |
| **Vite (web)**                            | `vite.config.web.ts`    | Vite + Nitro plugin for web app. `bun run dev:web` to start.         |
| **Tailwind**                              | `tailwind.config.js`    | PostCSS in `postcss.config.js`.                                      |

---

## Database layer (portable)

| Keyword                                | File                | Notes                                                                   |
| -------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| **Schema DDL**, migrations             | `src/db/schema.ts`  | `INIT_SCHEMA`, `runMigrations()`, `ensureDefaultCollection()`.          |
| **DbState**, CRUD functions            | `src/db/index.ts`   | `createDbState()`, all standalone CRUD functions, `getDescendantIds()`. |
| **Bluesky client**, ATProto publishing | `src/db/bluesky.ts` | Login, session management, publish/unpublish, content hashing.          |

All CRUD functions take `DbState` as first parameter. Both `src/bun/index.ts` (Electrobun) and `src/server/utils/db.ts` (Nitro) create their own `DbState` instances.

---

## RPC layer

| Keyword                                                        | File                                 | Notes                                                                  |
| -------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| **Domain types**: Document, Collection, Property, SettingsInfo | `src/shared/types.ts`                | Single source of truth for domain types. `DocumentRPC` for Electrobun. |
| **Platform-agnostic RPC type map**                             | `src/shared/rpc-types.ts`            | `RpcMethods` type — no Electrobun deps. Both platforms implement this. |
| **RPC context**, useRpc, RpcProvider                           | `src/mainview/rpc/context.tsx`       | React context accepting any `RpcMethods` implementation.               |
| **Electrobun RPC** implementation                              | `src/mainview/rpc/electrobun-rpc.ts` | Wraps `Electroview.defineRPC`, returns `RpcMethods`.                   |
| **Web RPC** implementation                                     | `src/mainview/rpc/web-rpc.ts`        | Fetch-based XRPC client (`/xrpc/app.phoenix.*`).                       |
| **Platform detection**                                         | `src/mainview/rpc/platform.ts`       | `isElectrobun` boolean.                                                |
| **RPC handlers** (Electrobun side)                             | `src/bun/index.ts`                   | `BrowserView.defineRPC<DocumentRPC>` delegates to `src/db/`.           |

### XRPC routes (web backend)

All web API routes live in `src/server/routes/xrpc/` using XRPC convention:

- **Queries** (GET): `app.phoenix.<method>.get.ts` — read-only, params in query string
- **Procedures** (POST): `app.phoenix.<method>.post.ts` — mutations, params in JSON body

| RPC Method                   | XRPC NSID                                | Type      |
| ---------------------------- | ---------------------------------------- | --------- |
| `getCollections`             | `app.phoenix.getCollections`             | query     |
| `getCollection`              | `app.phoenix.getCollection`              | query     |
| `createCollection`           | `app.phoenix.createCollection`           | procedure |
| `updateCollection`           | `app.phoenix.updateCollection`           | procedure |
| `deleteCollection`           | `app.phoenix.deleteCollection`           | procedure |
| `getDocuments`               | `app.phoenix.getDocuments`               | query     |
| `getDocument`                | `app.phoenix.getDocument`                | query     |
| `createDocument`             | `app.phoenix.createDocument`             | procedure |
| `updateDocument`             | `app.phoenix.updateDocument`             | procedure |
| `deleteDocument`             | `app.phoenix.deleteDocument`             | procedure |
| `getPropertyDefinitions`     | `app.phoenix.getPropertyDefinitions`     | query     |
| `createPropertyDefinition`   | `app.phoenix.createPropertyDefinition`   | procedure |
| `updatePropertyDefinition`   | `app.phoenix.updatePropertyDefinition`   | procedure |
| `deletePropertyDefinition`   | `app.phoenix.deletePropertyDefinition`   | procedure |
| `reorderPropertyDefinitions` | `app.phoenix.reorderPropertyDefinitions` | procedure |
| `reorderChildDocuments`      | `app.phoenix.reorderChildDocuments`      | procedure |
| `getSettings`                | `app.phoenix.getSettings`                | query     |
| `setSidebarWidth`            | `app.phoenix.setSidebarWidth`            | procedure |
| `setDatabaseMetadata`        | `app.phoenix.setDatabaseMetadata`        | procedure |
| `blueskyLogin`               | `app.phoenix.blueskyLogin`               | procedure |
| `blueskyLogout`              | `app.phoenix.blueskyLogout`              | procedure |
| `blueskyGetSession`          | `app.phoenix.blueskyGetSession`          | query     |
| `publishDocument`            | `app.phoenix.publishDocument`            | procedure |
| `unpublishDocument`          | `app.phoenix.unpublishDocument`          | procedure |
| `getPublishStatus`           | `app.phoenix.getPublishStatus`           | query     |

Desktop-only methods (`chooseDatabaseDirectory`, `setDatabaseLocation`, `reloadDatabase`) have no XRPC endpoints. `openExternal` uses `window.open()` on web.

---

## App shell and data flow

| Keyword                                            | File                                 | Notes                                                                                    |
| -------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| **App component**, state, document/collection CRUD | `src/mainview/App.tsx`               | Collections, documents, selected doc, settings; wires sidebar + editor + settings modal. |
| **Parse document content** (BlockNote JSON)        | `src/mainview/lib/parseContent.ts`   | Content string → blocks for editor.                                                      |
| **Parse/serialize property values**                | `src/mainview/lib/propertyValues.ts` | Document properties JSON ↔ `DocumentPropertyValues`.                                     |

---

## Sidebar and documents

| Keyword                                   | File                                                         | Notes                                              |
| ----------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| **Document sidebar** (list + collections) | `src/mainview/components/documents/DocumentSidebar.tsx`      | Main sidebar layout.                               |
| **Document list**, tree                   | `src/mainview/components/documents/documentTree.ts`          | Tree structure for sidebar (collections, nesting). |
| **Document list UI**                      | `src/mainview/components/documents/DocumentList.tsx`         | Renders list of documents.                         |
| **Single document row**                   | `src/mainview/components/documents/DocumentListItem.tsx`     | Item with icon, title, actions.                    |
| **Collection section**                    | `src/mainview/components/documents/CollectionSection.tsx`    | Collection header + documents.                     |
| **Sidebar header**                        | `src/mainview/components/documents/SidebarHeader.tsx`        | Top of sidebar (e.g. database name).               |
| **Document icon** (fixed icons + emoji)   | `src/mainview/components/documents/DocumentIconView.tsx`     | Renders icon/emoji.                                |
| **Icon picker**                           | `src/mainview/components/documents/DocumentIconPicker.tsx`   | Picker UI for document icon.                       |
| **Emoji picker panel**                    | `src/mainview/components/documents/EmojiMartPickerPanel.tsx` | Emoji-mart integration.                            |

---

## Editor (BlockNote + properties)

| Keyword                              | File                                                | Notes                                                                  |
| ------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------- |
| **Document editor**, BlockNote, save | `src/mainview/components/editor/DocumentEditor.tsx` | useCreateBlockNote, BlockNoteView, debounced save, title + properties. |
| **Title bar** (doc title input)      | `src/mainview/components/editor/TitleBar.tsx`       | Inline title editing.                                                  |
| **Properties bar** (custom props)    | `src/mainview/components/editor/PropertiesBar.tsx`  | Renders property definitions and values (string, number, date, etc.).  |

---

## Settings and theme

| Keyword                                      | File                                                 | Notes                                                               |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| **Settings modal** (theme, database, reload) | `src/mainview/components/settings/SettingsModal.tsx` | Theme toggle, database location, metadata, reload.                  |
| **Theme context** (light/dark)               | `src/mainview/themeContext.tsx`                      | useTheme, ThemeProvider, persisted theme.                           |
| **Base UI themes** (light/dark)              | `src/mainview/theme.ts`                              | createLightTheme / createDarkTheme for Base UI.                     |
| **CSS variables**, global styles             | `src/mainview/index.css`                             | `:root` / `[data-theme="dark"]` / `[data-theme="light"]`, Tailwind. |

---

## UI primitives

| Keyword              | File                                    | Notes                              |
| -------------------- | --------------------------------------- | ---------------------------------- |
| **Button** (Base UI) | `src/mainview/components/ui/Button.tsx` | Reusable button.                   |
| **useClickOutside**  | `src/mainview/hooks/useClickOutside.ts` | Hook for closing dropdowns/modals. |

---

## Persistence

| Keyword                                | File                     | Notes                                                                  |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| **SQLite schema + migrations**         | `src/db/schema.ts`       | `INIT_SCHEMA`, column migrations, default collection.                  |
| **Database CRUD**                      | `src/db/index.ts`        | `createDbState()`, all CRUD functions as standalone exports.           |
| **Bluesky/ATProto client**             | `src/db/bluesky.ts`      | Auth, session, publish/unpublish. Portable (no Bun-specific crypto).   |
| **Electrobun settings** (desktop only) | `src/bun/index.ts`       | `settings.json` in `Utils.paths.userData`.                             |
| **Nitro DB singleton** (web only)      | `src/server/utils/db.ts` | `getDb()` — lazy init, path from `PHOENIX_DB_DIR` env var or `.data/`. |

---

## Validation

After making changes, run the typecheck script to catch type errors and lint issues:

```sh
bun run typecheck
```

This runs `oxlint --type-aware && tsgo --noEmit && oxfmt --check .` — linting, type-checking, and format-checking in one command.

---

## ATProto Lexicons (BlockNote document format)

| Keyword                               | File                                            | Notes                                                                                            |
| ------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Generic block/inline/style shapes** | `src/lexicons/org/blocknote/schema.json`        | Block, StyledText, Link, TableContent, Styles — no specific implementations.                     |
| **Default block types**               | `src/lexicons/org/blocknote/defaultBlocks.json` | All 14 default blocks (paragraph, heading, etc.), text/link inline content, 7 style tokens.      |
| **Document record**                   | `src/lexicons/org/blocknote/document.json`      | ATProto record: content (blocks), optional schema declaration for validation.                    |
| **Generated TypeScript**              | `src/generated/lexicons/`                       | Output from `lex-cli generate`. Types + validation schemas.                                      |
| **Serialization adapter**             | `src/shared/atproto/serialize.ts`               | `blocknoteToLexicon()` / `lexiconToBlocknote()` — converts between BlockNote and lexicon format. |
| **lex-cli config**                    | `lex.config.js`                                 | Points to `src/lexicons/**/*.json`, outputs to `src/generated/lexicons/`.                        |

---

## Quick lookup by topic

- **Add a new RPC method** → 1. Add to `src/shared/rpc-types.ts` (`RpcMethods`). 2. Add to `src/shared/types.ts` (`DocumentRPC`). 3. Implement in `src/db/index.ts`. 4. Wire in `src/bun/index.ts` (Electrobun). 5. Create route in `src/server/routes/xrpc/` (web). 6. Add to `src/mainview/rpc/electrobun-rpc.ts` and `web-rpc.ts`.
- **Change document/collection shape** → `src/shared/types.ts`, `src/db/schema.ts` (DDL + migrations), `src/db/index.ts` (statements).
- **Change editor behavior or blocks** → `src/mainview/components/editor/DocumentEditor.tsx` and BlockNote APIs.
- **Change global colors or theme** → `src/mainview/index.css` (CSS vars), `src/mainview/theme.ts` (Base UI), `src/mainview/themeContext.tsx` (theme state).
- **Change sidebar structure or drag-drop** → `src/mainview/components/documents/` (DocumentSidebar, documentTree, DocumentList, etc.).
- **Add/modify lexicons** → Edit JSON in `src/lexicons/org/blocknote/`, run `bun run generate:lexicons`.
- **BlockNote ↔ ATProto serialization** → `src/shared/atproto/serialize.ts`.
- **Run web dev server** → `bun run dev:web` (Vite + Nitro on port 3001).
- **Run desktop dev** → `bun run dev` (Vite HMR on 5173 + Electrobun).
