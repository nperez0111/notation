import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";
import * as OrgBlocknoteSchema from "./schema.js";

const _contentSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.document#content")),
  /**
   * The document body as an ordered array of blocks.
   */
  get blocks() {
    return /*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema);
  },
  /**
   * Optional declaration of which block, inline content, and style types are valid in this document. When present, validators can check that all content conforms to the declared types. When absent, the document is open-format.
   */
  get schema() {
    return /*#__PURE__*/ v.optional(schemaDeclarationSchema);
  },
});
const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.tidString(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal("org.blocknote.document"),
    /**
     * The document content (blocks and optional schema declaration).
     */
    get content() {
      return contentSchema;
    },
    createdAt: /*#__PURE__*/ v.datetimeString(),
    updatedAt: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.datetimeString()),
  }),
);
const _schemaDeclarationSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.document#schemaDeclaration"),
  ),
  /**
   * Valid block type declarations.
   */
  get blocks() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(schemaEntrySchema));
  },
  /**
   * Valid inline content type declarations.
   */
  get inlineContent() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(schemaEntrySchema));
  },
  /**
   * Valid style type declarations.
   */
  get styles() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(schemaEntrySchema));
  },
});
const _schemaEntrySchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.document#schemaEntry")),
  /**
   * The type identifier (e.g., 'org.blocknote.defaultBlocks#paragraph').
   * @maxLength 256
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 256)]),
});

type content$schematype = typeof _contentSchema;
type main$schematype = typeof _mainSchema;
type schemaDeclaration$schematype = typeof _schemaDeclarationSchema;
type schemaEntry$schematype = typeof _schemaEntrySchema;

export interface contentSchema extends content$schematype {}
export interface mainSchema extends main$schematype {}
export interface schemaDeclarationSchema extends schemaDeclaration$schematype {}
export interface schemaEntrySchema extends schemaEntry$schematype {}

export const contentSchema = _contentSchema as contentSchema;
export const mainSchema = _mainSchema as mainSchema;
export const schemaDeclarationSchema = _schemaDeclarationSchema as schemaDeclarationSchema;
export const schemaEntrySchema = _schemaEntrySchema as schemaEntrySchema;

export interface Content extends v.InferInput<typeof contentSchema> {}
export interface Main extends v.InferInput<typeof mainSchema> {}
export interface SchemaDeclaration extends v.InferInput<typeof schemaDeclarationSchema> {}
export interface SchemaEntry extends v.InferInput<typeof schemaEntrySchema> {}

declare module "@atcute/lexicons/ambient" {
  interface Records {
    "org.blocknote.document": mainSchema;
  }
}
