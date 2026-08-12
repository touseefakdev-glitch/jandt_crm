import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delay` ms.
 * Used to debounce search inputs before triggering server queries.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
