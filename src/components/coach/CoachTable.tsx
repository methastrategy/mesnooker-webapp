"use client";

/**
 * CoachTable — SVG renderer for the Snooker Coach Engine.
 * 12ft table, drag & drop every ball, escape-path overlays, ghost ball,
 * bounce markers, aim crosshair, user aim line (analyzer) and replay.
 * All theme colours come from CSS variables so it re-skins with Emerald Noir.
 */
import { useCallback, useRef, useState } from "react";
import { useCoachStore, COACH_CUE_ID } from "@/store/coachStore";
import type { SolvePath, Vec } from "@/lib/geometry";
import {
  PLAY,
  CUSHION,
  BALL_R,
  VIEW_W,
  VIEW_H,
  POCKETS,
  BALL_COLORS,
  BAULK_LINE,
  BAULK_SPOT,
} from "@/lib/geometry";

const OX = CUSHION;
const OY = CUSHION;
const S = (p: Vec) => ({ x: p.x + OX, y: p.y + OY });

export interface ReplayState {
  cue: Vec;
  object: Vec | null;
  phase: "cue" | "object" | "done";
}

export function CoachTable({
  aimLine,
  replay,
  onAim,
}: {
  aimLine: { from: Vec; to: Vec } | null;
  replay: ReplayState | null;
  onAim?: (line: { from: Vec; to: Vec } | null) => void;
}) {
  const balls = useCoachStore((s) => s.balls);
  const objectId = useCoachStore((s) => s.objectId);
  const moveBall = useCoachStore((s) => s.moveBall);
  const setObjectBall = useCoachStore((s) => s.setObjectBall);
  const paths = useCoachStore((s) => s.paths);
  const selectedPathId = useCoachStore((s) => s.selectedPathId);
  const hintLevel = useCoachStore((s) => s.hintLevel);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const selectedPath: SolvePath | undefined = paths.find(
    (p) => p.id === selectedPathId
  );
  const bestPath = paths.find((p) => !p.blocked) ?? paths[0];

  // ── pointer → table coordinates ────────────────────────────────────────
  const toTable = useCallback((clientX: number, clientY: number): Vec => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    // account for preserveAspectRatio (meet) letterboxing
    const scale = Math.min(r.width / VIEW_W, r.height / VIEW_H);
    const offX = (r.width - VIEW_W * scale) / 2;
    const offY = (r.height - VIEW_H * scale) / 2;
    const vx = (clientX - r.left - offX) / scale;
    const vy = (clientY - r.top - offY) / scale;
    return {
      x: Math.max(0, Math.min(PLAY.x1, vx - OX)),
      y: Math.max(0, Math.min(PLAY.y1, vy - OY)),
    };
  }, []);

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    if (id === COACH_CUE_ID && onAim) {
      // cue ball drag = user aim line for the analyzer
      const start = toTable(e.clientX, e.clientY);
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragId("aim");
      onAim({ from: start, to: start });
      return;
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragId(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragId === "aim" && onAim) {
      const p = toTable(e.clientX, e.clientY);
      const cue = balls.find((b) => b.id === COACH_CUE_ID);
      if (cue) onAim({ from: cue.pos, to: p });
    } else if (dragId) {
      const p = toTable(e.clientX, e.clientY);
      moveBall(dragId, p);
    }
  };

  const onPointerUp = () => setDragId(null);

  const replayCue = replay ? S(replay.cue) : null;
  const replayObj = replay?.object ? S(replay.object) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-auto w-full touch-none select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      role="img"
      aria-label="Snooker coach table"
    >
      <defs>
        <radialGradient id="felt" cx="50%" cy="35%" r="90%">
          <stop offset="0%" stopColor="#123c2b" />
          <stop offset="60%" stopColor="#0d2f22" />
          <stop offset="100%" stopColor="#082018" />
        </radialGradient>
        <radialGradient id="rail" cx="50%" cy="0%" r="120%">
          <stop offset="0%" stopColor="#123527" />
          <stop offset="100%" stopColor="#0a241b" />
        </radialGradient>
        <radialGradient id="ballGloss" cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </radialGradient>
      </defs>

      {/* wooden frame */}
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={30} fill="#0a0806" />
      <rect
        x={4}
        y={4}
        width={VIEW_W - 8}
        height={VIEW_H - 8}
        rx={26}
        fill="none"
        stroke="rgba(226,185,106,0.18)"
        strokeWidth={1}
      />
      {/* cushion rail */}
      <rect
        x={CUSHION * 0.5}
        y={CUSHION * 0.5}
        width={PLAY.x1 + CUSHION}
        height={PLAY.y1 + CUSHION}
        rx={14}
        fill="url(#rail)"
      />
      {/* felt */}
      <rect
        x={OX}
        y={OY}
        width={PLAY.x1}
        height={PLAY.y1}
        fill="url(#felt)"
      />

      {/* baulk line + spot */}
      <line
        x1={OX + BAULK_LINE.x}
        y1={OY}
        x2={OX + BAULK_LINE.x}
        y2={OY + PLAY.y1}
        stroke="rgba(244,239,230,0.10)"
        strokeWidth={2}
      />
      <circle
        cx={OX + BAULK_SPOT.x}
        cy={OY + BAULK_SPOT.y}
        r={4}
        fill="rgba(244,239,230,0.16)"
      />

      {/* pockets */}
      {POCKETS.map((p) => {
        const s = S(p.pos);
        return (
          <g key={p.id}>
            <circle cx={s.x} cy={s.y} r={p.r + 4} fill="#000" opacity={0.9} />
            <circle
              cx={s.x}
              cy={s.y}
              r={p.r}
              fill="#050505"
              stroke="rgba(226,185,106,0.35)"
              strokeWidth={1.5}
            />
          </g>
        );
      })}

      {/* all candidate paths (faint) */}
      {paths
        .filter((p) => p.id !== selectedPathId)
        .map((p) => (
          <polyline
            key={`alt-${p.id}`}
            points={p.cuePolyline.map((v) => `${S(v).x},${S(v).y}`).join(" ")}
            fill="none"
            stroke="var(--color-muted, #8a8f8c)"
            strokeWidth={1.5}
            strokeDasharray="4 6"
            opacity={0.28}
          />
        ))}

      {/* selected / best path (highlighted) */}
      {(selectedPath ?? (paths.length ? bestPath : undefined)) &&
        (() => {
          const p = selectedPath ?? bestPath!;
          const sp = p.cuePolyline.map(S);
          const op = p.objectPolyline.map(S);
          const ghost = S(p.ghost);
          // extend the cue line to the object's contact point (midpoint of
          // ghost centre and object centre) so it visibly reaches the ball
          const last = sp[sp.length - 1];
          const contact = {
            x: (last.x + op[0].x) / 2,
            y: (last.y + op[0].y) / 2,
          };
          const cuePts = [...sp, contact];
          return (
            <g>
              {/* object run */}
              <line
                x1={op[0].x}
                y1={op[0].y}
                x2={op[op.length - 1].x}
                y2={op[op.length - 1].y}
                stroke="var(--color-gold, #f59e0b)"
                strokeWidth={3}
                strokeDasharray="10 8"
                opacity={0.8}
              />
              {/* cue path (extended to the object contact point) */}
              <polyline
                points={cuePts.map((v) => `${v.x},${v.y}`).join(" ")}
                fill="none"
                stroke="var(--color-primary, #16c784)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              {/* bounce markers */}
              {p.cushionNotes.map((n, i) => {
                const s = S(n.point);
                return (
                  <g key={`b-${i}`}>
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={9}
                      fill="var(--color-primary, #16c784)"
                      stroke="#000"
                      strokeWidth={1.5}
                    />
                    <circle cx={s.x} cy={s.y} r={3.5} fill="#000" />
                  </g>
                );
              })}
              {/* ghost ball */}
              {hintLevel >= 2 && (
                <circle
                  cx={ghost.x}
                  cy={ghost.y}
                  r={BALL_R}
                  fill="none"
                  stroke="var(--color-primary, #16c784)"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  opacity={0.95}
                />
              )}
              {/* aim crosshair (first target) */}
              {hintLevel >= 1 &&
                (() => {
                  const a = S(p.cushionNotes.length ? p.cushionNotes[0].point : p.ghost);
                  return (
                    <g stroke="var(--color-gold, #f59e0b)" strokeWidth={2.5} opacity={0.95}>
                      <line x1={a.x - 14} y1={a.y} x2={a.x + 14} y2={a.y} />
                      <line x1={a.x} y1={a.y - 14} x2={a.x} y2={a.y + 14} />
                      <circle cx={a.x} cy={a.y} r={9} fill="none" />
                    </g>
                  );
                })()}
            </g>
          );
        })()}

      {/* user aim line (Shot Analyzer) */}
      {aimLine && (
        <g>
          <line
            x1={S(aimLine.from).x}
            y1={S(aimLine.from).y}
            x2={S(aimLine.to).x}
            y2={S(aimLine.to).y}
            stroke="var(--color-info, #7fb3ff)"
            strokeWidth={3}
            strokeDasharray="2 5"
            opacity={0.95}
          />
          <circle
            cx={S(aimLine.to).x}
            cy={S(aimLine.to).y}
            r={7}
            fill="var(--color-info, #7fb3ff)"
          />
        </g>
      )}

      {/* balls */}
      {balls.map((b) => {
        const isCue = b.id === COACH_CUE_ID;
        const isObj = b.id === objectId;
        const pos = S(b.pos);
        const dim = replayCue && isCue ? 0.15 : 1;
        const dimObj = replayObj && isObj ? 0.15 : 1;
        return (
          <g
            key={b.id}
            opacity={dim * dimObj}
            onPointerDown={startDrag(b.id)}
            onClick={() => {
              if (!isCue) setObjectBall(b.id);
            }}
            style={{ cursor: "grab" }}
          >
            {(isObj || hoverId === b.id) && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BALL_R + 5}
                fill="none"
                stroke={isObj ? "var(--color-gold, #f59e0b)" : "rgba(244,239,230,0.5)"}
                strokeWidth={2}
                strokeDasharray={isObj ? undefined : "4 4"}
                opacity={0.9}
              />
            )}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={BALL_R}
              fill={BALL_COLORS[b.color]}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={1}
              onPointerEnter={() => setHoverId(b.id)}
              onPointerLeave={() => setHoverId(null)}
            />
            <circle cx={pos.x} cy={pos.y} r={BALL_R} fill="url(#ballGloss)" />
            {isObj && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BALL_R - 6}
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}

      {/* replay overlays */}
      {replayCue && (
        <circle
          cx={replayCue.x}
          cy={replayCue.y}
          r={BALL_R}
          fill={BALL_COLORS.cue}
          stroke="var(--color-info, #7fb3ff)"
          strokeWidth={3}
        />
      )}
      {replayObj && (
        <circle
          cx={replayObj.x}
          cy={replayObj.y}
          r={BALL_R}
          fill={BALL_COLORS[balls.find((b) => b.id === objectId)?.color ?? "black"]}
          stroke="var(--color-gold, #f59e0b)"
          strokeWidth={3}
        />
      )}
    </svg>
  );
}
