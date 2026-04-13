import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
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
  const queueRef = useRef<PendingJob[]>([]);
  const activeJobIdsRef = useRef(new Set<string>());
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/conversion.worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

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
            activeJobIdsRef.current.delete(message.jobId);
            return {
              ...task,
              status: "complete",
              progress: 100,
              message: `Ready: ${message.outputName}`,
              outputBlob: message.blob,
              outputFileName: message.outputName
            };
          }

          activeJobIdsRef.current.delete(message.jobId);
          return {
            ...task,
            status: "error",
            progress: 100,
            error: message.error,
            message: message.error
          };
        })
      );

      pumpQueue(worker, capability, queueRef.current, activeJobIdsRef.current, setTasks);
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, [capability]);

  function addFiles(files: File[]) {
    const limited = files.slice(0, capability.maxBatchItems);
    const nextTasks: ConversionTask[] = [];

    limited.forEach((file) => {
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

    const url = URL.createObjectURL(task.outputBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = task.outputFileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    capability,
    tasks,
    addFiles,
    downloadTask
  };
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
