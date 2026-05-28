import { PDFDocument, rgb, type PDFPage, type PDFFont } from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Document } from "../state/types";
import { ASSET_TYPE_LABELS, CURRENCY_LABELS } from "../state/types";

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

function drawText(ctx: Ctx, text: string, size: number, color = COLORS.body, x = MARGIN): void {
  const maxW = PAGE_W - x - MARGIN;
  const lines = wrapText(text, ctx.font, size, maxW);
  const lineH = size * 1.8;
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

async function loadSystemFont(): Promise<ArrayBuffer> {
  if (!("queryLocalFonts" in window)) {
    throw new Error("当前浏览器不支持读取系统字体（需要 Chrome 103+）。\n请使用 Chrome 或 Edge 浏览器。");
  }
  const fonts = await (window as any).queryLocalFonts();
  for (const name of PREFERRED_FONTS) {
    const match = fonts.find((f: any) => f.family === name && f.style === "Regular");
    if (match) return (await match.blob()).arrayBuffer();
  }
  const fallback = fonts.find(
    (f: any) => f.style === "Regular" && /sc|cn|gb|hei|song|fang/i.test(f.family),
  );
  if (fallback) return (await fallback.blob()).arrayBuffer();
  throw new Error("未找到中文字体，请确保系统已安装中文字体。");
}

// ===================== Main =====================

export async function generatePdf(doc: Document, password: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await loadSystemFont();
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const ctx: Ctx = { pdf, font, page: pdf.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };

  // ===== 封面 =====
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.amber700 });
  ctx.y = PAGE_H - 160;

  ctx.page.drawText("家庭资产应急手册", { x: MARGIN, y: ctx.y, size: 28, font, color: COLORS.black });
  ctx.y -= 12;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: 170, height: 3, color: COLORS.amber700 });
  ctx.y -= 36;

  if (doc.meta.familyName) {
    ctx.page.drawText(`${doc.meta.familyName}家`, { x: MARGIN, y: ctx.y, size: 18, font, color: COLORS.muted });
    ctx.y -= 32;
  }
  if (doc.meta.passwordHolderHint) {
    ctx.page.drawText(`密码持有人：${doc.meta.passwordHolderHint}`, { x: MARGIN, y: ctx.y, size: 11, font, color: COLORS.body });
    ctx.y -= 22;
  }
  ctx.page.drawText(`生成日期：${new Date().toISOString().slice(0, 10)}`, { x: MARGIN, y: ctx.y, size: 10, font, color: COLORS.light });
  ctx.y -= 30;

  drawBoxedText(ctx, "⚠ 本文件使用 AES-256 加密，请妥善保管解锁密码。", 9.5, 32, {
    bgColor: COLORS.amberBg, borderColor: COLORS.amberBorder, textColor: COLORS.amber700,
  });

  // ===== 目录 =====
  newPage(ctx);
  drawText(ctx, "目录", 20, COLORS.black);
  ctx.y -= 8;

  const tocItems = [
    "一、资产清单", "二、账户访问与双因素认证",
    "三、五阶段操作流程（SOP）",
    ...(doc.customSections.length > 0 ? ["四、自定义章节"] : []),
  ];
  for (const item of tocItems) {
    drawBoxedText(ctx, item, 10.5, 30, {
      bgColor: COLORS.white, borderColor: COLORS.border, textColor: COLORS.body,
    });
  }

  // ===== 一、资产清单 =====
  newPage(ctx);
  drawSectionHeader(ctx, "第一章", "资产清单");

  if (doc.assets.length === 0) {
    drawText(ctx, "（未填写资产信息）", 10, COLORS.light);
  }
  for (let i = 0; i < doc.assets.length; i++) {
    const a = doc.assets[i]!;
    drawCard(ctx, String(i + 1).padStart(2, "0"), [
      { label: "资产类型", value: ASSET_TYPE_LABELS[a.type] },
      { label: "机构名称", value: a.institution },
      { label: "账户号码", value: a.accountNumber },
      { label: "登录网址", value: a.loginUrl },
      { label: "联系电话", value: a.contactPhone },
      ...(a.appDownload ? [{ label: "APP 下载", value: a.appDownload }] : []),
      { label: "估值", value: `${CURRENCY_LABELS[a.currency]} ${a.estimatedValue}` },
      { label: "受益人", value: a.hasBeneficiary ? (a.beneficiary || "已指定（未填写姓名）") : "未指定" },
      ...(a.notes ? [{ label: "备注", value: a.notes }] : []),
    ]);
  }

  // ===== 二、账户访问 =====
  newPage(ctx);
  drawSectionHeader(ctx, "第二章", "账户访问与双因素认证");

  const methodLabels: Record<string, string> = {
    totp: "TOTP 验证器", sms: "短信验证", hardware_key: "硬件密钥",
    email: "邮箱验证", other: "其他",
  };

  if (doc.access.twoFactorEntries.length > 0) {
    drawText(ctx, "双因素认证 (2FA)", 12, COLORS.dark);
    ctx.y -= 4;
    for (let i = 0; i < doc.access.twoFactorEntries.length; i++) {
      const entry = doc.access.twoFactorEntries[i]!;
      const asset = doc.assets.find((a) => a.id === entry.assetId);
      drawCard(ctx, `2FA-${String(i + 1).padStart(2, "0")}`, [
        { label: "关联账户", value: asset?.institution || "未知" },
        { label: "验证方式", value: methodLabels[entry.method] || entry.method },
        { label: "恢复指引", value: entry.recoveryInstructions },
      ]);
    }
  }

  if (doc.access.seals.length > 0) {
    ctx.y -= 6;
    drawText(ctx, "密封件清单", 12, COLORS.dark);
    ctx.y -= 4;
    for (let i = 0; i < doc.access.seals.length; i++) {
      const s = doc.access.seals[i]!;
      drawCard(ctx, String(i + 1).padStart(2, "0"), [
        { label: "标签", value: s.label },
        { label: "存放位置", value: s.location },
        ...(s.notes ? [{ label: "备注", value: s.notes }] : []),
      ]);
    }
  }

  if (doc.access.twoFactorEntries.length === 0 && doc.access.seals.length === 0) {
    drawText(ctx, "（未填写账户访问信息）", 10, COLORS.light);
  }

  // ===== 三、SOP =====
  newPage(ctx);
  drawSectionHeader(ctx, "第三章", "五阶段操作流程");

  for (let i = 0; i < doc.sopStages.length; i++) {
    const stage = doc.sopStages[i]!;
    const headerH = 28;
    need(ctx, headerH + 30);

    const headerY = ctx.y - headerH;
    ctx.page.drawRectangle({
      x: MARGIN, y: headerY, width: CONTENT_W, height: headerH, color: COLORS.amber100,
    });
    const stageLabel = `${String(i + 1).padStart(2, "0")}  ${stage.title}`;
    ctx.page.drawText(stageLabel, {
      x: MARGIN + 10, y: textBaseline(headerY, headerH, 10.5),
      size: 10.5, font, color: COLORS.amber700,
    });
    ctx.y = headerY - 8;

    for (const line of stage.content.split("\n")) {
      need(ctx, 17);
      drawText(ctx, line, 9.5, COLORS.body, MARGIN + 12);
    }
    ctx.y -= 8;
  }

  // ===== 四、自定义 =====
  if (doc.customSections.length > 0) {
    newPage(ctx);
    drawSectionHeader(ctx, "第四章", "自定义章节");

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
  const footer = `家庭资产应急手册 · ${doc.meta.familyName || ""}家 · 机密文件`;
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

export function downloadPdf(bytes: Uint8Array, familyName: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${familyName || "家庭"}-应急手册-${ts}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
