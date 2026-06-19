import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { SopStage } from "../state/types";
import type { Locale } from "../i18n/locale";
import { t } from "../i18n";

function CollapsedSop({
  stage,
  index,
  locale,
  onEdit,
  onDelete,
}: {
  stage: SopStage;
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
          {stage.title || t(locale, "sop.unnamedStage")}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-400)", marginLeft: "auto" }}>
          {stage.content ? t(locale, "sop.lineCount", { n: stage.content.split("\n").length }) : t(locale, "sop.empty")}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>{t(locale, "common.edit")}</button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>{t(locale, "common.delete")}</button>
      </div>
    </div>
  );
}

export function SopEditor() {
  const { doc, dispatch, confirm, locale } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const prevCountRef = useRef(doc.sopStages.length);

  useEffect(() => {
    if (doc.sopStages.length > prevCountRef.current) {
      const last = doc.sopStages[doc.sopStages.length - 1];
      if (last) setExpandedId(last.id);
    }
    prevCountRef.current = doc.sopStages.length;
  }, [doc.sopStages]);

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

  if (doc.sopRemoved) return null;

  return (
    <section className="section" id="chapter-sop" ref={sectionRef}>
      <div className="section-header">
        <span className="section-badge">{t(locale, "sop.badge")}</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: t(locale, "confirmModule.title", { module: t(locale, "sop.badge") }),
              message: t(locale, "confirmModule.message"),
              confirmText: t(locale, "common.deleteModule"),
            });
            if (ok) dispatch({ type: "REMOVE_SOP_MODULE" });
          }}
        >
          {t(locale, "common.deleteModule")}
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          {t(locale, "sop.intro")}
        </p>

        {doc.sopStages.map((stage, i) => {
          if (stage.id !== expandedId) {
            return (
              <CollapsedSop
                key={stage.id}
                stage={stage}
                index={i}
                locale={locale}
                onEdit={() => setExpandedId(stage.id)}
                onDelete={() => dispatch({ type: "REMOVE_SOP_STAGE", id: stage.id })}
              />
            );
          }

          return (
            <div className="card" key={stage.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>{t(locale, "common.collapse")}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_SOP_STAGE", id: stage.id })}>{t(locale, "common.delete")}</button>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "sop.fStageTitle")}</label>
                  <input
                    className="field-input"
                    placeholder={t(locale, "sop.fStageTitlePlaceholder")}
                    value={stage.title}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SOP_STAGE", id: stage.id, patch: { title: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "sop.fContent")}</label>
                  <textarea
                    className="field-input"
                    rows={6}
                    placeholder={t(locale, "sop.fContentPlaceholder")}
                    value={stage.content}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SOP_STAGE", id: stage.id, patch: { content: e.target.value } })
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

        <button className="btn btn-secondary" onClick={() => dispatch({ type: "ADD_SOP_STAGE" })}>
          {t(locale, "sop.add")}
        </button>
      </div>
    </section>
  );
}
