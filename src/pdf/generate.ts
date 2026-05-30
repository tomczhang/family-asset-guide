import { PDFDocument, rgb, type PDFPage, type PDFFont } from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Document } from "../state/types";
import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";
import { wrapDraft, unwrapDraft } from "../state/document";

export const DRAFT_ATTACHMENT_NAME = "family-asset-guide-draft.json";

// 从（加密的）PDF 中提取此前嵌入的草稿数据，用于直接导入 PDF 继续编辑。
export async function extractDraftFromPdf(
  bytes: Uint8Array | ArrayBuffer,
  password: string,
): Promise<Document> {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { password });
  } catch {
    throw new Error("密码错误，或该 PDF 无法解锁。");
  }

  const attachments = pdf.getAttachments();
  if (attachments.length === 0) {
    throw new Error("此 PDF 不包含可导入的草稿数据（可能由旧版本生成）。");
  }

  for (const att of attachments) {
    try {
      const text = new TextDecoder().decode(att.data);
      const raw = JSON.parse(text);
      if (raw && typeof raw === "object" && "schemaVersion" in raw && "document" in raw) {
        return unwrapDraft(raw);
      }
    } catch {
      // 跳过无法解析的附件，继续尝试下一个
    }
  }

  throw new Error("此 PDF 不包含可导入的草稿数据（可能由旧版本生成）。");
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  black: rgb(0.11, 0.1, 0.09),
  dark: rgb(0.16, 0.15, 0.14),
  body: rgb(0.34, 0.33, 0.31),
  muted: rgb(0.47, 0.44, 0.41),
  light: rgb(0.66, 0.63, 0.62),
  border: rgb(0.91, 0.9, 0.89),
  amber700: rgb(0.71, 0.33, 0.04),
  amber100: rgb(0.996, 0.953, 0.78),
  amberBg: rgb(1, 0.984, 0.92),
  amberBorder: rgb(0.98, 0.84, 0.46),
  white: rgb(1, 1, 1),
};

interface Ctx {
  pdf: PDFDocument;
  font: PDFFont;
  page: PDFPage;
  y: number;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: COLORS.amber700 });
}

function need(ctx: Ctx, h: number): void {
  if (ctx.y - h < MARGIN + 30) newPage(ctx);
}

function textBaseline(boxBottom: number, boxH: number, fontSize: number): number {
  return boxBottom + (boxH - fontSize) / 2 + fontSize * 0.15;
}

function drawText(ctx: Ctx, text: string, size: number, color = COLORS.body, x = MARGIN, lineHeight?: number): void {
  const maxW = PAGE_W - x - MARGIN;
  const lines = wrapText(text, ctx.font, size, maxW);
  const lineH = lineHeight ?? size * 1.8;
  for (const line of lines) {
    need(ctx, lineH);
    ctx.page.drawText(line, { x, y: ctx.y, size, font: ctx.font, color });
    ctx.y -= lineH;
  }
}

function drawBoxedText(
  ctx: Ctx, text: string, fontSize: number, boxH: number,
  opts: { bgColor?: typeof COLORS.white; borderColor?: typeof COLORS.border; textColor?: typeof COLORS.body; x?: number; width?: number },
): void {
  const x = opts.x ?? MARGIN;
  const w = opts.width ?? CONTENT_W;
  need(ctx, boxH + 4);
  const boxY = ctx.y - boxH;
  ctx.page.drawRectangle({
    x, y: boxY, width: w, height: boxH,
    color: opts.bgColor, borderColor: opts.borderColor, borderWidth: opts.borderColor ? 0.5 : 0,
  });
  ctx.page.drawText(text, {
    x: x + 12, y: textBaseline(boxY, boxH, fontSize),
    size: fontSize, font: ctx.font, color: opts.textColor ?? COLORS.body,
  });
  ctx.y = boxY - 4;
}

