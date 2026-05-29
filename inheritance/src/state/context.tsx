import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Document, DraftStatus } from "./types";
import {
  createEmptyDocument,
  docReducer,
  type DocAction,
  wrapDraft,
  unwrapDraft,
} from "./document";
import { ConfirmDialog, type ConfirmOptions } from "../components/ConfirmDialog";
import { extractDraftFromPdf } from "../pdf/generate";
import { DEFAULT_SOP_STAGES } from "../data/sop-template";

interface AppState {
  doc: Document;
  dispatch: Dispatch<DocAction>;
  draftStatus: DraftStatus;
  markModified: () => void;
  exportDraft: () => void;
  importDraft: (file: File, password?: string) => Promise<void>;
  clearAll: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  openPasswordModal: boolean;
  setOpenPasswordModal: (v: boolean) => void;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(docReducer, undefined, createEmptyDocument);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({ kind: "clean" });
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const settleConfirm = useCallback((result: boolean) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setConfirmState(null);
  }, []);

  const wrappedDispatch = useCallback(
    (action: DocAction) => {
      dispatch(action);
      if (action.type !== "LOAD_DOCUMENT" && action.type !== "CLEAR_ALL") {
        setDraftStatus({ kind: "modified" });
      }
    },
    [],
  );

  const markModified = useCallback(() => {
    setDraftStatus({ kind: "modified" });
  }, []);

  const exportDraft = useCallback(() => {
    const envelope = wrapDraft(doc);
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${doc.meta.familyName || "家庭"}-UNENCRYPTED-应急手册-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDraftStatus({ kind: "exported", at: Date.now() });
  }, [doc]);

  const importDraft = useCallback(
    async (file: File, password?: string) => {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let loaded;
      if (isPdf) {
        if (!password) throw new Error("导入加密 PDF 需要密码。");
        const bytes = await file.arrayBuffer();
        loaded = await extractDraftFromPdf(bytes, password);
      } else {
        const text = await file.text();
        const raw = JSON.parse(text);
        loaded = unwrapDraft(raw);
      }
      loaded.accessRemoved = false;
      loaded.sopRemoved = false;
      loaded.customRemoved = false;
      if (loaded.sopStages.length === 0) {
        loaded.sopStages = DEFAULT_SOP_STAGES();
      }
      dispatch({ type: "LOAD_DOCUMENT", document: loaded });
      setDraftStatus({ kind: "clean" });
    },
    [],
  );

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
    setDraftStatus({ kind: "clean" });
  }, []);

  return (
    <Ctx.Provider
      value={{
        doc,
        dispatch: wrappedDispatch,
        draftStatus,
        markModified,
        exportDraft,
        importDraft,
        clearAll,
        confirm,
        openPasswordModal,
        setOpenPasswordModal,
        privacyMode,
        setPrivacyMode,
      }}
    >
      {children}
      <ConfirmDialog
        open={confirmState !== null}
        options={confirmState}
        onConfirm={() => settleConfirm(true)}
        onCancel={() => settleConfirm(false)}
      />
    </Ctx.Provider>
  );
}
