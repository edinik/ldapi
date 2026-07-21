"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  playCardGridEnter,
  playMatchCountPulse,
} from "@/lib/motion";

/**
 * List filtering stays immediate via the caller's useMemo.
 * Only the search portion of the animation fingerprint is debounced so
 * chip/select/sort changes still play enter animations immediately.
 *
 * Structural filter changes flush any pending search debounce in the same
 * render so clear/chip actions never double-play enter animations.
 */
export function useDirectoryMotion(options: {
  /** Search query (debounced for animation only) */
  query: string;
  /** Non-search filter fingerprint; changes play enter immediately */
  structuralKey: string;
  matchCount: number;
  /** When false, skip grid enter (e.g. ResourceDirectory sections own refs). */
  animateGrid?: boolean;
}) {
  const { query, structuralKey, matchCount, animateGrid = true } = options;
  const gridRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const prevCountRef = useRef<number | null>(null);
  const [animQuery, setAnimQuery] = useState(query);
  // Track previous structural key in state so we can flush search debounce
  // during render (React-supported prop-driven state adjustment).
  const [prevStructuralKey, setPrevStructuralKey] = useState(structuralKey);

  let animationQuery = animQuery;
  if (prevStructuralKey !== structuralKey) {
    setPrevStructuralKey(structuralKey);
    animationQuery = query;
    if (animQuery !== query) {
      setAnimQuery(query);
    }
  }

  useEffect(() => {
    // Structural path already synced animQuery during render; only debounce search.
    if (animQuery === query) return;

    const id = window.setTimeout(() => {
      setAnimQuery(query);
    }, motion.searchDebounceMs);
    return () => window.clearTimeout(id);
  }, [query, animQuery]);

  const animationKey = `${animationQuery}|${structuralKey}`;

  useEffect(() => {
    if (!animateGrid) return;
    playCardGridEnter(gridRef.current);
  }, [animationKey, animateGrid]);

  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = matchCount;
      return;
    }
    if (prevCountRef.current === matchCount) return;
    prevCountRef.current = matchCount;
    playMatchCountPulse(countRef.current);
  }, [matchCount]);

  return { gridRef, countRef, animationKey };
}
