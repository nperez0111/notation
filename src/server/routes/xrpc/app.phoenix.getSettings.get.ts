import { defineHandler } from "nitro";
import { getDb } from "../../utils/db";
import { getDocumentCount } from "../../../db";

export default defineHandler(() => {
  const db = getDb();
  const count = getDocumentCount(db);
  return {
    dbPath: db.dbPath,
    dbDirectory: db.dbDirectory,
    documentCount: count,
  };
});
