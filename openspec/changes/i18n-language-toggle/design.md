## Context

应用目前是一个纯前端、完全离线、可打包为单文件的 React + TS + Vite 工具。界面文案、机构数据库（`src/data/institutions.ts`）、演示/默认数据（`src/data/mock-data.ts`、`src/data/sop-template.ts`）、资产/货币标签（`src/state/types.ts`）以及 PDF 生成（`src/pdf/generate.ts`）全部硬编码为中文与中国大陆机构。

约束：
- 强离线、单文件、首屏体积敏感（近期多次提交都在压体积、懒加载 pdf-lib）。i18n 方案必须轻量，不引入运行时大依赖。
- 数据安全：所有数据仅在本地，切换语言不得触发任何网络请求，也不得意外丢失用户已填数据。
- 现有中文体验必须 100% 保持不变（默认语言）。

## Goals / Non-Goals

**Goals:**
- 右上角语言切换（简体中文 / English），即时生效、localStorage 持久化、桌面与移动端均可用。
- 英文模式下：全英文界面 + 美国主流机构下拉与默认机构 + 英文默认/演示数据 + 全英文 PDF。
- 中英两套默认下拉与填充数据完全隔离，互不污染。
- 既有用户数据在切换语言时保持不变。

**Non-Goals:**
- 不做第三种语言；不做按浏览器语言自动探测（默认恒为 `zh-CN`，可后续扩展）。
- 不引入 `react-i18next` 等重型 i18n 框架。
- 不翻译用户自己填写的内容（仅静态文案与默认数据本地化）。
- 不对已存草稿/PDF 做语言迁移（导入旧草稿仍按其原内容显示）。

## Decisions

### 决策 1：自研轻量 i18n，而非引入框架
采用 `src/i18n/` 下的扁平字典 + `t(locale, key)` 查找函数，键为点分命名（如 `toolbar.export`）。
- 理由：体积敏感、键数量可控（数百条）、无需复数/插值等高级特性；引入 `i18next` 会显著增加包体并与单文件打包目标相悖。
- 备选：`react-i18next`（功能强但重）、内联三元（`zh ? "中" : "EN"` 散落各处，难维护）——均否决。
- 降级：`t` 在键缺失时返回 `zh-CN` 文案或键名本身，避免空白。

### 决策 2：locale 存于全局 Context，并持久化到 localStorage
在 `AppState` 增加 `locale: Locale` 与 `setLocale`。初始值读 localStorage（键如 `fag.locale`），非法值回退 `zh-CN`。`setLocale` 同步写回 localStorage。
- 理由：与现有 `privacyMode` 等全局 UI 状态一致；组件通过 `useAppState()` 读取，改动面最小。

### 决策 3：数据源函数显式接收 locale 参数，保持纯函数
`getInstitutionsByType(type, locale)`、`getInstitutionById(id, locale)`、`createMockDocument(locale)`、`DEFAULT_SOP_STAGES(locale)`、`getDefaultInstitution(type, locale)`，以及 PDF 的 `generatePdf(doc, password, onStatus, { mode, locale })`。
- 理由：避免隐式全局可变状态导致的渲染不一致与测试困难；调用方从 context 取 locale 显式传入。
- 机构数据结构改为 `INSTITUTIONS: Record<Locale, Institution[]>`，`DEFAULT_INSTITUTION: Record<Locale, Record<AssetType, string>>`。

### 决策 4：标签由常量改为语言感知查找
`ASSET_TYPE_LABELS` / `CURRENCY_LABELS` 改为 `Record<Locale, Record<...>>`，并提供 `assetTypeLabel(type, locale)` / `currencyLabel(cur, locale)` 辅助函数。引用处统一改为传 locale。

### 决策 5：PDF 在生成时刻捕获 locale
`App.tsx` 的 `handleGenerate` 从 context 读取当前 locale 并传入 `generatePdf`。PDF 内全部静态文案改为通过 PDF 专用字典按 locale 取值。中文路径行为保持现状。

### 决策 6：切换语言不改写用户数据；机构回显带回退
切换 locale 仅影响文案、下拉选项与「新建/演示」默认值。已填资产的 `institutionId` 若在新语言分区找不到（如中文 `yinhe` 在英文库不存在），机构展示回退到资产已保存的 `institution` 名称字段，不清空、不报错。

### 决策 7：英文机构清单（实现期可微调）
- 券商：Fidelity、Charles Schwab、Vanguard、Robinhood、E*TRADE (Morgan Stanley)、Interactive Brokers（美股/港股可复用）。
- 银行：Chase (JPMorgan)、Bank of America、Wells Fargo、Citibank、Capital One。
- 保险：Northwestern Mutual、New York Life、MassMutual、Prudential、State Farm。
- 加密：Coinbase、Kraken、Binance.US。
每条含官网、美国客服电话（如 Schwab 1-800-435-4000）、App 下载方式（App Store / Google Play 搜索 …）。`appDownload` 等提示语本身也按英文撰写。

## Risks / Trade-offs

- [字典与界面脱节：散落各处的硬编码遗漏] → 实施时全量 grep 中文字符（`[一-鿿]`）扫描 `src/` 收口；为每个组件逐一替换并自检。
- [英文机构电话/官网信息过时或不准] → 标注「实现期核对」，电话取各机构官网公开客服号；用户可在表单内覆盖。
- [体积增长：新增英文字典与英文数据] → 字典为纯字符串常量，gzip 后增量很小；不引入新依赖，符合体积目标。
- [已存中文草稿在英文界面下导入后混排] → 可接受：用户数据按原样显示，仅界面为英文；属 Non-Goal。
- [locale 与 PDF 字体] → 现有 Noto Sans SC 已含拉丁字符，英文 PDF 可复用同一字体，无需额外字体下载。

## Migration Plan

- 纯前端增量改动，默认 `zh-CN` 保证旧用户零感知。无后端、无数据迁移。
- 回滚：还原相关文件即可；localStorage 中的 `fag.locale` 即便残留也会被回退逻辑安全忽略。

## Open Questions

- 英文机构的具体清单与客服电话以实现期核对为准（设计已给出候选集）。
- 语言控件的视觉形态（下拉 vs 分段按钮）留待实现期按工具栏空间决定，不影响能力规格。
