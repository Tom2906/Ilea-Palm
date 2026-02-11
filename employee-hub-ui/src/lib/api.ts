const TOKEN_KEY = "auth_token"

// JWT storage: localStorage is acceptable here because this is a single-customer internal tool
// behind Cloudflare Tunnel with CSP script-src 'self' blocking XSS (the primary attack vector
// for token theft). No third-party scripts are loaded. HttpOnly cookies would add significant
// complexity (MSAL redirect flow + SameSite + Cloudflare domain config) for marginal gain.

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem(TOKEN_KEY)
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem(TOKEN_KEY, token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem(TOKEN_KEY)
  }

  getToken() {
    return this.token
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api'
    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && this.token) {
      this.clearToken()
      window.location.href = "/login"
      throw new Error("Session expired")
    }

    if (!response.ok) {
      const text = await response.text()
      let message = text
      try {
        const json = JSON.parse(text)
        message = json.error || json.title || text
      } catch {
        // use raw text
      }
      throw new Error(message)
    }

    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  get<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint)
  }

  post<T = unknown>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T = unknown>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  delete<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const api = new ApiClient()
