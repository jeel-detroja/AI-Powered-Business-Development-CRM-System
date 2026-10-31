import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Organization } from '../models/index.js';
import { isAIEnabled, getModelName } from '../services/gemini/index.js';

export const getOrgSettings = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.orgId);
  if (!org) throw ApiError.notFound('Organization not found');
  return sendSuccess(res, { data: org });
});

export const updateOrgSettings = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).optional(),
    industry: z.string().trim().optional(),
    website: z.string().trim().optional(),
    size: z.string().trim().optional(),
  });

  const body = schema.parse(req.body);
  const org = await Organization.findByIdAndUpdate(req.orgId, body, { new: true, runValidators: true });
  if (!org) throw ApiError.notFound('Organization not found');
  return sendSuccess(res, { message: 'Organization updated', data: org });
});

export const getAISettings = asyncHandler(async (_req, res) => {
  // Never expose API keys to frontend
  return sendSuccess(res, {
    data: {
      enabled: isAIEnabled(),
      model: getModelName(),
      provider: 'Google Gemini',
    },
  });
});
