import { useState, useRef, useEffect } from "react";
import { Select } from "baseui/select";
import { Input } from "baseui/input";
import { Checkbox } from "baseui/checkbox";
import { StatefulPopover } from "baseui/popover";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import type {
	DocumentPropertyValues,
	Property,
	PropertyType,
} from "../../../shared/types";
import {
	parseValueByType,
	serializeValueByType,
	PROPERTY_TYPE_LABELS,
	type ParsedValue,
} from "../../lib/propertyValues";

const PROPERTY_TYPES: PropertyType[] = [
	"string",
	"number",
	"date",
	"time",
	"checkbox",
];

const TYPE_OPTIONS = PROPERTY_TYPES.map((t) => ({
	id: t,
	label: PROPERTY_TYPE_LABELS[t],
}));

type PropertiesBarProps = {
	definitions: Property[];
	values: DocumentPropertyValues;
	onChange: (values: DocumentPropertyValues) => void;
	onBlur?: () => void;
	onCreateProperty: (label: string, type: PropertyType) => Promise<void>;
	onUpdateProperty: (
		id: number,
		label?: string,
		type?: PropertyType,
	) => Promise<void>;
	onDeleteProperty: (id: number) => Promise<void>;
	onReorderProperties: (orderedIds: number[]) => Promise<void>;
};

const selectOverrides = {
	ControlContainer: {
		style: {
			minHeight: "32px",
			backgroundColor: "transparent",
			borderRadius: "6px",
			borderWidth: "1px",
		},
	},
	ValueContainer: {
		style: {
			paddingTop: "4px",
			paddingBottom: "4px",
			paddingLeft: "8px",
			paddingRight: "8px",
		},
	},
	Dropdown: {
		style: {
			borderRadius: "8px",
			boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
		},
	},
	DropdownListItem: {
		style: ({ $theme }: { $theme: { sizing: { scale500: string } } }) => ({
			fontSize: "13px",
			paddingTop: $theme.sizing.scale500,
			paddingBottom: $theme.sizing.scale500,
		}),
	},
};

const inputOverrides = {
	Root: {
		style: {
			backgroundColor: "transparent",
			borderRadius: "6px",
		},
	},
	InputContainer: {
		style: {
			backgroundColor: "transparent",
			borderWidth: 0,
		},
	},
	Input: {
		style: {
			fontSize: "13px",
			minHeight: "32px",
			backgroundColor: "transparent",
		},
	},
};

function PropertyValueInput({
	property,
	value,
	onChange,
	onBlur,
}: {
	property: Property;
	value: ParsedValue;
	onChange: (v: ParsedValue) => void;
	onBlur?: () => void;
}) {
	const id = `prop-value-${property.id}`;
	const type = property.type;

	if (type === "checkbox") {
		const checked = value === true;
		return (
			<Checkbox
				checked={checked}
				onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
				onBlur={onBlur}
				aria-label={property.label}
				overrides={{
					Label: {
						style: ({ $theme }: { $theme: { colors: { contentSecondary: string } } }) => ({
							fontSize: "13px",
							color: $theme.colors.contentSecondary,
						}),
					},
				}}
			>
				{checked ? "Yes" : "No"}
			</Checkbox>
		);
	}

	if (type === "number") {
		const num = value === undefined ? "" : String(value);
		return (
			<Input
				type="number"
				value={num}
				onChange={(e) => {
					const v = (e.target as HTMLInputElement).value;
					onChange(v === "" ? undefined : Number(v));
				}}
				onBlur={onBlur}
				placeholder="0"
				aria-label={property.label}
				overrides={inputOverrides}
				size="compact"
			/>
		);
	}

	if (type === "date") {
		const dateVal = value === undefined ? "" : String(value);
		return (
			<Input
				type="date"
				value={dateVal}
				onChange={(e) =>
					onChange((e.target as HTMLInputElement).value || undefined)
				}
				onBlur={onBlur}
				aria-label={property.label}
				overrides={inputOverrides}
				size="compact"
			/>
		);
	}

	if (type === "time") {
		const timeVal = value === undefined ? "" : String(value);
		return (
			<Input
				type="time"
				value={timeVal}
				onChange={(e) =>
					onChange((e.target as HTMLInputElement).value || undefined)
				}
				onBlur={onBlur}
				aria-label={property.label}
				overrides={inputOverrides}
				size="compact"
			/>
		);
	}

	const strVal = value === undefined ? "" : String(value);
	return (
		<Input
			value={strVal}
			onChange={(e) =>
				onChange((e.target as HTMLInputElement).value || undefined)
			}
			onBlur={onBlur}
			placeholder="Empty"
			aria-label={property.label}
			overrides={inputOverrides}
			size="compact"
		/>
	);
}

const popoverOverrides = {
	Body: {
		style: {
			borderRadius: "8px",
			boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
			backgroundColor: "var(--color-surface-elevated)",
			border: "1px solid var(--color-border)",
			padding: "4px 0",
			minWidth: "160px",
		},
	},
	Inner: { style: {} },
};

