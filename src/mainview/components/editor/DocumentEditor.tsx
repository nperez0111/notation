import { useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block, PartialBlock } from "@blocknote/core";
import type {
	Document,
	DocumentIcon,
	DocumentPropertyValues,
	Property,
} from "../../../shared/types";
import { serializeDocumentProperties } from "../../lib/propertyValues";
import { TitleBar } from "./TitleBar";
import { PropertiesBar } from "./PropertiesBar";
import { ChildDocumentsSection } from "./ChildDocumentsSection";

const SAVE_DELAY_MS = 500;

type DocumentEditorProps = {
	initialBlocks: PartialBlock[] | undefined;
	initialTitle: string;
	initialIcon: DocumentIcon;
	initialPropertyValues: DocumentPropertyValues;
	propertyDefinitions: Property[];
	theme?: "light" | "dark";
	contextCollectionName?: string;
	contextHierarchy?: { id: number; title: string }[];
	onNavigateToDocument?: (id: number) => void;
	onSave: (payload: {
		content: string;
		title?: string;
		properties?: string;
	}) => void;
	onIconChange: (documentId: number, icon: DocumentIcon) => void;
	documentId: number;
	onCreateProperty: (label: string, type: Property["type"]) => Promise<void>;
	onUpdateProperty: (
		id: number,
		label?: string,
		type?: Property["type"],
	) => Promise<void>;
	onDeleteProperty: (id: number) => Promise<void>;
	onReorderProperties: (orderedIds: number[]) => Promise<void>;
	/** Child documents of the current doc (in display order). Shown after properties. */
	childDocuments?: Document[];
	onReorderChildDocuments?: (orderedIds: number[]) => void;
};

export function DocumentEditor({
	initialBlocks,
	initialTitle,
	initialIcon,
	initialPropertyValues,
	propertyDefinitions,
	theme = "dark",
	contextCollectionName,
	contextHierarchy,
	onNavigateToDocument,
	onSave,
	onIconChange,
	documentId,
	onCreateProperty,
	onUpdateProperty,
	onDeleteProperty,
	onReorderProperties,
	childDocuments = [],
	onReorderChildDocuments,
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
			{(contextCollectionName || (contextHierarchy && contextHierarchy.length > 0)) && (
				<div className="flex items-center justify-between border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/70 px-6 py-2 text-xs text-[var(--color-text-muted)]">
					<div className="flex flex-wrap items-center gap-1.5">
						{contextCollectionName && (
							<span className="font-medium text-[var(--color-text)]">
								{contextCollectionName}
							</span>
						)}
						{contextHierarchy && contextHierarchy.length > 0 && (
							<>
								<span className="text-[var(--color-text-subtle)]">/</span>
								{contextHierarchy.map((item, index) => {
									const isLastParent = index === contextHierarchy.length - 1;
									const label = item.title?.trim() || "Untitled";
									return (
										<span key={item.id} className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => onNavigateToDocument?.(item.id)}
												className="max-w-[160px] truncate text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
											>
												{label}
											</button>
											{!isLastParent && (
												<span className="text-[var(--color-text-subtle)]">/</span>
											)}
										</span>
									);
								})}
							</>
						)}
					</div>
				</div>
			)}
			<TitleBar
				value={title}
				onChange={setTitle}
				onBlur={() => {
					scheduleSave();
				}}
				icon={initialIcon}
				onIconChange={(icon) => onIconChange(documentId, icon)}
			/>
			<div className="mt-3 px-6">
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
					onReorderProperties={onReorderProperties}
				/>
			</div>
			{childDocuments.length > 0 && (
				<ChildDocumentsSection
					children={childDocuments}
					onNavigate={(id) => onNavigateToDocument?.(id)}
					onReorder={(orderedIds) => onReorderChildDocuments?.(orderedIds)}
				/>
			)}
			<div className="mt-2 flex min-h-0 flex-1 px-1 pb-1 pt-1.5">
				<BlockNoteView
					editor={editor}
					theme={theme}
					className="flex-1 min-h-0"
					onChange={scheduleSave}
				/>
			</div>
		</div>
	);
}
