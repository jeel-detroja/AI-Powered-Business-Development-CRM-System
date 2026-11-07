import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/index';
import { formatCurrency, formatNumber } from '../utils/index';
import { TableSkeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, BarChart3, DollarSign, Users, Award, Calendar
} from 'lucide-react';

export default function Analytics() {
  const [period, setPeriod] = useState('month');

  const { data: revData, isLoading: revLoading } = useQuery({
    queryKey: ['analytics-revenue', period],
    queryFn: () => analyticsService.getRevenue({ period }),
  });

  const { data: leadGenData, isLoading: lgLoading } = useQuery({
    queryKey: ['analytics-lead-gen', period],
    queryFn: () => analyticsService.getLeadGeneration({ period }),
  });

  const { data: repData, isLoading: repLoading } = useQuery({
    queryKey: ['analytics-sales-reps'],
    queryFn: () => analyticsService.getSalesRepPerformance(),
  });

  const { data: sourcePerfData } = useQuery({
    queryKey: ['analytics-source-performance'],
    queryFn: () => analyticsService.getLeadSourcePerformance(),
  });

  const revenue = revData?.data?.data || [];
  const leadGen = leadGenData?.data?.data || [];
  const reps = repData?.data?.data || [];
  const sources = sourcePerfData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Sales Intelligence</h1>
          <p className="text-gray-500 text-sm mt-0.5">Comprehensive telemetry on pipeline conversions, reps, and revenue</p>
        </div>
      </div>

      {/* Row 1: Revenue Trends & Lead Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Monthly Revenue Influx (₹)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Lead Generation Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadGen}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Sales Rep Performance Table & Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Sales Representative Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="table-th">Representative</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Leads Owned</th>
                  <th className="table-th">Deals Won</th>
                  <th className="table-th">Closed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reps.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {r.user?.firstName || 'Representative'} {r.user?.lastName || ''}
                    </td>
                    <td className="table-td capitalize text-gray-500">{r.user?.role || 'rep'}</td>
                    <td className="table-td font-semibold">{r.totalLeads || 0}</td>
                    <td className="table-td text-emerald-600 font-semibold">{r.dealsWon || 0}</td>
                    <td className="table-td font-bold text-gray-900">{formatCurrency(r.revenue || 0)}</td>
                  </tr>
                ))}
                {reps.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-gray-400">No representative metrics available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Lead Source Efficiency</h3>
          <div className="space-y-3">
            {sources.map((s, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between font-medium text-gray-700 mb-1">
                  <span>{s.source}</span>
                  <span>{s.count} leads ({s.conversionRate || 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (s.conversionRate || 10))}%` }}
                  />
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No source telemetry</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
