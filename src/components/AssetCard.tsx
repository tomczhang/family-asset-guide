import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { AssetType, Currency, Asset } from "../state/types";
import { getInstitutionsByType, getInstitutionById, getDefaultInstitutionId } from "../data/institutions";
import {
  ASSET_FILTER_IDS,
  assetFilterLabel,
  defaultTypeForFilter,
  filterForAsset,
  formatCny,
  isStockAccount,
  summarizeAssets,
} from "../state/asset-summary";
import type { AssetFilter } from "../state/asset-summary";
import type { ChartItem } from "../state/asset-summary";
import type { Locale } from "../i18n/locale";
import { t, assetTypeLabel, currencyLabel, assetTypeEntries, currencyEntries } from "../i18n";

function mask(text: string): string {
  if (!text) return "";
  if (text.length <= 2) return "***";
  return text[0] + "***" + text[text.length - 1];
}

function assetOwnerLabel(asset: Asset, locale: Locale): string {
  if (asset.type === "insurance") return asset.insuredPerson || t(locale, "asset.notFilledInsured");
  return asset.accountOwner || t(locale, "asset.notFilledOwner");
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
  totalLabel,
  items,
  privacyMode,
}: {
  title: string;
  subtitle: string;
  ariaLabel: string;
  totalLabel: string;
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
            <span>{totalLabel}</span>
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
  locale,
}: {
  assets: Asset[];
  privacyMode: boolean;
  locale: Locale;
}) {
  const summary = summarizeAssets(assets, locale);
  const totalLabel = t(locale, "asset.chartTotal");

  return (
    <div className="asset-overview-grid">
      <OverviewChart
        title={t(locale, "asset.overview1Title")}
        subtitle={t(locale, "asset.overview1Subtitle")}
        ariaLabel={t(locale, "asset.overview1Aria")}
        totalLabel={totalLabel}
        items={summary.allocationItems}
        privacyMode={privacyMode}
      />
      <OverviewChart
        title={t(locale, "asset.overview2Title")}
        subtitle={t(locale, "asset.overview2Subtitle")}
        ariaLabel={t(locale, "asset.overview2Aria")}
        totalLabel={totalLabel}
        items={summary.regionItems}
        privacyMode={privacyMode}
      />
      <OverviewChart
        title={t(locale, "asset.overview3Title")}
        subtitle={t(locale, "asset.overview3Subtitle")}
        ariaLabel={t(locale, "asset.overview3Aria")}
        totalLabel={totalLabel}
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
  locale,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  index: number;
  privacyMode: boolean;
  locale: Locale;
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
  const owner = assetOwnerLabel(asset, locale);

  return (
    <div className="card collapsed-card">
      <div className="collapsed-row">
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="collapsed-type">
          {assetTypeLabel(locale, asset.type)}
        </span>
        <span className="collapsed-name">
          {asset.institution || t(locale, "asset.noInstitution")}
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
            {t(locale, "common.edit")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>
            {t(locale, "common.delete")}
          </button>
        </span>
      </div>
    </div>
  );
}

export function AssetEditor() {
  const { doc, dispatch, privacyMode, locale } = useAppState();
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
    const defaultInstId = getDefaultInstitutionId(newType, locale);
    const inst = defaultInstId ? getInstitutionById(defaultInstId, locale) : undefined;
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
    const inst = getInstitutionById(institutionId, locale);
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

  const summary = summarizeAssets(doc.assets, locale);
  const totalFormatted = summary.totalCny !== 0
    ? `${summary.totalCny < 0 ? "-" : ""}¥${Math.abs(Math.round(summary.totalCny)).toLocaleString()}`
    : "";
  const filterCounts = ASSET_FILTER_IDS.reduce<Record<AssetFilter, number>>((acc, id) => {
    acc[id] = id === "all"
      ? doc.assets.length
      : doc.assets.filter((asset) => filterForAsset(asset.type) === id).length;
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
  const currentFilterLabel = activeFilter === "all"
    ? t(locale, "asset.fallbackName")
    : assetFilterLabel(activeFilter, locale);

  return (
    <section className="section" id="chapter-assets" ref={sectionRef} onClick={handleSectionClick}>
      <div className="section-header">
        <span className="section-badge">{t(locale, "asset.badge")}</span>
        {totalFormatted && (
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "var(--stone-800)", fontFamily: "var(--font-mono)" }} title={t(locale, "asset.totalTitle")}>
            {t(locale, "asset.total")} {privacyMode ? "¥***" : totalFormatted}
            {summary.hasInsurance && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone-400)", marginLeft: 6, fontFamily: "var(--font-sans)" }}>{t(locale, "asset.excludeInsurance")}</span>}
            {summary.hasDebt && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone-400)", marginLeft: 6, fontFamily: "var(--font-sans)" }}>{t(locale, "asset.debtReminder")}</span>}
          </span>
        )}
      </div>
      <div className="section-body">
        <AssetOverview assets={doc.assets} privacyMode={privacyMode} locale={locale} />

        <div className="asset-tabs" role="tablist" aria-label={t(locale, "asset.filterAria")}>
          {ASSET_FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeFilter === id}
              className={`asset-tab${activeFilter === id ? " asset-tab--active" : ""}`}
              onClick={() => setActiveFilter(id)}
            >
              <span>{assetFilterLabel(id, locale)}</span>
              <span className="asset-tab-count">{filterCounts[id]}</span>
            </button>
          ))}
        </div>

        {visibleAssets.length === 0 && (
          <div className="asset-empty-state">
            {t(locale, "asset.emptyPrefix")}{activeFilter === "all" ? t(locale, "asset.fallbackName") : currentFilterLabel}
          </div>
        )}

        {visibleAssets.length > 0 && (
          <div className="asset-list-header" aria-hidden="true">
            <span>{t(locale, "asset.listSeq")}</span>
            <span>{t(locale, "asset.listType")}</span>
            <span>{t(locale, "asset.listInstitution")}</span>
            <span>{t(locale, "asset.listAccount")}</span>
            <span>{t(locale, "asset.listOwner")}</span>
            <span>{t(locale, "asset.listValue")}</span>
            <span>{t(locale, "asset.listActions")}</span>
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
                locale={locale}
                onEdit={() => setExpandedId(asset.id)}
                onDelete={() => dispatch({ type: "REMOVE_ASSET", id: asset.id })}
              />
            );
          }

          const institutions = getInstitutionsByType(asset.type, locale);
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
                    {t(locale, "common.collapse")}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => dispatch({ type: "REMOVE_ASSET", id: asset.id })}
                  >
                    {t(locale, "common.delete")}
                  </button>
                </div>
              </div>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">{t(locale, "asset.fType")}</label>
                  <select
                    className="field-input"
                    value={asset.type}
                    onChange={(e) => handleTypeChange(asset.id, e.target.value as AssetType)}
                  >
                    {assetTypeEntries(locale).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">{t(locale, "asset.fInstitution")}</label>
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
                      <option value="">{t(locale, "asset.instOther")}</option>
                    </select>
                  ) : (
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fInstitutionNamePlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fInstitutionName")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fInstitutionNamePlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fLoginUrl")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fLoginUrlPlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fContactPhone")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fContactPhonePlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fAppDownload")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fAppDownloadPlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fAccountOwner")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fAccountOwnerPlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fUrl")}</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)", wordBreak: "break-all" }}>
                      {asset.loginUrl}
                    </span>
                  </div>
                  <div className="field">
                    <label className="field-label">{t(locale, "asset.fPhone")}</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)" }}>
                      {asset.contactPhone}
                    </span>
                  </div>
                  <div className="field">
                    <label className="field-label">{t(locale, "asset.fApp")}</label>
                    <span style={{ fontSize: 13, color: "var(--stone-600)" }}>
                      {asset.appDownload}
                    </span>
                  </div>
                </div>
              )}

              {institutions.length === 0 && (
                <div className="field-group">
                  <div className="field">
                    <label className="field-label">{t(locale, "asset.fLoginUrl")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fLoginUrlPlaceholder")}
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
                    <label className="field-label">{t(locale, "asset.fContactPhone")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fContactPhonePlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fInsuranceKind")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fInsuranceKindPlaceholder")}
                        value={asset.insuranceKind}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { insuranceKind: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{t(locale, "asset.fPolicyNumber")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fPolicyNumberPlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fClaimAmount")}</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {currencyEntries(locale).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder={t(locale, "asset.fClaimAmountPlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fInsuredPerson")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fInsuredPersonPlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fPaymentYears")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fPaymentYearsPlaceholder")}
                        value={asset.paymentYears}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { paymentYears: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{t(locale, "asset.fStillPaying")}</label>
                      <select
                        className="field-input"
                        value={asset.stillPaying ? "yes" : "no"}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { stillPaying: e.target.value === "yes" } })
                        }
                      >
                        <option value="yes">{t(locale, "asset.paying")}</option>
                        <option value="no">{t(locale, "asset.paidUp")}</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : asset.type === "bank_deposit" ? (
                <>
                  <div className="field-group">
                    <div className="field">
                      <label className="field-label">{t(locale, "asset.fLoginUsername")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fLoginUsernameBankPlaceholder")}
                        value={asset.loginUsername}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { loginUsername: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{t(locale, "asset.fBankAccount")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fBankAccountPlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fBalance")}</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {currencyEntries(locale).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder={t(locale, "asset.fAmountPlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fDepositType")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fDepositTypePlaceholder")}
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
                      <label className="field-label">{isDebt ? t(locale, "asset.fContractNumber") : t(locale, "asset.fAccountNumber")}</label>
                      <input
                        className="field-input"
                        placeholder={isDebt ? t(locale, "asset.fContractNumberPlaceholder") : t(locale, "asset.fAccountNumberPlaceholder")}
                        value={asset.accountNumber}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { accountNumber: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{isDebt ? t(locale, "asset.fDebtBalance") : isStock ? t(locale, "asset.fAccountTotalValue") : t(locale, "asset.fValue")}</label>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <select
                          className="field-input"
                          style={{ width: 80 }}
                          value={asset.currency}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { currency: e.target.value as Currency } })
                          }
                        >
                          {currencyEntries(locale).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="field-input"
                          style={{ flex: 1 }}
                          placeholder={isDebt ? t(locale, "asset.fDebtRemainingPlaceholder") : isStock ? t(locale, "asset.fStockTotalPlaceholder") : t(locale, "asset.fAmountPlaceholder")}
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
                      <label className="field-label">{isDebt ? t(locale, "asset.fDebtDetail") : t(locale, "asset.fAssetDetail")}</label>
                      <input
                        className="field-input"
                        placeholder={isDebt ? t(locale, "asset.fDebtDetailPlaceholder") : t(locale, "asset.fAssetDetailPlaceholder")}
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
                          <label className="field-label">{t(locale, "asset.fCashValue")}</label>
                          <input
                            className="field-input"
                            placeholder={t(locale, "asset.fCashValuePlaceholder")}
                            value={asset.cashValue}
                            onChange={(e) =>
                              dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { cashValue: e.target.value } })
                            }
                            autoComplete="off"
                            data-lpignore="true"
                          />
                        </div>
                        <div className="field">
                          <label className="field-label">{t(locale, "asset.fCompanyStock")}</label>
                          <input
                            className="field-input"
                            placeholder={t(locale, "asset.fCompanyStockPlaceholder", { currency: currencyLabel(locale, asset.currency) })}
                            value={asset.companyGrantedStockValue}
                            onChange={(e) =>
                              dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { companyGrantedStockValue: e.target.value } })
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
                      <label className="field-label">{t(locale, "asset.fLoginUsername")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fLoginUsernamePlaceholder")}
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
                      <label className="field-label">{t(locale, "asset.fRegisterEmail")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fRegisterEmailPlaceholder")}
                        value={asset.registerEmail}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_ASSET", id: asset.id, patch: { registerEmail: e.target.value } })
                        }
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">{t(locale, "asset.fBindPhone")}</label>
                      <input
                        className="field-input"
                        placeholder={t(locale, "asset.fBindPhonePlaceholder")}
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
                  <label className="field-label">{t(locale, "asset.fHasBeneficiary")}</label>
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
                    <option value="no">{t(locale, "asset.notDesignated")}</option>
                    <option value="yes">{t(locale, "asset.designated")}</option>
                  </select>
                </div>
                {asset.hasBeneficiary && (
                  <div className="field">
                    <label className="field-label">{t(locale, "asset.fBeneficiary")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "asset.fBeneficiaryPlaceholder")}
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
                  <label className="field-label">{t(locale, "asset.fNotes")}</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    placeholder={t(locale, "asset.fNotesPlaceholder")}
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
          {t(locale, "asset.addPrefix")}{activeFilter === "all" ? t(locale, "asset.fallbackName") : currentFilterLabel}
        </button>
      </div>
    </section>
  );
}
