import { useReaderStore } from './store/readerStore';
import EmptyState from './components/EmptyState';
import Reader from './components/Reader';

export default function App() {
  const { doc } = useReaderStore();

  return (
    <div className="w-full h-full">
      {doc ? <Reader /> : <EmptyState />}
    </div>
  );
}
