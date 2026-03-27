# Note Taker

A native desktop note-taking app built on [ATProto](https://atproto.com) that lets you write rich documents locally and publish them to [Bluesky](https://bsky.app) using the [standard.site](https://standard.site) document lexicon.

This is a demo/prototype exploring what a local-first, decentralized note-taking experience can look like when built on top of the AT Protocol.

## How it works

Documents are stored locally in SQLite using [BlockNote](https://www.blocknotejs.org)'s block-based format. When you're ready to share, you can publish any document to your Bluesky PDS as a [`site.standard.document`](https://standard.site) record. The published record includes:

- The full document content in the `org.blocknote.document#content` lexicon format (preserving all rich formatting)
- A plaintext `textContent` representation for indexers and search
- Standard metadata (`title`, `publishedAt`, `updatedAt`)

The app tracks which documents have been published and uses a content hash to detect local edits, so you can see at a glance which documents have unpublished changes.

## Architecture

- **[Electrobun](https://electrobun.dev)** desktop shell (Bun main process + WebKit webview)
- **React** frontend with [BlockNote](https://www.blocknotejs.org) editor, [Base UI](https://baseweb.design), and [Tailwind CSS](https://tailwindcss.com)
- **SQLite** for local document storage and Bluesky session persistence
- **[atcute](https://github.com/mary-ext/atcute)** packages for all ATProto/Bluesky communication
- **Typed RPC** bridge between the Bun backend and the webview

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (latest)
- [Electrobun CLI](https://electrobun.dev) (`bun install -g electrobun`)
- macOS (Electrobun uses WebKit on Mac)

### Install and run

```sh
bun install
bun run dev
```

This starts both the Vite dev server (with HMR) and the Electrobun app in parallel.

### Other commands

```sh
bun run typecheck    # lint + type-check + format-check (oxlint, tsgo, oxfmt)
bun run fmt          # auto-format
bun run lint         # lint only
bun run build:canary # production build
```

## Bluesky publishing

1. Open **Settings** and connect your Bluesky account using an [app password](https://bsky.app/settings/app-passwords)
2. The app resolves your handle, finds your PDS, and authenticates directly against it
3. Click **Publish** in the editor header or use the context menu in the sidebar
4. Published documents show a blue dot in the sidebar and a green "Published" badge in the editor
5. After editing, the badge changes to an amber "Update" button; click it to push changes

Session tokens are stored in the local SQLite database and refreshed automatically.

## ATProto lexicons

The project defines custom BlockNote lexicons for representing rich documents on ATProto:

| Lexicon | Description |
|---------|-------------|
| `org.blocknote.schema` | Generic block, inline content, and style shapes |
| `org.blocknote.defaultBlocks` | All 14 default BlockNote block types (paragraph, heading, table, etc.) |
| `org.blocknote.document` | ATProto record wrapping BlockNote content with an optional schema declaration |

These live in `src/lexicons/` and TypeScript types are generated with `bun run generate:lexicons` (via `@atcute/lex-cli`).

When publishing, documents are serialized using `createLexiconContent()` from `src/shared/atproto/serialize.ts`, which converts BlockNote's in-memory format to the ATProto lexicon format (handling `type` vs `$type` union discrimination, content field splitting, etc.).

## Project structure

```
src/
  bun/             # Bun main process (SQLite, RPC handlers, Bluesky client)
  mainview/        # React frontend (editor, sidebar, settings)
  shared/          # Types and serialization shared between both sides
  lexicons/        # ATProto lexicon JSON schemas
  generated/       # Generated TypeScript from lexicons
```

## License

MIT
