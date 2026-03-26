import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import * as OrgBlocknoteSchema from "./schema.js";

const _audioSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#audio")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get props() {
    return /*#__PURE__*/ v.optional(audioPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("audio"),
});
const _audioPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#audioProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Caption displayed below the audio player.
   * @maxLength 10000
   */
  caption: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
  /**
   * Display name for the audio.
   * @maxLength 1000
   */
  name: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 1000)]),
  ),
  /**
   * Whether to show an inline preview.
   */
  showPreview: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  /**
   * The audio URL.
   * @maxLength 10000
   */
  url: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
});
const _backgroundColorSchema = /*#__PURE__*/ v.literal(
  "org.blocknote.defaultBlocks#backgroundColor",
);
const _boldSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#bold");
const _bulletListItemSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#bulletListItem"),
  ),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(defaultBlockPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("bulletListItem"),
});
const _checkListItemSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#checkListItem"),
  ),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(checkListItemPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("checkListItem"),
});
const _checkListItemPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#checkListItemProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Whether this item is checked/completed.
   */
  checked: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  /**
   * Text alignment within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * Block text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _codeSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#code");
const _codeBlockSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#codeBlock")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(codeBlockPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("codeBlock"),
});
const _codeBlockPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#codeBlockProps"),
  ),
  /**
   * The programming language for syntax highlighting.
   * @maxLength 64
   */
  language: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _defaultBlockPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#defaultBlockProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Text alignment within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * Block text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _dividerSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#divider")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  type: /*#__PURE__*/ v.literal("divider"),
});
const _fileSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#file")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get props() {
    return /*#__PURE__*/ v.optional(filePropsSchema);
  },
  type: /*#__PURE__*/ v.literal("file"),
});
const _filePropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#fileProps")),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Caption displayed below the file.
   * @maxLength 10000
   */
  caption: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
  /**
   * Display name for the file.
   * @maxLength 1000
   */
  name: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 1000)]),
  ),
  /**
   * The file URL.
   * @maxLength 10000
   */
  url: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
});
const _headingSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#heading")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(headingPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("heading"),
});
const _headingPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#headingProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Whether this heading can be toggled to show/hide its children.
   */
  isToggleable: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  /**
   * Heading level (1–6).
   * @minimum 1
   * @maximum 6
   */
  level: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [/*#__PURE__*/ v.integerRange(1, 6)]),
  /**
   * Text alignment within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * Block text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _imageSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#image")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get props() {
    return /*#__PURE__*/ v.optional(imagePropsSchema);
  },
  type: /*#__PURE__*/ v.literal("image"),
});
const _imagePropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#imageProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Caption displayed below the image.
   * @maxLength 10000
   */
  caption: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
  /**
   * Display name or alt text for the image.
   * @maxLength 1000
   */
  name: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 1000)]),
  ),
  /**
   * Width of the inline preview in pixels.
   */
  previewWidth: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  /**
   * Whether to show an inline preview of the image.
   */
  showPreview: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  /**
   * Alignment of the image within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * The image URL.
   * @maxLength 10000
   */
  url: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
});
const _italicSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#italic");
const _linkSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#link")),
  get content() {
    return /*#__PURE__*/ v.array(textSchema);
  },
  /**
   * @maxLength 10000
   */
  href: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
    /*#__PURE__*/ v.stringLength(0, 10000),
  ]),
  type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("link")),
});
const _numberedListItemSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#numberedListItem"),
  ),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(numberedListItemPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("numberedListItem"),
});
const _numberedListItemPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#numberedListItemProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * The starting number for this list item.
   */
  start: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  /**
   * Text alignment within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * Block text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _paragraphSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#paragraph")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(defaultBlockPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("paragraph"),
});
const _quoteSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#quote")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(quotePropsSchema);
  },
  type: /*#__PURE__*/ v.literal("quote"),
});
const _quotePropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#quoteProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Block text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _strikeSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#strike");
const _tableSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#table")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get props() {
    return /*#__PURE__*/ v.optional(tablePropsSchema);
  },
  get tableContent() {
    return /*#__PURE__*/ v.optional(OrgBlocknoteSchema.tableContentSchema);
  },
  type: /*#__PURE__*/ v.literal("table"),
});
const _tablePropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#tableProps"),
  ),
  /**
   * Table text color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  textColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
});
const _textSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#text")),
  get styles() {
    return /*#__PURE__*/ v.optional(OrgBlocknoteSchema.stylesSchema);
  },
  /**
   * @maxLength 1000000
   */
  text: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
    /*#__PURE__*/ v.stringLength(0, 1000000),
  ]),
  type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("text")),
});
const _textColorSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#textColor");
const _toggleListItemSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#toggleListItem"),
  ),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get inlineContent() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.array(
        /*#__PURE__*/ v.variant([
          OrgBlocknoteSchema.linkSchema,
          OrgBlocknoteSchema.styledTextSchema,
        ]),
      ),
    );
  },
  get props() {
    return /*#__PURE__*/ v.optional(defaultBlockPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("toggleListItem"),
});
const _underlineSchema = /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#underline");
const _videoSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#video")),
  get children() {
    return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(OrgBlocknoteSchema.blockSchema));
  },
  /**
   * @maxLength 128
   */
  id: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 128)]),
  get props() {
    return /*#__PURE__*/ v.optional(videoPropsSchema);
  },
  type: /*#__PURE__*/ v.literal("video"),
});
const _videoPropsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("org.blocknote.defaultBlocks#videoProps"),
  ),
  /**
   * Block background color. 'default' uses the inherited/theme color.
   * @maxLength 64
   */
  backgroundColor: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 64)]),
  ),
  /**
   * Caption displayed below the video.
   * @maxLength 10000
   */
  caption: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
  /**
   * Display name for the video.
   * @maxLength 1000
   */
  name: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 1000)]),
  ),
  /**
   * Width of the inline preview in pixels.
   */
  previewWidth: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  /**
   * Whether to show an inline preview.
   */
  showPreview: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  /**
   * Alignment of the video within the block.
   * @maxLength 32
   */
  textAlignment: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(
      /*#__PURE__*/ v.string<"center" | "justify" | "left" | "right" | (string & {})>(),
      [/*#__PURE__*/ v.stringLength(0, 32)],
    ),
  ),
  /**
   * The video URL.
   * @maxLength 10000
   */
  url: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [/*#__PURE__*/ v.stringLength(0, 10000)]),
  ),
});

