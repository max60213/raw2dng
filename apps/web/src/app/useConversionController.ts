import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createZipArchive } from "./createZipArchive";
import {
  createQueueWindow,
  createTask,
  detectCapabilityProfile,
  gateFile,
  type CapabilityProfile,
  type ConversionTask
} from "@raw-core";
import type { WorkerResponse } from "@worker-runtime";

interface PendingJob {
  file: File;
  taskId: string;
}

export function useConversionController() {
  const capability = useMemo<CapabilityProfile>(() => detectCapabilityProfile(), []);
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<"checking" | "ready" | "error">("checking");
  const [runtimeMessage, setRuntimeMessage] = useState("Loading LibRaw WebAssembly runtime");
  const queueRef = useRef<PendingJob[]>([]);
  const activeJobIdsRef = useRef(new Set<string>());
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/conversion.worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "ready") {
        setRuntimeStatus("ready");
        setRuntimeMessage("LibRaw WebAssembly runtime is ready.");
        return;
      }

      if (message.type === "runtime-error") {
        setRuntimeStatus("error");
        setRuntimeMessage(message.error);
        return;
      }

      setTasks((current) =>
        current.map((task) => {
          if (task.id !== message.jobId) {
            return task;
          }

          if (message.type === "progress") {
            return {
              ...task,
              status: message.phase,
              progress: message.progress,
              message: message.message
            };
          }

          if (message.type === "success") {
            return {
              ...task,
              status: "complete",
              progress: 100,
              message: `Ready: ${message.outputName}`,
              outputBlob: message.blob,
              outputFileName: message.outputName
            };
          }

          return {
            ...task,
            status: "error",
            progress: 100,
            error: message.error,
            message: message.error
          };
        })
      );

      if (message.type === "success" || message.type === "failure") {
        activeJobIdsRef.current.delete(message.jobId);
      }

      pumpQueue(worker, capability, queueRef.current, activeJobIdsRef.current, setTasks);
    };

    workerRef.current = worker;
    worker.postMessage({ type: "ping" });
    return () => worker.terminate();
  }, [capability]);

  function addFiles(files: File[]) {
    const nextTasks: ConversionTask[] = [];

    files.forEach((file) => {
      const task = createTask(file);
      const gate = gateFile(file, capability);

      if (!gate.accepted) {
        nextTasks.push({
          ...task,
          status: "error",
          progress: 100,
          error: gate.reason,
          message: gate.reason ?? "Rejected"
        });
        return;
      }

      nextTasks.push({
        ...task,
        status: "gated",
        progress: 5,
        warning: gate.warning,
        message: gate.warning ?? "Queued"
      });

      queueRef.current.push({ file, taskId: task.id });
    });

    setTasks((current) => [...current, ...nextTasks]);

    if (workerRef.current) {
      pumpQueue(workerRef.current, capability, queueRef.current, activeJobIdsRef.current, setTasks);
    }
  }

  function downloadTask(task: ConversionTask) {
    if (!task.outputBlob || !task.outputFileName) {
      return;
    }

    downloadBlob(task.outputBlob, task.outputFileName);
  }

  async function downloadAllCompletedTasks() {
    const completedTasks = tasks.filter((task) => task.outputBlob && task.outputFileName);
    if (completedTasks.length === 0) {
      return;
    }

    const usedNames = new Set<string>();
    const completedEntries = completedTasks.map((task) => ({
      task,
      name: makeUniqueFileName(task.outputFileName!, usedNames)
    }));
    const entries = await Promise.all(
      completedEntries.map(async ({ task, name }) => {
        const bytes = new Uint8Array(await task.outputBlob!.arrayBuffer());
        return {
          name,
          data: bytes
        };
      })
    );

    const zip = createZipArchive(entries);
    downloadBlob(zip, `raw2dng-${formatTimestamp(new Date())}.zip`);
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    capability,
    tasks,
    runtimeStatus,
    runtimeMessage,
    addFiles,
    downloadTask,
    downloadAllCompletedTasks
  };
}

function makeUniqueFileName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";
  let index = 2;
  let nextName = `${base}-${index}${extension}`;
  while (usedNames.has(nextName)) {
    index += 1;
    nextName = `${base}-${index}${extension}`;
  }
  usedNames.add(nextName);
  return nextName;
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function pumpQueue(
  worker: Worker,
  capability: CapabilityProfile,
  queue: PendingJob[],
  activeJobIds: Set<string>,
  setTasks: Dispatch<SetStateAction<ConversionTask[]>>
) {
  const slots = createQueueWindow(capability, queue.length + activeJobIds.size);
  while (activeJobIds.size < slots && queue.length > 0) {
    const next = queue.shift();
    if (!next) {
      break;
    }
    activeJobIds.add(next.taskId);
    setTasks((current) =>
      current.map((task) =>
        task.id === next.taskId
          ? {
              ...task,
              status: "queued",
              progress: 10,
              message: "Queued in worker"
            }
          : task
      )
    );

    void next.file.arrayBuffer().then((bytes) => {
      worker.postMessage({
        type: "convert",
        jobId: next.taskId,
        fileName: next.file.name,
        bytes
      });
    });
  }
}
