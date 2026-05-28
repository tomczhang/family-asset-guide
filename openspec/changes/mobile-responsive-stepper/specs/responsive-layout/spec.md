## ADDED Requirements

### Requirement: Mobile viewport layout
The system SHALL apply a responsive layout on viewports ≤768px wide, removing the fixed sidebar and expanding the main content area to full width.

#### Scenario: Sidebar hidden on mobile
- **WHEN** the viewport width is ≤768px
- **THEN** the TableOfContents sidebar SHALL NOT be rendered as a fixed side panel
- **AND** the main content area SHALL NOT have right padding for the sidebar

#### Scenario: Content full width on mobile
- **WHEN** the viewport width is ≤768px
- **THEN** the main content area SHALL span the full viewport width with appropriate mobile padding

#### Scenario: Desktop sidebar visible
- **WHEN** the viewport width is >768px
- **THEN** the sidebar SHALL be displayed as a fixed right panel with 260px width (current behavior)

### Requirement: Mobile toolbar adaptation
The toolbar SHALL adapt its layout for mobile devices to fit within the narrower viewport.

#### Scenario: Toolbar actions condensed on mobile
- **WHEN** the viewport width is ≤768px
- **THEN** the toolbar action buttons (导入草稿, 导出草稿, 清空数据) SHALL be condensed into a menu or icon-only display

#### Scenario: Toolbar logo visible on mobile
- **WHEN** the viewport width is ≤768px
- **THEN** the application title/logo SHALL remain visible in the toolbar

### Requirement: Form fields responsive layout
Form field groups SHALL stack vertically on mobile devices instead of the 2-column grid layout.

#### Scenario: Fields stack on mobile
- **WHEN** the viewport width is ≤768px
- **THEN** `.field-group` elements SHALL display as a single column layout

### Requirement: Bottom safe area spacing
The main content area SHALL include bottom padding on mobile to account for the fixed bottom navigation bar.

#### Scenario: Content not obscured by bottom bar
- **WHEN** the user scrolls to the bottom of a section on mobile
- **THEN** no content SHALL be hidden behind the fixed bottom navigation bar
