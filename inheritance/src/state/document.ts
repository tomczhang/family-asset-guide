import type {
  Document,
  Asset,
  SealedEnvelope,
  TwoFactorEntry,
  SopStage,
  CustomSection,
  DraftEnvelope,
  DraftStatus,
} from "./types";
import { DEFAULT_SOP_STAGES } from "../data/sop-template";
import { DEFAULT_INSTITUTION, getInstitutionById } from "../data/institutions";

let nextId = 1;
export function genId(): string {
  return `id_${Date.now()}_${nextId++}`;
}

export function createEmptyDocument(): Document {
  return {
    meta: {
      familyName: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHolderHint: "",
    },
    assets: [],
    access: { twoFactorEntries: [], seals: [] },
    sopStages: DEFAULT_SOP_STAGES(),
    customSections: [],
  };
}

// --- Actions ---

export type DocAction =
  | { type: "SET_META"; field: keyof Document["meta"]; value: string }
  | { type: "ADD_ASSET" }
  | { type: "UPDATE_ASSET"; id: string; patch: Partial<Asset> }
  | { type: "REMOVE_ASSET"; id: string }
  | { type: "ADD_TWO_FACTOR"; assetId: string }
  | { type: "UPDATE_TWO_FACTOR"; id: string; patch: Partial<TwoFactorEntry> }
  | { type: "REMOVE_TWO_FACTOR"; id: string }
  | { type: "ADD_SEAL" }
  | { type: "UPDATE_SEAL"; id: string; patch: Partial<SealedEnvelope> }
  | { type: "REMOVE_SEAL"; id: string }
  | { type: "UPDATE_SOP_STAGE"; id: string; patch: Partial<SopStage> }
  | { type: "ADD_CUSTOM_SECTION" }
  | { type: "UPDATE_CUSTOM_SECTION"; id: string; patch: Partial<CustomSection> }
  | { type: "REMOVE_CUSTOM_SECTION"; id: string }
  | { type: "LOAD_DOCUMENT"; document: Document }
  | { type: "CLEAR_ALL" };

function touch(doc: Document): Document {
  return { ...doc, meta: { ...doc.meta, updatedAt: new Date().toISOString() } };
}

export function docReducer(state: Document, action: DocAction): Document {
  switch (action.type) {
    case "SET_META":
      return touch({ ...state, meta: { ...state.meta, [action.field]: action.value } });

    case "ADD_ASSET": {
      const defaultType = "us_stock" as const;
      const defaultInstId = DEFAULT_INSTITUTION[defaultType];
      const inst = getInstitutionById(defaultInstId);
      return touch({
        ...state,
        assets: [
          ...state.assets,
          {
            id: genId(),
            type: defaultType,
            institutionId: inst ? inst.id : "",
            institution: inst ? inst.name : "",
            accountNumber: "",
            loginUrl: inst ? inst.website : "",
            contactPhone: inst ? inst.phone : "",
            appDownload: inst ? inst.appDownload : "",
            estimatedValue: "",
            currency: "USD",
            hasBeneficiary: false,
            beneficiary: "",
            notes: "",
          },
        ],
      });
    }

    case "UPDATE_ASSET":
      return touch({
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a,
        ),
      });

    case "REMOVE_ASSET":
      return touch({
        ...state,
        assets: state.assets.filter((a) => a.id !== action.id),
        access: {
          ...state.access,
          twoFactorEntries: state.access.twoFactorEntries.filter(
            (t) => t.assetId !== action.id,
          ),
          seals: state.access.seals.map((s) => ({
            ...s,
            linkedAssetIds: s.linkedAssetIds.filter((id) => id !== action.id),
          })),
        },
      });

    case "ADD_TWO_FACTOR":
      return touch({
        ...state,
        access: {
          ...state.access,
          twoFactorEntries: [
            ...state.access.twoFactorEntries,
            {
              id: genId(),
              assetId: action.assetId,
              method: "totp",
              recoveryInstructions: "",
            },
          ],
        },
      });

    case "UPDATE_TWO_FACTOR":
      return touch({
        ...state,
        access: {
          ...state.access,
          twoFactorEntries: state.access.twoFactorEntries.map((t) =>
            t.id === action.id ? { ...t, ...action.patch } : t,
          ),
        },
      });

    case "REMOVE_TWO_FACTOR":
      return touch({
        ...state,
        access: {
          ...state.access,
          twoFactorEntries: state.access.twoFactorEntries.filter(
            (t) => t.id !== action.id,
          ),
        },
      });

    case "ADD_SEAL":
      return touch({
        ...state,
        access: {
          ...state.access,
          seals: [
            ...state.access.seals,
            {
              id: genId(),
              label: `密封件 #${String.fromCharCode(65 + state.access.seals.length)}`,
              location: "",
              linkedAssetIds: [],
              notes: "",
            },
          ],
        },
      });

    case "UPDATE_SEAL":
      return touch({
        ...state,
        access: {
          ...state.access,
          seals: state.access.seals.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
      });

    case "REMOVE_SEAL":
      return touch({
        ...state,
        access: {
          ...state.access,
          seals: state.access.seals.filter((s) => s.id !== action.id),
        },
      });

    case "UPDATE_SOP_STAGE":
      return touch({
        ...state,
        sopStages: state.sopStages.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      });

    case "ADD_CUSTOM_SECTION":
      return touch({
        ...state,
        customSections: [
          ...state.customSections,
          { id: genId(), title: "", content: "" },
        ],
      });

    case "UPDATE_CUSTOM_SECTION":
      return touch({
        ...state,
        customSections: state.customSections.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      });

    case "REMOVE_CUSTOM_SECTION":
      return touch({
        ...state,
        customSections: state.customSections.filter((s) => s.id !== action.id),
      });

    case "LOAD_DOCUMENT":
      return action.document;

    case "CLEAR_ALL":
      return createEmptyDocument();
  }
}

// --- Draft Envelope ---

const CURRENT_SCHEMA_VERSION = 1;

export function wrapDraft(doc: Document): DraftEnvelope {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    document: doc,
  };
}

export function unwrapDraft(raw: unknown): Document {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("schemaVersion" in raw) ||
    !("document" in raw)
  ) {
    throw new Error("无效的草稿文件格式");
  }
  const envelope = raw as DraftEnvelope;
  return migrate(envelope);
}

function migrate(envelope: DraftEnvelope): Document {
  if (envelope.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `草稿版本 ${envelope.schemaVersion} 高于当前支持版本 ${CURRENT_SCHEMA_VERSION}`,
    );
  }
  const doc = envelope.document;
  doc.assets = doc.assets.map((a) => {
    const asset = a as unknown as Record<string, unknown>;
    return {
      ...a,
      institutionId: (asset["institutionId"] as string) ?? "",
      appDownload: (asset["appDownload"] as string) ?? "",
      hasBeneficiary: (asset["hasBeneficiary"] as boolean) ?? false,
      beneficiary: (asset["beneficiary"] as string) ?? "",
    };
  });
  if (!doc.meta.passwordHolderHint) {
    doc.meta.passwordHolderHint = "";
  }
  return doc;
}

// --- Draft Status helpers ---

export function draftStatusLabel(status: DraftStatus): string {
  switch (status.kind) {
    case "clean":
      return "";
    case "modified":
      return "● 未导出";
    case "exported": {
      const mins = Math.floor((Date.now() - status.at) / 60_000);
      return `✓ 已导出 ${mins} 分钟前`;
    }
  }
}
