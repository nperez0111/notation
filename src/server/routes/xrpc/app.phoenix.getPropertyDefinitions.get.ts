import { defineHandler } from "nitro";
import { getQuery } from "h3";
import { getDb } from "../../utils/db";
import { getPropertyDefinitions } from "../../../db";

export default defineHandler((event) => {
  const { collectionId } = getQuery(event);
  return getPropertyDefinitions(getDb(), Number(collectionId));
});
