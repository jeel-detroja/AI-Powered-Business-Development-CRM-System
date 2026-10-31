import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Lead, Deal, Task, Activity, Conversation } from '../models/index.js';
import {
  isAIEnabled,
  generateEmail as aiGenerateEmail,
  generateBusinessInsights,
  assistantFunctions,
  executeFunctionCall,
  testConnection as aiTestConnection,
} from '../services/gemini/index.js';
import { getGeminiClient, getModelName } from '../services/gemini/client.js';

// ── AI Sales Assistant (chat with function calling) ──
export const chat = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY.');

  const { message, conversationId } = z.object({
    message: z.string().min(1),
    conversationId: z.string().optional(),
  }).parse(req.body);

  // Build org context
  const [totalLeads, activeDeals, overdueTasks] = await Promise.all([
    Lead.countDocuments({ organization: req.orgId, isDeleted: { $ne: true } }),
    Deal.countDocuments({ organization: req.orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } }),
    Task.countDocuments({
      organization: req.orgId, isDeleted: { $ne: true },
      status: { $ne: 'Completed' }, dueDate: { $lt: new Date() },
    }),
  ]);

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

  const systemInstruction = `You are Nexora AI, an intelligent sales assistant for a CRM platform.
Current user: ${req.user.firstName} ${req.user.lastName} (${req.user.role})
Organization context: ${totalLeads} total leads, ${activeDeals} active deals, ${overdueTasks} overdue tasks.
Today's date: ${new Date().toDateString()}.
You have access to CRM functions to look up real data. Be concise, professional, and actionable.`;

  // Build history (last 10 messages)
  const history = conversation.messages.slice(-10).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const client = getGeminiClient();
  const model = getModelName();
  const tools = [{ functionDeclarations: assistantFunctions }];
  const config = { systemInstruction, tools };

  let response = await client.models.generateContent({ model, contents, config });

  // Function calling loop with maximum turn safeguard
  let functionResults = [];
  let turns = 0;
  const maxTurns = 5;
  while (response.functionCalls && response.functionCalls.length > 0 && turns++ < maxTurns) {
    const calls = response.functionCalls;
    functionResults = await Promise.all(
      calls.map(async (fc) => {
        const result = await executeFunctionCall(fc.name, fc.args || {}, req.orgId, req.user._id);
        return { name: fc.name, response: { result } };
      })
    );

    const updatedContents = [
      ...contents,
      { role: 'model', parts: calls.map((fc) => ({ functionCall: fc })) },
      { role: 'user', parts: functionResults.map((fr) => ({ functionResponse: fr })) },
    ];

    response = await client.models.generateContent({ model, contents: updatedContents, config });
  }

  const replyText = response.text ?? '';

  // Persist conversation
  conversation.messages.push({ role: 'user', text: message });
  conversation.messages.push({ role: 'model', text: replyText, functionCalls: functionResults });
  await conversation.save();

  return sendSuccess(res, {
    data: { reply: replyText, conversationId: conversation._id, functionResults },
  });
});

// ── Generate Sales Email ──
export const generateEmail = asyncHandler(async (req, res) => {
  if (!isAIEnabled()) throw ApiError.serviceUnavailable('AI is not configured. Set GEMINI_API_KEY.');

  const options = z.object({
    recipientName: z.string().min(1),
    recipientCompany: z.string().optional().default(''),
    recipientJobTitle: z.string().optional().default(''),
    emailType: z.string().optional().default('Introduction'),
    tone: z.string().optional().default('Professional'),
    length: z.string().optional().default('Medium'),
    objective: z.string().optional().default(''),
    productInfo: z.string().optional().default(''),
    leadDetails: z.string().optional().default(''),
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
