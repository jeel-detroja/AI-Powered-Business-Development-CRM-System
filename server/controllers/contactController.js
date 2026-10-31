import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildSort, buildMeta } from '../utils/pagination.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { Contact } from '../models/index.js';

const contactSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional().default(''),
  email: z.string().trim().email().optional().or(z.literal('')).default(''),
  phone: z.string().trim().optional().default(''),
  jobTitle: z.string().trim().optional().default(''),
  department: z.string().trim().optional().default(''),
  company: z.string().optional().nullable(),
  lead: z.string().optional().nullable(),
  tags: z.array(z.string().trim()).optional().default([]),
  notes: z.string().optional().default(''),
});

export const getContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSort(req.query, ['firstName', 'lastName', 'createdAt', 'email'], '-createdAt');
  const filter = { organization: req.orgId, isDeleted: { $ne: true } };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }
  if (req.query.company) filter.company = req.query.company;

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('company', 'name').populate('owner', 'firstName lastName avatarColor').lean(),
    Contact.countDocuments(filter),
  ]);
  return sendSuccess(res, { data: contacts, meta: buildMeta({ page, limit, total }) });
});

export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } })
    .populate('company', 'name website industry')
    .populate('owner', 'firstName lastName email avatarColor')
    .populate('lead', 'firstName lastName status');
  if (!contact) throw ApiError.notFound('Contact not found');
  return sendSuccess(res, { data: contact });
});

export const createContact = asyncHandler(async (req, res) => {
  const body = contactSchema.parse(req.body);
  const contact = await Contact.create({
    ...body,
    organization: req.orgId,
    createdBy: req.user._id,
    owner: req.user._id,
  });
  return sendSuccess(res, { status: 201, message: 'Contact created', data: contact });
});

export const updateContact = asyncHandler(async (req, res) => {
  const body = contactSchema.partial().parse(req.body);
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    body,
    { new: true, runValidators: true }
  );
  if (!contact) throw ApiError.notFound('Contact not found');
  return sendSuccess(res, { message: 'Contact updated', data: contact });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, organization: req.orgId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );
  if (!contact) throw ApiError.notFound('Contact not found');
  return sendSuccess(res, { message: 'Contact deleted' });
});
