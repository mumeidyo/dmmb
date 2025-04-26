import React from "react";
import { cn } from "@/lib/utils";

interface CommandCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

export default function CommandCard({
  name,
  description,
  icon,
  bgColor,
  iconColor,
}: CommandCardProps) {
  return (
    <div className="rounded-lg overflow-hidden shadow-md bg-discord-dark border border-gray-700 hover:border-discord-blurple hover:bg-opacity-90 transition-all">
      <div className="p-4 flex items-start space-x-4">
        <div className={cn("p-3 rounded-lg", bgColor, "bg-opacity-10")}>
          <div className={cn("w-6 h-6", iconColor)}>{icon}</div>
        </div>
        <div>
          <h3 className="font-mono text-discord-white font-bold mb-1">{name}</h3>
          <p className="text-sm text-discord-light">{description}</p>
        </div>
      </div>
    </div>
  );
}