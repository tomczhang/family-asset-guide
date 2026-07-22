
export type AssetType =
  | "us_stock"
  | "hk_stock"
  | "a_stock"
  | "fund"
  | "bank_deposit"
  | "insurance"
  | "real_estate"
  | "crypto"
  | "debt"
  | "other";

// 资产类型 / 货币的显示标签已按语言迁移到 src/i18n（assetTypeLabel / currencyLabel）。

export type Currency = "CNY" | "USD" | "HKD" | "GBP" | "EUR" | "JPY" | "OTHER";

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
  cashValue: string;
  companyGrantedStockValue: string;
  assetDetail: string;
  accountOwner: string;
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

export type DraftDataScope = "full" | "relative";

export interface DraftEnvelope {
  schemaVersion: number;
  exportedAt: string;
  // 旧草稿没有该字段，导入时按 full 处理以保持兼容。
  dataScope?: DraftDataScope;
  document: Document;
}

export type DraftStatus =
  | { kind: "clean" }
  | { kind: "modified" }
  | { kind: "exported"; at: number };
