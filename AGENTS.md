# AGENTS.md — Project map for AI and developers

Use this file as a table of contents: **keywords → files**. Read the listed file first when working on that area.

---

## What this project is

**Prototype notion-like note-taking app** built on [ATProto](https://atproto.com/docs), targeting both a website and a native desktop application. The native app is built with [Electrobun](https://blackboard.sh/electrobun/llms.txt) (Bun main process + WebKit webview — not Electron). Documents are stored locally in SQLite; ATProto integration is the foundation for syncing and identity.

- **[Electrobun](https://blackboard.sh/electrobun/llms.txt)** — desktop shell (Bun main process + webview), not Electron.
- **[ATProto](https://atproto.com/docs)** — decentralized protocol for identity and data sync.
- **[BlockNote](https://www.blocknotejs.org/llms.txt)** — block-based rich text editor.
- **Base UI** — component library for modals, pickers, etc. (with Styletron).
- **CSS variables** — theming (light/dark) in `index.css`; Base UI themes in `theme.ts`.

---

## Entry points and config

| Keyword | File | Notes |
|--------|------|------|
| **Electrobun config**, build, views | `electrobun.config.ts` | App name, build copy (dist → views/mainview), watch ignore. |
| **Main process**, Bun, window, DB bootstrap | `src/bun/index.ts` | BrowserWindow, RPC handlers, SQLite, settings.json, `views://mainview/index.html`. |
| **Frontend entry**, React root, providers | `src/mainview/main.tsx` | Styletron, ThemeProvider, RpcProvider, App. |
| **Vite** | `vite.config.ts` | Bundling for mainview. |
| **Tailwind** | `tailwind.config.js` | PostCSS in `postcss.config.js`. |

---

## Shared types and RPC

| Keyword | File | Notes |
|--------|------|------|
| **Types**: Document, Collection, Property, SettingsInfo, DocumentRPC | `src/shared/types.ts` | Single source of truth for domain and RPC schema. |
| **RPC client**, useRpc, RpcProvider | `src/mainview/electroview.tsx` | Electroview.defineRPC, context for `rpc.request`. |
| **RPC handlers** (Bun side) | `src/bun/index.ts` | `BrowserView.defineRPC<DocumentRPC>` with all request handlers. |

### RPC methods (`DocumentRPC`) — defined in `src/shared/types.ts`, implemented in `src/bun/index.ts`

**Bun → webview** (main process calls these on the frontend):

| Method | Params | Response |
|--------|--------|----------|
| `openSettings` | — | `void` — triggered from app menu Preferences item |

**Webview → Bun** (frontend calls these on the backend):

| Method | Params | Response |
|--------|--------|----------|
| `getCollections` | — | `Collection[]` |
| `getCollection` | `id` | `Collection \| null` |
| `createCollection` | `name` | `Collection` |
| `updateCollection` | `id, name` | `Collection \| null` |
| `deleteCollection` | `id` | `{ success }` |
| `getDocuments` | — | `Document[]` |
| `getDocument` | `id` | `Document \| null` |
| `createDocument` | `title, content, createdBy, updatedBy, collectionId, parentId?, icon?, properties?` | `Document` |
| `updateDocument` | `id, updatedBy, title?, content?, collectionId?, parentId?, icon?, properties?` | `Document \| null` |
| `deleteDocument` | `id` | `{ success }` |
| `getPropertyDefinitions` | `collectionId` | `Property[]` |
| `createPropertyDefinition` | `collectionId, label, type` | `Property` |
| `updatePropertyDefinition` | `id, label?, type?` | `Property \| null` |
| `deletePropertyDefinition` | `id` | `{ success }` |
| `reorderPropertyDefinitions` | `orderedIds` | `void` |
| `reorderChildDocuments` | `collectionId, parentId, orderedIds` | `void` |
| `getSettings` | — | `SettingsInfo` |
| `chooseDatabaseDirectory` | — | `string \| null` — opens OS file picker |
| `setDatabaseLocation` | `directory, mode: "new"\|"move"` | `{ success }` |
| `setDatabaseMetadata` | `name?, icon?` | `{ success }` |
| `setSidebarWidth` | `width` | `{ success }` |
| `reloadDatabase` | — | `{ success }` |

---

## App shell and data flow

| Keyword | File | Notes |
|--------|------|------|
| **App component**, state, document/collection CRUD | `src/mainview/App.tsx` | Collections, documents, selected doc, settings; wires sidebar + editor + settings modal. |
| **Parse document content** (BlockNote JSON) | `src/mainview/lib/parseContent.ts` | Content string → blocks for editor. |
| **Parse/serialize property values** | `src/mainview/lib/propertyValues.ts` | Document properties JSON ↔ `DocumentPropertyValues`. |

---

## Sidebar and documents

| Keyword | File | Notes |
|--------|------|------|
| **Document sidebar** (list + collections) | `src/mainview/components/documents/DocumentSidebar.tsx` | Main sidebar layout. |
| **Document list**, tree | `src/mainview/components/documents/documentTree.ts` | Tree structure for sidebar (collections, nesting). |
| **Document list UI** | `src/mainview/components/documents/DocumentList.tsx` | Renders list of documents. |
| **Single document row** | `src/mainview/components/documents/DocumentListItem.tsx` | Item with icon, title, actions. |
| **Collection section** | `src/mainview/components/documents/CollectionSection.tsx` | Collection header + documents. |
| **Sidebar header** | `src/mainview/components/documents/SidebarHeader.tsx` | Top of sidebar (e.g. database name). |
| **Document icon** (fixed icons + emoji) | `src/mainview/components/documents/DocumentIconView.tsx` | Renders icon/emoji. |
| **Icon picker** | `src/mainview/components/documents/DocumentIconPicker.tsx` | Picker UI for document icon. |
| **Emoji picker panel** | `src/mainview/components/documents/EmojiMartPickerPanel.tsx` | Emoji-mart integration. |

---

## Editor (BlockNote + properties)

| Keyword | File | Notes |
|--------|------|------|
| **Document editor**, BlockNote, save | `src/mainview/components/editor/DocumentEditor.tsx` | useCreateBlockNote, BlockNoteView, debounced save, title + properties. |
| **Title bar** (doc title input) | `src/mainview/components/editor/TitleBar.tsx` | Inline title editing. |
| **Properties bar** (custom props) | `src/mainview/components/editor/PropertiesBar.tsx` | Renders property definitions and values (string, number, date, etc.). |

---

## Settings and theme

| Keyword | File | Notes |
|--------|------|------|
| **Settings modal** (theme, database, reload) | `src/mainview/components/settings/SettingsModal.tsx` | Theme toggle, database location, metadata, reload. |
| **Theme context** (light/dark) | `src/mainview/themeContext.tsx` | useTheme, ThemeProvider, persisted theme. |
| **Base UI themes** (light/dark) | `src/mainview/theme.ts` | createLightTheme / createDarkTheme for Base UI. |
| **CSS variables**, global styles | `src/mainview/index.css` | `:root` / `[data-theme="dark"]` / `[data-theme="light"]`, Tailwind. |

---

## UI primitives

| Keyword | File | Notes |
|--------|------|------|
| **Button** (Base UI) | `src/mainview/components/ui/Button.tsx` | Reusable button. |
| **useClickOutside** | `src/mainview/hooks/useClickOutside.ts` | Hook for closing dropdowns/modals. |

---

## Persistence (Bun / backend)

| Keyword | File | Notes |
|--------|------|------|
| **SQLite**, schema, CRUD, settings file | `src/bun/index.ts` | `documents.db`, collections/documents/property_definitions, `settings.json` in userData. |
| **Database path**, userData | `src/bun/index.ts` | `Utils.paths.userData`, `setDatabaseLocation`, `reloadDatabase`. |

---

## Quick lookup by topic

- **Add a new RPC method** → Define in `src/shared/types.ts` (`DocumentRPC`), implement in `src/bun/index.ts`, call via `useRpc()` in `src/mainview/electroview.tsx`.
- **Change document/collection shape** → `src/shared/types.ts` and `src/bun/index.ts` (schema + statements).
- **Change editor behavior or blocks** → `src/mainview/components/editor/DocumentEditor.tsx` and BlockNote APIs.
- **Change global colors or theme** → `src/mainview/index.css` (CSS vars), `src/mainview/theme.ts` (Base UI), `src/mainview/themeContext.tsx` (theme state).
- **Change sidebar structure or drag-drop** → `src/mainview/components/documents/` (DocumentSidebar, documentTree, DocumentList, etc.).
