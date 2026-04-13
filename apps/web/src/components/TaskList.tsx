import type { ConversionTask } from "@raw-core";

interface TaskListProps {
  tasks: ConversionTask[];
  onDownload: (task: ConversionTask) => void;
}

export function TaskList({ tasks, onDownload }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="panel">
        <h2>Queue</h2>
        <p className="muted">No files queued yet.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Queue</h2>
        <span>{tasks.length} task(s)</span>
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
