import type { SopStage } from "../state/types";

let sopId = 0;
function sopGenId(): string {
  return `sop_${++sopId}`;
}

export function DEFAULT_SOP_STAGES(): SopStage[] {
  sopId = 0;
  return [
    {
      id: sopGenId(),
      title: "第一阶段：确认与通知",
      content: `- 获取死亡证明（至少 10 份公证副本）
- 通知律师、会计师、保险经纪人
- 联系各券商/银行客服，告知情况并冻结账户（防止未授权操作）
- 收集密封件，核对资产清单完整性`,
    },
    {
      id: sopGenId(),
      title: "第二阶段：美股资产处置（IBKR 等）",
      content: `- 联系 Interactive Brokers 遗产部门：estateinquiries@interactivebrokers.com
- 提交文件：死亡证明、遗嘱认证/法院令、继承人身份证明、W-8BEN 表格
- 注意：美国非居民遗产税起征点约 $60,000（可能因税收协定调整）
- 申请 IRS ITIN（如继承人无 SSN）
- 等待 IBKR 内部审核（通常 4-8 周），完成后资产转入继承人账户或清算`,
    },
    {
      id: sopGenId(),
      title: "第三阶段：港股资产处置",
      content: `- 联系港股券商客服（富途/长桥/盈透香港）
- 提交文件：死亡证明（需公证+海牙认证或领事认证）、遗产承办书
- 如无遗嘱，需申请香港高等法院遗产管理书（Letters of Administration）
- 注意：香港无遗产税，但需遗产承办手续
- 完成后资产转入指定继承人港股账户`,
    },
    {
      id: sopGenId(),
      title: "第四阶段：A股与境内资产处置",
      content: `- 联系国内券商营业部（需到柜台办理）
- 提交文件：死亡证明、亲属关系证明、继承权公证书
- 银行账户：逐家联系，提交公证继承材料
- 保险理赔：联系保险公司，提交死亡证明+受益人身份证明
- 注意：A股继承需所有法定继承人到场或公证放弃继承权`,
    },
    {
      id: sopGenId(),
      title: "第五阶段：税务申报与结算",
      content: `- 美国遗产税：如适用，委托美国税务律师申报 Form 706-NA
- 确认中美/中港税收协定适用条款
- 国内个人所得税：继承所得一般免税，但需保留完整凭证
- 汇总所有资产处置记录，归档保存
- 更新本备忘录，标注已完成项目`,
    },
  ];
}
