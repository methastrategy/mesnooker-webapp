"use client";

import type { Player, SessionSummary } from "@/types";
import { optimizeTransfers } from "@/lib/money";
import { formatMoney, formatDateTime } from "@/lib/utils";

/** Build a plain-text summary for copying / CSV / JSON export */
export function buildSummaryText(opts: {
  session: SessionSummary | null;
  players: Player[];
  runningBalance: Record<string, number>;
}): string {
  const { session, players, runningBalance } = opts;
  const lines: string[] = [];
  lines.push("🎱 MESNOOKER");
  lines.push("════════════════════════");
  if (session) lines.push(`Session: ${formatDateTime(session.createdAt)}`);
  lines.push(`Mode: ${session ? session.mode : "n/a"}`);
  lines.push(`Rate: ฿${session?.moneyRate ?? 0}/${session?.moneyPer ?? "point"}`);
  lines.push("");
  lines.push("RUNNING BALANCE");
  [...players]
    .sort((a, b) => (runningBalance[b.id] ?? 0) - (runningBalance[a.id] ?? 0))
    .forEach((p, i) => {
      const bal = runningBalance[p.id] ?? 0;
      lines.push(`${i + 1}. ${p.nickname}: ${bal >= 0 ? "+" : ""}${formatMoney(bal)}`);
    });
  lines.push("");
  lines.push("SETTLEMENT (minimal transfers)");
  const tx = optimizeTransfers(runningBalance, players);
  if (!tx.length) lines.push("All settled ✓");
  tx.forEach((t) => lines.push(`  ${t.fromName} → ${t.toName}: ${formatMoney(t.amount)}`));
  return lines.join("\n");
}

/** Download a blob to the device */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export running balance as CSV */
export function exportCsv(opts: {
  players: Player[];
  runningBalance: Record<string, number>;
}) {
  const { players, runningBalance } = opts;
  const header = "player,money";
  const rows = players.map((p) => `${p.nickname},${runningBalance[p.id] ?? 0}`).join("\n");
  const csv = `${header}\n${rows}`;
  downloadBlob(`snooker-${Date.now()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

/** Export as JSON backup */
export function exportJson(data: unknown) {
  downloadBlob(
    `snooker-export-${Date.now()}.json`,
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  );
}

/** Copy a settlement summary to clipboard */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}