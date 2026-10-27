export default function ProgressBar({ percent, className = "" }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-panel-light ${className}`}>
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
