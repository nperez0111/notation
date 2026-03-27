/**
 * ATProto/Bluesky client module for publishing documents.
 *
 * Handles authentication via app passwords, session management with auto-refresh,
 * and publishing/unpublishing documents as site.standard.document records.
 */

import { Client, CredentialManager, simpleFetchHandler } from "@atcute/client";
import { getPdsEndpoint } from "@atcute/identity";
import type { DidDocument } from "@atcute/identity";
import type { Did, Handle } from "@atcute/lexicons/syntax";
import "@atcute/atproto";
import "@atcute/standard-site";
import type { Content as LexiconContent } from "../generated/lexicons/types/org/blocknote/document";

// Re-export for convenience
export type { LexiconContent };

const PUBLIC_API = "https://public.api.bsky.app";
const PLC_DIRECTORY = "https://plc.directory";

export type BlueskyAuthRow = {
  handle: string;
  did: string;
  service: string;
  accessJwt: string;
  refreshJwt: string;
  publicationUri: string | null;
};

export type LoginResult = {
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
  service: string;
};

/** Cached credential manager + client for the current session. */
let cachedManager: CredentialManager | null = null;
let cachedClient: Client | null = null;

/**
 * Resolve a handle to a DID using the public API.
 */
async function resolveHandle(handle: string): Promise<string> {
  const client = new Client({ handler: simpleFetchHandler({ service: PUBLIC_API }) });
  console.log(`[bluesky] resolving handle: ${handle}`);
  const response = await client.get("com.atproto.identity.resolveHandle", {
    params: { handle: handle as Handle },
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve handle "${handle}": ${response.data?.message ?? "unknown"}`);
  }
  console.log(`[bluesky] resolved handle ${handle} -> ${response.data.did}`);
  return response.data.did;
}

/**
 * Resolve a DID to its DID document and extract the PDS endpoint.
 */
async function resolvePds(did: string): Promise<string> {
  let didDoc: DidDocument;
  if (did.startsWith("did:plc:")) {
    console.log(`[bluesky] resolving DID document from plc.directory: ${did}`);
    const res = await fetch(`${PLC_DIRECTORY}/${did}`);
    if (!res.ok) throw new Error(`Failed to resolve DID ${did}: ${res.status}`);
    didDoc = (await res.json()) as DidDocument;
  } else if (did.startsWith("did:web:")) {
    const domain = did.slice("did:web:".length);
    console.log(`[bluesky] resolving DID document from web: ${domain}`);
    const res = await fetch(`https://${domain}/.well-known/did.json`);
    if (!res.ok) throw new Error(`Failed to resolve DID ${did}: ${res.status}`);
    didDoc = (await res.json()) as DidDocument;
  } else {
    throw new Error(`Unsupported DID method: ${did}`);
  }

  const pds = getPdsEndpoint(didDoc);
  if (!pds) throw new Error(`No PDS endpoint found in DID document for ${did}`);
  console.log(`[bluesky] PDS endpoint for ${did}: ${pds}`);
  return pds;
}

/**
 * Login to Bluesky with handle + app password.
 * Resolves the handle -> DID -> PDS, then authenticates against the PDS.
 */
export async function login(handle: string, appPassword: string): Promise<LoginResult> {
  // Step 1: Resolve handle to DID
  const did = await resolveHandle(handle);

  // Step 2: Resolve DID to PDS endpoint
  const pdsUri = await resolvePds(did);

  // Step 3: Authenticate against the actual PDS
  console.log(`[bluesky] logging in to PDS: ${pdsUri}`);
  const manager = new CredentialManager({ service: pdsUri });
  const session = await manager.login({
    identifier: did,
    password: appPassword,
  });

  cachedManager = manager;
  cachedClient = new Client({ handler: manager });

  console.log(`[bluesky] login successful: ${session.handle} (${session.did})`);
  return {
    did: session.did,
    handle: session.handle,
    accessJwt: session.accessJwt,
    refreshJwt: session.refreshJwt,
    service: session.pdsUri ?? pdsUri,
  };
}

/**
 * Resume a session from stored credentials.
 * Called on app startup if auth row exists.
 */
export async function resumeSession(
  auth: BlueskyAuthRow,
  onTokenUpdate?: (accessJwt: string, refreshJwt: string) => void,
): Promise<Client> {
  if (cachedClient && cachedManager) {
    return cachedClient;
  }

  const manager = new CredentialManager({
    service: auth.service,
    onRefresh: (session) => {
      onTokenUpdate?.(session.accessJwt, session.refreshJwt);
    },
  });

  await manager.resume({
    accessJwt: auth.accessJwt,
    refreshJwt: auth.refreshJwt,
    handle: auth.handle,
    did: auth.did as Did,
    active: true,
  });

  cachedManager = manager;
  cachedClient = new Client({ handler: manager });
  return cachedClient;
}

/** Clear the cached session. */
export function clearSession(): void {
  if (cachedManager) {
    void cachedManager.logout().catch(() => {});
  }
  cachedManager = null;
  cachedClient = null;
}

/**
 * Ensure a site.standard.publication record exists.
 * Creates one if no publicationUri is provided.
 * Returns the AT-URI of the publication.
 */
export async function ensurePublication(
  client: Client,
  did: string,
  existingUri: string | null,
): Promise<string> {
  if (existingUri) return existingUri;

  const response = await client.post("com.atproto.repo.createRecord", {
    input: {
      repo: did as Did,
      collection: "site.standard.publication",
      record: {
        $type: "site.standard.publication",
        name: "Notes",
        url: `https://bsky.app/profile/${did}`,
      },
    },
    as: "json",
  });
  if (!response.ok) {
    throw new Error(`Failed to create publication: ${response.data?.message ?? "unknown error"}`);
  }
  return response.data.uri;
}

/**
 * Extract plaintext from BlockNote JSON blocks.
 * Recursively walks the block tree and concatenates text from inline content.
 */
export function blocksToPlaintext(blocks: unknown[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const b = block as Record<string, unknown>;
    // Extract text from inline content array
    if (Array.isArray(b.content)) {
      const contentItem = b.content as unknown[];
      // Check if it's inline content (array of {type, text} objects) or table content
      if (
        contentItem.length > 0 &&
        typeof (contentItem[0] as Record<string, unknown>).text === "string"
      ) {
        // Inline content: array of styled text / link objects
        const text = contentItem
          .map((item) => {
            const ic = item as Record<string, unknown>;
            if (ic.type === "link" && Array.isArray(ic.content)) {
              return (ic.content as { text?: string }[]).map((c) => c.text ?? "").join("");
            }
            return (ic.text as string) ?? "";
          })
          .join("");
        if (text) lines.push(text);
      } else if (
        contentItem.length > 0 &&
        (contentItem[0] as Record<string, unknown>).type === "tableContent"
      ) {
        // Table content - extract cell text
        const tc = contentItem[0] as Record<string, unknown>;
        if (Array.isArray(tc.rows)) {
          for (const row of tc.rows as { cells: { content: { text?: string }[] }[] }[]) {
            const cellTexts = row.cells
              .map((cell) => cell.content.map((c) => c.text ?? "").join(""))
              .filter(Boolean);
            if (cellTexts.length > 0) lines.push(cellTexts.join("\t"));
          }
        }
      }
    }
    // Recurse into children
    if (Array.isArray(b.children) && b.children.length > 0) {
      const childText = blocksToPlaintext(b.children as unknown[]);
      if (childText) lines.push(childText);
    }
  }

  return lines.join("\n");
}

/**
 * Extract the rkey (record key) from an AT-URI.
 * Format: at://did:plc:xxx/collection/rkey
 */
function extractRkey(atUri: string): string {
  const parts = atUri.split("/");
  return parts[parts.length - 1];
}

/**
 * Publish or update a document on Bluesky as a site.standard.document record.
 */
export async function publishDocument(
  client: Client,
  did: string,
  title: string,
  content: LexiconContent,
  textContent: string,
  publicationUri: string,
  existingUri: string | null,
): Promise<{ uri: string; cid: string }> {
  const now = new Date().toISOString();
  const record = {
    $type: "site.standard.document" as const,
    title,
    site: publicationUri,
    content,
    ...(textContent && { textContent }),
    publishedAt: now,
    updatedAt: now,
  };

  if (existingUri) {
    const rkey = extractRkey(existingUri);
    const response = await client.post("com.atproto.repo.putRecord", {
      input: {
        repo: did as Did,
        collection: "site.standard.document",
        rkey,
        record,
      },
      as: "json",
    });
    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.data?.message ?? "unknown error"}`);
    }
    return { uri: response.data.uri, cid: response.data.cid };
  }

  const response = await client.post("com.atproto.repo.createRecord", {
    input: {
      repo: did as Did,
      collection: "site.standard.document",
      record,
    },
    as: "json",
  });
  if (!response.ok) {
    throw new Error(`Failed to publish document: ${response.data?.message ?? "unknown error"}`);
  }
  return { uri: response.data.uri, cid: response.data.cid };
}

/**
 * Delete a published document from Bluesky.
 */
export async function unpublishDocument(client: Client, did: string, uri: string): Promise<void> {
  const rkey = extractRkey(uri);
  const response = await client.post("com.atproto.repo.deleteRecord", {
    input: {
      repo: did as Did,
      collection: "site.standard.document",
      rkey,
    },
    as: "json",
  });
  if (!response.ok) {
    throw new Error(`Failed to unpublish document: ${response.data?.message ?? "unknown error"}`);
  }
}

/**
 * Compute a SHA-256 content hash for change detection.
 */
export function computeContentHash(title: string, content: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(title);
  hasher.update(content);
  return hasher.digest("hex");
}
