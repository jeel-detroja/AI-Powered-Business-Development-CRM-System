import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiService, leadService, contactService } from '../../services/index';
import { EMAIL_TYPES, EMAIL_TONES, EMAIL_LENGTHS } from '../../constants/index';
import { getErrorMessage } from '../../utils/index';
import { toast } from 'sonner';
import {
  Mail, Sparkles, Copy, Check, RefreshCw, Send, ArrowRight, UserCheck, Building2
} from 'lucide-react';

export default function EmailGenerator() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const contactId = searchParams.get('contactId');

  const [form, setForm] = useState({
    recipientName: '',
    recipientCompany: '',
    recipientJobTitle: '',
    emailType: 'Introduction Email',
    tone: 'Professional',
    length: 'Medium',
    objective: 'Introduce our platform capabilities and request a 15-minute introductory call.',
    productInfo: 'Nexora CRM — modern SaaS platform with Google Gemini AI sales intelligence.',
    leadDetails: '',
  });

  const [generated, setGenerated] = useState(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Auto-fill from lead if query parameter present
  const { data: leadData } = useQuery({
    queryKey: ['lead-fill', leadId],
    queryFn: () => leadService.getLead(leadId),
    enabled: Boolean(leadId),
  });

  const { data: contactData } = useQuery({
    queryKey: ['contact-fill', contactId],
    queryFn: () => contactService.getContact(contactId),
    enabled: Boolean(contactId),
  });

  useEffect(() => {
    if (leadData?.data?.data) {
      const l = leadData.data.data;
      setForm((prev) => ({
        ...prev,
        recipientName: `${l.firstName} ${l.lastName}`.trim(),
        recipientCompany: l.companyName || '',
        recipientJobTitle: l.jobTitle || '',
        leadDetails: `Interested in: ${l.interestedIn || 'Services'}. Requirements: ${l.requirements || 'None provided'}.`,
      }));
    }
  }, [leadData]);

  useEffect(() => {
    if (contactData?.data?.data) {
      const c = contactData.data.data;
      setForm((prev) => ({
        ...prev,
        recipientName: `${c.firstName} ${c.lastName}`.trim(),
        recipientCompany: c.company?.name || '',
        recipientJobTitle: c.jobTitle || '',
        leadDetails: `Department: ${c.department || 'Executive'}. Notes: ${c.notes || ''}`,
      }));
    }
  }, [contactData]);

  const generateMutation = useMutation({
    mutationFn: (data) => aiService.generateEmail(data),
    onSuccess: (res) => {
      setGenerated(res.data.data);
      toast.success('Email generated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={24} />
          AI Sales Email Generator
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Craft personalized, high-converting outreach and follow-up emails powered by Google Gemini
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 card p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Recipient & Context Details</h3>

          <div>
            <label className="label text-xs">Recipient Full Name *</label>
            <input
              className="input text-xs"
              required
              placeholder="e.g. Sarah Jenkins"
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Company</label>
              <input
                className="input text-xs"
                placeholder="e.g. Apex Corp"
                value={form.recipientCompany}
                onChange={(e) => setForm({ ...form, recipientCompany: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-xs">Job Title</label>
              <input
                className="input text-xs"
                placeholder="e.g. VP Operations"
                value={form.recipientJobTitle}
                onChange={(e) => setForm({ ...form, recipientJobTitle: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label text-xs">Type</label>
              <select
                className="input text-xs"
                value={form.emailType}
                onChange={(e) => setForm({ ...form, emailType: e.target.value })}
              >
                {EMAIL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Tone</label>
              <select
                className="input text-xs"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
              >
                {EMAIL_TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Length</label>
              <select
                className="input text-xs"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
              >
                {EMAIL_LENGTHS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label text-xs">Outreach Objective</label>
            <input
              className="input text-xs"
              placeholder="e.g. Secure a 15-min discovery call next Tuesday"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </div>

          <div>
            <label className="label text-xs">Product / Value Proposition</label>
            <input
              className="input text-xs"
              value={form.productInfo}
              onChange={(e) => setForm({ ...form, productInfo: e.target.value })}
            />
          </div>

          <div>
            <label className="label text-xs">Lead Specific Context</label>
            <textarea
              className="input h-16 text-xs"
              placeholder="Pain points, previous conversation notes, mutual connections..."
              value={form.leadDetails}
              onChange={(e) => setForm({ ...form, leadDetails: e.target.value })}
            />
          </div>

          <button
            onClick={() => generateMutation.mutate(form)}
            disabled={!form.recipientName.trim() || generateMutation.isPending}
            className="btn-primary w-full justify-center py-2.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles size={16} className={generateMutation.isPending ? 'animate-spin' : ''} />
            {generateMutation.isPending ? 'Generating with Gemini...' : 'Generate Personalized Email'}
          </button>
        </div>

        {/* Right Output: 7 Cols */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="card flex-1 p-6 flex flex-col justify-between bg-white border border-gray-200">
            {generated ? (
              <div className="space-y-4">
                {/* Subject Line */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Subject Line</span>
                    <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{generated.subject}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(generated.subject, 'subject')}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-white text-gray-500 text-xs flex items-center gap-1"
                  >
                    {copiedSubject ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedSubject ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 min-h-[300px] flex flex-col justify-between">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                    {generated.body}
                  </div>

                  {generated.callToAction && (
                    <div className="mt-4 pt-3 border-t border-gray-200/80">
                      <span className="text-xs text-indigo-700 font-semibold block">Suggested Call-to-Action:</span>
                      <p className="text-xs text-gray-600 italic mt-0.5">{generated.callToAction}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => generateMutation.mutate(form)}
                    disabled={generateMutation.isPending}
                    className="btn-secondary text-xs"
                  >
                    <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
                    Regenerate Alternative
                  </button>
                  <button
                    onClick={() => handleCopy(generated.body, 'body')}
                    className="btn-primary text-xs"
                  >
                    {copiedBody ? <Check size={14} /> : <Copy size={14} />}
                    {copiedBody ? 'Body Copied!' : 'Copy Email Body'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                  <Mail size={28} />
                </div>
                <h3 className="font-semibold text-gray-700 text-base mb-1">Ready to Draft</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Select a recipient or lead on the left, customize your tone and objective, and let Gemini AI compose your message.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
