import DropZone from './DropZone';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-base">
      <div className="flex flex-col items-center gap-2 mb-12">
        <h1 className="text-text text-3xl font-bold tracking-tight font-sans">
          VelocityRead
        </h1>
        <p className="text-text-muted text-sm font-mono tracking-widest uppercase">
          Speed-read anything
        </p>
      </div>
      <DropZone />
    </div>
  );
}