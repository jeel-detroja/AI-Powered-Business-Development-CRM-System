import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <p className="text-gray-900 font-medium mb-1">Error loading data</p>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

