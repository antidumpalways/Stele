/**
 * ELA Lite — Error Level Analysis (browser-side)
 * Lightweight canvas-based pixel manipulation detector.
 * Returns a score 0-100 (higher = more likely manipulated).
 */
export interface ElaResult {
  score: number;
  level: "clean" | "suspect" | "tampered";
  label: string;
  details: string;
}

export async function runElaAnalysis(file: File): Promise<ElaResult> {
  if (!file.type.startsWith("image/")) {
    return { score: 0, level: "clean", label: "N/A", details: "Not an image — ELA not applicable." };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const W = Math.min(img.naturalWidth, 800);
        const H = Math.min(img.naturalHeight, 600);

        const canvas1 = document.createElement("canvas");
        canvas1.width = W;
        canvas1.height = H;
        const ctx1 = canvas1.getContext("2d")!;
        ctx1.drawImage(img, 0, 0, W, H);
        const original = ctx1.getImageData(0, 0, W, H);

        const canvas2 = document.createElement("canvas");
        canvas2.width = W;
        canvas2.height = H;
        const ctx2 = canvas2.getContext("2d")!;

        const compressed = canvas1.toDataURL("image/jpeg", 0.75);
        const img2 = new Image();
        img2.onload = () => {
          ctx2.drawImage(img2, 0, 0, W, H);
          const recompressed = ctx2.getImageData(0, 0, W, H);

          let totalDiff = 0;
          let highDiffPixels = 0;
          const THRESHOLD = 20;

          for (let i = 0; i < original.data.length; i += 4) {
            const rDiff = Math.abs(original.data[i] - recompressed.data[i]);
            const gDiff = Math.abs(original.data[i + 1] - recompressed.data[i + 1]);
            const bDiff = Math.abs(original.data[i + 2] - recompressed.data[i + 2]);
            const pixelDiff = (rDiff + gDiff + bDiff) / 3;
            totalDiff += pixelDiff;
            if (pixelDiff > THRESHOLD) highDiffPixels++;
          }

          const totalPixels = W * H;
          const avgDiff = totalDiff / totalPixels;
          const highDiffRatio = highDiffPixels / totalPixels;

          const rawScore = Math.min(100, avgDiff * 4 + highDiffRatio * 200);
          const score = Math.round(rawScore);

          let level: ElaResult["level"];
          let label: string;
          let details: string;

          if (score < 25) {
            level = "clean";
            label = "AUTHENTIC";
            details = `Low pixel anomaly (score: ${score}/100). No manipulation detected.`;
          } else if (score < 55) {
            level = "suspect";
            label = "SUSPECT";
            details = `Moderate pixel anomaly (score: ${score}/100). Possible editing — verify source.`;
          } else {
            level = "tampered";
            label = "TAMPERED";
            details = `High pixel anomaly (score: ${score}/100). Strong indicators of manipulation.`;
          }

          resolve({ score, level, label, details });
        };
        img2.src = compressed;
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for ELA"));
    };
    img.src = url;
  });
}
