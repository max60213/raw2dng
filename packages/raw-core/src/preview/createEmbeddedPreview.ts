import type { LinearExtractionResult } from "../types";

export interface EmbeddedPreview {
  width: number;
  height: number;
  imageData: Uint8Array;
}

export function createEmbeddedPreview(input: LinearExtractionResult, maxDimension = 256): EmbeddedPreview {
  const sourceWidth = input.width;
  const sourceHeight = input.height;
  const longestSide = Math.max(sourceWidth, sourceHeight);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const imageData = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x + 0.5) / scale));
      const sourceOffset = (sourceY * sourceWidth + sourceX) * 3;
      const targetOffset = (y * width + x) * 3;
      imageData[targetOffset] = normalizeToByte(input.imageData[sourceOffset]);
      imageData[targetOffset + 1] = normalizeToByte(input.imageData[sourceOffset + 1]);
      imageData[targetOffset + 2] = normalizeToByte(input.imageData[sourceOffset + 2]);
    }
  }

  return { width, height, imageData };
}

function normalizeToByte(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(255, Math.round(value / 257)));
}
