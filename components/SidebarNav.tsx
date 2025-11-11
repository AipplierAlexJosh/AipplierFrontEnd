"use client";

export default function SidebarNav() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand-dot" />
        <span className="brand-name">Aipplier</span>
      </div>
      <div className="sidebar__nav sidebar__nav--empty">
        <h2>Auto apply flow</h2>
        <p>
          Upload your resume PDF and the job description PDF. When both are ready, start the apply
          sequence and monitor progress from the main panel.
        </p>
        <p className="sidebar__hint">
          This sidebar will evolve into quick stats and history once backend integration lands.
        </p>
      </div>
    </aside>
  );
}

