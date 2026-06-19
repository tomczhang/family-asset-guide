import type { AssetType } from "../state/types";
import type { Locale } from "../i18n/locale";
import { getActiveLocale } from "../i18n/locale";

export interface Institution {
  id: string;
  name: string;
  website: string;
  phone: string;
  appDownload: string;
  assetTypes: AssetType[];
}

// 中文分区：中国大陆主流机构。
const ZH_INSTITUTIONS: Institution[] = [
  // ===== 美股券商 =====
  {
    id: "ibkr",
    name: "Interactive Brokers (盈透证券)",
    website: "https://www.interactivebrokers.com",
    phone: "021-60866586",
    appDownload: "App Store / Google Play 搜索 IBKR Mobile",
    assetTypes: ["us_stock", "hk_stock"],
  },
  {
    id: "schwab",
    name: "Charles Schwab (嘉信理财)",
    website: "https://www.schwab.com",
    phone: "400-120-6217",
    appDownload: "App Store / Google Play 搜索 Schwab Mobile",
    assetTypes: ["us_stock"],
  },
  {
    id: "futu",
    name: "富途牛牛 (moomoo)",
    website: "https://www.futunn.com",
    phone: "400-870-1818",
    appDownload: "App Store / Google Play 搜索 富途牛牛 或 moomoo",
    assetTypes: ["us_stock", "hk_stock"],
  },
  {
    id: "tiger",
    name: "老虎证券 (Tiger Brokers)",
    website: "https://www.itigerup.com",
    phone: "400-603-7555",
    appDownload: "App Store / Google Play 搜索 Tiger Trade",
    assetTypes: ["us_stock", "hk_stock"],
  },
  {
    id: "longbridge",
    name: "长桥证券 (Longbridge)",
    website: "https://longbridge.com",
    phone: "400-882-1218",
    appDownload: "App Store / Google Play 搜索 Longbridge",
    assetTypes: ["us_stock", "hk_stock"],
  },
  {
    id: "fosunhani",
    name: "复星恒利证券",
    website: "https://www.fosunhanisecurities.com",
    phone: "400-185-1088",
    appDownload: "App Store 搜索 复星恒利",
    assetTypes: ["us_stock", "hk_stock"],
  },
  // ===== A股券商 =====
  {
    id: "yinhe",
    name: "银河证券",
    website: "https://www.chinastock.com.cn",
    phone: "95551",
    appDownload: "App Store / 各应用商店搜索 中国银河证券",
    assetTypes: ["a_stock"],
  },
  {
    id: "htsc",
    name: "华泰证券",
    website: "https://www.htsc.com.cn",
    phone: "95597",
    appDownload: "App Store / 各应用商店搜索 涨乐财付通",
    assetTypes: ["a_stock"],
  },
  {
    id: "citics",
    name: "中信证券",
    website: "https://www.citics.com",
    phone: "95548",
    appDownload: "App Store / 各应用商店搜索 中信证券",
    assetTypes: ["a_stock"],
  },
  {
    id: "cmschina",
    name: "招商证券",
    website: "https://www.newone.com.cn",
    phone: "95565",
    appDownload: "App Store / 各应用商店搜索 招商证券",
    assetTypes: ["a_stock"],
  },
  {
    id: "gtht",
    name: "国泰海通证券",
    website: "https://www.gtht.com",
    phone: "95521",
    appDownload: "App Store / 各应用商店搜索 国泰君安君弘",
    assetTypes: ["a_stock"],
  },
  {
    id: "eastmoney",
    name: "东方财富证券",
    website: "https://www.eastmoney.com",
    phone: "95357",
    appDownload: "App Store / 各应用商店搜索 东方财富",
    assetTypes: ["a_stock"],
  },
  {
    id: "cicc",
    name: "中金财富",
    website: "https://www.ciccwm.com",
    phone: "95532",
    appDownload: "App Store / 各应用商店搜索 中金财富",
    assetTypes: ["a_stock"],
  },
  // ===== 银行 =====
  {
    id: "cmb",
    name: "招商银行",
    website: "https://www.cmbchina.com",
    phone: "95555",
    appDownload: "App Store / 各应用商店搜索 招商银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "icbc",
    name: "工商银行",
    website: "https://www.icbc.com.cn",
    phone: "95588",
    appDownload: "App Store / 各应用商店搜索 中国工商银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "ccb",
    name: "建设银行",
    website: "https://www.ccb.com",
    phone: "95533",
    appDownload: "App Store / 各应用商店搜索 中国建设银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "boc",
    name: "中国银行",
    website: "https://www.boc.cn",
    phone: "95566",
    appDownload: "App Store / 各应用商店搜索 中国银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "abc",
    name: "农业银行",
    website: "https://www.abchina.com",
    phone: "95599",
    appDownload: "App Store / 各应用商店搜索 中国农业银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "bocom",
    name: "交通银行",
    website: "https://www.bankcomm.com",
    phone: "95559",
    appDownload: "App Store / 各应用商店搜索 交通银行",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "hsbc",
    name: "汇丰银行 (HSBC)",
    website: "https://www.hsbc.com.cn",
    phone: "95366",
    appDownload: "App Store / Google Play 搜索 HSBC China",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "citi",
    name: "花旗银行 (Citibank)",
    website: "https://www.citibank.com.cn",
    phone: "400-821-1880",
    appDownload: "App Store / Google Play 搜索 Citibank",
    assetTypes: ["bank_deposit"],
  },
  // ===== 保险 =====
  {
    id: "pingan",
    name: "中国平安",
    website: "https://www.pingan.com",
    phone: "95511",
    appDownload: "App Store / 各应用商店搜索 平安金管家",
    assetTypes: ["insurance"],
  },
  {
    id: "chinalife",
    name: "中国人寿",
    website: "https://www.chinalife.com.cn",
    phone: "95519",
    appDownload: "App Store / 各应用商店搜索 中国人寿寿险",
    assetTypes: ["insurance"],
  },
  {
    id: "aia",
    name: "友邦保险 (AIA)",
    website: "https://www.aia.com.cn",
    phone: "400-820-3588",
    appDownload: "App Store / Google Play 搜索 AIA Connect",
    assetTypes: ["insurance"],
  },
  {
    id: "prudential",
    name: "保诚 (Prudential)",
    website: "https://www.prudential.com.hk",
    phone: "400-920-6012",
    appDownload: "App Store / Google Play 搜索 myPrudential",
    assetTypes: ["insurance"],
  },
  {
    id: "huagui",
    name: "华贵人寿",
    website: "https://www.huaguilife.com",
    phone: "400-900-0351",
    appDownload: "关注微信公众号「华贵保险」在线服务",
    assetTypes: ["insurance"],
  },
  {
    id: "junlong",
    name: "君龙人寿",
    website: "https://www.dragonlife.com.cn",
    phone: "400-889-1855",
    appDownload: "关注微信公众号「君龙人寿」在线服务",
    assetTypes: ["insurance"],
  },
  {
    id: "xintai",
    name: "信泰人寿",
    website: "https://www.sinntay.com",
    phone: "400-886-5299",
    appDownload: "App Store / 各应用商店搜索 信泰保险",
    assetTypes: ["insurance"],
  },
  // ===== 加密货币 =====
  {
    id: "binance",
    name: "Binance (币安)",
    website: "https://www.binance.com",
    phone: "在线客服 www.binance.com/chat",
    appDownload: "https://www.binance.com/en/download",
    assetTypes: ["crypto"],
  },
  {
    id: "okx",
    name: "OKX (欧易)",
    website: "https://www.okx.com",
    phone: "在线客服（官网右下角）",
    appDownload: "https://www.okx.com/download",
    assetTypes: ["crypto"],
  },
  {
    id: "coinbase",
    name: "Coinbase",
    website: "https://www.coinbase.com",
    phone: "在线帮助 help.coinbase.com",
    appDownload: "App Store / Google Play 搜索 Coinbase",
    assetTypes: ["crypto"],
  },
];

