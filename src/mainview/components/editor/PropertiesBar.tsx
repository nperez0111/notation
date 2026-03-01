import { useState, useRef, useEffect } from "react";
import { Select } from "baseui/select";
import { Input } from "baseui/input";
import { Button } from "baseui/button";
import { Checkbox } from "baseui/checkbox";
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

function PropertyRow({
	property,
	value,
	onValueChange,
	onBlur,
	onUpdate,
	onDelete,
}: {
	property: Property;
	value: ParsedValue;
	onValueChange: (v: ParsedValue) => void;
	onBlur?: () => void;
	onUpdate: (label?: string, type?: PropertyType) => void;
	onDelete: () => void;
}) {
	const [editingLabel, setEditingLabel] = useState(false);
	const [labelDraft, setLabelDraft] = useState(property.label);
	const labelInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setLabelDraft(property.label);
	}, [property.label]);

	useEffect(() => {
		if (editingLabel) labelInputRef.current?.focus();
	}, [editingLabel]);

	const commitLabel = () => {
		setEditingLabel(false);
		const t = labelDraft.trim();
		if (t && t !== property.label) onUpdate(t, undefined);
	};

	const typeValue = [
		{ id: property.type, label: PROPERTY_TYPE_LABELS[property.type] },
	];

	return (
		<div
			className="group flex items-stretch gap-2 border-b border-border/60 last:border-b-0"
			data-notion-row
		>
			<div className="flex min-w-0 flex-[0_0_220px] items-center gap-2 py-1">
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
				<div className="w-[100px] shrink-0">
					<Select
						options={TYPE_OPTIONS}
						value={typeValue}
						onChange={({ value }) => {
							const v = value?.[0];
							if (v && v.id !== property.type) onUpdate(undefined, v.id as PropertyType);
						}}
						searchable={false}
						clearable={false}
						size="compact"
						overrides={selectOverrides}
						aria-label="Property type"
					/>
				</div>
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
				<Button
					kind="tertiary"
					size="mini"
					onClick={onDelete}
					aria-label="Remove property"
					overrides={{
						BaseButton: {
							style: {
								paddingLeft: "6px",
								paddingRight: "6px",
								color: "var(--color-text-subtle)",
								":hover": {
									backgroundColor: "rgba(239, 68, 68, 0.15)",
									color: "var(--color-danger)",
								},
							},
						},
					}}
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</Button>
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
		if (confirm("Remove this property from all documents?")) {
			await onDeleteProperty(id);
		}
	};

	return (
		<div className="properties-section shrink-0 border-b border-border bg-surface/95">
			<div className="px-6 pt-4 pb-1">
				<p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-subtle">
					Properties
				</p>
				<div className="overflow-hidden rounded-lg border border-border bg-surface-elevated/50">
					{definitions.map((prop) => (
						<PropertyRow
							key={prop.id}
							property={prop}
							value={parseValueByType(values[prop.id], prop.type)}
							onValueChange={(v) => handleValueChange(prop.id, v)}
							onBlur={onBlur}
							onUpdate={(label, type) =>
								onUpdateProperty(prop.id, label, type)
							}
							onDelete={() => handleDelete(prop.id)}
						/>
					))}
					{adding ? (
						<div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-surface-elevated/80 px-3 py-2">
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
							<Button
								size="compact"
								onClick={submitAdd}
								disabled={!newLabel.trim()}
							>
								Add
							</Button>
							<Button kind="tertiary" size="compact" onClick={cancelAdd}>
								Cancel
							</Button>
						</div>
					) : (
						<button
							type="button"
							onClick={startAdd}
							className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2.5 text-left text-[13px] text-text-muted transition-colors hover:bg-surface-hover/80 hover:text-[var(--color-text)]"
						>
							<svg
								className="h-4 w-4 shrink-0 text-text-subtle"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Add a property
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
