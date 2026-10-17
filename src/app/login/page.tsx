"use client";

// Mesnooker login — Emerald Noir glass panel.
// Username + password, Sign in / Sign up tabs. Sign up auto-signs-in (no
// email verification, per spec). The session is an httpOnly cookie set by
// /api/auth/*; this page only renders.
import { useState, useRef, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Lock, AlertCircle, LogIn, UserPlus, Sparkles } from "lucide-react";
import {
  apiSignIn,
  apiSignUp,
  clientValidUsername,
  clientValidEmail,
  clientValidPassword,
  getSafeRedirectUrl,
} from "@/lib/auth-client";

type Mode = "signin" | "signup";

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);

  const switchMode = (m: Mode) => {
    if (m === mode || busy) return;
    setMode(m);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    userRef.current?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const un = username.trim();
    if (!un) {
      setError("กรุณาระบุชื่อผู้ใช้ (Please enter username)");
      userRef.current?.focus();
      return;
    }
    if (mode === "signup" && !clientValidUsername(un)) {
      setError("ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 2 ตัวอักษร (At least 2 characters)");
      userRef.current?.focus();
      return;
    }
    if (mode === "signin" && !clientValidUsername(un) && !clientValidEmail(un)) {
      setError("กรุณากรอกชื่อผู้ใช้หรืออีเมลที่ถูกต้อง");
      userRef.current?.focus();
      return;
    }
    if (!password) {
      setError("กรุณาระบุรหัสผ่าน (Please enter password)");
      return;
    }
    if (!clientValidPassword(password)) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร (At least 6 characters)");
      return;
    }
    if (mode === "signup") {
      if (!confirmPassword) {
        setError("กรุณากรอกยืนยันรหัสผ่านอีกครั้ง");
        return;
      }
      if (password !== confirmPassword) {
        setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน (Passwords do not match)");
        return;
      }
    }

    setBusy(true);
    setError(null);
    const [result] = await Promise.all([
      mode === "signin"
        ? apiSignIn(un, password)
        : apiSignUp(un, password, confirmPassword),
      new Promise((r) => setTimeout(r, 300)),
    ]);
    setBusy(false);
    if (result.ok) {
      const nextTarget = getSafeRedirectUrl(searchParams.get("next"));
      window.location.href = nextTarget;
    } else {
      setError(result.error ?? "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
      setPassword("");
      setConfirmPassword("");
      userRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4 select-none">
      <div className="relative w-full max-w-[420px]">
        {/* Header branding */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl shadow-sm">
            🎱
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-foreground font-heading">
            Mes<span className="text-primary">nooker</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-foreground/80">
            ระบบนับแต้มสนุกเกอร์ &amp; เคลียร์เงินอัตโนมัติ
          </p>
          <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Coach Engine &bull; Zero-Sum Settlement &bull; PromptPay
          </p>
        </div>

        <form onSubmit={submit} className="glass-strong p-6 sm:p-8 rounded-[26px] shadow-2xl border border-border/80">
          {/* Sign in / Sign up tabs */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-surface/70 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  mode === m
                    ? "bg-primary/20 text-primary border border-primary/35 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "เข้าสู่ระบบ (Sign in)" : "สมัครสมาชิก (Sign up)"}
              </button>
            ))}
          </div>

          <label htmlFor="login-username" className="text-xs font-semibold text-foreground/90">
            ชื่อผู้ใช้ / Username
          </label>
          <div className="relative mt-1.5">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ระบุชื่อผู้ใช้ (อย่างน้อย 2 ตัวอักษร)"
              type="text"
              autoComplete="username"
              inputMode="text"
              autoFocus
              ref={userRef}
              className="w-full rounded-xl border border-border bg-surface/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label htmlFor="login-pass" className="mt-4 block text-xs font-semibold text-foreground/90">
            รหัสผ่าน / Password
          </label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              type={show ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-surface/80 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/70 hover:text-foreground cursor-pointer"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="mt-4">
              <label htmlFor="login-confirm-pass" className="block text-xs font-semibold text-foreground/90">
                ยืนยันรหัสผ่าน / Confirm password
              </label>
              <div className="relative mt-1.5">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="login-confirm-pass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-border bg-surface/80 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/70 hover:text-foreground cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" aria-live="polite" className="mt-3.5 flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 border-t-white/25 bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-hover active:translate-y-[2px] active:scale-[0.98] active:brightness-90 disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-md"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            ) : mode === "signin" ? (
              <>
                เข้าสู่ระบบ <LogIn size={15} />
              </>
            ) : (
              <>
                สร้างบัญชีใหม่และเริ่มใช้งาน <UserPlus size={15} />
              </>
            )}
          </button>

          {/* Quick onboarding perks */}
          <div className="mt-5 rounded-xl border border-border/60 bg-surface/40 p-3 text-[11px] text-muted-foreground flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
              <Sparkles size={12} className="text-primary shrink-0" />
              <span>{mode === "signup" ? "สมัครง่ายใน 5 วินาที" : "ใช้งานฟรี 100%"}</span>
            </div>
            <p className="leading-relaxed">
              {mode === "signup"
                ? "ไม่ต้องใช้อีเมลหรือเบอร์โทร ระบบจะพาเข้าสู่ระบบอัตโนมัติทันที พร้อมเริ่มนับแต้มและเคลียร์บิลกับเพื่อน"
                : "เซสชันคงอยู่ 30 วัน ข้อมูลการแข่งขัน สถิติ และการเคลียร์เงินจะถูกบันทึกไว้อย่างปลอดภัย"}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
