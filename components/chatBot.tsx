"use client";

import React, { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface QuickQuestion {
  icon: string;
  text: string;
}

// ============================================================
// SESSION ID GENERATOR
// ============================================================
function generateSessionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

// ============================================================
// URL PARSING & LINK RENDERING
// ============================================================
function parseAndRenderText(text: string): React.ReactNode {
  // URL regex pattern that matches http, https, and localhost URLs
  const urlPattern = /(\b(https?:\/\/|http:\/\/|www\.)[^\s<]+)/gi;
  
  // Check if text contains any URLs
  if (!urlPattern.test(text)) {
    return text;
  }
  
  // Reset regex lastIndex
  urlPattern.lastIndex = 0;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    const end = start + url.length;

    // Add text before the URL
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    // Add the URL as a clickable link
    // Clean the URL (remove trailing punctuation)
    let cleanUrl = url;
    const trailingPunctuation = /[.,;:!?)]$/;
    let trailingChar = "";
    if (trailingPunctuation.test(cleanUrl)) {
      trailingChar = cleanUrl.slice(-1);
      cleanUrl = cleanUrl.slice(0, -1);
    }

    // Ensure URL has protocol
    let href = cleanUrl;
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      href = "https://" + cleanUrl;
    }

    parts.push(
      <a
        key={`link-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 hover:underline font-medium break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {cleanUrl}
      </a>
    );

    // Add trailing punctuation if it was removed
    if (trailingChar) {
      parts.push(trailingChar);
    }

    lastIndex = end;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// ============================================================
// CHATBOT
// ============================================================
const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      text: "Hello! 👋 I'm your AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Styled predefined questions with semantic icons
  const quickQuestions: QuickQuestion[] = [
    { icon: "📦", text: "Track my order" },
    { icon: "✨", text: "Suggest a product" },
    { icon: "💬", text: "Help with returns" },
  ];

  // ============================================================
  // SESSION ID
  // ============================================================
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("rag_session_id");
    if (stored) return stored;
    const newId = generateSessionId();
    localStorage.setItem("rag_session_id", newId);
    return newId;
  });

  // ============================================================
  // AUTO SCROLL
  // ============================================================
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // ============================================================
  // BODY SCROLL LOCK
  // ============================================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ============================================================
  // ADD MESSAGE
  // ============================================================
  const addMessage = (text: string, sender: "user" | "bot") => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        text,
        sender,
      },
    ]);
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? input).trim();
    if (!question || isLoading) return;

    addMessage(question, "user");
    setInput("");
    setIsLoading(true);

    try {
    const response = await fetch("http://192.168.1.4:8000/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: sessionId,
    question: question,
  }),
});

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      addMessage(data.answer || "The AI returned no answer.", "bot");
    } catch (error) {
      console.error("RAG API error:", error);
      addMessage(
        "❌ Could not connect to the AI server. Please try again.",
        "bot"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // RENDER MESSAGE WITH LINKS
  // ============================================================
  const renderMessageContent = (text: string) => {
    // Split by newlines and render each line
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {parseAndRenderText(line)}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* FLOATING TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95"
          aria-label="Open AI assistant"
        >
          💬
        </button>
      )}

      {/* BACKDROP OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SLIDEABLE DRAWER */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-blue-700/20 bg-blue-600 px-5 py-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur-md">
              🤖
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-blue-600 bg-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">AI Assistant</h2>
              <p className="text-[11px] text-blue-100">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          <div className="space-y-3.5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    message.sender === "user"
                      ? "rounded-br-none bg-blue-600 font-normal text-white"
                      : "rounded-bl-none border border-slate-200/80 bg-white text-slate-800"
                  }`}
                >
                  {message.sender === "user" 
                    ? message.text 
                    : renderMessageContent(message.text)
                  }
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* REDESIGNED QUICK SUGGESTIONS */}
        <div className="border-t border-slate-100 bg-white px-4 pt-3 pb-2">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <span>⚡ Frequently Asked</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickQuestions.map((q) => (
              <button
                key={q.text}
                onClick={() => sendMessage(q.text)}
                disabled={isLoading}
                className="group flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="text-xs transition-transform group-hover:scale-110">
                  {q.icon}
                </span>
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INPUT */}
        <div className="border-t border-slate-200/80 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => sendMessage()}
              type="button"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;