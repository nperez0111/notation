import { defineHandler } from "nitro";
import { getDb } from "../../utils/db";
import { clearSession } from "../../../db/bluesky";

export default defineHandler(() => {
  clearSession();
  getDb().deleteBlueskyAuth.run();
  return { success: true };
});
