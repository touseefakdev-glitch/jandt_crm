import { useCallback, useEffect, useRef, useState } from 'react';
import { canUseServerQueries } from '../services/queryService';
import { isHydrating } from '../services/supabaseSync';

export interface UseServerQueryParams<T> {
  /** Serialized inputs — refetches when this changes. */
  key: string;
  /** Server-side fetch. Must throw synchronously if the server path is unavailable. */
  fetcher: (signal: AbortSignal) => Promise<T>;
  /** Local fallback used while offline / while the server loads. */
  localFallback: () => T;
  /** Debounce applied to key-driven refetches. */
  debounceMs?: number;
  /** Debounce applied to refetches triggered by local writes. */
  refetchAfterWriteMs?: number;
}

export interface UseServerQueryResult<T> {
  data: T;
  loading: boolean;
  refresh: () => void;
}

/**
 * Single-value (non-list) server query — used for aggregate counts and other
 * small fetches. Same fallback / write-refetch semantics as useServerListQuery.
 */
export function useServerQuery<T>(params: UseServerQueryParams<T>): UseServerQueryResult<T> {
  const { key, fetcher, localFallback, debounceMs = 250, refetchAfterWriteMs = 650 } = params;

  const [data, setData] = useState<T>(() => localFallback());
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const latest = useRef({ fetcher, localFallback });
  latest.current.fetcher = fetcher;
  latest.current.localFallback = localFallback;

  const pendingWriteRefetch = useRef(false);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

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
      setData(latest.current.localFallback());
      setLoading(false);
      return () => {
        disposed = true;
        controller.abort();
      };
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await latest.current.fetcher(controller.signal);
        if (!disposed) setData(res);
      } catch (err) {
        if (disposed) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!disposed) setData(latest.current.localFallback());
      } finally {
        if (!disposed) setLoading(false);
      }
    }, useLongDebounce ? refetchAfterWriteMs : debounceMs);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, tick, debounceMs, refetchAfterWriteMs]);

  return { data, loading, refresh };
}
