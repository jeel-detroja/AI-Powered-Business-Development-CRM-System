import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyService, contactService, dealService } from '../../services/index';
import { formatDate, formatDateTime, formatCurrency, getErrorMessage, getInitials } from '../../utils/index';
import { STAGE_COLORS } from '../../constants/index';
import { TableSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/Modal';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Globe, MapPin, Users, Briefcase, DollarSign, Trash2, Edit, TrendingUp
} from 'lucide-react';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompany(id),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['company-contacts', id],
    queryFn: () => contactService.getContacts({ company: id }),
  });

  const { data: dealsData } = useQuery({
    queryKey: ['company-deals', id],
    queryFn: () => dealService.getDeals({ company: id }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => companyService.deleteCompany(id),
    onSuccess: () => {
      toast.success('Company deleted');
      navigate('/companies');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;
  if (error || !data?.data?.data) return <ErrorState message="Company not found" onRetry={refetch} />;

  const company = data.data.data;
  const contacts = contactsData?.data?.data || [];
  const deals = dealsData?.data?.data || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/companies')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500">{company.industry || 'Company'} • {company.location || 'Global'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="btn-secondary">
              <Globe size={14} /> Website
            </a>
          )}
          <button onClick={() => setDeleteModal(true)} className="btn-secondary text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">About {company.name}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {company.description || 'No detailed corporate description provided.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Industry</span>
                <span className="font-medium text-gray-800">{company.industry || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Company Size</span>
                <span className="font-medium text-gray-800">{company.size || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Revenue</span>
                <span className="font-medium text-gray-800">{company.annualRevenueRange || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Business Model</span>
                <span className="font-medium text-gray-800">{company.businessType || 'B2B'}</span>
              </div>
            </div>
          </div>

          {/* Linked Contacts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Key Contacts ({contacts.length})</h3>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No contacts linked to this company yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {getInitials(c.firstName, c.lastName)}
                      </div>
                      <div>
                        <Link to={`/contacts/${c._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {c.firstName} {c.lastName}
                        </Link>
                        <p className="text-xs text-gray-500">{c.jobTitle || 'Executive'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{c.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Deals */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Deals & Opportunities ({deals.length})</h3>
            </div>
            {deals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No active deals found for this organization.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {deals.map((d) => (
                  <div key={d._id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/deals/${d._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {d.title}
                      </Link>
                      <p className="text-xs text-gray-500">Close: {formatDate(d.expectedCloseDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${STAGE_COLORS[d.stage] || 'bg-gray-100'}`}>{d.stage}</span>
                      <span className="font-semibold text-sm text-gray-900">{formatCurrency(d.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Organization Meta</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <span className="text-xs text-gray-400 block">Created Date</span>
                <span>{formatDateTime(company.createdAt)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Record ID</span>
                <span className="font-mono text-xs text-gray-500">{company._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Company"
        message={`Are you sure you want to delete ${company.name}?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
