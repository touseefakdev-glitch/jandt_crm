import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerListResult, canUseServerQueries } from '../services/queryService';
import { isHydrating } from '../services/supabaseSync';

export interface UseServerListQueryParams<T> {
  /** Serialized search/filter/page inputs — refetches when this changes. */
  key: string;
  /** Server-side fetch. Must throw synchronously if the server path is unavailable. */
  fetcher: (signal: AbortSignal) => Promise<ServerListResult<T>>;
  /** Local (localDb) fallback used while offline / while the server loads. */
  localFallback: () => ServerListResult<T>;
  /** Debounce applied to key-driven refetches (search typing). */
  debounceMs?: number;
  /** Debounce applied to refetches triggered by local writes (crm_db_updated). */
  refetchAfterWriteMs?: number;
}

export interface UseServerListQueryResult<T> {
  data: T[];
  total: number;
  loading: boolean;
  refresh: () => void;
}

/**
 * Server-first list query hook.
 *
 * - Queries Postgres one page at a time (SQL search/filter/sort, exact totals).
 * - Debounces key changes, cancels stale in-flight requests via AbortController.
 * - Re-fetches shortly after any local write so freshly created/edited records
 *   (which are written to localStorage then synced to Supabase) appear in lists.
 * - Falls back to the synchronous local database when Supabase is unavailable
 *   or the anon key cannot read rows (supabaseSync.isServerReadsBlocked).
 */
export function useServerListQuery<T>(params: UseServerListQueryParams<T>): UseServerListQueryResult<T> {
  const { key, fetcher, localFallback, debounceMs = 250, refetchAfterWriteMs = 650 } = params;

  const [result, setResult] = useState<ServerListResult<T>>(() => localFallback());
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const latest = useRef({ fetcher, localFallback });
  latest.current.fetcher = fetcher;
  latest.current.localFallback = localFallback;

  const pendingWriteRefetch = useRef(false);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Re-fetch shortly after a local write (but not during hydration).
  useEffect(() => {
    const handler = () => {
      if (isHydrating()) return;
      pendingWriteRefetch.current = true;
      setTick((t) => t + 1);
    };
    window.addEventListener('crm_db_updated', handler);
    return () => window.removeEventListener('crm_db_updated', handler);
  }, []);

  useEffect(() => {
    const useLongDebounce = pendingWriteRefetch.current;
    pendingWriteRefetch.current = false;

    const controller = new AbortController();
    let disposed = false;

    if (!canUseServerQueries()) {
      setResult(latest.current.localFallback());
      setLoading(false);
      return () => {
        disposed = true;
        controller.abort();
      };
    }

    const effectiveDelay = useLongDebounce ? refetchAfterWriteMs : debounceMs;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await latest.current.fetcher(controller.signal);
        if (!disposed) setResult(res);
      } catch (err) {
        if (disposed) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!disposed) setResult(latest.current.localFallback());
      } finally {
        if (!disposed) setLoading(false);
      }
    }, effectiveDelay);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, tick, debounceMs, refetchAfterWriteMs]);

  return { data: result.data, total: result.total, loading, refresh };
}
