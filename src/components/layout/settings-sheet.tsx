"use client";

import { Volume2, Vibrate, Languages, Trash2 } from "lucide-react";
import { Sheet, Badge, ActionButton } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

const THEMES: { id: string; name: string; swatch: string[] }[] = [
  { id: "emerald", name: "Emerald Noir", swatch: ["#16c784", "#f59e0b", "#050505"] },
  { id: "ember", name: "Ember", swatch: ["#f97316", "#f59e0b", "#100a06"] },
  { id: "forest", name: "Forest", swatch: ["#22c55e", "#eab308", "#05080a"] },
  { id: "midnight", name: "Midnight", swatch: ["#4f8cff", "#f5c518", "#050814"] },
  { id: "violet", name: "Violet", swatch: ["#a855f7", "#f59e0b", "#09060d"] },
  { id: "mono", name: "Chrome", swatch: ["#e5e7eb", "#f5f5f4", "#090909"] },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-6" : "left-1"
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary">
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
  const store = useGameStore();
  const open = useGameStore((s) => s.settingsOpen);
  const sound = useGameStore((s) => s.sound);
  const haptics = useGameStore((s) => s.haptics);
  const theme = useGameStore((s) => s.theme);
  const toggleSound = store.toggleSound;
  const toggleHaptics = store.toggleHaptics;
  const setTheme = store.setTheme;
  const onClose = store.closeSettings;

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
        Preferences
      </div>

      <Row icon={Volume2} title="Sound" subtitle="Timers and alerts">
        <Toggle on={sound} onChange={toggleSound} />
      </Row>
      <Row icon={Vibrate} title="Haptics" subtitle="Tactile feedback">
        <Toggle on={haptics} onChange={toggleHaptics} />
      </Row>
      <Row icon={Languages} title="Language" subtitle="App display language">
        <Badge variant="neutral">English</Badge>
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
              "flex flex-col items-center gap-2 rounded-2xl border px-2 py-2.5",
              theme === t.id
                ? "border-primary/60 bg-primary/15 ring-1 ring-primary/50"
                : "border-white/10 bg-white/5"
            )}
          >
            <span className="flex items-center gap-1">
              {t.swatch.map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span className="text-[11px] font-medium">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Danger zone */}
      <div className="mt-4">
        <div className="mb-1 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-destructive">
          Danger zone
        </div>
        <ActionButton tone="outline" onClick={resetApp} className="w-full text-destructive">
          <Trash2 size={16} /> Reset app
        </ActionButton>
      </div>
    </Sheet>
  );
}