import type { ConversionTask } from "@raw-core/types";

export function createTask(file: File): ConversionTask {
  return {
    id: createTaskId(file),
    fileName: file.name,
    size: file.size,
    status: "queued",
    progress: 0,
    message: "Waiting"
  };
}

function createTaskId(file: File): string {
  const salt = `${file.name}:${file.size}:${file.lastModified}`;
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${hashString(salt)}`;
}

function hashString(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}
