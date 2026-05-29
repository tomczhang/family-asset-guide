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

function AppContent() {
  const { doc, dispatch, openPasswordModal, setOpenPasswordModal } = useAppState();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const steps: Array<{ Editor: () => JSX.Element | null; label: string; count: number }> = [
    { Editor: AssetEditor, label: "资产清单", count: doc.assets.length },
    ...(doc.accessRemoved
      ? []
      : [{ Editor: AccessEditor, label: "密码指引", count: doc.access.seals.length }]),
    ...(doc.sopRemoved
      ? []
      : [{ Editor: SopEditor, label: "紧急响应流程", count: doc.sopStages.length }]),
    ...(doc.customRemoved
      ? []
      : [{ Editor: CustomSectionEditor, label: "自定义区", count: doc.customSections.length }]),
  ];
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepLabels = steps.map((s) => s.label);
  const stepCounts = steps.map((s) => s.count);

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
                  维护家庭应急手册是一个晴天修屋顶的操作，雨什么时候下我们说不准，但趁着晴天把屋顶修结实，才能给自己和家人一份真的踏实。
                </p>
              )}
            </div>

            {!isMobile && (
              <div className="warning-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--sp-2)" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 1.8 }}>
                  <li>✈️ 完全离线运行，数据不经过任何服务器，零泄露风险</li>
                  <li>🔐 导出为 AES-256 加密 PDF，军事级安全防护</li>
                  <li>⚡ 选机构 → 填账号、资产、密码保存地 → 一键生成，三步极简</li>
                  <li>⚠️ 所有数据仅存在于当前页面，关闭即丢失，请及时导出草稿</li>
                </ul>
              </div>
            )}

            <div className="card" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">家庭姓氏</label>
                  <input
                    className="field-input"
                    placeholder="例：张"
                    value={doc.meta.familyName}
                    onChange={(e) => dispatch({ type: "SET_META", field: "familyName", value: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
                <div className="field">
                  <label className="field-label">密码持有人</label>
                  <input
                    className="field-input"
                    placeholder="例：配偶张明 / 李律师"
                    value={doc.meta.passwordHolderHint}
                    onChange={(e) => dispatch({ type: "SET_META", field: "passwordHolderHint", value: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
            </div>

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
            onGenerate={() => setOpenPasswordModal(true)}
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
