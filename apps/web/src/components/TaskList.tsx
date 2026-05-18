import type { ConversionTask } from "@raw-core";

interface TaskListProps {
  tasks: ConversionTask[];
  onDownload: (task: ConversionTask) => void;
  onDownloadAll: () => void;
}

export function TaskList({ tasks, onDownload, onDownloadAll }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="panel">
        <h2>Queue</h2>
        <p className="muted">No files queued yet.</p>
      </section>
    );
  }

  const completedCount = tasks.filter((task) => task.outputBlob && task.outputFileName).length;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Queue</h2>
          <span className="muted">{tasks.length} task(s)</span>
        </div>
        <button className="secondary-button" type="button" disabled={completedCount === 0} onClick={onDownloadAll}>
          Download all ZIP{completedCount > 0 ? ` (${completedCount})` : ""}
        </button>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="task-row">
              <strong>{task.fileName}</strong>
              <span className={`status status-${task.status}`}>{task.status}</span>
            </div>
            <div className="task-row">
              <span className="muted">{Math.round(task.size / 1024 / 1024)} MB</span>
              {task.warning ? <span className="warning">{task.warning}</span> : null}
            </div>
            <div className="progress-shell">
              <div className="progress-bar" style={{ width: `${task.progress}%` }} />
            </div>
            <p>{task.error || task.message}</p>
            {task.outputBlob ? (
              <button className="secondary-button" type="button" onClick={() => onDownload(task)}>
                Download {task.outputFileName}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
