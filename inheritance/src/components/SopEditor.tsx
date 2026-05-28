import { useAppState } from "../state/context";

export function SopEditor() {
  const { doc, dispatch } = useAppState();

  return (
    <section className="section" id="chapter-sop">
      <div className="section-header">
        <span className="section-badge">五阶段 SOP</span>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          标准操作流程：覆盖从确认通知到税务结算的完整路径。可根据实际情况修改内容。
        </p>

        {doc.sopStages.map((stage, i) => (
          <div className="card" key={stage.id}>
            <div className="card-header">
              <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="field-group full">
              <div className="field">
                <label className="field-label">阶段名称</label>
                <input
                  className="field-input"
                  value={stage.title}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SOP_STAGE",
                      id: stage.id,
                      patch: { title: e.target.value },
                    })
                  }
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>
            <div className="field-group full">
              <div className="field">
                <label className="field-label">操作内容（支持 Markdown）</label>
                <textarea
                  className="field-input"
                  rows={6}
                  value={stage.content}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SOP_STAGE",
                      id: stage.id,
                      patch: { content: e.target.value },
                    })
                  }
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
