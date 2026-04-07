import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { deleteDocument } from "../../../db";

export default defineHandler(async (event) => {
  const { id } = (await readBody(event)) as { id: number };
  return deleteDocument(getDb(), id);
});
