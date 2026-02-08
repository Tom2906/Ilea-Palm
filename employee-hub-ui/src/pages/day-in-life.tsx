import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import type { ChatMessage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Copy, RotateCcw, Loader2, Mic } from "lucide-react"
import ReactMarkdown from "react-markdown"

// Browser speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function DayInLifePage() {
  const { hasPermission } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const started = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-GB"

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ""
        let final = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript + " "
          } else {
            interim += transcript
          }
        }

        if (final) {
          setInput((prev) => (prev + " " + final).trim())
          setInterimTranscript("")
        } else {
          setInterimTranscript(interim)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event)
        setIsListening(false)
        setInterimTranscript("")
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript("")
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Auto-start conversation on mount
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendToApi([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendToApi(conversation: ChatMessage[]) {
    setStreaming(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api"
      const token = api.getToken()

      const response = await fetch(`${apiBase}/day-in-life/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: conversation }),
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 503) {
          setError("AI service is not configured. Please contact your administrator.")
        } else if (response.status === 403) {
          setError("You do not have permission to use this feature.")
        } else {
          setError(`Error: ${response.statusText}`)
        }
        setStreaming(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setError("Streaming not supported by browser.")
        setStreaming(false)
        return
      }

      const decoder = new TextDecoder()
      let assistantContent = ""
      let hasError = false

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                // Handle error from backend
                setError(parsed.error)
                hasError = true
                break
              } else if (parsed.content) {
                assistantContent += parsed.content
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent }
                  return updated
                })
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk:", data, e)
              // skip malformed chunks
            }
          }

          if (hasError) break
        }
      } finally {
        reader.releaseLock()
      }

      // Remove empty assistant message if there was an error or no content
      if (hasError || !assistantContent.trim()) {
        setMessages((prev) => prev.slice(0, -1))
        if (!hasError && !assistantContent.trim()) {
          setError("No response received from AI service.")
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Clean up placeholder message on abort
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
            return prev.slice(0, -1)
          }
          return prev
        })
        return
      }
      setError((err as Error).message || "Failed to connect to AI service.")
      // Remove placeholder message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: ChatMessage = { role: "user", content: text }
    const newConversation = [...messages, userMsg]
    setMessages(newConversation)
    setInput("")
    sendToApi(newConversation)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function startListening() {
    if (!recognitionRef.current || streaming) return
    try {
      setInterimTranscript("")
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.error("Failed to start speech recognition:", err)
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setIsListening(false)
      setInterimTranscript("")
    } catch (err) {
      console.error("Failed to stop speech recognition:", err)
    }
  }

  function handleReset() {
    if (streaming) {
      abortRef.current?.abort()
    }
    if (isListening) {
      stopListening()
    }
    setMessages([])
    setInput("")
    setError(null)
    started.current = false
    // Restart
    setTimeout(() => {
      started.current = true
      sendToApi([])
    }, 100)
  }

  async function handleCopyDocument() {
    // Find the final document in the last assistant message
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant) return
    try {
      await navigator.clipboard.writeText(lastAssistant.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = lastAssistant.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasFinalDocument = messages.some(
    (m) => m.role === "assistant" && m.content.includes("FINAL DOCUMENT")
  )

  if (!hasPermission("day_in_life.use")) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        You do not have permission to access this feature.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          AI-guided document builder for children's care records
        </p>
        <div className="flex gap-2">
          {hasFinalDocument && (
            <Button variant="outline" size="sm" onClick={handleCopyDocument}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copied!" : "Copy Document"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-lg p-4 space-y-4 bg-muted/20">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                  : "bg-muted prose prose-sm max-w-none"
              }`}
            >
              {msg.content ? (
                msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
          </div>
        ))}
        {streaming && (messages.length === 0 || messages[messages.length - 1].role === "user") && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-destructive py-2">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2 mt-4">
        {interimTranscript && (
          <div className="text-sm text-muted-foreground italic px-3 py-2 bg-muted/50 rounded-md">
            {interimTranscript}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening..."
                : streaming
                  ? "Waiting for response..."
                  : "Type or hold mic to speak..."
            }
            disabled={streaming}
            className="min-h-[100px] max-h-[300px] resize-none text-base"
            rows={3}
          />
          <div className="flex flex-col gap-2 shrink-0">
            {speechSupported && (
              <Button
                onPointerDown={(e) => {
                  e.preventDefault()
                  startListening()
                }}
                onPointerUp={(e) => {
                  e.preventDefault()
                  stopListening()
                }}
                onPointerLeave={(e) => {
                  e.preventDefault()
                  if (isListening) stopListening()
                }}
                disabled={streaming}
                size="icon"
                variant={isListening ? "default" : "outline"}
                className={`h-[60px] w-[60px] ${isListening ? "animate-pulse" : ""}`}
                title="Hold to speak"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              size="icon"
              className="shrink-0 h-[60px] w-[60px]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
