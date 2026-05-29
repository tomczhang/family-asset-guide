## Why

资产清单填多了之后页面很长，已填完的资产占据大量空间。用户关注的是当前正在编辑的资产，其余资产只需一眼看到关键信息即可。

## What Changes

- 资产卡片增加"收起/展开"状态：收起时只显示一行摘要（资产类型、机构、账号、估值），展开时显示完整编辑表单
- 点击"添加资产"时，自动将当前展开的资产收起
- 收起状态下，卡片右侧显示"编辑"和"删除"按钮
- 点击"编辑"展开该卡片进入编辑模式（同时收起其他卡片）

## Capabilities

### New Capabilities
- `asset-card-collapse`: 资产卡片的折叠/展开交互，包括摘要视图、展开编辑、添加时自动折叠等行为

### Modified Capabilities

## Impact

- `inheritance/src/components/AssetCard.tsx`: 核心改造，增加折叠状态管理和摘要视图
