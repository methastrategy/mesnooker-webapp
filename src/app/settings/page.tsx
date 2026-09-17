"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";

/** Settings now lives in ONE place: the global popup (SettingsSheet) that the
 *  gear, the sidebar item and this route all open. Deep-linking to /settings
 *  opens that same popup over the dashboard instead of rendering a second,
 *  divergent settings page. */
export default function SettingsPage() {
  const router = useRouter();
  const openSettings = useGameStore((s) => s.openSettings);

  useEffect(() => {
    openSettings();
    router.replace("/");
  }, [openSettings, router]);

  return (
    <div className="glass p-8 text-center text-muted-foreground">Opening settings…</div>
  );
}