import { useAppState } from "../state/context";

export function CustomSectionEditor() {
  const { doc, dispatch } = useAppState();

  return (
    <section className="section" id="chapter-custom">
      <div className="section-header">
        <span className="section-badge">自定义区</span>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 13, marginBottom: "var(--sp-4)" }}>
          添加任意自定义内容章节，例如遗嘱提示、家族信托说明、律师联系方式等。
        </p>

        {doc.customSections.map((section, i) => (
          <div className="card" key={section.id}>
            <div className="card-header">
              <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => dispatch({ type: "REMOVE_CUSTOM_SECTION", id: section.id })}
              >
                删除
              </button>
            </div>
            <div className="field-group full">
              <div className="field">
                <label className="field-label">章节标题</label>
                <input
                  className="field-input"
                  placeholder="例：律师与会计师联系方式"
                  value={section.title}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_CUSTOM_SECTION",
                      id: section.id,
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
                <label className="field-label">内容（支持 Markdown）</label>
                <textarea
                  className="field-input"
                  rows={6}
                  placeholder="在此编写内容..."
                  value={section.content}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_CUSTOM_SECTION",
                      id: section.id,
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
