## Why

用户填写资产时，机构的网址、客服电话、APP 下载方式等信息是公开且确定的。让用户手动输入这些信息既低效又容易出错。应该根据用户选择的机构自动填充这些字段，用户只需选择机构即可。

## What Changes

- 新增机构预设数据库：包含常见券商、银行、保险公司等机构的固定信息（官网、客服电话、APP 下载链接）
- 资产录入流程改为：选择资产类型 → 选择/搜索机构 → 自动填充机构信息 → 用户只需填写账户号码、估值等个人信息
- 移除机构名称、登录网址、联系电话的手动输入（改为由预设自动填充，支持自定义覆盖）
- 新增 APP 下载方式字段

## Capabilities

### New Capabilities
- `institution-registry`: 机构预设数据注册表，包含各类金融机构的固定公开信息（名称、官网、客服电话、APP 下载链接），支持按资产类型筛选
- `asset-autofill`: 资产录入时根据所选机构自动填充固定字段，用户仅需填写个人账户信息

### Modified Capabilities

## Impact

- `inheritance/src/state/types.ts`: Asset 接口新增 institutionId 和 appDownload 字段，institution/loginUrl/contactPhone 改为可选覆盖
- `inheritance/src/components/AssetCard.tsx`: 机构选择交互改造
- `inheritance/src/data/`: 新增机构预设数据文件
- `inheritance/src/pdf/generate.ts`: PDF 输出增加 APP 下载信息
