/**
 * Built-in avatar presets (emoji-based, no external assets needed). */
export const AVATAR_PRESETS: string[] = [
  "🎱", "🍀", "🔥", "🦁", "⚡", "👑", "🐯", "🦅", "🌙", "💎",
];

/** Gallery option added to the preset list (extra choices). */
export const AVATAR_GALLERY: string[] = [
  "😎", "🤠", "😈", "🤖", "🐉", "🦄", "🍺", "🥇", "💀", "🐺",
];

/** Color palette used for avatar backgrounds (by index). */
export const AVATAR_BG: string[] = [
  "#16c784", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899",
  "#22c55e", "#8b5cf6", "#0ea5e9", "#f43f5e", "#14b8a6",
];

/**
 * Render an avatar: if it's a data:/http(s): URL (uploaded image) show the
 * image; otherwise treat it as an emoji glyph on a colored background.
 */
export function avatarSource(avatar: string | undefined): { src?: string; glyph?: string; bg: string } {
  const bg = AVATAR_BG[Math.abs(hash(avatar ?? "")) % AVATAR_BG.length];
  if (!avatar) return { glyph: "🎱", bg };
  if (avatar.startsWith("data:") || avatar.startsWith("http")) {
    return { src: avatar, bg };
  }
  return { glyph: avatar, bg };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}