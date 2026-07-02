import React, { useState } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

const AIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ from: string; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat/", { message: userMsg.text });
      const reply = res.data?.reply || "Sorry, I couldn't get a response.";
      setMessages((m) => [...m, { from: "ai", text: reply }] as any);
    } catch (e) {
      setMessages(
        (m) => [...m, { from: "ai", text: "AI service unavailable." }] as any,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-800/80 bg-slate-900/95 p-3 shadow-2xl shadow-slate-950/50 backdrop-blur"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">AI Tutor</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                ✖
              </button>
            </div>
            <div className="mb-2 h-48 space-y-2 overflow-auto rounded-2xl bg-slate-950/70 p-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.from === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block rounded-2xl px-3 py-1.5 text-sm ${m.from === "user" ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white" : "bg-slate-800 text-slate-200"}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about courses, schedules, or fees..."
                className="app-input flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="app-btn app-btn-primary px-3 py-2"
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 p-3 text-white shadow-lg shadow-teal-500/20"
      >
        🤖
      </motion.button>
    </div>
  );
};

export default AIChat;
