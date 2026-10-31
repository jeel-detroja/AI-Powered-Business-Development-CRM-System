import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { Company, Contact, Lead, Deal } from '../models/index.js';

const companySchema = z.object({
  name: z.string().trim().min(1),
  website: z.string().trim().optional().default(''),
  industry: z.string().trim().optional().default(''),
  size: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  annualRevenueRange: z.string().trim().optional().default(''),
  businessType: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  notes: z.string().optional().default(''),
});

export const getCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['name', 'industry', 'createdAt'], '-createdAt');
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: regex }, { industry: regex }, { location: regex }];
  }
  if (req.query.industry) filter.industry = new RegExp(escapeRegex(req.query.industry), 'i');

  const [companies, total] = await Promise.all([
    Company.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('owner', 'firstName lastName avatarColor').lean(),
    Company.countDocuments(filter),
  ]);
  return sendSuccess(res, { data: companies, meta: buildMeta({ page, limit, total }) });
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('owner', 'firstName lastName email avatarColor');
  if (!company) throw ApiError.notFound('Company not found');

  // Fetch related records
  const [contacts, leads, deals] = await Promise.all([
    Contact.find({ company: company._id, organization: req.orgId, isDeleted: { $ne: true } }).select('firstName lastName email jobTitle').lean(),
    Lead.find({ company: company._id, organization: req.orgId, isDeleted: { $ne: true } }).select('firstName lastName status score').lean(),
    Deal.find({ company: company._id, organization: req.orgId, isDeleted: { $ne: true } }).select('title value stage probability').lean(),
  ]);

  return sendSuccess(res, { data: { ...company.toObject(), contacts, leads, deals } });
});

export const createCompany = asyncHandler(async (req, res) => {
  const body = companySchema.parse(req.body);
  const company = await Company.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    owner: req.user._id,
  });
  return sendSuccess(res, { status: 201, message: 'Company created', data: company });
});

export const updateCompany = asyncHandler(async (req, res) => {
  const body = companySchema.partial().parse(req.body);
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    body,
    { new: true, runValidators: true }
  );
  if (!company) throw ApiError.notFound('Company not found');
  return sendSuccess(res, { message: 'Company updated', data: company });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!company) throw ApiError.notFound('Company not found');
  return sendSuccess(res, { message: 'Company deleted' });
});
