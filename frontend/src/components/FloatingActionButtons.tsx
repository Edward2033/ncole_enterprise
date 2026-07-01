import React, { useState, useEffect } from 'react';
import { aiApi, type AiPortal, type ChatMessage } from '@/features/ai/aiApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'model'; text: string; }

interface FloatingActionButtonsProps {
  portal?: AiPortal;
  accentClass?: string;
  greeting?: string;
  whatsappNumber?: string;
  showWhatsApp?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map(i => (
      <span key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const AvatarAI: React.FC<{ color: string }> = ({ color }) => (
  <div className={`flex-shrink-0 h-7 w-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold select-none`}>N</div>
);

const AvatarUser: React.FC = () => (
  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold select-none">U</div>
);

// ─── WhatsApp Icon SVG ────────────────────────────────────────────────────────
const WhatsAppIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

// ─── Chat Icon SVG ────────────────────────────────────────────────────────────
const ChatIcon: React.FC = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16.34A9 9 0 1 1 7.66 3H12a9 9 0 0 1 9 9v4.34z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-7 7m7-7 7 7" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  portal = 'PUBLIC',
  accentClass = 'bg-orange-500',
  greeting = "Hi! I'm N-COLE, your AI assistant. How can I help you today?",
  whatsappNumber = '250794890144',
  showWhatsApp = true,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'model', text: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Fade-in on mount
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (chatOpen) setTimeout(() => inputRef.current?.focus(), 120); }, [chatOpen]);

  const buildHistory = (msgs: Message[]): ChatMessage[] =>
    msgs.filter((m, i) => !(m.role === 'model' && i === 0)).slice(-20)
      .map(m => ({ role: m.role, parts: [{ text: m.text }] }));

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat(text, buildHistory(messages), portal);
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'model', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const avatarColor = accentClass.includes('violet') ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-orange-600';

  return (
    <>
      {/* ── FAB cluster ─────────────────────────────────────────────────────── */}
      <div
        className="fixed z-50 flex flex-col items-center gap-3 transition-all duration-500"
        style={{
          right: '1rem',
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        {/* WhatsApp button */}
        {showWhatsApp && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fab-btn flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40
                       transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/50
                       active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
          >
            <WhatsAppIcon />
          </a>
        )}

        {/* AI Chat button */}
        <button
          onClick={() => setChatOpen(o => !o)}
          aria-label={chatOpen ? 'Close AI assistant' : 'Open AI assistant'}
          className={`fab-btn flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full ${accentClass} text-white shadow-xl
                      transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/40
                      animate-fab-pulse`}
        >
          {chatOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      {chatOpen && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden animate-slide-up"
          style={{
            right: '1rem',
            bottom: `calc(${showWhatsApp ? '8rem' : '5rem'} + env(safe-area-inset-bottom, 0px))`,
            width: 'min(360px, calc(100vw - 2rem))',
            maxHeight: 'min(580px, calc(100dvh - 10rem))',
          }}
        >
          {/* Header */}
          <div className={`${accentClass} px-4 py-3 flex items-center gap-3 flex-shrink-0`}>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">N</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">N-COLE Assistant</p>
              <p className="text-white/70 text-xs capitalize">{portal.toLowerCase()} portal</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-xs">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'model' ? <AvatarAI color={avatarColor} /> : <AvatarUser />}
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? `${accentClass} text-white rounded-br-sm`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                }`}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2">
                <AvatarAI color={avatarColor} />
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm"><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex items-end gap-2 bg-white dark:bg-slate-900 flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition max-h-32"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className={`flex-shrink-0 h-10 w-10 rounded-xl ${accentClass} text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform`}
            >
              <SendIcon />
            </button>
          </div>

          <div className="text-center py-1.5 text-[10px] text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            Powered by Google Gemini · N_COLE Interpress
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButtons;
