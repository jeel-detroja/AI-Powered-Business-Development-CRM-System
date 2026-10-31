import { useState } from 'react';
import { exportService } from '../services/index';
import { downloadBlob, getErrorMessage } from '../utils/index';
import { toast } from 'sonner';
import {
  FileText, Download, Table, Calendar, CheckSquare, Users, TrendingUp, Building2
} from 'lucide-react';

export default function Reports() {
  const [downloading, setDownloading] = useState('');

  const handleExport = async (type) => {
    setDownloading(type);
    try {
      let res;
      if (type === 'leads') res = await exportService.exportLeads();
      else if (type === 'contacts') res = await exportService.exportContacts();
      else if (type === 'deals') res = await exportService.exportDeals();

      if (res?.data) {
        downloadBlob(res.data, `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`${type.toUpperCase()} report exported successfully`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading('');
    }
  };

  const reportsList = [
    {
      id: 'leads',
      title: 'Full Leads Database Export',
      desc: 'All leads across pipeline stages with qualification scores, contact info, and sources.',
      icon: Users,
    },
    {
      id: 'deals',
      title: 'Pipeline & Deals Financial Report',
      desc: 'Complete deal values, win probabilities, expected closing dates, and stage progression.',
      icon: TrendingUp,
    },
    {
      id: 'contacts',
      title: 'Corporate Contacts Directory',
      desc: 'Consolidated list of company stakeholders, phone numbers, and job titles.',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Standard Reports & CSV Exports</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Download formatted CSV reports grounded in real-time MongoDB aggregations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportsList.map((r) => {
          const IconComp = r.icon;
          return (
            <div key={r.id} className="card p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IconComp size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 text-base">{r.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
              </div>

              <button
                onClick={() => handleExport(r.id)}
                disabled={downloading === r.id}
                className="btn-primary w-full justify-center text-xs"
              >
                <Download size={14} className={downloading === r.id ? 'animate-bounce' : ''} />
                {downloading === r.id ? 'Preparing CSV...' : 'Download CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
