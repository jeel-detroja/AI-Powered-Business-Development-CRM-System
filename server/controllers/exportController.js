import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Contact, Deal } from '../models/index.js';

function toCsvRow(fields, obj) {
  return fields.map((f) => {
    const val = f.includes('.') ? f.split('.').reduce((o, k) => o?.[k], obj) : obj[f];
    if (val == null) return '';
    let str = String(val);
    // Neutralize CSV formula injection (CWE-1236)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  }).join(',');
}

function streamCsv(res, filename, headers, fields, records) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.write(headers.join(',') + '\n');
  for (const rec of records) {
    res.write(toCsvRow(fields, rec) + '\n');
  }
  res.end();
}

// ── Export Leads ──
export const exportLeads = asyncHandler(async (req, res) => {
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.user.role === 'rep') filter.assignedTo = req.user._id;

  const leads = await Lead.find(filter)
    .sort('-createdAt')
    .populate('assignedTo', 'firstName lastName')
    .lean();

  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Industry', 'Location', 'Source', 'Status', 'Priority', 'Score', 'Budget (₹)', 'Assigned To', 'Created At'];
  const fields = ['_id', 'firstName', 'lastName', 'email', 'phone', 'companyName', 'jobTitle', 'industry', 'location', 'source', 'status', 'priority', 'score', 'estimatedBudget', 'assignedTo.firstName', 'createdAt'];

  streamCsv(res, 'leads-export.csv', headers, fields, leads);
});

// ── Export Contacts ──
export const exportContacts = asyncHandler(async (req, res) => {
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  if (req.user.role === 'rep') filter.owner = req.user._id;

  const contacts = await Contact.find(filter)
    .sort('-createdAt')
    .populate('company', 'name')
    .lean();

  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Department', 'Company', 'Created At'];
  const fields = ['_id', 'firstName', 'lastName', 'email', 'phone', 'jobTitle', 'department', 'company.name', 'createdAt'];

  streamCsv(res, 'contacts-export.csv', headers, fields, contacts);
});

// ── Export Deals ──
export const exportDeals = asyncHandler(async (req, res) => {
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.user.role === 'rep') filter.owner = req.user._id;

  const deals = await Deal.find(filter)
    .sort('-createdAt')
    .populate('owner', 'firstName lastName')
    .populate('company', 'name')
    .lean();

  const headers = ['ID', 'Title', 'Value (₹)', 'Stage', 'Probability', 'Priority', 'Company', 'Owner', 'Expected Close', 'Created At'];
  const fields = ['_id', 'title', 'value', 'stage', 'probability', 'priority', 'company.name', 'owner.firstName', 'expectedCloseDate', 'createdAt'];

  streamCsv(res, 'deals-export.csv', headers, fields, deals);
});
