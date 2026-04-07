import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { getDocument } from "../../../db";
import {
  type BlueskyAuthRow,
  unpublishDocument as blueskyUnpublishDocument,
  resumeSession,
} from "../../../db/bluesky";

export default defineHandler(async (event) => {
  const { id } = (await readBody(event)) as { id: number };
  const db = getDb();

  const auth = db.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
  if (!auth) throw new Error("Not logged in to Bluesky");

  const doc = getDocument(db, id);
  if (!doc) throw new Error("Document not found");
  if (!doc.publishedUri) throw new Error("Document is not published");

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

  await blueskyUnpublishDocument(client, auth.did, doc.publishedUri);
  db.clearDocPublish.run(id);

  return { success: true };
});
