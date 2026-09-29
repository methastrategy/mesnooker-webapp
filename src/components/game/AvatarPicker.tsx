"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { avatarSource } from "@/lib/avatar";

/** Standalone avatar bubble — used in player cards / picker. */
export function AvatarBubble({
  avatar,
  size = 40,
  selected,
}: {
  avatar?: string;
  size?: number;
  selected?: boolean;
}) {
  const { src, glyph, bg } = avatarSource(avatar);
  const style = {
    width: size,
    height: size,
    borderRadius: "9999px",
    background: bg,
    fontSize: size * 0.52,
  };
  return (
    <span
      className={`flex items-center justify-center overflow-hidden shrink-0 ` +
        (selected ? "ring-2 ring-primary ring-offset-2" : "")}
      style={style}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="avatar" className="h-full w-full object-cover" />
      ) : (
        <span>{glyph}</span>
      )}
    </span>
  );
}

/** Tap an avatar to open a picker: 4 presets + gallery + upload from device / gallery. */
export function AvatarPicker({
  value,
  onChange,
  presets,
  gallery,
}: {
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
  gallery?: string[];
}) {
  const PRE = presets ?? ["🎱", "🍀", "🔥", "🦁"];
  const GAL = gallery ?? ["😎", "🤠", "😈", "🤖", "🐉", "🦄", "🍺", "👑", "💀", "🐺"];
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(file?: File) {
    if (!file) return;
    // FileReader.readAsDataURL is not a shipped browser API — read via
    // arrayBuffer() + base64 so uploaded avatars become data: URLs that
    // avatarSource() renders as images (and that survive reloads).
    if (!file.arrayBuffer) return;
    file
      .arrayBuffer()
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        onChange(`data:${file.type};base64,${btoa(bin)}`);
        setOpen(false);
      })
      .catch(() => {});
  }

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(true)} aria-label="Choose avatar">
        <AvatarBubble avatar={value} size={44} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-50 w-64 rounded-[20px] border border-primary/20 bg-surface/95 p-3.5 backdrop-blur-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="mb-1 text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Quick</div>
            <div className="mb-2 flex flex-wrap gap-2">
              {PRE.map((a) => (
                <button key={a} type="button" onClick={() => { onChange(a); setOpen(false); }} className="text-xl hover:scale-110 active:scale-95 transition-transform" aria-label={`avatar ${a}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="mb-1 text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Gallery</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {GAL.map((a) => (
                <button key={a} type="button" onClick={() => { onChange(a); setOpen(false); }} className="text-lg hover:scale-110 active:scale-95 transition-transform" aria-label={`avatar ${a}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:translate-y-0.5 border border-border px-2.5 py-1.5 text-[11px] font-medium transition-all"
              >
                <Camera size={13} /> Upload
              </button>
              <button
                type="button"
                onClick={() => { onChange(GAL[Math.floor(Math.random() * GAL.length)]); setOpen(false); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:translate-y-0.5 border border-border px-2.5 py-1.5 text-[11px] font-medium transition-all"
              >
                <Images size={13} /> Shuffle
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-full bg-primary/20 hover:bg-primary/30 active:scale-[0.98] py-1.5 text-[12px] font-semibold text-primary transition-all"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}