type DropEdge = "top" | "bottom";

function PropertyRow({
	property,
	index,
	value,
	onValueChange,
	onBlur,
	onUpdate,
	onDelete,
	onReorder,
}: {
	property: Property;
	index: number;
	value: ParsedValue;
	onValueChange: (v: ParsedValue) => void;
	onBlur?: () => void;
	onUpdate: (label?: string, type?: PropertyType) => void;
	onDelete: () => void;
	onReorder: (startIndex: number, finishIndex: number) => void;
}) {
	const [editingLabel, setEditingLabel] = useState(false);
	const [labelDraft, setLabelDraft] = useState(property.label);
	const [dropIndicatorEdge, setDropIndicatorEdge] = useState<DropEdge | null>(null);
	const labelInputRef = useRef<HTMLInputElement>(null);
	const rowRef = useRef<HTMLDivElement>(null);
	const handleRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLabelDraft(property.label);
	}, [property.label]);

	useEffect(() => {
		if (editingLabel) labelInputRef.current?.focus();
	}, [editingLabel]);

	useEffect(() => {
		const rowEl = rowRef.current;
		const handleEl = handleRef.current;
		if (!rowEl || !handleEl) return;
		return combine(
			draggable({
				element: rowEl,
				dragHandle: handleEl,
				getInitialData: () => ({ type: "property" as const, index }),
			}),
			dropTargetForElements({
				element: rowEl,
				getData: ({ input, element }) => {
					const rect = element.getBoundingClientRect();
					const mid = rect.top + rect.height / 2;
					const edge: DropEdge = input.clientY < mid ? "top" : "bottom";
					return { type: "property" as const, index, edge };
				},
				canDrop: ({ source }) =>
					source.data.type === "property" && source.data.index !== index,
				getIsSticky: () => true,
				onDragEnter: ({ self }) => {
					const edge = (self.data.edge as DropEdge) ?? null;
					setDropIndicatorEdge(edge);
				},
				onDrag: ({ self }) => {
					const edge = (self.data.edge as DropEdge) ?? null;
					setDropIndicatorEdge(edge);
				},
				onDragLeave: () => setDropIndicatorEdge(null),
				onDrop: ({ source, self }) => {
					setDropIndicatorEdge(null);
					const from = source.data.index as number;
					const edge = (self.data.edge as DropEdge) ?? "bottom";
					const finishIndex = edge === "top" ? index : index + 1;
					if (from !== finishIndex) onReorder(from, finishIndex);
				},
			}),
		);
	}, [index, onReorder]);

	const commitLabel = () => {
		setEditingLabel(false);
		const t = labelDraft.trim();
		if (t && t !== property.label) onUpdate(t, undefined);
	};

	return (
		<div
			ref={rowRef}
			className="group relative flex items-stretch gap-2"
			data-notion-row
		>
			{dropIndicatorEdge === "top" && (
				<div
					className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-[var(--color-accent)]"
					aria-hidden
				/>
			)}
			{dropIndicatorEdge === "bottom" && (
				<div
					className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-[var(--color-accent)]"
					aria-hidden
				/>
			)}
			<div
				ref={handleRef}
				className="flex shrink-0 cursor-grab touch-none items-center py-1 text-text-subtle hover:text-[var(--color-text)] active:cursor-grabbing"
				aria-label="Drag to reorder"
			>
				<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
					<path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
				</svg>
			</div>
			<div className="flex min-w-0 flex-[0_0_180px] items-center py-1">
				{editingLabel ? (
					<Input
						inputRef={labelInputRef}
						value={labelDraft}
						onChange={(e) =>
							setLabelDraft((e.target as HTMLInputElement).value)
						}
						onBlur={commitLabel}
						onKeyDown={(e) => {
							if (e.key === "Enter") (e.target as HTMLInputElement).blur();
							if (e.key === "Escape") {
								setLabelDraft(property.label);
								setEditingLabel(false);
								(e.target as HTMLInputElement).blur();
							}
						}}
						overrides={inputOverrides}
						size="compact"
					/>
				) : (
					<button
						type="button"
						onClick={() => setEditingLabel(true)}
						className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-[13px] text-[var(--color-text)] hover:bg-surface-hover/80"
					>
						{property.label || "Untitled"}
					</button>
				)}
			</div>
			<div className="flex min-w-0 flex-1 items-center py-0.5">
				<PropertyValueInput
					property={property}
					value={value}
					onChange={onValueChange}
					onBlur={onBlur}
				/>
			</div>
			<div className="flex w-8 shrink-0 items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
				<StatefulPopover
					placement="bottomRight"
					content={({ close }) => (
						<>
							<StatefulPopover
								placement="rightTop"
								content={({ close: closeSub }) => (
									<ul className="min-w-[140px] list-none py-1">
										{PROPERTY_TYPES.map((t) => (
											<li key={t}>
												<button
													type="button"
													className="properties-submenu-item flex w-full items-center px-3 py-1.5 text-left text-[13px] text-[var(--color-text)]"
													onClick={() => {
														if (t !== property.type) onUpdate(undefined, t);
														closeSub();
														close();
													}}
												>
													{PROPERTY_TYPE_LABELS[t]}
												</button>
											</li>
										))}
									</ul>
								)}
								overrides={popoverOverrides}
							>
								<button
									type="button"
									className="properties-menu-item flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text)]"
								>
									Change type
									<svg className="ml-auto h-3.5 w-3.5 shrink-0 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</StatefulPopover>
							<button
								type="button"
								className="properties-menu-item flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-danger)]"
								onClick={() => {
									onDelete();
									close();
								}}
							>
								<svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								Remove property
							</button>
						</>
					)}
					overrides={popoverOverrides}
				>
					<button
						type="button"
						className="properties-menu-item rounded p-1 text-text-subtle hover:text-[var(--color-text)]"
						aria-label="Property options"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</StatefulPopover>
			</div>
		</div>
	);
}

