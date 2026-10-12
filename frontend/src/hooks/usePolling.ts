import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions {
  /** Interval in ms (default 15000). Set 0 to disable. */
  interval?: number;
  /** Whether polling is enabled (e.g. false while a modal is open). */
  enabled?: boolean;
}

/**
 * Runs `callback` immediately and then on a fixed interval.
 * Pauses automatically when the browser tab is hidden (saves resources),
 * and resumes (with an immediate refresh) when the tab becomes visible again.
 *
 * Returns a manual `refresh` function and a `lastUpdated` timestamp.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  { interval = 15000, enabled = true }: UsePollingOptions = {}
) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const run = useCallback(async () => {
    await savedCallback.current();
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!enabled || interval <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (!document.hidden) run();
      }, interval);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        run(); // immediate catch-up when returning to the tab
        start();
      }
    };

    run();
    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, interval, run]);

  return { refresh: run, lastUpdated };
}
