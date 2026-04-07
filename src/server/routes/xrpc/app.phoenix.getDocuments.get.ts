import { defineHandler } from "nitro";
import { getDb } from "../../utils/db";
import { getAllDocuments } from "../../../db";

export default defineHandler(() => {
  return getAllDocuments(getDb());
});
