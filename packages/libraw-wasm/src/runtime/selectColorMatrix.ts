
export function selectColorMatrix(
  make: string,
  dngColorMatrix: [number, number, number, number, number, number, number, number, number] | null,
  camXyz: [number, number, number, number, number, number, number, number, number] | null,
  rgbCam: [number, number, number, number, number, number, number, number, number]
): [number, number, number, number, number, number, number, number, number] {
  if (dngColorMatrix) {
    return dngColorMatrix;
  }

  if (/sony/i.test(make) && camXyz) {
    return camXyz;
  }

  return rgbCam;
}
