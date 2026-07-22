import assert from "node:assert/strict";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createServer } from "vite";

const password = "pdf-regression-password";
const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true, hmr: false },
});

try {
  const pdfModule = await vite.ssrLoadModule("/src/pdf/generate.ts");
  const documentModule = await vite.ssrLoadModule("/src/state/document.ts");
  const mockModule = await vite.ssrLoadModule("/src/data/mock-data.ts");
  const {
    DEFAULT_PDF_OUTPUT_MODE,
    DRAFT_ATTACHMENT_NAME,
    buildAssetRows,
    capsForMode,
    createDraftDocumentForMode,
    extractDraftFromPdf,
  } = pdfModule;
  const { wrapDraft } = documentModule;
  const { createMockDocument } = mockModule;

  assert.equal(
    DEFAULT_PDF_OUTPUT_MODE,
    "full",
    "默认导出必须是包含可回导草稿的夫妻版",
  );

  const doc = createMockDocument("zh-CN");
  const assetWithNotes = doc.assets.find((asset) => asset.notes);
  assert.ok(assetWithNotes, "演示数据应包含备注，以覆盖 PDF 备注回归场景");

  for (const mode of ["full", "relative"]) {
    const caps = capsForMode(mode);
    const rows = buildAssetRows(assetWithNotes, caps, "zh-CN");
    assert.ok(
      rows.some((row) => row.label === "备注" && row.value === assetWithNotes.notes),
      `${mode} PDF 必须展示资产备注`,
    );
  }
  assert.equal(capsForMode("full").embedDraft, true);
  assert.equal(
    capsForMode("relative").embedDraft,
    true,
    "亲属版应内嵌可回导的脱敏草稿",
  );

  const relativeDraft = createDraftDocumentForMode(doc, "relative");
  assert.equal(relativeDraft.assets.length, doc.assets.length);
  assert.equal(relativeDraft.assets[0].institution, doc.assets[0].institution);
  assert.equal(relativeDraft.assets[0].accountNumber, doc.assets[0].accountNumber);
  assert.equal(relativeDraft.assets[0].notes, doc.assets[0].notes);
  assert.equal(relativeDraft.assets[0].estimatedValue, "");
  assert.equal(relativeDraft.assets[0].cashValue, "");
  assert.equal(relativeDraft.assets[0].companyGrantedStockValue, "");
  assert.equal(relativeDraft.assets[0].loginUsername, "");
  assert.equal(relativeDraft.assets[0].registerEmail, "");
  assert.equal(relativeDraft.assets[0].bindPhone, "");
  assert.equal(relativeDraft.meta.passwordHolderHint, "");
  assert.deepEqual(relativeDraft.access, { twoFactorEntries: [], seals: [] });
  assert.notEqual(relativeDraft, doc, "脱敏不能修改原始完整草稿");
  assert.notEqual(relativeDraft.assets[0], doc.assets[0], "资产脱敏必须使用副本");

  const pdf = await PDFDocument.create();
  pdf.addPage();
  await pdf.attach(
    new TextEncoder().encode(JSON.stringify(wrapDraft(doc))),
    DRAFT_ATTACHMENT_NAME,
    { mimeType: "application/json" },
  );
  pdf.encrypt({ userPassword: password, ownerPassword: password });
  const bytes = await pdf.save();
  const imported = await extractDraftFromPdf(bytes, password);
  assert.equal(imported.dataScope, "full");
  assert.equal(imported.document.assets.length, doc.assets.length);
  assert.equal(imported.document.assets[0].notes, doc.assets[0].notes);
  assert.equal(imported.document.meta.familyName, doc.meta.familyName);

  const futurePdf = await PDFDocument.create();
  futurePdf.addPage();
  await futurePdf.attach(
    new TextEncoder().encode(JSON.stringify({ schemaVersion: 999, document: doc })),
    DRAFT_ATTACHMENT_NAME,
    { mimeType: "application/json" },
  );
  futurePdf.encrypt({ userPassword: password, ownerPassword: password });
  const futureBytes = await futurePdf.save();
  await assert.rejects(
    () => extractDraftFromPdf(futureBytes, password),
    /草稿版本 999 高于当前支持版本/,
    "已识别的草稿校验错误不应被误报为“没有草稿”",
  );

  const relativePdf = await PDFDocument.create();
  relativePdf.addPage();
  await relativePdf.attach(
    new TextEncoder().encode(JSON.stringify(wrapDraft(relativeDraft, "relative"))),
    DRAFT_ATTACHMENT_NAME,
    { mimeType: "application/json" },
  );
  relativePdf.encrypt({ userPassword: password, ownerPassword: password });
  const relativeBytes = await relativePdf.save();
  const importedRelative = await extractDraftFromPdf(relativeBytes, password);
  assert.equal(importedRelative.dataScope, "relative");
  assert.equal(importedRelative.document.assets.length, doc.assets.length);
  assert.equal(importedRelative.document.assets[0].notes, doc.assets[0].notes);
  assert.equal(importedRelative.document.assets[0].estimatedValue, "");
  assert.equal(importedRelative.document.assets[0].loginUsername, "");
  assert.deepEqual(importedRelative.document.access, { twoFactorEntries: [], seals: [] });

  const legacyRelativePdf = await PDFDocument.create();
  legacyRelativePdf.addPage();
  legacyRelativePdf.encrypt({ userPassword: password, ownerPassword: password });
  const legacyRelativeBytes = await legacyRelativePdf.save();
  await assert.rejects(
    () => extractDraftFromPdf(legacyRelativeBytes, password),
    /可能由旧版本生成/,
    "旧版不含草稿的 PDF 应给出兼容性提示",
  );

  console.log("PDF regression tests passed");
} finally {
  await vite.close();
}
