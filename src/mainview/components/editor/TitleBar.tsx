import type { DocumentIcon } from "../../../shared/types";
import { DocumentIconView } from "../documents/DocumentIconView";
import { DocumentIconPicker } from "../documents/DocumentIconPicker";

type TitleBarProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: DocumentIcon;
  onIconChange?: (icon: DocumentIcon) => void;
};

export function TitleBar({
  value,
  onChange,
  onBlur,
  placeholder = "Untitled",
  icon,
  onIconChange,
}: TitleBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-6 pt-4">
      {onIconChange && (
        <DocumentIconPicker value={icon ?? null} onSelect={onIconChange} theme="dark">
          {icon ? (
            <DocumentIconView icon={icon} size={24} className="block shrink-0" />
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-muted-foreground hover:bg-accent">
              +
            </span>
          )}
        </DocumentIconPicker>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label="Document title"
        className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
