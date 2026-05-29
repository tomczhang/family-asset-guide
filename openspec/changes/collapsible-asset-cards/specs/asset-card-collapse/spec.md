## ADDED Requirements

### Requirement: Asset card has collapsed and expanded states
Each asset card SHALL have two display states: collapsed (summary) and expanded (full edit form). Only one card SHALL be expanded at a time.

#### Scenario: Default state after page load
- **WHEN** the asset list renders with existing assets
- **THEN** all asset cards SHALL be in collapsed state

#### Scenario: Only one card expanded at a time
- **WHEN** user clicks "编辑" on a collapsed card
- **THEN** that card SHALL expand to show full edit form
- **THEN** any previously expanded card SHALL collapse

### Requirement: Collapsed card shows summary
A collapsed asset card SHALL display a single compact row showing: asset type label, institution name, account number, and estimated value (currency + amount).

#### Scenario: Summary content
- **WHEN** asset card is collapsed
- **THEN** it SHALL show asset type label (e.g. "美股")
- **THEN** it SHALL show institution name
- **THEN** it SHALL show account number
- **THEN** it SHALL show currency and estimated value

### Requirement: Collapsed card has edit and delete buttons
A collapsed asset card SHALL show "编辑" and "删除" action buttons on the right side.

#### Scenario: Edit button expands card
- **WHEN** user clicks "编辑" on a collapsed card
- **THEN** the card SHALL expand into full edit mode

#### Scenario: Delete button removes asset
- **WHEN** user clicks "删除" on a collapsed card
- **THEN** the asset SHALL be removed (same as current delete behavior)

### Requirement: Adding asset collapses others and expands new
When user clicks "添加资产", all existing cards SHALL collapse and the newly created card SHALL be in expanded state.

#### Scenario: Add new asset
- **WHEN** user clicks "+ 添加资产"
- **THEN** a new asset card SHALL be created in expanded state
- **THEN** all previously existing cards SHALL be in collapsed state
