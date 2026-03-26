/**
 * Serialization adapter between BlockNote's in-memory document format
 * and the ATProto lexicon format (org.blocknote.schema).
 *
 * Key differences between the two formats:
 * 1. BlockNote uses a single `content` field (InlineContent[] | TableContent | undefined).
 *    The lexicon format splits this into `inlineContent` (array) and `tableContent` (object).
 * 2. BlockNote uses `type` on inline content items for discrimination.
 *    ATProto unions use `$type` for discrimination.
 */

import type { Block as LexiconBlock } from "../../generated/lexicons/types/org/blocknote/schema";
import type { Content as LexiconContent } from "../../generated/lexicons/types/org/blocknote/document";
import type { PartialBlock } from "@blocknote/core";

function toSchemaEntries(ids?: string[]) {
  return ids?.map((id) => ({ id }));
}

// BlockNote inline content item (text or link)
type BNInlineContent = {
  type: string;
  text?: string;
  styles?: Record<string, boolean | string>;
  href?: string;
  content?: BNInlineContent[];
};

// BlockNote table content
type BNTableContent = {
  type: "tableContent";
  columnWidths?: number[];
  headerRows?: number;
  headerCols?: number;
  rows: {
    cells: {
      type?: string;
      props?: Record<string, unknown>;
      content: BNInlineContent[];
    }[];
  }[];
};

// BlockNote block (loosely typed to handle any block shape)
type BNBlock = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: BNInlineContent[] | BNTableContent;
  children?: BNBlock[];
};

/**
 * Convert an inline content item from BlockNote format to lexicon format.
 * Adds `$type` for ATProto union discrimination.
 */
function inlineContentToLexicon(item: BNInlineContent): Record<string, unknown> {
  if (item.type === "link") {
    return {
      $type: "org.blocknote.schema#link",
      type: item.type,
      href: item.href,
      content: (item.content ?? []).map(inlineContentToLexicon),
    };
  }
  // styledText (type: "text" or any custom inline content type)
  return {
    $type: "org.blocknote.schema#styledText",
    type: item.type,
    text: item.text ?? "",
    styles: item.styles ?? {},
  };
}

/**
 * Convert an inline content item from lexicon format back to BlockNote format.
 * Removes `$type` since BlockNote uses `type` for discrimination.
 */
function inlineContentToBlockNote(item: Record<string, unknown>): BNInlineContent {
  const { $type: _$type, ...rest } = item;
  if (rest.type === "link") {
    return {
      type: "link",
      href: rest.href as string,
      content: ((rest.content as Record<string, unknown>[]) ?? []).map(inlineContentToBlockNote),
    };
  }
  return {
    type: (rest.type as string) ?? "text",
    text: (rest.text as string) ?? "",
    styles: (rest.styles as Record<string, boolean | string>) ?? {},
  };
}

/**
 * Convert table content from BlockNote format to lexicon format.
 */
function tableContentToLexicon(tc: BNTableContent): Record<string, unknown> {
  return {
    type: "tableContent",
    ...(tc.columnWidths && { columnWidths: tc.columnWidths }),
    ...(tc.headerRows != null && { headerRows: tc.headerRows }),
    ...(tc.headerCols != null && { headerCols: tc.headerCols }),
    rows: tc.rows.map((row) => ({
      cells: row.cells.map((cell) => ({
        ...(cell.type && { type: cell.type }),
        ...(cell.props && { props: cell.props }),
        content: cell.content.map(inlineContentToLexicon),
      })),
    })),
  };
}

/**
 * Convert table content from lexicon format back to BlockNote format.
 */
