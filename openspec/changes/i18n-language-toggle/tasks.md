## 1. i18n 基础设施

- [x] 1.1 在 `src/state/types.ts`（或新建 `src/i18n/locale.ts`）定义 `Locale = "zh-CN" | "en"`，导出 `SUPPORTED_LOCALES` 与 `DEFAULT_LOCALE`
- [x] 1.2 新建 `src/i18n/dictionaries.ts`：建立 `zh-CN` 与 `en` 两套扁平键字典（界面文案），键采用点分命名
- [x] 1.3 新建 `src/i18n/index.ts`：实现 `t(locale, key, fallbackArgs?)`，键缺失时回退 `zh-CN` 文案或键名
- [x] 1.4 在 `src/state/context.tsx` 的 `AppState` 增加 `locale` 与 `setLocale`；初始值从 localStorage（`fag.locale`）读取并校验，非法回退 `DEFAULT_LOCALE`；`setLocale` 写回 localStorage

## 2. 语言切换控件

- [x] 2.1 在 `src/components/Toolbar.tsx` 桌面端右上角新增语言切换控件，显示当前语言并可切换
- [x] 2.2 在 Toolbar 移动端菜单中加入语言切换入口
- [x] 2.3 切换后验证界面即时重渲染、刷新后保持选择

## 3. 标签与类型本地化

- [x] 3.1 将 `ASSET_TYPE_LABELS`、`CURRENCY_LABELS` 改为 `Record<Locale, ...>`，新增 `assetTypeLabel(type, locale)` / `currencyLabel(cur, locale)`
- [x] 3.2 更新所有引用处（组件与 PDF）改为按 locale 取标签

## 4. 机构注册表按语言分区

- [x] 4.1 将 `src/data/institutions.ts` 的 `INSTITUTIONS` 改为 `Record<Locale, Institution[]>`，保留现有中文列表为 `zh-CN`
- [x] 4.2 新增 `en` 分区：美国主流券商、银行、保险、加密机构（名称、官网、客服电话、App 下载方式均为英文）
- [x] 4.3 将 `DEFAULT_INSTITUTION` 改为 `Record<Locale, Record<AssetType, string>>`，补齐英文默认机构
- [x] 4.4 `getInstitutionsByType(type, locale)`、`getInstitutionById(id, locale)`、`getDefaultInstitution(type, locale)` 改为接收 locale 参数

## 5. 默认/演示数据本地化

- [x] 5.1 `createMockDocument(locale)`：抽出英文版演示数据（家庭名、各资产、密封件、自定义区等全英文，机构 id 取英文分区）
- [x] 5.2 `DEFAULT_SOP_STAGES(locale)`：新增英文版 SOP/紧急流程（美国语境：美国券商、IRS、美国遗产税等）
- [x] 5.3 新建资产/密封件/SOP/自定义区的默认填充内容按 locale 选择对应语言数据源
- [x] 5.4 校验：切换语言后点击「导入演示数据」载入对应语言的完整数据

## 6. 组件文案接入 i18n

- [x] 6.1 `src/App.tsx`：标题、副标题、安全特性警示、空状态引导、微信提示、各处文案接入 `t`
- [x] 6.2 `Toolbar.tsx`：logo、状态、按钮、导出/导入/清空弹窗文案
- [x] 6.3 `AssetCard.tsx`：资产编辑器标题、字段标签、占位符、按钮
- [x] 6.4 `AccessEditor.tsx`：密码指引/密封件相关文案
- [x] 6.5 `SopEditor.tsx` 与 `CustomSectionEditor.tsx`：标题与文案
- [x] 6.6 `MobileStepperBar.tsx`、`MobileTocOverlay.tsx`、`TableOfContents.tsx`：步骤名、目录、按钮
- [x] 6.7 `PasswordModal.tsx`、`ConfirmDialog.tsx`：弹窗与按钮文案
- [x] 6.8 字体下载进度提示（App.tsx 的 `font-hint`）三种状态文案本地化

## 7. PDF 生成本地化

- [x] 7.1 在 `src/pdf/generate.ts` 建立 PDF 专用静态文案字典（版本名、章节标题、表头、字段标签、提示语）
- [x] 7.2 `generatePdf` 选项新增 `locale`，`App.tsx` 的 `handleGenerate` 从 context 传入
- [x] 7.3 替换 PDF 内所有硬编码中文为按 locale 取值；资产类型/货币标签按 locale
- [x] 7.4 草稿导出文件名按 locale 本地化（`exportDraft`）
- [x] 7.5 校验：英文模式生成的 PDF 全英文，中文模式 PDF 与变更前一致

## 8. 收口与验证

- [x] 8.1 全量 grep `src/` 中文字符（`[一-鿿]`），确认英文路径无硬编码中文残留（用户数据除外）
- [x] 8.2 切换语言时确认已填用户数据不丢失、机构回退正常（中文 id 在英文库缺失时回退展示名称）
- [x] 8.3 `npm run typecheck` 通过
- [x] 8.4 `npm run build` 通过，确认体积无异常增长
- [x] 8.5 桌面与移动端手动回归：中英切换、演示数据、PDF 生成、草稿导入导出
