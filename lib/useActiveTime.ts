'use client';

import { useEffect, useRef } from 'react';

/**
 * Tracks active (visible) time on a page and calls `onTick` with elapsed
 * minutes whenever meaningful time has accumulated.
 *
 * - Pauses when the tab is hidden (visibilitychange)
 * - Caps each interval at MAX_GAP_MS so background/sleep time is ignored
 * - Flushes remaining time on unmount
 */

const TICK_MS = 15_000;      // check every 15 seconds
const MAX_GAP_MS = 120_000;  // cap at 2 minutes per tick (ignore sleep/background)

export function useActiveTime(onTick: (minutes: number) => void) {
  const lastTickRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    lastTickRef.current = Date.now();
    accumulatedMsRef.current = 0;
    visibleRef.current = !document.hidden;

    const flush = () => {
      const minutes = Math.floor(accumulatedMsRef.current / 60_000);
      if (minutes > 0) {
        onTickRef.current(minutes);
        accumulatedMsRef.current -= minutes * 60_000;
      }
    };

    const tick = () => {
      if (!visibleRef.current) {
        // Tab was hidden — just reset the timestamp so we don't count hidden time
        lastTickRef.current = Date.now();
        return;
      }
      const now = Date.now();
      const elapsed = Math.min(now - lastTickRef.current, MAX_GAP_MS);
      accumulatedMsRef.current += elapsed;
      lastTickRef.current = now;
      flush();
    };

    const onVisibility = () => {
      if (document.hidden) {
        // Going hidden — accumulate time up to now, then pause
        const now = Date.now();
        const elapsed = Math.min(now - lastTickRef.current, MAX_GAP_MS);
        accumulatedMsRef.current += elapsed;
        visibleRef.current = false;
      } else {
        // Coming back — reset timestamp so gap isn't counted
        lastTickRef.current = Date.now();
        visibleRef.current = true;
      }
    };

    const interval = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      // Flush remaining time on unmount (navigating away from module page)
      const now = Date.now();
      if (visibleRef.current) {
        const elapsed = Math.min(now - lastTickRef.current, MAX_GAP_MS);
        accumulatedMsRef.current += elapsed;
      }
      flush();
    };
  }, []); // stable — onTick changes are tracked via ref
}