function drawSectionHeader(ctx: Ctx, badge: string, title: string): void {
  need(ctx, 40);
  ctx.y -= 8;

  const badgeH = 22;
  const badgeW = ctx.font.widthOfTextAtSize(badge, 10) + 18;
  const badgeY = ctx.y - badgeH;

  ctx.page.drawRectangle({ x: MARGIN, y: badgeY, width: badgeW, height: badgeH, color: COLORS.amber100 });
  ctx.page.drawText(badge, {
    x: MARGIN + 9, y: textBaseline(badgeY, badgeH, 10),
    size: 10, font: ctx.font, color: COLORS.amber700,
  });

  if (title) {
    ctx.page.drawText(title, {
      x: MARGIN + badgeW + 10, y: textBaseline(badgeY, badgeH, 11),
      size: 11, font: ctx.font, color: COLORS.muted,
    });
  }

  const lineX = MARGIN + badgeW + (title ? ctx.font.widthOfTextAtSize(title, 11) + 20 : 10);
  const lineY = badgeY + badgeH / 2;
  ctx.page.drawLine({
    start: { x: lineX, y: lineY }, end: { x: PAGE_W - MARGIN, y: lineY },
    thickness: 0.5, color: COLORS.border,
  });

  ctx.y = badgeY - 14;
}

function drawCard(ctx: Ctx, num: string, rows: { label: string; value: string }[]): void {
  const rowH = 18;
  const padTop = 10;
  const padBot = 10;
  let totalRows = 0;
  const wrappedRows: { label: string; lines: string[] }[] = [];
  const maxValW = CONTENT_W - 110;

  for (const { label, value } of rows) {
    const lines = wrapText(value || "—", ctx.font, 9.5, maxValW);
    wrappedRows.push({ label, lines });
    totalRows += Math.max(lines.length, 1);
  }

  const cardH = padTop + totalRows * rowH + padBot;
  need(ctx, cardH + 4);
  const cardY = ctx.y - cardH;

  ctx.page.drawRectangle({
    x: MARGIN, y: cardY, width: CONTENT_W, height: cardH,
    borderColor: COLORS.border, borderWidth: 0.5, color: COLORS.white,
  });

  ctx.page.drawText(num, {
    x: MARGIN + 10, y: textBaseline(cardY + cardH - padTop - rowH, rowH, 9),
    size: 9, font: ctx.font, color: COLORS.light,
  });

  let rowY = cardY + cardH - padTop;
  for (const { label, lines } of wrappedRows) {
    ctx.page.drawText(label, {
      x: MARGIN + 32, y: textBaseline(rowY - rowH, rowH, 9),
      size: 9, font: ctx.font, color: COLORS.muted,
    });
    for (const l of lines) {
      ctx.page.drawText(l, {
        x: MARGIN + 104, y: textBaseline(rowY - rowH, rowH, 9.5),
        size: 9.5, font: ctx.font, color: COLORS.dark,
      });
      rowY -= rowH;
    }
  }

  ctx.y = cardY - 6;
}

interface AssetRow {
  label: string;
  value: string;
  highlight?: boolean;
  dividerBefore?: boolean;
}

