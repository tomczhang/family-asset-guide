## 1. 机构预设数据

- [x] 1.1 创建 `src/data/institutions.ts`，定义 Institution 接口和数据结构（id, name, website, phone, appDownload, assetTypes）
- [x] 1.2 填充美股券商数据（盈透、嘉信、富途moomoo、老虎、长桥、复星恒利等）
- [x] 1.3 填充港股券商数据（富途、老虎、盈透、长桥、华盛通等）
- [x] 1.4 填充 A 股券商数据（华泰、中信、招商、国泰君安、东方财富、中金等）
- [x] 1.5 填充银行数据（招商、工商、建设、中国、农业、交通、HSBC、Citibank 等）
- [x] 1.6 填充保险公司数据（平安、人寿、友邦、保诚等）
- [x] 1.7 填充加密货币交易所数据（Binance、OKX、Coinbase 等）
- [x] 1.8 导出按资产类型筛选机构的工具函数

## 2. 数据模型更新

- [x] 2.1 Asset 接口新增 institutionId 和 appDownload 字段
- [x] 2.2 更新 docReducer 中 ADD_ASSET 的默认值
- [x] 2.3 确保旧草稿文件向后兼容（缺少新字段时给默认值）

## 3. UI 交互改造

- [x] 3.1 AssetCard 中将机构名称输入改为下拉选择器（按当前资产类型过滤 + "其他"选项）
- [x] 3.2 选择预设机构时自动填充 institution、loginUrl、contactPhone、appDownload
- [x] 3.3 选择"其他"时清空并显示手动输入字段
- [x] 3.4 切换资产类型时重置机构选择
- [x] 3.5 新增 APP 下载方式字段的 UI 展示

## 4. PDF 输出更新

- [x] 4.1 资产卡片中增加 APP 下载信息的输出