type audio$schematype = typeof _audioSchema;
type audioProps$schematype = typeof _audioPropsSchema;
type backgroundColor$schematype = typeof _backgroundColorSchema;
type bold$schematype = typeof _boldSchema;
type bulletListItem$schematype = typeof _bulletListItemSchema;
type checkListItem$schematype = typeof _checkListItemSchema;
type checkListItemProps$schematype = typeof _checkListItemPropsSchema;
type code$schematype = typeof _codeSchema;
type codeBlock$schematype = typeof _codeBlockSchema;
type codeBlockProps$schematype = typeof _codeBlockPropsSchema;
type defaultBlockProps$schematype = typeof _defaultBlockPropsSchema;
type divider$schematype = typeof _dividerSchema;
type file$schematype = typeof _fileSchema;
type fileProps$schematype = typeof _filePropsSchema;
type heading$schematype = typeof _headingSchema;
type headingProps$schematype = typeof _headingPropsSchema;
type image$schematype = typeof _imageSchema;
type imageProps$schematype = typeof _imagePropsSchema;
type italic$schematype = typeof _italicSchema;
type link$schematype = typeof _linkSchema;
type numberedListItem$schematype = typeof _numberedListItemSchema;
type numberedListItemProps$schematype = typeof _numberedListItemPropsSchema;
type paragraph$schematype = typeof _paragraphSchema;
type quote$schematype = typeof _quoteSchema;
type quoteProps$schematype = typeof _quotePropsSchema;
type strike$schematype = typeof _strikeSchema;
type table$schematype = typeof _tableSchema;
type tableProps$schematype = typeof _tablePropsSchema;
type text$schematype = typeof _textSchema;
type textColor$schematype = typeof _textColorSchema;
type toggleListItem$schematype = typeof _toggleListItemSchema;
type underline$schematype = typeof _underlineSchema;
type video$schematype = typeof _videoSchema;
type videoProps$schematype = typeof _videoPropsSchema;

export interface audioSchema extends audio$schematype {}
export interface audioPropsSchema extends audioProps$schematype {}
export interface backgroundColorSchema extends backgroundColor$schematype {}
export interface boldSchema extends bold$schematype {}
export interface bulletListItemSchema extends bulletListItem$schematype {}
export interface checkListItemSchema extends checkListItem$schematype {}
export interface checkListItemPropsSchema extends checkListItemProps$schematype {}
export interface codeSchema extends code$schematype {}
export interface codeBlockSchema extends codeBlock$schematype {}
export interface codeBlockPropsSchema extends codeBlockProps$schematype {}
export interface defaultBlockPropsSchema extends defaultBlockProps$schematype {}
export interface dividerSchema extends divider$schematype {}
export interface fileSchema extends file$schematype {}
export interface filePropsSchema extends fileProps$schematype {}
export interface headingSchema extends heading$schematype {}
export interface headingPropsSchema extends headingProps$schematype {}
export interface imageSchema extends image$schematype {}
export interface imagePropsSchema extends imageProps$schematype {}
export interface italicSchema extends italic$schematype {}
export interface linkSchema extends link$schematype {}
export interface numberedListItemSchema extends numberedListItem$schematype {}
export interface numberedListItemPropsSchema extends numberedListItemProps$schematype {}
export interface paragraphSchema extends paragraph$schematype {}
export interface quoteSchema extends quote$schematype {}
export interface quotePropsSchema extends quoteProps$schematype {}
export interface strikeSchema extends strike$schematype {}
export interface tableSchema extends table$schematype {}
export interface tablePropsSchema extends tableProps$schematype {}
export interface textSchema extends text$schematype {}
export interface textColorSchema extends textColor$schematype {}
export interface toggleListItemSchema extends toggleListItem$schematype {}
export interface underlineSchema extends underline$schematype {}
export interface videoSchema extends video$schematype {}
export interface videoPropsSchema extends videoProps$schematype {}

