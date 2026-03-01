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

/**
 * A document stored in the database: id, title, metadata, content, and optional properties.
 * - content: BlockNote JSON (stringified Block[]).
 * - properties: opaque JSON string (grab bag); store any JSON-serializable object.
 */
export type Document = {
	id: number;
	title: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	content: string;
	properties: string; // opaque JSON object, e.g. '{}' or '{"key":"value"}'
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
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};
