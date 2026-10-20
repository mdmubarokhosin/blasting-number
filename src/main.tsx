import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { browserLocalPersistence, setPersistence } from "firebase/auth";
import "./styles/index.css";
import { App } from "./app/App";
import { auth } from "./lib/firebase";

function bootstrap(): void {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element #root not found");

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Render first: awaiting persistence can stall while the Auth emulator is
  // starting up. Local persistence is the web SDK default anyway.
  setPersistence(auth, browserLocalPersistence).catch((err: unknown) => {
    console.error("Failed to set auth persistence:", err);
  });
}

bootstrap();
