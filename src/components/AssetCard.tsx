import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";
import type { AssetType, Currency, Asset } from "../state/types";
import { getInstitutionsByType, getInstitutionById, DEFAULT_INSTITUTION } from "../data/institutions";

function mask(text: string): string {
  if (!text) return "";
  if (text.length <= 2) return "***";
  return text[0] + "***" + text[text.length - 1];
}

function CollapsedCard({
  asset,
  index,
  privacyMode,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  index: number;
  privacyMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const CURRENCY_SYMBOLS: Record<string, string> = {
    CNY: "¥", USD: "$", HKD: "HK$", GBP: "£", EUR: "€", JPY: "¥", OTHER: "",
  };
  const symbol = CURRENCY_SYMBOLS[asset.currency] ?? "";
  const formatted = asset.estimatedValue
    ? asset.estimatedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";
  const value = formatted ? `${symbol}${formatted}` : "—";

  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--amber-700)", background: "var(--amber-100)", padding: "2px 6px", minWidth: 42, textAlign: "center", flexShrink: 0 }}>
          {ASSET_TYPE_LABELS[asset.type]}
        </span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {asset.institution || "未选择机构"}
        </span>
        {asset.accountNumber && (
          <span className="collapsed-acct" style={{ fontSize: 12, color: "var(--stone-400)", fontFamily: "var(--font-mono)" }}>
            {privacyMode ? mask(asset.accountNumber) : asset.accountNumber}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--stone-800)", marginLeft: "auto", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
          {privacyMode ? "***" : value}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>
          编辑
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>
          删除
        </button>
      </div>
    </div>
  );
}

