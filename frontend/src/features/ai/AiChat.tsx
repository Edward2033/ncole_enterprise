import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiApi, type AiPortal, type ChatMessage } from './aiApi';

interface Message { role: 'user' | 'model'; text: string; }

interface AiChatProps {
  portal: AiPortal;
  accentClass?: string;
  greeting?: string;
}

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map(i => (
      <span key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const AvatarAI: React.FC = () => (
  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold select-none">N</div>
);

const AvatarUser: React.FC = () => (
  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold select-none">U</div>
);

export const AiChat: React.FC<AiChatProps> = ({
  portal,
  accentClass = 'bg-orange-500',
  greeting = "Hi! I'm N-COLE, your AI assistant. How can I help you today?",
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'model', text: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const buildHistory = useCallback((msgs: Message[]): ChatMessage[] =>
    msgs.filter((m, i) => !(m.role === 'model' && i === 0)).slice(-20)
      .map(m => ({ role: m.role, parts: [{ text: m.text }] })), []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const history = buildHistory(messages);
      const res = await aiApi.chat(text, history, portal);
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'model', text: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, portal, buildHistory]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Open AI assistant"
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full ${accentClass} text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95`}>
        {open
          ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16.34A9 9 0 1 1 7.66 3H12a9 9 0 0 1 9 9v4.34z" /></svg>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col w-[360px] max-h-[600px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className={`${accentClass} px-4 py-3 flex items-center gap-3`}>
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

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'model' ? <AvatarAI /> : <AvatarUser />}
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user' ? `${accentClass} text-white rounded-br-sm` : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                }`}>{msg.text}</div>
              </div>
            ))}
            {loading && <div className="flex items-end gap-2"><AvatarAI /><div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm"><TypingDots /></div></div>}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex items-end gap-2 bg-white dark:bg-slate-900">
            <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask me anything…"
              className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition max-h-32"
              style={{ overflowY: 'auto' }} />
            <button onClick={send} disabled={!input.trim() || loading}
              className={`flex-shrink-0 h-10 w-10 rounded-xl ${accentClass} text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label="Send message">
              <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-7 7m7-7 7 7" /></svg>
            </button>
          </div>
          <div className="text-center py-1.5 text-[10px] text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            Powered by Google Gemini · N_COLE Interpress
          </div>
        </div>
      )}
    </>
  );
};
