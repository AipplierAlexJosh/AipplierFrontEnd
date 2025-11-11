"use client";

import SidebarNav from "@/components/SidebarNav";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import CommentsPanel from "@/components/CommentsPanel";
import WalkthroughContent from "@/components/WalkthroughContent";

export default function Home() {
  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="workspace">
        <WorkspaceHeader />
        <WalkthroughContent />
      </main>
      <CommentsPanel />
    </div>
  );
}

