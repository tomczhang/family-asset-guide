import { useEffect } from "react";
import { t } from "../i18n";
import { getActiveLocale } from "../i18n/locale";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default";
}

interface Props {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, options, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onConfirm, onCancel]);

  if (!open || !options) return null;

  const tone = options.tone ?? "danger";
  const locale = getActiveLocale();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{options.title}</div>
        <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.6 }}>
          {options.message}
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {options.cancelText ?? t(locale, "common.cancel")}
          </button>
          <button
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {options.confirmText ?? t(locale, "common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
