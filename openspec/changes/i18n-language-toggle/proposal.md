## Why

当前应用从界面文案、机构数据库、演示/默认填充数据到导出的 PDF 全部硬编码为中文与中国大陆金融机构，无法服务英语用户与持有美国券商、银行、保险账户的家庭。需要引入语言切换，让英文用户获得「全英文界面 + 美国主流机构 + 英文默认数据 + 全英文 PDF」的完整体验，且中英两套互不污染。

## What Changes

- 右上角工具栏新增 language 切换控件，可选「简体中文」与「English」，默认简体中文；切换即时生效，刷新后记忆上次选择。
- 引入轻量 i18n 机制：所有界面静态文案（工具栏、标题、警示语、按钮、各编辑器、弹窗、移动端步进条、目录、密码弹窗、字体进度提示等）按当前语言渲染。
- 机构数据库改为按语言分区：中文版保留现有中国大陆机构；英文版替换为美国主流机构（券商、银行、保险），含对应英文名称、官网、客服电话、App 下载方式。下拉选项与各资产类型的默认机构随语言切换。
- 演示数据（mock）与新建资产/密封件/SOP/自定义区的默认填充内容按语言分区：中文有中文默认数据，英文有英文默认数据。
- 资产类型标签、货币标签、SOP 模板、紧急响应流程默认内容、草稿导出文件名等本地化。
- PDF 生成的所有静态标签、版本名称、章节标题、表头、提示语按当前语言输出；中文 PDF 维持现状，英文 PDF 全英文。

## Capabilities

### New Capabilities
- `i18n-locale`: 语言状态管理与切换能力——定义受支持语言（`zh-CN` / `en`）、当前语言的存储与持久化、语言切换控件，以及向全应用提供翻译查找（`t(key)`）与语言感知数据源的入口。
- `localized-content`: 按语言分区的内容能力——界面文案字典、资产类型/货币标签、SOP 与紧急流程默认内容、PDF 静态文案的中英两套定义及其选择规则。

### Modified Capabilities
- `institution-registry`: 机构注册表从单一中文列表改为按语言分区（中文=中国大陆机构，英文=美国主流机构），`getInstitutionsByType`、默认机构映射等查询按当前语言返回对应数据。
- `asset-autofill`: 选择机构时自动填充的字段值随当前语言机构库变化；新建资产时的默认机构与默认填充内容按语言区分。

## Impact

- `src/state/types.ts`：`ASSET_TYPE_LABELS`、`CURRENCY_LABELS` 由常量改为语言感知；可能新增 `Locale` 类型。
- `src/state/context.tsx`：`AppState` 新增 `locale` 与 `setLocale`，并负责持久化（localStorage）。
- `src/data/institutions.ts`：机构数据与 `DEFAULT_INSTITUTION`、`getInstitutionsByType`、`getInstitutionById` 改为按语言分区。
- `src/data/mock-data.ts`、`src/data/sop-template.ts`：新增英文版默认数据与 SOP 模板，按语言返回。
- `src/components/Toolbar.tsx`：新增语言切换控件；所有组件文案接入 i18n。
- `src/components/*`（AssetCard、AccessEditor、SopEditor、CustomSectionEditor、MobileStepperBar、MobileTocOverlay、TableOfContents、PasswordModal、ConfirmDialog 等）与 `src/App.tsx`：静态文案本地化。
- `src/pdf/generate.ts`：PDF 内所有静态文案本地化。
- 新增 `src/i18n/`（翻译字典与 `t` 工具）目录。
