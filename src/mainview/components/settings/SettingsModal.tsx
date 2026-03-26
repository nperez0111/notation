import { useState, useEffect } from "react";
import { Modal } from "baseui/modal";
import { Select } from "baseui/select";
import { Button } from "baseui/button";
import { useRpc } from "../../electroview";
import type { ThemeOption } from "../../themeContext";
import type { SettingsInfo } from "../../../shared/types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onDatabaseReload?: () => void;
};

const THEME_OPTIONS: { id: ThemeOption; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  onDatabaseReload,
}: SettingsModalProps) {
  const rpc = useRpc();
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [changingLocation, setChangingLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPendingPath(null);
      void rpc.getSettings({}).then(setSettings);
    }
  }, [isOpen, rpc]);

  const handleChangeLocation = async () => {
    const directory = await rpc.chooseDatabaseDirectory({});
    if (directory == null) return;
    if (settings && settings.documentCount > 0) {
      setPendingPath(directory);
      return;
    }
    await applyNewPath(directory, "new");
  };

  const applyNewPath = async (directory: string, mode: "new" | "move") => {
    setChangingLocation(true);
    try {
      await rpc.setDatabaseLocation({ directory, mode });
      await rpc.reloadDatabase({});
      setPendingPath(null);
      const updated = await rpc.getSettings({});
      if (updated) setSettings(updated);
      onDatabaseReload?.();
    } finally {
      setChangingLocation(false);
    }
  };

  const handleConfirmMove = (mode: "new" | "move") => {
    if (!pendingPath) return;
    void applyNewPath(pendingPath, mode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeable
      animate
      size="default"
      overrides={{
        Root: {
          style: {
            zIndex: 10000,
          },
        },
        DialogContainer: {
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        },
        Dialog: {
          style: {
            maxWidth: "480px",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--color-surface-elevated)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          },
        },
      }}
    >
      <div className="flex flex-col gap-6 p-1">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Settings</h2>

        {/* Database location */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Database location</h3>
          {settings && (
            <>
              <p
                className="truncate rounded bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text-subtle)]"
                title={settings.dbPath}
              >
                {settings.dbPath}
              </p>
              {pendingPath ? (
                <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <p className="text-sm text-[var(--color-text)]">
                    You have {settings.documentCount} document
                    {settings.documentCount !== 1 ? "s" : ""}. How do you want to use the new
                    location?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="compact"
                      onClick={() => handleConfirmMove("move")}
                      disabled={changingLocation}
                    >
                      Move existing database
                    </Button>
                    <Button
                      size="compact"
                      kind="secondary"
                      onClick={() => handleConfirmMove("new")}
                      disabled={changingLocation}
                    >
                      Create new database
                    </Button>
                    <Button
                      size="compact"
                      kind="tertiary"
                      onClick={() => setPendingPath(null)}
                      disabled={changingLocation}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="compact" onClick={handleChangeLocation} disabled={changingLocation}>
                  Change location…
                </Button>
              )}
            </>
          )}
        </section>

        {/* Theme */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Theme</h3>
          <Select
            options={THEME_OPTIONS}
            value={[
              { id: theme, label: THEME_OPTIONS.find((o) => o.id === theme)?.label ?? theme },
            ]}
            onChange={({ value }) => {
              const option = value[0];
              if (option && "id" in option) {
                onThemeChange(option.id as ThemeOption);
              }
            }}
            labelKey="label"
            valueKey="id"
            searchable={false}
            clearable={false}
            overrides={{
              ControlContainer: {
                style: {
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                },
              },
            }}
          />
        </section>
      </div>
    </Modal>
  );
}
