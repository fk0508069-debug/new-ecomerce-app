import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      text: "Hello! 👋 I'm your AI assistant. How can I help you?",
      sender: "bot",
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --------------------------------------------------
  // SESSION ID
  // --------------------------------------------------
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("rag_session_id");
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem("rag_session_id", newId);
    return newId;
  });

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --------------------------------------------------
  // BODY SCROLL LOCK
  // --------------------------------------------------
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

  // --------------------------------------------------
  // ADD MESSAGE
  // --------------------------------------------------
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

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------
  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    addMessage(question, "user");
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question,
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
      addMessage("❌ Could not connect to the AI server. Please try again.", "bot");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // KEYDOWN LISTENER
  // --------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const closeChat = () => setIsOpen(false);

  return (
    <>
      {/* ==================================================
          BACKDROP
      ================================================== */}
      <div
        onClick={closeChat}
        className={`fixed inset-0 z-9998 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ==================================================
          CHAT SIDEBAR DRAWER
      ================================================== */}
      <aside
        className={`fixed top-0 right-0 z-9999 h-screen w-[32vw] min-w-90 max-w-125 bg-white shadow-2xl border-l border-slate-200/80 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 bg-linear-to-r from-blue-600 to-indigo-600 text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 backdrop-blur-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L8 20l4-1 4 1-1.75-3M8 9h.01M12 9h.01M16 9h.01M9 13h6" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-semibold leading-tight">AI Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-xs text-blue-100 font-medium">Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={closeChat}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SUBTITLE */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <p className="text-xs text-slate-500 leading-relaxed">
            Ask me about products, orders, tracking, or anything from our knowledge base.
          </p>
        </div>

        {/* MESSAGES FEED */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-bl-xs"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-white border border-slate-200/80 px-4 py-3 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none disabled:opacity-50"
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45 -translate-y-0.5 -translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            AI responses may not always be accurate.
          </p>
        </div>
      </aside>

      {/* ==================================================
          FLOATING CHAT LAUNCHER BUTTON
      ================================================== */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-9997 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <div className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}>
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </div>
      </button>
    </>
  );
};

export default ChatBot;