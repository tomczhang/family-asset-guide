import type { Asset, AssetType, Currency } from "./types";
import type { Locale } from "../i18n/locale";
import { getActiveLocale } from "../i18n/locale";
import { t } from "../i18n";

export type AssetFilter = "all" | "stock" | "insurance" | "bank_deposit" | "real_estate" | "debt" | "other";

export const ASSET_FILTER_IDS: AssetFilter[] = [
  "all",
  "stock",
  "insurance",
  "bank_deposit",
  "real_estate",
  "debt",
  "other",
];

export function assetFilterLabel(id: AssetFilter, locale: Locale = getActiveLocale()): string {
  return t(locale, `filter.${id}`);
}

export function getAssetFilters(locale: Locale = getActiveLocale()): Array<{ id: AssetFilter; label: string }> {
  return ASSET_FILTER_IDS.map((id) => ({ id, label: assetFilterLabel(id, locale) }));
}

export const CNY_RATES: Record<Currency, number> = {
  CNY: 1,
  USD: 6.78,
  HKD: 0.87,
  GBP: 8.56,
  EUR: 7.58,
  JPY: 0.048,
  OTHER: 1,
};

export interface ChartItem {
  key: string;
  label: string;
  description: string;
  value: number;
  color: string;
}

export interface AssetPoolTotals {
  stockCash: number;
  bankDeposit: number;
  stockPosition: number;
  realEstate: number;
  overseas: number;
  china: number;
  stockAccountTotal: number;
  companyGrantedStock: number;
}

export interface AssetSummary {
  totals: AssetPoolTotals;
  totalCny: number;
  hasInsurance: boolean;
  hasDebt: boolean;
  allocationItems: ChartItem[];
  regionItems: ChartItem[];
  stockSourceItems: ChartItem[];
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : 0;
}

export function formatCny(value: number): string {
  return `¥${Math.round(value).toLocaleString()}`;
}

// 亲属版用的粗粒度金额，给出量级认知但不暴露精确数字。
// 中文向下取整到 100 万（"1,500 万+"）；英文按百万取整（"$15M+"）。
export function formatCoarseCny(value: number, locale: Locale = getActiveLocale()): string {
  if (value < 1_000_000) return t(locale, "coarse.under");
  if (locale === "en") {
    const millions = Math.floor(value / 1_000_000);
    return t(locale, "coarse.wanSuffix", { n: millions.toLocaleString() });
  }
  const wan = Math.floor(value / 1_000_000) * 100;
  return t(locale, "coarse.wanSuffix", { n: wan.toLocaleString() });
}

export function isStockAccount(type: AssetType): boolean {
  return type === "us_stock" || type === "hk_stock" || type === "a_stock";
}

export function isStockLike(type: AssetType): boolean {
  return isStockAccount(type) || type === "fund";
}

export function filterForAsset(type: AssetType): AssetFilter {
  if (isStockLike(type)) return "stock";
  if (type === "insurance") return "insurance";
  if (type === "bank_deposit") return "bank_deposit";
  if (type === "real_estate") return "real_estate";
  if (type === "debt") return "debt";
  if (type === "crypto" || type === "other") return "other";
  return "all";
}

export function defaultTypeForFilter(filter: AssetFilter): AssetType {
  switch (filter) {
    case "stock":
      return "us_stock";
    case "insurance":
      return "insurance";
    case "bank_deposit":
      return "bank_deposit";
    case "real_estate":
      return "real_estate";
    case "debt":
      return "debt";
    case "other":
      return "other";
    case "all":
    default:
      return "us_stock";
  }
}

export function isOverseasAsset(type: AssetType): boolean {
  return type === "us_stock" || type === "hk_stock";
}

export function toCny(asset: Asset, value: number): number {
  return value * (CNY_RATES[asset.currency] ?? 1);
}

export function assetEstimatedCny(asset: Asset): number {
  return toCny(asset, Math.max(parseMoney(asset.estimatedValue), 0));
}

export function sortAssetsByEstimatedDesc(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => assetEstimatedCny(b) - assetEstimatedCny(a));
}

