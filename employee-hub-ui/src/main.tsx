import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { msalInstance } from "@/lib/msal-config"
import "./index.css"
import App from "./App.tsx"

async function bootstrap() {
  if (msalInstance) {
    await msalInstance.initialize()
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
