import { useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import { TitleBar } from "./TitleBar";
import { PropertiesBar } from "./PropertiesBar";

const SAVE_DELAY_MS = 500;

type DocumentEditorProps = {
	initialBlocks: PartialBlock[] | undefined;
	initialTitle: string;
	initialProperties: string;
	onSave: (payload: {
		content: string;
		title?: string;
		properties?: string;
	}) => void;
};

export function DocumentEditor({
	initialBlocks,
	initialTitle,
	initialProperties,
	onSave,
}: DocumentEditorProps) {
	const [title, setTitle] = useState(initialTitle);
	const [properties, setProperties] = useState(initialProperties);

	const editor = useCreateBlockNote({ initialContent: initialBlocks });
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const titleRef = useRef(title);
	const propertiesRef = useRef(properties);
	titleRef.current = title;
	propertiesRef.current = properties;

	const scheduleSave = () => {
		if (timerRef.current !== null) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			if (!editor) return;
			onSave({
				content: JSON.stringify(editor.document as Block[]),
				title: titleRef.current,
				properties: propertiesRef.current,
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
			properties: propertiesRef.current,
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
				value={properties}
				onChange={setProperties}
				onBlur={flushSave}
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
