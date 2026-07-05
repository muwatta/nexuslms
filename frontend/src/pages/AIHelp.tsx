import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { Send, Bot, User, Loader2, Image, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const AIHelp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. You can ask me anything or upload an image for analysis. 👋",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Clean up image preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (max 5MB) and type
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if ((!userMessage && !imageFile) || loading) return;

    // Build user message entry
    const newUserMessage: Message = {
      role: "user",
      content: userMessage || "📷 Image uploaded for analysis",
      image: imagePreview || undefined,
    };

    // Add to chat immediately
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    // Prepare form data
    const formData = new FormData();
    if (userMessage) formData.append("message", userMessage);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await api.post("/ai/chat/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const assistantReply =
        res.data.content || res.data.response || "No response received.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      removeImage(); // Clear attachment after send
    }
  };

  return (
    <div className="app-shell p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask a question or upload an image for analysis
            </p>
          </div>
        </motion.div>

        {/* Chat card */}
        <div className="app-card overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "assistant"
                      ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {msg.content}
                  {msg.image && (
                    <div className="mt-2">
                      <img
                        src={msg.image}
                        alt="Uploaded"
                        className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl">
                  <div className="flex gap-1 items-center">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900/50"
          >
            {/* Image preview */}
            {imagePreview && (
              <div className="relative inline-block w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove uploaded image"
                  title="Remove image"
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message… (Shift+Enter for new line)"
                rows={1}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                disabled={loading}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload an image"
                title="Upload image"
                className="shrink-0 p-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                disabled={loading}
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={(!input.trim() && !imageFile) || loading}
                className="shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIHelp;
