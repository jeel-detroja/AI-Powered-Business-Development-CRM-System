import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { leadService, exportService, userService } from '../../services/index';
import { formatDate, formatCurrency, getErrorMessage, downloadBlob } from '../../utils/index';
import { getInitials } from '../../utils/index';
import { debounce } from '../../utils/index';
import { LEAD_STATUS, LEAD_SOURCES, LEAD_PRIORITIES, LEAD_STATUS_COLORS, PRIORITY_COLORS, CATEGORY_COLORS } from '../../constants/index';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  Plus, Search, Filter, Download, Upload, Trash2, MoreHorizontal,
  UserCheck, Eye, Edit, ChevronDown, Users,
} from 'lucide-react';

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ status: '', source: '', priority: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useCallback(
    debounce((v) => { setSearch(v); setPage(1); }, 400),
    []
  );

  const params = useMemo(() => ({
    page, limit: 15, search,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  }), [page, search, filters]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadService.getLeads(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => leadService.deleteLead(id),
    onSuccess: () => { toast.success('Lead deleted'); queryClient.invalidateQueries({ queryKey: ['leads'] }); setDeleteId(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (data) => leadService.bulkUpdateStatus(data),
    onSuccess: (res) => { toast.success(res.data.message); queryClient.invalidateQueries({ queryKey: ['leads'] }); setSelected([]); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleExport = async () => {
    try {
      const res = await exportService.exportLeads(filters);
      downloadBlob(res.data, 'leads-export.csv');
      toast.success('Leads exported');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const leads = data?.data?.data || [];
  const meta = data?.data?.meta;

  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === leads.length ? [] : leads.map((l) => l._id));

  if (error) return <ErrorState message="Failed to load leads" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">{meta?.total ?? 0} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary"><Download size={14} /> Export</button>
          <Link to="/leads/new" className="btn-primary"><Plus size={14} /> Add Lead</Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search leads..."
              value={searchInput} onChange={(e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : ''}`}>
            <Filter size={14} /> Filters
          </button>
          {selected.length > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <span className="text-sm text-gray-600">{selected.length} selected</span>
              {LEAD_STATUS.map((s) => (
                <button key={s} onClick={() => bulkStatusMutation.mutate({ ids: selected, status: s })}
                  className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600">
                  → {s}
                </button>
              )).slice(0, 4)}
            </div>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <select className="input w-auto" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
              <option value="">All Statuses</option>
              {LEAD_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input w-auto" value={filters.source} onChange={(e) => { setFilters({ ...filters, source: e.target.value }); setPage(1); }}>
              <option value="">All Sources</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input w-auto" value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
              <option value="">All Priorities</option>
              {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => { setFilters({ status: '', source: '', priority: '' }); setPage(1); }}
              className="text-sm text-primary-600 hover:text-primary-700">Clear all</button>
          </div>
        )}

        {/* Table */}
        {isLoading ? <TableSkeleton rows={8} cols={7} /> : leads.length === 0 ? (
          <EmptyState title="No leads found" message="Create your first lead to get started"
            action={<Link to="/leads/new" className="btn-primary"><Plus size={14} /> Add Lead</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th w-10">
                    <input type="checkbox" checked={selected.length === leads.length && leads.length > 0}
                      onChange={toggleAll} className="rounded border-gray-300" />
                  </th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Score</th>
                  <th className="table-th">Source</th>
                  <th className="table-th">Assigned</th>
                  <th className="table-th">Created</th>
                  <th className="table-th w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <input type="checkbox" checked={selected.includes(lead._id)}
                        onChange={() => toggleSelect(lead._id)} className="rounded border-gray-300" />
                    </td>
                    <td className="table-td">
                      <Link to={`/leads/${lead._id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {lead.firstName} {lead.lastName}
                      </Link>
                      {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
                    </td>
                    <td className="table-td text-gray-600">{lead.companyName || '—'}</td>
                    <td className="table-td">
                      <span className={`badge ${LEAD_STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${PRIORITY_COLORS[lead.priority] || ''}`}>{lead.priority}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${lead.score || 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{lead.score || 0}</span>
                        {lead.category && (
                          <span className={`badge text-xs ${CATEGORY_COLORS[lead.category] || ''}`}>
                            {lead.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-gray-600 text-xs">{lead.source}</td>
                    <td className="table-td">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: lead.assignedTo.avatarColor || '#6366f1' }}>
                            {getInitials(lead.assignedTo.firstName, lead.assignedTo.lastName)}
                          </div>
                          <span className="text-xs text-gray-600">{lead.assignedTo.firstName}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="table-td text-xs text-gray-500">{formatDate(lead.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/leads/${lead._id}`)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400"><Eye size={14} /></button>
                        <button onClick={() => navigate(`/leads/${lead._id}/edit`)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit size={14} /></button>
                        <button onClick={() => setDeleteId(lead._id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Delete Lead" message="Are you sure you want to delete this lead? This action cannot be undone." />
    </div>
  );
}

