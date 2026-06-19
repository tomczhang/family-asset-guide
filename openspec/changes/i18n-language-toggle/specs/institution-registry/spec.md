## ADDED Requirements

### Requirement: 机构注册表按语言分区

机构注册表 SHALL 按语言分区维护：简体中文使用中国大陆主流机构（券商、银行、保险、加密货币交易所等），英文使用美国主流机构。每条机构记录 SHALL 包含 `id`、名称、官网、客服电话、App 下载方式与适用资产类型，并使用对应语言表述。

#### Scenario: 英文机构库为美国机构

- **WHEN** 当前语言为英文且用户查看券商/银行/保险机构下拉
- **THEN** 选项 SHALL 为美国主流机构（例如券商 Fidelity、Charles Schwab、Vanguard、Robinhood、E*TRADE、Interactive Brokers；银行 Chase、Bank of America、Wells Fargo、Citibank；保险 Northwestern Mutual、New York Life、MassMutual、Prudential、State Farm 等），含其英文名称、官网、客服电话与 App 下载方式

#### Scenario: 中文机构库维持现状

- **WHEN** 当前语言为简体中文
- **THEN** 机构下拉 SHALL 为现有中国大陆机构列表，内容不变

### Requirement: 按语言筛选机构

系统 SHALL 提供按资产类型筛选机构的查询，且仅返回当前语言分区内的机构。

#### Scenario: 按类型与语言筛选

- **WHEN** 调用「按资产类型获取机构」且当前语言为英文，资产类型为银行存款
- **THEN** 返回结果 SHALL 仅包含英文分区中适用于银行存款的美国银行

### Requirement: 按语言确定默认机构

系统 SHALL 为每种资产类型维护按语言区分的默认机构映射。新建资产时，预选机构 SHALL 取自当前语言分区。

#### Scenario: 英文默认机构

- **WHEN** 当前语言为英文且用户新建一条美股资产
- **THEN** 默认预选机构 SHALL 为英文分区中该类型的默认机构（美国券商）

### Requirement: 按 id 与语言查询机构

系统 SHALL 支持在当前语言分区内按机构 `id` 查询机构详情，用于自动填充与回显。

#### Scenario: 按 id 回显机构信息

- **WHEN** 资产记录持有某机构 `id` 且当前语言为英文
- **THEN** 系统 SHALL 从英文分区按 `id` 取回该机构的名称、官网、电话与 App 下载方式
