"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { avatarSource } from "@/lib/avatar";

function compressImage(file: File, maxDim = 128, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load error"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webp = canvas.toDataURL("image/webp", quality);
          if (webp.startsWith("data:image/webp")) {
            resolve(webp);
            return;
          }
        } catch {
          /* fall back */
        }
        const fallbackMime = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(fallbackMime, quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  async function readFile(file?: File) {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
      setOpen(false);
    } catch {
      // Fallback: direct arrayBuffer if canvas fails
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
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button type="button" onClick={() => setOpen((prev) => !prev)} aria-label="Choose avatar">
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
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}