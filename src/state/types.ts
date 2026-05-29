
export type AssetType =
  | "us_stock"
  | "hk_stock"
  | "a_stock"
  | "bank_deposit"
  | "insurance"
  | "real_estate"
  | "crypto"
  | "other";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  us_stock: "美股",
  hk_stock: "港股",
  a_stock: "A股",
  bank_deposit: "银行存款",
  insurance: "保险",
  real_estate: "不动产",
  crypto: "加密货币",
  other: "其他",
};

export type Currency = "CNY" | "USD" | "HKD" | "GBP" | "EUR" | "JPY" | "OTHER";

export const CURRENCY_LABELS: Record<Currency, string> = {
  CNY: "人民币",
  USD: "美元",
  HKD: "港币",
  GBP: "英镑",
  EUR: "欧元",
  JPY: "日元",
  OTHER: "其他",
};

export interface Asset {
  id: string;
  type: AssetType;
  institutionId: string;
  institution: string;
  accountNumber: string;
  registerEmail: string;
  bindPhone: string;
  loginUsername: string;
  loginUrl: string;
  contactPhone: string;
  appDownload: string;
  estimatedValue: string;
  currency: Currency;
  hasBeneficiary: boolean;
  beneficiary: string;
  notes: string;
  // Insurance-specific fields
  insuranceKind: string;
  insuredPerson: string;
  paymentYears: string;
  stillPaying: boolean;
}

export type TwoFactorMethod = "totp" | "sms" | "hardware_key" | "email" | "other";

export interface TwoFactorEntry {
  id: string;
  assetId: string;
  method: TwoFactorMethod;
  recoveryInstructions: string;
}

export interface SealedEnvelope {
  id: string;
  label: string;
  location: string;
  linkedAssetIds: string[];
  passwordHint: string;
  twoFactorMethod: TwoFactorMethod | "none";
  twoFactorRecovery: string;
  notes: string;
}

export interface AccessInfo {
  twoFactorEntries: TwoFactorEntry[];
  seals: SealedEnvelope[];
}

export interface SopStage {
  id: string;
  title: string;
  content: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface DocumentMeta {
  familyName: string;
  createdAt: string;
  updatedAt: string;
  passwordHolderHint: string;
}

export interface Document {
  meta: DocumentMeta;
  assets: Asset[];
  access: AccessInfo;
  accessRemoved: boolean;
  sopStages: SopStage[];
  sopRemoved: boolean;
  customSections: CustomSection[];
  customRemoved: boolean;
}

export interface DraftEnvelope {
  schemaVersion: number;
  exportedAt: string;
  document: Document;
}

export type DraftStatus =
  | { kind: "clean" }
  | { kind: "modified" }
  | { kind: "exported"; at: number };
