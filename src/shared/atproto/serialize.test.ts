// @ts-nocheck — test data uses loose types (e.g., `type: string`) that don't satisfy PartialBlock's literal unions
import { describe, test, expect } from "bun:test";
import {
	blocknoteToLexicon,
	lexiconToBlocknote,
	createLexiconContent,
} from "./serialize";

// Helper: round-trip BlockNote → Lexicon → BlockNote
function roundTrip(blocks: any[]) {
	const lexicon = blocknoteToLexicon(blocks);
	return lexiconToBlocknote(lexicon);
}

describe("blocknoteToLexicon", () => {
	test("converts a plain paragraph", () => {
		const blocks = [
			{
				id: "1",
				type: "paragraph",
				content: [{ type: "text", text: "Hello world", styles: {} }],
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result).toEqual([
			{
				id: "1",
				type: "paragraph",
				inlineContent: [
					{
						$type: "org.blocknote.schema#styledText",
						type: "text",
						text: "Hello world",
						styles: {},
					},
				],
			},
		]);
	});

	test("converts a link with styled text inside", () => {
		const blocks = [
			{
				id: "2",
				type: "paragraph",
				content: [
					{
						type: "link",
						href: "https://example.com",
						content: [
							{ type: "text", text: "click me", styles: { bold: true } },
						],
					},
				],
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result[0]).toMatchObject({
			inlineContent: [
				{
					$type: "org.blocknote.schema#link",
					type: "link",
					href: "https://example.com",
					content: [
						{
							$type: "org.blocknote.schema#styledText",
							type: "text",
							text: "click me",
							styles: { bold: true },
						},
					],
				},
			],
		});
	});

	test("converts block props", () => {
		const blocks = [
			{
				id: "3",
				type: "heading",
				props: { level: 2 },
				content: [{ type: "text", text: "Title", styles: {} }],
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result[0]).toMatchObject({
			type: "heading",
			props: { level: 2 },
		});
	});

	test("omits empty props", () => {
		const blocks = [
			{
				id: "4",
				type: "paragraph",
				props: {},
				content: [],
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result[0]).not.toHaveProperty("props");
	});

	test("omits inlineContent when content array is empty", () => {
		const blocks = [
			{
				id: "5",
				type: "paragraph",
				content: [],
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result[0]).not.toHaveProperty("inlineContent");
	});

	test("converts nested children", () => {
		const blocks = [
			{
				id: "parent",
				type: "bulletListItem",
				content: [{ type: "text", text: "parent", styles: {} }],
				children: [
					{
						id: "child",
						type: "bulletListItem",
						content: [{ type: "text", text: "child", styles: {} }],
						children: [],
					},
				],
			},
		];
		const result = blocknoteToLexicon(blocks);
		expect(result[0].children).toHaveLength(1);
		expect((result[0].children as any[])[0]).toMatchObject({
			id: "child",
			type: "bulletListItem",
		});
	});

	test("converts table content", () => {
		const blocks = [
			{
				id: "t1",
				type: "table",
				content: {
					type: "tableContent",
					columnWidths: [100, 200],
					headerRows: 1,
					rows: [
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Header 1", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Header 2", styles: {} },
									],
								},
							],
						},
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Cell 1", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Cell 2", styles: {} },
									],
								},
							],
						},
					],
				},
				children: [],
			},
		];
		const result = blocknoteToLexicon(blocks);
		const tc = (result[0] as any).tableContent;
		expect(tc.type).toBe("tableContent");
		expect(tc.columnWidths).toEqual([100, 200]);
		expect(tc.headerRows).toBe(1);
		expect(tc.rows).toHaveLength(2);
		expect(tc.rows[0].cells[0].content[0]).toMatchObject({
			$type: "org.blocknote.schema#styledText",
			text: "Header 1",
		});
	});
});

