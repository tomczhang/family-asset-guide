import type { Asset, AssetType, Currency } from "./types";

export type AssetFilter = "all" | "stock" | "insurance" | "bank_deposit" | "real_estate" | "debt" | "other";

export const ASSET_FILTERS: Array<{ id: AssetFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "stock", label: "股票" },
  { id: "insurance", label: "保险" },
  { id: "bank_deposit", label: "存款" },
  { id: "real_estate", label: "不动产" },
  { id: "debt", label: "欠款" },
  { id: "other", label: "其他" },
];

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
  companyGrantedCash: number;
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

export function groupAssetsByFilter(assets: Asset[]): Array<{ id: AssetFilter; label: string; assets: Asset[] }> {
  return ASSET_FILTERS
    .filter((filter) => filter.id !== "all")
    .map((filter) => ({
      ...filter,
      assets: sortAssetsByEstimatedDesc(assets.filter((asset) => filterForAsset(asset.type) === filter.id)),
    }))
    .filter((group) => group.assets.length > 0);
}

export function toCnyFromCurrency(value: number, currency: Currency): number {
  return value * (CNY_RATES[currency] ?? 1);
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
        const grantedCash = Math.max(parseMoney(asset.companyGrantedCashValue), 0);

        acc.stockCash += toCny(asset, stockCash);
        acc.stockPosition += toCny(asset, stockPosition);
        acc.stockAccountTotal += accountTotalCny;
        acc.companyGrantedStock += toCny(asset, grantedStock);
        acc.companyGrantedCash += toCnyFromCurrency(grantedCash, asset.companyGrantedCashCurrency);
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
      companyGrantedCash: 0,
    },
  );
}

export function summarizeAssets(assets: Asset[]): AssetSummary {
  const totals = calculateAssetPool(assets);
  const totalCny = totals.stockCash + totals.bankDeposit + totals.stockPosition + totals.realEstate;
  const companyGrantedStock = Math.min(totals.companyGrantedStock, totals.stockPosition);
  const companyGrantedCash = Math.min(totals.companyGrantedCash, totals.stockCash);
  const selfPurchasedStock = Math.max(totals.stockPosition - companyGrantedStock, 0);
  const otherStockCash = Math.max(totals.stockCash - companyGrantedCash, 0);

  return {
    totals,
    totalCny,
    hasInsurance: assets.some((a) => a.type === "insurance"),
    hasDebt: assets.some((a) => a.type === "debt"),
    allocationItems: [
      { key: "stockCash", label: "股票账户现金", description: "券商账户内现金余额", value: totals.stockCash, color: "#059669" },
      { key: "bankDeposit", label: "银行存款", description: "银行账户存款余额", value: totals.bankDeposit, color: "#14b8a6" },
      { key: "stockPosition", label: "股票", description: "股票非现金部分 + 基金", value: totals.stockPosition, color: "#2563eb" },
      { key: "realEstate", label: "不动产", description: "房产等不动产估值", value: totals.realEstate, color: "#b45309" },
    ],
    regionItems: [
      { key: "overseas", label: "海外资产", description: "美股账户 + 港股账户", value: totals.overseas, color: "#4f46e5" },
      { key: "china", label: "中国资产", description: "A股、基金、存款、不动产", value: totals.china, color: "#ca8a04" },
    ],
    stockSourceItems: [
      { key: "companyGrantedStock", label: "公司授予股票", description: "已标注的公司授予股票市值", value: companyGrantedStock, color: "#7c3aed" },
      { key: "companyGrantedCash", label: "公司授予现金", description: "已标注的授予股票相关现金", value: companyGrantedCash, color: "#db2777" },
      { key: "selfPurchasedStock", label: "自购股票", description: "股票账户非现金部分扣除公司授予股票", value: selfPurchasedStock, color: "#2563eb" },
      { key: "otherStockCash", label: "其他股票账户现金", description: "股票账户现金扣除公司授予现金", value: otherStockCash, color: "#059669" },
    ],
  };
}
