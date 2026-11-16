import LandingHero from "./LandingHero";
import { CtaBand, SiteFooter } from "../components/Ctafooter";
import {
  Evidence,
  Faq,
  HowItWorks,
  Tagline,
  Trust,
  UnderTheHood,
} from "./LandingSections";

function skipToContent(event) {
  event.preventDefault();
  const main = document.getElementById("main");
  main?.focus();
  main?.scrollIntoView();
}

export default function LandingScreen({ onAsk, onOpen }) {
  return (
    <div className="landing-root bg-chalk text-pitch">
      <a
        href="#main"
        onClick={skipToContent}
        className="body-4 sr-only z-50 rounded-lg bg-white px-3 py-2 text-pitch focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero: the glass nav pill and the full-screen photo hero live together in LandingHero. */}
        <LandingHero onAsk={onAsk} onOpen={onOpen} />

        <Tagline />
        <HowItWorks />
        <Trust />
        <UnderTheHood />
        <Evidence />
        <Faq />

        <CtaBand onOpen={onOpen} />
      </main>

      <SiteFooter onOpen={onOpen} />
    </div>
  );
}
