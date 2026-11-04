import { useEffect } from "react";
import { isMock } from "./api/client";
import { useChat } from "./hooks/useChat";
import { goTo, useRoute } from "./lib/router";
import AppScreen from "./screens/AppScreen";
import LandingScreen from "./screens/LandingScreen";

export default function App() {
  const route = useRoute();
  const chat = useChat();

  useEffect(() => {
    window.scrollTo(0, 0); // every screen change starts at the top
  }, [route]);

  useEffect(() => {
    document.title =
      route === "app"
        ? "Ask · Playmaker AI"
        : "Playmaker AI: football answers you can check";
  }, [route]);

  return (
    <>
      {isMock ? (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-notice py-1 text-center text-sm font-semibold text-notice-ink"
        >
          Demo mode: these are sample answers, not real results.
        </div>
      ) : null}
      {route === "app" ? (
        <AppScreen chat={chat} />
      ) : (
        <LandingScreen
          onOpen={() => goTo("app")}
          onAsk={(question) => {
            goTo("app");
            chat.ask(question);
          }}
        />
      )}
    </>
  );
}
