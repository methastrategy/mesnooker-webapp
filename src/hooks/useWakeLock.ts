"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export class WakeLockController {
  private sentinel: any = null;
  private onChange?: (active: boolean) => void;

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
    if (this.sentinel && !this.sentinel.released) {
      this.onChange?.(true);
      return true;
    }
    try {
      const sentinel = await navigator.wakeLock.request("screen");
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
    }
  }

  async release(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Ignored
      }
      this.sentinel = null;
      this.onChange?.(false);
    }
  }

  isActive(): boolean {
    return !!(this.sentinel && !this.sentinel.released);
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
 * Automatically re-acquires lock on `visibilitychange` (e.g. when user switches back to tab)
 * and safely releases on unmount.
 */
export function useWakeLock(enabled: boolean = true): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const controllerRef = useRef<WakeLockController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new WakeLockController(setIsActive);
  }

  useEffect(() => {
    setIsSupported(controllerRef.current?.isSupported() ?? false);
  }, []);

  const request = useCallback(async () => {
    return (await controllerRef.current?.acquire()) ?? false;
  }, []);

  const release = useCallback(async () => {
    await controllerRef.current?.release();
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !enabled || !controller.isSupported()) {
      controller?.release();
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      controller.acquire();
    }

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        controller.acquire();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      controller.release();
    };
  }, [enabled, isSupported]);

  return {
    isSupported,
    isActive,
    request,
    release,
  };
}
