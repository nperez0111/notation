import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { reorderPropertyDefinitions } from "../../../db";

export default defineHandler(async (event) => {
  const { orderedIds } = (await readBody(event)) as { orderedIds: number[] };
  reorderPropertyDefinitions(getDb(), orderedIds);
  return { success: true };
});
