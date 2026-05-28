import {
  createContext,
  useContext,
  useReducer,
  useCallback,
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

interface AppState {
  doc: Document;
  dispatch: Dispatch<DocAction>;
  draftStatus: DraftStatus;
  markModified: () => void;
  exportDraft: () => void;
  importDraft: (file: File) => Promise<void>;
  clearAll: () => void;
  openPasswordModal: boolean;
  setOpenPasswordModal: (v: boolean) => void;
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
    async (file: File) => {
      const text = await file.text();
      const raw = JSON.parse(text);
      const loaded = unwrapDraft(raw);
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
        openPasswordModal,
        setOpenPasswordModal,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
