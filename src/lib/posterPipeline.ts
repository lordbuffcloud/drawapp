import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export type PrintSize = "letter" | "a4";

const PRINT_SPECS: Record<PrintSize, { px: { w: number; h: number }; pt: { w: number; h: number } }> = {
  letter: { px: { w: 2550, h: 3300 }, pt: { w: 612, h: 792 } },
  a4: { px: { w: 2481, h: 3508 }, pt: { w: 595.28, h: 841.89 } }
};

function clampInt(v: number): number {
  return Math.max(0, Math.floor(v));
}

function sanitizeLabelText(s: string): string {
  return s.replace(/[<>&"]/g, "");
}

function makeNoiseTile(size = 256): Buffer {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(Math.random() * 256);
    buf[i * 4 + 0] = v;
    buf[i * 4 + 1] = v;
    buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = 20; // subtle alpha
  }
  return buf;
}

export async function generatePosterAssets(opts: {
  stepPngs: Buffer[]; // length 7
  printSize: PrintSize;
}): Promise<{ posterPng: Buffer; posterPdf: Buffer; thumbnailPng: Buffer }> {
  const spec = PRINT_SPECS[opts.printSize];
  const W = spec.px.w;
  const H = spec.px.h;

  const margin = 120;
  const gutter = 60;
  const border = 2;
  const innerPad = 18;
  const labelH = 30;

  const rowH = clampInt((H - 2 * margin - gutter) / 2);
  const topW = clampInt((W - 2 * margin - 3 * gutter) / 4);
  const botW = clampInt((W - 2 * margin - 2 * gutter) / 3);

  const panels: Array<{ x: number; y: number; w: number; h: number; step: number }> = [];
  for (let i = 0; i < 4; i++) panels.push({ x: margin + i * (topW + gutter), y: margin, w: topW, h: rowH, step: i + 1 });
  for (let i = 0; i < 3; i++)
    panels.push({ x: margin + i * (botW + gutter), y: margin + rowH + gutter, w: botW, h: rowH, step: 5 + i });

  const base = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 13, g: 16, b: 22, alpha: 1 }
    }
  });

  // Subtle “concrete” texture overlay (procedural noise, blurred)
  const noiseTile = makeNoiseTile(256);
  const noise = await sharp(noiseTile, { raw: { width: 256, height: 256, channels: 4 } })
    .resize(W, H, { fit: "fill" })
    .blur(2)
    .png()
    .toBuffer();

  let canvas = base.composite([{ input: noise, blend: "overlay" }]);

  const composites: sharp.OverlayOptions[] = [];

  // Step images
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const stepImg = opts.stepPngs[i];
    const targetW = Math.max(1, p.w - 2 * innerPad);
    const targetH = Math.max(1, p.h - 2 * innerPad - labelH);

    const resized = await sharp(stepImg)
      .resize(targetW, targetH, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    composites.push({
      input: resized,
      left: p.x + innerPad,
      top: p.y + innerPad + labelH
    });
  }

  // Borders + labels (SVG)
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <style>
        .panel { fill: rgba(255,255,255,0.03); stroke: rgba(255,255,255,0.14); stroke-width: ${border}; }
        .label { font-family: system-ui, -apple-system, Segoe UI, Arial, sans-serif; font-weight: 600; font-size: 18px; fill: rgba(232,234,240,0.92); }
      </style>
    </defs>
    ${panels
      .map((p) => {
        const label = sanitizeLabelText(`Step ${p.step}`);
        const lx = p.x + innerPad;
        const ly = p.y + innerPad + 18;
        return `
          <rect class="panel" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="16" ry="16" />
          <text class="label" x="${lx}" y="${ly}">${label}</text>
        `;
      })
      .join("")}
  </svg>`;

  composites.push({ input: Buffer.from(svg), top: 0, left: 0 });

  canvas = canvas.composite(composites);

  const posterPng = await canvas.png().toBuffer();

  // PDF (single-page) embedding the PNG at correct size
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([spec.pt.w, spec.pt.h]);
  const embedded = await pdf.embedPng(posterPng);
  page.drawImage(embedded, { x: 0, y: 0, width: spec.pt.w, height: spec.pt.h });
  const posterPdf = Buffer.from(await pdf.save());

  const thumbnailPng = await sharp(posterPng).resize(700, null, { fit: "inside" }).png().toBuffer();
  return { posterPng, posterPdf, thumbnailPng };
}


