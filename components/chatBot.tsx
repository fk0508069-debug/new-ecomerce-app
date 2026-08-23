"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

// ============================================================
// SESSION ID GENERATOR
// ============================================================
function generateSessionId(): string {
  // Modern browsers
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for older/incompatible browsers
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;
}

// ============================================================
// CHATBOT
// ============================================================
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

  // ============================================================
  // SESSION ID
  // ============================================================
  const [sessionId] = useState<string>(() => {
    // This code runs in browser only
    if (typeof window === "undefined") {
      return "";
    }

    const stored = localStorage.getItem("rag_session_id");

    if (stored) {
      return stored;
    }

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
  const addMessage = (
    text: string,
    sender: "user" | "bot"
  ) => {
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
  const sendMessage = async () => {
    const question = input.trim();

    if (!question || isLoading) {
      return;
    }

    // Add user's message immediately
    addMessage(question, "user");

    // Clear input
    setInput("");

    // Show loading state
    setIsLoading(true);

    try {
      // IMPORTANT:
      // Do NOT use 127.0.0.1 here when accessing the website
      // from another device.
      //
      // Your PC IP = 192.168.1.8
      // FastAPI = port 8000
      //
      const response = await fetch(
        "http://192.168.1.8:8000/ask",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            session_id: sessionId,
            question: question,
          }),
        }
      );

      // ========================================================
      // HANDLE HTTP ERROR
      // ========================================================
      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `API returned ${response.status}: ${errorText}`
        );
      }

      // ========================================================
      // PARSE RESPONSE
      // ========================================================
      const data = await response.json();

      console.log("RAG response:", data);

      // ========================================================
      // ADD BOT RESPONSE
      // ========================================================
      addMessage(
        data.answer || "The AI returned no answer.",
        "bot"
      );
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

  // ============================================================
  // KEYDOWN
  // ============================================================
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // CLOSE CHAT
  // ============================================================
  const closeChat = () => {
    setIsOpen(false);
  };

  // ============================================================
  // OPEN CHAT
  // ============================================================
  const openChat = () => {
    setIsOpen(true);
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <>
      {/* ======================================================
          CHAT BUTTON
      ====================================================== */}
      {!isOpen && (
        <button
          onClick={openChat}
          type="button"
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
          aria-label="Open AI assistant"
        >
          💬
        </button>
      )}

      {/* ======================================================
          CHAT WINDOW
      ====================================================== */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          
          {/* ==================================================
              HEADER
          ================================================== */}
          <div className="flex items-center justify-between bg-blue-600 px-5 py-4 text-white">
            <div>
              <h2 className="font-semibold">
                AI Assistant
              </h2>

              <p className="text-xs text-blue-100">
                Online
              </p>
            </div>

            <button
              onClick={closeChat}
              type="button"
              className="text-xl text-white hover:text-gray-200"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* ==================================================
              MESSAGES
          ================================================== */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      message.sender === "user"
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md bg-white text-gray-800 shadow"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {/* ==================================================
                  LOADING
              ================================================== */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-600 shadow">
                    AI is thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ==================================================
              INPUT
          ================================================== */}
          <div className="border-t bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <button
                onClick={sendMessage}
                type="button"
                disabled={
                  isLoading || !input.trim()
                }
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;