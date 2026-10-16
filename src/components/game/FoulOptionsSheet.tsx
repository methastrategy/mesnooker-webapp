"use client";

import * as React from "react";
import { useState } from "react";
import { RotateCw, Sparkles, Check } from "lucide-react";
import { Sheet, Button } from "@/components/ui";
import { BALL_HEX } from "@/lib/rules";
import type { GameMode } from "@/types";

interface FoulOptionsSheetProps {
  open: boolean;
  onClose: () => void;
  mode: GameMode;
  onApplyFoul: (points: number, playAgain: boolean) => void;
  onActivateFreeBall: () => void;
}

export function FoulOptionsSheet({
  open,
  onClose,
  mode,
  onApplyFoul,
  onActivateFreeBall,
}: FoulOptionsSheetProps) {
  const [playAgain, setPlayAgain] = useState(false);

  const foulTiers = [
    {
      title: "Standard / Red / Yellow / Green / Brown",
      desc: mode === "points" ? "ลูกแดง หรือลูกสีเหลือง เขียว น้ำตาล (4 แต้ม)" : "ลูกแดง หรือลูกสีเหลือง เขียว น้ำตาล (เสีย 2 ลูก)",
      points: mode === "points" ? 4 : 2,
      display: mode === "points" ? "−4" : "−2",
      colors: [BALL_HEX.red, BALL_HEX.yellow, BALL_HEX.green, BALL_HEX.brown],
    },
    {
      title: "Blue Ball Foul",
      desc: mode === "points" ? "ฟาวล์เกี่ยวกับลูกน้ำเงิน (5 แต้ม)" : "ฟาวล์เกี่ยวกับลูกน้ำเงิน (เสีย 2 ลูก)",
      points: mode === "points" ? 5 : 2,
      display: mode === "points" ? "−5" : "−2",
      colors: [BALL_HEX.blue],
    },
    {
      title: "Pink Ball Foul",
      desc: mode === "points" ? "ฟาวล์เกี่ยวกับลูกชมพู (6 แต้ม)" : "ฟาวล์เกี่ยวกับลูกชมพู (เสีย 2 ลูก)",
      points: mode === "points" ? 6 : 2,
      display: mode === "points" ? "−6" : "−2",
      colors: [BALL_HEX.pink],
    },
    {
      title: "Black Ball / White Scratch Foul",
      desc: mode === "points" ? "ฟาวล์เกี่ยวกับลูกดำ หรือขาวเปลี่ยนลงหลุม (7 แต้ม)" : "ฟาวล์เกี่ยวกับลูกดำ หรือขาวเปลี่ยนลงหลุม (เสีย 2 ลูก)",
      points: mode === "points" ? 7 : 2,
      display: mode === "points" ? "−7" : "−2",
      colors: [BALL_HEX.black, "#f8fafc"],
    },
  ];

  const handleSelectTier = (points: number) => {
    onApplyFoul(points, playAgain);
    setPlayAgain(false);
    onClose();
  };

  const handleFreeBall = () => {
    onActivateFreeBall();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Foul Options (บันทึกฟาวล์ละเอียด)">
      <div className="flex flex-col gap-4 py-1 select-none">
        {/* Play Again Toggle */}
        <div
          onClick={() => setPlayAgain((prev) => !prev)}
          className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-surface/80 hover:bg-surface transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              playAgain ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-muted/40 border-border text-muted-foreground"
            }`}>
              <RotateCw size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-foreground">
                ให้คนเดิมแทงซ้ำ (Play Again)
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                ผู้เล่นคนถัดไปสั่งให้ผู้แทงที่ฟาวล์ แทงต่อจากตำแหน่งเดิม
              </span>
            </div>
          </div>
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
            playAgain ? "bg-amber-500 border-amber-500 text-stone-950" : "border-border/80 bg-black/20"
          }`}>
            {playAgain && <Check size={14} className="stroke-[3]" />}
          </div>
        </div>

        {/* Penalty Value Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            เลือกแต้มเสียฟาวล์ (Select Penalty)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {foulTiers.map((tier) => (
              <button
                key={tier.title}
                type="button"
                onClick={() => handleSelectTier(tier.points)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 hover:border-destructive/60 transition-all text-left cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1 shrink-0">
                    {tier.colors.map((c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-destructive transition-colors">
                      {tier.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {tier.desc}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span className="font-mono text-base sm:text-lg font-black text-destructive tabular-nums">
                    {tier.display}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Free Ball Declaration */}
        <div className="pt-2 border-t border-border/70 flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            กติกาพิเศษเมื่อถูกสนุ๊กเกอร์หลังฟาวล์
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={handleFreeBall}
            className="h-12 w-full rounded-2xl border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>ประกาศฟรีบอล (Nominate Free Ball)</span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
