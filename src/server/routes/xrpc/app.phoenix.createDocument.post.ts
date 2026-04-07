import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { createDocument } from "../../../db";

export default defineHandler(async (event) => {
  const params = (await readBody(event)) as Parameters<typeof createDocument>[1];
  return createDocument(getDb(), params);
});
