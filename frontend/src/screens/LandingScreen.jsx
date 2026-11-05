import { useState } from "react";
import Composer from "../components/Composer";
import Logo from "../components/Logo";
import { HowItWorks, Trust, UnderTheHood } from "./LandingSections";
import { followLink } from "../lib/router";

const GITHUB_URL = "https://github.com/alanbabu518-spec/playmaker-ai";
const NAV = [
  { id: "how", label: "How it works" },
  { id: "trust", label: "Trust" },
  { id: "hood", label: "Under the hood" },
];
const EXAMPLES = [
  { label: "How does offside work?", question: "How does offside work?" },
  { label: "Messi’s clubs", question: "Which clubs has Messi played for?" },
  { label: "Who won in 2014?", question: "Who won the 2014 World Cup?" },
];

const gold =
  "min-h-11 rounded-xl border border-gold-edge bg-gold px-5 text-base font-semibold text-pitch shadow-sm hover:brightness-95";

function scrollTo(id) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingScreen({ onAsk, onOpen }) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <header className="sticky top-0 z-20 bg-chalk/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-3 md:px-10">
          <a
            href="/"
            onClick={(event) => followLink(event, "/")}
            className="flex items-center gap-2.5 text-xl font-semibold"
          >
            <Logo size={30} /> Playmaker AI
          </a>
          <nav
            aria-label="Main"
            className="flex items-center gap-7 text-base font-medium"
          >
            <div className="hidden items-center gap-7 md:flex">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className="hover:underline"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={onOpen} className={gold}>
              Try it
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="hero-title"
          className="bg-pitch bg-cover bg-center text-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(11,58,41,.9) 0%, rgba(11,58,41,.6) 55%, rgba(11,58,41,.3) 100%), url('/images/playmaker.jpg')",
          }}
        >
          <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-10 md:py-24">
            <div className="max-w-[540px]">
              <h1
                id="hero-title"
                className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
              >
                Football answers you can check.
              </h1>
              <p className="mt-5 text-xl text-white/90">
                Ask anything about football. Every answer comes with the sources
                it was built from.
              </p>
              <div className="mt-7">
                <Composer
                  id="ask-landing"
                  variant="landing"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={onAsk}
                  placeholder="Who won the 2014 World Cup?"
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => onAsk(ex.question)}
                    className="min-h-11 rounded-full bg-white px-4 text-base font-semibold text-pitch shadow-sm hover:bg-sage"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Trust />
        <UnderTheHood />

        <section
          aria-labelledby="cta-title"
          className="bg-pitch px-5 py-20 text-center text-white"
        >
          <h2
            id="cta-title"
            className="text-4xl font-bold tracking-tight md:text-5xl"
          >
            Ask your first question.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Free to try. Every answer comes with its sources.
          </p>
          <button
            type="button"
            onClick={onOpen}
            className={`${gold} mt-7 !px-7 text-lg`}
          >
            Open Playmaker AI
          </button>
        </section>
      </main>

      <footer className="bg-chalk">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-moss md:px-10">
          <span>
            Playmaker AI · Answers come from Wikipedia football sources
          </span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View the code on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
