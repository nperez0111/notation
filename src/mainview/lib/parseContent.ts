import type { PartialBlock } from "@blocknote/core";

/**
 * Parse stored content string (BlockNote JSON) into PartialBlock[] for initialContent.
 * Returns undefined if empty or invalid so BlockNote uses default empty content.
 */
export function parseDocumentContent(content: string): PartialBlock[] | undefined {
	if (!content?.trim()) return undefined;
	try {
		const parsed = JSON.parse(content) as unknown;
		if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
		return parsed as PartialBlock[];
	} catch {
		return undefined;
	}
}
