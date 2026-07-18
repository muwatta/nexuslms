import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let _addToast: ((msg: string, type: ToastData["type"]) => void) | null = null;

export function toast(message: string, type: ToastData["type"] = "info") {
  _addToast?.(message, type);
}

export function toastSuccess(message: string) {
  toast(message, "success");
}

export function toastError(message: string) {
  toast(message, "error");
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-emerald-600",
  error: "bg-rose-600",
  info: "bg-blue-600",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData["type"]) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => {
      _addToast = null;
    };
  }, [addToast]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} data={t} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

const ToastItem: React.FC<{
  data: ToastData;
  onRemove: (id: string) => void;
}> = ({ data, onRemove }) => {
  const Icon = icons[data.type];
  const bg = colors[data.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(data.id), 4500);
    return () => clearTimeout(timer);
  }, [data.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl ${bg} text-white min-w-[300px] max-w-[420px]`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{data.message}</p>
      <button
        type="button"
        onClick={() => onRemove(data.id)}
        aria-label="Close"
        className="opacity-70 hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
