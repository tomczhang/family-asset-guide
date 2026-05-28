## Why

家庭跨境资产（美股/港股/A股/多币种银行/跨境保险）的传承备忘录目前没有合适的工具：在线工具违反"零信任+离线"原则；纸质清单更新困难。需要一个双击打开、零网络请求、生成 AES-256 加密 PDF 的本地表单生成器，让家庭成员能在 30 分钟内填出可分发的备忘录。

## What Changes

- 新增 `inheritance/` 顶层子项目（独立 npm package，React 18.3 + TypeScript 5.5 + Vite 5）
- 使用 `vite-plugin-singlefile` 打包为单文件 `inheritance/dist/index.html`
- 使用 `@cantoo/pdf-lib` + `@pdf-lib/fontkit` 实现浏览器端 AES-256 加密 PDF 生成
- 内嵌 Noto Sans SC 中文字体 subset
- 提供 4 章可编辑表单：资产清单 / 账户访问与 2FA / 五阶段 SOP / 用户自定义区
- 右侧固定目录导航面板（参照 Figma 设计，类似 changelog sidebar 样式）
- JSON 草稿导入/导出（明示未加密）
- 默认 SOP 与 2FA checklist 模板内置
- 密码 modal 默认推荐 diceware 中文词组
- CSP `connect-src 'none'` 阻断所有出站请求

## Capabilities

### New Capabilities

- `inheritance-memo-generator`: 单文件离线家庭资产传承备忘录表单生成器，含 AES-256 加密 PDF 输出、右侧目录导航、4 章表单编辑、草稿导入导出

### Modified Capabilities

无。`inheritance/` 子项目与现有仓库能力完全独立。

## Impact

**新增代码：**
- `inheritance/` 子项目：package.json / vite.config.ts / tsconfig.json / index.html / src/
- `inheritance/src/components/`：表单 UI 组件（Toolbar / Sidebar / AssetCard / BeneficiaryEditor / SopEditor / AccessEditor / SealsEditor / CustomSectionEditor / MarkdownField / PasswordModal）
- `inheritance/src/state/`：Document 状态机 + DraftEnvelope 导入导出
- `inheritance/src/pdf/`：pdf-lib 渲染 + block-flow 布局引擎
- `inheritance/src/fonts/`：Noto Sans SC subset

**新增依赖：** `@cantoo/pdf-lib`、`@pdf-lib/fontkit`、`marked`、`zxcvbn-ts`、`vite-plugin-singlefile`

**不影响：** `web/` / `api/` / `pipeline/` / `db/` 等现有代码
