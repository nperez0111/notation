import { defineHandler } from "nitro";
import { getQuery } from "h3";
import { getDb } from "../../utils/db";
import { getDocument } from "../../../db";

export default defineHandler((event) => {
  const { id } = getQuery(event);
  return getDocument(getDb(), Number(id));
});
