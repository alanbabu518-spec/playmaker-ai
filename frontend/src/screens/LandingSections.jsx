import { FlagIcon } from '../components/Icons'
import PassLine from '../components/PassLine'

const STEPS = [
  { title: 'Search the sources', text: 'Your question is matched against football passages from Wikipedia.' },
  { title: 'Check the passages', text: 'Only passages that actually answer it are kept.' },
  { title: 'Write a cited answer', text: 'Every claim links to the source it came from, or it says it doesn’t know.' },
]

const HOOD = [
  { title: 'Sources first', text: 'Answers are built from the passages it finds, not from memory.' },
  { title: 'Adjustable depth', text: 'Check anywhere from 1 to 10 sources per question.' },
  { title: 'Cited or checked', text: 'Used sources are marked apart from the ones only looked at.' },
  { title: 'Fair daily limit', text: 'A daily quota keeps it available, and the app says clearly when it’s used up.' },
]

function Badge({ children }) {
  return (
    <span className="mx-1 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-gold-edge bg-gold px-1.5 align-middle font-sans text-sm font-bold text-pitch">
      {children}
    </span>
  )
}

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-16 bg-sage">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-10">
        <div>
          <h2 id="how-title" className="text-3xl font-bold">
            How it works
          </h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pitch text-lg font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-0.5 text-base text-moss">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <figure className="mx-auto w-full max-w-[400px]">
          <div className="relative overflow-hidden rounded-2xl bg-pitch px-8 py-10 shadow-xl shadow-pitch/20">
            <div aria-hidden="true" className="absolute left-1/2 top-0 h-full w-px bg-white/15" />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
            />
            <PassLine tone="dark" className="relative" />
          </div>
          <figcaption className="mt-3 text-center text-sm text-moss">What you see while it works</figcaption>
        </figure>
      </div>
    </section>
  )
}

export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-16">
      <div className="mx-auto max-w-[1120px] px-5 py-20 md:px-10">
        <h2 id="trust-title" className="text-3xl font-bold">
          Why you can trust it
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-line bg-white p-8 shadow-lg shadow-pitch/5">
            <h3 className="text-2xl font-bold">Every claim has a source</h3>
            <p className="mt-3 text-base text-moss">
              Citation badges sit right inside the answer. Sources the answer used are separated from the ones it only
              checked.
            </p>
            <p className="mt-5 font-serif text-xl">
              Götze scored in the 113th minute<Badge>2</Badge>.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-sage px-3 py-2.5 text-base">
              <Badge>2</Badge>
              <span className="font-semibold">2014 FIFA World Cup final</span>
              <span className="text-moss">· Match summary</span>
            </div>
          </article>

          <article className="rounded-3xl border border-line bg-white p-8 shadow-lg shadow-pitch/5">
            <FlagIcon />
            <h3 className="mt-3 text-2xl font-bold">It says “I don’t know”</h3>
            <p className="mt-3 text-base text-moss">
              If the sources don’t cover a question, such as a prediction, Playmaker AI says so instead of guessing, and
              suggests what to try next.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export function UnderTheHood() {
  return (
    <section id="hood" aria-labelledby="hood-title" className="scroll-mt-16 bg-[#f1f5f0]">
      <div className="mx-auto max-w-[1120px] px-5 py-20 md:px-10">
        <h2 id="hood-title" className="text-3xl font-bold">
          Under the hood
        </h2>
        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOOD.map((item) => (
            <div key={item.title} className="border-t-2 border-pitch/70 pt-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-base text-moss">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}