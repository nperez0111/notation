import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { createCollection } from "../../../db";

export default defineHandler(async (event) => {
  const { name } = (await readBody(event)) as { name: string };
  return createCollection(getDb(), name);
});
