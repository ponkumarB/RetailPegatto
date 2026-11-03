'use client';

import { useState, useEffect } from 'react';

const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

type BreakpointKey = keyof typeof breakpoints;

export default function useResponsive(
  query: 'up' | 'down' | 'between' | 'only',
  key: BreakpointKey,
  start?: BreakpointKey,
  end?: BreakpointKey
): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mediaQueryString = '';

    if (query === 'up') {
      mediaQueryString = `(min-width: ${breakpoints[key]}px)`;
    } else if (query === 'down') {
      mediaQueryString = `(max-width: ${breakpoints[key] - 0.05}px)`;
    } else if (query === 'between' && start && end) {
      mediaQueryString = `(min-width: ${breakpoints[start]}px) and (max-width: ${breakpoints[end] - 0.05}px)`;
    } else if (query === 'only') {
      const keys = Object.keys(breakpoints) as BreakpointKey[];
      const index = keys.indexOf(key);
      const min = breakpoints[key];
      const max = index < keys.length - 1 ? breakpoints[keys[index + 1]] - 0.05 : null;
      
      mediaQueryString = max 
        ? `(min-width: ${min}px) and (max-width: ${max}px)`
        : `(min-width: ${min}px)`;
    }

    if (!mediaQueryString) return;

    const mediaQueryList = window.matchMedia(mediaQueryString);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, key, start, end]);

  return matches;
}
