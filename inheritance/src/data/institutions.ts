import type { AssetType } from "../state/types";

export interface Institution {
  id: string;
  name: string;
  website: string;
  phone: string;
  appDownload: string;
  assetTypes: AssetType[];
}

export const INSTITUTIONS: Institution[] = [
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

export const DEFAULT_INSTITUTION: Record<AssetType, string> = {
  us_stock: "ibkr",
  hk_stock: "futu",
  a_stock: "yinhe",
  bank_deposit: "cmb",
  insurance: "pingan",
  crypto: "binance",
  real_estate: "",
  other: "",
};

export function getInstitutionsByType(assetType: AssetType): Institution[] {
  return INSTITUTIONS.filter((inst) => inst.assetTypes.includes(assetType));
}

export function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find((inst) => inst.id === id);
}