function drawAssetCard(
  ctx: Ctx, num: string, title: string, typeBadge: string, rows: AssetRow[],
): void {
  const titleH = 26;
  const rowH = 18;
  const highlightRowH = 22;
  const padTop = 8;
  const padBot = 8;
  const divGap = 6;
  const maxValW = CONTENT_W - 110;

  const wrappedRows: { label: string; lines: string[]; highlight: boolean; dividerBefore: boolean; rh: number }[] = [];
  let bodyH = padTop + padBot;

  for (const { label, value, highlight, dividerBefore } of rows) {
    const rh = highlight ? highlightRowH : rowH;
    const fs = highlight ? 11 : 9.5;
    const lines = wrapText(value || "—", ctx.font, fs, maxValW);
    wrappedRows.push({ label, lines, highlight: !!highlight, dividerBefore: !!dividerBefore, rh });
    if (dividerBefore) bodyH += divGap;
    bodyH += Math.max(lines.length, 1) * rh;
  }

  const cardH = titleH + bodyH;
  need(ctx, cardH + 4);
  const cardY = ctx.y - cardH;

  ctx.page.drawRectangle({
    x: MARGIN, y: cardY, width: CONTENT_W, height: cardH,
    borderColor: COLORS.border, borderWidth: 0.5, color: COLORS.white,
  });

  const titleBarY = cardY + bodyH;
  ctx.page.drawRectangle({
    x: MARGIN + 0.25, y: titleBarY, width: CONTENT_W - 0.5, height: titleH,
    color: COLORS.amber100,
  });

  ctx.page.drawText(num, {
    x: MARGIN + 10, y: textBaseline(titleBarY, titleH, 9),
    size: 9, font: ctx.font, color: COLORS.amber700,
  });
  ctx.page.drawText(title, {
    x: MARGIN + 30, y: textBaseline(titleBarY, titleH, 10.5),
    size: 10.5, font: ctx.font, color: COLORS.amber700,
  });

  const badgeW = ctx.font.widthOfTextAtSize(typeBadge, 8) + 12;
  const badgeH = 15;
  const badgeX = MARGIN + CONTENT_W - badgeW - 8;
  const badgeY = titleBarY + (titleH - badgeH) / 2;
  ctx.page.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: badgeH, color: COLORS.amber700 });
  ctx.page.drawText(typeBadge, {
    x: badgeX + 6, y: textBaseline(badgeY, badgeH, 8),
    size: 8, font: ctx.font, color: COLORS.white,
  });

  ctx.page.drawLine({
    start: { x: MARGIN, y: titleBarY }, end: { x: MARGIN + CONTENT_W, y: titleBarY },
    thickness: 0.5, color: COLORS.border,
  });

  let rowY = titleBarY - padTop;
  for (const { label, lines, highlight, dividerBefore, rh } of wrappedRows) {
    if (dividerBefore) {
      rowY -= divGap / 2;
      ctx.page.drawLine({
        start: { x: MARGIN + 10, y: rowY }, end: { x: MARGIN + CONTENT_W - 10, y: rowY },
        thickness: 0.3, color: COLORS.border,
      });
      rowY -= divGap / 2;
    }

    const valueSize = highlight ? 11 : 9.5;
    const valueColor = highlight ? COLORS.amber700 : COLORS.dark;
    const labelColor = highlight ? COLORS.amber700 : COLORS.muted;

    ctx.page.drawText(label, {
      x: MARGIN + 12, y: textBaseline(rowY - rh, rh, 9),
      size: 9, font: ctx.font, color: labelColor,
    });
    for (const l of lines) {
      ctx.page.drawText(l, {
        x: MARGIN + 104, y: textBaseline(rowY - rh, rh, valueSize),
        size: valueSize, font: ctx.font, color: valueColor,
      });
      rowY -= rh;
    }
  }

  ctx.y = cardY - 6;
}

function drawSopCard(ctx: Ctx, num: string, title: string, content: string): void {
  const titleH = 26;
  const rowH = 18;
  const padTop = 8;
  const padBot = 8;
  const contentX = MARGIN + 12;
  const maxW = CONTENT_W - 24;

  const allLines: string[] = [];
  for (const raw of content.split("\n")) {
    if (!raw.trim()) continue;
    const wrapped = wrapText(raw, ctx.font, 9.5, maxW);
    allLines.push(...wrapped);
  }

  const bodyH = padTop + allLines.length * rowH + padBot;
  const cardH = titleH + bodyH;
  need(ctx, cardH + 4);
  const cardY = ctx.y - cardH;

  ctx.page.drawRectangle({
    x: MARGIN, y: cardY, width: CONTENT_W, height: cardH,
    borderColor: COLORS.border, borderWidth: 0.5, color: COLORS.white,
  });

  const titleBarY = cardY + bodyH;
  ctx.page.drawRectangle({
    x: MARGIN + 0.25, y: titleBarY, width: CONTENT_W - 0.5, height: titleH,
    color: COLORS.amber100,
  });

  ctx.page.drawText(num, {
    x: MARGIN + 10, y: textBaseline(titleBarY, titleH, 9),
    size: 9, font: ctx.font, color: COLORS.amber700,
  });
  ctx.page.drawText(title, {
    x: MARGIN + 30, y: textBaseline(titleBarY, titleH, 10.5),
    size: 10.5, font: ctx.font, color: COLORS.amber700,
  });

  ctx.page.drawLine({
    start: { x: MARGIN, y: titleBarY }, end: { x: MARGIN + CONTENT_W, y: titleBarY },
    thickness: 0.5, color: COLORS.border,
  });

  let rowY = titleBarY - padTop;
  for (const line of allLines) {
    ctx.page.drawText(line, {
      x: contentX, y: textBaseline(rowY - rowH, rowH, 9.5),
      size: 9.5, font: ctx.font, color: COLORS.dark,
    });
    rowY -= rowH;
  }

  ctx.y = cardY - 6;
}