export const audioSchema = _audioSchema as audioSchema;
export const audioPropsSchema = _audioPropsSchema as audioPropsSchema;
export const backgroundColorSchema = _backgroundColorSchema as backgroundColorSchema;
export const boldSchema = _boldSchema as boldSchema;
export const bulletListItemSchema = _bulletListItemSchema as bulletListItemSchema;
export const checkListItemSchema = _checkListItemSchema as checkListItemSchema;
export const checkListItemPropsSchema = _checkListItemPropsSchema as checkListItemPropsSchema;
export const codeSchema = _codeSchema as codeSchema;
export const codeBlockSchema = _codeBlockSchema as codeBlockSchema;
export const codeBlockPropsSchema = _codeBlockPropsSchema as codeBlockPropsSchema;
export const defaultBlockPropsSchema = _defaultBlockPropsSchema as defaultBlockPropsSchema;
export const dividerSchema = _dividerSchema as dividerSchema;
export const fileSchema = _fileSchema as fileSchema;
export const filePropsSchema = _filePropsSchema as filePropsSchema;
export const headingSchema = _headingSchema as headingSchema;
export const headingPropsSchema = _headingPropsSchema as headingPropsSchema;
export const imageSchema = _imageSchema as imageSchema;
export const imagePropsSchema = _imagePropsSchema as imagePropsSchema;
export const italicSchema = _italicSchema as italicSchema;
export const linkSchema = _linkSchema as linkSchema;
export const numberedListItemSchema = _numberedListItemSchema as numberedListItemSchema;
export const numberedListItemPropsSchema =
  _numberedListItemPropsSchema as numberedListItemPropsSchema;
export const paragraphSchema = _paragraphSchema as paragraphSchema;
export const quoteSchema = _quoteSchema as quoteSchema;
export const quotePropsSchema = _quotePropsSchema as quotePropsSchema;
export const strikeSchema = _strikeSchema as strikeSchema;
export const tableSchema = _tableSchema as tableSchema;
export const tablePropsSchema = _tablePropsSchema as tablePropsSchema;
export const textSchema = _textSchema as textSchema;
export const textColorSchema = _textColorSchema as textColorSchema;
export const toggleListItemSchema = _toggleListItemSchema as toggleListItemSchema;
export const underlineSchema = _underlineSchema as underlineSchema;
export const videoSchema = _videoSchema as videoSchema;
export const videoPropsSchema = _videoPropsSchema as videoPropsSchema;

export interface Audio extends v.InferInput<typeof audioSchema> {}
export interface AudioProps extends v.InferInput<typeof audioPropsSchema> {}
export type BackgroundColor = v.InferInput<typeof backgroundColorSchema>;
export type Bold = v.InferInput<typeof boldSchema>;
export interface BulletListItem extends v.InferInput<typeof bulletListItemSchema> {}
export interface CheckListItem extends v.InferInput<typeof checkListItemSchema> {}
export interface CheckListItemProps extends v.InferInput<typeof checkListItemPropsSchema> {}
export type Code = v.InferInput<typeof codeSchema>;
export interface CodeBlock extends v.InferInput<typeof codeBlockSchema> {}
export interface CodeBlockProps extends v.InferInput<typeof codeBlockPropsSchema> {}
export interface DefaultBlockProps extends v.InferInput<typeof defaultBlockPropsSchema> {}
export interface Divider extends v.InferInput<typeof dividerSchema> {}
export interface File extends v.InferInput<typeof fileSchema> {}
export interface FileProps extends v.InferInput<typeof filePropsSchema> {}
export interface Heading extends v.InferInput<typeof headingSchema> {}
export interface HeadingProps extends v.InferInput<typeof headingPropsSchema> {}
export interface Image extends v.InferInput<typeof imageSchema> {}
export interface ImageProps extends v.InferInput<typeof imagePropsSchema> {}
export type Italic = v.InferInput<typeof italicSchema>;
export interface Link extends v.InferInput<typeof linkSchema> {}
export interface NumberedListItem extends v.InferInput<typeof numberedListItemSchema> {}
export interface NumberedListItemProps extends v.InferInput<typeof numberedListItemPropsSchema> {}
export interface Paragraph extends v.InferInput<typeof paragraphSchema> {}
export interface Quote extends v.InferInput<typeof quoteSchema> {}
export interface QuoteProps extends v.InferInput<typeof quotePropsSchema> {}
export type Strike = v.InferInput<typeof strikeSchema>;
export interface Table extends v.InferInput<typeof tableSchema> {}
export interface TableProps extends v.InferInput<typeof tablePropsSchema> {}
export interface Text extends v.InferInput<typeof textSchema> {}
export type TextColor = v.InferInput<typeof textColorSchema>;
export interface ToggleListItem extends v.InferInput<typeof toggleListItemSchema> {}
export type Underline = v.InferInput<typeof underlineSchema>;
export interface Video extends v.InferInput<typeof videoSchema> {}
export interface VideoProps extends v.InferInput<typeof videoPropsSchema> {}
