import { ACHIEVEMENTS } from "./achievements";

const STORE_URL = "https://unstucklabs.store";

export interface ShareCardData {
  taskTitle: string;
  completedSubtasks: number;
  actualMinutes: number | null;
  newAchievementId?: string;
}

// Canvas-based, same technique v1's ShareCard used (not its code) --
// renders an offscreen 1080x1080 image client-side, no core-api endpoint
// needed. Uses the app's own "Sky optimism" palette so shared cards read as
// on-brand rather than a generic screenshot.
export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#312e81");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
  ctx.beginPath();
  ctx.arc(size * 0.85, size * 0.15, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f5ff";
  ctx.font = "600 40px 'DM Sans', sans-serif";
  ctx.fillText("Unstuck Daily", 80, 120);

  ctx.font = "700 64px 'DM Sans', sans-serif";
  wrapText(ctx, data.taskTitle, 80, 320, size - 160, 76);

  ctx.font = "500 36px 'DM Sans', sans-serif";
  ctx.fillStyle = "#f59e0b";
  const statLine =
    data.actualMinutes != null
      ? `${data.completedSubtasks} steps, ${data.actualMinutes} minutes, done.`
      : `${data.completedSubtasks} steps, done.`;
  ctx.fillText(statLine, 80, size - 160);

  if (data.newAchievementId) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === data.newAchievementId);
    if (achievement) {
      ctx.font = "600 32px 'DM Sans', sans-serif";
      ctx.fillStyle = "#f5f5ff";
      ctx.fillText(`New: ${achievement.label}`, 80, size - 100);
    }
  }

  // Baked into the image itself (not just the share-sheet text below) so the
  // link survives even when the card is saved and reposted separately, e.g.
  // to a Stories tray, where accompanying share text doesn't travel with it.
  ctx.font = "500 28px 'DM Sans', sans-serif";
  ctx.fillStyle = "rgba(245, 245, 255, 0.65)";
  ctx.fillText(STORE_URL.replace("https://", ""), 80, size - 50);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  let linesDrawn = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
      linesDrawn += 1;
      if (linesDrawn >= 3) {
        ctx.fillText(`${line}…`, x, lineY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
}

export async function shareCard(blob: Blob, fileName = "unstuck-daily.png") {
  const file = new File([blob], fileName, { type: "image/png" });
  // text + url ride alongside the image on share targets that surface them
  // (Messages, Mail, X, etc. auto-linkify it); the watermark baked into the
  // image itself (see generateShareCard) is the fallback for targets that
  // only keep the file, like saving straight to Photos.
  const shareData = {
    files: [file],
    title: "Unstuck Daily",
    text: "I just got unstuck with Unstuck Daily 🎉",
    url: STORE_URL,
  };
  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return;
  }
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Unstuck Daily" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
