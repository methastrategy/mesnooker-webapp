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

  const BAULK_X = OX + 330;
  const D_R = 145;
  const D_CY = OY + PLAY.y1 / 2;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-auto w-full touch-none select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      role="img"
      aria-label="Snooker Escape Simulator table"
    >
      <defs>
        <radialGradient id="sss-felt" cx="50%" cy="45%" r="80%">
          <stop offset="0%" stopColor="#249458" />
          <stop offset="45%" stopColor="#1a6e40" />
          <stop offset="85%" stopColor="#12502e" />
          <stop offset="100%" stopColor="#0b3820" />
        </radialGradient>
        <linearGradient id="sss-wood-h" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a25424" />
          <stop offset="35%" stopColor="#8d4219" />
          <stop offset="70%" stopColor="#733210" />
          <stop offset="100%" stopColor="#59240a" />
        </linearGradient>
        <linearGradient id="sss-wood-v" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a25424" />
          <stop offset="35%" stopColor="#8d4219" />
          <stop offset="70%" stopColor="#733210" />
          <stop offset="100%" stopColor="#59240a" />
        </linearGradient>
        <linearGradient id="sss-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3d4044" />
          <stop offset="50%" stopColor="#25272a" />
          <stop offset="100%" stopColor="#18191b" />
        </linearGradient>
        <linearGradient id="sss-cush-tb" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2ea36b" />
          <stop offset="30%" stopColor="#238254" />
          <stop offset="100%" stopColor="#145233" />
        </linearGradient>
        <linearGradient id="sss-cush-lr" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2ea36b" />
          <stop offset="30%" stopColor="#238254" />
          <stop offset="100%" stopColor="#145233" />
        </linearGradient>
        <radialGradient id="sss-gloss" cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.80)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.40)" />
        </radialGradient>
        <radialGradient id="sss-pocket" cx="40%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <filter id="midglow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pathglow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Table Outer Body (Wood & Corner Castings) ────────────────────────── */}
      {/* Base Wood Frame */}
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={16} fill="url(#sss-wood-h)" />
      
      {/* Top Wood Rails */}
      <rect x={OX + 24} y={0} width={550} height={CUSHION} fill="url(#sss-wood-h)" />
      <rect x={OX + 626} y={0} width={550} height={CUSHION} fill="url(#sss-wood-h)" />
      {/* Bottom Wood Rails */}
      <rect x={OX + 24} y={OY + PLAY.y1} width={550} height={CUSHION} fill="url(#sss-wood-h)" />
      <rect x={OX + 626} y={OY + PLAY.y1} width={550} height={CUSHION} fill="url(#sss-wood-h)" />
      {/* Left & Right Wood Rails */}
      <rect x={0} y={OY + 24} width={CUSHION} height={PLAY.y1 - 48} fill="url(#sss-wood-v)" />
      <rect x={OX + PLAY.x1} y={OY + 24} width={CUSHION} height={PLAY.y1 - 48} fill="url(#sss-wood-v)" />

      {/* Metallic Corner & Middle Pocket Castings */}
      {/* Top-Left Corner */}
      <path d={`M 0 0 L ${OX + 24} 0 L ${OX + 24} ${OY + 24} L 0 ${OY + 24} Z`} fill="url(#sss-metal)" />
      {/* Top-Right Corner */}
      <path d={`M ${VIEW_W - (OX + 24)} 0 L ${VIEW_W} 0 L ${VIEW_W} ${OY + 24} L ${VIEW_W - (OX + 24)} ${OY + 24} Z`} fill="url(#sss-metal)" />
      {/* Bottom-Left Corner */}
      <path d={`M 0 ${VIEW_H - (OY + 24)} L ${OX + 24} ${VIEW_H - (OY + 24)} L ${OX + 24} ${VIEW_H} L 0 ${VIEW_H} Z`} fill="url(#sss-metal)" />
      {/* Bottom-Right Corner */}
      <path d={`M ${VIEW_W - (OX + 24)} ${VIEW_H - (OY + 24)} L ${VIEW_W} ${VIEW_H - (OY + 24)} L ${VIEW_W} ${VIEW_H} L ${VIEW_W - (OX + 24)} ${VIEW_H} Z`} fill="url(#sss-metal)" />
      {/* Top-Middle Pocket Cap */}
      <rect x={OX + 574} y={0} width={52} height={OY + 14} rx={6} fill="url(#sss-metal)" />
      {/* Bottom-Middle Pocket Cap */}
      <rect x={OX + 574} y={OY + PLAY.y1 - 14} width={52} height={OY + 14} rx={6} fill="url(#sss-metal)" />

      {/* Inlaid Pearl Sight Dots on Wood Rails (Diamonds / Dots) */}
      {[
        // Top Rail Sights
        { x: 150, y: OY / 2 }, { x: 300, y: OY / 2 }, { x: 450, y: OY / 2 },
        { x: 750, y: OY / 2 }, { x: 900, y: OY / 2 }, { x: 1050, y: OY / 2 },
        // Bottom Rail Sights
        { x: 150, y: OY + PLAY.y1 + OY / 2 }, { x: 300, y: OY + PLAY.y1 + OY / 2 }, { x: 450, y: OY + PLAY.y1 + OY / 2 },
        { x: 750, y: OY + PLAY.y1 + OY / 2 }, { x: 900, y: OY + PLAY.y1 + OY / 2 }, { x: 1050, y: OY + PLAY.y1 + OY / 2 },
        // Left Rail Sights
        { x: OX / 2, y: OY + 150 }, { x: OX / 2, y: OY + 300 }, { x: OX / 2, y: OY + 450 },
        // Right Rail Sights
        { x: OX + PLAY.x1 + OX / 2, y: OY + 150 }, { x: OX + PLAY.x1 + OX / 2, y: OY + 300 }, { x: OX + PLAY.x1 + OX / 2, y: OY + 450 },
      ].map((dot, idx) => (
        <circle key={`sight-${idx}`} cx={dot.x > OX ? dot.x : dot.x} cy={dot.y} r={3.2} fill="#ffffff" stroke="rgba(0,0,0,0.4)" strokeWidth={0.8} />
      ))}

      {/* ── Cushion Rubber Rails ────────────────────────────────────────── */}
      <rect x={OX - 2} y={OY - CUSHION} width={PLAY.x1 + 4} height={CUSHION + 1} fill="url(#sss-cush-tb)" />
      <rect x={OX - 2} y={OY + PLAY.y1 - 1} width={PLAY.x1 + 4} height={CUSHION + 2} fill="url(#sss-cush-tb)" />
      <rect x={OX - CUSHION} y={OY - 2} width={CUSHION + 1} height={PLAY.y1 + 4} fill="url(#sss-cush-lr)" />
      <rect x={OX + PLAY.x1 - 1} y={OY - 2} width={CUSHION + 2} height={PLAY.y1 + 4} fill="url(#sss-cush-lr)" />
      <line x1={OX} y1={OY - CUSHION} x2={OX + PLAY.x1} y2={OY - CUSHION} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
      <line x1={OX} y1={OY + PLAY.y1 + CUSHION} x2={OX + PLAY.x1} y2={OY + PLAY.y1 + CUSHION} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line x1={OX - CUSHION} y1={OY} x2={OX - CUSHION} y2={OY + PLAY.y1} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
      <line x1={OX + PLAY.x1 + CUSHION} y1={OY} x2={OX + PLAY.x1 + CUSHION} y2={OY + PLAY.y1} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

      {/* ── Green Felt Playing Surface ──────────────────────────────────── */}
      <rect x={OX} y={OY} width={PLAY.x1} height={PLAY.y1} fill="url(#sss-felt)" />

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
        </g>
      )}

      {/* Standard markings */}
      <g opacity={0.72}>
        <line x1={BAULK_X} y1={OY} x2={BAULK_X} y2={OY + PLAY.y1} stroke="rgba(240,232,210,0.35)" strokeWidth={1.8} />
        <path d={`M ${BAULK_X} ${D_CY - D_R} A ${D_R} ${D_R} 0 0 0 ${BAULK_X} ${D_CY + D_R}`} fill="none" stroke="rgba(240,232,210,0.35)" strokeWidth={1.8} />
        {[
          { x: 330, y: 190 },
          { x: 330, y: 410 },
          { x: 330, y: 300 },
          { x: 600, y: 300 },
          { x: 900, y: 300 },
          { x: 1080, y: 300 },
        ].map((sp, i) => (
          <g key={i}>
            <circle cx={OX + sp.x} cy={OY + sp.y} r={3.5} fill="rgba(240,232,210,0.55)" />
            <circle cx={OX + sp.x} cy={OY + sp.y} r={8} fill="none" stroke="rgba(240,232,210,0.18)" strokeWidth={1} />
          </g>
        ))}
      </g>

      {/* ── 6 Pockets ─────────────────────────────────────────────────── */}
      {POCKETS.map((pk) => {
        const sp = S(pk.pos);
        return (
          <g key={pk.id}>
            <circle cx={sp.x} cy={sp.y} r={pk.r + 6} fill="#000" opacity={0.8} />
            <circle cx={sp.x} cy={sp.y} r={pk.r} fill="url(#sss-pocket)" stroke="rgba(207,163,76,0.55)" strokeWidth={2.2} />
            <circle cx={sp.x} cy={sp.y} r={pk.r - 10} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          </g>
        );
      })}

      {/* ── 6 Cushion Midpoint Markers (จุดกึ่งกลางระหว่างหลุมบนชิ่ง) ────────── */}
      {[
        { x: 300, y: 0, side: "bot", label: "จุดกึ่งกลางชิ่งล่างซ้าย" },
        { x: 900, y: 0, side: "bot", label: "จุดกึ่งกลางชิ่งล่างขวา" },
        { x: 300, y: 600, side: "top", label: "จุดกึ่งกลางชิ่งบนซ้าย" },
        { x: 900, y: 600, side: "top", label: "จุดกึ่งกลางชิ่งบนขวา" },
        { x: 0, y: 300, side: "left", label: "จุดกึ่งกลางชิ่งซ้าย" },
        { x: 1200, y: 300, side: "right", label: "จุดกึ่งกลางชิ่งขวา" },
      ].map((mp, i) => {
        const isH = mp.side === "top" || mp.side === "bot";
        const TL = 10;
        const dx = isH ? 0 : (mp.side === "left" ? TL : -TL);
        const dy = isH ? (mp.side === "bot" ? TL : -TL) : 0;
        const sm = S(mp);
        return (
          <g key={`cush-midpoint-${i}`} filter="url(#midglow)">
            {/* Outer halo */}
            <circle cx={sm.x} cy={sm.y} r={7} fill="rgba(255,215,50,0.25)" />
            {/* Diamond marker */}
            <circle cx={sm.x} cy={sm.y} r={5} fill="rgba(255,215,50,0.98)" stroke="rgba(0,0,0,0.80)" strokeWidth={1.2} />
            {/* Pointer tick extending into felt */}
            <line x1={sm.x} y1={sm.y} x2={sm.x + dx} y2={sm.y + dy} stroke="rgba(255,215,50,0.95)" strokeWidth={2} strokeLinecap="round" />
          </g>
        );
      })}

      {/* Cushion face boundary line */}
      <rect x={OX} y={OY} width={PLAY.x1} height={PLAY.y1} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} />

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
