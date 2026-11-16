import { Fragment } from "react";
import { ArrowUp, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import Logo from "./Logo";
import { followLink } from "../lib/router";
import { EASE, Reveal, useInView } from "./Landingkit";

const GITHUB_URL = "https://github.com/alanbabu518-spec/playmaker-ai";
const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Association_football";

const EXPLORE = [
  { id: "how", label: "How it works" },
  { id: "trust", label: "Trust" },
  { id: "hood", label: "Under the hood" },
  { id: "faq", label: "FAQ" },
];

const HEADING = [
  { text: "Ask your first", accent: false },
  { text: "football question.", accent: true },
];

function scrollToSection(id) {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}

// Each word rises out of its own mask, one after another. Accent words use the serif, upright.
function RiseHeading({ id }) {
  const [ref, seen] = useInView("0px 0px -20% 0px");
  const words = HEADING.flatMap((part) =>
    part.text.split(" ").map((word) => ({ word, accent: part.accent })),
  );

  return (
    <h2 id={id} ref={ref} className="heading-1 max-w-[680px] text-white">
      {words.map(({ word, accent }, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.15em] align-top -mb-[0.15em]">
            <span
              style={{ transitionDelay: seen ? `${i * 80}ms` : "0ms" }}
              className={`inline-block transition-transform duration-1000 ${EASE} motion-reduce:transition-none ${
                seen ? "translate-y-0" : "translate-y-[110%]"
              } ${accent ? "font-serif font-normal" : ""}`}
            >
              {word}
            </span>
          </span>{" "}
        </Fragment>
      ))}
    </h2>
  );
}

// Closing call to action: the stadium photo under a flat green tint, with the one primary action.
export function CtaBand({ onOpen }) {
  const [ref, seen] = useInView("0px 0px -10% 0px");

  return (
    <section ref={ref} aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-pitch text-white">
      <img
        src="/images/cta.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`absolute inset-0 -z-10 h-full w-full object-cover object-[35%_50%] transition-transform duration-[1600ms] ${EASE} motion-reduce:transition-none ${
          seen ? "scale-100" : "scale-110"
        }`}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-pitch/70" />

      <div className="mx-auto flex min-h-[560px] max-w-[1120px] flex-col items-center justify-center px-4 pb-24 pt-20 text-center md:min-h-[640px] md:px-10 md:pb-32 md:pt-24">
        <RiseHeading id="cta-title" />

        <Reveal delay={500}>
          <p className="title-1 mt-6 max-w-[540px] text-white/80">
            Free to try. Every answer comes with its sources.
          </p>
        </Reveal>

        <Reveal delay={650} className="mt-8">
          <button
            type="button"
            onClick={onOpen}
            className={`button-lg group inline-flex min-h-[44px] items-center gap-3 rounded-full border border-gold-edge bg-gold py-2 pl-6 pr-2 text-pitch shadow-lg shadow-black/30 transition-[translate,scale] duration-300 ${EASE} hover:-translate-y-0.5 active:scale-[0.98]`}
          >
            Open Playmaker AI
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pitch text-gold">
              <ArrowUpRight
                size={20}
                aria-hidden="true"
                className={`transition-transform duration-500 ${EASE} group-hover:-translate-y-0.5 group-hover:translate-x-0.5`}
              />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}

const linkClass = `body-5 inline-flex py-2 text-left text-white/70 transition-[translate,color] duration-300 ${EASE} hover:translate-x-1 hover:text-white`;

// A flat green sheet that overlaps the photo, then brand, links and the bottom bar.
export function SiteFooter({ onOpen }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 -mt-8 rounded-t-3xl bg-pitch text-white">
      <div className="mx-auto max-w-[1120px] px-4 pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <Reveal className="md:col-span-2">
            <a
              href="/"
              onClick={(event) => followLink(event, "/")}
              className="body-1 inline-flex min-h-[44px] items-center gap-3 rounded-lg text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-900">
                <Logo size={28} />
              </span>
              Playmaker AI
            </a>
            <p className="body-3 mt-4 max-w-[32ch] text-white/70">
              Football answers you can check, with the sources behind every claim.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Playmaker AI on GitHub"
              className={`mt-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-[translate,background-color] duration-300 ${EASE} hover:-translate-y-0.5 hover:bg-white/20`}
            >
              <GithubLogo size={23} aria-hidden="true" />
            </a>
          </Reveal>

          <Reveal delay={100}>
            <h3 className="body-4 text-white">Explore</h3>
            <ul className="mt-3 flex flex-col">
              {EXPLORE.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => scrollToSection(item.id)} className={linkClass}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <h3 className="body-4 text-white">Project</h3>
            <ul className="mt-3 flex flex-col">
              <li>
                <button type="button" onClick={onOpen} className={linkClass}>
                  Open Playmaker AI
                </button>
              </li>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  View the code
                </a>
              </li>
              <li>
                <a href={WIKIPEDIA_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Wikipedia sources
                </a>
              </li>
            </ul>
          </Reveal>
        </div>

        <div aria-hidden="true" className="mt-16 h-px bg-white/15" />
        <div className="flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="body-6 text-white/70">
            © {year} Playmaker AI. Answers come from Wikipedia football sources.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            className={`body-5 inline-flex min-h-[44px] items-center gap-2 text-white/70 transition-colors duration-300 ${EASE} hover:text-white`}
          >
            Back to top
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}