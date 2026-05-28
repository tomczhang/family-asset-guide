import { useAppState } from "../state/context";
import type { TwoFactorMethod } from "../state/types";
import { ASSET_TYPE_LABELS } from "../state/types";

const METHOD_LABELS: Record<TwoFactorMethod, string> = {
  totp: "TOTP 验证器",
  sms: "短信验证",
  hardware_key: "硬件密钥",
  email: "邮箱验证",
  other: "其他",
};

export function AccessEditor() {
  const { doc, dispatch } = useAppState();

  return (
    <section className="section" id="chapter-access">
      <div className="section-header">
        <span className="section-badge">账户访问与 2FA</span>
      </div>
      <div className="section-body">
        {/* 2FA Entries */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--stone-700)", marginBottom: "var(--sp-3)" }}>
          双因素认证 (2FA)
        </h4>
        <p style={{ color: "var(--stone-500)", fontSize: 12, marginBottom: "var(--sp-4)" }}>
          记录每个账户的 2FA 恢复方式，确保继承人能获取访问权限。
        </p>

        {doc.access.twoFactorEntries.map((entry, i) => {
          const asset = doc.assets.find((a) => a.id === entry.assetId);
          return (
            <div className="card" key={entry.id}>
              <div className="card-header">
                <span className="card-number">
                  2FA-{String(i + 1).padStart(2, "0")}
                  {asset && (
                    <span style={{ marginLeft: 8, color: "var(--stone-500)", fontFamily: "var(--font-sans)" }}>
                      {asset.institution || asset.type}
                    </span>
                  )}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => dispatch({ type: "REMOVE_TWO_FACTOR", id: entry.id })}
                >
                  删除
                </button>
              </div>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">关联资产</label>
                  <select
                    className="field-input"
                    value={entry.assetId}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TWO_FACTOR",
                        id: entry.id,
                        patch: { assetId: e.target.value },
                      })
                    }
                  >
                    <option value="">选择资产</option>
                    {doc.assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.institution || "(未命名)"} - {a.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">验证方式</label>
                  <select
                    className="field-input"
                    value={entry.method}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TWO_FACTOR",
                        id: entry.id,
                        patch: { method: e.target.value as TwoFactorMethod },
                      })
                    }
                  >
                    {Object.entries(METHOD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">恢复指引</label>
                  <textarea
                    className="field-input"
                    rows={3}
                    placeholder="恢复码位置、备用设备、恢复流程说明..."
                    value={entry.recoveryInstructions}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TWO_FACTOR",
                        id: entry.id,
                        patch: { recoveryInstructions: e.target.value },
                      })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {doc.assets.length > 0 ? (
          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-6)" }}>
            {doc.assets.map((a) => (
              <button
                key={a.id}
                className="btn btn-secondary btn-sm"
                onClick={() => dispatch({ type: "ADD_TWO_FACTOR", assetId: a.id })}
              >
                + {a.institution || ASSET_TYPE_LABELS[a.type]} 的 2FA
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--stone-400)", fontSize: 12, marginBottom: "var(--sp-6)" }}>
            请先在「资产清单」中添加资产
          </p>
        )}

        {/* Sealed Envelopes */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--stone-700)", marginBottom: "var(--sp-3)" }}>
          密封件清单
        </h4>
        <p style={{ color: "var(--stone-500)", fontSize: 12, marginBottom: "var(--sp-4)" }}>
          记录物理密封件的位置和关联资产，用于存放密码、密钥等敏感信息。
        </p>

        {doc.access.seals.map((seal, i) => (
          <div className="card" key={seal.id}>
            <div className="card-header">
              <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => dispatch({ type: "REMOVE_SEAL", id: seal.id })}
              >
                删除
              </button>
            </div>
            <div className="field-group">
              <div className="field">
                <label className="field-label">标签</label>
                <input
                  className="field-input"
                  placeholder="例：密封件 #A"
                  value={seal.label}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { label: e.target.value } })
                  }
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
              <div className="field">
                <label className="field-label">存放位置</label>
                <input
                  className="field-input"
                  placeholder="例：家中保险柜第二层"
                  value={seal.location}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SEAL",
                      id: seal.id,
                      patch: { location: e.target.value },
                    })
                  }
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>
            <div className="field-group full">
              <div className="field">
                <label className="field-label">关联资产</label>
                <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                  {doc.assets.map((a) => {
                    const linked = seal.linkedAssetIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        className={`btn btn-sm ${linked ? "btn-amber" : "btn-secondary"}`}
                        onClick={() => {
                          const ids = linked
                            ? seal.linkedAssetIds.filter((x) => x !== a.id)
                            : [...seal.linkedAssetIds, a.id];
                          dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { linkedAssetIds: ids } });
                        }}
                      >
                        {a.institution || a.type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="field-group full">
              <div className="field">
                <label className="field-label">备注</label>
                <textarea
                  className="field-input"
                  rows={2}
                  placeholder="补充说明"
                  value={seal.notes}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { notes: e.target.value } })
                  }
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-secondary" onClick={() => dispatch({ type: "ADD_SEAL" })}>
          + 添加密封件
        </button>
      </div>
    </section>
  );
}
