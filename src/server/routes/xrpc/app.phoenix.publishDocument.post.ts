import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { getDocument } from "../../../db";
import {
  type BlueskyAuthRow,
  blocksToPlaintext,
  computeContentHash,
  publishDocument as blueskyPublishDocument,
  ensurePublication,
  resumeSession,
} from "../../../db/bluesky";
import { createLexiconContent } from "../../../shared/atproto/serialize";
import type { PartialBlock } from "@blocknote/core";

export default defineHandler(async (event) => {
  const { id } = (await readBody(event)) as { id: number };
  const db = getDb();

  const auth = db.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
  if (!auth) throw new Error("Not logged in to Bluesky");

  const doc = getDocument(db, id);
  if (!doc) throw new Error("Document not found");

  const client = await resumeSession(auth, (accessJwt, refreshJwt) => {
    db.upsertBlueskyAuth.run(
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
    db.upsertBlueskyAuth.run(
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
  db.updateDocPublish.run(result.uri, result.cid, hash, id);

  return { uri: result.uri, cid: result.cid };
});
