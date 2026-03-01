import { useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import type { DocumentPropertyValues, Property } from "../../../shared/types";
import { serializeDocumentProperties } from "../../lib/propertyValues";
import { TitleBar } from "./TitleBar";
import { PropertiesBar } from "./PropertiesBar";

const SAVE_DELAY_MS = 500;

type DocumentEditorProps = {
	initialBlocks: PartialBlock[] | undefined;
	initialTitle: string;
	initialPropertyValues: DocumentPropertyValues;
	propertyDefinitions: Property[];
	onSave: (payload: {
		content: string;
		title?: string;
		properties?: string;
	}) => void;
	onCreateProperty: (label: string, type: Property["type"]) => Promise<void>;
	onUpdateProperty: (
		id: number,
		label?: string,
		type?: Property["type"],
	) => Promise<void>;
	onDeleteProperty: (id: number) => Promise<void>;
};

export function DocumentEditor({
	initialBlocks,
	initialTitle,
	initialPropertyValues,
	propertyDefinitions,
	onSave,
	onCreateProperty,
	onUpdateProperty,
	onDeleteProperty,
}: DocumentEditorProps) {
	const [title, setTitle] = useState(initialTitle);
	const [propertyValues, setPropertyValues] =
		useState<DocumentPropertyValues>(initialPropertyValues);

	const editor = useCreateBlockNote({ initialContent: initialBlocks });
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const titleRef = useRef(title);
	const propertyValuesRef = useRef(propertyValues);
	titleRef.current = title;
	propertyValuesRef.current = propertyValues;

	const scheduleSave = () => {
		if (timerRef.current !== null) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			if (!editor) return;
			onSave({
				content: JSON.stringify(editor.document as Block[]),
				title: titleRef.current,
				properties: serializeDocumentProperties(propertyValuesRef.current),
			});
		}, SAVE_DELAY_MS);
	};

	const flushSave = () => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (!editor) return;
		onSave({
			content: JSON.stringify(editor.document as Block[]),
			title: titleRef.current,
			properties: serializeDocumentProperties(propertyValuesRef.current),
		});
	};

	if (!editor) {
		return (
			<div className="flex flex-1 items-center justify-center text-text-muted">
				Loading editor…
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<TitleBar
				value={title}
				onChange={setTitle}
				onBlur={() => {
					scheduleSave();
				}}
			/>
			<PropertiesBar
				definitions={propertyDefinitions}
				values={propertyValues}
				onChange={(next) => {
					setPropertyValues(next);
					scheduleSave();
				}}
				onBlur={flushSave}
				onCreateProperty={onCreateProperty}
				onUpdateProperty={onUpdateProperty}
				onDeleteProperty={onDeleteProperty}
			/>
			<BlockNoteView
				editor={editor}
				theme="dark"
				className="flex-1 min-h-0"
				onChange={scheduleSave}
			/>
		</div>
	);
}
