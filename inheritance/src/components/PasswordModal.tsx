import { useState } from "react";
import "./PasswordModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

function charClasses(pw: string): number {
  let classes = 0;
  if (/[a-z]/.test(pw)) classes++;
  if (/[A-Z]/.test(pw)) classes++;
  if (/[0-9]/.test(pw)) classes++;
  if (/[^a-zA-Z0-9]/.test(pw)) classes++;
  if (/[一-鿿]/.test(pw)) classes++;
  return classes;
}

function strengthLabel(pw: string): { text: string; color: string } {
  if (pw.length === 0) return { text: "", color: "var(--stone-400)" };
  const classes = charClasses(pw);
  if (pw.length < 6) return { text: "太短", color: "#dc2626" };
  if (classes < 3 && pw.length < 12)
    return { text: "较弱", color: "#ea580c" };
  if (pw.length >= 12 || classes >= 3) return { text: "可用", color: "#16a34a" };
  return { text: "一般", color: "#ca8a04" };
}

export function PasswordModal({ open, onClose, onConfirm }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  if (!open) return null;

  const strength = strengthLabel(password);
  const valid = password.length >= 6 && charClasses(password) >= 3;
  const confirmed = password === confirmPw && confirmPw.length > 0;
  const canSubmit = valid && confirmed;

  const handleSubmit = () => {
    if (canSubmit) onConfirm(password);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">生成加密 PDF</div>

        <div className="warning-banner">
          ⚠ 此密码是 PDF 的唯一解锁方式，请务必记录并妥善保管。
        </div>

        <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
          <label className="field-label">密码（≥6 位，需包含 3 类以上字符）</label>
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
      </div>
    </div>
  );
}
