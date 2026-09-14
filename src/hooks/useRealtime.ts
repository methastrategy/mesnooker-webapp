"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseCached, supabaseConfigured } from "@/lib/supabase";

export const ROOM_CHANNEL_PREFIX = "snooker-room";

/**
 * React hook to subscribe to a realtime room (Supabase), gracefully no-op when
 * Supabase isn't configured (offline mode).
 *
 * `onEvent` receives rows inserted/updated on the tracked table.
 */
export function useRealtimeSubscription<T = unknown>(opts: {
  room?: string;
  table: string;
  enabled?: boolean;
  onEvent: (payload: { eventType: string; newRow?: T; oldRow?: T }) => void;
}) {
  const { room, table, enabled = true, onEvent } = opts;
  const [connected, setConnected] = useState(false);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled || !supabaseConfigured()) {
      setConnected(false);
      return;
    }
    const sb = getSupabaseCached();
    if (!sb) {
      setConnected(false);
      return;
    }

    const chanName = `${ROOM_CHANNEL_PREFIX}:${room ?? "global"}`;
    const channel: RealtimeChannel = sb
      .channel(chanName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          handler.current({
            eventType: payload.eventType,
            newRow: payload.new as T | undefined,
            oldRow: payload.old as T | undefined,
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      sb.removeChannel(channel);
      setConnected(false);
    };
  }, [enabled, room, table]);

  return connected;
}

/** Create a room with a shareable code (local fallback when no supabase). */
export function useRoom() {
  const [room, setRoom] = useState<string | null>(null);
  const create = useCallback(() => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoom(code);
    return code;
  }, []);
  const join = useCallback((code: string) => {
    if (!code.trim()) return;
    setRoom(code.trim().toUpperCase());
  }, []);
  return { room, create, join, available: supabaseConfigured() };
}