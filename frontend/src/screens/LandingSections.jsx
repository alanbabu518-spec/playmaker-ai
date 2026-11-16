import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  CaretDown,
  CheckCircle,
  Flag,
  Gauge,
  ListChecks,
  MagnifyingGlass,
  Quotes,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { EASE, Reveal, WordReveal, useInView } from "../components/Landingkit";
import evalResults from "../data/evalResults.json";

const wrap = "mx-auto max-w-[1120px] px-4 md:px-10";
const pad = "py-20 md:py-24";
const card = `h-full rounded-2xl border border-line bg-white shadow-lg shadow-pitch/5 transition-transform duration-500 ${EASE} hover:-translate-y-1`;

const STEPS = [
  { Icon: MagnifyingGlass, title: "Search the sources", short: "Searching", text: "Your question is matched against football passages from Wikipedia." },
  { Icon: ListChecks, title: "Check the passages", short: "Checking", text: "Only passages that actually answer it are kept." },
  { Icon: Quotes, title: "Write a cited answer", short: "Answering", text: "Every claim links to the source it came from, or it says it doesn’t know." },
];

// What the stage shows for steps 1 and 2. Badge 2 is the one the answer cites, as in the hero example.
const PASSAGES = [
  { n: 1, title: "Germany national football team", keep: false },
  { n: 2, title: "2014 FIFA World Cup final", keep: true },
  { n: 3, title: "Argentina national football team", keep: false },
  { n: 4, title: "2010 FIFA World Cup", keep: false },
];

const FAQS = [
  { q: "Where do the answers come from?", a: "From football passages on Wikipedia. Playmaker AI searches those passages first and writes the answer only from what it finds, not from memory." },
  { q: "How can I check an answer?", a: "Each claim carries a numbered badge that points to the source passage it came from. Open the source and compare it with the answer." },
  { q: "What does it do when it doesn’t know?", a: "It says so. If the sources don’t cover a question, such as a prediction, it tells you and suggests what to try next instead of guessing." },
  { q: "What can I ask?", a: "Anything the Wikipedia football sources cover, for example rules like offside, the clubs a player has played for, or who won a tournament." },
  { q: "Does it cost anything?", a: "It’s free to try. A daily quota keeps Playmaker AI available for everyone, and the app tells you clearly when it’s used up." },
];

function Badge({ children, muted = false, className = "" }) {
  return (
    <span
      className={`caption-3 inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1 align-middle ${
        muted ? "border-line bg-white text-moss" : "border-gold-edge bg-gold text-pitch"
      } ${className}`}
    >
      {children}
    </span>
  );
}

function IconBox({ Icon }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage text-pitch">
      <Icon size={24} aria-hidden="true" />
    </span>
  );
}

function SectionHead({ eyebrow, id, title, className = "" }) {
  return (
    <div className="max-w-[680px]">
      <p className="caption-3 uppercase tracking-wide text-moss">{eyebrow}</p>
      <h2 id={id} className={`heading-3 mt-2 text-pitch ${className}`}>
        {title}
      </h2>
    </div>
  );
}

const PREVIEW_SOURCES = [
  { n: 1, title: "Germany national football team", used: false },
  { n: 2, title: "2014 FIFA World Cup final", used: true },
  { n: 3, title: "Argentina national football team", used: false },
];

