"use client";

import { MessageCircle, Plus } from "lucide-react";

export default function CommentsPanel() {
  return (
    <aside className="comments-panel">
      <header className="comments-panel__header">
        <MessageCircle size={18} />
        <span>Comments</span>
      </header>
      <div className="comments comments--empty">
        <div className="empty-thread">
          <div className="empty-thread__badge">
            <Plus size={18} />
          </div>
          <h3>No threads yet</h3>
          <p>Capture feedback and decisions in real time. New conversations will appear here.</p>
          <button type="button" className="pill-button">
            Start a thread
          </button>
        </div>
      </div>
    </aside>
  );
}

