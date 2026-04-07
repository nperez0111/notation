import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { updateDocument } from "../../../db";

export default defineHandler(async (event) => {
  const params = (await readBody(event)) as Parameters<typeof updateDocument>[1];
  return updateDocument(getDb(), params);
});
