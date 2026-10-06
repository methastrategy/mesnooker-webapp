/**
 * MESNOOKER i18n Translation Dictionary
 * Precise, natural bilingual support for Thai and English
 */

export type Locale = "th" | "en";

export const translations = {
  th: {
    // Navigation
    "nav.dashboard": "แดชบอร์ด",
    "nav.match": "กระดานแข่ง",
    "nav.tools": "เครื่องมือ",
    "nav.history": "ประวัติการแข่ง",
    "nav.stats": "สถิติรวม",
    "nav.settlement": "เคลียร์เงิน",
    "nav.settings": "ตั้งค่า",

    // Dashboard
    "dash.title": "ห้องสนุ๊กเกอร์ MESNOOKER",
    "dash.subtitle.live": "มีรอบแข่งขันกำลังดำเนินอยู่บนโต๊ะ",
    "dash.subtitle.idle": "จัดโต๊ะและเริ่มแทงสนุ๊กเกอร์พร้อมระบบคิดเงินอัตโนมัติ",
    "dash.setTable": "จัดโต๊ะเริ่มเล่น",
    "dash.backTable": "กลับไปที่โต๊ะแข่ง",
    "dash.settlement": "สรุปยอดได้เสีย",
    "dash.sessionLive": "การแข่งดำเนินอยู่",
    "dash.frame": "เฟรมที่",
    "dash.players": "ผู้เล่น",
    "dash.rate": "เรต",

    // Match & Live Scoring
    "match.title": "กระดานแข่งขัน",
    "match.newGame": "เริ่มการแข่งใหม่",
    "match.recentSessions": "ประวัติการเล่นล่าสุด",
    "match.mode.points": "คิดตามแต้ม (Point Count)",
    "match.mode.balls": "คิดตามลูก (Ball Count)",
    "match.rateLabel": "เรตเงินต่อหน่วย",
    "match.addPlayer": "เพิ่มผู้เล่น",
    "match.startSession": "เริ่มการแข่งขัน",
    "match.endSession": "จบการแข่ง / เคลียร์ยอด",
    "match.nextFrame": "เริ่มเฟรมถัดไป",
    "match.endFrame": "จบเฟรมนี้",
    "match.undo": "เลิกทำ (Undo)",
    "match.upNext": "คิวแทงถัดไป",
    "match.currentShooter": "กำลังแทง",
    "match.currentBreak": "เบรกปัจจุบัน",
    "match.targetBall": "แทงลูก",
    "match.clearRack": "เคลียร์ชุดแดงหมด",
    "match.foul": "ฟาวล์ / เสียแต้ม",
    "match.snookerMiss": "แทงสนุ๊กไม่โดน",
    "match.snookerHit": "แก้สนุ๊กสำเร็จ",
    "match.freeBall": "ฟรีบอล (Free Ball)",
    "match.opener": "ผู้เริ่มเปิดเฟรม",
    "match.winner": "ผู้ชนะเฟรม",

    // History
    "history.title": "ประวัติการแข่งขัน",
    "history.subtitle": "สรุปยอดได้เสียและรายการโอนเงินย้อนหลัง",
    "history.filter.allPlayers": "ผู้เล่นทั้งหมด",
    "history.filter.allModes": "ทุกโหมด",
    "history.filter.search": "ค้นหาชื่อผู้เล่น...",
    "history.filter.reset": "ล้างตัวกรอง",
    "history.empty": "ยังไม่มีประวัติการแข่งที่จบแล้ว — เริ่มแข่งและจบเซสชันเพื่อบันทึกข้อมูล",
    "history.emptyFilter": "ไม่พบการแข่งที่ตรงตามเงื่อนไขค้นหา",
    "history.transfers": "รายการโอนเงินสรุป",
    "history.viewDetails": "ดูรายละเอียดเฟรม",

    // Stats
    "stats.title": "สถิติและผลงาน",
    "stats.subtitle": "สถิติรวมตลอดการใช้งานทุกเฟรมการแข่ง",
    "stats.empty": "ยังไม่มีสถิติการแข่ง — เริ่มเล่นและจบเซสชันเพื่อสะสมผลงาน",
    "stats.gamesPlayed": "การแข่งทั้งหมด",
    "stats.totalPlayers": "ผู้เล่นทั้งหมด",
    "stats.pointsWon": "แต้มรวมผู้ชนะ",
    "stats.bestNet": "กำไรสูงสุดในเกมเดียว",
    "stats.leaderboard": "ตารางอันดับสะสม",
    "stats.netChart": "กราฟยอดเงินสะสมรายคน",
    "stats.achievements": "ถ้วยรางวัล / ความสำเร็จ",

    // Settings
    "settings.title": "การตั้งค่า",
    "settings.preferences": "การตั้งค่าทั่วไป",
    "settings.language": "ภาษาแสดงผล (Language)",
    "settings.sound": "เสียงเอฟเฟกต์",
    "settings.sound.desc": "เสียงลูกกระทบและลงหลุม",
    "settings.haptics": "ระบบสั่น (Haptics)",
    "settings.haptics.desc": "สั่นตอบสนองเมื่อกดปุ่มแทงแต้ม",
    "settings.theme": "ธีมสีหน้าจอ",
    "settings.danger": "โซนล้างข้อมูล",
    "settings.resetApp": "รีเซ็ตระบบทั้งหมด",
    "settings.resetConfirm": "ต้องการล้างข้อมูลทั้งหมดหรือไม่? การแข่ง สถิติ และประวัติจะถูกลบทันที",
    "settings.close": "ปิด",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.match": "Live Match",
    "nav.tools": "Tools",
    "nav.history": "History",
    "nav.stats": "Stats",
    "nav.settlement": "Settlement",
    "nav.settings": "Settings",

    // Dashboard
    "dash.title": "MESNOOKER Dashboard",
    "dash.subtitle.live": "Active match session in progress on the table",
    "dash.subtitle.idle": "Set up players and rates for automated money settlement",
    "dash.setTable": "Set the Table",
    "dash.backTable": "Back to Table",
    "dash.settlement": "Settlement",
    "dash.sessionLive": "Session Live",
    "dash.frame": "Frame",
    "dash.players": "Players",
    "dash.rate": "Rate",

    // Match & Live Scoring
    "match.title": "Match Board",
    "match.newGame": "Start New Match",
    "match.recentSessions": "Recent Sessions",
    "match.mode.points": "Point Count",
    "match.mode.balls": "Ball Count",
    "match.rateLabel": "Rate per unit",
    "match.addPlayer": "Add Player",
    "match.startSession": "Start Session",
    "match.endSession": "End Session & Settle",
    "match.nextFrame": "Next Frame",
    "match.endFrame": "End Frame",
    "match.undo": "Undo",
    "match.upNext": "Up Next",
    "match.currentShooter": "Shooting",
    "match.currentBreak": "Current Break",
    "match.targetBall": "Target Ball",
    "match.clearRack": "Clear Reds",
    "match.foul": "Foul / Penalty",
    "match.snookerMiss": "Snooker Miss",
    "match.snookerHit": "Snooker Hit",
    "match.freeBall": "Free Ball",
    "match.opener": "Frame Opener",
    "match.winner": "Frame Winner",

    // History
    "history.title": "Match History",
    "history.subtitle": "Finished matches and net money per player",
    "history.filter.allPlayers": "All Players",
    "history.filter.allModes": "All Modes",
    "history.filter.search": "Search player nickname...",
    "history.filter.reset": "Reset Filters",
    "history.empty": "No finished games yet — start a match and end session to save records here.",
    "history.emptyFilter": "No finished games match these filters.",
    "history.transfers": "Settlement Transfers",
    "history.viewDetails": "View Frame Details",

    // Stats
    "stats.title": "Statistics & Records",
    "stats.subtitle": "Lifetime performance across all finished games",
    "stats.empty": "No finished games yet — start a match and end session to seed stats.",
    "stats.gamesPlayed": "Total Games",
    "stats.totalPlayers": "Total Players",
    "stats.pointsWon": "Total Winner Points",
    "stats.bestNet": "Best Single Net",
    "stats.leaderboard": "Leaderboard",
    "stats.netChart": "Net Money per Player",
    "stats.achievements": "Achievements",

    // Settings
    "settings.title": "Settings",
    "settings.preferences": "Preferences",
    "settings.language": "Display Language",
    "settings.sound": "Sound Effects",
    "settings.sound.desc": "Ball impact and pot audio cues",
    "settings.haptics": "Haptic Feedback",
    "settings.haptics.desc": "Tactile touch feedback on scoring",
    "settings.theme": "Color Theme",
    "settings.danger": "Danger Zone",
    "settings.resetApp": "Reset All Data",
    "settings.resetConfirm": "Reset all data? This clears every session, frame, player and stat.",
    "settings.close": "Close",
  },
} as const;

export function t(key: keyof typeof translations["th"], locale: Locale = "th"): string {
  const dict = translations[locale] || translations.th;
  return (dict as Record<string, string>)[key] || (translations.th as Record<string, string>)[key] || key;
}