// Hero visual: shows the product's one promise, an answer with its sources.
export function AnswerPreview() {
  return (
    <figure className="w-full max-w-[440px] justify-self-center lg:justify-self-end">
      <div className="rounded-2xl border border-line bg-white p-6 text-pitch shadow-2xl shadow-black/20 md:p-8">
        <p className="caption-3 uppercase tracking-wide text-moss">Example answer</p>
        <p className="title-2 mt-3">Who won the 2014 World Cup?</p>
        <p className="body-3 mt-4 font-serif">
          Germany won the final 1 to 0 against Argentina after extra time. Götze scored in the 113th minute
          <Badge className="mx-1">2</Badge>.
        </p>
        <ul className="mt-6 space-y-2">
          {PREVIEW_SOURCES.map((s) => (
            <li
              key={s.n}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${s.used ? "bg-sage" : "bg-chalk"}`}
            >
              <Badge muted={!s.used}>{s.n}</Badge>
              <span className="body-5 text-pitch">{s.title}</span>
              <span className="caption-4 ml-auto text-moss">{s.used ? "Cited" : "Checked"}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="caption-2 mt-3 text-center text-white/80">
        Sources used are marked apart from sources only checked.
      </figcaption>
    </figure>
  );
}

// Mandatory tagline reveal: its own large type moment, words light up one at a time.
export function Tagline() {
  return (
    <section aria-label="What makes it different" className="bg-chalk">
      <div className={`${wrap} ${pad}`}>
        <WordReveal
          className="heading-2 max-w-[680px] text-pitch"
          text="Every answer shows its work. Sources come first, claims come second, and when the sources run out, Playmaker AI says so."
        />
      </div>
    </section>
  );
}

// One surface that changes with the step, in the way product pages from Apple, Linear and Stripe do:
// a calm list on one side, a stage on the other. It plays through once when it scrolls into view,
// stops the moment you choose a step, and never loops.
export function HowItWorks() {
  const [ref, seen] = useInView("0px 0px -25% 0px");
  const [active, setActive] = useState(0);
  const chosen = useRef(false);

  useEffect(() => {
    if (!seen || chosen.current || active >= STEPS.length - 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setActive((step) => step + 1), 3200);
    return () => clearTimeout(timer);
  }, [seen, active]);

  const choose = (i) => {
    chosen.current = true;
    setActive(i);
  };

  const layer = (on) =>
    `absolute inset-0 transition-[opacity,translate] duration-500 ${EASE} ${
      on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 motion-reduce:translate-y-0"
    }`;

  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 bg-sage">
      <div className={`${wrap} ${pad}`}>
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            id="how-title"
            title="From question to cited answer in three steps"
            className="tracking-tight"
          />
          <p className="body-3 mt-3 max-w-[680px] text-moss">
            Playmaker AI shows its work at every step, so you always know where an answer came from.
          </p>
        </Reveal>

        <div ref={ref} className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-last lg:order-first">
            <ol className="space-y-2">
              {STEPS.map(({ Icon, title, text }, i) => {
                const on = i === active;
                return (
                  <li key={title}>
                    <button
                      type="button"
                      onClick={() => choose(i)}
                      aria-current={on ? "step" : undefined}
                      className={`flex w-full gap-4 rounded-2xl p-4 text-left transition-[translate,scale,background-color,box-shadow] duration-300 ${EASE} active:scale-[0.98] ${
                        on ? "bg-white shadow-lg shadow-pitch/10" : "hover:bg-white/60"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${EASE} ${
                          on ? "bg-pitch text-white" : "bg-white text-pitch"
                        }`}
                      >
                        <Icon size={24} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="caption-3 block uppercase tracking-wide text-moss">Step {i + 1}</span>
                        <span className="heading-6 mt-0.5 block text-pitch">{title}</span>
                        <span className="body-3 mt-1 block text-moss">{text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal delay={150} className="order-first lg:order-last">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-xl shadow-pitch/10 md:p-8">
              <p className="caption-3 uppercase tracking-wide text-moss" aria-live="polite">
                Step {active + 1} of {STEPS.length} · {STEPS[active].short}
              </p>

              <div className="relative mt-4 min-h-[340px]">
                {/* Steps 1 and 2: the passages found, then the ones kept. */}
                <div className={layer(active < 2)} aria-hidden={active === 2}>
                  <div className="flex items-center gap-3 rounded-xl bg-chalk px-3 py-3">
                    <MagnifyingGlass size={20} aria-hidden="true" className="shrink-0 text-moss" />
                    <span className="body-5 text-pitch">Who won the 2014 World Cup?</span>
                  </div>
                  <p className="caption-2 mt-5 text-moss">Football passages from Wikipedia</p>
                  <ul className="mt-2 space-y-2">
                    {PASSAGES.map((p, i) => {
                      const kept = active === 1 && p.keep;
                      const dim = active === 1 && !p.keep;
                      return (
                        <li
                          key={p.n}
                          style={{ transitionDelay: seen && active === 0 ? `${i * 80}ms` : "0ms" }}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-[opacity,translate,background-color] duration-500 ${EASE} motion-reduce:translate-y-0 ${
                            seen ? "translate-y-0" : "translate-y-2"
                          } ${!seen ? "opacity-0" : dim ? "opacity-40" : "opacity-100"} ${kept ? "bg-sage" : "bg-chalk"}`}
                        >
                          <Badge muted={!kept}>{p.n}</Badge>
                          <span className="body-5 text-pitch">{p.title}</span>
                          <span className="caption-4 ml-auto shrink-0 text-moss">
                            {active === 0 ? "Found" : p.keep ? "Kept" : "Not needed"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Step 3: the cited answer. */}
                <div className={layer(active === 2)} aria-hidden={active < 2}>
                  <p className="title-2 text-pitch">Who won the 2014 World Cup?</p>
                  <p className="body-3 mt-4 font-serif text-pitch">
                    Germany won the final 1 to 0 against Argentina after extra time. Götze scored in the 113th minute
                    <Badge className="mx-1">2</Badge>.
                  </p>
                  <div className="mt-6 flex items-center gap-3 rounded-lg bg-sage px-3 py-2">
                    <Badge>2</Badge>
                    <span className="body-5 text-pitch">2014 FIFA World Cup final</span>
                    <span className="caption-4 ml-auto shrink-0 text-moss">Cited</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-24 bg-chalk">
      <div className={`${wrap} ${pad}`}>
        <Reveal>
          <SectionHead eyebrow="Trust" id="trust-title" title="Check every answer yourself" />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Reveal className="h-full">
            <article className={`${card} p-8`}>
              <IconBox Icon={Quotes} />
              <h3 className="heading-5 mt-6 text-pitch">Every claim points to its source</h3>
              <p className="body-3 mt-2 text-moss">
                Citation badges sit right inside the answer. Sources the answer used are separated from the ones it
                only checked.
              </p>
              <div className="mt-8 rounded-xl bg-sage p-6">
                <p className="title-1 font-serif text-pitch">
                  Götze scored in the 113th minute<Badge className="mx-1">2</Badge>.
                </p>
                <div className="body-5 mt-4 flex flex-wrap items-center gap-2 text-pitch">
                  <Badge>2</Badge>
                  <span className="body-4">2014 FIFA World Cup final</span>
                  <span className="text-moss">· Match summary</span>
                </div>
              </div>
            </article>
          </Reveal>

          <Reveal delay={100} className="h-full">
            <article className={`${card} p-8`}>
              <IconBox Icon={Flag} />
              <h3 className="heading-5 mt-6 text-pitch">It says when it doesn’t know</h3>
              <p className="body-3 mt-2 text-moss">
                If the sources don’t cover a question, such as a prediction, Playmaker AI says so instead of
                guessing, and suggests what to try next.
              </p>
              <div className="mt-8 space-y-3">
                <p className="body-5 ml-auto w-fit max-w-full rounded-xl bg-pitch px-3 py-2 text-white">
                  Who will win the next World Cup?
                </p>
                <p className="body-5 rounded-xl bg-sage px-3 py-2 text-pitch">
                  The sources don’t cover predictions. Try asking who won a past tournament.
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const darkCard = `h-full rounded-2xl border border-pitch-soft bg-pitch text-white shadow-lg shadow-pitch/20 transition-transform duration-500 ${EASE} hover:-translate-y-1`;

// Every card pairs one plain sentence with a small picture of the thing it describes.
function HoodCard({ Icon, title, text, dark = false, children }) {
  return (
    <article className={`${dark ? darkCard : card} flex flex-col p-6 md:p-8`}>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          dark ? "bg-white/10 text-white" : "bg-sage text-pitch"
        }`}
      >
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className={`heading-6 mt-6 ${dark ? "text-white" : "text-pitch"}`}>{title}</h3>
      <p className={`body-3 mt-2 max-w-[44ch] ${dark ? "text-white/70" : "text-moss"}`}>{text}</p>
      <div className="mt-8 flex-1">{children}</div>
    </article>
  );
}

function SourcesVisual() {
  const rows = ["Germany national football team", "2014 FIFA World Cup final", "Argentina national football team"];
  return (
    <div>
      <p className="caption-2 text-white/70">Passages it found</p>
      <ul className="mt-2 space-y-2">
        {rows.map((title, i) => (
          <li key={title} className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
            <Badge muted>{i + 1}</Badge>
            <span className="body-5 text-white">{title}</span>
          </li>
        ))}
      </ul>
      <p className="caption-2 mt-4 rounded-lg bg-white px-3 py-2 text-pitch">
        The answer is written only from these passages.
      </p>
    </div>
  );
}

function CitedVisual() {
  return (
    <ul className="space-y-2">
      <li className="flex items-center gap-3 rounded-lg bg-sage px-3 py-2">
        <Badge>2</Badge>
        <span className="body-5 text-pitch">2014 FIFA World Cup final</span>
        <span className="caption-4 ml-auto shrink-0 text-moss">Cited</span>
      </li>
      <li className="flex items-center gap-3 rounded-lg bg-chalk px-3 py-2">
        <Badge muted>1</Badge>
        <span className="body-5 text-pitch">Germany national football team</span>
        <span className="caption-4 ml-auto shrink-0 text-moss">Checked</span>
      </li>
    </ul>
  );
}

function LimitVisual() {
  return (
    <div role="img" aria-label="Illustration of a daily quota meter">
      <p className="caption-2 text-moss">Daily quota</p>
      <div className="mt-2 grid grid-cols-10 gap-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2 rounded-full ${i < 7 ? "bg-pitch" : "bg-sage"}`} />
        ))}
      </div>
    </div>
  );
}

