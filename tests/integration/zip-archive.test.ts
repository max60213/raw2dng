import { describe, expect, it } from "vitest";
import { createZipArchive } from "../../apps/web/src/app/createZipArchive";

describe("createZipArchive", () => {
  it("writes a valid uncompressed zip central directory", async () => {
    const zip = createZipArchive([
      { name: "first.dng", data: new Uint8Array([1, 2, 3]) },
      { name: "second.dng", data: new Uint8Array([4, 5]) }
    ]);

    const bytes = new Uint8Array(await readBlob(zip));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const endRecordOffset = bytes.byteLength - 22;

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(endRecordOffset, true)).toBe(0x06054b50);
    expect(view.getUint16(endRecordOffset + 8, true)).toBe(2);

    const centralDirectoryOffset = view.getUint32(endRecordOffset + 16, true);
    const names: string[] = [];
    let offset = centralDirectoryOffset;
    for (let index = 0; index < 2; index += 1) {
      expect(view.getUint32(offset, true)).toBe(0x02014b50);
      const nameLength = view.getUint16(offset + 28, true);
      const nameStart = offset + 46;
      names.push(new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLength)));
      offset = nameStart + nameLength;
    }

    expect(names).toEqual(["first.dng", "second.dng"]);
  });
});

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
