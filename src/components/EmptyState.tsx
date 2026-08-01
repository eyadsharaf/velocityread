import DropZone from './DropZone';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#121212]">
      <h1 className="text-[#E0E0E0] text-3xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        VelocityRead
      </h1>
      <p className="text-[#666] text-sm mb-12">Speed-read anything.</p>
      <DropZone />
    </div>
  );
}
