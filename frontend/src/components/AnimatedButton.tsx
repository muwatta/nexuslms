import React from "react";
import { motion, MotionProps } from "framer-motion";
import { clsx } from "clsx";

type AnimatedButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  fullWidth?: boolean;
  whileHover?: MotionProps["whileHover"];
  whileTap?: MotionProps["whileTap"];
  transition?: MotionProps["transition"];
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onAnimationStart" | "onAnimationEnd"
>;

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      fullWidth = false,
      whileHover = { scale: 1.04 },
      whileTap = { scale: 0.96 },
      transition = { type: "spring", stiffness: 400, damping: 17 },
      className = "",
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    const variantClasses = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800",
      secondary:
        "bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700",
      danger:
        "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800",
      success:
        "bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const baseClasses = clsx(
      "inline-flex items-center space-x-2 rounded-lg font-medium transition-all",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full justify-center",
      disabled && "opacity-60 cursor-not-allowed pointer-events-none",
      className,
    );

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? whileHover : undefined}
        whileTap={!disabled ? whileTap : undefined}
        transition={transition}
        className={baseClasses}
        disabled={disabled}
        {...(rest as any)} // 👈 cast to any to avoid type conflicts with motion
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </motion.button>
    );
  },
);
 
AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
