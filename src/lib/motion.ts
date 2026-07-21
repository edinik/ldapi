import { animate, type JSAnimation } from "animejs";

export const motion = {
  duration: { fast: 150, normal: 220, slow: 320, pulse: 180 },
  ease: { out: "outExpo", inOut: "inOutQuad" },
  staggerMs: 40,
  staggerCap: 12,
  distance: { card: 6, hover: 2, tab: 4 },
  searchDebounceMs: 150,
} as const;

/** Shared hover styles for public directory cards. */
export const directoryCardClassName =
  "flex min-h-full flex-col transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none";

/** Chip press micro-interaction; disabled under reduced motion. */
export const directoryChipClassName =
  "rounded-full px-3 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

const gridAnimations = new WeakMap<ParentNode, JSAnimation>();
const countAnimations = new WeakMap<HTMLElement, JSAnimation>();

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cardDelay(index: number) {
  return Math.min(index, motion.staggerCap - 1) * motion.staggerMs;
}

function clearInlineMotion(el: HTMLElement) {
  el.style.opacity = "";
  el.style.transform = "";
}

function cancelStored(map: WeakMap<object, JSAnimation>, key: object) {
  const previous = map.get(key);
  if (!previous) return;
  previous.pause();
  previous.cancel();
  map.delete(key);
}

/**
 * Cancel any in-flight enter animation on the same root, then fade/slide cards in.
 * Cards are selected via `[data-motion="card"]`.
 */
export function playCardGridEnter(root: ParentNode | null): void {
  if (!root || typeof document === "undefined") return;

  cancelStored(gridAnimations, root);

  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-motion="card"]'));
  if (cards.length === 0) return;

  if (prefersReducedMotion()) {
    cards.forEach(clearInlineMotion);
    return;
  }

  cards.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = `translateY(${motion.distance.card}px)`;
  });

  const animation = animate(cards, {
    opacity: [0, 1],
    translateY: [motion.distance.card, 0],
    duration: motion.duration.normal,
    ease: motion.ease.out,
    delay: (_el: unknown, index?: number) => cardDelay(index ?? 0),
    onComplete: () => {
      cards.forEach(clearInlineMotion);
      if (gridAnimations.get(root) === animation) {
        gridAnimations.delete(root);
      }
    },
  });

  gridAnimations.set(root, animation);
}

/** Soft scale pulse when a match-count number changes. */
export function playMatchCountPulse(el: HTMLElement | null): void {
  if (!el || typeof document === "undefined") return;

  cancelStored(countAnimations, el);

  if (prefersReducedMotion()) {
    el.style.transform = "";
    return;
  }

  const animation = animate(el, {
    scale: [1, 1.08, 1],
    duration: motion.duration.pulse,
    ease: motion.ease.inOut,
    onComplete: () => {
      el.style.transform = "";
      if (countAnimations.get(el) === animation) {
        countAnimations.delete(el);
      }
    },
  });

  countAnimations.set(el, animation);
}
