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
    const reader = new window.FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      onChange(String(reader.result));
      setOpen(false);
    };
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
            className="absolute z-50 w-64 rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Quick</div>
            <div className="mb-2 flex flex-wrap gap-2">
              {PRE.map((a) => (
                <button key={a} type="button" onClick={() => { onChange(a); setOpen(false); }} className="text-xl" aria-label={`avatar ${a}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Gallery</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {GAL.map((a) => (
                <button key={a} type="button" onClick={() => { onChange(a); setOpen(false); }} className="text-lg" aria-label={`avatar ${a}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 text-[11px]"
              >
                <Camera size={14} /> Camera / Upload
              </button>
              <button
                type="button"
                onClick={() => { onChange(GAL[Math.floor(Math.random() * GAL.length)]); setOpen(false); }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 text-[11px]"
              >
                <Images size={14} /> Shuffle
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-1 w-full rounded-lg bg-primary/15 py-1 text-[11px] text-primary"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}