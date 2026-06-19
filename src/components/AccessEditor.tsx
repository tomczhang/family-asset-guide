import { useState, useEffect, useRef } from "react";
import { useAppState } from "../state/context";
import type { SealedEnvelope, TwoFactorMethod, AssetType } from "../state/types";
import type { Locale } from "../i18n/locale";
import { t, assetTypeLabel } from "../i18n";

function assetDisplayName(
  asset: { institution: string; type: string; accountNumber: string },
  index: number,
  locale: Locale,
): string {
  const name = asset.institution || assetTypeLabel(locale, asset.type as AssetType) || asset.type;
  const suffix = asset.accountNumber ? ` (${asset.accountNumber})` : ` #${index + 1}`;
  return `${name}${suffix}`;
}

function CollapsedSeal({
  seal,
  index,
  sealLabel,
  locale,
  onEdit,
  onDelete,
}: {
  seal: SealedEnvelope;
  index: number;
  sealLabel: string;
  locale: Locale;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-3) var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: 13, color: "var(--stone-700)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sealLabel}
        </span>
        <span style={{ fontSize: 12, color: "var(--stone-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {seal.location || "—"}
        </span>
        <span style={{ marginLeft: "auto", flexShrink: 0 }} />
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} onClick={onEdit}>{t(locale, "common.edit")}</button>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} onClick={onDelete}>{t(locale, "common.delete")}</button>
      </div>
    </div>
  );
}

export function AccessEditor() {
  const { doc, dispatch, confirm, locale } = useAppState();
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedSeal, setExpandedSeal] = useState<string | null>(null);
  const prevSealCount = useRef(doc.access.seals.length);

  useEffect(() => {
    if (doc.access.seals.length > prevSealCount.current) {
      const last = doc.access.seals[doc.access.seals.length - 1];
      if (last) setExpandedSeal(last.id);
    }
    prevSealCount.current = doc.access.seals.length;
  }, [doc.access.seals]);

  const handleSectionClick = (e: React.MouseEvent) => {
    if (!expandedSeal) return;
    const target = e.target as HTMLElement;
    if (target.closest(".card")) return;
    setExpandedSeal(null);
  };

  if (doc.accessRemoved) return null;

  return (
    <section className="section" id="chapter-access" ref={sectionRef} onClick={handleSectionClick}>
      <div className="section-header">
        <span className="section-badge">{t(locale, "access.badge")}</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const ok = await confirm({
              title: t(locale, "confirmModule.title", { module: t(locale, "access.badge") }),
              message: t(locale, "confirmModule.message"),
              confirmText: t(locale, "common.deleteModule"),
            });
            if (ok) dispatch({ type: "REMOVE_ACCESS_MODULE" });
          }}
        >
          {t(locale, "common.deleteModule")}
        </button>
      </div>
      <div className="section-body">
        <p style={{ color: "var(--stone-500)", fontSize: 12, marginBottom: "var(--sp-4)" }}>
          {t(locale, "access.intro")}
        </p>

        {doc.access.seals.map((seal, i) => {
          const linkedNames = seal.linkedAssetIds
            .map((id) => {
              const idx = doc.assets.findIndex((a) => a.id === id);
              if (idx === -1) return null;
              return doc.assets[idx]!.institution || assetTypeLabel(locale, doc.assets[idx]!.type);
            })
            .filter(Boolean);
          const uniqueNames = [...new Set(linkedNames)];
          const sealLabel = uniqueNames.length > 0
            ? uniqueNames.join(locale === "en" ? ", " : "、")
            : t(locale, "access.sealFallback", { n: i + 1 });

          if (seal.id !== expandedSeal) {
            return (
              <CollapsedSeal
                key={seal.id}
                seal={seal}
                index={i}
                sealLabel={sealLabel}
                locale={locale}
                onEdit={() => setExpandedSeal(seal.id)}
                onDelete={() => dispatch({ type: "REMOVE_SEAL", id: seal.id })}
              />
            );
          }

          return (
            <div className="card" key={seal.id}>
              <div className="card-header">
                <span className="card-number">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedSeal(null)}>{t(locale, "common.collapse")}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "REMOVE_SEAL", id: seal.id })}>{t(locale, "common.delete")}</button>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--stone-700)", marginBottom: "var(--sp-3)" }}>
                {sealLabel}
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "access.fLocation")}</label>
                  <input
                    className="field-input"
                    placeholder={t(locale, "access.fLocationPlaceholder")}
                    value={seal.location}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { location: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "access.fPasswordHint")}</label>
                  <input
                    className="field-input"
                    placeholder={t(locale, "access.fPasswordHintPlaceholder")}
                    value={seal.passwordHint}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { passwordHint: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">{t(locale, "access.fTwoFactor")}</label>
                  <select
                    className="field-input"
                    value={seal.twoFactorMethod}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { twoFactorMethod: e.target.value as TwoFactorMethod | "none" } })
                    }
                  >
                    <option value="none">{t(locale, "access.twoFactorNone")}</option>
                    <option value="totp">{t(locale, "access.twoFactorTotp")}</option>
                    <option value="sms">{t(locale, "access.twoFactorSms")}</option>
                    <option value="hardware_key">{t(locale, "access.twoFactorHardware")}</option>
                    <option value="email">{t(locale, "access.twoFactorEmail")}</option>
                    <option value="other">{t(locale, "access.twoFactorOther")}</option>
                  </select>
                </div>
                {seal.twoFactorMethod !== "none" && (
                  <div className="field">
                    <label className="field-label">{t(locale, "access.fTwoFactorRecovery")}</label>
                    <input
                      className="field-input"
                      placeholder={t(locale, "access.fTwoFactorRecoveryPlaceholder")}
                      value={seal.twoFactorRecovery}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { twoFactorRecovery: e.target.value } })
                      }
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                )}
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "access.fLinkedAssets")}</label>
                  <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                    {(() => {
                      const seen = new Map<string, { ids: string[]; label: string }>();
                      doc.assets.forEach((a, idx) => {
                        const key = `${a.institution}||${a.accountNumber}`;
                        if (!seen.has(key)) {
                          seen.set(key, { ids: [a.id], label: assetDisplayName(a, idx, locale) });
                        } else {
                          seen.get(key)!.ids.push(a.id);
                        }
                      });
                      return Array.from(seen.values()).map(({ ids, label }) => {
                        const linked = ids.some((id) => seal.linkedAssetIds.includes(id));
                        return (
                          <button
                            key={ids[0]}
                            className={`btn btn-sm ${linked ? "btn-amber" : "btn-secondary"}`}
                            onClick={() => {
                              const newIds = linked
                                ? seal.linkedAssetIds.filter((x) => !ids.includes(x))
                                : [...seal.linkedAssetIds, ...ids.filter((id) => !seal.linkedAssetIds.includes(id))];
                              dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { linkedAssetIds: newIds } });
                            }}
                          >
                            {label}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              <div className="field-group full">
                <div className="field">
                  <label className="field-label">{t(locale, "access.fNotes")}</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    placeholder={t(locale, "access.fNotesPlaceholder")}
                    value={seal.notes}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_SEAL", id: seal.id, patch: { notes: e.target.value } })
                    }
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <button className="btn btn-secondary" onClick={() => dispatch({ type: "ADD_SEAL" })}>
          {t(locale, "access.add")}
        </button>
      </div>
    </section>
  );
}
