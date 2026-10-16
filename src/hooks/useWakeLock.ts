"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: EventListener) => void;
  removeEventListener?: (type: "release", listener: EventListener) => void;
}

export class WakeLockController {
  private sentinel: WakeLockSentinelLike | null = null;
  private onChange?: (active: boolean) => void;
  private isAcquiring = false;
  private shouldBeActive = false;

  constructor(onChange?: (active: boolean) => void) {
    this.onChange = onChange;
  }

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      !!navigator.wakeLock &&
      typeof navigator.wakeLock.request === "function"
    );
  }

  async acquire(): Promise<boolean> {
    if (!this.isSupported()) return false;
    this.shouldBeActive = true;

    if (this.sentinel && !this.sentinel.released) {
      this.onChange?.(true);
      return true;
    }

    if (this.isAcquiring) return false;
    this.isAcquiring = true;

    try {
      const sentinel = (await navigator.wakeLock.request("screen")) as unknown as WakeLockSentinelLike;

      // Guard against race condition: if release() was called while acquire() was in flight
      if (!this.shouldBeActive) {
        try {
          await sentinel.release();
        } catch {
          // Ignored
        }
        this.sentinel = null;
        this.onChange?.(false);
        return false;
      }

      this.sentinel = sentinel;
      this.onChange?.(true);

      sentinel.addEventListener("release", () => {
        if (this.sentinel === sentinel) {
          this.sentinel = null;
          this.onChange?.(false);
        }
      });
      return true;
    } catch {
      this.sentinel = null;
      this.onChange?.(false);
      return false;
    } finally {
      this.isAcquiring = false;
    }
  }

  async release(): Promise<void> {
    this.shouldBeActive = false;
    if (this.sentinel) {
      const s = this.sentinel;
      this.sentinel = null;
      try {
        await s.release();
      } catch {
        // Ignored
      }
      this.onChange?.(false);
    }
  }

  isActive(): boolean {
    return !!(this.sentinel && !this.sentinel.released);
  }

  setListener(cb?: (active: boolean) => void) {
    this.onChange = cb;
  }
}

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

/**
 * Screen Wake Lock API hook.
 * Keeps the screen awake during live matches to prevent phone display dimming/sleeping.
 * Automatically re-acquires lock on `visibilitychange` and `focus` (e.g. when user switches back to tab)
 * and safely releases on unmount without race condition leaks.
 */
export function useWakeLock(enabled: boolean = true): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const controllerRef = useRef<WakeLockController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new WakeLockController(setIsActive);
  }

  useEffect(() => {
    const supported = controllerRef.current?.isSupported() ?? false;
    setIsSupported(supported);
  }, []);

  const request = useCallback(async () => {
    return (await controllerRef.current?.acquire()) ?? false;
  }, []);

  const release = useCallback(async () => {
    await controllerRef.current?.release();
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.setListener(setIsActive);

    if (!enabled || !controller.isSupported()) {
      controller.release();
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      controller.acquire();
    }

    const handleReacquire = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        controller.acquire();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleReacquire);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleReacquire);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleReacquire);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleReacquire);
      }
      controller.release();
      controller.setListener(undefined);
    };
  }, [enabled]);

  return {
    isSupported,
    isActive,
    request,
    release,
  };
}
