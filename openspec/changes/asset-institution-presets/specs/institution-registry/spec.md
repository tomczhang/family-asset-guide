## ADDED Requirements

### Requirement: Institution data registry
The system SHALL maintain a static registry of financial institutions with their public information. Each institution entry MUST contain: id, name, website URL, customer service phone, and app download info. Each institution MUST be tagged with one or more compatible asset types.

#### Scenario: Registry contains common brokerages
- **WHEN** asset type is "us_stock"
- **THEN** available institutions SHALL include at minimum: Interactive Brokers, Charles Schwab, Firstrade, TD Ameritrade, Futu (moomoo), Tiger Brokers (老虎证券)

#### Scenario: Registry contains HK brokerages
- **WHEN** asset type is "hk_stock"
- **THEN** available institutions SHALL include at minimum: Futu (富途牛牛), Tiger Brokers, Interactive Brokers, 长桥证券, 华盛通

#### Scenario: Registry contains A-share brokerages
- **WHEN** asset type is "a_stock"
- **THEN** available institutions SHALL include at minimum: 华泰证券, 中信证券, 招商证券, 国泰君安, 东方财富

#### Scenario: Registry contains banks
- **WHEN** asset type is "bank_deposit"
- **THEN** available institutions SHALL include at minimum: 招商银行, 工商银行, 建设银行, 中国银行, HSBC, Citibank

#### Scenario: Registry contains insurance companies
- **WHEN** asset type is "insurance"
- **THEN** available institutions SHALL include at minimum: 中国平安, 中国人寿, 友邦保险 (AIA), 保诚 (Prudential)

#### Scenario: Registry contains crypto exchanges
- **WHEN** asset type is "crypto"
- **THEN** available institutions SHALL include at minimum: Binance, OKX, Coinbase

### Requirement: Institution fields are complete
Each institution in the registry MUST provide all of: official website URL, primary customer service phone number, and app download information (App Store/Google Play link or description).

#### Scenario: All fields populated
- **WHEN** an institution is retrieved from the registry
- **THEN** its website, phone, and appDownload fields SHALL all be non-empty strings

### Requirement: Institutions filtered by asset type
The system SHALL provide a function to retrieve institutions compatible with a given asset type.

#### Scenario: Filter by asset type
- **WHEN** requesting institutions for asset type "us_stock"
- **THEN** only institutions tagged with "us_stock" SHALL be returned
- **THEN** institutions not tagged with "us_stock" SHALL NOT be returned
