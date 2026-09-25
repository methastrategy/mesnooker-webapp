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

  const showGrid = useCoachStore((s) => s.showGrid);
  const targetMode = useCoachStore((s) => s.targetMode);

  const selectedPath: SolvePath | undefined = paths.find(
    (p) => p.id === selectedPathId
  );
  const bestPath = paths.find((p) => !p.blocked) ?? paths[0];

  // ── pointer → table coordinates ────────────────────────────────────────
  const toTable = useCallback((clientX: number, clientY: number): Vec => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
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

      {/* ── Table Grid & Subdivisions ────────────────────────────────────── */}
      {showGrid && (
        <g opacity={0.65}>
          {/* 1/4, 1/2, 3/4 Section Grid Lines */}
          <line x1={OX + 300} y1={OY} x2={OX + 300} y2={OY + PLAY.y1} stroke="rgba(244,239,230,0.12)" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={OX + 600} y1={OY} x2={OX + 600} y2={OY + PLAY.y1} stroke="rgba(244,239,230,0.22)" strokeWidth={1.5} strokeDasharray="6 4" />
          <line x1={OX + 900} y1={OY} x2={OX + 900} y2={OY + PLAY.y1} stroke="rgba(244,239,230,0.12)" strokeWidth={1} strokeDasharray="4 4" />

          <line x1={OX} y1={OY + 150} x2={OX + PLAY.x1} y2={OY + 150} stroke="rgba(244,239,230,0.12)" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={OX} y1={OY + 300} x2={OX + PLAY.x1} y2={OY + 300} stroke="rgba(244,239,230,0.22)" strokeWidth={1.5} strokeDasharray="6 4" />
          <line x1={OX} y1={OY + 450} x2={OX + PLAY.x1} y2={OY + 450} stroke="rgba(244,239,230,0.12)" strokeWidth={1} strokeDasharray="4 4" />

          {/* Pocket-to-Pocket Diagonal Guide Lines */}
          <line x1={OX} y1={OY} x2={OX + PLAY.x1} y2={OY + PLAY.y1} stroke="rgba(226,185,106,0.25)" strokeWidth={1} strokeDasharray="5 5" />
          <line x1={OX} y1={OY + PLAY.y1} x2={OX + PLAY.x1} y2={OY} stroke="rgba(226,185,106,0.25)" strokeWidth={1} strokeDasharray="5 5" />

          {/* Pocket Alignment Lines */}
          <line x1={OX + 600} y1={OY} x2={OX + 600} y2={OY + PLAY.y1} stroke="rgba(226,185,106,0.25)" strokeWidth={1} strokeDasharray="3 3" />

          {/* Baulk Line & D-Zone Arc */}
          <line x1={OX + 330} y1={OY} x2={OX + 330} y2={OY + PLAY.y1} stroke="rgba(244,239,230,0.35)" strokeWidth={1.5} />
          <path d={`M ${OX + 330} ${OY + 300 - 110} A 110 110 0 0 0 ${OX + 330} ${OY + 300 + 110}`} fill="none" stroke="rgba(244,239,230,0.35)" strokeWidth={1.5} />

          {/* Spots Markers */}
          {[
            { x: 330, y: 410, label: "Yellow" },
            { x: 330, y: 190, label: "Green" },
            { x: 330, y: 300, label: "Brown" },
            { x: 600, y: 300, label: "Blue" },
            { x: 900, y: 300, label: "Pink" },
            { x: 1080, y: 300, label: "Black" },
          ].map((sp, idx) => (
            <g key={idx}>
              <circle cx={OX + sp.x} cy={OY + sp.y} r={3} fill="rgba(244,239,230,0.5)" />
              <circle cx={OX + sp.x} cy={OY + sp.y} r={7} fill="none" stroke="rgba(244,239,230,0.25)" strokeWidth={1} />
            </g>
          ))}
        </g>
      )}

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
            opacity={0.25}
          />
        ))}

      {/* selected / best path (highlighted) */}
      {(selectedPath ?? (paths.length ? bestPath : undefined)) &&
        (() => {
          const p = selectedPath ?? bestPath!;
          const sp = p.cuePolyline.map(S);
          const op = p.objectPolyline.map(S);
          const ghost = S(p.ghost);

          return (
            <g>
              {/* object ball run / reaction line */}
              {op.length > 1 && (
                <line
                  x1={op[0].x}
                  y1={op[0].y}
                  x2={op[op.length - 1].x}
                  y2={op[op.length - 1].y}
                  stroke="var(--color-gold, #f59e0b)"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  opacity={0.8}
                />
              )}
              {/* cue ball escape path (dashed line for snooker escape) */}
              <polyline
                points={sp.map((v) => `${v.x},${v.y}`).join(" ")}
                fill="none"
                stroke="var(--color-primary, #16c784)"
                strokeWidth={3.5}
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              {/* bounce markers with angle labels */}
              {p.cushionNotes.map((n, i) => {
                const s = S(n.point);
                return (
                  <g key={`b-${i}`}>
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={10}
                      fill="var(--color-primary, #16c784)"
                      stroke="#000"
                      strokeWidth={1.5}
                    />
                    <text
                      x={s.x}
                      y={s.y + 3.5}
                      textAnchor="middle"
                      fill="#000"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {i + 1}
                    </text>
                    <rect
                      x={s.x - 16}
                      y={n.side === "b" ? s.y + 12 : s.y - 24}
                      width={32}
                      height={14}
                      rx={4}
                      fill="rgba(0,0,0,0.75)"
                      stroke="rgba(226,185,106,0.5)"
                      strokeWidth={1}
                    />
                    <text
                      x={s.x}
                      y={n.side === "b" ? s.y + 22 : s.y - 14}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {Math.round(n.angleDeg)}°
                    </text>
                  </g>
                );
              })}
              {/* ghost ball (contact position) */}
              {hintLevel >= 1 && (
                <circle
                  cx={ghost.x}
                  cy={ghost.y}
                  r={BALL_R}
                  fill="none"
                  stroke="var(--color-primary, #16c784)"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  opacity={0.95}
                />
              )}
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
