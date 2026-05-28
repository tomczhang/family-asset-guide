## ADDED Requirements

### Requirement: Step-based page navigation on mobile
The system SHALL display only one editor section at a time on mobile devices (≤768px viewport width). The four sections — Asset Editor, Access Editor, SOP Editor, Custom Section Editor — SHALL each occupy a full "page". Users navigate between pages via bottom navigation controls.

#### Scenario: Initial load on mobile
- **WHEN** the application loads on a mobile device
- **THEN** the first section (Asset Editor / 资产清单) SHALL be displayed, and all other sections SHALL be hidden

#### Scenario: Navigate to next step
- **WHEN** the user taps "下一步" (Next) on step N (where N < 4)
- **THEN** the current section SHALL be hidden and section N+1 SHALL be displayed
- **AND** the page SHALL scroll to the top

#### Scenario: Navigate to previous step
- **WHEN** the user taps "上一步" (Previous) on step N (where N > 1)
- **THEN** the current section SHALL be hidden and section N-1 SHALL be displayed
- **AND** the page SHALL scroll to the top

#### Scenario: First step has no previous button
- **WHEN** the user is on step 1
- **THEN** the "上一步" button SHALL be hidden or disabled

#### Scenario: Last step shows generate PDF
- **WHEN** the user is on step 4 (Custom Section Editor)
- **THEN** the "下一步" button SHALL be replaced with a "生成 PDF" button that opens the password modal

### Requirement: Bottom navigation bar on mobile
The system SHALL display a fixed bottom navigation bar on mobile devices containing step navigation controls and a step indicator.

#### Scenario: Step indicator display
- **WHEN** the user is on step N
- **THEN** the bottom bar SHALL display a step indicator showing "N / 4"

#### Scenario: Bottom bar visibility
- **WHEN** the application is displayed on a mobile device
- **THEN** the bottom navigation bar SHALL be fixed at the viewport bottom and always visible

### Requirement: Floating TOC button on mobile
The system SHALL display a floating action button (FAB) on mobile devices that opens the table of contents overlay panel.

#### Scenario: FAB visibility
- **WHEN** the application is displayed on a mobile device
- **THEN** a floating button SHALL be visible above the bottom navigation bar

#### Scenario: FAB opens overlay
- **WHEN** the user taps the floating TOC button
- **THEN** an overlay panel SHALL appear listing all four sections with their names and item counts

### Requirement: TOC overlay navigation
The TOC overlay panel SHALL allow users to jump directly to any section.

#### Scenario: Jump to section
- **WHEN** the user taps a section name in the TOC overlay
- **THEN** the overlay SHALL close and the selected section SHALL be displayed

#### Scenario: Current step highlight
- **WHEN** the TOC overlay is open
- **THEN** the current active step SHALL be visually highlighted

#### Scenario: Close overlay
- **WHEN** the user taps outside the overlay or taps a close button
- **THEN** the overlay SHALL close without changing the current step

### Requirement: Desktop behavior unchanged
The desktop layout (>768px) SHALL remain completely unchanged by this feature.

#### Scenario: Desktop renders all sections
- **WHEN** the viewport width exceeds 768px
- **THEN** all four editor sections SHALL be rendered simultaneously in a vertical scroll layout with the fixed right sidebar visible
