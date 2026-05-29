import type { Document } from "../state/types";
import { DEFAULT_SOP_STAGES } from "./sop-template";

let mockId = 0;
function mid(): string {
  return `mock_${++mockId}`;
}

export function createMockDocument(): Document {
  mockId = 0;
  const now = new Date().toISOString();

  const ibkrId = mid();
  const futuId = mid();
  const icbcId = mid();
  const pinganId = mid();
  const cryptoId = mid();
  const houseId = mid();

  return {
    meta: {
      familyName: "张",
      createdAt: now,
      updatedAt: now,
      passwordHolderHint: "张明（配偶）/ 李律师",
    },
    assets: [
      {
        id: ibkrId,
        type: "us_stock",
        institutionId: "ibkr",
        institution: "Interactive Brokers (盈透证券)",
        accountNumber: "U8****321",
        registerEmail: "zhang****@gmail.com",
        bindPhone: "138****6789",
        loginUsername: "zhang_inv",
        loginUrl: "https://www.interactivebrokers.com",
        contactPhone: "021-60866586",
        appDownload: "App Store / Google Play 搜索 IBKR Mobile",
        estimatedValue: "320,000",
        currency: "USD",
        hasBeneficiary: true,
        beneficiary: "张明",
        notes: "主力美股账户，持有 VOO / QQQ / AAPL 等",
        insuranceKind: "",
        insuredPerson: "",
        paymentYears: "",
        stillPaying: true,
      },
      {
        id: futuId,
        type: "hk_stock",
        institutionId: "futu",
        institution: "富途牛牛 (moomoo)",
        accountNumber: "FT****5678",
        registerEmail: "zhang****@outlook.com",
        bindPhone: "138****6789",
        loginUsername: "",
        loginUrl: "https://www.futunn.com",
        contactPhone: "400-870-1818",
        appDownload: "App Store / Google Play 搜索 富途牛牛",
        estimatedValue: "85,000",
        currency: "HKD",
        hasBeneficiary: false,
        beneficiary: "",
        notes: "港股打新 + 腾讯长持仓",
        insuranceKind: "",
        insuredPerson: "",
        paymentYears: "",
        stillPaying: true,
      },
      {
        id: icbcId,
        type: "bank_deposit",
        institutionId: "icbc",
        institution: "中国工商银行",
        accountNumber: "6222 02** **** 1234",
        registerEmail: "",
        bindPhone: "138****6789",
        loginUsername: "",
        loginUrl: "https://www.icbc.com.cn",
        contactPhone: "95588",
        appDownload: "App Store 搜索 中国工商银行",
        estimatedValue: "500,000",
        currency: "CNY",
        hasBeneficiary: false,
        beneficiary: "",
        notes: "工资卡 + 家庭应急备用金",
        insuranceKind: "",
        insuredPerson: "",
        paymentYears: "",
        stillPaying: true,
      },
      {
        id: pinganId,
        type: "insurance",
        institutionId: "pingan",
        institution: "中国平安人寿",
        accountNumber: "PA-2019-****-8899",
        registerEmail: "",
        bindPhone: "138****6789",
        loginUsername: "",
        loginUrl: "https://www.pingan.com",
        contactPhone: "95511",
        appDownload: "App Store 搜索 平安金管家",
        estimatedValue: "1,000,000",
        currency: "CNY",
        hasBeneficiary: true,
        beneficiary: "张明（配偶）、张小宝（子女）",
        notes: "含重疾 + 身故保障，年缴保费 28,000",
        insuranceKind: "终身寿险 + 重疾险",
        insuredPerson: "张伟（本人）",
        paymentYears: "20年",
        stillPaying: true,
      },
      {
        id: cryptoId,
        type: "crypto",
        institutionId: "",
        institution: "Ledger 硬件钱包",
        accountNumber: "0x7a3b****...d92f",
        registerEmail: "",
        bindPhone: "",
        loginUsername: "",
        loginUrl: "https://www.ledger.com",
        contactPhone: "",
        appDownload: "App Store 搜索 Ledger Live",
        estimatedValue: "2.5 BTC + 15 ETH",
        currency: "USD",
        hasBeneficiary: false,
        beneficiary: "",
        notes: "助记词在密封件 B 中，切勿联网输入",
        insuranceKind: "",
        insuredPerson: "",
        paymentYears: "",
        stillPaying: true,
      },
      {
        id: houseId,
        type: "real_estate",
        institutionId: "",
        institution: "上海市浦东新区",
        accountNumber: "沪房地浦字 2018 第 ****号",
        registerEmail: "",
        bindPhone: "",
        loginUsername: "",
        loginUrl: "",
        contactPhone: "",
        appDownload: "",
        estimatedValue: "6,800,000",
        currency: "CNY",
        hasBeneficiary: false,
        beneficiary: "",
        notes: "产证在家中保险柜，贷款已还清",
        insuranceKind: "",
        insuredPerson: "",
        paymentYears: "",
        stillPaying: true,
      },
    ],
    access: {
      twoFactorEntries: [],
      seals: [
        {
          id: mid(),
          label: "密封件 A — 金融账户密码",
          location: "家中保险柜第二层（密码见遗嘱附件）",
          linkedAssetIds: [ibkrId, futuId, icbcId],
          passwordHint: "包含各券商、银行的登录密码和交易密码",
          twoFactorMethod: "totp",
          twoFactorRecovery: "Google Authenticator 恢复码在密封件内最后一页",
          notes: "",
        },
        {
          id: mid(),
          label: "密封件 B — 加密货币助记词",
          location: "银行保管箱（招商银行浦东支行）",
          linkedAssetIds: [cryptoId],
          passwordHint: "24 词助记词 + Ledger PIN 码",
          twoFactorMethod: "hardware_key",
          twoFactorRecovery: "Ledger 设备在家中书房抽屉",
          notes: "重要：助记词绝对不要拍照或联网输入",
        },
        {
          id: mid(),
          label: "密封件 C — 保险保单",
          location: "1Password 家庭共享保险库",
          linkedAssetIds: [pinganId],
          passwordHint: "1Password 主密码见遗嘱附件",
          twoFactorMethod: "email",
          twoFactorRecovery: "恢复邮箱：zhang****@gmail.com",
          notes: "",
        },
      ],
    },
    accessRemoved: false,
    sopStages: DEFAULT_SOP_STAGES(),
    sopRemoved: false,
    customSections: [
      {
        id: mid(),
        title: "律师与会计师联系方式",
        content: `律师：李大明律师（上海锦天城律师事务所）
电话：021-6105****
邮箱：li****@allbright.com
擅长：跨境继承、遗产规划

会计师：王小芳 CPA（普华永道）
电话：021-2323****
邮箱：wang****@pwc.com
负责：每年个税申报、海外资产申报`,
      },
      {
        id: mid(),
        title: "重要提醒",
        content: `- 本手册建议每半年更新一次，确保信息准确
- 如有重大资产变动（买卖房产、开设新账户等），请及时更新
- 密封件密码仅限配偶和指定律师知晓
- 建议将本手册加密 PDF 存储在至少两个安全位置`,
      },
    ],
    customRemoved: false,
  };
}
