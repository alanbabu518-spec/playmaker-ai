import { useEffect } from "react";
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

  if (route === "app") return <AppScreen chat={chat} />;

  return (
    <LandingScreen
      onOpen={() => goTo("app")}
      onAsk={(question) => {
        goTo("app");
        chat.ask(question);
      }}
    />
  );
}