// 英文分区：美国主流机构。电话为各机构官网公开客服号，可在表单内自行覆盖。
const EN_INSTITUTIONS: Institution[] = [
  // ===== Brokerages =====
  {
    id: "fidelity",
    name: "Fidelity Investments",
    website: "https://www.fidelity.com",
    phone: "1-800-343-3548",
    appDownload: "App Store / Google Play: search \"Fidelity Investments\"",
    assetTypes: ["us_stock", "fund"],
  },
  {
    id: "schwab",
    name: "Charles Schwab",
    website: "https://www.schwab.com",
    phone: "1-800-435-4000",
    appDownload: "App Store / Google Play: search \"Schwab Mobile\"",
    assetTypes: ["us_stock", "fund"],
  },
  {
    id: "vanguard",
    name: "Vanguard",
    website: "https://investor.vanguard.com",
    phone: "1-877-662-7447",
    appDownload: "App Store / Google Play: search \"Vanguard\"",
    assetTypes: ["us_stock", "fund"],
  },
  {
    id: "robinhood",
    name: "Robinhood",
    website: "https://robinhood.com",
    phone: "Request a callback in the app",
    appDownload: "App Store / Google Play: search \"Robinhood\"",
    assetTypes: ["us_stock"],
  },
  {
    id: "etrade",
    name: "E*TRADE from Morgan Stanley",
    website: "https://us.etrade.com",
    phone: "1-800-387-2331",
    appDownload: "App Store / Google Play: search \"E*TRADE\"",
    assetTypes: ["us_stock"],
  },
  {
    id: "merrill",
    name: "Merrill Edge",
    website: "https://www.merrilledge.com",
    phone: "1-877-653-4732",
    appDownload: "App Store / Google Play: search \"Merrill Edge\"",
    assetTypes: ["us_stock", "fund"],
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    website: "https://www.interactivebrokers.com",
    phone: "1-877-442-2757",
    appDownload: "App Store / Google Play: search \"IBKR\"",
    assetTypes: ["us_stock", "hk_stock"],
  },
  // ===== Banks =====
  {
    id: "chase",
    name: "Chase (JPMorgan Chase)",
    website: "https://www.chase.com",
    phone: "1-800-935-9935",
    appDownload: "App Store / Google Play: search \"Chase Mobile\"",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "bofa",
    name: "Bank of America",
    website: "https://www.bankofamerica.com",
    phone: "1-800-432-1000",
    appDownload: "App Store / Google Play: search \"Bank of America\"",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "wellsfargo",
    name: "Wells Fargo",
    website: "https://www.wellsfargo.com",
    phone: "1-800-869-3557",
    appDownload: "App Store / Google Play: search \"Wells Fargo Mobile\"",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "citi",
    name: "Citibank",
    website: "https://www.citi.com",
    phone: "1-800-374-9700",
    appDownload: "App Store / Google Play: search \"Citi Mobile\"",
    assetTypes: ["bank_deposit"],
  },
  {
    id: "capitalone",
    name: "Capital One",
    website: "https://www.capitalone.com",
    phone: "1-800-655-2265",
    appDownload: "App Store / Google Play: search \"Capital One Mobile\"",
    assetTypes: ["bank_deposit"],
  },
  // ===== Insurance =====
  {
    id: "northwestern",
    name: "Northwestern Mutual",
    website: "https://www.northwesternmutual.com",
    phone: "1-866-950-4644",
    appDownload: "App Store / Google Play: search \"Northwestern Mutual\"",
    assetTypes: ["insurance"],
  },
  {
    id: "newyorklife",
    name: "New York Life",
    website: "https://www.newyorklife.com",
    phone: "1-800-225-5695",
    appDownload: "App Store / Google Play: search \"New York Life\"",
    assetTypes: ["insurance"],
  },
  {
    id: "massmutual",
    name: "MassMutual",
    website: "https://www.massmutual.com",
    phone: "1-800-272-2216",
    appDownload: "App Store / Google Play: search \"MassMutual\"",
    assetTypes: ["insurance"],
  },
  {
    id: "prudential",
    name: "Prudential",
    website: "https://www.prudential.com",
    phone: "1-800-778-2255",
    appDownload: "App Store / Google Play: search \"Prudential\"",
    assetTypes: ["insurance"],
  },
  {
    id: "statefarm",
    name: "State Farm",
    website: "https://www.statefarm.com",
    phone: "1-800-782-8332",
    appDownload: "App Store / Google Play: search \"State Farm\"",
    assetTypes: ["insurance"],
  },
  // ===== Crypto =====
  {
    id: "coinbase",
    name: "Coinbase",
    website: "https://www.coinbase.com",
    phone: "1-888-908-7930",
    appDownload: "App Store / Google Play: search \"Coinbase\"",
    assetTypes: ["crypto"],
  },
  {
    id: "kraken",
    name: "Kraken",
    website: "https://www.kraken.com",
    phone: "Live chat at support.kraken.com",
    appDownload: "App Store / Google Play: search \"Kraken\"",
    assetTypes: ["crypto"],
  },
  {
    id: "gemini",
    name: "Gemini",
    website: "https://www.gemini.com",
    phone: "Support at support.gemini.com",
    appDownload: "App Store / Google Play: search \"Gemini\"",
    assetTypes: ["crypto"],
  },
];

