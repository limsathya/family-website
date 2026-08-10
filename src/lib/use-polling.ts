"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * A hook that fetches data on mount and then polls at a given interval.
 * Polling pauses when the tab is hidden and resumes when visible.
 * Immediately re-fetches when fetchFn changes (e.g., language switch).
 * 
 * @param fetchFn - The async function to call for fetching data
 * @param intervalMs - Polling interval in milliseconds (default: 10000 = 10s)
 * @param enabled - Whether polling is active (default: true)
 */
export function usePolling(
  fetchFn: () => Promise<void>,
  intervalMs: number = 10000,
  enabled: boolean = true
) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const poll = useCallback(() => {
    if (!enabled) return;
    fetchRef.current().catch(() => {});
  }, [enabled]);

  // Initial fetch + re-fetch when fetchFn changes (e.g. language switch)
  const fetchFnKey = useRef(0);
  useEffect(() => {
    fetchFnKey.current++;
    poll();
  }, [fetchFn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also fetch on mount / when enabled changes
  useEffect(() => {
    poll();
  }, [poll]);

  // Polling interval with visibility-aware pausing
  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(poll, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll, intervalMs, enabled]);
}
