"use client";

import { useEffect, useState } from "react";
import { Volume2, Vibrate, Trash2, LogOut, UserRound, Globe } from "lucide-react";
import { Sheet, ActionButton } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { apiSignOut, fetchMe } from "@/lib/auth-client";

const THEMES: { id: string; name: string; swatch: string[] }[] = [
  { id: "mono", name: "Raycast Dark", swatch: ["#57c1ff", "#ffc533", "#07080a"] },
  { id: "emerald", name: "Emerald Noir", swatch: ["#16c784", "#f59e0b", "#050505"] },
  { id: "ember", name: "Ember", swatch: ["#f97316", "#f59e0b", "#100a06"] },
  { id: "forest", name: "Forest", swatch: ["#22c55e", "#eab308", "#05080a"] },
  { id: "midnight", name: "Midnight", swatch: ["#4f8cff", "#f5c518", "#050814"] },
  { id: "violet", name: "Violet", swatch: ["#a855f7", "#f59e0b", "#09060d"] },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer ${
        on ? "bg-primary border-primary/50" : "bg-surface border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
          on ? "left-5.5 bg-primary-foreground" : "left-0.5 bg-foreground"
        }`}
      />
    </button>
  );
}

function Row({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Volume2;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface/80 text-primary">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/** Settings as a popup — opens/closes over whatever page is live so the user
 *  never has to leave a screen to change a preference, and can close it again
 *  without navigating to another tab. Driven by store.settingsOpen so the gear,
 *  the sidebar item and the /settings route all open the SAME popup — there is
 *  exactly one settings surface in the app. */
export function SettingsSheet() {
  const open = useGameStore((s) => s.settingsOpen);
  const sound = useGameStore((s) => s.sound);
  const haptics = useGameStore((s) => s.haptics);
  const theme = useGameStore((s) => s.theme);
  const locale = useGameStore((s) => s.locale);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);
  const setTheme = useGameStore((s) => s.setTheme);
  const setLocale = useGameStore((s) => s.setLocale);
  const onClose = useGameStore((s) => s.closeSettings);

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  useEffect(() => {
    if (open) fetchMe().then((me) => setAccountEmail(me ? me.email : null));
  }, [open]);

  const signOut = async () => {
    await apiSignOut();
    window.location.href = "/login";
  };

  const resetApp = () => {
    if (confirm("Reset all data? This clears every session, frame, player and stat.")) {
      try {
        localStorage.clear();
      } catch {
        /* noop */
      }
      onClose();
      window.location.reload();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="mb-1 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {locale === "th" ? "การตั้งค่าทั่วไป" : "Preferences"}
      </div>

      {/* Language Selector */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-md p-3 mb-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/25">
            <Globe size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {locale === "th" ? "ภาษาแสดงผล" : "Language"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {locale === "th" ? "ภาษาไทย / English" : "Thai / English"}
            </div>
          </div>
        </div>
        <div className="flex items-center rounded-full bg-background/90 p-1 border border-border/80">
          <button
            type="button"
            onClick={() => setLocale("th")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
              locale === "th"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            ไทย
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
              locale === "en"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            EN
          </button>
        </div>
      </div>

      <Row
        icon={Volume2}
        title={locale === "th" ? "เสียงเอฟเฟกต์" : "Sound"}
        subtitle={locale === "th" ? "เสียงลูกกระทบและลงหลุม" : "Timers and ball impacts"}
      >
        <Toggle on={sound} onChange={toggleSound} />
      </Row>
      <Row
        icon={Vibrate}
        title={locale === "th" ? "การสั่นตอบสนอง" : "Haptics"}
        subtitle={locale === "th" ? "สั่นเตือนเมื่อกดแต้ม" : "Tactile touch feedback"}
      >
        <Toggle on={haptics} onChange={toggleHaptics} />
      </Row>

      {/* Theme picker — pick to switch instantly */}
      <div className="mb-1 px-2 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Theme
      </div>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={theme === t.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center leading-tight cursor-pointer transition-all shadow-xs active:scale-95",
              theme === t.id
                ? "border-primary bg-primary/20 ring-1 ring-primary/40 shadow-xs"
                : "border-border/80 bg-surface/90 hover:bg-card hover:border-primary/30"
            )}
          >
            <span className="flex items-center gap-1">
              {t.swatch.map((c) => (
                <span key={c} className="h-3 w-3 rounded-full border border-white/15 shadow-xs" style={{ background: c }} />
              ))}
            </span>
            <span className="text-xs font-semibold text-foreground/90">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Account */}
      <div className="mt-4">
        <div className="mb-2 px-2 pt-1 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Account
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-surface/85 shadow-xs">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary">
            <UserRound size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{accountEmail ?? "Anonymous"}</div>
            <div className="text-xs font-mono text-muted-foreground">Authenticated Session</div>
          </div>
          <ActionButton tone="outline" onClick={signOut} className="px-3.5 py-1.5 text-xs rounded-full">
            <LogOut size={13} /> <span>Sign out</span>
          </ActionButton>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-4">
        <div className="mb-2 px-2 pt-1 text-xs font-mono font-bold uppercase tracking-wider text-destructive">
          Danger Zone
        </div>
        <ActionButton tone="danger" onClick={resetApp} className="w-full text-destructive rounded-full h-11 text-xs font-bold gap-2">
          <Trash2 size={15} /> <span>Factory Reset All App Data</span>
        </ActionButton>
      </div>
    </Sheet>
  );
}