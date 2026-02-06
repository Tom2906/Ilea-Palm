import { LogLevel } from "@azure/msal-browser"
import type { Configuration } from "@azure/msal-browser"

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID

export const msalEnabled = Boolean(clientId && tenantId)

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
}

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
}
