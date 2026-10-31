export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <p className="text-sm text-gray-500">Loading Nexora CRM...</p>
      </div>
    </div>
  );
}

