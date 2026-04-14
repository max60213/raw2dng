export interface EmbeddedJpegPreview {
  width: number;
  height: number;
  orientation: number;
  jpegData: Uint8Array;
}

const TIFF_MAGIC = 42;
const IFD0_OFFSET = 4;

export function appendEmbeddedJpegThumbnailIfd(dngBytes: Uint8Array, preview: EmbeddedJpegPreview): Uint8Array {
  const view = new DataView(dngBytes.buffer, dngBytes.byteOffset, dngBytes.byteLength);
  if (dngBytes.byteLength < 8 || dngBytes[0] !== 0x49 || dngBytes[1] !== 0x49 || view.getUint16(2, true) !== TIFF_MAGIC) {
    return dngBytes;
  }

  const firstIfdOffset = view.getUint32(IFD0_OFFSET, true);
  if (firstIfdOffset <= 0 || firstIfdOffset + 2 > dngBytes.byteLength) {
    return dngBytes;
  }

  const entryCount = view.getUint16(firstIfdOffset, true);
  const nextIfdPointerOffset = firstIfdOffset + 2 + entryCount * 12;
  if (nextIfdPointerOffset + 4 > dngBytes.byteLength) {
    return dngBytes;
  }

  if (view.getUint32(nextIfdPointerOffset, true) !== 0) {
    return dngBytes;
  }

  const jpegOffset = dngBytes.byteLength;
  const ifdOffset = padEven(jpegOffset + preview.jpegData.byteLength);

  const entries = [
    tag(254, 4, 1, packLongs([1])),
    tag(256, 4, 1, packLongs([preview.width])),
    tag(257, 4, 1, packLongs([preview.height])),
    tag(259, 3, 1, packShorts([6])),
    tag(262, 3, 1, packShorts([6])),
    tag(274, 3, 1, packShorts([preview.orientation || 1])),
    tag(277, 3, 1, packShorts([3])),
    tag(513, 4, 1, packLongs([jpegOffset])),
    tag(514, 4, 1, packLongs([preview.jpegData.byteLength]))
  ].sort((left, right) => left.id - right.id);

  const ifdLength = 2 + entries.length * 12 + 4;
  const totalLength = ifdOffset + ifdLength;
  const output = new Uint8Array(totalLength);
  output.set(dngBytes, 0);
  output.set(preview.jpegData, jpegOffset);

  const ifdBytes = new Uint8Array(ifdLength);
  const ifdView = new DataView(ifdBytes.buffer);
  ifdView.setUint16(0, entries.length, true);

  entries.forEach((entry, index) => {
    const cursor = 2 + index * 12;
    ifdView.setUint16(cursor, entry.id, true);
    ifdView.setUint16(cursor + 2, entry.type, true);
    ifdView.setUint32(cursor + 4, entry.count, true);
    ifdBytes.set(entry.value, cursor + 8);
  });

  ifdView.setUint32(2 + entries.length * 12, 0, true);
  output.set(ifdBytes, ifdOffset);
  new DataView(output.buffer).setUint32(nextIfdPointerOffset, ifdOffset, true);

  return output;
}

function tag(id: number, type: number, count: number, value: Uint8Array) {
  return { id, type, count, value };
}

function packShorts(values: number[]) {
  const bytes = new Uint8Array(values.length * 2);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint16(index * 2, value, true));
  return bytes;
}

function packLongs(values: number[]) {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint32(index * 4, value, true));
  return bytes;
}

function padEven(value: number) {
  return value % 2 === 0 ? value : value + 1;
}
