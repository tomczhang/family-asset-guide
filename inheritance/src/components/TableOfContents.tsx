import { useState, useEffect, useCallback } from "react";
import { useAppState } from "../state/context";
import "./TableOfContents.css";

interface Chapter {
  id: string;
  label: string;
  count: number;
}

export function TableOfContents() {
  const { doc, setOpenPasswordModal } = useAppState();
  const [activeId, setActiveId] = useState("chapter-assets");

  const chapters: Chapter[] = [
    { id: "chapter-assets", label: "资产清单", count: doc.assets.length },
    {
      id: "chapter-access",
      label: "账户访问与 2FA",
      count: doc.access.twoFactorEntries.length + doc.access.seals.length,
    },
    { id: "chapter-sop", label: "五阶段 SOP", count: doc.sopStages.length },
    { id: "chapter-custom", label: "自定义区", count: doc.customSections.length },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );

    chapters.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  });

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <aside className="toc">
      <div className="toc-inner">
        <div className="toc-title">目录</div>
        <nav className="toc-nav">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              className={`toc-item ${activeId === ch.id ? "toc-item--active" : ""}`}
              onClick={() => scrollTo(ch.id)}
            >
              <span className="toc-dot" />
              <span className="toc-label">{ch.label}</span>
              {ch.count > 0 && <span className="toc-count">{ch.count}</span>}
            </button>
          ))}
        </nav>
        <button
          className="toc-generate-btn"
          onClick={() => setOpenPasswordModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          生成 PDF
        </button>
      </div>
    </aside>
  );
}
