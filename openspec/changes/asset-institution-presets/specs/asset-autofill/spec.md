## ADDED Requirements

### Requirement: Institution selector in asset form
The asset form SHALL display an institution selector (dropdown) after the asset type field. The selector SHALL show institutions filtered by the selected asset type, plus an "其他" (Other) option at the end.

#### Scenario: User selects asset type and sees matching institutions
- **WHEN** user selects asset type "us_stock"
- **THEN** institution dropdown SHALL show US stock compatible institutions from the registry
- **THEN** the last option SHALL be "其他（手动填写）"

#### Scenario: Changing asset type updates institution options
- **WHEN** user changes asset type from "us_stock" to "bank_deposit"
- **THEN** institution dropdown SHALL update to show bank institutions
- **THEN** previously selected institution SHALL be cleared if not compatible with new type

### Requirement: Auto-fill on institution selection
When user selects a preset institution, the system SHALL automatically populate: institution name, login URL, customer service phone, and app download info.

#### Scenario: Select preset institution fills fields
- **WHEN** user selects "Interactive Brokers" from institution dropdown
- **THEN** institution name field SHALL be set to "Interactive Brokers"
- **THEN** login URL field SHALL be set to the IB website
- **THEN** contact phone field SHALL be set to IB customer service number
- **THEN** app download field SHALL be set to IB app download info

#### Scenario: Switch institution overwrites fields
- **WHEN** user has selected "Interactive Brokers" and then switches to "Futu"
- **THEN** all auto-filled fields SHALL be updated to Futu's information

### Requirement: Custom institution fallback
When user selects "其他", the system SHALL show empty manual input fields for institution name, login URL, contact phone, and app download.

#### Scenario: Select "Other" shows empty fields
- **WHEN** user selects "其他（手动填写）"
- **THEN** institution name, login URL, contact phone, and app download fields SHALL be empty and editable

### Requirement: Auto-filled fields remain editable
Even after auto-fill from a preset institution, all fields SHALL remain editable by the user.

#### Scenario: User can override auto-filled value
- **WHEN** institution is auto-filled with preset data
- **THEN** user SHALL be able to modify any auto-filled field value
- **THEN** modified values SHALL be persisted as-is

### Requirement: App download field in asset
Each asset SHALL have an app download field that records how to download the institution's mobile app.

#### Scenario: App download shown in asset card
- **WHEN** viewing an asset with a preset institution
- **THEN** app download information SHALL be visible in the asset card

#### Scenario: App download included in PDF
- **WHEN** generating PDF
- **THEN** each asset's app download info SHALL be included in the asset card output
