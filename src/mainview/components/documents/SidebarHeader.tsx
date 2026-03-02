import { useState, useRef, useEffect } from "react";
import type { SettingsInfo } from "../../../shared/types";
import { StatefulPopover } from "baseui/popover";

type SidebarHeaderProps = {
	settings: SettingsInfo | null;
	onSwitchDatabase: (directory: string) => void;
	onCreateCollection?: () => void;
	onCreatePage?: () => void;
	onDatabaseMetadataChange?: (name?: string, icon?: string | null) => void;
};

function ChevronDownIcon({ className }: { className?: string }) {
	return (
		<svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function PlusIcon({ className }: { className?: string }) {
	return (
		<svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</svg>
	);
}

export function SidebarHeader({
	settings,
	onSwitchDatabase,
	onCreateCollection,
	onCreatePage,
	onDatabaseMetadataChange,
}: SidebarHeaderProps) {
	const [editingName, setEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const sidebarPopoverOverrides = {
		Body: {
			style: {
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border)",
				minWidth: "180px",
				maxHeight: "224px",
				overflow: "auto",
			},
		},
		Inner: { style: {} },
	};

	const dbName = !settings
		? "Database"
		: (settings.databaseName ?? settings.dbDirectory.split("/").filter(Boolean).pop() ?? "Database");
	const dbIcon = settings?.databaseIcon;
	const recent = settings?.recentDatabases ?? [];

	const startEditingName = () => {
		setNameDraft(dbName);
		setEditingName(true);
	};

	useEffect(() => {
		if (editingName) nameInputRef.current?.focus();
	}, [editingName]);


	const commitName = () => {
		setEditingName(false);
		const t = nameDraft.trim();
		if (t && t !== dbName && onDatabaseMetadataChange) onDatabaseMetadataChange(t, undefined);
	};

	const handleLogoClick = () => fileInputRef.current?.click();
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !file.type.startsWith("image/") || !onDatabaseMetadataChange) return;
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			onDatabaseMetadataChange(undefined, dataUrl);
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	};

	return (
		<div className="flex flex-col gap-1 border-b border-border p-3">
			<div className="flex items-center gap-2 min-w-0">
				{/* Database logo */}
				<button
					type="button"
					onClick={handleLogoClick}
					className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-hover text-text-muted hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
					title="Upload database image"
					aria-label="Upload database image"
				>
					{dbIcon ? (
						<img src={dbIcon} alt="" className="h-full w-full object-cover" />
					) : (
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
						</svg>
					)}
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
					aria-hidden
				/>

				{/* Database name + switcher (popover portalled so it can overflow sidebar) */}
				<div className="min-w-0 flex-1">
					{editingName ? (
						<input
							ref={nameInputRef}
							type="text"
							value={nameDraft}
							onChange={(e) => setNameDraft(e.target.value)}
							onBlur={commitName}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitName();
								if (e.key === "Escape") {
									setNameDraft(dbName);
									setEditingName(false);
								}
							}}
							className="min-w-0 w-full rounded bg-[var(--color-bg)] px-2 py-1 text-sm font-medium text-[var(--color-text)] outline-none ring-1 ring-border focus:ring-accent"
							aria-label="Database name"
						/>
					) : (
						<StatefulPopover
							placement="bottomLeft"
							content={({ close }) => (
								<div className="py-1" role="listbox">
									{recent.length === 0 ? (
										<div className="px-3 py-2 text-sm text-text-muted">No recent databases</div>
									) : (
										recent.map(({ directory, name }) => (
											<button
												key={directory}
												type="button"
												role="option"
												className={`flex w-full items-center gap-2 truncate px-3 py-2 text-left text-sm ${directory === settings?.dbDirectory ? "bg-accent-muted text-accent-text" : "text-[var(--color-text)] hover:bg-surface-hover"}`}
												onClick={() => {
													if (directory !== settings?.dbDirectory) onSwitchDatabase(directory);
													close();
												}}
											>
												<span className="min-w-0 truncate">{name}</span>
											</button>
										))
									)}
									<button
										type="button"
										className="w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
										onClick={() => {
											startEditingName();
											close();
										}}
									>
										Rename current database
									</button>
								</div>
							)}
							overrides={sidebarPopoverOverrides}
						>
							<button
								type="button"
								className="flex min-w-0 flex-1 items-center gap-1 rounded px-2 py-1.5 text-left text-sm font-medium text-[var(--color-text)] hover:bg-surface-hover w-full"
								title={settings?.dbPath}
								aria-haspopup="listbox"
							>
								<span className="min-w-0 flex-1 truncate">{dbName}</span>
								<ChevronDownIcon className="shrink-0 text-text-muted" />
							</button>
						</StatefulPopover>
					)}
				</div>

				{/* Plus menu (popover portalled so it can overflow sidebar) */}
				<StatefulPopover
					placement="bottomRight"
					content={({ close }) => (
						<div className="min-w-[160px] py-1" role="menu">
							{onCreatePage && (
								<button
									type="button"
									role="menuitem"
									className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
									onClick={() => {
										onCreatePage();
										close();
									}}
								>
									New page
								</button>
							)}
							{onCreateCollection && (
								<button
									type="button"
									role="menuitem"
									className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
									onClick={() => {
										onCreateCollection();
										close();
									}}
								>
									New collection
								</button>
							)}
						</div>
					)}
					overrides={sidebarPopoverOverrides}
				>
					<button
						type="button"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
						aria-label="Create new"
						aria-haspopup="menu"
					>
						<PlusIcon />
					</button>
				</StatefulPopover>
			</div>
		</div>
	);
}
