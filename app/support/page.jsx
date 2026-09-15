"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const POLL_MS = 2000;

export default function SupportWidget({ userId }) {
  const { user } = useAuth();
  const activeUserId = user?.id || userId;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchThread = useCallback(async () => {
    if (!activeUserId) return;

    const r = await fetch(`/api/support/thread?userId=${encodeURIComponent(activeUserId)}`);
    if (!r.ok) {
      throw new Error("Unable to load support messages");
    }

    const data = await r.json().catch(() => ({ messages: [] }));
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }, [activeUserId]);

  // poll for agent replies + open the socket
  useEffect(() => {
    if (!open || !activeUserId) return;

    const refresh = () => {
      void fetchThread();
    };

    const timeout = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, [open, activeUserId, fetchThread]);

  // mark read when the panel is open
  useEffect(() => {
    if (!open || !activeUserId) return;
    fetch("/api/support/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUserId }),
    }).catch(() => {});
  }, [open, activeUserId, messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeUserId || sending) return;

    setSending(true);
    setInput("");
    setMessages((m) => [
      ...m,
      { _id: `tmp-${Date.now()}`, text, senderRole: "customer", mine: true, createdAt: new Date() },
    ]);

    await fetch("/api/support/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUserId, text }),
    });

    await fetchThread();
    setSending(false);
  };

  return (
    <>
      {/* launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:scale-105"
        aria-label="Support chat"
      >
        {open ? <XIcon className="h-5 w-5" /> : <ChatIcon className="h-5 w-5" />}
      </button>

      {/* panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              CS
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#0d0d14] bg-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Customer Support</div>
              <div className="text-[11px] text-emerald-400">Usually replies in a few minutes</div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <ChatIcon className="h-8 w-8 text-slate-700" />
                <p className="mt-3 text-xs">Send us a message — we are here to help.</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m._id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.mine
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-white/10 bg-white/[0.04] text-slate-200"
                  }`}
                >
                  {!m.mine && (
                    <div className="mb-0.5 text-[10px] font-medium text-indigo-400">
                      {m.senderName || "Support"}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-snug">{m.text}</p>
                  <div className={`mt-1 text-[10px] ${m.mine ? "text-white/50" : "text-slate-500"}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pl-3 focus-within:border-indigo-500/50">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition disabled:bg-slate-800 disabled:text-slate-600"
              >
                <SendIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

const ChatIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const XIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const SendIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" />
  </svg>
);