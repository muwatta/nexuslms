// frontend/src/pages/Landing.tsx
import React, { useState, useEffect, useRef } from "react";
import { stats } from "../data/stats";
import { programs } from "../data/programs";
import { features } from "../data/features";
import { testimonials } from "../data/testimonials";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Star,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  X as CloseIcon,
  Send,
  Phone,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../api"; // Use our secure API instance

const WHATSAPP_NUMBER = "+2349026642320";

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Muwatta AI, the friendly assistant for Muwatta Academy — an online educational institution in Nigeria.

Muwatta Academy has three schools:
1. Western School: English curriculum, Mathematics, Sciences, critical thinking
2. Arabic School: Quran, Arabic language, Fiqh, Hadith, Islamic Studies
3. Tech Academy: Web development, Python, project-based programming

Key info:
- WhatsApp contact: +2349026642320
- Students can sign up at /signup
- We have 100+ students and a 95% success rate
- AI-powered learning, parent portal, progress analytics, certificates

Be warm, concise, and helpful. Answer questions about programs, enrollment, pricing (say "contact us on WhatsApp for pricing"), and features. Keep responses under 3 sentences unless detail is needed. Always encourage enrollment or WhatsApp contact for next steps.`;

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const Landing: React.FC = () => {
  const [activeProgram, setActiveProgram] = useState<string | null>(null);

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hello! I'm Muwatta AI. How can I help you learn about our programs today? 👋",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading, isChatOpen]);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hello! I'm interested in learning more about Muwatta Academy programs.",
    );
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${message}`,
      "_blank",
    );
  };

  // ── SECURE AI Chat via Backend Proxy ─────────────────────────────────────
  const handleSendMessage = async () => {
    const userMessage = chatInput.trim();
    if (!userMessage || isChatLoading) return;

    const updatedMessages: { role: "user" | "assistant"; content: string }[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];

    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // SECURITY: Use backend proxy instead of direct Anthropic API call
      // This hides the API key from frontend and browser DevTools
      const response = await api.post("/ai/chat/", {
        message: userMessage,
        system: SYSTEM_PROMPT,
      });

      const aiText =
        response.data.content ||
        "Sorry, I couldn't process that. Please try again!";

      setChatMessages([
        ...updatedMessages,
        { role: "assistant", content: aiText },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      setChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please reach out on WhatsApp at +2349026642320!",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Layout>
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-gradient-to-l from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-6">
                <Sparkles size={16} />
                <span>Excellence in Education Since 2024</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Your Journey to{" "}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Excellence
                </span>{" "}
                Starts Here
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join{" "}
                <strong className="text-slate-900 dark:text-white">
                  100+ students
                </strong>{" "}
                mastering Arabic, English, and cutting-edge technology with
                AI-powered personalized learning.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-full hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:-translate-y-1"
                >
                  Start Free Trial
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <button
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  <Phone size={20} />
                  Chat on WhatsApp
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <stat.icon size={18} className="text-blue-600" />
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-blue-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-24 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-4xl">
                      📚
                    </div>
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    <div className="h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-4xl">
                      🕌
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Programs Section ─────────────────────────────────────────────── */}
      <section
        id="programs"
        className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
              Our Programs
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Three Schools, One Excellence
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveProgram(program.id)}
                onMouseLeave={() => setActiveProgram(null)}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-800 ${
                  activeProgram === program.id ? "lg:scale-105" : ""
                }`}
              >
                <div
                  className={`h-32 bg-gradient-to-br ${program.color} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <span className="text-4xl mb-2 block">{program.image}</span>
                    <h3 className="text-xl font-bold">{program.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-300 mb-6 line-clamp-3">
                    {program.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <CheckCircle2 size={16} className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/signup"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold bg-gradient-to-r ${program.color} text-white hover:shadow-lg transition-all`}
                  >
                    Enroll Now
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center text-white mb-4`}
                >
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section
        id="testimonials"
        className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              What Our Community Says
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {testimonial.program}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-700" />
        <div className="max-w-4xl mx-auto px-4 relative text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white/30 hover:bg-white/10 transition-colors"
            >
              Get Started Free
            </Link>
            <button
              onClick={handleWhatsAppClick}
              className="px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white/30 hover:bg-white/10 transition-colors"
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold">
                  M
                </div>
                <span className="font-bold text-xl text-white">
                  Muwatta Academy
                </span>
              </div>
              <p className="mb-4">Empowering students since 2024.</p>
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={20} />
                Talk2Us
              </button>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Programs</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#programs" className="hover:text-white">
                    Western School
                  </a>
                </li>
                <li>
                  <a href="#programs" className="hover:text-white">
                    Arabic School
                  </a>
                </li>
                <li>
                  <a href="#programs" className="hover:text-white">
                    Tech Academy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-white">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center">
            <p>&copy; 2026 Muwatta Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── AI Chat Button ───────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg hover:shadow-xl items-center justify-center ${isChatOpen ? "hidden" : "flex"}`}
      >
        <Bot size={28} />
      </motion.button>

      {/* ── AI Chat Window ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot size={24} />
                <div>
                  <h3 className="font-bold">Muwatta AI</h3>
                  <p className="text-xs opacity-80">Powered by Claude</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 rounded-bl-md">
                    <div className="flex gap-1 items-center">
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-700 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about programs..."
                className="flex-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Landing;
