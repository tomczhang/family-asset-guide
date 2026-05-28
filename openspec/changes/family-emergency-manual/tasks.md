## 1. Project Setup

- [x] 1.1 Create `inheritance/` directory with package.json (React 18.3, TypeScript 5.5, Vite 5)
- [x] 1.2 Configure vite.config.ts with vite-plugin-singlefile and CSP meta tag injection
- [x] 1.3 Configure tsconfig.json with strict mode
- [x] 1.4 Create index.html entry point with CSP meta tags (`connect-src 'none'`, `frame-src 'none'`, `object-src 'none'`)
- [x] 1.5 Install dependencies: @cantoo/pdf-lib, @pdf-lib/fontkit, marked, zxcvbn-ts

## 2. Data Model & State

- [x] 2.1 Define TypeScript types for Document (meta, beneficiaries, assets, access, sop, custom sections)
- [x] 2.2 Implement Document state management (useReducer or context-based)
- [x] 2.3 Implement DraftEnvelope schema with schemaVersion and migrate() function
- [x] 2.4 Implement beneficiary pool with ID-based referencing

## 3. Layout & Right-side TOC

- [x] 3.1 Create root App layout: left main content area + right fixed sidebar
- [x] 3.2 Implement `<TableOfContents>` component with Figma-style timeline layout (dot indicators, chapter names, item counts)
- [x] 3.3 Implement click-to-scroll navigation (smooth scroll to chapter)
- [x] 3.4 Implement active chapter highlighting via IntersectionObserver
- [x] 3.5 Add "生成 PDF" shortcut button at TOC panel bottom

## 4. Toolbar

- [x] 4.1 Create Toolbar component with draft status indicator (red dot / grey checkmark)
- [x] 4.2 Add "导入草稿" button with file input
- [x] 4.3 Add "导出草稿" button with UNENCRYPTED warning modal
- [x] 4.4 Add "清空数据" button with confirmation

## 5. Form Components - Chapter 1 (Asset Inventory)

- [x] 5.1 Implement AssetCard component with structured fields (type, institution, account number, login URL, phone, value, currency)
- [x] 5.2 Implement BeneficiaryEditor for pool management (name, relationship, contact)
- [x] 5.3 Implement beneficiary assignment on assets (select from pool + share percentage)
- [x] 5.4 Implement add/remove asset functionality

## 6. Form Components - Chapter 2 (Account Access & 2FA)

- [x] 6.1 Implement AccessEditor component for account access documentation
- [x] 6.2 Implement SealsEditor for sealed envelope management (label, location, linked assets)
- [x] 6.3 Implement 2FA recovery section (method type + recovery instructions)

## 7. Form Components - Chapter 3 (Five-stage SOP)

- [x] 7.1 Create default SOP template content (IBKR/港股/A股/保险/美国遗产税)
- [x] 7.2 Implement SopEditor with markdown editing per stage
- [x] 7.3 Implement MarkdownField component for rich-text-like editing

## 8. Form Components - Chapter 4 (Custom Sections)

- [x] 8.1 Implement CustomSectionEditor with title + markdown body
- [x] 8.2 Implement add/remove custom section functionality

## 9. Draft Import/Export

- [x] 9.1 Implement JSON export with DraftEnvelope wrapping and `-UNENCRYPTED-` filename
- [x] 9.2 Implement JSON import with schema validation and version migration
- [x] 9.3 Implement warning modal for export (remind user to store on encrypted disk)

## 10. Password Modal & Diceware

- [x] 10.1 Create Chinese diceware word list (~2000 common words)
- [x] 10.2 Implement password modal with default 4-word diceware generation
- [x] 10.3 Implement regenerate button and free-form input toggle
- [x] 10.4 Implement free-form validation (≥6 chars, ≥3 character classes) with zxcvbn strength display

## 11. PDF Generation

- [x] 11.1 Embed Noto Sans SC subset font (build-time subsetting)
- [x] 11.2 Implement block-flow PDF layout engine (page breaks, margins, line spacing)
- [x] 11.3 Implement PDF cover page (family name as title, password holder reference)
- [x] 11.4 Implement PDF table of contents (chapter names without page numbers)
- [x] 11.5 Implement PDF body rendering for all 4 chapters
- [x] 11.6 Implement AES-256 encryption via @cantoo/pdf-lib
- [x] 11.7 Implement PDF download trigger

## 12. Polish & Verification

- [x] 12.1 Add `autocomplete="off"` and `data-lpignore="true"` to all inputs
- [x] 12.2 Verify zero-network-request via DevTools Network panel
- [x] 12.3 Verify PDF opens correctly in macOS Preview, Adobe Reader, and WPS
- [x] 12.4 Build single-file HTML and verify total bundle size < 3MB
- [x] 12.5 Commit `inheritance/` source and `inheritance/dist/index.html`
