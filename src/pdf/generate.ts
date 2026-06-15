import type { PDFPage, PDFFont, PDFDocument, Color } from "@cantoo/pdf-lib";
import type { Asset, Document } from "../state/types";

// pdf-lib 与 fontkit 体积大（合计约 580KB gzip）且仅在生成/解析 PDF 时才用到，
// 改为动态 import，拆成独立异步 chunk，不进首屏。首次调用时按需加载并缓存。
type PdfLib = typeof import("@cantoo/pdf-lib");
let _pdfLib: PdfLib | null = null;
let _fontkit: any = null;
async function loadPdfEngine(): Promise<{ PDFDocument: PdfLib["PDFDocument"]; fontkit: any }> {
  if (!_pdfLib || !_fontkit) {
    const [pdfMod, fkMod] = await Promise.all([
      import("@cantoo/pdf-lib"),
      import("@pdf-lib/fontkit"),
    ]);
    _pdfLib = pdfMod;
    _fontkit = fkMod.default;
  }
  return { PDFDocument: _pdfLib!.PDFDocument, fontkit: _fontkit };
}

// pdf-lib 的 rgb 仅返回一个颜色对象，本地实现以免为它把整个库拉进首屏。
const rgb = (r: number, g: number, b: number): Color =>
  ({ type: "RGB", red: r, green: g, blue: b }) as unknown as Color;

import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";
import { wrapDraft, unwrapDraft } from "../state/document";
import { formatCny, formatCoarseCny, groupAssetsByFilter, summarizeAssets } from "../state/asset-summary";
import type { ChartItem } from "../state/asset-summary";

export const DRAFT_ATTACHMENT_NAME = "family-asset-guide-draft.json";
export type PdfOutputMode = "relative" | "full";

interface GeneratePdfOptions {
  mode?: PdfOutputMode;
}

// 不同版本能展示哪些信息。夫妻版（full）给全；亲属版（relative）给"知情 + 执行"
// 所需的信息，但隐去每笔金额、登录凭证、密码指引与可导入草稿。
interface VersionCaps {
  itemAmounts: boolean; // 每笔资产的估值/理赔额/欠款余额/账户现金/授予股票
  totalAndCharts: boolean; // 总额 + 占比 + 概览饼图
  beneficiary: boolean; // 受益人
  accountNumber: boolean; // 账号/保单号
  contactInfo: boolean; // 登录网址 / 客服电话 / APP 下载
  loginCredentials: boolean; // 登录用户名 / 注册邮箱 / 绑定手机
  notes: boolean; // 备注
  passwordGuide: boolean; // 密码指引章节
  sop: boolean; // 紧急响应流程
  custom: boolean; // 自定义章节
  toc: boolean; // 目录
  embedDraft: boolean; // 内嵌可导入草稿
}

function capsForMode(mode: PdfOutputMode): VersionCaps {
  if (mode === "full") {
    return {
      itemAmounts: true, totalAndCharts: true, beneficiary: true, accountNumber: true,
      contactInfo: true, loginCredentials: true, notes: true, passwordGuide: true,
      sop: true, custom: true, toc: true, embedDraft: true,
    };
  }
  // relative（亲属版）：只让亲属知道有哪些资产、账号与机构联系方式；
  // 不含每笔金额、分布饼图、登录凭证、密码指引与可导入草稿。
  return {
    itemAmounts: false, totalAndCharts: false, beneficiary: true, accountNumber: true,
    contactInfo: true, loginCredentials: false, notes: false, passwordGuide: false,
    sop: true, custom: true, toc: true, embedDraft: false,
  };
}

