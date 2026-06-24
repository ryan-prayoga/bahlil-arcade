// Render kartu skor ke gambar (canvas) lalu share via Web Share API.
// Fallback (desktop / browser tanpa share): download PNG + copy teks ke clipboard.
// Gaya kartu = poster propaganda/warung, konsisten sama game.

import { CSS, SHARE_URL } from "../config";

export interface ShareData {
  gameTitle: string;
  score: number;
  highScore: number;
  quote: string;
}

const W = 600;
const H = 800;
const DISPLAY = "Anton, system-ui, sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";
const MONO = "'Space Mono', monospace";

export async function shareScore(data: ShareData): Promise<"shared" | "fallback"> {
  const canvas = renderCard(data);
  const text = shareText(data);
  const blob = await canvasToBlob(canvas);

  const navAny = navigator as Navigator & {
    canShare?: (d: { files?: File[] }) => boolean;
  };
  if (blob && navigator.share && navAny.canShare) {
    const file = new File([blob], "skor-bahlil-arcade.png", { type: "image/png" });
    if (navAny.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: data.gameTitle, text, files: [file] });
        return "shared";
      } catch {
        /* batal -> fallback */
      }
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: data.gameTitle, text, url: SHARE_URL });
      return "shared";
    } catch {
      /* fallback */
    }
  }
  if (blob) downloadBlob(blob, "skor-bahlil-arcade.png");
  try {
    await navigator.clipboard.writeText(`${text} ${SHARE_URL}`);
  } catch {
    /* clipboard diblok */
  }
  return "fallback";
}

export function shareText(data: ShareData): string {
  return `Skorku ${data.score} di "${data.gameTitle}" — sambut yang bergizi, tampik yang basi. Kalahin gua!`;
}

function renderCard(data: ShareData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // kertas kraft
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e8d4a6");
  g.addColorStop(1, "#d2a85f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // halftone
  ctx.fillStyle = "rgba(28,21,16,0.06)";
  for (let y = 16; y < H; y += 26) {
    for (let x = (y % 52 === 0 ? 16 : 29); x < W; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // bingkai
  ctx.strokeStyle = CSS.ink;
  ctx.lineWidth = 8;
  rr(ctx, 22, 22, W - 44, H - 44, 4);
  ctx.stroke();

  ctx.textAlign = "center";

  // spanduk header
  ctx.fillStyle = CSS.merah;
  ctx.strokeStyle = CSS.ink;
  ctx.lineWidth = 5;
  rr(ctx, 70, 70, W - 140, 84, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CSS.white;
  ctx.font = `46px ${DISPLAY}`;
  ctx.fillText("BAHLIL ARCADE", W / 2, 130);

  ctx.fillStyle = CSS.ink;
  ctx.font = `700 22px ${BODY}`;
  ctx.fillText(data.gameTitle.toUpperCase(), W / 2, 196);

  // ikon kotak MBG (vektor)
  drawBox(ctx, W / 2, 280, 86);

  // skor
  ctx.fillStyle = CSS.inkSoft;
  ctx.font = `700 22px ${MONO}`;
  ctx.fillText("SKOR", W / 2, 392);
  ctx.fillStyle = CSS.merahDark;
  ctx.font = `700 120px ${MONO}`;
  ctx.fillText(`${data.score}`, W / 2, 500);

  ctx.fillStyle = CSS.ink;
  ctx.font = `700 22px ${MONO}`;
  ctx.fillText(`REKOR ${data.highScore}`, W / 2, 548);

  // quote
  ctx.fillStyle = CSS.hijauDark;
  ctx.font = `700 italic 26px ${BODY}`;
  wrapText(ctx, `“${data.quote}”`, W / 2, 612, W - 130, 36);

  // footer
  ctx.fillStyle = CSS.inkSoft;
  ctx.font = `700 18px ${BODY}`;
  ctx.fillText("Konten parodi · main di link bio", W / 2, H - 56);

  return canvas;
}

// kotak MBG sederhana (vektor) buat kartu share
function drawBox(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx - s / 2, cy - s / 2);
  ctx.lineJoin = "round";
  ctx.strokeStyle = CSS.ink;
  ctx.lineWidth = 5;
  // uap
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  [s * 0.3, s * 0.5, s * 0.7].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, s * 0.18);
    ctx.quadraticCurveTo(x + 8, s * 0.06, x, -s * 0.05);
    ctx.stroke();
  });
  ctx.strokeStyle = CSS.ink;
  ctx.lineWidth = 5;
  ctx.fillStyle = "#f6f1e6";
  rr(ctx, s * 0.1, s * 0.32, s * 0.8, s * 0.56, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(s * 0.42, s * 0.55, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CSS.hijau;
  ctx.beginPath();
  ctx.arc(s * 0.66, s * 0.52, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CSS.kuning;
  ctx.beginPath();
  ctx.arc(s * 0.58, s * 0.72, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}
