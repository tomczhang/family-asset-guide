import { STEP_LABELS } from "../App";
import "./MobileStepperBar.css";

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onGenerate: () => void;
  onOpenToc: () => void;
}

export function MobileStepperBar({ currentStep, totalSteps, onPrev, onNext, onGenerate, onOpenToc }: Props) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="mobile-stepper-bar">
      <div className="mobile-stepper-bar-inner">
        {isFirst ? (
          <div className="stepper-btn-placeholder" />
        ) : (
          <button className="stepper-btn stepper-btn-prev" onClick={onPrev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            上一步
          </button>
        )}

        <div className="stepper-indicator">
          <span className="stepper-step-label">{STEP_LABELS[currentStep]}</span>
          <span className="stepper-step-count">{currentStep + 1} / {totalSteps}</span>
        </div>

        {isLast ? (
          <button className="stepper-btn stepper-btn-generate" onClick={onGenerate}>
            生成 PDF
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </button>
        ) : (
          <button className="stepper-btn stepper-btn-next" onClick={onNext}>
            下一步
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      <button className="mobile-fab" onClick={onOpenToc} aria-label="打开目录">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="9" y2="18" />
        </svg>
      </button>
    </div>
  );
}
