import React from "react";
import { useNavigate } from "react-router-dom";

interface NextButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

const NextButton: React.FC<NextButtonProps> = ({
  to,
  label = "Next",
  className = "",
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={`Go forward to ${to ? to : "next location"}`}
    >
      <span>{label}</span>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
};

export default NextButton;
