import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { SopStage } from "../state/types";

function CollapsedSop({
  stage,
  index,
  onEdit,
  onDelete,
}: {
  stage: SopStage;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500 }}>
          {stage.title || "未命名阶段"}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-400)", marginLeft: "auto" }}>
          {stage.content ? `${stage.content.split("\n").length} 行` : "空"}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>编辑</button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

export function SopEditor() {
  const { doc, dispatch, confirm } = useAppState();
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
        <span className="section-badge">紧急响应流程</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: "删除「紧急响应流程」模块",
              message: "删除后该模块将不再显示，也不会出现在目录和导出的 PDF 中。",
              confirmText: "删除模块",
            });
            if (ok) dispatch({ type: "REMOVE_SOP_MODULE" });
          }}
        >
          删除模块
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          标准操作流程：可根据实际情况添加、修改或删除阶段内容。
        </p>

        {doc.sopStages.map((stage, i) => {
          if (stage.id !== expandedId) {
            return (
              <CollapsedSop
                key={stage.id}
                stage={stage}
                index={i}
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
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>收起</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_SOP_STAGE", id: stage.id })}>删除</button>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">阶段名称</label>
                  <input
                    className="field-input"
                    placeholder="例：确认与通知"
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
                  <label className="field-label">操作内容</label>
                  <textarea
                    className="field-input"
                    rows={6}
                    placeholder="填写具体操作步骤..."
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
          + 添加阶段
        </button>
      </div>
    </section>
  );
}
