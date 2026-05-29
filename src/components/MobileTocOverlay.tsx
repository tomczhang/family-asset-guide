import "./MobileTocOverlay.css";

interface Props {
  open: boolean;
  currentStep: number;
  stepLabels: readonly string[];
  stepCounts: number[];
  onSelect: (step: number) => void;
  onClose: () => void;
}

export function MobileTocOverlay({ open, currentStep, stepLabels, stepCounts, onSelect, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="toc-overlay" onClick={onClose}>
      <div className="toc-panel" onClick={(e) => e.stopPropagation()}>
        <div className="toc-panel-header">
          <span className="toc-panel-title">目录</span>
          <button className="toc-panel-close" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="toc-panel-nav">
          {stepLabels.map((label, i) => (
            <button
              key={i}
              className={`toc-panel-item ${i === currentStep ? "toc-panel-item--active" : ""}`}
              onClick={() => onSelect(i)}
            >
              <span className="toc-panel-dot" />
              <span className="toc-panel-step-num">{i + 1}</span>
              <span className="toc-panel-label">{label}</span>
              {(stepCounts[i] ?? 0) > 0 && <span className="toc-panel-count">{stepCounts[i]}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
