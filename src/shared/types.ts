import type { RPCSchema } from "electrobun/bun";

/**
 * Metadata for a stored document (createdAt, updatedAt, createdBy, updatedBy).
 */
export type DocumentMetadata = {
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
};

/** Supported property types. Values stored as strings and parsed by type. */
export type PropertyType =
	| "string"
	| "number"
	| "date"
	| "time"
	| "checkbox";

/** A property definition shared across all documents (label + type). */
export type Property = {
	id: number;
	label: string;
	type: PropertyType;
};

/** Document property values: map of property id → string value (parsed by property type). */
export type DocumentPropertyValues = Record<number, string>;

/**
 * A document stored in the database: id, title, metadata, content, and property values.
 * - content: BlockNote JSON (stringified Block[]).
 * - properties: JSON string of DocumentPropertyValues (Record<propertyId, string>).
 */
export type Document = {
	id: number;
	title: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	content: string;
	properties: string; // JSON: Record<Property['id'], string>
};

/**
 * RPC schema for document CRUD between the mainview and the Bun process.
 */
export type DocumentRPC = {
	bun: RPCSchema<{
		requests: {
			getDocuments: { params: {}; response: Document[] };
			getDocument: { params: { id: number }; response: Document | null };
			createDocument: {
				params: {
					title: string;
					content: string;
					createdBy: string;
					updatedBy: string;
					properties?: string;
				};
				response: Document;
			};
			updateDocument: {
				params: {
					id: number;
					title?: string;
					content?: string;
					updatedBy: string;
					properties?: string;
				};
				response: Document | null;
			};
			deleteDocument: { params: { id: number }; response: { success: boolean } };
			getPropertyDefinitions: { params: {}; response: Property[] };
			createPropertyDefinition: {
				params: { label: string; type: PropertyType };
				response: Property;
			};
			updatePropertyDefinition: {
				params: { id: number; label?: string; type?: PropertyType };
				response: Property | null;
			};
			deletePropertyDefinition: {
				params: { id: number };
				response: { success: boolean };
			};
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};
