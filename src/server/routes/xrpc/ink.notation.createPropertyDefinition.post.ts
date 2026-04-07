import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { createPropertyDefinition } from "../../../db";
import type { PropertyType } from "../../../shared/types";

export default defineHandler(async (event) => {
  const { collectionId, label, type } = (await readBody(event)) as {
    collectionId: number;
    label: string;
    type: PropertyType;
  };
  return createPropertyDefinition(getDb(), collectionId, label, type);
});
