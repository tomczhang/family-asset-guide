import { useRef, useState } from "react";
import { useAppState } from "../state/context";
import { draftStatusLabel } from "../state/document";
import "./Toolbar.css";

export function Toolbar({ isMobile }: { isMobile: boolean }) {
  const { draftStatus, exportDraft, importDraft, clearAll, privacyMode, setPrivacyMode } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExportWarn, setShowExportWarn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  const statusText = draftStatusLabel(draftStatus);

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
      alert(`导入失败: ${err instanceof Error ? err.message : "未知错误"}`);
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
      setPdfError(err instanceof Error ? err.message : "导入失败");
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
          <span className="toolbar-logo">{isMobile ? "应急手册" : "家庭资产应急手册"}</span>
          {statusText && (
            <span
              className={`toolbar-status ${draftStatus.kind === "modified" ? "toolbar-status--warn" : ""}`}
            >
              {statusText}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button
            className={`btn btn-ghost btn-sm toolbar-privacy${privacyMode ? " toolbar-privacy--on" : ""}`}
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "显示数据" : "隐藏数据"}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {menuOpen && (
                <div className="toolbar-dropdown" onClick={() => setMenuOpen(false)}>
                  <button className="toolbar-dropdown-item" onClick={() => fileRef.current?.click()}>
                    导入草稿
                  </button>
                  <button className="toolbar-dropdown-item" onClick={handleExportClick}>
                    导出草稿
                  </button>
                  <button className="toolbar-dropdown-item toolbar-dropdown-item--danger" onClick={() => setShowClearConfirm(true)}>
                    清空数据
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                导入草稿
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportClick}>
                导出草稿
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowClearConfirm(true)}>
                清空数据
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
            <div className="modal-title">导出草稿</div>
            <div className="warning-banner">
              ⚠ 草稿文件未加密！请务必存储在加密磁盘或安全位置。
            </div>
            <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.6 }}>
              导出的 JSON 文件包含所有填写的资产与账户信息，文件名将包含
              「-UNENCRYPTED-」前缀以提醒您该文件未加密。
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowExportWarn(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmExport}>
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPdf && (
        <div className="modal-overlay" onClick={() => !pdfBusy && setPendingPdf(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">从 PDF 导入草稿</div>
            <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.6, marginBottom: "var(--sp-4)" }}>
              检测到加密的应急手册 PDF。输入生成该 PDF 时设置的密码，即可解锁并导入其中的数据继续编辑。
            </p>
            <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
              <label className="field-label">PDF 解锁密码</label>
              <input
                className="field-input"
                type="password"
                placeholder="输入密码"
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
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmPdfImport}
                disabled={pdfBusy || pdfPassword.length === 0}
                style={{ opacity: pdfBusy || pdfPassword.length === 0 ? 0.5 : 1 }}
              >
                {pdfBusy ? "解锁中…" : "解锁并导入"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认清空</div>
            <p style={{ color: "var(--stone-600)", fontSize: 13 }}>
              清空后所有已填写内容将丢失且无法恢复。确定要继续吗？
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmClear}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
