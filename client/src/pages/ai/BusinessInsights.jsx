import { useQuery } from '@tanstack/react-query';
import { aiService } from '../../services/index';
import { formatCurrency, formatNumber, getErrorMessage } from '../../utils/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, BarChart3, RefreshCw, Lightbulb, Target, ShieldAlert
} from 'lucide-react';

export default function BusinessInsights() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ai-business-insights'],
    queryFn: () => aiService.getBusinessInsights(),
    staleTime: 60_000,
  });

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;
  if (error) {
    const errorMsg = getErrorMessage(error);
    return (
      <ErrorState
        message={errorMsg || 'Failed to generate AI insights. Please check GEMINI_API_KEY in server/.env and restart the server.'}
        onRetry={refetch}
      />
    );
  }

  const insightsData = data?.data?.data?.insights || {};
  const metrics = data?.data?.data?.metrics || {};
  const insightsList = insightsData.insights || [];
  const overallHealth = insightsData.overallHealth || 'good';
  const topRecommendation = insightsData.topRecommendation;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
            <Lightbulb size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Business Insights</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Automated sales telemetry analysis & tactical recommendations by Google Gemini
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-xs"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Top Banner: Overall Health & Top Recommendation */}
      <div className="card p-6 border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`badge ${overallHealth === 'good' ? 'bg-emerald-100 text-emerald-800' :
                  overallHealth === 'needs_attention' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                Pipeline Health: {overallHealth.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-2">Executive Recommendation</h3>
            <p className="text-sm text-gray-700 max-w-3xl leading-relaxed">
              {topRecommendation || 'Focus on qualifying high-value leads and accelerating deals in Negotiation stage.'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
            <div className="text-center px-2">
              <span className="text-xs text-gray-400 block">Conversion</span>
              <span className="text-lg font-bold text-indigo-600">{metrics.leads?.conversionRate || 0}%</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-xs text-gray-400 block">Active Deals</span>
              <span className="text-lg font-bold text-gray-900">{metrics.deals?.active || 0}</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center px-2">
              <span className="text-xs text-gray-400 block">Won Revenue</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(metrics.deals?.wonRevenue || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insightsList.map((item, idx) => {
          const isHigh = item.priority === 'high';
          const isMedium = item.priority === 'medium';

          return (
            <div
              key={idx}
              className="card p-5 space-y-3 border-l-4"
              style={{
                borderLeftColor: isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#3b82f6',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                <span className={`badge text-[10px] ${isHigh ? 'bg-red-100 text-red-700' : isMedium ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                  {item.priority} priority
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">{item.explanation}</p>

              {item.metrics && (
                <div className="p-2 bg-gray-50 rounded text-[11px] text-gray-500 font-mono">
                  📊 Metrics: {item.metrics}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-semibold text-indigo-600 block">Action Plan:</span>
                <p className="text-xs text-gray-700 mt-0.5">{item.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      {insightsList.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p>No actionable insights generated yet.</p>
        </div>
      )}
    </div>
  );
}
