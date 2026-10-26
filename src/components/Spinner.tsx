/** Centered loading spinner with mono label — shared by the launch/loading
 *  screen and the drop zone's import state. */
export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      {label && <div className="text-text-muted text-sm font-mono">{label}</div>}
    </div>
  );
}
