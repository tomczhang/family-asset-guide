import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { SealedEnvelope, TwoFactorMethod } from "../state/types";
import { ASSET_TYPE_LABELS } from "../state/types";

function assetDisplayName(asset: { institution: string; type: string; accountNumber: string }, index: number): string {
  const name = asset.institution || ASSET_TYPE_LABELS[asset.type as keyof typeof ASSET_TYPE_LABELS] || asset.type;
  const suffix = asset.accountNumber ? ` (${asset.accountNumber})` : ` #${index + 1}`;
  return `${name}${suffix}`;
}

function CollapsedSeal({
  seal,
  index,
  sealLabel,
  onEdit,
  onDelete,
}: {
  seal: SealedEnvelope;
  index: number;
  sealLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sealLabel}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {seal.location || "—"}
        </span>
        <span style={{ marginLeft: "auto", flexShrink: 0 }} />
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} onClick={onEdit}>编辑</button>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

export function AccessEditor() {
  const { doc, dispatch, confirm } = useAppState();
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedSeal, setExpandedSeal] = useState<string | null>(null);
  const prevSealCount = useRef(doc.access.seals.length);

  useEffect(() => {
    if (doc.access.seals.length > prevSealCount.current) {
      const last = doc.access.seals[doc.access.seals.length - 1];
      if (last) setExpandedSeal(last.id);
    }
    prevSealCount.current = doc.access.seals.length;
  }, [doc.access.seals]);

  const handleSectionClick = (e: React.MouseEvent) => {
    if (!expandedSeal) return;
    const target = e.target as HTMLElement;
    if (target.closest(".card")) return;
    setExpandedSeal(null);
  };

  if (doc.accessRemoved) return null;

  return (
    <section className="section" id="chapter-access" ref={sectionRef} onClick={handleSectionClick}>
      <div className="section-header">
        <span className="section-badge">密码指引</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: "删除「密码指引」模块",
              message: "删除后该模块将不再显示，也不会出现在目录和导出的 PDF 中。",
              confirmText: "删除模块",
            });
            if (ok) dispatch({ type: "REMOVE_ACCESS_MODULE" });
          }}
        >
          删除模块
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 12, marginBottom: "var(--sp-4)" }}>
          记录密码存放位置和 2FA 恢复方式，关联到具体资产。继承人通过这里找到登录所需的全部凭证。
        </p>

        {doc.access.seals.map((seal, i) => {
          const linkedNames = seal.linkedAssetIds
            .map((id) => {
              const idx = doc.assets.findIndex((a) => a.id === id);
              if (idx === -1) return null;
              return doc.assets[idx]!.institution || ASSET_TYPE_LABELS[doc.assets[idx]!.type as keyof typeof ASSET_TYPE_LABELS];
            })
            .filter(Boolean);
          const uniqueNames = [...new Set(linkedNames)];
          const sealLabel = uniqueNames.length > 0 ? uniqueNames.join("、") : `密码指引 #${i + 1}`;

          if (seal.id !== expandedSeal) {
            return (
              <CollapsedSeal
                key={seal.id}
                seal={seal}
                index={i}
                sealLabel={sealLabel}
                onEdit={() => setExpandedSeal(seal.id)}
                onDelete={() => dispatch({ type: "REMOVE_SEAL", id: seal.id })}
              />
            );
          }

          return (
            <div className="card" key={seal.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedSeal(null)}>收起</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_SEAL", id: seal.id })}>删除</button>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--stone-700)", marginBottom: "var(--sp-3)" }}>
                {sealLabel}
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">存放位置</label>
                  <input
                    className="field-input"
                    placeholder="例：1Password / 家中保险柜第二层"
                    value={seal.location}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { location: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">密码说明</label>
                  <input
                    className="field-input"
                    placeholder="例：密码写在密封信封内 / 1Password 主密码见遗嘱"
                    value={seal.passwordHint}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { passwordHint: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">2FA 验证方式</label>
                  <select
                    className="field-input"
                    value={seal.twoFactorMethod}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { twoFactorMethod: e.target.value as TwoFactorMethod | "none" } })
                    }
                  >
                    <option value="none">无</option>
                    <option value="totp">TOTP 验证器</option>
                    <option value="sms">短信验证</option>
                    <option value="hardware_key">硬件密钥</option>
                    <option value="email">邮箱验证</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                {seal.twoFactorMethod !== "none" && (
                  <div className="field">
                    <label className="field-label">2FA 恢复指引</label>
                    <input
                      className="field-input"
                      placeholder="恢复码位置 / 备用设备 / 恢复流程"
                      value={seal.twoFactorRecovery}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { twoFactorRecovery: e.target.value } })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                )}
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">关联资产</label>
                  <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                    {(() => {
                      const seen = new Map<string, { ids: string[]; label: string }>();
                      doc.assets.forEach((a, idx) => {
                        const key = `${a.institution}||${a.accountNumber}`;
                        if (!seen.has(key)) {
                          seen.set(key, { ids: [a.id], label: assetDisplayName(a, idx) });
                        } else {
                          seen.get(key)!.ids.push(a.id);
                        }
                      });
                      return Array.from(seen.values()).map(({ ids, label }) => {
                        const linked = ids.some((id) => seal.linkedAssetIds.includes(id));
                        return (
                          <button
                            key={ids[0]}
                            className={`btn btn-sm ${linked ? "btn-amber" : "btn-secondary"}`}
                            onClick={() => {
                              const newIds = linked
                                ? seal.linkedAssetIds.filter((x) => !ids.includes(x))
                                : [...seal.linkedAssetIds, ...ids.filter((id) => !seal.linkedAssetIds.includes(id))];
                              dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { linkedAssetIds: newIds } });
                            }}
                          >
                            {label}
                          </button>
                        );
                      });
                    })()}
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
          );
        })}

        <button className="btn btn-secondary" onClick={() => dispatch({ type: "ADD_SEAL" })}>
          + 添加密码指引
        </button>
      </div>
    </section>
  );
}
