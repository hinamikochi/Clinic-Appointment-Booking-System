import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef } from 'react';
export default function useUrlState(key, fallback = '') {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw === null ? fallback : typeof fallback === 'number' ? Math.max(1, Number(raw) || fallback) : raw;
  const setter = useRef(setParams); setter.current = setParams;
  const set = useCallback(next => setter.current(previous => {
    const copy = new URLSearchParams(previous);
    const before = copy.get(key) ?? fallback;
    const resolved = typeof next === 'function' ? next(typeof fallback === 'number' ? Number(before) : before) : next;
    if (resolved === fallback) copy.delete(key); else copy.set(key, String(resolved));
    return copy;
  }, { replace: key !== 'tab' }), [key, fallback]);
  return [value, set];
}
