import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import type { DocumentPropertyValues, Property, PropertyType } from "../../../shared/types";
import {
  parseValueByType,
  serializeValueByType,
  PROPERTY_TYPE_LABELS,
  type ParsedValue,
} from "../../lib/propertyValues";

const PROPERTY_TYPES: PropertyType[] = ["string", "number", "date", "time", "checkbox"];

const inputClassName =
  "w-full bg-transparent text-[13px] min-h-[32px] rounded-md px-2 text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring";

type PropertiesBarProps = {
  definitions: Property[];
  values: DocumentPropertyValues;
  onChange: (values: DocumentPropertyValues) => void;
  onBlur?: () => void;
  onCreateProperty: (label: string, type: PropertyType) => Promise<void>;
  onUpdateProperty: (id: number, label?: string, type?: PropertyType) => Promise<void>;
  onDeleteProperty: (id: number) => Promise<void>;
  onReorderProperties: (orderedIds: number[]) => Promise<void>;
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
  const type = property.type;

  if (type === "checkbox") {
    const checked = value === true;
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onChange(c)}
          aria-label={property.label}
        />
        <span className="text-[13px] text-muted-foreground">{checked ? "Yes" : "No"}</span>
      </div>
    );
  }

  if (type === "number") {
    const num = value === undefined ? "" : String(value);
    return (
      <input
        type="number"
        value={num}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          const next = e.currentTarget.valueAsNumber;
          onChange(raw === "" || Number.isNaN(next) ? undefined : next);
        }}
        onBlur={onBlur}
        placeholder="0"
        aria-label={property.label}
        className={inputClassName}
      />
    );
  }

  if (type === "date") {
    const dateVal = value === undefined ? "" : String(value);
    return (
      <input
        type="date"
        value={dateVal}
        onChange={(e) => onChange(e.target.value || undefined)}
        onBlur={onBlur}
        aria-label={property.label}
        className={inputClassName}
      />
    );
  }

  if (type === "time") {
    const timeVal = value === undefined ? "" : String(value);
    return (
      <input
        type="time"
        value={timeVal}
        onChange={(e) => onChange(e.target.value || undefined)}
        onBlur={onBlur}
        aria-label={property.label}
        className={inputClassName}
      />
    );
  }

  const strVal = value === undefined ? "" : String(value);
  return (
    <input
      type="text"
      value={strVal}
      onChange={(e) => onChange(e.target.value || undefined)}
      onBlur={onBlur}
      placeholder="Empty"
      aria-label={property.label}
      className={inputClassName}
    />
  );
}

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
  onUpdate: (label?: string, type?: PropertyType) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
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
        canDrop: ({ source }) => source.data.type === "property" && source.data.index !== index,
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
    if (t && t !== property.label) void onUpdate(t, undefined);
  };

  return (
    <div ref={rowRef} className="group relative flex items-stretch gap-2" data-notion-row>
      {dropIndicatorEdge === "top" && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-primary" aria-hidden />
      )}
      {dropIndicatorEdge === "bottom" && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-primary" aria-hidden />
      )}
      <div
        ref={handleRef}
        className="flex shrink-0 cursor-grab touch-none items-center py-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-[0_0_180px] items-center py-1">
        {editingLabel ? (
          <input
            ref={labelInputRef}
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setLabelDraft(property.label);
                setEditingLabel(false);
                e.currentTarget.blur();
              }
            }}
            className={inputClassName}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingLabel(true)}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-[13px] text-foreground hover:bg-accent/80"
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Property options"
              />
            }
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change type</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PROPERTY_TYPES.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => {
                      if (t !== property.type) void onUpdate(undefined, t);
                    }}
                  >
                    {PROPERTY_TYPE_LABELS[t]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => void onDelete()}>
              Remove property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    void onReorderProperties(reordered.map((p) => p.id));
  };

  return (
    <div className="properties-section group/section shrink-0 border-b border-border">
      <div className="px-6 py-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Properties
          </p>
          {!adding && (
            <button
              type="button"
              onClick={startAdd}
              title="Add property"
              className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent/80 hover:text-foreground group-hover/section:opacity-100"
              aria-label="Add property"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
              onUpdate={(label, type) => onUpdateProperty(prop.id, label, type)}
              onDelete={() => handleDelete(prop.id)}
              onReorder={handleReorder}
            />
          ))}
          {adding && (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <div className="min-w-0 flex-1" style={{ minWidth: "120px" }}>
                <input
                  ref={addInputRef}
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Property name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitAdd();
                    if (e.key === "Escape") cancelAdd();
                  }}
                  className={inputClassName}
                />
              </div>
              <div className="w-[110px] shrink-0">
                <Select value={newType} onValueChange={(v) => setNewType(v as PropertyType)}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => void submitAdd()}
                disabled={!newLabel.trim()}
                className="rounded bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                className="rounded px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-accent/80 hover:text-foreground"
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