// 从（加密的）PDF 中提取此前嵌入的草稿数据，用于直接导入 PDF 继续编辑。
export async function extractDraftFromPdf(
  bytes: Uint8Array | ArrayBuffer,
  password: string,
): Promise<Document> {
  const { PDFDocument } = await loadPdfEngine();
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
  green: rgb(0.02, 0.59, 0.41),
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

// 用 canvas 把环形图渲染成 PNG 再嵌入 PDF。此前用 page.drawSvgPath 画扇区，
// 因 pdf-lib 对 SVG path 的坐标系处理（y 向下、锚点在左上）导致扇区被画到页面外、
// 圆环空白。改成栅格图后任何 PDF 阅读器都能正常显示。
async function renderDonutPng(
  pdf: PDFDocument,
  items: ChartItem[],
  centerTop: string,
  centerMain: string,
  displaySize: number,
): Promise<{ image: Awaited<ReturnType<PDFDocument["embedPng"]>>; size: number }> {
  const scale = 3;
  const size = displaySize * scale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.47;
  const innerR = size * 0.27;
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    c.beginPath();
    c.arc(cx, cy, outerR, 0, Math.PI * 2);
    c.fillStyle = "#e7e5e4";
    c.fill();
  } else {
    let start = -Math.PI / 2;
    for (const item of items) {
      if (item.value <= 0) continue;
      const angle = (item.value / total) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, outerR, start, start + angle);
      c.closePath();
      c.fillStyle = item.color;
      c.fill();
      start += angle;
    }
  }

  // 中心挖白形成环形
  c.beginPath();
  c.arc(cx, cy, innerR, 0, Math.PI * 2);
  c.fillStyle = "#ffffff";
  c.fill();

  // 中心文字（"合计" + 总额）。主文字按内圆直径自适应缩放，避免长数字撑爆内圆。
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#a8a29e";
  c.font = `${9 * scale}px sans-serif`;
  c.fillText(centerTop, cx, cy - 8 * scale);

  const maxMainW = innerR * 1.7;
  let mainPx = 13 * scale;
  c.font = `bold ${mainPx}px sans-serif`;
  while (c.measureText(centerMain).width > maxMainW && mainPx > 7 * scale) {
    mainPx -= scale;
    c.font = `bold ${mainPx}px sans-serif`;
  }
  c.fillStyle = "#1c1917";
  c.fillText(centerMain, cx, cy + 8 * scale);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas toBlob 失败"))), "image/png"),
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const image = await pdf.embedPng(bytes);
  return { image, size: displaySize };
}

function drawChartSummary(ctx: Ctx, doc: Document, caps: VersionCaps): void {
  const summary = summarizeAssets(doc.assets);
  const summaryH = 48;
  need(ctx, summaryH + 8);
  const y = ctx.y - summaryH;
  ctx.page.drawRectangle({
    x: MARGIN, y, width: CONTENT_W, height: summaryH,
    color: COLORS.amberBg, borderColor: COLORS.amberBorder, borderWidth: 0.5,
  });
  const totalText = caps.itemAmounts ? formatCny(summary.totalCny) : formatCoarseCny(summary.totalCny);
  ctx.page.drawText(`资产池总计 ${totalText}`, {
    x: MARGIN + 12, y: y + 27, size: 13, font: ctx.font, color: COLORS.black,
  });
  const tags = [
    summary.hasInsurance ? "不含保单" : "",
    summary.hasDebt ? "欠款仅提醒" : "",
  ].filter(Boolean).join(" · ");
  if (tags) {
    ctx.page.drawText(tags, {
      x: MARGIN + 160, y: y + 28, size: 9, font: ctx.font, color: COLORS.light,
    });
  }
  ctx.page.drawText(
    caps.itemAmounts
      ? "只统计股票账户现金、银行存款、股票/基金和不动产；其他资产保留在清单明细中。"
      : "亲属版展示资产总额与分布占比及紧急响应流程；不含每笔金额、登录凭证与密码指引。",
    {
    x: MARGIN + 12, y: y + 11, size: 8.5, font: ctx.font, color: COLORS.muted,
    },
  );
  ctx.y = y - 8;
}

