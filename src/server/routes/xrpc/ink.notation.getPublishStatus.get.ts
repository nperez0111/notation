import { defineHandler } from "nitro";
import { getQuery } from "h3";
import { getDb } from "../../utils/db";
import { getPublishStatus } from "../../../db";

export default defineHandler((event) => {
  const { id } = getQuery(event);
  return getPublishStatus(getDb(), Number(id));
});
