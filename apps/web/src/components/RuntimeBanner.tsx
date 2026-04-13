interface RuntimeBannerProps {
  status: "checking" | "ready" | "error";
  message: string;
}

export function RuntimeBanner({ status, message }: RuntimeBannerProps) {
  return (
    <section className={`panel runtime-banner runtime-${status}`}>
      <div className="panel-heading">
        <h2>Conversion engine</h2>
        <span className={`badge badge-${status}`}>
          {status === "checking" ? "Checking" : status === "ready" ? "Ready" : "Error"}
        </span>
      </div>
      <p>{message}</p>
    </section>
  );
}
