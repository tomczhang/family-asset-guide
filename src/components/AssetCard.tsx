import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";
import type { AssetType, Currency, Asset } from "../state/types";
import { getInstitutionsByType, getInstitutionById, DEFAULT_INSTITUTION } from "../data/institutions";
import {
  ASSET_FILTERS,
  defaultTypeForFilter,
  filterForAsset,
  formatCny,
  isStockAccount,
  summarizeAssets,
} from "../state/asset-summary";
import type { AssetFilter } from "../state/asset-summary";
import type { ChartItem } from "../state/asset-summary";

function mask(text: string): string {
  if (!text) return "";
  if (text.length <= 2) return "***";
  return text[0] + "***" + text[text.length - 1];
}

function assetOwnerLabel(asset: Asset): string {
  if (asset.type === "insurance") return asset.insuredPerson || "未填写被保人";
  return asset.accountOwner || "未填写所有人";
}

function chartGradient(items: ChartItem[], total: number): string {
  if (total <= 0) return "conic-gradient(var(--stone-200) 0% 100%)";
  let cursor = 0;
  return `conic-gradient(${items.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${item.color} ${start.toFixed(4)}% ${cursor.toFixed(4)}%`;
  }).join(", ")})`;
}

function OverviewChart({
  title,
  subtitle,
  ariaLabel,
  items,
  privacyMode,
}: {
  title: string;
  subtitle: string;
  ariaLabel: string;
  items: ChartItem[];
  privacyMode: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const gradient = chartGradient(items, total);

  return (
    <div className="asset-overview">
      <div className="asset-overview-copy">
        <div className="asset-overview-title">{title}</div>
        <div className="asset-overview-subtitle">{subtitle}</div>
      </div>
      <div className="asset-overview-body">
        <div
          className={`asset-pie${privacyMode ? " asset-pie--private" : ""}`}
          style={{ background: gradient }}
          aria-label={ariaLabel}
        >
          <div className="asset-pie-center">
            <span>合计</span>
            <strong>{privacyMode ? "¥***" : formatCny(total)}</strong>
          </div>
        </div>
        <div className="asset-overview-legend">
          {items.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div className="asset-overview-row" key={item.key}>
                <span className="asset-overview-dot" style={{ background: item.color }} />
                <div className="asset-overview-row-main">
                  <div className="asset-overview-row-top">
                    <span>{item.label}</span>
                    <strong>
                      {privacyMode ? `¥*** · ${percent.toFixed(1)}%` : `${formatCny(item.value)} · ${percent.toFixed(1)}%`}
                    </strong>
                  </div>
                  <div className="asset-overview-row-desc">{item.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AssetOverview({
  assets,
  privacyMode,
}: {
  assets: Asset[];
  privacyMode: boolean;
}) {
  const summary = summarizeAssets(assets);

  return (
    <div className="asset-overview-grid">
      <OverviewChart
        title="资产分布概览"
        subtitle="只统计股票账户现金、银行存款、股票和不动产；欠款只提醒，不进入总额。"
        ariaLabel="资产分布饼图"
        items={summary.allocationItems}
        privacyMode={privacyMode}
      />
      <OverviewChart
        title="中美资产分布"
        subtitle="美股和港股账户归海外资产，其他资产归中国资产。"
        ariaLabel="中美资产分布饼图"
        items={summary.regionItems}
        privacyMode={privacyMode}
      />
      <OverviewChart
        title="股票账户来源拆分"
        subtitle="区分公司授予股票/现金与自购股票，基金不纳入这张来源图。"
        ariaLabel="股票账户来源拆分饼图"
        items={summary.stockSourceItems}
        privacyMode={privacyMode}
      />
    </div>
  );
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
  const owner = assetOwnerLabel(asset);

  return (
    <div className="card collapsed-card">
      <div className="collapsed-row">
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="collapsed-type">
          {ASSET_TYPE_LABELS[asset.type]}
        </span>
        <span className="collapsed-name">
          {asset.institution || "未选择机构"}
        </span>
        <span className="collapsed-acct">
          {asset.accountNumber ? (privacyMode ? mask(asset.accountNumber) : asset.accountNumber) : "—"}
        </span>
        <span className="collapsed-owner" title={owner}>
          {owner}
        </span>
        <span className="collapsed-value">
          {privacyMode ? "***" : value}
        </span>
        <span className="collapsed-actions">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>
            编辑
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>
            删除
          </button>
        </span>
      </div>
    </div>
  );
}

export function AssetEditor() {
  const { doc, dispatch, privacyMode } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<AssetFilter>("all");
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
    if (target.closest(".card, .asset-tabs")) return;
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
    setActiveFilter((current) => current === "all" ? current : filterForAsset(newType));
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
    dispatch({ type: "ADD_ASSET", assetType: defaultTypeForFilter(activeFilter) });
  };

  const summary = summarizeAssets(doc.assets);
  const totalFormatted = summary.totalCny !== 0
    ? `${summary.totalCny < 0 ? "-" : ""}¥${Math.abs(Math.round(summary.totalCny)).toLocaleString()}`
    : "";
  const filterCounts = ASSET_FILTERS.reduce<Record<AssetFilter, number>>((acc, filter) => {
    acc[filter.id] = filter.id === "all"
      ? doc.assets.length
      : doc.assets.filter((asset) => filterForAsset(asset.type) === filter.id).length;
    return acc;
  }, {
    all: 0,
    stock: 0,
    insurance: 0,
    bank_deposit: 0,
    real_estate: 0,
    debt: 0,
    other: 0,
  });
  const visibleAssets = activeFilter === "all"
    ? doc.assets
    : doc.assets.filter((asset) => filterForAsset(asset.type) === activeFilter);
  const currentFilterLabel = ASSET_FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "资产";

  return (
    <section className="section" id="chapter-assets" ref={sectionRef} onClick={handleSectionClick}>
      <div className="section-header">
        <span className="section-badge">资产清单</span>
        {totalFormatted && (
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "var(--stone-800)", fontFamily: "var(--font-mono)" }} title="只统计股票账户现金、银行存款、股票和不动产">
            总计 {privacyMode ? "¥***" : totalFormatted}
            {summary.hasInsurance && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone-400)", marginLeft: 6, fontFamily: "var(--font-sans)" }}>不含保单</span>}
            {summary.hasDebt && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone-400)", marginLeft: 6, fontFamily: "var(--font-sans)" }}>欠款仅提醒</span>}
          </span>
        )}
      </div>
      <div className="section-body">
        <AssetOverview assets={doc.assets} privacyMode={privacyMode} />

        <div className="asset-tabs" role="tablist" aria-label="资产类型筛选">
          {ASSET_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.id}
              className={`asset-tab${activeFilter === filter.id ? " asset-tab--active" : ""}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span>{filter.label}</span>
              <span className="asset-tab-count">{filterCounts[filter.id]}</span>
            </button>
          ))}
        </div>

        {visibleAssets.length === 0 && (
          <div className="asset-empty-state">
            暂无{activeFilter === "all" ? "资产" : currentFilterLabel}
          </div>
        )}

        {visibleAssets.length > 0 && (
          <div className="asset-list-header" aria-hidden="true">
            <span>序号</span>
            <span>类型</span>
            <span>机构</span>
            <span>账号</span>
            <span>所有人</span>
            <span>估值</span>
            <span>操作</span>
          </div>
        )}

        {visibleAssets.map((asset, i) => {
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
          const isDebt = asset.type === "debt";
          const isStock = isStockAccount(asset.type);

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

              {asset.type !== "insurance" && (
                <div className="field-group full">
                  <div className="field">
                    <label className="field-label">账户所有人</label>
                    <input
                      className="field-input"
                      placeholder="例：张伟 / 张明 / 夫妻共同"
                      value={asset.accountOwner}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountOwner: e.target.value } })
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
                      <label className="field-label">被保人</label>
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
                      <label className="field-label">登录用户名</label>
                      <input
                        className="field-input"
                        placeholder="网银用户名（可选）"
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
                    <div className="field">
                      <label className="field-label">存款类型</label>
                      <input
                        className="field-input"
                        placeholder="例：定期存款、活期、大额存单"
                        value={asset.assetDetail}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { assetDetail: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">{isDebt ? "合同/贷款编号" : "账户号码"}</label>
                      <input
                        className="field-input"
                        placeholder={isDebt ? "借款合同号 / 贷款账号" : "账户编号"}
                        value={asset.accountNumber}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountNumber: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{isDebt ? "欠款余额" : isStock ? "账户总估值" : "估值"}</label>
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
                          placeholder={isDebt ? "剩余未还金额" : isStock ? "股票账户总金额" : "金额"}
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
                  <div className="field-group full">
                    <div className="field">
                      <label className="field-label">{isDebt ? "欠款说明" : "资产说明"}</label>
                      <input
                        className="field-input"
                        placeholder={isDebt ? "例：房贷尾款、亲友借款" : "例：纳指ETF基金、定期存款、自住房"}
                        value={asset.assetDetail}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { assetDetail: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                  </div>
                  {isStock && (
                    <>
                      <div className="field-group">
                        <div className="field">
                          <label className="field-label">账户现金</label>
                          <input
                            className="field-input"
                            placeholder="股票账户内现金余额"
                            value={asset.cashValue}
                            onChange={(e) =>
                              dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { cashValue: e.target.value } })
                            }
                            autoComplete="off"
                            data-lpignore="true"
                          />
                        </div>
                        <div className="field">
                          <label className="field-label">公司授予股票</label>
                          <input
                            className="field-input"
                            placeholder={`按${CURRENCY_LABELS[asset.currency]}填写`}
                            value={asset.companyGrantedStockValue}
                            onChange={(e) =>
                              dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { companyGrantedStockValue: e.target.value } })
                            }
                            autoComplete="off"
                            data-lpignore="true"
                          />
                        </div>
                      </div>
                      <div className="field-group">
                        <div className="field">
                          <label className="field-label">公司授予现金</label>
                          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                            <select
                              className="field-input"
                              style={{ width: 80 }}
                              value={asset.companyGrantedCashCurrency}
                              onChange={(e) =>
                                dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { companyGrantedCashCurrency: e.target.value as Currency } })
                              }
                            >
                              {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <input
                              className="field-input"
                              style={{ flex: 1 }}
                              placeholder="授予股票相关现金"
                              value={asset.companyGrantedCashValue}
                              onChange={(e) =>
                                dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { companyGrantedCashValue: e.target.value } })
                              }
                              autoComplete="off"
                              data-lpignore="true"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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
          + 添加{activeFilter === "all" ? "资产" : currentFilterLabel}
        </button>
      </div>
    </section>
  );
}
