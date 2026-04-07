import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { deletePropertyDefinition } from "../../../db";

export default defineHandler(async (event) => {
  const { id } = (await readBody(event)) as { id: number };
  return deletePropertyDefinition(getDb(), id);
});
