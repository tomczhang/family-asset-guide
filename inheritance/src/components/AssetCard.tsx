import { useAppState } from "../state/context";
import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";
import type { AssetType, Currency } from "../state/types";
import { getInstitutionsByType, getInstitutionById, DEFAULT_INSTITUTION } from "../data/institutions";

export function AssetEditor() {
  const { doc, dispatch } = useAppState();

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

  return (
    <section className="section" id="chapter-assets">
      <div className="section-header">
        <span className="section-badge">资产清单</span>
      </div>
      <div className="section-body">
        {doc.assets.map((asset, i) => {
          const institutions = getInstitutionsByType(asset.type);
          const isCustom = asset.institutionId === "";

          return (
            <div className="card" key={asset.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => dispatch({ type: "REMOVE_ASSET", id: asset.id })}
                >
                  删除
                </button>
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

              {/* 不动产和其他类型没有预设机构，直接显示手动输入 */}
              {institutions.length === 0 && (
                <>
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
                </>
              )}

              <div className="field-group">
                <div className="field">
                  <label className="field-label">账户号码</label>
                  <input
                    className="field-input"
                    placeholder="账户编号"
                    value={asset.accountNumber}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_ASSET",
                        id: asset.id,
                        patch: { accountNumber: e.target.value },
                      })
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
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { currency: e.target.value as Currency },
                        })
                      }
                    >
                      {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field-input"
                      style={{ flex: 1 }}
                      placeholder="金额"
                      value={asset.estimatedValue}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_ASSET",
                          id: asset.id,
                          patch: { estimatedValue: e.target.value },
                        })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              </div>
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

        <button className="btn btn-secondary" onClick={() => dispatch({ type: "ADD_ASSET" })}>
          + 添加资产
        </button>
      </div>
    </section>
  );
}
