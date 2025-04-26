import React from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: string;
  changeColor?: string;
  iconBgColor: string;
  iconColor: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeColor = "text-green-400",
  iconBgColor,
  iconColor,
}: StatsCardProps) {
  return (
    <div className="bg-discord-darker rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-discord-light">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2 ${iconBgColor} bg-opacity-20 rounded-md`}>
          <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
        </div>
      </div>
      {change && (
        <div className="mt-2">
          <p className={`text-xs ${changeColor}`}>{change}</p>
        </div>
      )}
    </div>
  );
}