async function drawOverviewChart(
  ctx: Ctx, title: string, subtitle: string, items: ChartItem[], caps: VersionCaps,
): Promise<void> {
  const rowGap = 28;
  const pieDisplay = 108;
  const headH = 46; // 标题 + 副标题占用
  const legendH = items.length * rowGap;
  const bodyH = Math.max(pieDisplay, legendH);
  const cardH = headH + bodyH + 8; // 8 为底部 padding，避免大片空白
  need(ctx, cardH + 8);
  const cardY = ctx.y - cardH;
  const total = items.reduce((sum, item) => sum + item.value, 0);

  ctx.page.drawRectangle({
    x: MARGIN, y: cardY, width: CONTENT_W, height: cardH,
    color: COLORS.white, borderColor: COLORS.border, borderWidth: 0.5,
  });
  ctx.page.drawText(title, {
    x: MARGIN + 12, y: cardY + cardH - 24, size: 12, font: ctx.font, color: COLORS.black,
  });
  ctx.page.drawText(subtitle, {
    x: MARGIN + 12, y: cardY + cardH - 40, size: 8.5, font: ctx.font, color: COLORS.muted,
  });

  // body 区上沿；饼图与图例都在 body 区内垂直居中。
  const bodyTop = cardY + cardH - headH;
  // 总额始终展示（两版都给量级认知）；亲属版用粗粒度，每笔金额按 caps 控制。
  const totalText = caps.itemAmounts ? formatCny(total) : formatCoarseCny(total);
  const { image } = await renderDonutPng(ctx.pdf, items, "合计", totalText, pieDisplay);
  const pieX = MARGIN + 18;
  const pieY = bodyTop - bodyH + (bodyH - pieDisplay) / 2;
  ctx.page.drawImage(image, { x: pieX, y: pieY, width: pieDisplay, height: pieDisplay });

  const legendX = MARGIN + 150;
  const valueX = MARGIN + CONTENT_W - 12;
  let rowY = bodyTop - (bodyH - legendH) / 2 - 16;
  for (const item of items) {
    const pct = total > 0 ? (item.value / total) * 100 : 0;
    const value = caps.itemAmounts
      ? `${formatCny(item.value)} · ${pct.toFixed(1)}%`
      : `${pct.toFixed(1)}%`;
    ctx.page.drawCircle({ x: legendX, y: rowY + 2, size: 4, color: rgbFromHex(item.color) });
    ctx.page.drawText(item.label, { x: legendX + 10, y: rowY, size: 9.5, font: ctx.font, color: COLORS.dark });
    ctx.page.drawText(value, {
      x: valueX - ctx.font.widthOfTextAtSize(value, 9.5),
      y: rowY,
      size: 9.5, font: ctx.font, color: COLORS.black,
    });
    ctx.page.drawText(item.description, {
      x: legendX + 10, y: rowY - 12, size: 7.5, font: ctx.font, color: COLORS.light,
    });
    rowY -= rowGap;
  }

  ctx.y = cardY - 8;
}

function rgbFromHex(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

async function drawAssetOverview(ctx: Ctx, doc: Document, caps: VersionCaps): Promise<void> {
  const summary = summarizeAssets(doc.assets);
  drawChartSummary(ctx, doc, caps);
  await drawOverviewChart(
    ctx,
    "资产分布概览",
    "只统计股票账户现金、银行存款、股票和不动产；欠款只提醒，不进入总额。",
    summary.allocationItems,
    caps,
  );
  await drawOverviewChart(
    ctx,
    "中美资产分布",
    "美股和港股账户归海外资产，其他资产归中国资产。",
    summary.regionItems,
    caps,
  );
  await drawOverviewChart(
    ctx,
    "股票账户来源拆分",
    "区分公司授予股票与自购股票，基金不纳入这张来源图。",
    summary.stockSourceItems,
    caps,
  );
}

function buildAssetRows(a: Asset, caps: VersionCaps): AssetRow[] {
  const isInsurance = a.type === "insurance";
  const isStockAccount = a.type === "us_stock" || a.type === "hk_stock" || a.type === "a_stock";
  const isDebt = a.type === "debt";

  return [
    ...(isInsurance ? [
      ...(a.insuranceKind ? [{ label: "险种", value: a.insuranceKind }] : []),
      ...(caps.accountNumber ? [{ label: "保单号", value: a.accountNumber }] : []),
      ...(a.insuredPerson ? [{ label: "被保人", value: a.insuredPerson }] : []),
      { label: "缴费年限", value: a.paymentYears || "—" },
      { label: "缴费状态", value: a.stillPaying ? "缴费中" : "已缴清" },
      ...(caps.itemAmounts ? [{ label: "理赔额", value: `${CURRENCY_LABELS[a.currency]} ${a.estimatedValue}`, highlight: true, dividerBefore: true }] : []),
    ] : [
      ...(caps.accountNumber ? [{ label: isDebt ? "合同/贷款编号" : "账户号码", value: a.accountNumber }] : []),
      ...(a.accountOwner ? [{ label: "账户所有人", value: a.accountOwner }] : []),
      ...(caps.loginCredentials && a.loginUsername ? [{ label: "登录用户名", value: a.loginUsername }] : []),
      ...(caps.loginCredentials && a.registerEmail ? [{ label: "注册邮箱", value: a.registerEmail }] : []),
      ...(caps.loginCredentials && a.bindPhone ? [{ label: "绑定手机", value: a.bindPhone }] : []),
      ...(caps.contactInfo ? [{ label: "登录网址", value: a.loginUrl }] : []),
      ...(caps.contactInfo ? [{ label: "联系电话", value: a.contactPhone }] : []),
      ...(caps.contactInfo && a.appDownload ? [{ label: "APP 下载", value: a.appDownload }] : []),
      ...(caps.itemAmounts && isStockAccount && a.cashValue ? [{ label: "账户现金", value: `${CURRENCY_LABELS[a.currency]} ${a.cashValue}` }] : []),
      ...(caps.itemAmounts && isStockAccount && a.companyGrantedStockValue ? [{ label: "公司授予股票", value: `${CURRENCY_LABELS[a.currency]} ${a.companyGrantedStockValue}` }] : []),
      ...(caps.itemAmounts ? [{ label: isDebt ? "欠款余额" : isStockAccount ? "账户总估值" : "估值", value: `${CURRENCY_LABELS[a.currency]} ${a.estimatedValue}`, highlight: true, dividerBefore: true }] : []),
    ]),
    ...(caps.beneficiary ? [{ label: "受益人", value: a.hasBeneficiary ? (a.beneficiary || "已指定（未填写姓名）") : "未指定" }] : []),
    ...(caps.notes && a.notes ? [{ label: "备注", value: a.notes }] : []),
  ];
}

function drawAssetGroupHeader(ctx: Ctx, label: string, count: number): void {
  need(ctx, 36);
  ctx.y -= 4;
  const h = 24;
  const y = ctx.y - h;
  ctx.page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: h, color: COLORS.amber100 });
  ctx.page.drawText(label, {
    x: MARGIN + 10,
    y: textBaseline(y, h, 11),
    size: 11,
    font: ctx.font,
    color: COLORS.amber700,
  });
  const meta = `${count} 个账户 · 按估值降序`;
  ctx.page.drawText(meta, {
    x: PAGE_W - MARGIN - ctx.font.widthOfTextAtSize(meta, 8.5) - 10,
    y: textBaseline(y, h, 8.5),
    size: 8.5,
    font: ctx.font,
    color: COLORS.muted,
  });
  ctx.y = y - 6;
}