const INSTITUTIONS_BY_LOCALE: Record<Locale, Institution[]> = {
  "zh-CN": ZH_INSTITUTIONS,
  en: EN_INSTITUTIONS,
};

const DEFAULT_INSTITUTION_BY_LOCALE: Record<Locale, Record<AssetType, string>> = {
  "zh-CN": {
    us_stock: "ibkr",
    hk_stock: "futu",
    a_stock: "yinhe",
    fund: "",
    bank_deposit: "cmb",
    insurance: "pingan",
    crypto: "binance",
    real_estate: "",
    debt: "",
    other: "",
  },
  en: {
    us_stock: "fidelity",
    hk_stock: "ibkr",
    a_stock: "",
    fund: "vanguard",
    bank_deposit: "chase",
    insurance: "northwestern",
    crypto: "coinbase",
    real_estate: "",
    debt: "",
    other: "",
  },
};

export function getInstitutions(locale: Locale = getActiveLocale()): Institution[] {
  return INSTITUTIONS_BY_LOCALE[locale];
}

export function getDefaultInstitutionId(
  assetType: AssetType,
  locale: Locale = getActiveLocale(),
): string {
  return DEFAULT_INSTITUTION_BY_LOCALE[locale][assetType];
}

export function getInstitutionsByType(
  assetType: AssetType,
  locale: Locale = getActiveLocale(),
): Institution[] {
  return INSTITUTIONS_BY_LOCALE[locale].filter((inst) => inst.assetTypes.includes(assetType));
}

export function getInstitutionById(
  id: string,
  locale: Locale = getActiveLocale(),
): Institution | undefined {
  return INSTITUTIONS_BY_LOCALE[locale].find((inst) => inst.id === id);
}
