// FILE: src/components/ui/Toast.tsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning";
  onClose: () => void;
}

export const Toast = ({ message, type = "info", onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg =
    type === "success"
      ? "bg-emerald-600"
      : type === "warning"
        ? "bg-amber-600"
        : "bg-blue-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 right-4 ${bg} text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
    </motion.div>
  );
};
