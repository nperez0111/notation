import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-7">
          {/* Database location */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              Database location
            </h3>
            {settings && (
              <>
                <p
                  className="truncate rounded bg-card px-3 py-2 font-mono text-sm text-muted-foreground"
                  title={settings.dbPath}
                >
                  {settings.dbPath}
                </p>
                {pendingPath ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                    <p className="text-sm text-foreground">
                      You have {settings.documentCount} document
                      {settings.documentCount !== 1 ? "s" : ""}. How do you want to use the new
                      location?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmMove("move")}
                        disabled={changingLocation}
                      >
                        Move existing database
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleConfirmMove("new")}
                        disabled={changingLocation}
                      >
                        Create new database
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingPath(null)}
                        disabled={changingLocation}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => void handleChangeLocation()}
                    disabled={changingLocation}
                  >
                    Change location…
                  </Button>
                )}
              </>
            )}
          </section>

          <hr className="border-border" />

          {/* Bluesky */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              Bluesky
            </h3>
            {blueskySession ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    @{blueskySession.handle}
                  </span>
                  <span className="text-xs text-muted-foreground">Connected</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
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
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={bskyAppPassword}
                  onChange={(e) => setBskyAppPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleBlueskyLogin();
                  }}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
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

          <hr className="border-border" />

          {/* Theme */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              Theme
            </h3>
            <Select value={theme} onValueChange={(v) => onThemeChange(v as ThemeOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
