import { useState } from "react";
import "./PasswordModal.css";

interface Props {
  open: boolean;
  generating: boolean;
  statusMessage: string;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

function strengthLabel(pw: string): { text: string; color: string } {
  if (pw.length === 0) return { text: "", color: "var(--stone-400)" };
  if (pw.length < 6) return { text: "太短", color: "#dc2626" };
  if (pw.length < 10) return { text: "一般", color: "#ca8a04" };
  return { text: "强", color: "#16a34a" };
}

export function PasswordModal({ open, generating, statusMessage, onClose, onConfirm }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  if (!open) return null;

  const strength = strengthLabel(password);
  const valid = password.length >= 6;
  const confirmed = password === confirmPw && confirmPw.length > 0;
  const canSubmit = valid && confirmed && !generating;

  const handleSubmit = () => {
    if (canSubmit) onConfirm(password);
  };

  return (
    <div className="modal-overlay" onClick={generating ? undefined : onClose}>
      <div className="modal pw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{generating ? "正在生成 PDF…" : "生成加密 PDF"}</div>

        {generating ? (
          <div style={{ textAlign: "center", padding: "var(--sp-6) 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--stone-500)", fontSize: 13, marginTop: "var(--sp-4)" }}>
              {statusMessage || "正在加载字体并生成加密 PDF，请稍候…"}
            </p>
          </div>
        ) : (
          <>
            <div className="warning-banner">
              ⚠ 此密码是 PDF 的唯一解锁方式，请务必记录并妥善保管。
            </div>

            <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
              <label className="field-label">密码（≥6 位）</label>
              <input
                className="field-input"
                type="password"
                placeholder="输入密码"
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
              <label className="field-label">确认密码</label>
              <input
                className="field-input"
                type="password"
                placeholder="再次输入密码"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                autoComplete="off"
                data-lpignore="true"
              />
              {confirmPw.length > 0 && !confirmed && (
                <span style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>
                  密码不匹配
                </span>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                取消
              </button>
              <button
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={handleSubmit}
                style={{ opacity: canSubmit ? 1 : 0.5 }}
              >
                生成加密 PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
