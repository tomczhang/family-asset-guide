import { useEffect, useState } from "react";
import "./PasswordModal.css";
import { DEFAULT_PDF_OUTPUT_MODE, type PdfOutputMode } from "../pdf/generate";
import { useAppState } from "../state/context";
import { t } from "../i18n";
import type { Locale } from "../i18n/locale";

interface Props {
  open: boolean;
  generating: boolean;
  statusMessage: string;
  onClose: () => void;
  onConfirm: (password: string, mode: PdfOutputMode) => void;
}

function strengthLabel(pw: string, locale: Locale): { text: string; color: string } {
  if (pw.length === 0) return { text: "", color: "var(--stone-400)" };
  if (pw.length < 6) return { text: t(locale, "password.strengthShort"), color: "#dc2626" };
  if (pw.length < 10) return { text: t(locale, "password.strengthMedium"), color: "#ca8a04" };
  return { text: t(locale, "password.strengthStrong"), color: "#16a34a" };
}

export function PasswordModal({ open, generating, statusMessage, onClose, onConfirm }: Props) {
  const { locale } = useAppState();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [mode, setMode] = useState<PdfOutputMode>(DEFAULT_PDF_OUTPUT_MODE);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirmPw("");
    setMode(DEFAULT_PDF_OUTPUT_MODE);
  }, [open]);

  if (!open) return null;

  const strength = strengthLabel(password, locale);
  const valid = password.length >= 6;
  const confirmed = password === confirmPw && confirmPw.length > 0;
  const canSubmit = valid && confirmed && !generating;

  const handleSubmit = () => {
    if (canSubmit) onConfirm(password, mode);
  };

  return (
    <div className="modal-overlay" onClick={generating ? undefined : onClose}>
      <div className="modal pw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{generating ? t(locale, "password.generating") : t(locale, "password.title")}</div>

        {generating ? (
          <div style={{ textAlign: "center", padding: "var(--sp-6) 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--stone-500)", fontSize: 13, marginTop: "var(--sp-4)" }}>
              {statusMessage || t(locale, "password.generatingMsg")}
            </p>
          </div>
        ) : (
          <>
            <div className="warning-banner">
              {t(locale, "password.warn")}
            </div>

            <div className="pdf-mode-group" role="radiogroup" aria-label={t(locale, "password.modeAria")}>
              <button
                type="button"
                className={`pdf-mode-option${mode === "full" ? " pdf-mode-option--active" : ""}`}
                role="radio"
                aria-checked={mode === "full"}
                onClick={() => setMode("full")}
              >
                <span className="pdf-mode-title">{t(locale, "password.fullTitle")}</span>
                <span className="pdf-mode-desc">{t(locale, "password.fullDesc")}</span>
              </button>
              <button
                type="button"
                className={`pdf-mode-option${mode === "relative" ? " pdf-mode-option--active" : ""}`}
                role="radio"
                aria-checked={mode === "relative"}
                onClick={() => setMode("relative")}
              >
                <span className="pdf-mode-title">{t(locale, "password.relativeTitle")}</span>
                <span className="pdf-mode-desc">{t(locale, "password.relativeDesc")}</span>
              </button>
            </div>

            <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
              <label className="field-label">{t(locale, "password.passwordLabel")}</label>
              <input
                className="field-input"
                type="password"
                placeholder={t(locale, "password.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
              />
              {strength.text && (
                <span style={{ fontSize: 11, color: strength.color, marginTop: 2 }}>
                  {strength.text}
                </span>
              )}
            </div>

            <div className="field" style={{ marginBottom: "var(--sp-4)" }}>
              <label className="field-label">{t(locale, "password.confirmLabel")}</label>
              <input
                className="field-input"
                type="password"
                placeholder={t(locale, "password.confirmPlaceholder")}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                autoComplete="off"
                data-lpignore="true"
              />
              {confirmPw.length > 0 && !confirmed && (
                <span style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>
                  {t(locale, "password.mismatch")}
                </span>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                {t(locale, "common.cancel")}
              </button>
              <button
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={handleSubmit}
                style={{ opacity: canSubmit ? 1 : 0.5 }}
              >
                {mode === "full" ? t(locale, "password.submitFull") : t(locale, "password.submitRelative")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