export function PropertiesBar({
	definitions,
	values,
	onChange,
	onBlur,
	onCreateProperty,
	onUpdateProperty,
	onDeleteProperty,
	onReorderProperties,
}: PropertiesBarProps) {
	const [adding, setAdding] = useState(false);
	const [newLabel, setNewLabel] = useState("");
	const [newType, setNewType] = useState<PropertyType>("string");
	const addInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (adding) addInputRef.current?.focus();
	}, [adding]);

	const handleValueChange = (propertyId: number, value: ParsedValue) => {
		const prop = definitions.find((d) => d.id === propertyId);
		if (!prop) return;
		const next: DocumentPropertyValues = { ...values };
		const serialized = serializeValueByType(value, prop.type);
		if (serialized === "") {
			delete next[propertyId];
		} else {
			next[propertyId] = serialized;
		}
		onChange(next);
	};

	const startAdd = () => {
		setAdding(true);
		setNewLabel("");
		setNewType("string");
	};
	const cancelAdd = () => {
		setAdding(false);
		setNewLabel("");
	};
	const submitAdd = async () => {
		const label = newLabel.trim();
		if (!label) return;
		await onCreateProperty(label, newType);
		setAdding(false);
		setNewLabel("");
	};

	const handleDelete = async (id: number) => {
		if (confirm("Remove this property from this collection?")) {
			await onDeleteProperty(id);
		}
	};

	const handleReorder = (startIndex: number, finishIndex: number) => {
		const reordered = reorder({
			list: definitions,
			startIndex,
			finishIndex,
		});
		onReorderProperties(reordered.map((p) => p.id));
	};

	return (
		<div className="properties-section group/section shrink-0 border-b border-border">
			<div className="px-6 py-2">
				<div className="flex items-center gap-2">
					<p className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">
						Properties
					</p>
					{!adding && (
						<button
							type="button"
							onClick={startAdd}
							title="Add property"
							className="rounded p-0.5 text-text-subtle opacity-0 transition-opacity hover:bg-surface-hover/80 hover:text-[var(--color-text)] group-hover/section:opacity-100"
							aria-label="Add property"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
						</button>
					)}
				</div>
				<div className="mt-1">
					{definitions.map((prop, index) => (
						<PropertyRow
							key={prop.id}
							property={prop}
							index={index}
							value={parseValueByType(values[prop.id], prop.type)}
							onValueChange={(v) => handleValueChange(prop.id, v)}
							onBlur={onBlur}
							onUpdate={(label, type) =>
								onUpdateProperty(prop.id, label, type)
							}
							onDelete={() => handleDelete(prop.id)}
							onReorder={handleReorder}
						/>
					))}
					{adding && (
						<div className="flex flex-wrap items-center gap-2 py-2">
							<div className="min-w-0 flex-1" style={{ minWidth: "120px" }}>
								<Input
									inputRef={addInputRef}
									value={newLabel}
									onChange={(e) =>
										setNewLabel((e.target as HTMLInputElement).value)
									}
									placeholder="Property name"
									onKeyDown={(e) => {
										if (e.key === "Enter") submitAdd();
										if (e.key === "Escape") cancelAdd();
									}}
									overrides={inputOverrides}
									size="compact"
								/>
							</div>
							<div className="w-[110px] shrink-0">
								<Select
									options={TYPE_OPTIONS}
									value={[{ id: newType, label: PROPERTY_TYPE_LABELS[newType] }]}
									onChange={({ value }) => {
										const v = value?.[0];
										if (v) setNewType(v.id as PropertyType);
									}}
									searchable={false}
									clearable={false}
									size="compact"
									overrides={selectOverrides}
									aria-label="Type"
								/>
							</div>
							<button
								type="button"
								onClick={submitAdd}
								disabled={!newLabel.trim()}
								className="rounded bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
							>
								Add
							</button>
							<button
								type="button"
								onClick={cancelAdd}
								className="rounded px-3 py-1.5 text-[13px] text-text-muted hover:bg-surface-hover/80 hover:text-[var(--color-text)]"
							>
								Cancel
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
