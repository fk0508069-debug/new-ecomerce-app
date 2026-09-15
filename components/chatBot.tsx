"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// TYPES & CONFIG
// ============================================================
const POLL_MS = 2000;

type Tab = "ai" | "support";

interface AiMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface SupportMessage {
  _id: string;
  text: string;
  senderRole?: "customer" | "agent" | string;
  senderName?: string;
  createdAt: string | Date;
  mine: boolean;
}

interface QuickQuestion {
  text: string;
}

interface CustomerSupportProps {
  userId?: string;
}

// ============================================================
// HELPERS
// ============================================================
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

function parseAndRenderText(text: string): ReactNode {
  const urlPattern = /(\[([^\]]+)\]\(([^)]+)\))|(\b(https?:\/\/|www\.)[^\s<]+)/gi;
  if (!urlPattern.test(text)) return text;
  urlPattern.lastIndex = 0;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    if (match[2] && match[3]) {
      parts.push(
        <a
          key={`md-${start}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline hover:text-blue-800"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      let cleanUrl = match[4];
      const trailingPunctuation = /[.,;:!?)]$/;
      let trailingChar = "";
      if (trailingPunctuation.test(cleanUrl)) {
        trailingChar = cleanUrl.slice(-1);
        cleanUrl = cleanUrl.slice(0, -1);
      }
      let href = cleanUrl;
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        href = "https://" + cleanUrl;
      }
      parts.push(
        <a
          key={`url-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-blue-600 underline hover:text-blue-800"
        >
          {cleanUrl}
        </a>
      );
      if (trailingChar) parts.push(trailingChar);
    }
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CustomerSupport({ userId: fallbackUserId }: CustomerSupportProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [tab, setTab] = useState<Tab>("ai");

  const [sessionId, setSessionId] = useState<string>("");
  useEffect(() => {
    let currentSession = localStorage.getItem("rag_session_id");
    if (!currentSession) {
      currentSession = generateSessionId();
      localStorage.setItem("rag_session_id", currentSession);
    }
    setSessionId(currentSession);
  }, []);

  const activeUserId = user?.id || fallbackUserId || sessionId;

  // ----------------------------------------------------------
  // AI Tab State
  // ----------------------------------------------------------
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: "init",
      text: "Hello, I can find answers from the nova store. How can I help ?",
      sender: "bot",
    },
  ]);
  const [aiInput, setAiInput] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const quickQuestions: QuickQuestion[] = [
    { text: "find me a product" },
    { text: "Track my order ?" },
    { text: "Cancel my product " },
  ];

  // ----------------------------------------------------------
  // Support Tab State
  // ----------------------------------------------------------
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState<string>("");
  const [supportSending, setSupportSending] = useState<boolean>(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [unreadSupport, setUnreadSupport] = useState<number>(0);

  const lastSeenSupportCount = useRef<number>(0);
  const aiEndRef = useRef<HTMLDivElement | null>(null);
  const supportEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiLoading, tab]);

  useEffect(() => {
    supportEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportMessages, tab]);

  // ----------------------------------------------------------
  // Support: Load & Poll
  // ----------------------------------------------------------
  const fetchSupportThread = useCallback(async () => {
    if (!activeUserId) return;

    try {
      const res = await fetch(`/api/support/thread?userId=${encodeURIComponent(activeUserId)}`);
      if (!res.ok) return;

      const data = await res.json().catch(() => ({ messages: [] }));
      const list: SupportMessage[] = (Array.isArray(data.messages) ? data.messages : []).map(
        (m: any) => ({
          _id: m._id,
          text: m.text,
          senderRole: m.senderRole,
          senderName: m.senderName,
          createdAt: m.createdAt,
          mine: m.senderRole === "customer",
        })
      );
      setSupportMessages(list);
    } catch {
      // server error handling
    }
  }, [activeUserId]);

  useEffect(() => {
    if (!isOpen || !activeUserId) return;

    fetchSupportThread();
    const id = setInterval(fetchSupportThread, POLL_MS);
    return () => clearInterval(id);
  }, [isOpen, activeUserId, fetchSupportThread]);

  // Mark Support messages read
  useEffect(() => {
    if (!isOpen || tab !== "support" || !activeUserId) return;

    fetch("/api/support/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUserId }),
    }).catch(() => {});

    setUnreadSupport(0);
    lastSeenSupportCount.current = supportMessages.length;
  }, [isOpen, tab, activeUserId, supportMessages.length]);

  // Track unread agent messages while on AI tab
  useEffect(() => {
    if (!isOpen) return;
    if (tab === "support") {
      lastSeenSupportCount.current = supportMessages.length;
      setUnreadSupport(0);
      return;
    }

    const last = supportMessages[supportMessages.length - 1];
    if (last && last.senderRole === "agent") {
      const delta = supportMessages.length - lastSeenSupportCount.current;
      if (delta > 0) setUnreadSupport(delta);
    }
  }, [supportMessages, tab, isOpen]);

  // ----------------------------------------------------------
  // Actions: AI Chat
  // ----------------------------------------------------------
  const sendAiMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? aiInput).trim();
    if (!question || aiLoading) return;

    setAiMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, text: question, sender: "user" },
    ]);
    setAiInput("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId || activeUserId, question }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setAiMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: data.answer || "The AI returned no answer.",
          sender: "bot",
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: "❌ Could not connect to the AI server. Please try again.",
          sender: "bot",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendAiMessage();
    }
  };

  // ----------------------------------------------------------
  // Actions: Support Agent Chat
  // ----------------------------------------------------------
  const sendSupportMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = supportInput.trim();
    if (!text || !activeUserId || supportSending) return;

    setSupportError(null);
    setSupportInput("");
    setSupportSending(true);

    const tmp: SupportMessage = {
      _id: `tmp-${Date.now()}`,
      text,
      senderRole: "customer",
      createdAt: new Date().toISOString(),
      mine: true,
    };

    setSupportMessages((prev) => [...prev, tmp]);

    try {
      const res = await fetch("/api/support/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchSupportThread();
    } catch (err: any) {
      setSupportError(err.message || "Send failed");
      setSupportMessages((prev) => prev.filter((m) => m._id !== tmp._id));
    } finally {
      setSupportSending(false);
    }
  };

  const handleSupportKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendSupportMessage();
    }
  };

  return (
    <>
      {/* FLOATING TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-teal-600 active:scale-95"
          aria-label="Open assistant"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {unreadSupport > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white shadow">
              {unreadSupport}
            </span>
          )}
        </button>
      )}

      {/* CHAT DRAWER */}
      <div
        className={`fixed bottom-20 right-6 z-50 flex h-[600px] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        {/* HEADER */}
        <div className="relative flex flex-col items-center bg-white pb-0 pt-6">
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="absolute left-4 top-5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
            <span className="text-xl">{tab === "ai" ? "✨" : "🎧"}</span>
          </div>

          <h2 className="text-lg font-semibold text-gray-800">
            {tab === "ai" ? "AI Answers" : "Customer Support"}
          </h2>

          {/* TAB SWITCHER */}
          <div className="mt-4 flex w-full items-center gap-1 border-b border-gray-100 px-3">
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition ${
                tab === "ai" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <SparkleIcon className="h-3.5 w-3.5" />
              AI Assistant
              {tab === "ai" && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("support")}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition ${
                tab === "support" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <HeadsetIcon className="h-3.5 w-3.5" />
              Support
              {unreadSupport > 0 && tab !== "support" && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadSupport}
                </span>
              )}
              {tab === "support" && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* ====================================================== */}
        {/* AI TAB */}
        {/* ====================================================== */}
        {tab === "ai" && (
          <>
            <div className="flex-1 overflow-y-auto bg-white px-4 py-3">
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {message.sender === "bot" && (
                      <span className="mb-1 text-[11px] font-medium text-gray-400">
                        AI assistant
                      </span>
                    )}
                    <div
                      className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.sender === "user"
                          ? "rounded-2xl rounded-br-none bg-blue-600 text-white"
                          : "rounded-2xl rounded-tl-none bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.sender === "user" ? (
                        message.text
                      ) : (
                        message.text.split("\n").map((line, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <br />}
                            {parseAndRenderText(line)}
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex flex-col items-start">
                    <span className="mb-1 text-[11px] font-medium text-gray-400">
                      AI assistant
                    </span>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 text-xs text-gray-500 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>
            </div>

            <div className="bg-white px-4 pb-3 pt-2">
              <div className="mb-2 text-right text-[11px] font-medium text-gray-400">
                Suggestions
              </div>
              <div className="flex flex-col gap-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => sendAiMessage(q.text)}
                    disabled={aiLoading}
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-left text-xs font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto bg-white">
              <div className="h-[2px] w-full bg-gradient-to-r from-blue-200 via-pink-200 to-teal-200" />
              <div className="flex items-center gap-2 p-3">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={handleAiKeyDown}
                  placeholder="Ask a question..."
                  disabled={aiLoading}
                  className="flex-1 border-none bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 focus:ring-0"
                />
                <button
                  onClick={() => sendAiMessage()}
                  type="button"
                  disabled={aiLoading || !aiInput.trim()}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all ${
                    aiInput.trim() && !aiLoading
                      ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ====================================================== */}
        {/* SUPPORT TAB */}
        {/* ====================================================== */}
        {tab === "support" && (
          <>
            <div className="flex-1 overflow-y-auto bg-white px-4 py-3">
              <div className="space-y-4">
                {supportMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center pt-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                      <HeadsetIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-gray-700">Need a hand?</p>
                    <p className="mt-1 max-w-[240px] text-xs text-gray-500">
                      Send us a message and a real human will reply as soon as possible.
                    </p>
                  </div>
                )}

                {supportMessages.map((m) => (
                  <div
                    key={m._id}
                    className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
                  >
                    {!m.mine && (
                      <span className="mb-1 text-[11px] font-medium text-gray-400">
                        {m.senderName || "Support"}
                      </span>
                    )}
                    <div
                      className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        m.mine
                          ? "rounded-2xl rounded-br-none bg-blue-600 text-white"
                          : "rounded-2xl rounded-tl-none bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <div
                        className={`mt-1 text-[10px] ${
                          m.mine ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={supportEndRef} />
              </div>
            </div>

            {supportError && (
              <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-600">
                {supportError}
              </div>
            )}

            <div className="mt-auto bg-white">
              <div className="h-[2px] w-full bg-gradient-to-r from-blue-200 via-pink-200 to-teal-200" />
              <form onSubmit={sendSupportMessage} className="flex items-center gap-2 p-3">
                <input
                  type="text"
                  value={supportInput}
                  onChange={(e) => setSupportInput(e.target.value)}
                  onKeyDown={handleSupportKeyDown}
                  placeholder="Message support…"
                  disabled={supportSending}
                  className="flex-1 border-none bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={supportSending || !supportInput.trim()}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all ${
                    supportInput.trim() && !supportSending
                      ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ============================================================
// ICONS
// ============================================================
const SparkleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

const HeadsetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);