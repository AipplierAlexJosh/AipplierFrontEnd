"use client";

import SidebarNav from "@/components/SidebarNav";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import WalkthroughContent from "@/components/WalkthroughContent";

export default function Home() {
  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="workspace">
        <WorkspaceHeader />
        <WalkthroughContent />
      </main>
    </div>
  );
}