function drawDivider(ctx: Ctx): void {
  ctx.y -= 4;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y }, end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.5, color: COLORS.border,
  });
  ctx.y -= 8;
}

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  if (!text) return [];
  const result: string[] = [];
  for (const raw of text.split("\n")) {
    if (!raw) { result.push(""); continue; }
    let cur = "";
    for (const ch of raw) {
      const test = cur + ch;
      try {
        if (font.widthOfTextAtSize(test, size) > maxW && cur) {
          result.push(cur);
          cur = ch;
        } else {
          cur = test;
        }
      } catch {
        cur += " ";
      }
    }
    if (cur) result.push(cur);
  }
  return result;
}

const PREFERRED_FONTS = [
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
  "Noto Sans CJK SC", "Noto Sans SC", "STHeiti", "SimHei",
];

const FONT_CACHE = "font-cache-v1";
const CDN_TTF = "https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf";

async function fetchWithCache(url: string): Promise<ArrayBuffer> {
  try {
    const cache = await caches.open(FONT_CACHE);
    const cached = await cache.match(url);
    if (cached) return cached.arrayBuffer();
    const resp = await fetch(url);
    if (!resp.ok) throw new Error();
    cache.put(url, resp.clone());
    return resp.arrayBuffer();
  } catch {
    const resp = await fetch(url);
    if (resp.ok) return resp.arrayBuffer();
    throw new Error("无法加载字体文件。");
  }
}

async function loadSystemFont(): Promise<ArrayBuffer> {
  if ("queryLocalFonts" in window) {
    try {
      const fonts = await (window as any).queryLocalFonts();
      for (const name of PREFERRED_FONTS) {
        const match = fonts.find((f: any) => f.family === name && f.style === "Regular");
        if (match) return (await match.blob()).arrayBuffer();
      }
      const fallback = fonts.find(
        (f: any) => f.style === "Regular" && /sc|cn|gb|hei|song|fang/i.test(f.family),
      );
      if (fallback) return (await fallback.blob()).arrayBuffer();
    } catch {}
  }
  try {
    return await fetchWithCache(CDN_TTF);
  } catch {
    return fetchWithCache("NotoSansSC-Regular.otf");
  }
}

// ===================== Main =====================