describe("lexiconToBlocknote", () => {
	test("converts lexicon styledText back to BlockNote text", () => {
		const lexBlocks = [
			{
				id: "1",
				type: "paragraph",
				inlineContent: [
					{
						$type: "org.blocknote.schema#styledText",
						type: "text",
						text: "Hello",
						styles: { italic: true },
					},
				],
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		expect(result[0]).toMatchObject({
			id: "1",
			type: "paragraph",
			content: [{ type: "text", text: "Hello", styles: { italic: true } }],
		});
	});

	test("converts lexicon link back to BlockNote link", () => {
		const lexBlocks = [
			{
				id: "2",
				type: "paragraph",
				inlineContent: [
					{
						$type: "org.blocknote.schema#link",
						type: "link",
						href: "https://example.com",
						content: [
							{
								$type: "org.blocknote.schema#styledText",
								type: "text",
								text: "link text",
								styles: {},
							},
						],
					},
				],
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		expect(result[0]).toMatchObject({
			content: [
				{
					type: "link",
					href: "https://example.com",
					content: [{ type: "text", text: "link text", styles: {} }],
				},
			],
		});
	});

	test("converts lexicon table content back to BlockNote", () => {
		const lexBlocks = [
			{
				id: "t1",
				type: "table",
				tableContent: {
					type: "tableContent",
					columnWidths: [150],
					headerRows: 0,
					rows: [
						{
							cells: [
								{
									content: [
										{
											$type: "org.blocknote.schema#styledText",
											type: "text",
											text: "cell",
											styles: {},
										},
									],
								},
							],
						},
					],
				},
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		const content = (result[0] as any).content;
		expect(content.type).toBe("tableContent");
		expect(content.columnWidths).toEqual([150]);
		expect(content.rows[0].cells[0].content[0]).toMatchObject({
			type: "text",
			text: "cell",
		});
	});

	test("strips $type from nested link content", () => {
		const lexBlocks = [
			{
				id: "3",
				type: "paragraph",
				inlineContent: [
					{
						$type: "org.blocknote.schema#link",
						type: "link",
						href: "https://example.com",
						content: [
							{
								$type: "org.blocknote.schema#styledText",
								type: "text",
								text: "inner",
								styles: { bold: true },
							},
						],
					},
				],
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		const link = (result[0] as any).content[0];
		expect(link).not.toHaveProperty("$type");
		expect(link.content[0]).not.toHaveProperty("$type");
	});

	test("handles block with no inlineContent or tableContent", () => {
		const lexBlocks = [
			{
				id: "void1",
				type: "divider",
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		expect(result[0]).toEqual({ id: "void1", type: "divider" });
		expect(result[0]).not.toHaveProperty("content");
	});

	test("converts nested children from lexicon format", () => {
		const lexBlocks = [
			{
				id: "p1",
				type: "paragraph",
				inlineContent: [
					{
						$type: "org.blocknote.schema#styledText",
						type: "text",
						text: "Parent",
						styles: {},
					},
				],
				children: [
					{
						id: "c1",
						type: "paragraph",
						inlineContent: [
							{
								$type: "org.blocknote.schema#styledText",
								type: "text",
								text: "Child",
								styles: {},
							},
						],
					},
				],
			},
		] as any;
		const result = lexiconToBlocknote(lexBlocks);
		expect(result).toEqual([
			{
				id: "p1",
				type: "paragraph",
				content: [{ type: "text", text: "Parent", styles: {} }],
				children: [
					{
						id: "c1",
						type: "paragraph",
						content: [{ type: "text", text: "Child", styles: {} }],
					},
				],
			},
		]);
	});
});

describe("round-trip: BlockNote to Lexicon to BlockNote", () => {
	test("paragraph with mixed inline content", () => {
		const original = [
			{
				id: "rt1",
				type: "paragraph",
				content: [
					{ type: "text", text: "Hello ", styles: {} },
					{ type: "text", text: "bold", styles: { bold: true } },
					{
						type: "link",
						href: "https://example.com",
						content: [
							{ type: "text", text: "a link", styles: { underline: true } },
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("heading with props", () => {
		const original = [
			{
				id: "rt2",
				type: "heading",
				props: { level: 3, textAlignment: "center" },
				content: [{ type: "text", text: "Centered H3", styles: {} }],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("nested list items", () => {
		const original = [
			{
				id: "rt3",
				type: "bulletListItem",
				content: [{ type: "text", text: "top", styles: {} }],
				children: [
					{
						id: "rt3a",
						type: "bulletListItem",
						content: [{ type: "text", text: "nested", styles: {} }],
						children: [
							{
								id: "rt3b",
								type: "bulletListItem",
								content: [
									{ type: "text", text: "deep nested", styles: {} },
								],
							},
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("table with header rows and column widths", () => {
		const original = [
			{
				id: "rt4",
				type: "table",
				content: {
					type: "tableContent",
					columnWidths: [100, 200, 300],
					headerRows: 1,
					headerCols: 0,
					rows: [
						{
							cells: [
								{ content: [{ type: "text", text: "A", styles: {} }] },
								{ content: [{ type: "text", text: "B", styles: {} }] },
								{ content: [{ type: "text", text: "C", styles: {} }] },
							],
						},
						{
							cells: [
								{ content: [{ type: "text", text: "1", styles: {} }] },
								{ content: [{ type: "text", text: "2", styles: {} }] },
								{ content: [{ type: "text", text: "3", styles: {} }] },
							],
						},
					],
				},
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("image block (no inline content)", () => {
		const original = [
			{
				id: "rt5",
				type: "image",
				props: {
					url: "https://example.com/img.png",
					caption: "A photo",
					width: 500,
				},
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("empty document round-trips", () => {
		const original: any[] = [];
		const result = roundTrip(original);
		expect(result).toEqual([]);
	});

	test("multiple blocks of different types", () => {
		const original = [
			{
				id: "m1",
				type: "heading",
				props: { level: 1 },
				content: [{ type: "text", text: "Title", styles: {} }],
			},
			{
				id: "m2",
				type: "paragraph",
				content: [
					{ type: "text", text: "Some text ", styles: {} },
					{ type: "text", text: "with bold", styles: { bold: true } },
				],
			},
			{
				id: "m3",
				type: "bulletListItem",
				content: [{ type: "text", text: "item 1", styles: {} }],
			},
			{
				id: "m4",
				type: "numberedListItem",
				content: [{ type: "text", text: "item 2", styles: {} }],
			},
			{
				id: "m5",
				type: "codeBlock",
				props: { language: "typescript" },
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	// --- Cases inspired by BlockNote's own test suite (copyTestInstances) ---

	test("multiple children of a parent block", () => {
		const original = [
			{
				id: "mc1",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 1", styles: {} }],
				children: [
					{
						id: "mc1a",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 1", styles: {} },
						],
					},
					{
						id: "mc1b",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 2", styles: {} },
						],
					},
					{
						id: "mc1c",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 3", styles: {} },
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("children spanning two parent blocks", () => {
		const original = [
			{
				id: "cs1",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 1", styles: {} }],
				children: [
					{
						id: "cs1a",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 1", styles: {} },
						],
					},
					{
						id: "cs1b",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 2", styles: {} },
						],
					},
					{
						id: "cs1c",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 3", styles: {} },
						],
					},
				],
			},
			{
				id: "cs2",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 2", styles: {} }],
				children: [
					{
						id: "cs2a",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 4", styles: {} },
						],
					},
					{
						id: "cs2b",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 5", styles: {} },
						],
					},
					{
						id: "cs2c",
						type: "paragraph",
						content: [
							{ type: "text", text: "Nested Paragraph 6", styles: {} },
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("styled text: unstyled, italic, and bold spans", () => {
		const original = [
			{
				id: "st1",
				type: "paragraph",
				content: [
					{ type: "text", text: "Unstyled Text", styles: {} },
					{ type: "text", text: "Italic Text", styles: { italic: true } },
					{ type: "text", text: "Bold Text", styles: { bold: true } },
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("image block with full props (name, url, caption, showPreview, previewWidth)", () => {
		const original = [
			{
				id: "img1",
				type: "image",
				props: {
					name: "placeholder.png",
					url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png",
					caption: "Placeholder",
					showPreview: true,
					previewWidth: 256,
				},
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("image nested inside a paragraph with its own children", () => {
		const original = [
			{
				id: "ni1",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 1", styles: {} }],
				children: [
					{
						id: "ni1a",
						type: "image",
						props: {
							url: "https://example.com/placeholder.svg",
						},
						children: [
							{
								id: "ni1a1",
								type: "paragraph",
								content: [
									{
										type: "text",
										text: "Nested Paragraph 1",
										styles: {},
									},
								],
							},
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("divider block (void, no content or props)", () => {
		const original = [
			{
				id: "div1",
				type: "divider",
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("all basic block types (paragraph, heading, lists, code, table, image, divider)", () => {
		const original = [
			{
				id: "bb1",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 1", styles: {} }],
			},
			{
				id: "bb2",
				type: "heading",
				content: [{ type: "text", text: "Heading 1", styles: {} }],
			},
			{
				id: "bb3",
				type: "numberedListItem",
				content: [
					{ type: "text", text: "Numbered List Item 1", styles: {} },
				],
			},
			{
				id: "bb4",
				type: "bulletListItem",
				content: [
					{ type: "text", text: "Bullet List Item 1", styles: {} },
				],
			},
			{
				id: "bb5",
				type: "checkListItem",
				content: [
					{ type: "text", text: "Check List Item 1", styles: {} },
				],
			},
			{
				id: "bb6",
				type: "toggleListItem",
				content: [
					{ type: "text", text: "Toggle List Item 1", styles: {} },
				],
			},
			{
				id: "bb7",
				type: "codeBlock",
				content: [
					{
						type: "text",
						text: 'console.log("Hello World");',
						styles: {},
					},
				],
			},
			{
				id: "bb8",
				type: "table",
				content: {
					type: "tableContent",
					rows: [
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Table Cell 1", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Table Cell 2", styles: {} },
									],
								},
							],
						},
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Table Cell 3", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Table Cell 4", styles: {} },
									],
								},
							],
						},
					],
				},
			},
			{
				id: "bb9",
				type: "image",
			},
			{
				id: "bb10",
				type: "divider",
			},
			{
				id: "bb11",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 2", styles: {} }],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("all basic block types with props", () => {
		const original = [
			{
				id: "bp1",
				type: "paragraph",
				props: { textColor: "red" },
				content: [{ type: "text", text: "Paragraph 1", styles: {} }],
			},
			{
				id: "bp2",
				type: "heading",
				props: { level: 2 },
				content: [{ type: "text", text: "Heading 1", styles: {} }],
			},
			{
				id: "bp3",
				type: "numberedListItem",
				props: { start: 2 },
				content: [
					{ type: "text", text: "Numbered List Item 1", styles: {} },
				],
			},
			{
				id: "bp4",
				type: "bulletListItem",
				props: { backgroundColor: "red" },
				content: [
					{ type: "text", text: "Bullet List Item 1", styles: {} },
				],
			},
			{
				id: "bp5",
				type: "checkListItem",
				props: { checked: true },
				content: [
					{ type: "text", text: "Check List Item 1", styles: {} },
				],
			},
			{
				id: "bp6",
				type: "toggleListItem",
				props: { textAlignment: "right" },
				content: [
					{ type: "text", text: "Toggle List Item 1", styles: {} },
				],
			},
			{
				id: "bp7",
				type: "codeBlock",
				props: { language: "typescript" },
				content: [
					{
						type: "text",
						text: 'console.log("Hello World");',
						styles: {},
					},
				],
			},
			{
				id: "bp8",
				type: "table",
				content: {
					type: "tableContent",
					rows: [
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Table Cell 1", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Table Cell 2", styles: {} },
									],
								},
							],
						},
						{
							cells: [
								{
									content: [
										{ type: "text", text: "Table Cell 3", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Table Cell 4", styles: {} },
									],
								},
							],
						},
					],
				},
			},
			{
				id: "bp9",
				type: "image",
				props: {
					name: "1280px-Placeholder_view_vector.svg.png",
					url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png",
					caption: "Placeholder",
					showPreview: true,
					previewWidth: 256,
				},
			},
			{
				id: "bp10",
				type: "divider",
			},
			{
				id: "bp11",
				type: "paragraph",
				content: [{ type: "text", text: "Paragraph 2", styles: {} }],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("table cells with typed cells and props (colspan, rowspan, colors)", () => {
		const original = [
			{
				id: "tcp1",
				type: "table",
				content: {
					type: "tableContent",
					columnWidths: [150, 150],
					headerRows: 1,
					headerCols: 1,
					rows: [
						{
							cells: [
								{
									type: "tableCell",
									props: {
										backgroundColor: "yellow",
										textAlignment: "center",
										colspan: 2,
									},
									content: [
										{
											type: "text",
											text: "Merged Header",
											styles: { bold: true },
										},
									],
								},
							],
						},
						{
							cells: [
								{
									type: "tableCell",
									props: {
										textColor: "blue",
										rowspan: 1,
									},
									content: [
										{ type: "text", text: "Row Cell", styles: {} },
									],
								},
								{
									content: [
										{ type: "text", text: "Normal", styles: {} },
									],
								},
							],
						},
					],
				},
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("link inside a table cell", () => {
		const original = [
			{
				id: "ltc1",
				type: "table",
				content: {
					type: "tableContent",
					rows: [
						{
							cells: [
								{
									content: [
										{
											type: "link",
											href: "https://example.com",
											content: [
												{
													type: "text",
													text: "click",
													styles: { bold: true },
												},
											],
										},
									],
								},
							],
						},
					],
				},
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("multiple style combinations on text", () => {
		const original = [
			{
				id: "ms1",
				type: "paragraph",
				content: [
					{
						type: "text",
						text: "bold+italic",
						styles: { bold: true, italic: true },
					},
					{
						type: "text",
						text: "strike+underline",
						styles: { strike: true, underline: true },
					},
					{
						type: "text",
						text: "colored",
						styles: { textColor: "red", backgroundColor: "yellow" },
					},
					{
						type: "text",
						text: "code",
						styles: { code: true },
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});

	test("link with multiple styled spans inside", () => {
		const original = [
			{
				id: "lms1",
				type: "paragraph",
				content: [
					{
						type: "link",
						href: "https://example.com/path",
						content: [
							{
								type: "text",
								text: "bold part",
								styles: { bold: true },
							},
							{
								type: "text",
								text: " and italic part",
								styles: { italic: true },
							},
						],
					},
				],
			},
		];
		const result = roundTrip(original);
		expect(result).toEqual(original);
	});
});

describe("createLexiconContent", () => {
	test("creates content with blocks", () => {
		const blocks = [
			{
				id: "d1",
				type: "paragraph",
				content: [{ type: "text", text: "Hello", styles: {} }],
			},
		];
		const doc = createLexiconContent(blocks);
		expect(doc.$type).toBe("org.blocknote.document#content");
		expect(doc.blocks).toHaveLength(1);
		expect(doc).not.toHaveProperty("schema");
	});

	test("creates document with schema info", () => {
		const blocks = [
			{
				id: "d2",
				type: "paragraph",
				content: [{ type: "text", text: "Test", styles: {} }],
			},
		];
		const doc = createLexiconContent(blocks, {
			schema: {
				blocks: ["paragraph", "heading"],
				inlineContent: ["text", "link"],
				styles: ["bold", "italic"],
			},
		});
		expect(doc.schema).toEqual({
			blocks: [{ id: "paragraph" }, { id: "heading" }],
			inlineContent: [{ id: "text" }, { id: "link" }],
			styles: [{ id: "bold" }, { id: "italic" }],
		});
	});
});
