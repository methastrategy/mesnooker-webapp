"use client";

import { useEffect, useState } from "react";

/** Live-updating elapsed time (mm:ss or h:mm:ss) since a start timestamp. */
export function useElapsed(startAt?: number): string {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!startAt) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startAt]);
  if (!startAt) return "0:00";
  return fmt(Date.now() - startAt);
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}