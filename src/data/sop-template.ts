import type { SopStage } from "../state/types";
import type { Locale } from "../i18n/locale";
import { getActiveLocale } from "../i18n/locale";

let sopId = 0;
function sopGenId(): string {
  return `sop_${++sopId}`;
}

const ZH_STAGES: Array<{ title: string; content: string }> = [
  {
    title: "第一阶段：紧急响应（24 小时内）",
    content: `- 联系律师、会计师，启动应急流程
- 尽快开具并准备好各类必要证明材料（建议多备几份公证副本）
- 联系各券商/银行客服，告知情况并申请临时冻结账户，防止未授权操作
- 取出密封件，核对本手册中的资产清单`,
  },
  {
    title: "第二阶段：境外资产锁定（1-2 周内）",
    content: `- 联系美股券商客服
- 准备并提交所需文件：相关证明材料、继承人身份证明、W-8BEN 表格
- 联系港股券商客服（富途/长桥/盈透香港），提交经公证的证明材料
- 加密货币：确认钱包私钥/助记词是否在密封件中，转移至安全地址
- 注意：美国非居民遗产税起征点约 $60,000，如适用需申请 IRS ITIN`,
  },
  {
    title: "第三阶段：境内资产处置（2-4 周内）",
    content: `- 联系国内券商营业部（A 股继承通常需到柜台办理）
- 准备文件：相关证明、亲属关系证明、继承权公证书
- 银行账户：逐家联系，提交公证继承材料
- 保险理赔：联系保险公司，提交证明材料及受益人身份证明
- 注意：A 股继承需所有法定继承人到场或公证放弃继承权`,
  },
  {
    title: "第四阶段：资产转移与税务（1-3 个月）",
    content: `- 美国遗产税：如适用，委托美国税务律师申报 Form 706-NA
- 确认中美/中港税收协定适用条款，避免双重征税
- 国内个人所得税：继承所得一般免税，但需保留完整凭证
- 等待各机构审核完成（券商通常 4-8 周），将资产转入继承人账户或清算`,
  },
  {
    title: "第五阶段：归档与收尾（3-6 个月）",
    content: `- 汇总所有资产处置记录，归档保存
- 确认所有账户已完成过户或销户
- 更新本手册，标注已完成项目
- 保留全部往来文件至少 7 年（税务追溯期）
- 如有争议或复杂情况，及时咨询专业律师`,
  },
];

const EN_STAGES: Array<{ title: string; content: string }> = [
  {
    title: "Stage 1: Emergency Response (within 24 hours)",
    content: `- Contact the estate attorney and accountant to start the process
- Order multiple certified copies of the death certificate (keep several spares)
- Call each brokerage/bank to report the situation and request a temporary account hold to prevent unauthorized activity
- Retrieve the sealed envelopes and cross-check against the asset inventory in this guide`,
  },
  {
    title: "Stage 2: Secure Brokerage & Digital Assets (1-2 weeks)",
    content: `- Contact each brokerage's estate/inheritance department
- Prepare the required documents: certified death certificate, heir/executor ID, Letters Testamentary or small-estate affidavit
- Confirm beneficiary (TOD/POD) designations — assets with named beneficiaries transfer outside probate
- Crypto: confirm the wallet keys/seed phrase are in a sealed envelope and move funds to a secure address
- Note: retirement accounts (401(k)/IRA) have specific beneficiary and RMD rules — consult the custodian`,
  },
  {
    title: "Stage 3: Banks & Insurance (2-4 weeks)",
    content: `- Bank accounts: contact each bank; POD beneficiaries can claim directly, otherwise go through the estate
- Life insurance: file a claim with each carrier, submitting the death certificate and beneficiary ID
- Safe deposit box: arrange access per the bank's procedure (may require a court order)
- Update or freeze joint accounts and recurring auto-payments as needed`,
  },
  {
    title: "Stage 4: Probate & Taxes (1-3 months)",
    content: `- Open probate with the county court if required; the executor administers the estate
- Federal estate tax: a return (Form 706) is generally required only for very large estates (well above the federal exemption); check current thresholds
- File the decedent's final income tax return (Form 1040) and, if needed, estate income tax (Form 1041)
- Check state estate/inheritance tax rules, which vary by state`,
  },
  {
    title: "Stage 5: Closeout & Records (3-6 months)",
    content: `- Compile all asset-transfer records and archive them
- Confirm every account has been retitled, transferred, or closed
- Update this guide and mark completed items
- Keep all related documents for at least 7 years (IRS audit window)
- Consult a professional attorney for any disputes or complex situations`,
  },
];

export function DEFAULT_SOP_STAGES(locale: Locale = getActiveLocale()): SopStage[] {
  sopId = 0;
  const stages = locale === "en" ? EN_STAGES : ZH_STAGES;
  return stages.map((s) => ({ id: sopGenId(), title: s.title, content: s.content }));
}

// 判断一组 SOP 阶段是否仍是某语言的「未经编辑」默认模板（忽略 id）。
// 用于切换语言时：仅当用户没改过默认内容才把它替换为新语言的默认模板，
// 从而保留用户的自定义编辑。
export function isDefaultSopStages(stages: SopStage[], locale: Locale): boolean {
  const base = locale === "en" ? EN_STAGES : ZH_STAGES;
  if (stages.length !== base.length) return false;
  return stages.every((s, i) => s.title === base[i]!.title && s.content === base[i]!.content);
}
