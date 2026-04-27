import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { MessageCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendChat, type ChatMessage } from '@/lib/chat-client'
import type { DealerInfo } from '@/types'

interface ChatWidgetProps {
  dealer: DealerInfo
}

function storageKey(slug: string) {
  return `talos:chat:${slug}`
}

function loadMessages(slug: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        m && typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
  } catch {
    return []
  }
}

function saveMessages(slug: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(messages.slice(-40)))
  } catch {
    // ignore quota errors
  }
}

// Minimal rich text: bold between **…**, preserve line breaks. No HTML injection.
function RenderedText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

function renderInline(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{line.slice(last, m.index)}</span>)
    parts.push(<strong key={key++}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < line.length) parts.push(<span key={key++}>{line.slice(last)}</span>)
  return parts
}

export default function ChatWidget({ dealer }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string>('Sales Assistant')
  const scrollRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const params = useParams<{ unitId?: string }>()

  const pageContext = useMemo(
    () => ({ path: location.pathname, unitId: params.unitId }),
    [location.pathname, params.unitId],
  )

  // Load persisted messages on mount / dealer change
  useEffect(() => {
    setMessages(loadMessages(dealer.slug))
  }, [dealer.slug])

  // Persist on change
  useEffect(() => {
    saveMessages(dealer.slug, messages)
  }, [dealer.slug, messages])

  // Initial agent name from dealer override
  useEffect(() => {
    if (dealer.chatAgentName) setAgentName(dealer.chatAgentName)
  }, [dealer.chatAgentName])

  // Autoscroll to bottom on new message
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open, loading])

  if (dealer.chatEnabled === false) return null

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')
    setLoading(true)
    setError(null)

    try {
      const res = await sendChat({ slug: dealer.slug, messages: next, pageContext })
      setMessages([...next, res.message])
      if (res.agentName) setAgentName(res.agentName)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setMessages([])
    setError(null)
  }

  return (
    <>
      {/* Floating pill */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3',
            'text-white font-semibold shadow-lg hover:bg-primary-light transition-colors',
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Ask {agentName}</span>
          <span className="sm:hidden">Chat</span>
        </button>
      )}

      {/* Open panel */}
      {open && (
        <div
          className={cn(
            'fixed z-40 flex flex-col bg-white shadow-2xl',
            'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[600px] sm:rounded-2xl sm:border sm:border-gray-200',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-primary text-white px-4 py-3 sm:rounded-t-2xl">
            <div className="flex items-center gap-2 min-w-0">
              {dealer.logo ? (
                <img
                  src={dealer.logo}
                  alt=""
                  className="h-8 w-8 rounded-full bg-white object-contain"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{agentName}</p>
                <p className="text-xs text-white/80 truncate">{dealer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-white/80 hover:text-white px-2 py-1 rounded"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.length === 0 && !loading && (
              <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-3">
                <p className="font-medium text-gray-900 mb-1">Hey, I'm {agentName}.</p>
                <p>
                  I can help you find the right unit, answer questions about{' '}
                  {dealer.name}, or get you set up with our team. What are you looking for?
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm',
                  )}
                >
                  <RenderedText text={m.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="border-t border-gray-200 bg-white px-3 py-3 flex items-end gap-2 sm:rounded-b-2xl"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Ask ${agentName} anything…`}
              rows={1}
              className={cn(
                'flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'max-h-32',
              )}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className={cn(
                'bg-primary text-white p-2 rounded-lg hover:bg-primary-light transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
