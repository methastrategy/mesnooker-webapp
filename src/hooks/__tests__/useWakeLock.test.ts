import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WakeLockController } from "../useWakeLock";

describe("WakeLockController", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("detects unsupported environment when navigator.wakeLock is missing", async () => {
    Object.defineProperty(global, "navigator", {
      value: { ...originalNavigator, wakeLock: undefined },
      writable: true,
    });

    const ctrl = new WakeLockController();
    expect(ctrl.isSupported()).toBe(false);
    expect(await ctrl.acquire()).toBe(false);
    expect(ctrl.isActive()).toBe(false);
  });

  it("successfully acquires lock and notifies listener", async () => {
    const releaseMock = vi.fn().mockResolvedValue(undefined);

    const sentinel = {
      released: false,
      release: releaseMock,
      addEventListener: vi.fn(),
    };
    const requestMock = vi.fn().mockResolvedValue(sentinel);

    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        wakeLock: { request: requestMock },
      },
      writable: true,
    });

    const statusChanges: boolean[] = [];
    const ctrl = new WakeLockController((active) => statusChanges.push(active));

    expect(ctrl.isSupported()).toBe(true);
    const success = await ctrl.acquire();

    expect(success).toBe(true);
    expect(requestMock).toHaveBeenCalledWith("screen");
    expect(ctrl.isActive()).toBe(true);
    expect(statusChanges).toEqual([true]);

    // Test explicit release
    await ctrl.release();
    expect(releaseMock).toHaveBeenCalled();
    expect(ctrl.isActive()).toBe(false);
    expect(statusChanges).toEqual([true, false]);
  });

  it("handles browser wakeLock release event", async () => {
    let releaseHandler: (() => void) | null = null;
    const sentinel = {
      released: false,
      release: vi.fn(),
      addEventListener: vi.fn((event, cb) => {
        if (event === "release") releaseHandler = cb;
      }),
    };
    const requestMock = vi.fn().mockResolvedValue(sentinel);

    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        wakeLock: { request: requestMock },
      },
      writable: true,
    });

    const statusChanges: boolean[] = [];
    const ctrl = new WakeLockController((active) => statusChanges.push(active));

    await ctrl.acquire();
    expect(ctrl.isActive()).toBe(true);

    // Simulate browser releasing the lock (e.g. system low power)
    if (releaseHandler) {
      (releaseHandler as () => void)();
    }

    expect(ctrl.isActive()).toBe(false);
    expect(statusChanges).toEqual([true, false]);
  });

  it("handles request failure gracefully", async () => {
    const requestMock = vi.fn().mockRejectedValue(new Error("Low battery"));

    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        wakeLock: { request: requestMock },
      },
      writable: true,
    });

    const ctrl = new WakeLockController();
    const success = await ctrl.acquire();

    expect(success).toBe(false);
    expect(ctrl.isActive()).toBe(false);
  });

  it("prevents wake lock leak when release is called while acquire is in-flight", async () => {
    let resolveRequest: (val: any) => void = () => {};
    const releaseMock = vi.fn().mockResolvedValue(undefined);
    const sentinel = {
      released: false,
      release: releaseMock,
      addEventListener: vi.fn(),
    };

    const requestMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        wakeLock: { request: requestMock },
      },
      writable: true,
    });

    const statusChanges: boolean[] = [];
    const ctrl = new WakeLockController((active) => statusChanges.push(active));

    // Start acquisition (stays pending)
    const acquirePromise = ctrl.acquire();

    // While request is in-flight, unmount/release is invoked
    await ctrl.release();

    // Now request completes
    resolveRequest(sentinel);
    const result = await acquirePromise;

    // Must not activate and must immediately release the in-flight sentinel
    expect(result).toBe(false);
    expect(ctrl.isActive()).toBe(false);
    expect(releaseMock).toHaveBeenCalled();
  });

  it("ignores concurrent duplicate in-flight acquire requests", async () => {
    let resolveRequest: (val: any) => void = () => {};
    const releaseMock = vi.fn().mockResolvedValue(undefined);
    const sentinel = {
      released: false,
      release: releaseMock,
      addEventListener: vi.fn(),
    };

    const requestMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    Object.defineProperty(global, "navigator", {
      value: {
        ...originalNavigator,
        wakeLock: { request: requestMock },
      },
      writable: true,
    });

    const ctrl = new WakeLockController();
    const p1 = ctrl.acquire();
    const p2 = ctrl.acquire(); // concurrent call while p1 is in-flight

    resolveRequest(sentinel);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});

