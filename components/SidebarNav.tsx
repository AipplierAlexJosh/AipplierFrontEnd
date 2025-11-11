"use client";

import { useState } from "react";
import { ChevronDown, CirclePlus } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    label: "Company Values",
    items: ["Mission & Vision", "Company Overview", "Team Directory", "Sales Team"]
  },
  {
    label: "Planning",
    items: ["Strategic Goals", "OKRs & KPIs", "Initiatives", "Budget 2025"]
  },
  {
    label: "Operations",
    items: ["Process Library", "Competitor Analysis", "Staff Onboarding"]
  }
];

export default function SidebarNav() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.label, true]))
  );

  const toggleSection = (label: string) =>
    setExpanded((current) => ({
      ...current,
      [label]: !current[label]
    }));

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand-dot" />
        <span className="brand-name">Aipplier</span>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__section-header">
          <span>Product Management</span>
          <button type="button" className="icon-button" aria-label="Add page">
            <CirclePlus size={16} strokeWidth={2} />
          </button>
        </div>
        <ul className="sidebar__pages">
          <li className="sidebar__link sidebar__link--active">
            <Link href="#">
              <span className="dot dot--amber" />
              Walkthrough
            </Link>
          </li>
          <li className="sidebar__link">
            <Link href="#">Overview</Link>
          </li>
          <li className="sidebar__link">
            <Link href="#">Search</Link>
          </li>
          <li className="sidebar__link">
            <Link href="#">Space settings</Link>
          </li>
        </ul>
        {sections.map((section) => (
          <div key={section.label} className="sidebar__section">
            <button
              type="button"
              className="sidebar__section-toggle"
              onClick={() => toggleSection(section.label)}
              aria-expanded={expanded[section.label]}
            >
              <ChevronDown
                size={14}
                className={expanded[section.label] ? "chevron chevron--open" : "chevron"}
              />
              <span>{section.label}</span>
            </button>
            {expanded[section.label] ? (
              <ul className="sidebar__section-list">
                {section.items.map((item) => (
                  <li key={item} className="sidebar__link">
                    <Link href="#">{item}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}

