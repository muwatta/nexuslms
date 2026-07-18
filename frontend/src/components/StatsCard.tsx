import React from "react";

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

const colorClasses: Record<string, { bg: string; darkBg: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   darkBg: "dark:bg-blue-800",   border: "border-blue-500" },
  green:  { bg: "bg-green-50",  darkBg: "dark:bg-green-800",  border: "border-green-500" },
  red:    { bg: "bg-red-50",    darkBg: "dark:bg-red-800",    border: "border-red-500" },
  yellow: { bg: "bg-yellow-50", darkBg: "dark:bg-yellow-800", border: "border-yellow-500" },
  purple: { bg: "bg-purple-50", darkBg: "dark:bg-purple-800", border: "border-purple-500" },
  teal:   { bg: "bg-teal-50",   darkBg: "dark:bg-teal-800",   border: "border-teal-500" },
  orange: { bg: "bg-orange-50", darkBg: "dark:bg-orange-800", border: "border-orange-500" },
  cool:   { bg: "bg-gray-50",   darkBg: "dark:bg-gray-800",   border: "border-gray-500" },
};

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  color = "cool",
}) => {
  const classes = colorClasses[color] || colorClasses.cool;
  return (
    <div
      className={`${classes.bg} ${classes.darkBg} border-l-4 ${classes.border} p-4 rounded-lg shadow`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default StatsCard;
