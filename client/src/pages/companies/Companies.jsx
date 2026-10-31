import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { companyService, exportService } from '../../services/index';
import { formatDate, getErrorMessage, downloadBlob, debounce } from '../../utils/index';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import { Plus, Search, Download, Trash2, Edit, Eye, Building2, Globe, MapPin, Users } from 'lucide-react';

export default function Companies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    size: '',
    location: '',
    annualRevenueRange: '',
    businessType: '',
    description: '',
  });

  const debouncedSearch = useCallback(
    debounce((v) => { setSearch(v); setPage(1); }, 400),
    []
  );

  const params = useMemo(() => ({ page, limit: 15, search }), [page, search]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyService.getCompanies(params),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editCompany ? companyService.updateCompany(editCompany._id, payload) : companyService.createCompany(payload),
    onSuccess: () => {
      toast.success(editCompany ? 'Company updated' : 'Company added');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setModalOpen(false);
      setEditCompany(null);
      setForm({ name: '', industry: '', website: '', size: '', location: '', annualRevenueRange: '', businessType: '', description: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyService.deleteCompany(id),
    onSuccess: () => {
      toast.success('Company deleted');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleExport = async () => {
    try {
      const res = await exportService.exportCompanies();
      downloadBlob(res.data, 'companies-export.csv');
      toast.success('Companies exported');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditCompany(null);
    setForm({ name: '', industry: '', website: '', size: '', location: '', annualRevenueRange: '', businessType: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditCompany(c);
    setForm({
      name: c.name || '',
      industry: c.industry || '',
      website: c.website || '',
      size: c.size || '',
      location: c.location || '',
      annualRevenueRange: c.annualRevenueRange || '',
      businessType: c.businessType || '',
      description: c.description || '',
    });
    setModalOpen(true);
  };

  if (error) return <ErrorState message="Failed to load companies" onRetry={refetch} />;

  const companies = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 text-sm mt-0.5">{meta?.total ?? 0} corporate organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary"><Download size={14} /> Export</button>
          <button onClick={openCreateModal} className="btn-primary"><Plus size={14} /> Add Company</button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search companies by name, industry, location..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies found"
            message="Add companies to build your business directory and link deals"
            action={<button onClick={openCreateModal} className="btn-primary"><Plus size={14} /> Add Company</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Company Name</th>
                  <th className="table-th">Industry</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Size</th>
                  <th className="table-th">Revenue Range</th>
                  <th className="table-th">Website</th>
                  <th className="table-th w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <Link to={`/companies/${c._id}`} className="flex items-center gap-2 font-medium text-gray-900 hover:text-primary-600">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Building2 size={15} />
                        </div>
                        <span>{c.name}</span>
                      </Link>
                    </td>
                    <td className="table-td text-gray-600">{c.industry || '—'}</td>
                    <td className="table-td text-gray-600">
                      {c.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" /> {c.location}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td text-gray-600">{c.size || '—'}</td>
                    <td className="table-td text-gray-600">{c.annualRevenueRange || '—'}</td>
                    <td className="table-td text-gray-600 text-xs">
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">
                          <Globe size={12} /> {c.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/companies/${c._id}`)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEditModal(c)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => setDeleteId(c._id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
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

      {/* Add / Edit Company Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCompany ? 'Edit Company' : 'Add New Company'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Company Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Industry</label>
              <input
                className="input"
                placeholder="e.g. Technology"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="e.g. Austin, TX"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company Size</label>
              <select
                className="input"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="10-50">10-50 employees</option>
                <option value="50-200">50-200 employees</option>
                <option value="200-500">200-500 employees</option>
                <option value="500-1000">500-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
            <div>
              <label className="label">Revenue Range</label>
              <input
                className="input"
                placeholder="e.g. $10M-$50M"
                value={form.annualRevenueRange}
                onChange={(e) => setForm({ ...form, annualRevenueRange: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input"
              placeholder="https://company.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description / Business Type</label>
            <textarea
              className="input h-20"
              placeholder="Overview of company operations and products..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? 'Saving...' : editCompany ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Company"
        message="Are you sure you want to delete this company?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
