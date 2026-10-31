import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The CRM record, pipeline view, or resource you're trying to access does not exist or has been relocated.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          <Home size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
