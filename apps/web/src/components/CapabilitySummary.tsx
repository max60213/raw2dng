import type { CapabilityProfile } from "@raw-core";

interface CapabilitySummaryProps {
  capability: CapabilityProfile;
}

export function CapabilitySummary({ capability }: CapabilitySummaryProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Device profile</h2>
        <span className={`badge badge-${capability.formFactor}`}>
          {capability.formFactor === "mobile" ? "Mobile-first" : "Desktop"}
        </span>
      </div>
      <dl className="meta-grid">
        <div>
          <dt>Concurrent jobs</dt>
          <dd>{capability.maxConcurrentJobs}</dd>
        </div>
        <div>
          <dt>Suggested batch</dt>
          <dd>{capability.maxBatchItems}</dd>
        </div>
        <div>
          <dt>Max file</dt>
          <dd>{Math.round(capability.maxFileBytes / (1024 * 1024))} MB</dd>
        </div>
      </dl>
      <ul className="notes">
        {capability.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
