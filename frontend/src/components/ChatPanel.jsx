import React, { useState } from 'react'
import { Sparkles, Send, Bot, User, CheckCircle2, MapPin, Calendar, Layers, AlertCircle, Loader2 } from 'lucide-react'

const SUGGESTED_QUERIES = [
  "Find new construction near Dubai between 2015 and 2018",
  "Detect vegetation loss in Saclay, France",
  "Show infrastructure & road expansion in Abu Dhabi",
  "Analyze land changes near Mumbai, India",
]

export default function ChatPanel({ onExecuteQueryResult, currentMode }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I am TerraTrace AI. Ask me to search satellite imagery in natural language (e.g. 'find new construction in Dubai').",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (textToSend) => {
    const prompt = textToSend || query
    if (!prompt.trim() || isLoading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setQuery('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, mode: currentMode }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.summary,
        intent: data.intent,
        llmUsed: data.llm_used,
        compareData: data.compare_data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(prev => [...prev, assistantMsg])

      if (data.compare_data && onExecuteQueryResult) {
        onExecuteQueryResult(data.compare_data)
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Could not process query: ${err.message}. Please try selecting a region directly from the Scene Browser.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'rgba(6,12,26,0.92)',
        borderLeft: '1px solid rgba(34,211,238,0.12)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(34,211,238,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}
          >
            <Sparkles size={14} style={{ color: 'var(--color-terra)' }} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">AI Query Assistant</h3>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Natural Language Intent Parser
            </p>
          </div>
        </div>
        <span className="badge badge-terra text-[10px]">
          {currentMode === 'live' ? 'Live API' : 'Demo Mode'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {msg.role === 'user' ? (
                <><span>You</span><User size={10} /></>
              ) : (
                <><Bot size={10} style={{ color: 'var(--color-terra)' }} /><span style={{ color: 'var(--color-terra)' }}>TerraTrace Bot</span></>
              )}
              <span>· {msg.timestamp}</span>
            </div>

            <div
              className="max-w-[90%] rounded-xl p-3 text-xs leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'rgba(34,211,238,0.12)' : 'rgba(15,23,42,0.7)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(34,211,238,0.3)' : 'rgba(34,211,238,0.1)'}`,
                color: msg.isError ? '#F87171' : 'var(--color-text-primary)',
              }}
            >
              <p>{msg.text}</p>

              {/* Intent breakdown badge */}
              {msg.intent && (
                <div
                  className="mt-2.5 p-2 rounded-lg text-[11px] space-y-1"
                  style={{ background: 'rgba(6,12,26,0.6)', border: '1px solid rgba(34,211,238,0.15)' }}
                >
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 size={11} /> Intent Confirmed:
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="flex items-center gap-1"><MapPin size={9} /> Region: <strong>{msg.intent.target_region_key}</strong></span>
                    <span className="flex items-center gap-1"><Calendar size={9} /> Dates: {msg.intent.start_date} → {msg.intent.end_date}</span>
                    <span className="flex items-center gap-1"><Layers size={9} /> Class: {msg.intent.change_type}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 pt-0.5">
                    Engine: {msg.llmUsed}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-terra)' }} />
            Parsing query intent & running change detection...
          </div>
        )}
      </div>

      {/* Suggested Quick Queries */}
      <div className="p-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(34,211,238,0.08)' }}>
        <p className="text-[10px] mb-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>Suggested prompts:</p>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded-lg text-left transition-colors"
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(34,211,238,0.1)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.1)'}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="p-3 flex items-center gap-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(34,211,238,0.1)' }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask TerraTrace AI..."
          className="input-terra text-xs py-2 flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="p-2 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: query.trim() ? 'var(--color-terra)' : 'rgba(34,211,238,0.15)',
            color: query.trim() ? '#02040a' : 'var(--color-text-muted)',
            cursor: query.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  )
}
