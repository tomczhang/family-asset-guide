import { useCallback, useEffect, useState } from "react";
import { AppProvider, useAppState } from "./state/context";
import { createMockDocument } from "./data/mock-data";
import { useIsMobile } from "./hooks/useIsMobile";
import { Toolbar } from "./components/Toolbar";
import { TableOfContents } from "./components/TableOfContents";
import { AssetEditor } from "./components/AssetCard";
import { AccessEditor } from "./components/AccessEditor";
import { SopEditor } from "./components/SopEditor";
import { CustomSectionEditor } from "./components/CustomSectionEditor";
import { MobileStepperBar } from "./components/MobileStepperBar";
import { MobileTocOverlay } from "./components/MobileTocOverlay";
import { PasswordModal } from "./components/PasswordModal";
import { generatePdf, downloadPdf, prefetchFont } from "./pdf/generate";
import type { PdfOutputMode } from "./pdf/generate";
import { t } from "./i18n";

function AppContent() {
  const { doc, dispatch, openPasswordModal, setOpenPasswordModal, locale } = useAppState();
  const isEmpty = doc.assets.length === 0 && doc.access.seals.length === 0;
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const [showWechatTip, setShowWechatTip] = useState(false);

  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  const [fontStatus, setFontStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fontProgress, setFontProgress] = useState(0);
  const [fontHintVisible, setFontHintVisible] = useState(true);

  // 页面加载后立即后台预拉字体，趁联网时存入缓存，之后断网也能离线生成 PDF。
  // 同时把下载进度与状态反馈给用户，让其知道何时可以安全断网。
  useEffect(() => {
    let cancelled = false;
    prefetchFont((ratio) => {
      if (!cancelled) setFontProgress(Math.round(ratio * 100));
    })
      .then((ok) => {
        if (cancelled) return;
        setFontStatus(ok ? "ready" : "error");
        if (ok) window.setTimeout(() => setFontHintVisible(false), 4000);
      })
      .catch(() => {
        if (!cancelled) setFontStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenPdfModal = () => {
    if (isWechat) {
      setShowWechatTip(true);
    } else {
      setOpenPasswordModal(true);
    }
  };

  const steps: Array<{ Editor: () => JSX.Element | null; label: string; count: number }> = [
    { Editor: AssetEditor, label: t(locale, "chapters.assets"), count: doc.assets.length },
    ...(doc.accessRemoved
      ? []
      : [{ Editor: AccessEditor, label: t(locale, "chapters.access"), count: doc.access.seals.length }]),
    ...(doc.sopRemoved
      ? []
      : [{ Editor: SopEditor, label: t(locale, "chapters.sop"), count: doc.sopStages.length }]),
    ...(doc.customRemoved
      ? []
      : [{ Editor: CustomSectionEditor, label: t(locale, "chapters.custom"), count: doc.customSections.length }]),
  ];
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepLabels = steps.map((s) => s.label);
  const stepCounts = steps.map((s) => s.count);

  const handleGenerate = useCallback(
    async (password: string, mode: PdfOutputMode) => {
      setPdfGenerating(true);
      setPdfStatus("");
      try {
        const bytes = await generatePdf(doc, password, setPdfStatus, { mode, locale });
        await downloadPdf(bytes, mode, locale);
        setOpenPasswordModal(false);
      } catch (err) {
        alert(`${t(locale, "app.pdfFailed")}: ${err instanceof Error ? err.message : t(locale, "common.unknownError")}`);
      } finally {
        setPdfGenerating(false);
        setPdfStatus("");
      }
    },
    [doc, setOpenPasswordModal, locale],
  );

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <Toolbar isMobile={isMobile} />
      {fontHintVisible && (
        <div className={`font-hint font-hint--${fontStatus}`} role="status">
          {fontStatus === "loading" && (
            <>
              <span>{t(locale, "app.fontLoading", { percent: fontProgress })}</span>
              <span className="font-hint-bar">
                <i style={{ width: `${fontProgress}%` }} />
              </span>
            </>
          )}
          {fontStatus === "ready" && t(locale, "app.fontReady")}
          {fontStatus === "error" && (
            <>
              {t(locale, "app.fontError")}
              <button type="button" className="font-hint-close" onClick={() => setFontHintVisible(false)}>
                ✕
              </button>
            </>
          )}
        </div>
      )}
      <div className="app-layout">
        <main className="app-main">
          <div className="app-main-inner">
            <div style={{ marginBottom: "var(--sp-8)" }}>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "var(--stone-900)", marginBottom: "var(--sp-2)" }}>
                {t(locale, "app.titleLead")}<span className="gradient-text">{t(locale, "app.titleHighlight")}</span>
              </h1>
              {!isMobile && (
                <p style={{ color: "var(--stone-500)", fontSize: 14 }}>
                  {t(locale, "app.subtitle")}
                </p>
              )}
            </div>

            {!isMobile && (
              <div className="warning-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--sp-2)" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 1.8 }}>
                  <li>{t(locale, "app.feature1")}</li>
                  <li>{t(locale, "app.feature2")}</li>
                  <li>{t(locale, "app.feature3")}</li>
                  <li>{t(locale, "app.feature4")}</li>
                </ul>
              </div>
            )}

            {isEmpty && (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: "var(--sp-8) var(--sp-4)",
                  marginBottom: "var(--sp-6)",
                  border: "1.5px dashed var(--amber-300)",
                  background: "var(--amber-50)",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--stone-700)", marginBottom: "var(--sp-2)" }}>
                  {t(locale, "app.emptyTitle")}
                </p>
                <p style={{ fontSize: 13, color: "var(--stone-500)", marginBottom: "var(--sp-4)" }}>
                  {t(locale, "app.emptyBody")}
                </p>
                <button
                  className="btn btn-amber"
                  onClick={() => dispatch({ type: "LOAD_DOCUMENT", document: createMockDocument(locale) })}
                >
                  {t(locale, "toolbar.demoDataLong")}
                </button>
              </div>
            )}

            {isMobile ? (
              (() => {
                const StepEditor = steps[safeStep]!.Editor;
                return <StepEditor />;
              })()
            ) : (
              <>
                <AssetEditor />
                <AccessEditor />
                <SopEditor />
                <CustomSectionEditor />
              </>
            )}
          </div>
        </main>
        {!isMobile && <TableOfContents />}
      </div>

      {isMobile && (
        <>
          <MobileStepperBar
            currentStep={safeStep}
            totalSteps={steps.length}
            currentLabel={stepLabels[safeStep] ?? ""}
            onPrev={() => goToStep(safeStep - 1)}
            onNext={() => goToStep(safeStep + 1)}
            onGenerate={handleOpenPdfModal}
            onOpenToc={() => setTocOpen(true)}
          />
          <MobileTocOverlay
            open={tocOpen}
            currentStep={safeStep}
            stepLabels={stepLabels}
            stepCounts={stepCounts}
            onSelect={(step) => { setTocOpen(false); goToStep(step); }}
            onClose={() => setTocOpen(false)}
          />
        </>
      )}

      <PasswordModal
        open={openPasswordModal}
        generating={pdfGenerating}
        statusMessage={pdfStatus}
        onClose={() => setOpenPasswordModal(false)}
        onConfirm={handleGenerate}
      />

      {showWechatTip && (
        <div className="modal-overlay" onClick={() => setShowWechatTip(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{t(locale, "app.wechatTitle")}</div>
            <p style={{ color: "var(--stone-600)", fontSize: 13, lineHeight: 1.7 }}>
              {t(locale, "app.wechatBodyBefore")}
              <strong> ··· </strong>{t(locale, "app.wechatBodyAfter")}<strong>{t(locale, "app.wechatBodyMenu")}</strong>{t(locale, "app.wechatBodyEnd")}
            </p>
            <div style={{ marginTop: "var(--sp-4)" }}>
              <button
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setShowWechatTip(false);
                }}
              >
                {t(locale, "app.wechatCopyLink")}
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowWechatTip(false)}>
                {t(locale, "app.wechatGotIt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
