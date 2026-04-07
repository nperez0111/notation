import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { reorderChildDocuments } from "../../../db";

export default defineHandler(async (event) => {
  const { orderedIds } = (await readBody(event)) as { orderedIds: number[] };
  reorderChildDocuments(getDb(), orderedIds);
  return { success: true };
});
