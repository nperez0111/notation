import { defineHandler } from "nitro";
import { getDb } from "../../utils/db";
import { getAllCollections } from "../../../db";

export default defineHandler(() => {
  return getAllCollections(getDb());
});
