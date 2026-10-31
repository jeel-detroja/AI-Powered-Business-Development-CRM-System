import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <p className="text-gray-900 font-medium mb-1">{title}</p>
      {message && <p className="text-gray-500 text-sm mb-4">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

