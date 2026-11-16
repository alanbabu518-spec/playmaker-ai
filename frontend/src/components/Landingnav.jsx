import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { followLink } from "../lib/router";
import { EASE, goldButton, goldButtonNested } from "./Landingkit";

const NAV = [
  { id: "how", label: "How it works" },
  { id: "trust", label: "Trust" },
  { id: "faq", label: "FAQ" },
];

function scrollToSection(id) {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}

// True once the page has moved off the very top. A 1px sentinel watched by
// IntersectionObserver, so no scroll listener runs on every frame.
function useScrolled() {
  const sentinel = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [sentinel, scrolled];
}

// Marks the section in view so the bar always shows where you are.
function useActiveSection() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) setActive(id);
          else setActive((current) => (current === id ? null : current));
        }),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV.map((item) => document.getElementById(item.id))
      .filter(Boolean)
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return active;
}

export default function LandingNav({ onOpen }) {
  const [open, setOpen] = useState(false);
  const [sentinel, scrolled] = useScrolled();
  const active = useActiveSection();

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = (event) => event.matches && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const go = (id) => {
    setOpen(false);
    setTimeout(() => scrollToSection(id), 50); // let the body scroll lock release first
  };

  // White over the dark hero at the top, dark once the bar turns solid or the menu is open.
  const dark = scrolled || open;
  const ink = dark ? "text-pitch" : "text-white";
  const colorFade = `transition-colors duration-300 ${EASE}`;
  const bar = `absolute left-0 h-0.5 w-5 rounded-full transition-[translate,rotate,transform,background-color] duration-500 ${EASE} ${dark ? "bg-pitch" : "bg-white"}`;

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-2 w-px" />

      <header
        className={`fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] ${colorFade} ${
          scrolled && !open
            ? "bg-chalk/90 shadow-sm shadow-pitch/10 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-2 md:px-10"
        >
          <a
            href="/"
            onClick={(event) => {
              setOpen(false);
              followLink(event, "/");
            }}
            className={`body-1 flex min-h-[44px] items-center gap-2 rounded-lg ${colorFade} ${ink}`}
          >
            <Logo size={28} /> Playmaker AI
          </a>

          <div className="flex items-center gap-3 md:gap-8">
            <div className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => {
                const current = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    aria-current={current ? "true" : undefined}
                    className={`title-4 min-h-[44px] decoration-gold-edge decoration-2 underline-offset-8 ${colorFade} ${
                      current
                        ? `${ink} underline`
                        : dark
                          ? "text-moss hover:text-pitch"
                          : "text-white/80 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={onOpen} className={goldButtonNested}>
              Try it
            </button>

            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
              className="flex h-[44px] w-[44px] items-center justify-center md:hidden"
            >
              <span className="relative block h-3 w-5" aria-hidden="true">
                <span className={`${bar} top-0 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`${bar} bottom-0 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Full height mobile panel. Links rise 24px and fade in, 60ms apart. */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-30 flex flex-col justify-center gap-2 bg-chalk/95 px-6 backdrop-blur-xl transition-opacity duration-500 ${EASE} md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {[...NAV.map((item) => ({ ...item, kind: "link" })), { id: "try", kind: "cta" }].map(
          (item, i) => (
            <div
              key={item.id}
              style={{ transitionDelay: open ? `${Math.min(i * 60, 400)}ms` : "0ms" }}
              className={`transition-[translate,transform,opacity] duration-500 ${EASE} motion-reduce:translate-y-0 ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              {item.kind === "link" ? (
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => go(item.id)}
                  aria-current={active === item.id ? "true" : undefined}
                  className={`heading-3 py-2 text-left ${active === item.id ? "text-pitch" : "text-moss"}`}
                >
                  {item.label}
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    setOpen(false);
                    onOpen();
                  }}
                  className={`${goldButton} mt-6`}
                >
                  Try it
                </button>
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
}