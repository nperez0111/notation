import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { updateCollection } from "../../../db";

export default defineHandler(async (event) => {
  const { id, name } = (await readBody(event)) as { id: number; name: string };
  return updateCollection(getDb(), id, name);
});
