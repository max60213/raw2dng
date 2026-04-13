export function packShorts(values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 2);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint16(index * 2, value, true));
  return bytes;
}

export function packLongs(values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint32(index * 4, value, true));
  return bytes;
}

export function packAscii(value: string): Uint8Array {
  return new TextEncoder().encode(`${value}\0`);
}

export function packRationals(values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 8);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => {
    const numerator = Math.round(value * 10_000);
    const denominator = 10_000;
    view.setInt32(index * 8, numerator, true);
    view.setInt32(index * 8 + 4, denominator, true);
  });
  return bytes;
}
