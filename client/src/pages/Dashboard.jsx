import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/index';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '../utils/index';
import { CardSkeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import {
  Users, TrendingUp, DollarSign, Target, Activity, AlertTriangle, BarChart3, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { STAGE_COLORS, LEAD_STATUS_COLORS } from '../constants/index';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#f97316'];

function KpiCard({ icon: Icon, label, value, color = 'bg-primary-100 text-primary-600' }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: recentLeadsData } = useQuery({
    queryKey: ['dashboard-recent-leads'],
    queryFn: () => dashboardService.getRecentLeads(),
  });

  const { data: sourceData } = useQuery({
    queryKey: ['dashboard-lead-sources'],
    queryFn: () => dashboardService.getLeadSourceDistribution(),
  });

  const { data: funnelData } = useQuery({
    queryKey: ['dashboard-pipeline-funnel'],
    queryFn: () => dashboardService.getPipelineFunnel(),
  });

  const { data: leadsTimeData } = useQuery({
    queryKey: ['dashboard-leads-time'],
    queryFn: () => dashboardService.getLeadsOverTime(),
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['dashboard-upcoming'],
    queryFn: () => dashboardService.getUpcomingActivities(),
  });

  const { data: todaysTasksData } = useQuery({
    queryKey: ['dashboard-todays-tasks'],
    queryFn: () => dashboardService.getTodaysTasks(),
  });

  if (statsError) return <ErrorState message="Failed to load dashboard" />;

  const stats = statsData?.data?.data;
  const recentLeads = recentLeadsData?.data?.data || [];
  const sources = sourceData?.data?.data || [];
  const funnel = funnelData?.data?.data || [];
  const leadsTime = leadsTimeData?.data?.data || [];
  const upcoming = upcomingData?.data?.data || [];
  const todaysTasks = todaysTasksData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your sales performance</p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Total Leads" value={formatNumber(stats.totalLeads)} color="bg-blue-100 text-blue-600" />
          <KpiCard icon={TrendingUp} label="New This Month" value={formatNumber(stats.newLeadsThisMonth)} color="bg-green-100 text-green-600" />
          <KpiCard icon={Target} label="Qualified Leads" value={formatNumber(stats.qualifiedLeads)} color="bg-amber-100 text-amber-600" />
          <KpiCard icon={BarChart3} label="Active Deals" value={formatNumber(stats.activeDeals)} color="bg-purple-100 text-purple-600" />
          <KpiCard icon={DollarSign} label="Pipeline Value" value={formatCurrency(stats.totalPipelineValue)} color="bg-indigo-100 text-indigo-600" />
          <KpiCard icon={CheckCircle} label="Won Revenue" value={formatCurrency(stats.wonRevenue)} color="bg-emerald-100 text-emerald-600" />
          <KpiCard icon={Activity} label="Conversion Rate" value={`${stats.conversionRate}%`} color="bg-cyan-100 text-cyan-600" />
          <KpiCard icon={AlertTriangle} label="Overdue Follow-ups" value={formatNumber(stats.overdueFollowups)} color="bg-red-100 text-red-600" />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40} paddingAngle={2} label={({ source, count }) => `${source} (${count})`}>
                  {sources.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Value']} />
              <Legend />
              <Bar dataKey="count" fill="#6366f1" name="Deals" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value" fill="#8b5cf6" name="Value ($)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Leads</h3>
            <Link to="/leads" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLeads.map((lead) => (
              <Link key={lead._id} to={`/leads/${lead._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.companyName || 'No company'}</p>
                </div>
                <span className={`badge ${LEAD_STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                  {lead.status}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && <p className="px-5 py-6 text-sm text-gray-500 text-center">No leads yet</p>}
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Activities</h3>
            <Link to="/activities" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.map((act) => (
              <div key={act._id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-900">{act.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5">{act.type} · {formatDate(act.dueAt)}</p>
              </div>
            ))}
            {upcoming.length === 0 && <p className="px-5 py-6 text-sm text-gray-500 text-center">No upcoming activities</p>}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Today's Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todaysTasks.map((task) => (
              <div key={task._id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{task.priority} priority</p>
              </div>
            ))}
            {todaysTasks.length === 0 && <p className="px-5 py-6 text-sm text-gray-500 text-center">No tasks due today</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

