"use client";

import { useState } from "react";
import { Share2, Edit3, MoreHorizontal } from "lucide-react";

export default function WorkspaceHeader() {
  const [mode, setMode] = useState<"edit" | "read">("read");

  return (
    <header className="workspace-header">
      <div>
        <div className="breadcrumb">
          Aipplier <span aria-hidden="true">•</span> Auto apply workspace
        </div>
        <h1>Aipplier</h1>
      </div>
      <div className="workspace-header__actions">
        <button
          type="button"
          className={mode === "edit" ? "toggle toggle--active" : "toggle"}
          onClick={() => setMode("edit")}
        >
          <Edit3 size={16} />
          Edit
        </button>
        <button
          type="button"
          className={mode === "read" ? "toggle toggle--active" : "toggle"}
          onClick={() => setMode("read")}
        >
          Read
        </button>
        <span className="divider" role="presentation" />
        <button type="button" className="pill-button">
          <Share2 size={16} />
          Share
        </button>
        <button type="button" className="icon-button">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
}

