import { defineHandler } from "nitro";
import { getQuery } from "h3";
import { getDb } from "../../utils/db";
import { getCollection } from "../../../db";

export default defineHandler((event) => {
  const { id } = getQuery(event);
  return getCollection(getDb(), Number(id));
});
