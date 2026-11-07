import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { contactService, companyService, exportService } from '../../services/index';
import { formatDate, getErrorMessage, getInitials, downloadBlob, debounce } from '../../utils/index';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import { Plus, Search, Download, Trash2, Edit, Eye, Mail, Phone, Building2, User } from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    company: '',
    notes: '',
  });

  const debouncedSearch = useCallback(
    debounce((v) => { setSearch(v); setPage(1); }, 400),
    []
  );

  const params = useMemo(() => ({ page, limit: 15, search }), [page, search]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactService.getContacts(params),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: () => companyService.getCompanies({ limit: 100 }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editContact ? contactService.updateContact(editContact._id, payload) : contactService.createContact(payload),
    onSuccess: () => {
      toast.success(editContact ? 'Contact updated' : 'Contact created');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setModalOpen(false);
      setEditContact(null);
      setForm({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '', company: '', notes: '' });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => contactService.deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleExport = async () => {
    try {
      const res = await exportService.exportContacts();
      downloadBlob(res.data, 'contacts-export.csv');
      toast.success('Contacts exported');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditContact(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '', company: '', notes: '' });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditContact(c);
    setForm({
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email || '',
      phone: c.phone || '',
      jobTitle: c.jobTitle || '',
      department: c.department || '',
      company: c.company?._id || c.company || '',
      notes: c.notes || '',
    });
    setModalOpen(true);
  };

  if (error) return <ErrorState message="Failed to load contacts" onRetry={refetch} />;

  const contacts = data?.data?.data || [];
  const meta = data?.data?.meta;
  const companies = companiesData?.data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{meta?.total ?? 0} total business contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary"><Download size={14} /> Export</button>
          <button onClick={openCreateModal} className="btn-primary"><Plus size={14} /> Add Contact</button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search contacts by name, email..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts found"
            message="Add contacts to maintain your corporate directory and communication log"
            action={<button onClick={openCreateModal} className="btn-primary"><Plus size={14} /> Add Contact</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Job Title</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Added</th>
                  <th className="table-th w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <Link to={`/contacts/${c._id}`} className="flex items-center gap-2.5 font-medium text-gray-900 hover:text-primary-600">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                          {getInitials(c.firstName, c.lastName)}
                        </div>
                        <span>{c.firstName} {c.lastName}</span>
                      </Link>
                    </td>
                    <td className="table-td text-gray-600">
                      {c.company ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-gray-400" />
                          {c.company.name || 'Company'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td text-gray-600">{c.jobTitle || '—'}</td>
                    <td className="table-td text-gray-600">{c.email || '—'}</td>
                    <td className="table-td text-gray-600">{c.phone || '—'}</td>
                    <td className="table-td text-xs text-gray-500">{formatDate(c.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/contacts/${c._id}`)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
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

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editContact ? 'Edit Contact' : 'Create New Contact'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({
              ...form,
              company: form.company || undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name *</label>
              <input
                className="input"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job Title</label>
              <input
                className="input"
                placeholder="e.g. VP Engineering"
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Department</label>
              <input
                className="input"
                placeholder="e.g. Product"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Company Association</label>
            <select
              className="input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            >
              <option value="">No Company Linked</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input h-20"
              placeholder="Background, relationship notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? 'Saving...' : editContact ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Contact"
        message="Are you sure you want to delete this contact?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
