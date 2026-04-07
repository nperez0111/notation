import { defineHandler } from "nitro";
import { readBody } from "h3";
import { getDb } from "../../utils/db";
import { updatePropertyDefinition } from "../../../db";
import type { PropertyType } from "../../../shared/types";

export default defineHandler(async (event) => {
  const { id, label, type } = (await readBody(event)) as {
    id: number;
    label?: string;
    type?: PropertyType;
  };
  return updatePropertyDefinition(getDb(), id, label, type);
});
