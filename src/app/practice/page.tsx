"use client";

/**
 * /practice — Practice Generator.
 * Random drills (Safety / Escape / Thin Contact / Position) at difficulty
 * 1–10, verified solvable by the engine. Save to device, share as JSON,
 * or open straight in the Escape Solver.
 */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Save, Share2, Send, Trash2, FolderOpen } from "lucide-react";
import type { Drill, Vec } from "@/lib/geometry";
import type { DrillKind } from "@/lib/coach/drills";
import {
  PLAY,
  CUSHION,
  BALL_R,
  VIEW_W,
  VIEW_H,
  POCKETS,
  BALL_COLORS,
} from "@/lib/geometry";
import {
  generateDrill,
  kindLabel,
  savedDrills,
  saveDrill,
  deleteDrill,
  handOffDrill,
} from "@/lib/coach/drills";
import { cn } from "@/lib/utils";

const KINDS: DrillKind[] = ["escape", "thin", "safety", "position"];
const O = CUSHION;

export default function PracticePage() {
  const router = useRouter();
  const [kind, setKind] = useState<DrillKind>("escape");
  const [difficulty, setDifficulty] = useState(5);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [saved, setSaved] = useState<Drill[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => setSaved(savedDrills()), []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const generate = () => {
    setBusy(true);
    // let the spinner paint before the (fast) generation loop
    window.setTimeout(() => {
      const d = generateDrill(kind, difficulty);
      setDrill(d);
      setBusy(false);
      if (!d) flash("Could not build a solvable pose — try again.");
    }, 30);
  };

  const save = () => {
    if (!drill) return;
    saveDrill(drill);
    refresh();
    flash("Drill saved to this device");
  };

  const shareJson = async () => {
    if (!drill) return;
    const text = JSON.stringify(drill, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      flash("Drill JSON copied to clipboard");
    } catch {
      flash("Clipboard unavailable — use Download");
    }
  };

  const downloadJson = () => {
    if (!drill) return;
    const blob = new Blob([JSON.stringify(drill, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesnooker-drill-${drill.kind}-d${drill.difficulty}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInSolver = () => {
    if (!drill) return;
    handOffDrill(drill);
    router.push("/solve");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <header>
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Dices size={20} className="text-primary" />
          Practice Generator
        </h1>
        <p className="text-xs text-muted-foreground">
          Every drill is verified solvable by the escape engine before it is served.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* left: generator + preview */}
        <div className="flex flex-col gap-4">
          {/* generator controls */}
          <div className="glass flex flex-col gap-4 p-4">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Drill type
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                      kind === k
                        ? "bg-primary/25 text-primary"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {kindLabel(k)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Difficulty
                </span>
                <span className="text-sm font-bold text-gold">{difficulty}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <button
              onClick={generate}
              disabled={busy}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {busy ? "Building pose…" : `Generate ${kindLabel(kind).toLowerCase()} drill`}
            </button>
          </div>

          {/* preview + actions */}
          {drill ? (
            <div className="glass flex flex-col gap-4 p-4">
              <DrillPreview drill={drill} />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={openInSolver}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/20 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/30"
                >
                  <Send size={13} /> Open in Solver
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10"
                >
                  <Save size={13} /> Save
                </button>
                <button
                  onClick={shareJson}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10"
                >
                  <Share2 size={13} /> Share JSON
                </button>
                <button
                  onClick={downloadJson}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10"
                >
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="glass flex items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Pick a type &amp; difficulty, then generate a drill.
            </div>
          )}
        </div>

        {/* right: saved drills */}
        <div className="glass flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Saved drills</h2>
            <span className="text-[10px] text-muted-foreground">{saved.length}</span>
          </div>
          {saved.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing saved yet. Generate a drill and tap Save — it stays on this device.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {saved.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {kindLabel(d.kind)} · D{d.difficulty}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {d.others.length + 1} balls · {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDrill(d);
                    }}
                    className="rounded-lg bg-white/5 p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label="Load drill"
                  >
                    <FolderOpen size={13} />
                  </button>
                  <button
                    onClick={() => {
                      deleteDrill(d.id);
                      refresh();
                    }}
                    className="rounded-lg bg-white/5 p-1.5 text-muted-foreground hover:bg-danger/20 hover:text-danger"
                    aria-label="Delete drill"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-black/85 px-5 py-2.5 text-xs font-semibold text-foreground backdrop-blur-lg md:bottom-10">
          {toast}
        </div>
      )}
    </div>
  );
}

/** Read-only mini table rendering a drill pose. */
function DrillPreview({ drill }: { drill: Drill }) {
  const balls: { pos: Vec; color: string }[] = [
    { pos: drill.cue, color: BALL_COLORS.cue },
    { pos: drill.object.pos, color: BALL_COLORS[drill.object.color] },
    ...drill.others.map((b) => ({ pos: b.pos, color: BALL_COLORS[b.color] })),
  ];
  const pocket = POCKETS.find((p) => p.id === drill.pocketId);
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full">
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={30} fill="#0a0806" />
      <rect
        x={O * 0.5}
        y={O * 0.5}
        width={PLAY.x1 + CUSHION}
        height={PLAY.y1 + CUSHION}
        rx={14}
        fill="#0a241b"
      />
      <rect x={O} y={O} width={PLAY.x1} height={PLAY.y1} fill="#0d2f22" />
      {POCKETS.map((p) => (
        <circle
          key={p.id}
          cx={p.pos.x + O}
          cy={p.pos.y + O}
          r={p.r}
          fill={p.id === drill.pocketId ? "#f59e0b" : "#050505"}
          opacity={p.id === drill.pocketId ? 0.85 : 1}
          stroke="rgba(226,185,106,0.35)"
        />
      ))}
      {balls.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.pos.x + O}
            cy={b.pos.y + O}
            r={BALL_R}
            fill={b.color}
            stroke="rgba(0,0,0,0.5)"
          />
          {i === 0 && (
            <circle
              cx={b.pos.x + O}
              cy={b.pos.y + O}
              r={BALL_R + 5}
              fill="none"
              stroke="#7fb3ff"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          {i === 1 && (
            <circle
              cx={b.pos.x + O}
              cy={b.pos.y + O}
              r={BALL_R + 5}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          )}
        </g>
      ))}
      {pocket && (
        <text
          x={pocket.pos.x + O}
          y={pocket.pos.y + O + 52}
          textAnchor="middle"
          fill="#f59e0b"
          fontSize={16}
          fontWeight={700}
        >
          target
        </text>
      )}
    </svg>
  );
}
