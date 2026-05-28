import { useState, useCallback, useEffect } from "react";
import { useAppState } from "../state/context";
import { DICEWARE_ZH } from "../data/diceware-zh";
import "./PasswordModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

function generateDiceware(wordCount = 4): string {
  const arr = new Uint32Array(wordCount);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((n) => DICEWARE_ZH[n % DICEWARE_ZH.length]!)
    .join("-");
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
    return { text: "较弱 — 建议使用词组密码", color: "#ea580c" };
  if (pw.length >= 12 || classes >= 3) return { text: "可用", color: "#16a34a" };
  return { text: "一般", color: "#ca8a04" };
}

export function PasswordModal({ open, onClose, onConfirm }: Props) {
  const { doc, dispatch } = useAppState();
  const [mode, setMode] = useState<"diceware" | "freeform">("diceware");
  const [dicewarePhrase, setDicewarePhrase] = useState("");
  const [freeformPw, setFreeformPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const regenerate = useCallback(() => {
    setDicewarePhrase(generateDiceware());
  }, []);

  useEffect(() => {
    if (open && !dicewarePhrase) {
      regenerate();
    }
  }, [open, dicewarePhrase, regenerate]);

  if (!open) return null;

  const currentPw = mode === "diceware" ? dicewarePhrase : freeformPw;
  const strength = mode === "freeform" ? strengthLabel(freeformPw) : null;
  const freeformValid =
    mode === "freeform" ? freeformPw.length >= 6 && charClasses(freeformPw) >= 3 : true;
  const confirmed = currentPw === confirmPw && confirmPw.length > 0;
  const canSubmit = currentPw.length > 0 && confirmed && (mode === "diceware" || freeformValid);

  const handleSubmit = () => {
    if (canSubmit) onConfirm(currentPw);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">生成加密 PDF</div>

        <div className="field-group" style={{ marginBottom: "var(--sp-4)" }}>
          <div className="field">
            <label className="field-label">家庭姓氏</label>
            <input
              className="field-input"
              placeholder="例：张"
              value={doc.meta.familyName}
              onChange={(e) =>
                dispatch({ type: "SET_META", field: "familyName", value: e.target.value })
              }
              autoComplete="off"
              data-lpignore="true"
            />
          </div>
          <div className="field">
            <label className="field-label">密码持有人提示</label>
            <input
              className="field-input"
              placeholder="例：长子 张伟 持有 PDF 解锁密码"
              value={doc.meta.passwordHolderHint}
              onChange={(e) =>
                dispatch({ type: "SET_META", field: "passwordHolderHint", value: e.target.value })
              }
              autoComplete="off"
              data-lpignore="true"
            />
          </div>
        </div>

        <div className="warning-banner">
          ⚠ 此密码是 PDF 的唯一解锁方式，请务必记录并妥善保管（建议写在密封件中）。
        </div>

        <div className="pw-tabs">
          <button
            className={`pw-tab ${mode === "diceware" ? "pw-tab--active" : ""}`}
            onClick={() => setMode("diceware")}
          >
            词组密码（推荐）
          </button>
          <button
            className={`pw-tab ${mode === "freeform" ? "pw-tab--active" : ""}`}
            onClick={() => setMode("freeform")}
          >
            自定义密码
          </button>
        </div>

        {mode === "diceware" && (
          <div className="pw-diceware">
            <div className="pw-phrase">{dicewarePhrase}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <button className="btn btn-secondary btn-sm" onClick={regenerate}>
                换一组
              </button>
              <span style={{ color: "var(--stone-400)", fontSize: 11 }}>
                4 词 ≈ 52 位熵，足以抵御离线暴力破解
              </span>
            </div>
          </div>
        )}

        {mode === "freeform" && (
          <div className="pw-freeform">
            <div className="field" style={{ marginBottom: "var(--sp-3)" }}>
              <label className="field-label">密码（≥6 位，需包含 3 类以上字符）</label>
              <input
                className="field-input"
                type="password"
                value={freeformPw}
                onChange={(e) => setFreeformPw(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
              />
              {strength && strength.text && (
                <span style={{ fontSize: 11, color: strength.color, marginTop: 2 }}>
                  {strength.text}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: "var(--sp-4)" }}>
          <label className="field-label">确认密码</label>
          <input
            className="field-input"
            type={mode === "diceware" ? "text" : "password"}
            placeholder={mode === "diceware" ? "请重新输入上方词组" : "再次输入密码"}
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
