import { useCallback, useState } from "react";
import { AppProvider, useAppState } from "./state/context";
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
import { generatePdf, downloadPdf } from "./pdf/generate";

const STEP_EDITORS: Array<() => JSX.Element> = [AssetEditor, AccessEditor, SopEditor, CustomSectionEditor];

export const STEP_LABELS = ["资产清单", "账户访问与 2FA", "五阶段 SOP", "自定义区"] as const;

function AppContent() {
  const { doc, openPasswordModal, setOpenPasswordModal } = useAppState();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const handleGenerate = useCallback(
    async (password: string) => {
      try {
        const bytes = await generatePdf(doc, password);
        downloadPdf(bytes, doc.meta.familyName);
        setOpenPasswordModal(false);
      } catch (err) {
        alert(`PDF 生成失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    },
    [doc, setOpenPasswordModal],
  );

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  }, []);

  const stepCounts = [
    doc.assets.length,
    doc.access.twoFactorEntries.length + doc.access.seals.length,
    doc.sopStages.length,
    doc.customSections.length,
  ];

  return (
    <>
      <Toolbar isMobile={isMobile} />
      <div className="app-layout">
        <main className="app-main">
          <div className="app-main-inner">
            <div style={{ marginBottom: "var(--sp-8)" }}>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "var(--stone-900)", marginBottom: "var(--sp-2)" }}>
                家庭资产<span className="gradient-text">应急手册</span>
              </h1>
              {!isMobile && (
                <p style={{ color: "var(--stone-500)", fontSize: 14 }}>
                  填写家庭资产信息，生成 AES-256 加密 PDF，确保跨境资产的有序传承与应急处置。
                </p>
              )}
            </div>

            {!isMobile && (
              <div className="warning-banner">
                ⚠ 本工具完全离线运行，不发送任何网络请求。所有数据仅存在于当前页面，关闭即丢失，请及时导出草稿。
              </div>
            )}

            {isMobile ? (
              (() => {
                const StepEditor = STEP_EDITORS[currentStep]!;
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
            currentStep={currentStep}
            totalSteps={4}
            onPrev={() => goToStep(currentStep - 1)}
            onNext={() => goToStep(currentStep + 1)}
            onGenerate={() => setOpenPasswordModal(true)}
            onOpenToc={() => setTocOpen(true)}
          />
          <MobileTocOverlay
            open={tocOpen}
            currentStep={currentStep}
            stepLabels={STEP_LABELS}
            stepCounts={stepCounts}
            onSelect={(step) => { setTocOpen(false); goToStep(step); }}
            onClose={() => setTocOpen(false)}
          />
        </>
      )}

      <PasswordModal
        open={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        onConfirm={handleGenerate}
      />
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
