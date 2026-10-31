import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiService } from '../../services/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { toast } from 'sonner';
import {
  Sparkles, CheckCircle2, XCircle, RefreshCw, Cpu, ShieldCheck, Key
} from 'lucide-react';

export default function AISettings() {
  const [testResult, setTestResult] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiService.getAISettings(),
  });

  const testMutation = useMutation({
    mutationFn: () => aiService.testConnection(),
    onSuccess: (res) => {
      setTestResult(res.data.data);
      if (res.data.data?.connected) {
        toast.success('Gemini API connection test successful');
      } else {
        toast.error('Gemini API test failed: ' + (res.data.data?.reason || 'Check key'));
      }
    },
    onError: (err) => {
      toast.error('Test request failed');
    },
  });

  if (isLoading) return <TableSkeleton rows={6} cols={3} />;
  if (error) return <ErrorState message="Failed to load AI system configuration" onRetry={refetch} />;

  const settings = data?.data?.data || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Gemini AI Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure cognitive intelligence engine and model parameters</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-xs">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Gemini Cognitive Engine</h3>
              <p className="text-xs text-gray-500">Official SDK: @google/genai (v0.14+)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {settings.enabled ? (
              <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1.5 py-1 px-3">
                <CheckCircle2 size={14} /> Active & Configured
              </span>
            ) : (
              <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1.5 py-1 px-3">
                <XCircle size={14} /> API Key Missing
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-100">
          <div className="p-4 bg-gray-50 rounded-xl space-y-1">
            <span className="text-xs text-gray-400 block font-medium">Configured Gemini Model</span>
            <span className="font-mono text-sm font-semibold text-gray-900">{settings.model || 'gemini-2.0-flash-001'}</span>
            <p className="text-[11px] text-gray-500">Configured via GEMINI_MODEL in server environment</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl space-y-1">
            <span className="text-xs text-gray-400 block font-medium">Security & Credential Masking</span>
            <span className="font-mono text-sm font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={16} /> Backend Protected
            </span>
            <p className="text-[11px] text-gray-500">API keys never exposed to client runtime</p>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Verify connectivity to Google's inference servers using current environment credentials.
          </div>
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="btn-primary text-xs"
          >
            <RefreshCw size={14} className={testMutation.isPending ? 'animate-spin' : ''} />
            {testMutation.isPending ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs space-y-1 ${
            testResult.connected ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="font-semibold">
              {testResult.connected ? '✓ Connection Verified' : '✗ Connection Failed'}
            </p>
            {testResult.reason && <p>{testResult.reason}</p>}
            {testResult.response && <p className="font-mono">Output: {testResult.response}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
