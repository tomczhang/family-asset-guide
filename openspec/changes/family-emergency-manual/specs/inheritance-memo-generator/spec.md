## ADDED Requirements

### Requirement: Single-file offline app
The system SHALL be a single HTML file that runs entirely offline via `file://` protocol with zero network requests. CSP meta tag SHALL include `connect-src 'none'`.

#### Scenario: Zero network requests
- **WHEN** user opens `inheritance.html` via file:// in Chrome
- **THEN** DevTools Network panel shows zero outbound requests

#### Scenario: CSP enforcement
- **WHEN** any script attempts to fetch an external resource
- **THEN** the browser blocks the request per CSP policy

### Requirement: Right-side table of contents navigation
The system SHALL display a fixed right-side panel showing the document's chapter structure. The panel SHALL follow the Figma design (tangmu.zc-s-team-library node-id=3316-238) styling with timeline-style layout.

#### Scenario: TOC displays all chapters
- **WHEN** the app loads
- **THEN** the right panel shows all 4 chapters (资产清单 / 账户访问与2FA / 五阶段SOP / 自定义区) with dot indicators and item count summaries

#### Scenario: Click to navigate
- **WHEN** user clicks a chapter name in the TOC panel
- **THEN** the main content area smooth-scrolls to that chapter's form section

#### Scenario: Active chapter highlighting
- **WHEN** user scrolls the main content area
- **THEN** the TOC panel highlights the currently visible chapter (via IntersectionObserver)

#### Scenario: Generate PDF shortcut
- **WHEN** user views the TOC panel
- **THEN** a "生成 PDF" button is visible at the bottom of the panel

### Requirement: Asset inventory form (Chapter 1)
The system SHALL provide a form for listing financial assets with structured fields: asset type, institution name, account number, login URL, contact phone, estimated value, currency, and beneficiary references.

#### Scenario: Add new asset
- **WHEN** user clicks "添加资产" button
- **THEN** a new asset card appears with empty structured fields

#### Scenario: Assign beneficiaries
- **WHEN** user edits an asset's beneficiary field
- **THEN** user can select from the beneficiary pool and assign percentage shares

### Requirement: Account access and 2FA form (Chapter 2)
The system SHALL provide a form for documenting account access methods, 2FA recovery codes, and sealed envelope references.

#### Scenario: Add sealed envelope reference
- **WHEN** user adds a seal entry
- **THEN** the system records seal label (e.g., "密封件 #A"), location description, and linked assets

#### Scenario: 2FA recovery documentation
- **WHEN** user fills 2FA section for an account
- **THEN** system captures recovery method type (TOTP/SMS/hardware key) and recovery instructions

### Requirement: Five-stage SOP form (Chapter 3)
The system SHALL provide a pre-filled five-stage standard operating procedure template covering IBKR/港股/A股/保险/美国遗产税 paths. Users can edit markdown content.

#### Scenario: Default template loaded
- **WHEN** app opens with no imported draft
- **THEN** Chapter 3 displays pre-filled SOP template with all 5 stages

#### Scenario: Editable markdown
- **WHEN** user modifies SOP text
- **THEN** changes are reflected in the document state and marked as unsaved

### Requirement: Custom section form (Chapter 4)
The system SHALL allow users to add free-form sections with title and markdown body.

#### Scenario: Add custom section
- **WHEN** user clicks "添加自定义章节"
- **THEN** a new section with editable title and markdown body appears

### Requirement: AES-256 encrypted PDF generation
The system SHALL generate a PDF encrypted with AES-256 using user-provided password. The PDF SHALL render correctly in macOS Preview, Adobe Reader, and WPS.

#### Scenario: Generate encrypted PDF
- **WHEN** user clicks "生成 PDF" and enters password
- **THEN** system generates and downloads a PDF file encrypted with AES-256

#### Scenario: PDF renders Chinese text
- **WHEN** generated PDF is opened in any of the three target readers
- **THEN** all Chinese text renders correctly using embedded Noto Sans SC subset font

#### Scenario: PDF table of contents
- **WHEN** PDF is generated
- **THEN** first page after cover contains a table of contents listing all chapters by name (without page numbers)

### Requirement: Diceware password recommendation
The system SHALL display a password modal that defaults to showing a generated 4-word Chinese diceware passphrase (~52 bits entropy). User can regenerate or switch to free-form input.

#### Scenario: Default diceware display
- **WHEN** password modal opens
- **THEN** a 4-word Chinese passphrase is pre-generated and displayed

#### Scenario: Free-form password validation
- **WHEN** user switches to free-form input and enters a password
- **THEN** system enforces minimum 6 characters with 3+ character classes and shows zxcvbn strength estimate

### Requirement: Draft import/export
The system SHALL allow exporting document state as unencrypted JSON and importing previously exported drafts.

#### Scenario: Export draft
- **WHEN** user clicks "导出草稿"
- **THEN** system downloads a JSON file with filename containing `-UNENCRYPTED-` prefix and shows warning modal about storing on encrypted disk

#### Scenario: Import draft
- **WHEN** user selects a previously exported JSON file via "导入草稿"
- **THEN** system validates schema version, migrates if needed, and restores document state

### Requirement: No persistent storage
The system SHALL NOT use localStorage, IndexedDB, cookies, or any other browser persistence mechanism. All form inputs use `autocomplete="off"`.

#### Scenario: Close and reopen
- **WHEN** user closes the browser tab and reopens the HTML file
- **THEN** the app starts fresh with no pre-filled data

### Requirement: Unsaved changes indicator
The system SHALL display a visual indicator in the toolbar showing draft status: red dot "● 未导出" when modified, grey checkmark "✓ 已导出 N 分钟前" after export.

#### Scenario: Modification indicator
- **WHEN** user makes any edit to the form
- **THEN** toolbar shows red dot "● 未导出"

#### Scenario: Export clears indicator
- **WHEN** user successfully exports draft
- **THEN** toolbar shows grey checkmark with timestamp

### Requirement: Beneficiary pool management
The system SHALL maintain a separate beneficiary pool. Assets reference beneficiaries by ID with share percentages.

#### Scenario: Add beneficiary
- **WHEN** user adds a new beneficiary
- **THEN** beneficiary appears in pool with name, relationship, and contact info fields

#### Scenario: Beneficiary referenced by assets
- **WHEN** user assigns a beneficiary to an asset
- **THEN** the assignment records beneficiary ID and percentage share