// A real control, so the feature is felt instead of described. The native range input tracks the
// pointer one to one and brings keyboard and screen reader support with it.
function DepthVisual() {
  const [n, setN] = useState(5);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor="depth-range" className="body-5 text-moss">
          Sources per question
        </label>
        <span className="heading-5 tabular-nums text-pitch" aria-hidden="true">
          {n}
        </span>
      </div>
      <input
        id="depth-range"
        type="range"
        min="1"
        max="10"
        step="1"
        value={n}
        onChange={(event) => setN(Number(event.target.value))}
        aria-valuetext={`${n} ${n === 1 ? "source" : "sources"}`}
        className="mt-3 h-11 w-full cursor-pointer accent-pitch"
      />
      <ul className="mt-2 grid grid-cols-10 gap-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <li
            key={i}
            className={`h-8 rounded-md transition-colors duration-300 ${EASE} ${i < n ? "bg-pitch" : "bg-sage"}`}
          />
        ))}
      </ul>
      <p className="caption-2 mt-3 text-moss">Drag to choose how many passages get checked.</p>
    </div>
  );
}

export function UnderTheHood() {
  return (
    <section id="hood" aria-labelledby="hood-title" className="scroll-mt-24 bg-sage">
      <div className={`${wrap} ${pad}`}>
        <Reveal>
          <SectionHead
            eyebrow="Under the hood"
            id="hood-title"
            title="Built to be checked, not trusted blindly"
            className="tracking-tight"
          />
          <p className="body-3 mt-3 max-w-[680px] text-moss">
            Four choices that keep every answer honest.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Reveal className="md:col-span-2 lg:col-span-4">
            <HoodCard
              dark
              Icon={BookOpenText}
              title="Sources first"
              text="Answers are built from the passages it finds, not from memory."
            >
              <SourcesVisual />
            </HoodCard>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-2">
            <HoodCard
              Icon={CheckCircle}
              title="Cited or checked"
              text="Used sources are marked apart from the ones only looked at."
            >
              <CitedVisual />
            </HoodCard>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-2">
            <HoodCard
              Icon={Gauge}
              title="Fair daily limit"
              text="A daily quota keeps it available, and the app says clearly when it’s used up."
            >
              <LimitVisual />
            </HoodCard>
          </Reveal>

          <Reveal delay={200} className="md:col-span-2 lg:col-span-4">
            <HoodCard
              Icon={SlidersHorizontal}
              title="Adjustable depth"
              text="Check anywhere from 1 to 10 sources per question."
            >
              <DepthVisual />
            </HoodCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-chalk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={`${wrap} ${pad} grid items-stretch gap-12 md:grid-cols-2 lg:gap-16`}>
        {/* The image fills the full height of the question list, so both columns start and end together. */}
        <Reveal className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-xl shadow-pitch/10 md:aspect-auto md:min-h-[420px]">
          <img
            src="/images/faq.jpg"
            width="735"
            height="490"
            loading="lazy"
            alt="Corner of a football pitch with the words Football is life"
            className="absolute inset-0 h-full w-full object-cover object-[25%_50%]"
          />
        </Reveal>

        <div>
          <Reveal>
            <SectionHead eyebrow="FAQ" id="faq-title" title="Frequently asked questions" />
            <p className="body-3 mt-2 max-w-[680px] text-moss">
              Short answers about sources, limits and what Playmaker AI can and can’t do.
            </p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 60, 300)}>
                <details className="group rounded-2xl border border-line bg-white shadow-sm">
                  <summary className="title-2 flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-6 text-pitch [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <CaretDown
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-500 ${EASE} group-open:rotate-180`}
                    />
                  </summary>
                  <p className="body-3 px-6 pb-6 text-moss group-open:animate-answer-in motion-reduce:animate-none">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const pct = (v) => (v == null ? "n/a" : `${Math.round(v * 100)}%`);
const two = (v) => (v == null ? "n/a" : v.toFixed(2));

function Stat({ value, label, note }) {
  return (
    <article className={`${card} p-6 md:p-8`}>
      <p className="heading-3 tabular-nums text-pitch">{value}</p>
      <h3 className="heading-6 mt-3 text-pitch">{label}</h3>
      <p className="body-5 mt-1 text-moss">{note}</p>
    </article>
  );
}

// Shows only numbers written by `python -m eval.publish_results`. Until then it renders nothing.
export function Evidence({ results = evalResults }) {
  if (!results?.published) return null;
  const { ragas, retrieval, pipeline } = results;
  const methods = ["keyword", "vector", "hybrid"].filter((m) => retrieval.compare?.[m]);
  const stats = [
    { value: two(ragas.faithfulness), label: "Faithfulness", note: "Claims in the answer that the sources support." },
    { value: two(ragas.context_precision), label: "Context precision", note: "Retrieved passages that were actually useful." },
    { value: two(ragas.context_recall), label: "Context recall", note: "Needed facts that retrieval found." },
    {
      value: pct(retrieval.hit_at_k),
      label: `Right page in top ${retrieval.k}`,
      note: `${retrieval.scored} questions, MRR ${two(retrieval.mrr)}.`,
    },
  ];

  return (
    <section id="results" aria-labelledby="results-title" className="scroll-mt-24 border-b border-line bg-chalk">
      <div className={`${wrap} ${pad}`}>
        <Reveal>
          <SectionHead eyebrow="Results" id="results-title" title="Measured, not claimed" className="tracking-tight" />
          <p className="body-3 mt-3 max-w-[680px] text-moss">
            Scores from the project’s own evaluation scripts, run on {results.generated}. The test sets are small, so
            read them as a quality check, not a benchmark.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={Math.min(i * 100, 300)} className="h-full">
              <Stat {...s} />
            </Reveal>
          ))}
        </div>

        {methods.length > 0 && (
          <Reveal className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-lg shadow-pitch/5">
              <table className="w-full min-w-[460px] text-left">
                <caption className="title-2 px-6 pt-6 text-left text-pitch">Why hybrid search</caption>
                <thead>
                  <tr className="caption-3 text-moss">
                    <th scope="col" className="px-6 py-3 font-medium">Method</th>
                    <th scope="col" className="px-3 py-3 font-medium">Rank 1</th>
                    <th scope="col" className="px-3 py-3 font-medium">Top 3</th>
                    <th scope="col" className="px-3 py-3 font-medium">Top {retrieval.k}</th>
                    <th scope="col" className="px-3 py-3 font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => {
                    const r = retrieval.compare[m];
                    return (
                      <tr key={m} className={`body-4 border-t border-line text-pitch ${m === "hybrid" ? "font-semibold" : ""}`}>
                        <th scope="row" className={`px-6 py-3 capitalize ${m === "hybrid" ? "font-semibold" : "font-normal"}`}>{m}</th>
                        <td className="px-3 py-3">{pct(r.hit_at_1)}</td>
                        <td className="px-3 py-3">{pct(r.hit_at_3)}</td>
                        <td className="px-3 py-3">{pct(r.hit_at_k)}</td>
                        <td className="px-3 py-3">{two(r.mrr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        <p className="body-5 mt-5 text-moss">
          Answer quality: {ragas.questions_scored} questions, judged by {ragas.judge_model} (RAGAS).
          {pipeline &&
            ` End to end: cited a source in ${pct(pipeline.citation_rate)} of answers, median ${
              Math.round(pipeline.latency_p50_ms / 100) / 10
            } s.`}
        </p>
      </div>
    </section>
  );
}

