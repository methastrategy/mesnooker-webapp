"use client";

// Mesnooker login — Emerald Noir glass panel.
// Email + password, Sign in / Sign up tabs. Sign up auto-signs-in (no
// email verification, per spec). The session is an httpOnly cookie set by
// /api/auth/*; this page only renders.
import { useState, useRef, type FormEvent } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle, LogIn, UserPlus } from "lucide-react";
import {
  apiSignIn,
  apiSignUp,
  clientValidEmail,
  clientValidPassword,
} from "@/lib/auth-client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const switchMode = (m: Mode) => {
    if (m === mode || busy) return;
    setMode(m);
    setError(null);
    setPassword("");
    emailRef.current?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const em = email.trim();
    if (!clientValidEmail(em)) {
      setError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    if (!clientValidPassword(password)) {
      setError("Password must be 8–72 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const [result] = await Promise.all([
      mode === "signin" ? apiSignIn(em, password) : apiSignUp(em, password),
      new Promise((r) => setTimeout(r, 300)),
    ]);
    setBusy(false);
    if (result.ok) {
      window.location.href = "/";
    } else {
      setError(result.error ?? "Something went wrong. Try again.");
      setPassword("");
      emailRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4">
      {/* table-lamp atmosphere: warm radial from above, deep felt below */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(22,199,132,0.12),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(11,65,34,0.5),transparent_60%)]" />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-xl">
            🎱
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Mes<span className="text-primary">nooker</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Coach engine &amp; money tracker
          </p>
        </div>

        <form onSubmit={submit} className="glass p-6">
          {/* Sign in / Sign up tabs */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  mode === m
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">
            Email
          </label>
          <div className="relative mt-1.5">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              ref={emailRef}
              className="w-full rounded-xl border border-white/10 bg-surface/80 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label htmlFor="login-pass" className="mt-4 text-xs font-medium text-muted-foreground">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8–72 characters"
              type={show ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-white/10 bg-surface/80 py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/70 hover:text-foreground"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="mt-3 flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(217,164,65,0.28)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            ) : mode === "signin" ? (
              <>
                Sign in <LogIn size={15} />
              </>
            ) : (
              <>
                Create account <UserPlus size={15} />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
            {mode === "signup"
              ? "Email + password only — you are signed in as soon as the account is created."
              : "Session lasts 30 days. Your match and coach data stay on this device."}
          </p>
        </form>
      </div>
    </div>
  );
}
