import type { AssetType, Currency } from "../state/types";
import type { Locale } from "./locale";
import { DEFAULT_LOCALE } from "./locale";
import { DICTIONARIES } from "./dictionaries";

export type { Locale } from "./locale";
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  getInitialLocale,
  persistLocale,
  getActiveLocale,
  setActiveLocale,
} from "./locale";

type Dict = { [key: string]: unknown };

function lookup(dict: Dict, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in (node as Dict)) {
      node = (node as Dict)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

// 取本地化文案。键缺失时回退默认语言，仍缺失则返回键名本身，避免空白或崩溃。
// vars 用于 {name} 占位符插值。
export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let value =
    lookup(DICTIONARIES[locale] as Dict, key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE] as Dict, key) ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}

// ===== 资产类型 / 货币标签（按语言） =====

const ASSET_TYPE_LABELS: Record<Locale, Record<AssetType, string>> = {
  "zh-CN": {
    us_stock: "美股",
    hk_stock: "港股",
    a_stock: "A股",
    fund: "基金",
    bank_deposit: "银行存款",
    insurance: "保险",
    real_estate: "不动产",
    crypto: "加密货币",
    debt: "欠款",
    other: "其他",
  },
  en: {
    us_stock: "US Stocks",
    hk_stock: "HK Stocks",
    a_stock: "A-Shares",
    fund: "Funds",
    bank_deposit: "Bank Deposit",
    insurance: "Insurance",
    real_estate: "Real Estate",
    crypto: "Crypto",
    debt: "Debt",
    other: "Other",
  },
};

const CURRENCY_LABELS: Record<Locale, Record<Currency, string>> = {
  "zh-CN": {
    CNY: "人民币",
    USD: "美元",
    HKD: "港币",
    GBP: "英镑",
    EUR: "欧元",
    JPY: "日元",
    OTHER: "其他",
  },
  en: {
    CNY: "CNY",
    USD: "USD",
    HKD: "HKD",
    GBP: "GBP",
    EUR: "EUR",
    JPY: "JPY",
    OTHER: "Other",
  },
};

export function assetTypeLabel(locale: Locale, type: AssetType): string {
  return ASSET_TYPE_LABELS[locale][type];
}

export function currencyLabel(locale: Locale, currency: Currency): string {
  return CURRENCY_LABELS[locale][currency];
}

export function assetTypeEntries(locale: Locale): Array<[AssetType, string]> {
  return Object.entries(ASSET_TYPE_LABELS[locale]) as Array<[AssetType, string]>;
}

export function currencyEntries(locale: Locale): Array<[Currency, string]> {
  return Object.entries(CURRENCY_LABELS[locale]) as Array<[Currency, string]>;
}
