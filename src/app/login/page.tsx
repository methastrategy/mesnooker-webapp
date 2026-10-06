"use client";

// Mesnooker login — Emerald Noir glass panel.
// Username + password, Sign in / Sign up tabs. Sign up auto-signs-in (no
// email verification, per spec). The session is an httpOnly cookie set by
// /api/auth/*; this page only renders.
import { useState, useRef, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Lock, AlertCircle, LogIn, UserPlus } from "lucide-react";
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
      setError("Please enter a username.");
      userRef.current?.focus();
      return;
    }
    if (mode === "signup" && !clientValidUsername(un)) {
      setError("Username must be at least 2 characters.");
      userRef.current?.focus();
      return;
    }
    if (mode === "signin" && !clientValidUsername(un) && !clientValidEmail(un)) {
      setError("Enter a valid username or email.");
      userRef.current?.focus();
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (!clientValidPassword(password)) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup") {
      if (!confirmPassword) {
        setError("Please re-enter your password to confirm.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
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
      setError(result.error ?? "Something went wrong. Try again.");
      setPassword("");
      setConfirmPassword("");
      userRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-primary/25 bg-primary/10 text-xl">
            🎱
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Mes<span className="text-primary">nooker</span>
          </h1>
          <p className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Coach engine &amp; money tracker
          </p>
        </div>

        <form onSubmit={submit} className="glass p-4 sm:p-6">
          {/* Sign in / Sign up tabs */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-[8px] border border-border bg-surface p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-[6px] px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  mode === m
                    ? "bg-primary/15 font-medium text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <label htmlFor="login-username" className="text-xs font-medium text-muted-foreground">
            Username
          </label>
          <div className="relative mt-1.5">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="At least 2 characters"
              type="text"
              autoComplete="username"
              inputMode="text"
              autoFocus
              ref={userRef}
              className="w-full rounded-[8px] border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label htmlFor="login-pass" className="mt-4 block text-xs font-medium text-muted-foreground">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type={show ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-[8px] border border-border bg-surface py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/70 hover:text-foreground cursor-pointer"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="mt-4">
              <label htmlFor="login-confirm-pass" className="block text-xs font-medium text-muted-foreground">
                Confirm password
              </label>
              <div className="relative mt-1.5">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="login-confirm-pass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full rounded-[8px] border border-border bg-surface py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/70 hover:text-foreground cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" aria-live="polite" className="mt-3 flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[8px] border border-primary/50 border-t-white/25 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-hover active:translate-y-[2px] active:brightness-90 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
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
              ? "Username + password only — you are signed in as soon as the account is created."
              : "Session lasts 30 days. Your match and coach data stay on this device."}
          </p>
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

