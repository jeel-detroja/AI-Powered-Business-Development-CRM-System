import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Deal, Task, Activity, Conversation } from '../models/index.js';
import {
  isAIEnabled,
  generateEmail as aiGenerateEmail,
  generateBusinessInsights,
  testConnection as aiTestConnection,
  generateChatContent,
} from '../services/gemini/index.js';

// ── Fetch real CRM context to inject into the AI prompt ──
async function fetchCRMContext(orgId, userId) {
  const now = new Date();
  const [
    totalLeads, newLeads, qualifiedLeads, convertedLeads,
    activeDeals, wonDeals,
    overdueTasks,
    overdueActivities,
    recentLeads,
    recentDeals,
  ] = await Promise.all([
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true } }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'New' }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Qualified' }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Converted' }),
    Deal.countDocuments({ organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } }),
    Deal.find({ organization: orgId, isDeleted: { $ne: true }, stage: 'Won' }).select('value').lean(),
    Task.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: { $ne: 'Completed' }, dueDate: { $lt: now } }),
    Activity.countDocuments({ organization: orgId, isDeleted: { $ne: true }, isCompleted: false, dueAt: { $lt: now } }),
    Lead.find({ organization: orgId, isDeleted: { $ne: true } })
      .sort('-createdAt').limit(5)
      .select('firstName lastName companyName status priority score source')
      .lean(),
    Deal.find({ organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } })
      .sort('-value').limit(5)
      .select('title value stage')
      .lean(),
  ]);

  const totalRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return {
    summary: { totalLeads, newLeads, qualifiedLeads, convertedLeads, conversionRate, activeDeals, wonDealsCount: wonDeals.length, totalRevenue, overdueTasks, overdueActivities },
    recentLeads,
    topDeals: recentDeals,
  };
}

// ── AI Sales Assistant (prompt-injection approach — no function calling) ──
export const chat = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY.');

  const { message, conversationId } = z.object({
    message: z.string().min(1),
    conversationId: z.string().nullable().optional(),
  }).parse(req.body);

  // Load or create conversation
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, organization: req.orgId, user: req.user._id });
  }
  if (!conversation) {
    conversation = new Conversation({
      organization: req.orgId,
      user: req.user._id,
      title: message.slice(0, 60),
      messages: [],
    });
  }

  // Fetch live CRM data to inject into the prompt
  const crm = await fetchCRMContext(req.orgId, req.user._id);
  const crmContext = `
## Live CRM Data (as of ${new Date().toLocaleString('en-IN')}):
**Summary:** ${crm.summary.totalLeads} total leads | ${crm.summary.newLeads} new | ${crm.summary.qualifiedLeads} qualified | ${crm.summary.convertedLeads} converted (${crm.summary.conversionRate}% conversion rate)
**Deals:** ${crm.summary.activeDeals} active deals | ${crm.summary.wonDealsCount} won | ₹${crm.summary.totalRevenue.toLocaleString('en-IN')} total revenue
**Alerts:** ${crm.summary.overdueTasks} overdue tasks | ${crm.summary.overdueActivities} overdue activities

**Recent Leads:**
${crm.recentLeads.map((l) => `- ${l.firstName} ${l.lastName} (${l.companyName || 'No company'}) — ${l.status}, ${l.priority} priority, score: ${l.score || 'N/A'}, source: ${l.source}`).join('\n') || 'None'}

**Top Active Deals:**
${crm.topDeals.map((d) => `- ${d.title} — ₹${(d.value || 0).toLocaleString('en-IN')} (${d.stage})`).join('\n') || 'None'}`;

  const systemInstruction = `You are Nexora AI, an intelligent CRM sales assistant for ${req.user.firstName} ${req.user.lastName} (${req.user.role}).
You have access to live CRM data provided in every message. Use it to give specific, data-driven answers.
Be concise, professional, and actionable. Format responses in readable markdown when helpful.
Today's date: ${new Date().toDateString()}.`;

  // Build conversation history (last 8 turns only, plain text)
  const history = conversation.messages.slice(-8).map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text || '' }],
  }));

  // Inject CRM context into the current user message
  const enrichedMessage = `${crmContext}\n\n---\n**User question:** ${message}`;

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: enrichedMessage }] },
  ];

  const response = await generateChatContent({ contents, config: { systemInstruction } });
  const replyText = response.text ?? '';

  // Persist conversation (store original message, not the enriched one)
  conversation.messages.push({ role: 'user', text: message });
  conversation.messages.push({ role: 'model', text: replyText });
  await conversation.save();

  return sendSuccess(res, {
    data: { reply: replyText, conversationId: conversation._id, functionResults: [] },
  });
});

// ── Generate Sales Email ──
export const generateEmail = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY.');

  const options = z.object({
    recipientName: z.string().min(1),
    recipientCompany: z.string().nullable().optional().default(''),
    recipientJobTitle: z.string().nullable().optional().default(''),
    emailType: z.string().nullable().optional().default('Introduction'),
    tone: z.string().nullable().optional().default('Professional'),
    length: z.string().nullable().optional().default('Medium'),
    objective: z.string().nullable().optional().default(''),
    productInfo: z.string().nullable().optional().default(''),
    leadDetails: z.string().nullable().optional().default(''),
  }).parse(req.body);

  const email = await aiGenerateEmail(options);
  return sendSuccess(res, { data: email });
});

// ── Business Insights ──
export const getBusinessInsights = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY.');

  const orgId = req.orgId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLeads, newLeadsThisMonth, qualifiedLeads,
    activeDeals, wonDealsAgg, lostDeals,
    overdueActivities, completedActivities,
    convertedLeads,
  ] = await Promise.all([
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true } }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Qualified' }),
    Deal.countDocuments({ organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } }),
    Deal.aggregate([
      { $match: { organization: orgId, isDeleted: { $ne: true }, stage: 'Won' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$value' } } },
    ]),
    Deal.countDocuments({ organization: orgId, isDeleted: { $ne: true }, stage: 'Lost' }),
    Activity.countDocuments({ organization: orgId, isDeleted: { $ne: true }, isCompleted: false, dueAt: { $lt: now } }),
    Activity.countDocuments({ organization: orgId, isDeleted: { $ne: true }, isCompleted: true }),
    Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Converted' }),
  ]);

  const wonRevenue = wonDealsAgg[0]?.revenue || 0;
  const wonDealsCount = wonDealsAgg[0]?.count || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const metrics = {
    leads: { total: totalLeads, newThisMonth: newLeadsThisMonth, qualified: qualifiedLeads, converted: convertedLeads, conversionRate },
    deals: { active: activeDeals, won: wonDealsCount, lost: lostDeals, wonRevenue },
    activities: { overdue: overdueActivities, completed: completedActivities },
  };

  const insights = await generateBusinessInsights(metrics);
  return sendSuccess(res, { data: { insights, metrics } });
});

// ── Test AI Connection ──
export const testConnection = asyncHandler(async (req, res) => {
  const result = await aiTestConnection();
  return sendSuccess(res, { data: result });
});
