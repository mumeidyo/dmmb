import React from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-discord-dark text-discord-light min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Add custom Discord colors to Tailwind
// We need to append these styles since we can't modify tailwind.config.ts directly
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    .bg-discord-blurple { background-color: #5865F2; }
    .bg-discord-green { background-color: #43B581; }
    .bg-discord-red { background-color: #F04747; }
    .bg-discord-yellow { background-color: #FAA61A; }
    .bg-discord-dark { background-color: #36393F; }
    .bg-discord-darker { background-color: #2F3136; }
    .bg-discord-sidebar { background-color: #2F3136; }
    .text-discord-blurple { color: #5865F2; }
    .text-discord-green { color: #43B581; }
    .text-discord-red { color: #F04747; }
    .text-discord-yellow { color: #FAA61A; }
    .text-discord-light { color: #DCDDDE; }
    .border-discord-sidebar { border-color: #2F3136; }
    .border-gray-700 { border-color: rgba(79, 84, 92, 0.48); }
    .hover\\:bg-discord-dark:hover { background-color: #36393F; }
    .bg-opacity-20 { opacity: 0.2; }
  `;
  document.head.appendChild(style);
});
