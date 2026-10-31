import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Contact } from '../models/index.js';
import { LEAD_STATUS, LEAD_SOURCES, LEAD_PRIORITY } from '../constants/index.js';

// Papaparse is CommonJS — use createRequire
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Papa = require('papaparse');

function parseCsv(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return result.data;
}

// ── Import Leads ──
export const importLeads = asyncHandler(async (req, res) => {
  const csvText = req.body?.csv;
  if (!csvText) throw ApiError.badRequest('CSV data is required. Send as { csv: "..." } in request body.');

  const rows = parseCsv(csvText);
  if (!rows.length) throw ApiError.badRequest('CSV is empty or has no valid rows.');

  const results = { inserted: 0, skipped: 0, duplicates: [], errors: [] };

  const leadDocs = [];
  for (const [i, row] of rows.entries()) {
    const firstName = String(row.firstName || row['First Name'] || row.first_name || '').trim();
    const email = String(row.email || row.Email || '').trim().toLowerCase();

    if (!firstName) {
      results.errors.push({ row: i + 2, reason: 'Missing firstName' });
      continue;
    }

    // Duplicate check: email
    if (email) {
      const dup = await Lead.findOne({ organization: req.orgId, email, isDeleted: { $ne: true } }).select('_id firstName lastName email').lean();
      if (dup) {
        results.duplicates.push({ row: i + 2, email, existingId: dup._id });
        results.skipped++;
        continue;
      }
    }

    const source = LEAD_SOURCES.includes(row.source) ? row.source : 'Other';
    const status = LEAD_STATUS.includes(row.status) ? row.status : 'New';
    const priority = LEAD_PRIORITY.includes(row.priority) ? row.priority : 'Medium';

    leadDocs.push({
      organization: req.orgId,
      createdBy: req.user._id,
      assignedTo: req.user._id,
      firstName,
      lastName: String(row.lastName || row['Last Name'] || row.last_name || '').trim(),
      email,
      phone: String(row.phone || row.Phone || '').trim(),
      companyName: String(row.companyName || row['Company'] || row.company || '').trim(),
      jobTitle: String(row.jobTitle || row['Job Title'] || row.job_title || '').trim(),
      industry: String(row.industry || row.Industry || '').trim(),
      location: String(row.location || row.Location || '').trim(),
      source, status, priority,
      estimatedBudget: parseFloat(row.estimatedBudget || row.budget || 0) || 0,
      notes: String(row.notes || row.Notes || '').trim(),
    });
  }

  if (leadDocs.length > 0) {
    await Lead.insertMany(leadDocs, { ordered: false });
    results.inserted = leadDocs.length;
  }

  return sendSuccess(res, {
    status: 201,
    message: `Import complete: ${results.inserted} inserted, ${results.skipped} skipped`,
    data: results,
  });
});

// ── Import Contacts ──
export const importContacts = asyncHandler(async (req, res) => {
  const csvText = req.body?.csv;
  if (!csvText) throw ApiError.badRequest('CSV data is required. Send as { csv: "..." } in request body.');

  const rows = parseCsv(csvText);
  if (!rows.length) throw ApiError.badRequest('CSV is empty or has no valid rows.');

  const results = { inserted: 0, skipped: 0, errors: [] };
  const contactDocs = [];

  for (const [i, row] of rows.entries()) {
    const firstName = String(row.firstName || row['First Name'] || row.first_name || '').trim();
    if (!firstName) {
      results.errors.push({ row: i + 2, reason: 'Missing firstName' });
      continue;
    }

    contactDocs.push({
      organization: req.orgId,
      createdBy: req.user._id,
      owner: req.user._id,
      firstName,
      lastName: String(row.lastName || row['Last Name'] || row.last_name || '').trim(),
      email: String(row.email || row.Email || '').trim().toLowerCase(),
      phone: String(row.phone || row.Phone || '').trim(),
      jobTitle: String(row.jobTitle || row['Job Title'] || row.job_title || '').trim(),
      department: String(row.department || row.Department || '').trim(),
      notes: String(row.notes || row.Notes || '').trim(),
    });
  }

  if (contactDocs.length > 0) {
    await Contact.insertMany(contactDocs, { ordered: false });
    results.inserted = contactDocs.length;
  }

  return sendSuccess(res, {
    status: 201,
    message: `Import complete: ${results.inserted} contacts inserted`,
    data: results,
  });
});
