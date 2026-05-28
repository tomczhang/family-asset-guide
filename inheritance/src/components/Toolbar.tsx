import { useRef, useState } from "react";
import { useAppState } from "../state/context";
import { draftStatusLabel } from "../state/document";
import "./Toolbar.css";

export function Toolbar({ isMobile }: { isMobile: boolean }) {
  const { draftStatus, exportDraft, importDraft, clearAll } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExportWarn, setShowExportWarn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const statusText = draftStatusLabel(draftStatus);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importDraft(file);
    } catch (err) {
      alert(`导入失败: ${err instanceof Error ? err.message : "未知错误"}`);
    }
    if (fileRef.current) fileRef.current.value = "";
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
            accept=".json"
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
