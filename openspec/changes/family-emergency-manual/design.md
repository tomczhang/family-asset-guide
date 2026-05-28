## Context

stock-farmer 仓库现有 `web/` 子项目使用 React 18.3 / TypeScript 5.5 / Vite 5 栈。本 change 新增 `inheritance/` 顶层子项目（独立 package.json），复用该栈但与 `web/` 完全解耦。

核心约束是**离线 + 加密 + 长期可读**。整个 app 打包成单个 HTML 文件，双击 file:// 运行、零网络请求、生成的 PDF 在 20 年后仍可独立打开。

UI 设计参照 Figma (tangmu.zc-s-team-library node-id=3316-238) 样式体系，整体布局为左侧主编辑区 + 右侧固定目录导航面板。

## Goals / Non-Goals

**Goals:**

- 双击打开 `inheritance.html`，全程零网络请求（CSP `connect-src 'none'`）
- 30 分钟内完成首次填表并产出 AES-256 加密 PDF
- 生成的 PDF 在 macOS Preview / Adobe Reader / WPS 三方可打开
- 右侧目录面板实时反映文档结构，支持点击跳转
- 应用层不产生任何持久化痕迹（无 localStorage、无 IndexedDB、无 cookie）

**Non-Goals:**

- 中英双语 PDF（v1 仅中文）
- PDF 内嵌图片/扫描件
- 多人协作/草稿云同步
- 移动端表单优化（仅桌面浏览器）
- 在线部署

## Decisions

### D1. 单文件 HTML（vite-plugin-singlefile）

**选择**：用 `vite-plugin-singlefile` 把整个 React 应用打包成单个 HTML。

**替代**：多文件静态站（体积小但分发时要保持文件夹结构完整）；裸 HTML 手写（开发慢无类型）。

**理由**：分发可靠性 > 体积与性能。预估 500KB-2MB，对 file:// 可接受。

### D2. PDF 库选 @cantoo/pdf-lib

**选择**：v1 用 `@cantoo/pdf-lib`（fork），原生支持 AES-256 加密。

**替代**：主线 pdf-lib + JS 加密 polyfill；主线 pdf-lib + qpdf-wasm（~2MB）。

**理由**：v1 优先简单与体积。代码结构上"生成"与"加密"两步解耦，便于未来切换。

### D3. 右侧目录导航面板

**选择**：固定在右侧的目录面板，类似 GitHub changelog sidebar 样式——标题 + 时间线式章节列表 + 当前位置高亮。面板始终可见，不随主内容滚动。

**实现方式**：
- 组件 `<TableOfContents>`，从 Document state 派生章节列表
- 章节项含：圆点指示器 + 章节名 + 条目数摘要
- 点击章节名平滑滚动到对应表单区域
- 当前可视章节自动高亮（IntersectionObserver）
- 面板底部放"生成 PDF"快捷入口

**替代**：顶部 tab 切换（不能看全貌）；左侧 drawer（挤占编辑空间）。

**理由**：右侧目录让用户始终了解文档全貌，点击即达，参照图中 changelog sidebar 的紧凑布局。

### D4. 目录页不带页码（PDF 单遍渲染）

**选择**：PDF 目录只列章节名，不展示具体页码。

**理由**：省 200+ 行布局代码与同步 bug。PDF 阅读器自带页面导航可定位。

### D5. 默认推荐 diceware 中文词组密码

**选择**：密码 modal 第一屏展示 4 词中文词组（约 52 位熵），用户可一键换组或切到自由输入（≥6 位 + ≥3 类字符）。

**理由**：词组比同熵随机密码易记 10 倍，强度即加密 PDF 唯一防线。

### D6. 数据模型：受益人成池 + 资产含结构化字段

**选择**：`beneficiaries[]` 单独成池，资产用 `beneficiaryRefs` 引用；资产含 `accountNumber / loginUrl / contactPhone` 一等字段；`access.seals[]` 作为密封件清单。

### D7. 草稿 DraftEnvelope + schemaVersion

**选择**：JSON 导出包一层 `{ schemaVersion: 1, exportedAt, document }`，未来通过 `migrate()` 升级。

### D8. 不依赖 beforeunload

**选择**：toolbar 持久显示草稿状态（红点/灰勾），不挂 `beforeunload`。现代浏览器对其限制严格，视觉提醒更可靠。

## Risks / Trade-offs

| # | 风险 | 缓解 |
|---|------|------|
| R1 | @cantoo/pdf-lib fork 停更 | 代码结构解耦加密层，可切换实现 |
| R2 | 用户忘记 PDF 密码 | 生成时强提示写下密码到密封件；PDF 封面注明密码持有者 |
| R3 | 草稿 JSON 明文泄露 | 文件名带 `-UNENCRYPTED-` 前缀；导出弹窗强提示 |
| R4 | 6 位弱密码 + GPU 攻击 | 默认 diceware 52 位熵；zxcvbn 软提示破解时间 |
| R5 | 单文件体积超 3MB | 字体 subset；build 时输出体积报告 |
| R6 | CSP 在 file:// 下浏览器差异 | CSP 仅 defense in depth；主保证是 build-time 确认无外部资源 |