export function AssetEditor() {
  const { doc, dispatch, privacyMode } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevCountRef = useRef(doc.assets.length);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (doc.assets.length > prevCountRef.current) {
      const newAsset = doc.assets[doc.assets.length - 1];
      if (newAsset) setExpandedId(newAsset.id);
    }
    prevCountRef.current = doc.assets.length;
  }, [doc.assets]);

  const handleSectionClick = (e: React.MouseEvent) => {
    if (!expandedId) return;
    const target = e.target as HTMLElement;
    if (target.closest(".card")) return;
    setExpandedId(null);
  };

  const handleTypeChange = (assetId: string, newType: AssetType) => {
    const defaultInstId = DEFAULT_INSTITUTION[newType];
    const inst = defaultInstId ? getInstitutionById(defaultInstId) : undefined;
    dispatch({
      type: "UPDATE_ASSET",
      id: assetId,
      patch: {
        type: newType,
        institutionId: inst ? inst.id : "",
        institution: inst ? inst.name : "",
        loginUrl: inst ? inst.website : "",
        contactPhone: inst ? inst.phone : "",
        appDownload: inst ? inst.appDownload : "",
      },
    });
  };

  const handleInstitutionSelect = (assetId: string, institutionId: string) => {
    if (institutionId === "") {
      dispatch({
        type: "UPDATE_ASSET",
        id: assetId,
        patch: {
          institutionId: "",
          institution: "",
          loginUrl: "",
          contactPhone: "",
          appDownload: "",
        },
      });
      return;
    }
    const inst = getInstitutionById(institutionId);
    if (inst) {
      dispatch({
        type: "UPDATE_ASSET",
        id: assetId,
        patch: {
          institutionId: inst.id,
          institution: inst.name,
          loginUrl: inst.website,
          contactPhone: inst.phone,
          appDownload: inst.appDownload,
        },
      });
    }
  };

  const handleAdd = () => {
    dispatch({ type: "ADD_ASSET" });
  };

  const CNY_RATES: Record<string, number> = {
    CNY: 1, USD: 6.78, HKD: 0.87, GBP: 8.56, EUR: 7.58, JPY: 0.048, OTHER: 1,
  };
  const hasInsurance = doc.assets.some((a) => a.type === "insurance");
  const totalCNY = doc.assets.reduce((sum, a) => {
    if (a.type === "insurance") return sum;
    const val = parseFloat(a.estimatedValue.replace(/,/g, "")) || 0;
    const rate = CNY_RATES[a.currency] ?? 1;
    return sum + val * rate;
  }, 0);
  const totalFormatted = totalCNY > 0
    ? `¥${Math.round(totalCNY).toLocaleString()}`
    : "";

  return (
    <section className="section" id="chapter-assets" ref={sectionRef} onClick={handleSectionClick}>
      <div className="section-header">
        <span className="section-badge">资产清单</span>
        {totalFormatted && (
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "var(--stone-800)", fontFamily: "var(--font-mono)" }} title={hasInsurance ? "不含保单理赔额" : undefined}>
            总计 {privacyMode ? "¥***" : totalFormatted}
            {hasInsurance && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone-400)", marginLeft: 6, fontFamily: "var(--font-sans)" }}>不含保单</span>}
          </span>
        )}
      </div>
      <div className="section-body">
        {doc.assets.map((asset, i) => {
          if (asset.id !== expandedId) {
            return (
              <CollapsedCard
                key={asset.id}
                asset={asset}
                index={i}
                privacyMode={privacyMode}
                onEdit={() => setExpandedId(asset.id)}
                onDelete={() => dispatch({ type: "REMOVE_ASSET", id: asset.id })}
              />
            );
          }

          const institutions = getInstitutionsByType(asset.type);
          const isCustom = asset.institutionId === "";

          return (
            <div className="card" key={asset.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedId(null)}
                  >
                    收起
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => dispatch({ type: "REMOVE_ASSET", id: asset.id })}
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">资产类型</label>
                  <select
                    className="field-input"
                    value={asset.type}
                    onChange={(e) => handleTypeChange(asset.id, e.target.value as AssetType)}
                  >
                    {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">机构</label>
                  {institutions.length > 0 ? (
                    <select
                      className="field-input"
                      value={asset.institutionId}
                      onChange={(e) => handleInstitutionSelect(asset.id, e.target.value)}
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                      <option value="">其他（手动填写）</option>
                    </select>
                  ) : (
                    <input
                      className="field-input"
                      placeholder="机构名称"
                      value={asset.institution}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { institution: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  )}
                </div>
              </div>

              {isCustom && institutions.length > 0 && (
                <div className="field-group">
                  <div className="field">
                    <label className="field-label">机构名称</label>
                    <input
                      className="field-input"
                      placeholder="机构名称"
                      value={asset.institution}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { institution: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">登录网址</label>
                    <input
                      className="field-input"
                      placeholder="https://..."
                      value={asset.loginUrl}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { loginUrl: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              )}

              {isCustom && institutions.length > 0 && (
                <div className="field-group">
                  <div className="field">
                    <label className="field-label">联系电话</label>
                    <input
                      className="field-input"
                      placeholder="客服热线"
                      value={asset.contactPhone}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { contactPhone: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">APP 下载</label>
                    <input
                      className="field-input"
                      placeholder="下载方式或链接"
                      value={asset.appDownload}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { appDownload: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              )}

              {!isCustom && (
                <div className="field-group" style={{ opacity: 0.75 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label className="field-label">网址</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)", wordBreak: "break-all" }}>
                      {asset.loginUrl}
                    </span>
                  </div>
                  <div className="field">
                    <label className="field-label">电话</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)" }}>
                      {asset.contactPhone}
                    </span>
                  </div>
                  <div className="field">
                    <label className="field-label">APP</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)" }}>
                      {asset.appDownload}
                    </span>
                  </div>
                </div>
              )}

              {institutions.length === 0 && (
                <div className="field-group">
                  <div className="field">
                    <label className="field-label">登录网址</label>
                    <input
                      className="field-input"
                      placeholder="https://..."
                      value={asset.loginUrl}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { loginUrl: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">联系电话</label>
                    <input
                      className="field-input"
                      placeholder="客服热线"
                      value={asset.contactPhone}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { contactPhone: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              )}

              {asset.type === "insurance" ? (
                <>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">险种</label>
                      <input
                        className="field-input"
                        placeholder="例：定期寿险、重疾险、医疗险"
                        value={asset.insuranceKind}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { insuranceKind: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">保单号</label>
                      <input
                        className="field-input"
                        placeholder="保单编号"
                        value={asset.accountNumber}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountNumber: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">理赔额</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder="保额"
                          value={asset.estimatedValue}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { estimatedValue: e.target.value } })
                          }
                          autoComplete="off"
                          data-lpignore="true"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">保险人</label>
                      <input
                        className="field-input"
                        placeholder="被保险人姓名"
                        value={asset.insuredPerson}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { insuredPerson: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">缴费年限</label>
                      <input
                        className="field-input"
                        placeholder="例：20年"
                        value={asset.paymentYears}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { paymentYears: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">是否还在缴费</label>
                      <select
                        className="field-input"
                        value={asset.stillPaying ? "yes" : "no"}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { stillPaying: e.target.value === "yes" } })
                        }
                      >
                        <option value="yes">缴费中</option>
                        <option value="no">已缴清</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : asset.type === "bank_deposit" ? (
                <>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">户主姓名</label>
                      <input
                        className="field-input"
                        placeholder="开户人姓名"
                        value={asset.loginUsername}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { loginUsername: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">银行账号</label>
                      <input
                        className="field-input"
                        placeholder="银行卡号"
                        value={asset.accountNumber}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountNumber: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">余额</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder="金额"
                          value={asset.estimatedValue}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { estimatedValue: e.target.value } })
                          }
                          autoComplete="off"
                          data-lpignore="true"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">账户号码</label>
                      <input
                        className="field-input"
                        placeholder="账户编号"
                        value={asset.accountNumber}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountNumber: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">估值</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder="金额"
                          value={asset.estimatedValue}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { estimatedValue: e.target.value } })
                          }
                          autoComplete="off"
                          data-lpignore="true"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">登录用户名</label>
                      <input
                        className="field-input"
                        placeholder="用户名 / 邮箱 / 手机号"
                        value={asset.loginUsername}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { loginUsername: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">注册邮箱</label>
                      <input
                        className="field-input"
                        placeholder="example@email.com"
                        value={asset.registerEmail}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { registerEmail: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">绑定手机</label>
                      <input
                        className="field-input"
                        placeholder="138xxxx1234"
                        value={asset.bindPhone}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { bindPhone: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="field-group">
                <div className="field">
                  <label className="field-label">是否指定受益人</label>
                  <select
                    className="field-input"
                    value={asset.hasBeneficiary ? "yes" : "no"}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ASSET",
                        id: asset.id,
                        patch: { hasBeneficiary: e.target.value === "yes" },
                      })
                    }
                  >
                    <option value="no">未指定</option>
                    <option value="yes">已指定</option>
                  </select>
                </div>
                {asset.hasBeneficiary && (
                  <div className="field">
                    <label className="field-label">受益人</label>
                    <input
                      className="field-input"
                      placeholder="例：配偶 张丽"
                      value={asset.beneficiary}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { beneficiary: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                )}
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">备注</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    placeholder="补充说明"
                    value={asset.notes}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ASSET",
                        id: asset.id,
                        patch: { notes: e.target.value },
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

        <button className="btn btn-secondary" onClick={handleAdd}>
          + 添加资产
        </button>
      </div>
    </section>
  );
}
