const TOKEN_KEY = "auth_token"

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

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
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
