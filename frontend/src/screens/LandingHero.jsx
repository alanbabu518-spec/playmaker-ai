import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpenText,
  CheckCircle,
  List,
  MagnifyingGlass,
  SealCheck,
  X,
} from "@phosphor-icons/react";
import Logo from "../components/Logo";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { followLink } from "../lib/router";

const GITHUB_URL = "https://github.com/alanbabu518-spec/playmaker-ai";
const NAV = [
  { id: "how", label: "How it works" },
  { id: "trust", label: "Trust" },
  { id: "hood", label: "Under the hood" },
  { id: "faq", label: "FAQ" },
];
const EXAMPLES = [
  { label: "How does offside work?", question: "How does offside work?" },
  { label: "Messi’s clubs", question: "Which clubs has Messi played for?" },
  { label: "Who won in 2014?", question: "Who won the 2014 World Cup?" },
];
const PROOF = [
  { Icon: SealCheck, text: "Every claim cited" },
  { Icon: BookOpenText, text: "Wikipedia football sources" },
  { Icon: CheckCircle, text: "Free to try" },
];
const SAMPLE_QUESTION = "Who won the 2014 World Cup?";

function scrollTo(id) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* White pill with a dark circle that holds the arrow. Feedback lands on touch-down (.press). */
function PillButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press group inline-flex min-h-11 items-center gap-2.5 rounded-full bg-white py-1 pl-4 pr-1 text-base font-semibold text-pitch shadow-sm hover:bg-sage ${className}`}
    >
      {children}
      <span className="grid h-9 w-9 place-items-center rounded-full bg-pitch text-white">
        <ArrowUpRight
          size={16}
          aria-hidden="true"
          className="transition-transform duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transform-none"
        />
      </span>
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md border border-gold-edge bg-gold px-1 align-middle text-[0.8rem] font-bold leading-none text-pitch">
      {children}
    </span>
  );
}

/* ---------- Floating glass nav ---------- */

function HeroNav({ onOpen }) {
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  // Over the photo the bar is light glass; over the pale sections below it turns nearly solid so the
  // white text always keeps its contrast.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setSolid(window.scrollY > 48);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Esc and a press outside both close the menu.
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  const go = (id) => {
    setMenu(false);
    scrollTo(id);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:px-5 md:pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      <div
        ref={wrapRef}
        className="pointer-events-auto relative mx-auto max-w-[1480px]"
      >
        <nav
          aria-label="Main"
          data-solid={solid || menu}
          className="glass-dark grid grid-cols-[1fr_auto] items-center rounded-full py-1.5 pl-5 pr-1.5 text-white md:grid-cols-[1fr_auto_1fr]"
        >
          <a
            href="/"
            onClick={(event) => followLink(event, "/")}
            className="flex w-fit items-center gap-2.5 text-xl font-semibold tracking-tight"
          >
            <Logo size={28} /> Playmaker AI
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="press min-h-11 rounded-full px-3.5 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex min-h-11 items-center rounded-full px-3.5 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
            >
              GitHub
            </a>
          </div>

          <div className="flex items-center justify-end gap-2">
            <PillButton onClick={onOpen}>Try it</PillButton>
            <button
              ref={buttonRef}
              type="button"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              aria-controls="hero-menu"
              onClick={() => setMenu((open) => !open)}
              className="press grid h-11 w-11 place-items-center rounded-full bg-white text-pitch md:hidden"
            >
              {menu ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <List size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* The sheet grows out of the button that opened it (top right) and returns to it. */}
        <div
          id="hero-menu"
          inert={!menu}
          data-solid="true"
          className={`glass-dark absolute right-0 top-[calc(100%+8px)] w-[min(20rem,100%)] origin-top-right rounded-3xl p-2 text-white transition-[opacity,scale,filter,visibility] duration-200 ease-out motion-reduce:scale-100 motion-reduce:blur-0 md:hidden ${
            menu
              ? "visible scale-100 opacity-100 blur-0"
              : "invisible scale-90 opacity-0 blur-sm"
          }`}
        >
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className="flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-lg font-medium active:bg-white/15"
            >
              {item.label}
            </button>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-lg font-medium active:bg-white/15"
          >
            GitHub
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Floating glass answer card (the "subscription" card of the reference) ---------- */

function AnswerCard({ onAsk }) {
  return (
    <aside
      aria-label="Example answer"
      style={{ "--d": "650ms" }}
      className="hero-card-in relative z-10 mx-5 mb-5 mt-2 overflow-hidden rounded-3xl text-white shadow-2xl shadow-black/25 md:mx-12 md:mb-12 lg:absolute lg:bottom-12 lg:right-12 lg:m-0 lg:w-[23rem]"
    >
      <div className="flex items-center justify-between bg-white px-5 py-2.5 text-pitch">
        <span className="text-lg font-semibold">Example answer</span>
        <span className="flex items-center gap-2 text-base font-semibold">
          <Badge>2</Badge> sources
        </span>
      </div>

      <div className="glass !rounded-none !border-x-0 !border-b-0 bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,0.22),transparent_60%)] px-5 pb-4 pt-3">
        <p className="text-base italic text-white/85">{SAMPLE_QUESTION}</p>
        <p className="mt-1 flex items-center gap-2 text-[1.9rem] font-semibold leading-none tracking-tight">
          Germany <Badge>1</Badge>
        </p>
        <p className="mt-1.5 text-base leading-snug text-white/90">
          Beat Argentina 1–0 after extra time, Götze scoring in the 113th minute
          <span className="ml-1.5 align-middle">
            <Badge>2</Badge>
          </span>
        </p>

        <button
          type="button"
          onClick={() => onAsk(SAMPLE_QUESTION)}
          className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-base font-semibold text-white hover:bg-white/25"
        >
          Try this question
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

/* ---------- Ask box ----------
   One white pill: a search icon, a roomy field, and a gold Ask button as the single obvious action.
   Enter sends. An empty send just puts the cursor back in the field. */

function AskBox({ onAsk, compact = false }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const submit = (event) => {
    event.preventDefault();
    const question = value.trim();
    if (!question) {
      inputRef.current?.focus();
      return;
    }
    onAsk(question);
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`flex items-center gap-2 rounded-full bg-white pl-5 pr-1.5 shadow-xl shadow-black/25 ring-4 ring-white/15 transition-shadow duration-200 focus-within:ring-gold/60 ${
        compact ? "h-14" : "h-16"
      }`}
    >
      <label htmlFor="ask-landing" className="sr-only">
        Ask a football question
      </label>
      <MagnifyingGlass
        size={20}
        aria-hidden="true"
        className="shrink-0 text-moss"
      />
      <input
        ref={inputRef}
        id="ask-landing"
        name="question"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        enterKeyHint="send"
        placeholder="Ask anything about football…"
        className="composer-field min-w-0 flex-1 bg-transparent text-lg text-pitch outline-none placeholder:text-moss/70"
      />
      <button
        type="submit"
        className={`press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-5 text-base font-semibold text-pitch hover:brightness-105 ${
          compact ? "h-11" : "h-12"
        }`}
      >
        Ask
        <ArrowUp size={16} weight="bold" aria-hidden="true" />
      </button>
    </form>
  );
}

/* ---------- Desktop and tablet hero (768px and up) ---------- */

function DesktopHero({ onAsk }) {
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-svh flex-col overflow-hidden bg-pitch text-white"
      >
        <img
          src="/images/hero.png"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="hero-photo-in absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] md:object-center"
        />
        {/* Legibility scrims: from the bottom on a phone, from the left on a wide screen. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,32,22,0.55)_0%,rgba(6,32,22,0.35)_38%,rgba(6,32,22,0.85)_100%)] md:bg-[linear-gradient(90deg,rgba(6,32,22,0.82)_0%,rgba(6,32,22,0.5)_48%,rgba(6,32,22,0.1)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 hidden h-40 bg-gradient-to-b from-black/25 to-transparent md:block"
        />

        <div className="relative mx-auto flex w-full max-w-[1480px] flex-1 flex-col">
          <div className="flex w-full flex-1 flex-col justify-center px-5 pb-8 pt-[calc(env(safe-area-inset-top,0px)+104px)] md:px-12 md:pb-16 md:pt-32">
            <div className="max-w-[34rem]">
              <h1
                id="hero-title"
                style={{ "--d": "100ms" }}
                className="hero-in text-[clamp(2.9rem,8vw,5.6rem)] font-normal leading-[1.02] tracking-[-0.03em]"
              >
                Football answers
                <em className="block font-medium italic">
                  you can check<span className="text-gold">.</span>
                </em>
              </h1>

              <p
                style={{ "--d": "180ms" }}
                className="hero-in mt-5 max-w-[26rem] text-[1.15rem] leading-relaxed text-white/80"
              >
                Ask anything about football. Every answer comes with the sources
                it was built from.
              </p>

              <div style={{ "--d": "260ms" }} className="hero-in mt-8">
                <AskBox onAsk={onAsk} />
              </div>

              <div
                style={{ "--d": "340ms" }}
                className="hero-in mt-4 flex flex-wrap items-center gap-2"
              >
                <span className="mr-1 text-sm font-semibold uppercase tracking-wider text-white/60">
                  Try
                </span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => onAsk(ex.question)}
                    className="press glass min-h-11 rounded-full px-4 text-base font-medium text-white hover:bg-white/25"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <ul
                style={{ "--d": "420ms" }}
                className="hero-in mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-base text-white/75"
              >
                {PROOF.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon size={20} aria-hidden="true" className="text-gold" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <AnswerCard onAsk={onAsk} />
        </div>
      </section>
    </>
  );
}

/* ---------- Mobile hero (under 768px): its own layout, built for one thumb ----------
   The photo fills the screen and the content is docked to the bottom, where the thumb is.
   100svh so the browser bar never cuts it off, safe-area padding for the notch and home bar,
   a horizontally scrolling chip row, and one big tappable example instead of a floating card. */

function MobileHero({ onAsk }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-pitch text-white"
    >
      <img
        src="/images/hero.png"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="hero-photo-in absolute inset-0 -z-20 h-full w-full object-cover object-[66%_center]"
      />
      {/* A light flat tint over the whole photo, and a deeper fade where the text sits. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-pitch/30" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-[80%] bg-gradient-to-t from-pitch via-pitch/85 to-transparent"
      />

      <div className="relative px-4 pt-[calc(env(safe-area-inset-top,0px)+88px)] pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
        <h1
          id="hero-title"
          style={{ "--d": "60ms" }}
          className="hero-in text-[2.75rem] font-normal leading-[1.02] tracking-[-0.028em]"
        >
          Football answers
          <em className="block font-medium italic">
            you can check<span className="text-gold">.</span>
          </em>
        </h1>

        <p
          style={{ "--d": "140ms" }}
          className="hero-in mt-3 max-w-[22rem] text-lg leading-snug text-white/85"
        >
          Ask anything about football. Every answer comes with its sources.
        </p>

        <div style={{ "--d": "220ms" }} className="hero-in mt-5">
          <AskBox onAsk={onAsk} compact />
        </div>

        {/* One row that scrolls sideways with native snapping. No touch-action override, so a
            vertical swipe that starts on a chip still scrolls the page. */}
        <div
          style={{ "--d": "300ms" }}
          className="hero-in -mx-4 mt-3 flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => onAsk(ex.question)}
              className="press glass min-h-11 shrink-0 snap-start rounded-full px-4 text-base font-medium text-white"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* The example answer, as one big tap target. */}
        <button
          type="button"
          onClick={() => onAsk(SAMPLE_QUESTION)}
          style={{ "--d": "420ms" }}
          className="press hero-card-in glass mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm italic text-white/75">
              Example · {SAMPLE_QUESTION}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xl font-semibold leading-tight">
              Germany <Badge>1</Badge>
              <span className="truncate text-base font-normal text-white/85">
                1–0 after extra time
              </span>
            </span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-pitch">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </button>
      </div>
    </section>
  );
}

/* ---------- Hero: picks the layout; the nav is shared ---------- */

export default function LandingHero({ onAsk, onOpen }) {
  const wide = useMediaQuery("(min-width: 768px)");

  return (
    <>
      <HeroNav onOpen={onOpen} />
      {wide ? <DesktopHero onAsk={onAsk} /> : <MobileHero onAsk={onAsk} />}
    </>
  );
}
