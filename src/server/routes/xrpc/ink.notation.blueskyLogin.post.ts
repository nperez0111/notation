import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { login as blueskyLogin } from "../../../db/bluesky";

export default defineHandler(async (event) => {
  const { handle, appPassword } = (await readBody(event)) as {
    handle: string;
    appPassword: string;
  };
  const db = getDb();
  const result = await blueskyLogin(handle, appPassword);
  db.upsertBlueskyAuth.run(
    result.handle,
    result.did,
    result.service,
    result.accessJwt,
    result.refreshJwt,
    null,
  );
  return { success: true, handle: result.handle, did: result.did };
});
