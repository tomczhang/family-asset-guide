import { useRef, useState } from "react";
import { useAppState } from "../state/context";
import { draftStatusLabel } from "../state/document";
import { createMockDocument } from "../data/mock-data";
import { t } from "../i18n";
import { SUPPORTED_LOCALES } from "../i18n/locale";
import "./Toolbar.css";

export function Toolbar({ isMobile }: { isMobile: boolean }) {
  const { dispatch, draftStatus, exportDraft, importDraft, clearAll, privacyMode, setPrivacyMode, locale, setLocale } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExportWarn, setShowExportWarn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  const statusText = draftStatusLabel(draftStatus, locale);

  const langControl = (
    <div className="toolbar-menu-wrap">
      <button
        className={`btn btn-ghost btn-sm toolbar-lang-btn${langMenuOpen ? " toolbar-lang-btn--on" : ""}`}
        aria-label={t(locale, "lang.label")}
        title={t(locale, "lang.label")}
        onClick={() => setLangMenuOpen((v) => !v)}
      >
        {/* lucide: languages */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      </button>
      {langMenuOpen && (
        <div className="toolbar-dropdown" onClick={() => setLangMenuOpen(false)}>
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              className={`toolbar-dropdown-item${l === locale ? " toolbar-dropdown-item--active" : ""}`}
              onClick={() => setLocale(l)}
            >
              {t(locale, `lang.${l}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setPendingPdf(file);
      setPdfPassword("");
      setPdfError("");
      return;
    }
    try {
      await importDraft(file);
    } catch (err) {
      alert(`${t(locale, "toolbar.importFailed")}: ${err instanceof Error ? err.message : t(locale, "common.unknownError")}`);
    }
  };

  const confirmPdfImport = async () => {
    if (!pendingPdf || pdfBusy) return;
    setPdfBusy(true);
    setPdfError("");
    try {
      await importDraft(pendingPdf, pdfPassword);
      setPendingPdf(null);
      setPdfPassword("");
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : t(locale, "toolbar.importFailed"));
    } finally {
      setPdfBusy(false);
    }
  };

  const handleExportClick = () => {
    setShowExportWarn(true);
  };

  const confirmExport = () => {
    exportDraft();
    setShowExportWarn(false);
  };

  const confirmClear = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-logo">{isMobile ? t(locale, "toolbar.logoShort") : t(locale, "toolbar.logoFull")}</span>
          {statusText && (
            <span
              className={`toolbar-status ${draftStatus.kind === "modified" ? "toolbar-status--warn" : ""}`}
            >
              {statusText}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          {langControl}
          <button
            className={`btn btn-ghost btn-sm toolbar-privacy${privacyMode ? " toolbar-privacy--on" : ""}`}
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? t(locale, "toolbar.showData") : t(locale, "toolbar.hideData")}
          >
            {privacyMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          {isMobile ? (
            <div className="toolbar-menu-wrap">
              <button className="toolbar-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label={t(locale, "toolbar.menu")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              {menuOpen && (
                <div className="toolbar-dropdown" onClick={() => setMenuOpen(false)}>
                  <button className="toolbar-dropdown-item" onClick={() => {
                    dispatch({ type: "LOAD_DOCUMENT", document: createMockDocument(locale) });
                  }}>
                    {t(locale, "toolbar.demoDataLong")}
                  </button>
                  <button className="toolbar-dropdown-item" onClick={() => fileRef.current?.click()}>
                    {t(locale, "toolbar.importDraft")}
                  </button>
                  <button className="toolbar-dropdown-item" onClick={handleExportClick}>
                    {t(locale, "toolbar.exportDraft")}
                  </button>
                  <button className="toolbar-dropdown-item toolbar-dropdown-item--danger" onClick={() => setShowClearConfirm(true)}>
                    {t(locale, "toolbar.clearData")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-amber btn-sm" onClick={() => {
                dispatch({ type: "LOAD_DOCUMENT", document: createMockDocument(locale) });
              }}>
                {t(locale, "toolbar.demoData")}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                {t(locale, "toolbar.importDraft")}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportClick}>
                {t(locale, "toolbar.exportDraft")}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowClearConfirm(true)}>
                {t(locale, "toolbar.clearData")}
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,.pdf"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
      </header>

      {showExportWarn && (
        <div className="modal-overlay" onClick={() => setShowExportWarn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{t(locale, "toolbar.exportTitle")}</div>
            <div className="warning-banner">
              {t(locale, "toolbar.exportWarn")}
            </div>
            <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.6 }}>
              {t(locale, "toolbar.exportBody")}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowExportWarn(false)}>
                {t(locale, "common.cancel")}
              </button>
              <button className="btn btn-primary" onClick={confirmExport}>
                {t(locale, "toolbar.exportConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPdf && (
        <div className="modal-overlay" onClick={() => !pdfBusy && setPendingPdf(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{t(locale, "toolbar.pdfImportTitle")}</div>
            <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.6, marginBottom: "var(--sp-4)" }}>
              {t(locale, "toolbar.pdfImportBody")}
            </p>
            <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
              <label className="field-label">{t(locale, "toolbar.pdfPasswordLabel")}</label>
              <input
                className="field-input"
                type="password"
                placeholder={t(locale, "toolbar.pdfPasswordPlaceholder")}
                value={pdfPassword}
                autoFocus
                onChange={(e) => setPdfPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmPdfImport(); }}
                autoComplete="off"
                data-lpignore="true"
              />
              {pdfError && (
                <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
                  {pdfError}
                </span>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPendingPdf(null)} disabled={pdfBusy}>
                {t(locale, "common.cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmPdfImport}
                disabled={pdfBusy || pdfPassword.length === 0}
                style={{ opacity: pdfBusy || pdfPassword.length === 0 ? 0.5 : 1 }}
              >
                {pdfBusy ? t(locale, "toolbar.pdfUnlocking") : t(locale, "toolbar.pdfUnlock")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{t(locale, "toolbar.clearTitle")}</div>
            <p style={{ color: "var(--stone-600)", fontSize: 13 }}>
              {t(locale, "toolbar.clearBody")}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                {t(locale, "common.cancel")}
              </button>
              <button className="btn btn-danger" onClick={confirmClear}>
                {t(locale, "toolbar.clearConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
