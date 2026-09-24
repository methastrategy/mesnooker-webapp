"use client";

/**
 * AI Coach — right sidebar.
 * Deterministic coaching derived from the engine's best path:
 * hint ladder, aim point, hit thickness, power suggestion, cushion notes.
 */
import { useCoachStore } from "@/store/coachStore";
import { POCKET_MAP, POCKETS, coachBrief, sideName } from "@/lib/geometry";
import { cn } from "@/lib/utils";

const HINTS = [
  { n: 0, label: "Blind" },
  { n: 1, label: "Aim" },
  { n: 2, label: "Ghost" },
  { n: 3, label: "Full" },
];

function Bar({ pct, tone }: { pct: number; tone: "primary" | "gold" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : "bg-gold")}
        style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function AiCoachPanel() {
  const solved = useCoachStore((s) => s.solved);
  const paths = useCoachStore((s) => s.paths);
  const selectedPathId = useCoachStore((s) => s.selectedPathId);
  const objectId = useCoachStore((s) => s.objectId);
  const balls = useCoachStore((s) => s.balls);
  const pocketId = useCoachStore((s) => s.pocketId);
  const hintLevel = useCoachStore((s) => s.hintLevel);
  const setHint = useCoachStore((s) => s.setHint);

  const obj = balls.find((b) => b.id === objectId);
  const selected = paths.find((p) => p.id === selectedPathId);
  const best = selected ?? paths.find((p) => !p.blocked) ?? paths[0];
  const pocket = POCKET_MAP[pocketId];

  let brief = null;
  if (best && obj) {
    brief = coachBrief(best, obj.pos, pocket?.pos ?? best.objectPolyline[1]);
  }

  return (
    <aside className="glass flex w-full flex-col gap-4 p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-80 lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold tracking-wide">AI Coach</div>
          <div className="text-[10px] uppercase tracking-widest text-gold">
            Emerald Noir
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            solved && best && !best.blocked
              ? "bg-primary/20 text-primary"
              : "bg-white/10 text-muted-foreground"
          )}
        >
          {solved && best && !best.blocked ? "Route found" : "Awaiting solve"}
        </span>
      </div>

      {/* hint ladder */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Hint mode
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {HINTS.map((h) => (
            <button
              key={h.n}
              onClick={() => setHint(h.n)}
              className={cn(
                "rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors",
                hintLevel === h.n
                  ? "bg-primary/25 text-primary"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {!best || !brief || !obj || !pocket ? (
        <div className="rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Tap a ball on the table to make it the <span className="text-foreground">target</span>,
            pick its pocket, set the cushion budget, then hit{" "}
            <span className="text-foreground">Solve</span>.
          </p>
          <p className="mt-2">
            Drag the cue ball to draw your own aim line — the coach will grade it.
          </p>
        </div>
      ) : (
        <>
          {/* headline */}
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-muted-foreground">
              {obj.color[0].toUpperCase() + obj.color.slice(1)} → {pocket.name}
              {" · "}
              {best.cushions === 0 ? "Straight" : `${best.cushions} cushion${best.cushions > 1 ? "s" : ""}`}
              {" · "}
              Difficulty <span className="font-bold text-foreground">{best.difficulty}/10</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {best.blocked
                ? `⚠ No clean route to ${pocket.name}: ${best.blockReason}. Move a ball or change the pocket.`
                : brief.firstWords}
            </p>
          </div>

          {/* aim point */}
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Aim point
            </div>
            <div className="text-sm text-foreground">
              {brief.aimAngleDeg}° from the long rail,{" "}
              <span className="text-gold">{brief.aimDistance} cm-equivalents</span> away
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {best.cushionNotes.length
                ? `First touch: ${sideName(best.cushionNotes[0].side).toLowerCase()} cushion at ${Math.round(
                    ((best.cushionNotes[0].side === "l" || best.cushionNotes[0].side === "r")
                      ? best.cushionNotes[0].point.y / 600
                      : best.cushionNotes[0].point.x / 1200
                    ) * 100
                  )}% of the cushion.`
                : "No cushion: aim straight at the ghost ball centre."}
            </div>
          </div>

          {/* thickness */}
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Hit thickness
              </span>
              <span className="text-xs font-bold text-gold">{brief.thicknessLabel}</span>
            </div>
            <Bar pct={brief.thickness * 100} tone="gold" />
          </div>

          {/* power */}
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Power
              </span>
              <span className="text-xs font-bold text-primary">{brief.powerPct}%</span>
            </div>
            <Bar pct={brief.powerPct} tone="primary" />
            <div className="mt-1 text-xs text-muted-foreground">{brief.powerLabel}</div>
          </div>

          {/* cushion explanation */}
          {best.cushionNotes.length > 0 && (
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Cushion plan
              </div>
              <ul className="flex flex-col gap-1.5">
                {brief.cushionExplanation.map((line, i) => (
                  <li key={i} className="text-xs leading-relaxed text-foreground/85">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {best.blocked && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs leading-relaxed text-foreground/85">
              {best.blockReason ?? "No legal route found."} Try another pocket, raise the
              cushion budget, or move a blocking ball.
            </div>
          )}
        </>
      )}

      {/* pocket quick-pick */}
      <div className="mt-auto">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Pocket
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {POCKETS.map((p) => (
            <PocketPick key={p.id} pocket={p} active={p.id === pocketId} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function PocketPick({
  pocket,
  active,
}: {
  pocket: (typeof POCKETS)[number];
  active: boolean;
}) {
  const setPocket = useCoachStore((s) => s.setPocket);
  return (
    <button
      onClick={() => setPocket(pocket.id)}
      className={cn(
        "rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors",
        active
          ? "bg-primary/25 text-primary"
          : "bg-white/5 text-muted-foreground hover:bg-white/10"
      )}
    >
      {pocket.name.replace("Bottom", "B").replace("Top", "T").replace("-Middle", "-Mid")}
    </button>
  );
}
