import type { LinearExtractionResult } from "../types";

export interface EmbeddedPreview {
  width: number;
  height: number;
  imageData: Uint8Array;
  orientation: number;
}

export function createEmbeddedPreview(input: LinearExtractionResult, maxDimension = 1024): EmbeddedPreview {
  const displayWidth = input.width;
  const displayHeight = input.height;
  const orientation = input.metadata.orientation || 1;
  const rotates = orientation === 6 || orientation === 8;
  const sourceWidth = rotates ? displayHeight : displayWidth;
  const sourceHeight = rotates ? displayWidth : displayHeight;
  const longestSide = Math.max(sourceWidth, sourceHeight);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const imageData = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x + 0.5) / scale));
      const [displayX, displayY] = mapToDisplayCoordinates(sourceX, sourceY, displayWidth, displayHeight, orientation);
      const sourceOffset = (displayY * displayWidth + displayX) * 3;
      const targetOffset = (y * width + x) * 3;
      imageData[targetOffset] = normalizeToByte(input.imageData[sourceOffset]);
      imageData[targetOffset + 1] = normalizeToByte(input.imageData[sourceOffset + 1]);
      imageData[targetOffset + 2] = normalizeToByte(input.imageData[sourceOffset + 2]);
    }
  }

  return { width, height, imageData, orientation };
}

function mapToDisplayCoordinates(x: number, y: number, width: number, height: number, orientation: number): [number, number] {
  switch (orientation) {
    case 6:
      return [y, height - 1 - x];
    case 8:
      return [width - 1 - y, x];
    case 3:
      return [width - 1 - x, height - 1 - y];
    default:
      return [x, y];
  }
}

function normalizeToByte(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(255, Math.round(value / 257)));
}