export function groupAssetsByFilter(
  assets: Asset[],
  locale: Locale = getActiveLocale(),
): Array<{ id: AssetFilter; label: string; assets: Asset[] }> {
  return ASSET_FILTER_IDS
    .filter((id) => id !== "all")
    .map((id) => ({
      id,
      label: assetFilterLabel(id, locale),
      assets: sortAssetsByEstimatedDesc(assets.filter((asset) => filterForAsset(asset.type) === id)),
    }))
    .filter((group) => group.assets.length > 0);
}

export function calculateAssetPool(assets: Asset[]): AssetPoolTotals {
  return assets.reduce<AssetPoolTotals>(
    (acc, asset) => {
      const estimated = Math.max(parseMoney(asset.estimatedValue), 0);
      const estimatedCny = toCny(asset, estimated);

      if (asset.type === "bank_deposit") {
        acc.bankDeposit += estimatedCny;
        acc.china += estimatedCny;
        return acc;
      }

      if (isStockAccount(asset.type)) {
        const stockCash = Math.min(Math.max(parseMoney(asset.cashValue), 0), estimated);
        const stockPosition = Math.max(estimated - stockCash, 0);
        const accountTotalCny = toCny(asset, estimated);
        const grantedStock = Math.max(parseMoney(asset.companyGrantedStockValue), 0);

        acc.stockCash += toCny(asset, stockCash);
        acc.stockPosition += toCny(asset, stockPosition);
        acc.stockAccountTotal += accountTotalCny;
        acc.companyGrantedStock += toCny(asset, grantedStock);
        if (isOverseasAsset(asset.type)) {
          acc.overseas += accountTotalCny;
        } else {
          acc.china += accountTotalCny;
        }
        return acc;
      }

      if (asset.type === "fund") {
        acc.stockPosition += estimatedCny;
        acc.china += estimatedCny;
        return acc;
      }

      if (asset.type === "real_estate") {
        acc.realEstate += estimatedCny;
        acc.china += estimatedCny;
      }

      return acc;
    },
    {
      stockCash: 0,
      bankDeposit: 0,
      stockPosition: 0,
      realEstate: 0,
      overseas: 0,
      china: 0,
      stockAccountTotal: 0,
      companyGrantedStock: 0,
    },
  );
}

export function summarizeAssets(assets: Asset[], locale: Locale = getActiveLocale()): AssetSummary {
  const totals = calculateAssetPool(assets);
  const totalCny = totals.stockCash + totals.bankDeposit + totals.stockPosition + totals.realEstate;
  const companyGrantedStock = Math.min(totals.companyGrantedStock, totals.stockPosition);
  const selfPurchasedStock = Math.max(totals.stockPosition - companyGrantedStock, 0);
  const ct = (key: string) => t(locale, `chart.${key}`);

  return {
    totals,
    totalCny,
    hasInsurance: assets.some((a) => a.type === "insurance"),
    hasDebt: assets.some((a) => a.type === "debt"),
    allocationItems: [
      { key: "stockCash", label: ct("stockCash"), description: ct("stockCashDesc"), value: totals.stockCash, color: "#059669" },
      { key: "bankDeposit", label: ct("bankDeposit"), description: ct("bankDepositDesc"), value: totals.bankDeposit, color: "#14b8a6" },
      { key: "stockPosition", label: ct("stockPosition"), description: ct("stockPositionDesc"), value: totals.stockPosition, color: "#2563eb" },
      { key: "realEstate", label: ct("realEstate"), description: ct("realEstateDesc"), value: totals.realEstate, color: "#b45309" },
    ],
    regionItems: [
      { key: "overseas", label: ct("overseas"), description: ct("overseasDesc"), value: totals.overseas, color: "#4f46e5" },
      { key: "china", label: ct("china"), description: ct("chinaDesc"), value: totals.china, color: "#ca8a04" },
    ],
    stockSourceItems: [
      { key: "companyGrantedStock", label: ct("companyGrantedStock"), description: ct("companyGrantedStockDesc"), value: companyGrantedStock, color: "#7c3aed" },
      { key: "selfPurchasedStock", label: ct("selfPurchasedStock"), description: ct("selfPurchasedStockDesc"), value: selfPurchasedStock, color: "#2563eb" },
      { key: "stockCash", label: ct("stockCash"), description: ct("stockCashDesc"), value: totals.stockCash, color: "#059669" },
    ],
  };
}
