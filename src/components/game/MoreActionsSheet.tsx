"use client";

import * as React from "react";
import { useState } from "react";
import { Undo2, Redo2, RotateCcw, RotateCw, Flag, Sparkles, SlidersHorizontal, AlertTriangle, ShieldAlert } from "lucide-react";
import { Sheet, ActionButton, Button } from "@/components/ui";

interface MoreActionsSheetProps {
  open: boolean;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onEndFrame: () => void;
  onReRack?: () => void;
  onConcede?: () => void;
  onOpenFoulOptions?: () => void;
  onPlayAgain?: () => void;
  onToggleFreeBall?: () => void;
  freeBallActive?: boolean;
}

export function MoreActionsSheet({
  open,
  onClose,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onEndFrame,
  onReRack,
  onConcede,
  onOpenFoulOptions,
  onPlayAgain,
  onToggleFreeBall,
  freeBallActive = false,
}: MoreActionsSheetProps) {
  const [confirmAction, setConfirmAction] = useState<"endFrame" | "rerack" | "concede" | null>(null);

  const handleClose = () => {
    setConfirmAction(null);
    onClose();
  };

  const handleConfirmEndFrame = () => {
    setConfirmAction(null);
    onClose();
    onEndFrame();
  };

  const handleConfirmReRack = () => {
    setConfirmAction(null);
    onClose();
    onReRack?.();
  };

  const handleConfirmConcede = () => {
    setConfirmAction(null);
    onClose();
    onConcede?.();
  };

  return (
    <Sheet open={open} onClose={handleClose} title="More Match Actions (ตัวเลือกเพิ่มเติม)">
      <div className="flex flex-col gap-4 py-1 select-none">
        {/* ─── Confirmation Overlay Modal ─── */}
        {confirmAction && (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 flex flex-col gap-3 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive border border-destructive/40">
                <AlertTriangle size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-black text-foreground">
                  {confirmAction === "endFrame" && "ยืนยันจบเฟรมนี้? (Confirm End Frame)"}
                  {confirmAction === "rerack" && "ยืนยันขอเริ่มเฟรมใหม่? (Confirm Re-rack)"}
                  {confirmAction === "concede" && "ยืนยันขอยอมแพ้เฟรมนี้? (Confirm Concede)"}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {confirmAction === "endFrame" &&
                    "จะสรุปแต้มและคิดเงินได้เสียของเฟรมนี้ และไปที่หน้าสรุปผลเฟรม (สามารถกดยกเลิกหรือ Undo ภายหลังได้)"}
                  {confirmAction === "rerack" &&
                    "จะรีเซ็ตลูกทั้งหมดและแต้มในเฟรมนี้กลับเป็น 0-0 โดยไม่มีการคิดเงินได้เสีย"}
                  {confirmAction === "concede" &&
                    "จะมอบชัยชนะเฟรมนี้ให้แก่ผู้เล่นที่มีคะแนนนำอยู่ และคิดเงินตามคะแนนปัจจุบัน"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-destructive/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmAction(null)}
                className="h-10 px-4 rounded-xl text-xs font-semibold"
              >
                Cancel / ยกเลิก
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={
                  confirmAction === "endFrame"
                    ? handleConfirmEndFrame
                    : confirmAction === "rerack"
                    ? handleConfirmReRack
                    : handleConfirmConcede
                }
                className="h-10 px-4 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {confirmAction === "endFrame" && "Confirm End Frame / ยืนยันจบเฟรม"}
                {confirmAction === "rerack" && "Confirm Re-rack / ยืนยันเริ่มใหม่"}
                {confirmAction === "concede" && "Confirm Concede / ยืนยันยอมแพ้"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Section 1: Undo & Redo Quick Controls ─── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            แก้ไขการกดพลาด (History Controls)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <ActionButton
              tone="outline"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo last action"
              className="h-14 flex-col gap-0.5 rounded-[18px] border-border/80"
            >
              <div className="flex items-center gap-1.5">
                <Undo2 size={18} className={canUndo ? "text-primary" : "text-muted-foreground"} />
                <span className="text-xs font-bold uppercase tracking-wider">Undo</span>
                <kbd className="hidden sm:inline-flex text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-foreground/70 border border-white/10 leading-none">
                  U
                </kbd>
              </div>
              <span className="text-[10px] text-muted-foreground">ย้อนกลับ 1 จังหวะ</span>
            </ActionButton>

            <ActionButton
              tone="outline"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo last action"
              className="h-14 flex-col gap-0.5 rounded-[18px] border-border/80"
            >
              <div className="flex items-center gap-1.5">
                <Redo2 size={18} className={canRedo ? "text-primary" : "text-muted-foreground"} />
                <span className="text-xs font-bold uppercase tracking-wider">Redo</span>
              </div>
              <span className="text-[10px] text-muted-foreground">ทำซ้ำจังหวะเดิม</span>
            </ActionButton>
          </div>
        </div>

        {/* ─── Section 2: Advanced Snooker Tactical Rules ─── */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/70">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            กติกาสนุ๊กเกอร์สากล (Tactical Controls)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Free Ball Toggle */}
            <button
              type="button"
              onClick={onToggleFreeBall}
              className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                freeBallActive
                  ? "border-amber-400 bg-amber-500/20 text-amber-200"
                  : "border-border/80 bg-surface/75 hover:bg-surface text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className={freeBallActive ? "text-amber-400" : "text-muted-foreground"} />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold">ฟรีบอล (Free Ball)</span>
                  <span className="text-[10px] text-muted-foreground">
                    {freeBallActive ? "เปิดใช้งานอยู่ · ตบสีใดก็ได้ = +1" : "ถูกสนุ๊กเกอร์หลังฟาวล์"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                freeBallActive ? "bg-amber-400 text-stone-950" : "bg-muted/40 text-muted-foreground"
              }`}>
                {freeBallActive ? "ACTIVE" : "OFF"}
              </span>
            </button>

            {/* Play Again */}
            <button
              type="button"
              onClick={() => {
                onPlayAgain?.();
                onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-surface/75 hover:bg-surface text-foreground text-left transition-all cursor-pointer shadow-xs"
            >
              <RotateCw size={18} className="text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold">ให้แทงซ้ำ (Play Again)</span>
                <span className="text-[10px] text-muted-foreground">ให้คนทำฟาวล์แทงต่อจุดเดิม</span>
              </div>
            </button>
          </div>

          {/* Detailed Foul Options */}
          {onOpenFoulOptions && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFoulOptions();
              }}
              className="flex items-center justify-between p-3 rounded-2xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-foreground text-left transition-all cursor-pointer shadow-xs mt-1"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={18} className="text-destructive shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold">ฟาวล์ลูกสีละเอียด (Foul Options)</span>
                  <span className="text-[10px] text-muted-foreground">ฟาวล์น้ำเงิน (−5), ชมพู (−6), ดำ/ขาวเปลี่ยน (−7)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-destructive">4–7 pts →</span>
            </button>
          )}
        </div>

        {/* ─── Section 3: Frame Governance ─── */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/70">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            การจัดการเฟรม (Frame Governance)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Re-rack */}
            <button
              type="button"
              onClick={() => setConfirmAction("rerack")}
              className="flex items-center sm:flex-col justify-start sm:justify-center p-3 rounded-2xl border border-border/80 bg-surface/60 hover:bg-surface text-left sm:text-center transition-all cursor-pointer shadow-xs gap-2"
            >
              <RotateCcw size={16} className="text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">ขอเริ่มเฟรมใหม่</span>
                <span className="text-[10px] text-muted-foreground">Re-rack (0-0)</span>
              </div>
            </button>

            {/* Concede */}
            <button
              type="button"
              onClick={() => setConfirmAction("concede")}
              className="flex items-center sm:flex-col justify-start sm:justify-center p-3 rounded-2xl border border-border/80 bg-surface/60 hover:bg-surface text-left sm:text-center transition-all cursor-pointer shadow-xs gap-2"
            >
              <ShieldAlert size={16} className="text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">ขอยอมแพ้</span>
                <span className="text-[10px] text-muted-foreground">Concede Frame</span>
              </div>
            </button>

            {/* End Frame (Safe with confirmation dialog) */}
            <button
              type="button"
              onClick={() => setConfirmAction("endFrame")}
              aria-label="End current frame"
              title="End current frame"
              className="flex items-center sm:flex-col justify-start sm:justify-center p-3 rounded-2xl border border-destructive/40 bg-destructive/15 hover:bg-destructive/25 text-left sm:text-center transition-all cursor-pointer shadow-xs gap-2 group"
            >
              <Flag size={16} className="text-destructive group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-destructive uppercase tracking-wide">จบเฟรม</span>
                <span className="text-[10px] text-muted-foreground">End Frame</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}