export async function generatePdf(
  doc: Document,
  password: string,
  onStatus?: (msg: string) => void,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  let font: PDFFont;
  try {
    const fontBytes = await loadSystemFont();
    font = await pdf.embedFont(fontBytes, { subset: false });
  } catch {
    onStatus?.("当前字体不兼容，正在下载备用字体…");
    let fallbackBytes: ArrayBuffer;
    try {
      fallbackBytes = await fetchWithCache(CDN_TTF);
    } catch {
      fallbackBytes = await fetchWithCache("NotoSansSC-Regular.ttf");
    }
    font = await pdf.embedFont(fallbackBytes, { subset: false });
  }
  const ctx: Ctx = { pdf, font, page: pdf.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };

  // ===== 封面 =====
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.amber700 });
  ctx.y = PAGE_H - 160;

  ctx.page.drawText("家庭资产应急手册", { x: MARGIN, y: ctx.y, size: 28, font, color: COLORS.black });
  ctx.y -= 12;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: 170, height: 3, color: COLORS.amber700 });
  ctx.y -= 36;

  ctx.page.drawText(`生成日期：${new Date().toISOString().slice(0, 10)}`, { x: MARGIN, y: ctx.y, size: 10, font, color: COLORS.light });
  ctx.y -= 30;

  drawBoxedText(ctx, "⚠ 本文件使用 AES-256 加密，请妥善保管解锁密码。", 9.5, 32, {
    bgColor: COLORS.amberBg, borderColor: COLORS.amberBorder, textColor: COLORS.amber700,
  });

  // ===== 目录 =====
  newPage(ctx);
  drawText(ctx, "目录", 20, COLORS.black);
  ctx.y -= 8;

  const cnNum = ["一", "二", "三", "四", "五"];
  let chapterNo = 0;
  const tocNames = ["资产清单"];
  if (!doc.accessRemoved) tocNames.push("密码指引");
  if (!doc.sopRemoved) tocNames.push("紧急响应流程");
  if (!doc.customRemoved && doc.customSections.length > 0) tocNames.push("自定义章节");
  const tocItems = tocNames.map((name, i) => `${cnNum[i]}、${name}`);
  for (const item of tocItems) {
    drawBoxedText(ctx, item, 10.5, 30, {
      bgColor: COLORS.white, borderColor: COLORS.border, textColor: COLORS.body,
    });
  }

  // ===== 一、资产清单 =====
  newPage(ctx);
  drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "资产清单");

  if (doc.assets.length === 0) {
    drawText(ctx, "（未填写资产信息）", 10, COLORS.light);
  }
  for (let i = 0; i < doc.assets.length; i++) {
    const a = doc.assets[i]!;
    const isInsurance = a.type === "insurance";
    const institution = a.institution || ASSET_TYPE_LABELS[a.type];
    const typeLabel = ASSET_TYPE_LABELS[a.type];

    drawAssetCard(ctx, String(i + 1).padStart(2, "0"), institution, typeLabel, [
      ...(isInsurance ? [
        ...(a.insuranceKind ? [{ label: "险种", value: a.insuranceKind }] : []),
        { label: "保单号", value: a.accountNumber },
        ...(a.insuredPerson ? [{ label: "保险人", value: a.insuredPerson }] : []),
        { label: "缴费年限", value: a.paymentYears || "—" },
        { label: "缴费状态", value: a.stillPaying ? "缴费中" : "已缴清" },
        { label: "理赔额", value: `${CURRENCY_LABELS[a.currency]} ${a.estimatedValue}`, highlight: true, dividerBefore: true },
      ] : [
        { label: "账户号码", value: a.accountNumber },
        ...(a.loginUsername ? [{ label: "登录用户名", value: a.loginUsername }] : []),
        ...(a.registerEmail ? [{ label: "注册邮箱", value: a.registerEmail }] : []),
        ...(a.bindPhone ? [{ label: "绑定手机", value: a.bindPhone }] : []),
        { label: "登录网址", value: a.loginUrl },
        { label: "联系电话", value: a.contactPhone },
        ...(a.appDownload ? [{ label: "APP 下载", value: a.appDownload }] : []),
        { label: "估值", value: `${CURRENCY_LABELS[a.currency]} ${a.estimatedValue}`, highlight: true, dividerBefore: true },
      ]),
      { label: "受益人", value: a.hasBeneficiary ? (a.beneficiary || "已指定（未填写姓名）") : "未指定" },
      ...(a.notes ? [{ label: "备注", value: a.notes }] : []),
    ]);
  }

  // ===== 二、密码指引 =====
  if (!doc.accessRemoved) {
    newPage(ctx);
    drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "密码指引");

    const methodLabels: Record<string, string> = {
      totp: "TOTP 验证器", sms: "短信验证", hardware_key: "硬件密钥",
      email: "邮箱验证", other: "其他", none: "无",
    };

    if (doc.access.seals.length > 0) {
      for (let i = 0; i < doc.access.seals.length; i++) {
        const s = doc.access.seals[i]!;
        const linkedNames = s.linkedAssetIds
          .map((id) => doc.assets.find((a) => a.id === id))
          .filter(Boolean)
          .map((a) => a!.institution || ASSET_TYPE_LABELS[a!.type])
          .join("、");
        drawCard(ctx, String(i + 1).padStart(2, "0"), [
          { label: "标签", value: s.label },
          { label: "存放位置", value: s.location },
          ...(s.passwordHint ? [{ label: "密码说明", value: s.passwordHint }] : []),
          ...(s.twoFactorMethod !== "none" ? [
            { label: "2FA 方式", value: methodLabels[s.twoFactorMethod] || s.twoFactorMethod },
            ...(s.twoFactorRecovery ? [{ label: "2FA 恢复", value: s.twoFactorRecovery }] : []),
          ] : []),
          ...(linkedNames ? [{ label: "关联资产", value: linkedNames }] : []),
          ...(s.notes ? [{ label: "备注", value: s.notes }] : []),
        ]);
      }
    } else {
      drawText(ctx, "（未填写密码指引信息）", 10, COLORS.light);
    }
  }

  // ===== 三、SOP =====
  if (!doc.sopRemoved) {
    newPage(ctx);
    drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "紧急响应流程");

    for (let i = 0; i < doc.sopStages.length; i++) {
      const stage = doc.sopStages[i]!;
      drawSopCard(ctx, String(i + 1).padStart(2, "0"), stage.title, stage.content);
    }
  }

  // ===== 四、自定义 =====
  if (!doc.customRemoved && doc.customSections.length > 0) {
    newPage(ctx);
    drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "自定义章节");

    for (const s of doc.customSections) {
      need(ctx, 40);
      drawText(ctx, s.title, 12, COLORS.dark);
      ctx.y -= 2;
      drawDivider(ctx);
      for (const line of s.content.split("\n")) {
        need(ctx, 17);
        drawText(ctx, line, 9.5, COLORS.body, MARGIN + 8);
      }
      ctx.y -= 10;
    }
  }

  // ===== 页脚 =====
  const pages = pdf.getPages();
  const footer = "家庭资产应急手册 · 机密文件";
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!;
    p.drawLine({
      start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 },
      thickness: 0.3, color: COLORS.border,
    });
    p.drawText(footer, { x: MARGIN, y: 26, size: 7.5, font, color: COLORS.light });
    p.drawText(`${i + 1} / ${pages.length}`, {
      x: PAGE_W - MARGIN - ctx.font.widthOfTextAtSize(`${i + 1} / ${pages.length}`, 7.5),
      y: 26, size: 7.5, font, color: COLORS.light,
    });
  }

  // 嵌入草稿数据（便于将来直接导入此 PDF 继续编辑）
  const draftBytes = new TextEncoder().encode(JSON.stringify(wrapDraft(doc)));
  await pdf.attach(draftBytes, DRAFT_ATTACHMENT_NAME, {
    mimeType: "application/json",
    description: "family-asset-guide draft data",
  });

  // 加密
  pdf.encrypt({
    userPassword: password, ownerPassword: password,
    permissions: {
      printing: "highResolution", modifying: false, copying: false,
      annotating: false, fillingForms: false, contentAccessibility: true, documentAssembly: false,
    },
  });

  return await pdf.save();
}

export async function downloadPdf(bytes: Uint8Array) {
  const ts = new Date().toISOString().slice(0, 10);
  const fileName = `家庭应急手册-${ts}.pdf`;
  const blob = new Blob([bytes], { type: "application/pdf" });

  try {
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return;
    }
  } catch {}

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
