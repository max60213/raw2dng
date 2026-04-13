import type { DngBuildInput } from "../../../raw-core/src/types";
import { DNG_TAGS, TIFF_TYPES } from "../tags/constants";
import { packAscii, packLongs, packRationals, packShorts } from "../tiff/pack";

type TagValue = Uint8Array;

interface TagEntry {
  id: number;
  type: number;
  count: number;
  value: TagValue;
}

export function buildDng(input: DngBuildInput): Blob {
  const imageBytes = packImageData(input.imageData);
  const entries = buildEntries(input, imageBytes.byteLength);
  const ifdBytesLength = 2 + entries.length * 12 + 4;
  let dataOffset = 8 + ifdBytesLength;
  const payloads: { offset: number; bytes: Uint8Array }[] = [];
  let stripOffsetDirectoryOffset = 0;

  const directory = new Uint8Array(ifdBytesLength);
  const directoryView = new DataView(directory.buffer);
  directoryView.setUint16(0, entries.length, true);

  entries.forEach((entry, index) => {
    const cursor = 2 + index * 12;
    directoryView.setUint16(cursor, entry.id, true);
    directoryView.setUint16(cursor + 2, entry.type, true);
    directoryView.setUint32(cursor + 4, entry.count, true);

    if (entry.id === DNG_TAGS.stripOffsets) {
      stripOffsetDirectoryOffset = cursor + 8;
      return;
    }

    if (entry.value.byteLength <= 4) {
      directory.set(entry.value, cursor + 8);
    } else {
      directoryView.setUint32(cursor + 8, dataOffset, true);
      payloads.push({ offset: dataOffset, bytes: entry.value });
      dataOffset += entry.value.byteLength;
      if (dataOffset % 2 !== 0) {
        dataOffset += 1;
      }
    }
  });

  directoryView.setUint32(2 + entries.length * 12, 0, true);

  directoryView.setUint32(stripOffsetDirectoryOffset, dataOffset, true);
  payloads.push({ offset: dataOffset, bytes: imageBytes });
  dataOffset += imageBytes.byteLength;
  if (dataOffset % 2 !== 0) {
    dataOffset += 1;
  }

  const totalLength = dataOffset;
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(buffer.buffer);

  buffer[0] = 0x49;
  buffer[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  buffer.set(directory, 8);

  payloads.forEach(({ offset, bytes }) => {
    buffer.set(bytes, offset);
  });

  return new Blob([buffer], { type: "image/x-adobe-dng" });
}

function buildEntries(input: DngBuildInput, imageByteLength: number): TagEntry[] {
  return [
    shortTag(DNG_TAGS.newSubfileType, 0),
    longTag(DNG_TAGS.imageWidth, input.width),
    longTag(DNG_TAGS.imageLength, input.height),
    shortTag(DNG_TAGS.bitsPerSample, input.bitDepth),
    shortTag(DNG_TAGS.compression, 1),
    shortTag(DNG_TAGS.photometricInterpretation, 32803),
    asciiTag(DNG_TAGS.make, input.metadata.make),
    asciiTag(DNG_TAGS.model, input.metadata.model),
    longTag(DNG_TAGS.stripOffsets, 0), // patched below
    shortTag(DNG_TAGS.orientation, input.metadata.orientation),
    shortTag(DNG_TAGS.samplesPerPixel, 1),
    longTag(DNG_TAGS.rowsPerStrip, input.height),
    longTag(DNG_TAGS.stripByteCounts, imageByteLength),
    shortTag(DNG_TAGS.planarConfiguration, 1),
    shortArrayTag(DNG_TAGS.cfaRepeatPatternDim, [2, 2]),
    byteArrayTag(DNG_TAGS.cfaPattern, input.metadata.cfaPattern),
    byteArrayTag(DNG_TAGS.dngVersion, [1, 4, 0, 0]),
    byteArrayTag(DNG_TAGS.dngBackwardVersion, [1, 1, 0, 0]),
    asciiTag(DNG_TAGS.uniqueCameraModel, `${input.metadata.make} ${input.metadata.model}`.trim()),
    shortTag(DNG_TAGS.blackLevel, input.metadata.blackLevel),
    shortTag(DNG_TAGS.whiteLevel, input.metadata.whiteLevel),
    rationalArrayTag(DNG_TAGS.defaultScale, [1, 1]),
    shortArrayTag(DNG_TAGS.defaultCropOrigin, [0, 0]),
    shortArrayTag(DNG_TAGS.defaultCropSize, [input.width, input.height]),
    srationalArrayTag(DNG_TAGS.colorMatrix1, input.metadata.colorMatrix1),
    rationalArrayTag(DNG_TAGS.asShotNeutral, input.metadata.asShotNeutral),
    shortTag(DNG_TAGS.calibrationIlluminant1, input.metadata.calibrationIlluminant1),
    longArrayTag(DNG_TAGS.activeArea, input.metadata.activeArea),
    byteArrayTag(DNG_TAGS.cfaPlaneColor, [0, 1, 2]),
    shortTag(DNG_TAGS.cfaLayout, 1)
  ];
}

function shortTag(id: number, value: number): TagEntry {
  return {
    id,
    type: TIFF_TYPES.short,
    count: 1,
    value: packShorts([value])
  };
}

function shortArrayTag(id: number, values: number[]): TagEntry {
  return {
    id,
    type: TIFF_TYPES.short,
    count: values.length,
    value: packShorts(values)
  };
}

function longTag(id: number, value: number): TagEntry {
  return {
    id,
    type: TIFF_TYPES.long,
    count: 1,
    value: packLongs([value])
  };
}

function longArrayTag(id: number, values: number[]): TagEntry {
  return {
    id,
    type: TIFF_TYPES.long,
    count: values.length,
    value: packLongs(values)
  };
}

function asciiTag(id: number, value: string): TagEntry {
  return {
    id,
    type: TIFF_TYPES.ascii,
    count: value.length + 1,
    value: packAscii(value)
  };
}

function byteArrayTag(id: number, values: number[]): TagEntry {
  return {
    id,
    type: TIFF_TYPES.byte,
    count: values.length,
    value: new Uint8Array(values)
  };
}

function rationalArrayTag(id: number, values: number[]): TagEntry {
  return {
    id,
    type: TIFF_TYPES.rational,
    count: values.length,
    value: packRationals(values)
  };
}

function srationalArrayTag(id: number, values: number[]): TagEntry {
  return {
    id,
    type: TIFF_TYPES.srational,
    count: values.length,
    value: packRationals(values)
  };
}

function packImageData(imageData: Uint16Array): Uint8Array {
  const bytes = new Uint8Array(imageData.length * 2);
  const view = new DataView(bytes.buffer);
  imageData.forEach((value, index) => view.setUint16(index * 2, value, true));
  return bytes;
}