// 预估一张资产卡片的高度（与 drawAssetCard 的算法保持一致），用于分页前的空间判断。
function measureAssetCardHeight(ctx: Ctx, rows: AssetRow[]): number {
  const titleH = 26;
  const rowH = 18;
  const highlightRowH = 22;
  const padTop = 8;
  const padBot = 8;
  const divGap = 6;
  const maxValW = CONTENT_W - 110;
  let bodyH = padTop + padBot;
  for (const { value, highlight, dividerBefore } of rows) {
    const rh = highlight ? highlightRowH : rowH;
    const fs = highlight ? 11 : 9.5;
    const lines = wrapText(value || "—", ctx.font, fs, maxValW);
    if (dividerBefore) bodyH += divGap;
    bodyH += Math.max(lines.length, 1) * rh;
  }
  return titleH + bodyH;
}

// 资产清单章节顶部的分类计数概要，类似网页的筛选标签栏：「全部 23 · 股票 8 · …」。
function drawCategorySummary(ctx: Ctx, doc: Document): void {
  const total = doc.assets.length;
  if (total === 0) return;
  const groups = groupAssetsByFilter(doc.assets);
  const chips = [
    { label: "全部", count: total, primary: true },
    ...groups.map((g) => ({ label: g.label, count: g.assets.length, primary: false })),
  ];

  const padX = 14;
  const padV = 12;
  const rowH = 22;
  const gapX = 16;
  const labelSize = 10;
  const badgeSize = 8.5;
  const badgeH = 15;
  const innerW = CONTENT_W - padX * 2;

  const measured = chips.map((ch) => {
    const labelW = ctx.font.widthOfTextAtSize(ch.label, labelSize);
    const badgeW = Math.max(badgeH, ctx.font.widthOfTextAtSize(String(ch.count), badgeSize) + 12);
    return { ...ch, labelW, badgeW, w: labelW + 5 + badgeW };
  });

  // 按内容宽度折行
  const rows: (typeof measured)[] = [];
  let cur: typeof measured = [];
  let curW = 0;
  for (const ch of measured) {
    const add = (cur.length ? gapX : 0) + ch.w;
    if (curW + add > innerW && cur.length) {
      rows.push(cur);
      cur = [ch];
      curW = ch.w;
    } else {
      cur.push(ch);
      curW += add;
    }
  }
  if (cur.length) rows.push(cur);

  const cardH = padV * 2 + rows.length * rowH;
  need(ctx, cardH + 8);
  const cardY = ctx.y - cardH;
  ctx.page.drawRectangle({
    x: MARGIN, y: cardY, width: CONTENT_W, height: cardH,
    color: COLORS.amberBg, borderColor: COLORS.amberBorder, borderWidth: 0.5,
  });

  let rowTop = cardY + cardH - padV;
  for (const row of rows) {
    let x = MARGIN + padX;
    for (const ch of row) {
      ctx.page.drawText(ch.label, {
        x, y: textBaseline(rowTop - rowH, rowH, labelSize),
        size: labelSize, font: ctx.font, color: COLORS.dark,
      });
      x += ch.labelW + 5;
      const badgeY = rowTop - rowH + (rowH - badgeH) / 2;
      ctx.page.drawRectangle({
        x, y: badgeY, width: ch.badgeW, height: badgeH,
        color: ch.primary ? COLORS.amber700 : COLORS.amber100,
      });
      const countStr = String(ch.count);
      ctx.page.drawText(countStr, {
        x: x + (ch.badgeW - ctx.font.widthOfTextAtSize(countStr, badgeSize)) / 2,
        y: textBaseline(badgeY, badgeH, badgeSize),
        size: badgeSize, font: ctx.font, color: ch.primary ? COLORS.white : COLORS.amber700,
      });
      x += ch.badgeW + gapX;
    }
    rowTop -= rowH;
  }
  ctx.y = cardY - 8;
}

