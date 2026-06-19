import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { CustomSection } from "../state/types";
import type { Locale } from "../i18n/locale";
import { t } from "../i18n";

function CollapsedSection({
  section,
  index,
  locale,
  onEdit,
  onDelete,
}: {
  section: CustomSection;
  index: number;
  locale: Locale;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500 }}>
          {section.title || t(locale, "custom.unnamedSection")}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-400)", marginLeft: "auto" }}>
          {section.content ? t(locale, "custom.lineCount", { n: section.content.split("\n").length }) : t(locale, "custom.empty")}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>{t(locale, "common.edit")}</button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>{t(locale, "common.delete")}</button>
      </div>
    </div>
  );
}

export function CustomSectionEditor() {
  const { doc, dispatch, confirm, locale } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevCountRef = useRef(doc.customSections.length);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (doc.customSections.length > prevCountRef.current) {
      const last = doc.customSections[doc.customSections.length - 1];
      if (last) setExpandedId(last.id);
    }
    prevCountRef.current = doc.customSections.length;
  }, [doc.customSections]);

  useEffect(() => {
    if (!expandedId) return;
    const handler = (e: MouseEvent) => {
      if (sectionRef.current?.contains(e.target as Node)) return;
      setExpandedId(null);
    };
    const raf = requestAnimationFrame(() => {
      document.addEventListener("click", handler);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", handler);
    };
  }, [expandedId]);

  if (doc.customRemoved) return null;

  return (
    <section className="section" id="chapter-custom" ref={sectionRef}>
      <div className="section-header">
        <span className="section-badge">{t(locale, "custom.badge")}</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: t(locale, "confirmModule.title", { module: t(locale, "custom.badge") }),
              message: t(locale, "confirmModule.message"),
              confirmText: t(locale, "common.deleteModule"),
            });
            if (ok) dispatch({ type: "REMOVE_CUSTOM_MODULE" });
          }}
        >
          {t(locale, "common.deleteModule")}
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          {t(locale, "custom.intro")}
        </p>

        {doc.customSections.map((section, i) => {
          if (section.id !== expandedId) {
            return (
              <CollapsedSection
                key={section.id}
                section={section}
                index={i}
                locale={locale}
                onEdit={() => setExpandedId(section.id)}
                onDelete={() => dispatch({ type: "REMOVE_CUSTOM_SECTION", id: section.id })}
              />
            );
          }

          return (
            <div className="card" key={section.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>{t(locale, "common.collapse")}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_CUSTOM_SECTION", id: section.id })}>{t(locale, "common.delete")}</button>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "custom.fTitle")}</label>
                  <input
                    className="field-input"
                    placeholder={t(locale, "custom.fTitlePlaceholder")}
                    value={section.title}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_CUSTOM_SECTION", id: section.id, patch: { title: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "custom.fContent")}</label>
                  <textarea
                    className="field-input"
                    rows={6}
                    placeholder={t(locale, "custom.fContentPlaceholder")}
                    value={section.content}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_CUSTOM_SECTION", id: section.id, patch: { content: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7 }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <button
          className="btn btn-secondary"
          onClick={() => dispatch({ type: "ADD_CUSTOM_SECTION" })}
        >
          {t(locale, "custom.add")}
        </button>
      </div>
    </section>
  );
}
