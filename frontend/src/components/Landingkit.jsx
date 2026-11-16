import { createElement, Fragment, useEffect, useRef, useState } from "react";

// One easing curve for the whole page: weighted, decelerates into place.
export const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const goldBase = `inline-flex min-h-[44px] items-center justify-center gap-2 border border-gold-edge bg-gold px-3 py-2 text-pitch shadow-sm transition-[translate,scale,transform,filter] duration-300 ${EASE} hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.98]`;
export const goldButton = `${goldBase} button-md rounded-xl`;
export const goldButtonLg = `${goldBase} button-lg rounded-xl`;
// Inside the floating nav (8px padding on a 16px radius) the inner radius is 16 - 8 = 8.
export const goldButtonNested = `${goldBase} button-sm rounded-lg`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Fires once when the element nears the viewport. IntersectionObserver instead of a
// scroll listener, so nothing runs on every frame.
export function useInView(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, seen];
}

// Rises 32px and fades in over 700ms, once. Reduced motion keeps only the fade.
export function Reveal({ as = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, seen] = useInView();
  return createElement(
    as,
    {
      ref,
      ...rest,
      style: { transitionDelay: seen ? `${delay}ms` : "0ms" },
      className: `transition-[translate,transform,opacity] duration-700 ${EASE} motion-reduce:transition-opacity ${
        seen
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 motion-reduce:translate-y-0"
      } ${className}`,
    },
    children,
  );
}

function Word({ children }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    // Trigger line sits 65% down the viewport. A word that is already above it
    // (anchor jump, fast scroll) lights up too, so nothing stays muted by accident.
    const io = new IntersectionObserver(
      ([entry]) => {
        const pastLine = entry.boundingClientRect.top < window.innerHeight * 0.65;
        if (entry.isIntersecting || pastLine) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={`transition-opacity duration-500 ${EASE} ${on ? "opacity-100" : "opacity-30"}`}
    >
      {children}
    </span>
  );
}

// Tagline reveal: each word moves from 30% to full opacity as it crosses the trigger line.
export function WordReveal({ text, className = "" }) {
  return (
    <p className={className}>
      {text.split(" ").map((word, i) => (
        <Fragment key={i}>
          <Word>{word}</Word>{" "}
        </Fragment>
      ))}
    </p>
  );
}