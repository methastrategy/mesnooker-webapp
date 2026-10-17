"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Download, Copy, Check, Edit3, ArrowRight, ShieldCheck } from "lucide-react";
import type { Player } from "@/types";
import { formatMoney } from "@/lib/utils";
import {
  generatePromptPayQrDataUrl,
  validatePromptPayTarget,
} from "@/lib/promptpay";
import { AvatarBubble } from "@/components/game/AvatarPicker";
import { Button } from "@/components/ui";

interface PromptPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromPlayer?: Player;
  toPlayer: Player;
  amount: number;
  onMarkPaid: () => void;
  onUpdatePromptPay?: (playerId: string, promptpayId: string) => void;
}

export function PromptPayModal({
  isOpen,
  onClose,
  fromPlayer,
  toPlayer,
  amount,
  onMarkPaid,
  onUpdatePromptPay,
}: PromptPayModalProps) {
  const [inputTarget, setInputTarget] = useState(toPlayer.promptpayId ?? "");
  const [isEditing, setIsEditing] = useState(!toPlayer.promptpayId);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync state when target player changes
  useEffect(() => {
    if (toPlayer.promptpayId) {
      setInputTarget(toPlayer.promptpayId);
      setIsEditing(false);
    } else {
      setInputTarget("");
      setIsEditing(true);
    }
  }, [toPlayer]);

  // Generate QR when target is valid and not editing
  useEffect(() => {
    const activeTarget = isEditing ? null : toPlayer.promptpayId || inputTarget;
    if (!activeTarget || !isOpen) {
      setQrUrl(null);
      return;
    }

    const validation = validatePromptPayTarget(activeTarget);
    if (!validation.valid) {
      setError(validation.error ?? "เบอร์หรือเลขบัญชีไม่ถูกต้อง");
      setQrUrl(null);
      return;
    }

    setError(null);
    setIsGenerating(true);
    generatePromptPayQrDataUrl(validation.sanitized, amount, { width: 280 })
      .then((url) => {
        setQrUrl(url);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "ไม่สามารถสร้าง QR Code ได้");
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [isOpen, isEditing, toPlayer.promptpayId, inputTarget, amount]);

  function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();
    const validation = validatePromptPayTarget(inputTarget);
    if (!validation.valid) {
      setError(validation.error ?? "กรุณาระบุเบอร์โทรหรือเลขบัตร ปชช. ให้ถูกต้อง");
      return;
    }

    setError(null);
    setIsEditing(false);
    onUpdatePromptPay?.(toPlayer.id, validation.formatted);
  }

  async function handleCopyTarget() {
    const target = toPlayer.promptpayId || inputTarget;
    const val = validatePromptPayTarget(target);
    const toCopy = val.valid ? val.sanitized : target;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const activeTargetFormatted = validatePromptPayTarget(toPlayer.promptpayId || inputTarget).formatted;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative w-full max-w-[380px] overflow-hidden rounded-[26px] border border-border/80 bg-card/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* PromptPay Branded Header */}
            <div className="bg-[#003D6D] px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <QrCode size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wider uppercase">PromptPay</div>
                  <div className="text-[10px] text-white/80 font-medium">พร้อมเพย์ สแกนจ่าย</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Transfer Parties & Amount */}
              <div className="rounded-[18px] border border-border/70 bg-surface/60 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {fromPlayer && <AvatarBubble avatar={fromPlayer.avatar} size={20} />}
                    <span className="font-bold text-foreground truncate max-w-[90px]">
                      {fromPlayer?.nickname ?? "Payer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0">
                    <span>โอนให้</span>
                    <ArrowRight size={12} className="text-primary" />
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <AvatarBubble avatar={toPlayer.avatar} size={20} />
                    <span className="font-bold text-foreground truncate max-w-[90px]">
                      {toPlayer.nickname}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-border/50 pt-2">
                  <span className="text-xs text-muted-foreground font-medium">ยอดเงินสุทธิ</span>
                  <div className="text-2xl font-black font-mono tabular-nums text-gold">
                    {formatMoney(amount)}
                  </div>
                </div>
              </div>

              {/* QR Display or Configuration Input */}
              {isEditing ? (
                <form onSubmit={handleSaveTarget} className="flex flex-col gap-3 py-1">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1">
                      ระบุเบอร์พร้อมเพย์ ของ {toPlayer.nickname}
                    </label>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      เบอร์โทรศัพท์ 10 หลัก หรือ เลขประจำตัวประชาชน 13 หลัก
                    </p>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={inputTarget}
                      onChange={(e) => setInputTarget(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      autoFocus
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {error && (
                    <div className="text-xs text-destructive rounded-lg bg-destructive/10 border border-destructive/25 p-2">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {toPlayer.promptpayId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl flex-1 text-xs"
                      >
                        ยกเลิก
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      className="rounded-xl flex-1 text-xs font-bold"
                    >
                      สร้าง QR โค้ด
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {/* QR Box */}
                  <div className="relative flex flex-col items-center justify-center rounded-[20px] bg-white p-3.5 shadow-md border border-neutral-200">
                    {isGenerating ? (
                      <div className="h-[210px] w-[210px] flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/40 border-t-primary" />
                      </div>
                    ) : qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrUrl}
                        alt="PromptPay QR Code"
                        width={210}
                        height={210}
                        className="h-[210px] w-[210px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="h-[210px] w-[210px] flex items-center justify-center text-xs text-muted-foreground">
                        ไม่พบข้อมูล QR
                      </div>
                    )}

                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-mono font-bold text-neutral-800 tracking-tight">
                        {activeTargetFormatted}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center justify-center gap-1 mt-0.5">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        <span>ยอดเงินถูกล็อค {formatMoney(amount)} อัตโนมัติ</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for PromptPay Target */}
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={handleCopyTarget}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface/70 py-2 px-3 text-xs font-medium text-foreground hover:bg-surface cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-primary" />
                          <span className="text-primary font-semibold">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-muted-foreground" />
                          <span>คัดลอกเบอร์</span>
                        </>
                      )}
                    </button>

                    {qrUrl && (
                      <a
                        href={qrUrl}
                        download={`promptpay-${toPlayer.nickname}-${amount}thb.png`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface/70 py-2 px-3 text-xs font-medium text-foreground hover:bg-surface cursor-pointer"
                      >
                        <Download size={13} className="text-muted-foreground" />
                        <span>บันทึกรูป</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      title="แก้ไขเบอร์พร้อมเพย์"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-surface/70 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Payment Confirmation */}
              {!isEditing && (
                <div className="pt-1 flex flex-col gap-2">
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => {
                      onMarkPaid();
                      onClose();
                    }}
                    className="w-full rounded-xl py-3 font-bold text-sm shadow-md"
                  >
                    <Check size={16} />
                    <span>ยืนยันว่าจ่ายแล้ว (Mark as Paid)</span>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