function tableContentToBlockNote(tc: Record<string, unknown>): BNTableContent {
  const rows = tc.rows as { cells: Record<string, unknown>[] }[];
  const result: BNTableContent = {
    type: "tableContent",
    rows: rows.map((row) => ({
      cells: row.cells.map((cell) => {
        const cellResult: BNTableContent["rows"][0]["cells"][0] = {
          content: ((cell.content as Record<string, unknown>[]) ?? []).map(
            inlineContentToBlockNote,
          ),
        };
        if (cell.type) cellResult.type = cell.type as string;
        if (cell.props) cellResult.props = cell.props as Record<string, unknown>;
        return cellResult;
      }),
    })),
  };
  if (tc.columnWidths) result.columnWidths = tc.columnWidths as number[];
  if (tc.headerRows != null) result.headerRows = tc.headerRows as number;
  if (tc.headerCols != null) result.headerCols = tc.headerCols as number;
  return result;
}

/**
 * Convert a single BlockNote block to lexicon format.
 * - Splits `content` into `inlineContent` or `tableContent`
 * - Recursively transforms children
 */
function blockToLexicon(block: BNBlock): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: block.id,
    type: block.type,
  };

  if (block.props && Object.keys(block.props).length > 0) {
    result.props = block.props;
  }

  if (block.content != null) {
    if (Array.isArray(block.content)) {
      // InlineContent[]
      if (block.content.length > 0) {
        result.inlineContent = block.content.map(inlineContentToLexicon);
      }
    } else if (block.content.type === "tableContent") {
      // TableContent
      result.tableContent = tableContentToLexicon(block.content);
    }
  }

  if (block.children && block.children.length > 0) {
    result.children = block.children.map(blockToLexicon);
  }

  return result;
}

/**
 * Convert a single lexicon block back to BlockNote format.
 * - Merges `inlineContent`/`tableContent` into `content`
 * - Recursively transforms children
 */
function blockToBlockNote(block: Record<string, unknown>): BNBlock {
  const result: BNBlock = {
    id: block.id as string,
    type: block.type as string,
  };

  if (block.props) {
    result.props = block.props as Record<string, unknown>;
  }

  if (block.inlineContent) {
    result.content = (block.inlineContent as Record<string, unknown>[]).map(
      inlineContentToBlockNote,
    );
  } else if (block.tableContent) {
    result.content = tableContentToBlockNote(block.tableContent as Record<string, unknown>);
  }

  if (block.children) {
    result.children = (block.children as Record<string, unknown>[]).map(blockToBlockNote);
  }

  return result;
}

/**
 * Convert an array of BlockNote blocks to the ATProto lexicon format.
 *
 * Usage:
 * ```ts
 * const lexiconBlocks = blocknoteToLexicon(editor.document);
 * ```
 */
export function blocknoteToLexicon(blocks: PartialBlock[]): LexiconBlock[] {
  return (blocks as unknown as BNBlock[]).map(blockToLexicon) as unknown as LexiconBlock[];
}

/**
 * Convert an array of ATProto lexicon blocks back to BlockNote format.
 *
 * Usage:
 * ```ts
 * const blocks = lexiconToBlocknote(document.content);
 * ```
 */
export function lexiconToBlocknote(blocks: LexiconBlock[]): PartialBlock[] {
  return (blocks as unknown as Record<string, unknown>[]).map(
    blockToBlockNote,
  ) as unknown as PartialBlock[];
}

/**
 * Create a BlockNote content object suitable for embedding in an open union
 * (e.g., site.standard.document's content field) with
 * `$type: "org.blocknote.document#content"`.
 *
 * Schema entries accept plain strings for convenience and wrap them
 * in `{ id: string }` objects per the lexicon format.
 */
export function createLexiconContent(
  blocks: PartialBlock[],
  options?: {
    schema?: {
      blocks?: string[];
      inlineContent?: string[];
      styles?: string[];
    };
  },
): LexiconContent {
  return {
    $type: "org.blocknote.document#content",
    blocks: blocknoteToLexicon(blocks),
    ...(options?.schema && {
      schema: {
        ...(options.schema.blocks && {
          blocks: toSchemaEntries(options.schema.blocks),
        }),
        ...(options.schema.inlineContent && {
          inlineContent: toSchemaEntries(options.schema.inlineContent),
        }),
        ...(options.schema.styles && {
          styles: toSchemaEntries(options.schema.styles),
        }),
      },
    }),
  } as LexiconContent;
}
