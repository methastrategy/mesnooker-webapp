/**
 * Mesnooker i18n Translation Dictionary
 * Clean bilingual support for Thai and English
 */

export type Locale = "th" | "en";

export const translations = {
  th: {
    // Navigation
    "nav.dashboard": "แดชบอร์ด",
    "nav.match": "กระดานแข่ง",
    "nav.solve": "แก้สนุ๊ก SSS",
    "nav.solve.full": "จำลองแก้สนุ๊กเกอร์ (SSS)",
    "nav.history": "ประวัติ",
    "nav.stats": "สถิติ",
    "nav.settings": "ตั้งค่า",

    // Dashboard
    "dash.title": "ห้องสนุ๊กเกอร์ส่วนตัว",
    "dash.subtitle.live": "มีรอบแข่งขันกำลังดำเนินอยู่บนโต๊ะ",
    "dash.subtitle.idle": "จัดโต๊ะและเริ่มแทงสนุกเกอร์พร้อมระบบคิดเงินอัตโนมัติ",
    "dash.setTable": "จัดโต๊ะเริ่มเล่น",
    "dash.backTable": "กลับไปที่โต๊ะแข่ง",
    "dash.settlement": "สรุปยอดได้เสีย",
    "dash.sessionLive": "การแข่งดำเนินอยู่",
    "dash.frame": "เฟรมที่",
    "dash.players": "ผู้เล่น",
    "dash.rate": "เรต",

    // Solver (SSS)
    "solve.title": "จำลองแก้สนุ๊กเกอร์",
    "solve.tag": "Snooker Escape Simulator · SSS",
    "solve.desc": "ลูกเป้าหมายคือลูกดำ — ลากขยับลูกขาว ลูกดำ หรือลูกขวางบนโต๊ะเพื่อจำลองสถานการณ์ ระบบจะคำนวณเส้นทางและจุดแทงให้อัตโนมัติ",
    "solve.replay": "จำลองการแทง",
    "solve.reset": "รีเซ็ตตำแหน่ง",
    "solve.target": "ลูกเป้าหมาย",
    "solve.target.black": "ลูกดำ (Black) — เป้าหมายหลัก",
    "solve.ballsOnTable": "ลูกบนโต๊ะ",
    "solve.dragHint": "สามารถลากย้ายลูกเพื่อจำลองมุมได้อิสระ",
    "solve.addBlocker": "เพิ่มลูกขวางทางสนู๊ก:",
    "solve.blockerHint": "แตะลูกเพื่อขยับ หรือกดที่ลูกเพื่อปรับแนวขวาง",
    "solve.advice.title": "คำแนะนำการแทงแก้ชิ่ง",
    "solve.advice.subtitle": "วิเคราะห์เส้นทาง & จุดแทงลูกขาว",
    "solve.status.found": "พบเส้นทางแก้",
    "solve.status.blocked": "ไม่มีทางแก้",
    "solve.spin.title": "จุดแทงลูกขาว (English / Spin)",
    "solve.spin.recommended": "แนะนำ",
    "solve.blocked.title": "⚠ โดนบังมิดทุกมุม หรือไม่มีเส้นทางชิ่งแก้ไปหาลูกดำ",
    "solve.blocked.desc": "ลองปรับจุดแทงสกรู/ไซด์ขาว หรือขยับตำแหน่งลูกขวาง",
    "solve.best.title": "วิธีแทงแก้ที่แนะนำ",
    "solve.best.straight": "แทงตรง (ไม่ชิ่ง)",
    "solve.best.cushions": "ชิ่ง",
    "solve.best.times": "ครั้ง",
    "solve.difficulty": "ระดับความยาก",
    "solve.aim.title": "จุดเล็งเป้าหมาย (Aim Point)",
    "solve.aim.deg": "องศาจากขอบชิ่ง",
    "solve.aim.straight": "เล็งตรงไปยังจุดกลางลูกดำ",
    "solve.thickness.title": "ความหนาในการสัมผัสลูกเป้า",
    "solve.power.title": "น้ำหนักแรงแทง",

    // Settings
    "settings.title": "การตั้งค่า",
    "settings.language": "ภาษา (Language)",
    "settings.sound": "เสียงเอฟเฟกต์",
    "settings.sound.desc": "เสียงลูกกระทบและลงหลุม",
    "settings.haptics": "การสั่นตอบสนอง (Haptics)",
    "settings.haptics.desc": "สั่นเตือนเมื่อกดแทงแต้ม",
    "settings.theme": "ธีมหน้าตา (Theme)",
    "settings.danger": "โซนล้างข้อมูล",
    "settings.resetData": "รีเซ็ตข้อมูลทั้งหมด",
    "settings.resetData.desc": "ล้างประวัติการแข่งและสถิติทั้งหมด",
    "settings.close": "ปิด",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.match": "Match",
    "nav.solve": "AI Coach",
    "nav.solve.full": "Escape Solver (SSS)",
    "nav.history": "History",
    "nav.stats": "Stats",
    "nav.settings": "Settings",

    // Dashboard
    "dash.title": "The Green Room",
    "dash.subtitle.live": "Tonight's match session is on the table",
    "dash.subtitle.idle": "Set the table and get the balls rolling with automated money settlement",
    "dash.setTable": "Set the Table",
    "dash.backTable": "Back to Table",
    "dash.settlement": "Settlement",
    "dash.sessionLive": "Session Live",
    "dash.frame": "Frame",
    "dash.players": "Players",
    "dash.rate": "Rate",

    // Solver (SSS)
    "solve.title": "Snooker Escape Simulator",
    "solve.tag": "AI Coach · SSS Engine",
    "solve.desc": "Target ball is locked on Black — Drag cue, target, or blocker balls freely. The physics engine computes bank escape routes and cue tip spin automatically.",
    "solve.replay": "Replay Shot",
    "solve.reset": "Reset Table",
    "solve.target": "Target Ball",
    "solve.target.black": "Black Ball — Primary Target",
    "solve.ballsOnTable": "Balls on table",
    "solve.dragHint": "Drag any ball to adjust position and angle freely",
    "solve.addBlocker": "Add Blocker Ball:",
    "solve.blockerHint": "Tap or drag blocker balls to simulate snooker layouts",
    "solve.advice.title": "AI Escape Guidance",
    "solve.advice.subtitle": "Route trajectory & cue tip spin",
    "solve.status.found": "Path Found",
    "solve.status.blocked": "Snookered",
    "solve.spin.title": "Cue Tip Spin (English)",
    "solve.spin.recommended": "Recommended",
    "solve.blocked.title": "⚠ Completely snookered with no direct or cushion path to target",
    "solve.blocked.desc": "Try adjusting cue tip spin/screw, or move blocker obstacles",
    "solve.best.title": "Recommended Escape Route",
    "solve.best.straight": "Straight Contact (0 Cushion)",
    "solve.best.cushions": "Cushions",
    "solve.best.times": "cushion(s)",
    "solve.difficulty": "Difficulty",
    "solve.aim.title": "Aim Point",
    "solve.aim.deg": "° off cushion rail",
    "solve.aim.straight": "Aim directly at target ball center",
    "solve.thickness.title": "Contact Thickness",
    "solve.power.title": "Shot Power",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.sound": "Sound Effects",
    "settings.sound.desc": "Ball pot clack and resonance",
    "settings.haptics": "Haptic Feedback",
    "settings.haptics.desc": "Vibrate on scoring taps",
    "settings.theme": "Color Theme",
    "settings.danger": "Danger Zone",
    "settings.resetData": "Reset All Data",
    "settings.resetData.desc": "Clear all frames, sessions, and statistics",
    "settings.close": "Close",
  },
} as const;

export function t(key: keyof typeof translations["th"], locale: Locale = "th"): string {
  const dict = translations[locale] || translations.th;
  return (dict as Record<string, string>)[key] || (translations.th as Record<string, string>)[key] || key;
}