function drawGroupedAssets(ctx: Ctx, doc: Document, caps: VersionCaps): void {
  const groups = groupAssetsByFilter(doc.assets);
  if (groups.length === 0) {
    drawText(ctx, "（未填写资产信息）", 10, COLORS.light);
    return;
  }

  let globalNo = 1;
  for (const group of groups) {
    // 避免组标题孤立在页尾：当「标题 + 首个卡片」放不下时先换页。
    const firstRows = buildAssetRows(group.assets[0]!, caps);
    const firstCardH = measureAssetCardHeight(ctx, firstRows);
    if (ctx.y - (34 + firstCardH + 6) < MARGIN + 30) newPage(ctx);

    drawAssetGroupHeader(ctx, group.label, group.assets.length);
    for (const asset of group.assets) {
      const num = String(globalNo++).padStart(2, "0");
      const institution = asset.institution || ASSET_TYPE_LABELS[asset.type];
      drawAssetCard(ctx, num, institution, ASSET_TYPE_LABELS[asset.type], buildAssetRows(asset, caps));
    }
    ctx.y -= 6;
  }
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

const FONT_CACHE = "font-cache-v1";
// Google 字体 CDN（海外快，国内常被墙，仅作最后兜底）
const CDN_TTF = "https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf";
// 字体回退顺序，优先国内可达且较快的来源：
//   1) static.refly.ai（国内访问快）托管的阿里普惠体 Light（含完整中文，约 8.6MB）
//   2) 站点同源自带字体（必达兜底，与上方为不同字体但同样含中文）
//   3) Google 字体 CDN（海外兜底）
const FONT_FALLBACK_URLS = [
  "https://static.refly.ai/landing/AlibabaPuHuiTi-3-45-Light.ttf",
  "NotoSansSC-Regular.ttf",
  CDN_TTF,
];

// 主字体（refly 跨域不暴露 Content-Length）的预估字节数，用于在读不到
// Content-Length 时估算下载进度。reader 读取的是解码后字节，累计值与文件
// 真实大小一致，故以此为分母准确。
const PRIMARY_FONT_BYTES = 8650860;

type ProgressFn = (ratio: number) => void;

// 边读边累计字节，按 0~1 比例回调进度，最后合并为完整 ArrayBuffer。
async function readWithProgress(
  resp: Response,
  fallbackTotal: number,
  onProgress?: ProgressFn,
): Promise<ArrayBuffer> {
  const total = Number(resp.headers.get("Content-Length")) || fallbackTotal || 0;
  if (!onProgress || !resp.body) {
    const buf = await resp.arrayBuffer();
    onProgress?.(1);
    return buf;
  }
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total) onProgress(Math.min(loaded / total, 0.99));
  }
  onProgress(1);
  const out = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out.buffer;
}

