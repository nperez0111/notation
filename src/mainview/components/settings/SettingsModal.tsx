import { useState, useEffect } from "react";
import { Modal } from "baseui/modal";
import { Select } from "baseui/select";
import { Button } from "baseui/button";
import { useRpc } from "../../electroview";
import type { ThemeOption } from "../../themeContext";
import type { BlueskySession, SettingsInfo } from "../../../shared/types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onDatabaseReload?: () => void;
  blueskySession: BlueskySession | null;
  onBlueskySessionChange: (session: BlueskySession | null) => void;
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
  blueskySession,
  onBlueskySessionChange,
}: SettingsModalProps) {
  const rpc = useRpc();
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [changingLocation, setChangingLocation] = useState(false);

  // Bluesky auth state
  const [bskyHandle, setBskyHandle] = useState("");
  const [bskyAppPassword, setBskyAppPassword] = useState("");
  const [bskyLoading, setBskyLoading] = useState(false);
  const [bskyError, setBskyError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingPath(null);
      setBskyError(null);
      setBskyHandle("");
      setBskyAppPassword("");
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

  const handleBlueskyLogin = async () => {
    if (!bskyHandle.trim() || !bskyAppPassword.trim()) return;
    setBskyLoading(true);
    setBskyError(null);
    try {
      const result = await rpc.blueskyLogin({
        handle: bskyHandle.trim(),
        appPassword: bskyAppPassword.trim(),
      });
      onBlueskySessionChange({ handle: result.handle, did: result.did });
      setBskyHandle("");
      setBskyAppPassword("");
    } catch (e) {
      setBskyError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBskyLoading(false);
    }
  };

  const handleBlueskyLogout = async () => {
    setBskyLoading(true);
    try {
      await rpc.blueskyLogout({});
      onBlueskySessionChange(null);
    } finally {
      setBskyLoading(false);
    }
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
            maxWidth: "540px",
            width: "100%",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--color-surface-elevated)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          },
        },
      }}
    >
      <div className="flex flex-col gap-7 p-5">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Settings</h2>

        {/* Database location */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Database location
          </h3>
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

        <hr className="border-[var(--color-border)]" />

        {/* Bluesky */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Bluesky
          </h3>
          {blueskySession ? (
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  @{blueskySession.handle}
                </span>
                <span className="text-xs text-[var(--color-text-subtle)]">Connected</span>
              </div>
              <Button
                size="compact"
                kind="secondary"
                onClick={() => void handleBlueskyLogout()}
                disabled={bskyLoading}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="your-handle.bsky.social"
                value={bskyHandle}
                onChange={(e) => setBskyHandle(e.target.value)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-blue-500 focus:outline-none"
              />
              <input
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={bskyAppPassword}
                onChange={(e) => setBskyAppPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleBlueskyLogin();
                }}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-blue-500 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="compact"
                  onClick={() => void handleBlueskyLogin()}
                  disabled={bskyLoading || !bskyHandle.trim() || !bskyAppPassword.trim()}
                >
                  {bskyLoading ? "Connecting…" : "Connect"}
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    void rpc.openExternal({ url: "https://bsky.app/settings/app-passwords" })
                  }
                  className="text-xs text-blue-400 hover:underline"
                >
                  Create an app password
                </button>
              </div>
              {bskyError && <p className="text-xs text-red-400">{bskyError}</p>}
            </div>
          )}
        </section>

        <hr className="border-[var(--color-border)]" />

        {/* Theme */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Theme
          </h3>
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
              Popover: {
                props: {
                  overrides: {
                    Body: {
                      style: {
                        zIndex: 10001,
                      },
                    },
                  },
                },
              },
            }}
          />
        </section>
      </div>
    </Modal>
  );
}
