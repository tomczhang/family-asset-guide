import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { CustomSection } from "../state/types";

function CollapsedSection({
  section,
  index,
  onEdit,
  onDelete,
}: {
  section: CustomSection;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500 }}>
          {section.title || "未命名章节"}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-400)", marginLeft: "auto" }}>
          {section.content ? `${section.content.split("\n").length} 行` : "空"}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>编辑</button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

export function CustomSectionEditor() {
  const { doc, dispatch, confirm } = useAppState();
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
        <span className="section-badge">自定义区</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: "删除「自定义区」模块",
              message: "删除后该模块将不再显示，也不会出现在目录和导出的 PDF 中。",
              confirmText: "删除模块",
            });
            if (ok) dispatch({ type: "REMOVE_CUSTOM_MODULE" });
          }}
        >
          删除模块
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          添加任意自定义内容章节，例如遗嘱提示、家族信托说明、律师联系方式等。
        </p>

        {doc.customSections.map((section, i) => {
          if (section.id !== expandedId) {
            return (
              <CollapsedSection
                key={section.id}
                section={section}
                index={i}
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
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>收起</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_CUSTOM_SECTION", id: section.id })}>删除</button>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">章节标题</label>
                  <input
                    className="field-input"
                    placeholder="例：律师与会计师联系方式"
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
                  <label className="field-label">内容（支持 Markdown）</label>
                  <textarea
                    className="field-input"
                    rows={6}
                    placeholder="在此编写内容..."
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
          + 添加自定义章节
        </button>
      </div>
    </section>
  );
}
