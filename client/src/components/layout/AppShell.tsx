import React from "react";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}
