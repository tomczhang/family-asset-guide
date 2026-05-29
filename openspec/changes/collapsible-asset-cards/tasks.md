## 1. 状态管理

- [x] 1.1 在 AssetEditor 组件中添加 `expandedId` state（string | null）
- [x] 1.2 改造"添加资产"逻辑：预生成 ID，dispatch 后将新 ID 设为 expandedId

## 2. 收起视图

- [x] 2.1 创建 CollapsedAssetCard 组件：一行摘要显示资产类型、机构、账号、估值
- [x] 2.2 收起卡片右侧添加"编辑"和"删除"按钮

## 3. 展开/收起交互

- [x] 3.1 根据 expandedId 条件渲染：匹配的显示完整编辑表单，不匹配的显示收起摘要
- [x] 3.2 点击"编辑"时将该卡片 ID 设为 expandedId
- [x] 3.3 点击"添加资产"时自动将新资产 ID 设为 expandedId（收起其余）