async function fetchWithCache(url: string, onProgress?: ProgressFn): Promise<ArrayBuffer> {
  // 跨域 CDN 字体读不到 Content-Length 时，用预估值兜底算进度。
  const fallbackTotal = /^https?:\/\//.test(url) ? PRIMARY_FONT_BYTES : 0;
  try {
    const cache = await caches.open(FONT_CACHE);
    const cached = await cache.match(url);
    if (cached) {
      onProgress?.(1);
      return cached.arrayBuffer();
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error();
    const buf = await readWithProgress(resp, fallbackTotal, onProgress);
    cache.put(url, new Response(buf, { headers: { "Content-Type": resp.headers.get("Content-Type") || "font/ttf" } }));
    return buf;
  } catch {
    const resp = await fetch(url);
    if (resp.ok) return readWithProgress(resp, fallbackTotal, onProgress);
    throw new Error("无法加载字体文件。");
  }
}

// 校验字体能否被 fontkit 正常排版。Windows 的微软雅黑（msyh.ttc）等 TTC 字体集合
// 可以被 embedFont 接受，但排版时才抛 "this.font.layout is not a function"，需提前剔除。
// 调用前需确保 loadPdfEngine() 已完成（_fontkit 就绪）。
function isUsableFont(bytes: ArrayBuffer): boolean {
  try {
    const f = _fontkit.create(new Uint8Array(bytes));
    return f && typeof f.layout === "function";
  } catch {
    return false;
  }
}

async function loadFont(): Promise<ArrayBuffer> {
  await loadPdfEngine(); // 确保 _fontkit 就绪供 isUsableFont 使用
  // 直接使用项目自带字体（阿里普惠体优先），不再探测系统字体，
  // 避免浏览器弹出「允许访问本机字体」权限提示。
  // 按国内友好的顺序逐个尝试网络/同源字体，校验可用才采用。
  for (const url of FONT_FALLBACK_URLS) {
    try {
      const bytes = await fetchWithCache(url);
      if (isUsableFont(bytes)) return bytes;
    } catch {}
  }
  // 全部失败时最后再试同源 OTF（体积更小）。
  return fetchWithCache("NotoSansSC-Regular.otf");
}

// 页面一加载就后台预拉字体并写入 Cache，保证用户随后断网也能离线生成 PDF。
// onProgress 以 0~1 比例回调当前字体的下载进度，供 UI 显示进度条。
// 返回是否已成功缓存到可用字体，供 UI 提示「可否安全断网」。
export async function prefetchFont(onProgress?: (ratio: number) => void): Promise<boolean> {
  // 后台预热 pdf-lib/fontkit chunk（fire-and-forget，不阻塞字体下载与进度），
  // 使点击生成时已就绪。预热失败也无妨，生成时会再次 loadPdfEngine。
  void loadPdfEngine().catch(() => {});
  // prefetch 只负责把字体下载进 Cache；可用性校验留给生成时的 loadFont（含兜底），
  // 因此这里无需 fontkit，进度与「就绪」状态完全取决于字体下载本身。
  for (const url of FONT_FALLBACK_URLS) {
    try {
      const bytes = await fetchWithCache(url, onProgress);
      if (bytes.byteLength > 0) return true;
    } catch {}
  }
  return false;
}

// ===================== Main =====================

export async function generatePdf(
  doc: Document,
  password: string,
  onStatus?: (msg: string) => void,
  options: GeneratePdfOptions = {},
): Promise<Uint8Array> {
  const mode = options.mode ?? "full";
  const caps = capsForMode(mode);
  const modeLabel = mode === "full" ? "夫妻版" : "亲属版";
  const { PDFDocument, fontkit } = await loadPdfEngine();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  let font: PDFFont;
  try {
    const fontBytes = await loadFont();
    font = await pdf.embedFont(fontBytes, { subset: false });
  } catch {
    onStatus?.("当前字体不兼容，正在下载备用字体…");
    let fallbackBytes: ArrayBuffer;
    try {
      fallbackBytes = await fetchWithCache("NotoSansSC-Regular.ttf");
    } catch {
      fallbackBytes = await fetchWithCache(CDN_TTF);
    }
    font = await pdf.embedFont(fallbackBytes, { subset: false });
  }
  const ctx: Ctx = { pdf, font, page: pdf.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };

  // ===== 封面 =====
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.amber700 });
  ctx.y = PAGE_H - 160;

  ctx.page.drawText("家庭资产应急手册", { x: MARGIN, y: ctx.y, size: 28, font, color: COLORS.black });
  ctx.page.drawText(modeLabel, {
    x: MARGIN + ctx.font.widthOfTextAtSize("家庭资产应急手册", 28) + 16,
    y: ctx.y + 3,
    size: 13,
    font,
    color: COLORS.amber700,
  });
  ctx.y -= 12;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: 170, height: 3, color: COLORS.amber700 });
  ctx.y -= 36;

  ctx.page.drawText(`生成日期：${new Date().toISOString().slice(0, 10)}`, { x: MARGIN, y: ctx.y, size: 10, font, color: COLORS.light });
  ctx.y -= 30;

  drawBoxedText(ctx, "⚠ 本文件使用 AES-256 加密，请妥善保管解锁密码。", 9.5, 32, {
    bgColor: COLORS.amberBg, borderColor: COLORS.amberBorder, textColor: COLORS.amber700,
  });
  // 夫妻版在封面给一句版本说明（与黄框留出间距）；亲属版不再赘述。
  if (mode === "full") {
    ctx.y -= 18;
    drawText(
      ctx,
      "夫妻版：账户信息 + 具体金额 + 密码指引 + 紧急响应流程 + 自定义章节，\n并嵌入可导入草稿，便于日后继续编辑。",
      9.5,
      COLORS.muted,
    );
  }

  const cnNum = ["一", "二", "三", "四", "五"];
  let chapterNo = 0;

  // ===== 目录 =====
  if (caps.toc) {
    newPage(ctx);
    drawText(ctx, "目录", 20, COLORS.black);
    ctx.y -= 8;

    const tocNames = ["资产清单"];
    if (caps.passwordGuide && !doc.accessRemoved) tocNames.push("密码指引");
    if (caps.sop && !doc.sopRemoved) tocNames.push("紧急响应流程");
    if (caps.custom && !doc.customRemoved && doc.customSections.length > 0) tocNames.push("自定义章节");
    const tocItems = tocNames.map((name, i) => `${cnNum[i]}、${name}`);
    for (const item of tocItems) {
      drawBoxedText(ctx, item, 10.5, 30, {
        bgColor: COLORS.white, borderColor: COLORS.border, textColor: COLORS.body,
      });
    }
  }

  // ===== 一、资产清单 =====
  newPage(ctx);
  drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "资产清单");
  drawCategorySummary(ctx, doc);
  if (caps.totalAndCharts) await drawAssetOverview(ctx, doc, caps);
  drawGroupedAssets(ctx, doc, caps);

  // ===== 二、密码指引 =====
  if (caps.passwordGuide && !doc.accessRemoved) {
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
  if (caps.sop && !doc.sopRemoved) {
    newPage(ctx);
    drawSectionHeader(ctx, `第${cnNum[chapterNo++]}章`, "紧急响应流程");

    for (let i = 0; i < doc.sopStages.length; i++) {
      const stage = doc.sopStages[i]!;
      drawSopCard(ctx, String(i + 1).padStart(2, "0"), stage.title, stage.content);
    }
  }

  // ===== 四、自定义 =====
  if (caps.custom && !doc.customRemoved && doc.customSections.length > 0) {
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
  const footer = `家庭资产应急手册 · ${modeLabel} · 机密文件`;
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

  if (caps.embedDraft) {
    // 夫妻版嵌入草稿数据，便于将来直接导入此 PDF 继续编辑；亲属版不嵌入，避免泄露完整明细。
    const draftBytes = new TextEncoder().encode(JSON.stringify(wrapDraft(doc)));
    await pdf.attach(draftBytes, DRAFT_ATTACHMENT_NAME, {
      mimeType: "application/json",
      description: "family-asset-guide draft data",
    });
  }

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

export async function downloadPdf(bytes: Uint8Array, mode: PdfOutputMode = "full") {
  const ts = new Date().toISOString().slice(0, 10);
  const suffix = mode === "full" ? "夫妻版" : "亲属版";
  const fileName = `家庭应急手册-${suffix}-${ts}.pdf`;
  const blob = new Blob([bytes], { type: "application/pdf" });

  // 直接下载文件，不走 navigator.share（在桌面端会弹出系统分享菜单，体验不佳）。
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
