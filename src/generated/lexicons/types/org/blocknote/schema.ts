import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";

const _blockSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#block")),
  /**
   * Nested child blocks.
   */
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(blockSchema));
  },
  /**
   * Unique identifier for this block within the document.
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  /**
   * Inline content for text-bearing blocks (paragraphs, headings, lists, etc.). Mutually exclusive with tableContent.
   */
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(/*#__PURE__*/ v.variant([linkSchema, styledTextSchema])),
    );
  },
  /**
   * Block-type-specific properties. The shape depends on the block type.
   */
  props: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
  /**
   * Table content for table blocks. Mutually exclusive with inlineContent.
   */
  get tableContent() {
    return /*#__PURE__*/ v.optional(tableContentSchema);
  },
  /**
   * The block type identifier (e.g., 'paragraph', 'heading', 'image').
   * @maxLength 256
   */
  type: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 256)]),
});
const _linkSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#link")),
  /**
   * The styled text spans that make up the link text.
   */
  get content() {
    return /*#__PURE__*/ v.array(styledTextSchema);
  },
  /**
   * The URL this link points to.
   * @maxLength 10000
   */
  href: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
    /*#__PURE__*/ v.stringLength(0, 10000),
  ]),
  /**
   * The inline content type identifier.
   * @maxLength 128
   */
  type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  ),
});
const _styledTextSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#styledText")),
  /**
   * Formatting styles applied to this text span.
   */
  get styles() {
    return /*#__PURE__*/ v.optional(stylesSchema);
  },
  /**
   * The text content of this span.
   * @maxLength 1000000
   */
  text: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
    /*#__PURE__*/ v.stringLength(0, 1000000),
  ]),
  /**
   * The inline content type identifier.
   * @maxLength 128
   */
  type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  ),
});
const _stylesSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#styles")),
});
const _tableCellSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#tableCell")),
  /**
   * The inline content within this cell.
   */
  get content() {
    return /*#__PURE__*/ v.array(/*#__PURE__*/ v.variant([linkSchema, styledTextSchema]));
  },
  get props() {
    return /*#__PURE__*/ v.optional(tableCellPropsSchema);
  },
  /**
   * The cell type identifier (e.g., 'tableCell', 'tableHeader').
   * @maxLength 128
   */
  type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  ),
});
const _tableCellPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#tableCellProps")),
  /**
   * Cell background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Number of columns this cell spans.
   * @minimum 1
   */
  colspan: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [/*#__PURE__*/ v.integerRange(1)]),
  ),
  /**
   * Number of rows this cell spans.
   * @minimum 1
   */
  rowspan: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [/*#__PURE__*/ v.integerRange(1)]),
  ),
  /**
   * Text alignment within the cell.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * Cell text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _tableContentSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#tableContent")),
  /**
   * Width of each column in the table.
   */
  columnWidths: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(/*#__PURE__*/ v.integer())),
  /**
   * Number of header columns on the left of the table.
   */
  headerCols: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  /**
   * Number of header rows at the top of the table.
   */
  headerRows: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  /**
   * The rows in this table.
   */
  get rows() {
    return /*#__PURE__*/ v.array(tableRowSchema);
  },
  type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("tableContent")),
});
const _tableRowSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.schema#tableRow")),
  /**
   * The cells in this row.
   */
  get cells() {
    return /*#__PURE__*/ v.array(tableCellSchema);
  },
});

type block$schematype = typeof _blockSchema;
type link$schematype = typeof _linkSchema;
type styledText$schematype = typeof _styledTextSchema;
type styles$schematype = typeof _stylesSchema;
type tableCell$schematype = typeof _tableCellSchema;
type tableCellProps$schematype = typeof _tableCellPropsSchema;
type tableContent$schematype = typeof _tableContentSchema;
type tableRow$schematype = typeof _tableRowSchema;

export interface blockSchema extends block$schematype {}
export interface linkSchema extends link$schematype {}
export interface styledTextSchema extends styledText$schematype {}
export interface stylesSchema extends styles$schematype {}
export interface tableCellSchema extends tableCell$schematype {}
export interface tableCellPropsSchema extends tableCellProps$schematype {}
export interface tableContentSchema extends tableContent$schematype {}
export interface tableRowSchema extends tableRow$schematype {}

export const blockSchema = _blockSchema as blockSchema;
export const linkSchema = _linkSchema as linkSchema;
export const styledTextSchema = _styledTextSchema as styledTextSchema;
export const stylesSchema = _stylesSchema as stylesSchema;
export const tableCellSchema = _tableCellSchema as tableCellSchema;
export const tableCellPropsSchema = _tableCellPropsSchema as tableCellPropsSchema;
export const tableContentSchema = _tableContentSchema as tableContentSchema;
export const tableRowSchema = _tableRowSchema as tableRowSchema;

export interface Block extends v.InferInput<typeof blockSchema> {}
export interface Link extends v.InferInput<typeof linkSchema> {}
export interface StyledText extends v.InferInput<typeof styledTextSchema> {}
export interface Styles extends v.InferInput<typeof stylesSchema> {}
export interface TableCell extends v.InferInput<typeof tableCellSchema> {}
export interface TableCellProps extends v.InferInput<typeof tableCellPropsSchema> {}
export interface TableContent extends v.InferInput<typeof tableContentSchema> {}
export interface TableRow extends v.InferInput<typeof tableRowSchema> {}
