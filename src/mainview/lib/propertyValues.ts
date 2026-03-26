import type { DocumentPropertyValues, PropertyType } from "../../shared/types";

/**
 * Parse document.properties JSON string into Record<propertyId, string>.
 */
export function parseDocumentProperties(propertiesJson: string): DocumentPropertyValues {
  if (!propertiesJson?.trim()) return {};
  try {
    const parsed = JSON.parse(propertiesJson) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: DocumentPropertyValues = {};
      for (const [k, v] of Object.entries(parsed)) {
        const id = Number(k);
        if (Number.isInteger(id) && typeof v === "string") out[id] = v;
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Serialize DocumentPropertyValues to JSON string for storage.
 */
export function serializeDocumentProperties(values: DocumentPropertyValues): string {
  return JSON.stringify(values);
}

/** Display/input value for each type (for controlled inputs). */
export type ParsedValue = string | number | boolean | undefined; // empty

/**
 * Parse a stored string value into the correct type for display/editing.
 */
export function parseValueByType(raw: string | undefined, type: PropertyType): ParsedValue {
  if (raw === undefined || raw === "") return undefined;
  switch (type) {
    case "checkbox": {
      const lower = raw.toLowerCase();
      return lower === "true" || lower === "1" || lower === "yes";
    }
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case "date":
    case "time":
    case "string":
    default:
      return raw;
  }
}

/**
 * Serialize a display/input value back to string for storage.
 */
export function serializeValueByType(value: ParsedValue, type: PropertyType): string {
  if (value === undefined || value === "") return "";
  switch (type) {
    case "checkbox":
      return value === true ? "true" : "false";
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
    case "date":
    case "time":
    case "string":
    default:
      return typeof value === "string" ? value : String(value ?? "");
  }
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  string: "Text",
  number: "Number",
  date: "Date",
  time: "Time",
  checkbox: "Checkbox",
};
