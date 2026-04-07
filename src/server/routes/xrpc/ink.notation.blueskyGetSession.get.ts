import { defineHandler } from "nitro";
import { getDb } from "../../utils/db";
import type { BlueskyAuthRow } from "../../../db/bluesky";

export default defineHandler(() => {
  const db = getDb();
  const auth = db.getBlueskyAuth.get() as BlueskyAuthRow | undefined;
  if (!auth) return null;
  return { handle: auth.handle, did: auth.did };
});
