import { CapabilitySummary } from "@web/components/CapabilitySummary";
import { Dropzone } from "@web/components/Dropzone";
import { RuntimeBanner } from "@web/components/RuntimeBanner";
import { TaskList } from "@web/components/TaskList";
import { useConversionController } from "@web/app/useConversionController";

export function App() {
  const { capability, tasks, runtimeStatus, runtimeMessage, addFiles, downloadTask, downloadAllCompletedTasks } = useConversionController();

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Client-side RAW to DNG</p>
        <h1>Built for phones that cannot run desktop RAW apps.</h1>
        <p className="hero-copy">
          Upload, queue, convert, and download without sending images to any server.
          This build prioritizes mobile browser safety over aggressive throughput.
        </p>
      </header>

      <RuntimeBanner status={runtimeStatus} message={runtimeMessage} />
      <CapabilitySummary capability={capability} />
      <Dropzone disabled={runtimeStatus !== "ready"} onFiles={addFiles} />
      <TaskList tasks={tasks} onDownload={downloadTask} onDownloadAll={downloadAllCompletedTasks} />
    </main>
  );
}
