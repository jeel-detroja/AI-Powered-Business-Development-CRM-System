import { generateContent, isAIEnabled } from './client.js';
import { Lead, Deal, Activity, Task } from '../../models/index.js';

// ── Lead Analysis ──
export async function analyzeLeadWithAI(lead) {
  if (!isAIEnabled()) throw new Error('AI is not configured');

  const prompt = `You are an expert sales intelligence analyst for a CRM platform.
Analyze the following lead and provide a comprehensive assessment.

Lead Information:
- Name: ${lead.firstName} ${lead.lastName}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Company: ${lead.companyName || 'Not provided'}
- Job Title: ${lead.jobTitle || 'Not provided'}
- Industry: ${lead.industry || 'Not provided'}
- Location: ${lead.location || 'Not provided'}
- Website: ${lead.website || 'Not provided'}
- Lead Source: ${lead.source}
- Lead Status: ${lead.status}
- Priority: ${lead.priority}
- Estimated Budget: ${lead.estimatedBudget ? '$' + lead.estimatedBudget.toLocaleString() : 'Not provided'}
- Requirements: ${lead.requirements || 'Not provided'}
- Interested In: ${lead.interestedIn || 'Not provided'}
- Notes: ${lead.notes || 'None'}
- Tags: ${lead.tags?.join(', ') || 'None'}
- Created: ${lead.createdAt?.toISOString()?.slice(0, 10) || 'Unknown'}
- Last Contacted: ${lead.lastContactedAt?.toISOString()?.slice(0, 10) || 'Never'}

Respond in JSON with this exact structure:
{
  "summary": "2-3 sentence lead summary",
  "requirements": "Analysis of business requirements",
  "interests": "What this lead is interested in",
  "opportunity": "Potential business opportunity description",
  "buyingIntent": "Low/Medium/High with explanation",
  "challenges": "Potential challenges in converting this lead",
  "strategy": "Recommended sales strategy",
  "nextAction": "Specific suggested next action",
  "followUpMessage": "A suggested follow-up message or email opener",
  "qualitative": {
    "engagementLevel": 0-100,
    "budgetFit": 0-100,
    "intentSignal": 0-100,
    "dataCompleteness": 0-100
  }
}`;

  return generateContent(prompt, {
    json: true,
    systemInstruction: 'You are a CRM sales intelligence AI. Provide actionable, professional analysis. Respond only with valid JSON.',
  });
}

// ── Lead Scoring (backend-owned with AI qualitative input) ──
export function calculateLeadScore(lead, qualitative = null) {
  let breakdown = [];
  let total = 0;

  // 1. Data completeness (0-20)
  const fields = ['email', 'phone', 'companyName', 'jobTitle', 'industry', 'location', 'website', 'requirements', 'interestedIn'];
  const filled = fields.filter((f) => lead[f] && String(lead[f]).trim()).length;
  const completenessScore = Math.round((filled / fields.length) * 20);
  breakdown.push({ label: 'Profile Completeness', points: completenessScore, max: 20, reason: `${filled}/${fields.length} fields filled` });
  total += completenessScore;

  // 2. Budget (0-15)
  let budgetScore = 0;
  if (lead.estimatedBudget >= 50000) budgetScore = 15;
  else if (lead.estimatedBudget >= 20000) budgetScore = 12;
  else if (lead.estimatedBudget >= 5000) budgetScore = 8;
  else if (lead.estimatedBudget > 0) budgetScore = 4;
  breakdown.push({ label: 'Budget', points: budgetScore, max: 15, reason: lead.estimatedBudget ? `$${lead.estimatedBudget.toLocaleString()}` : 'Not specified' });
  total += budgetScore;

  // 3. Engagement (0-15)
  let engagementScore = 0;
  if (lead.lastContactedAt) engagementScore += 5;
  if (lead.nextFollowUpAt) engagementScore += 3;
  if (lead.notes && lead.notes.length > 20) engagementScore += 4;
  if (lead.tags?.length > 0) engagementScore += 3;
  engagementScore = Math.min(engagementScore, 15);
  breakdown.push({ label: 'Engagement', points: engagementScore, max: 15, reason: lead.lastContactedAt ? 'Has contact history' : 'No contact yet' });
  total += engagementScore;

  // 4. Status progression (0-15)
  const statusScores = { New: 2, Contacted: 5, Qualified: 10, 'Proposal Sent': 13, Negotiation: 15, Converted: 15, Lost: 0 };
  const statusScore = statusScores[lead.status] ?? 0;
  breakdown.push({ label: 'Pipeline Stage', points: statusScore, max: 15, reason: `Status: ${lead.status}` });
  total += statusScore;

  // 5. Priority alignment (0-10)
  const priorityScores = { High: 10, Medium: 6, Low: 2 };
  const priorityScore = priorityScores[lead.priority] ?? 2;
  breakdown.push({ label: 'Priority', points: priorityScore, max: 10, reason: `Priority: ${lead.priority}` });
  total += priorityScore;

  // 6. Source quality (0-10)
  const sourceScores = { Referral: 10, LinkedIn: 8, Website: 7, 'Email Campaign': 6, 'Social Media': 5, 'Cold Calling': 3, Advertisement: 4, Other: 2 };
  const sourceScore = sourceScores[lead.source] ?? 2;
  breakdown.push({ label: 'Source Quality', points: sourceScore, max: 10, reason: `Source: ${lead.source}` });
  total += sourceScore;

  // 7. AI qualitative (0-15) — only if available
  if (qualitative) {
    const aiAvg = Math.round(
      ((qualitative.engagementLevel || 0) + (qualitative.budgetFit || 0) + (qualitative.intentSignal || 0) + (qualitative.dataCompleteness || 0)) / 4
    );
    const aiScore = Math.round((aiAvg / 100) * 15);
    breakdown.push({ label: 'AI Assessment', points: aiScore, max: 15, reason: `AI qualitative average: ${aiAvg}/100` });
    total += aiScore;
  } else {
    breakdown.push({ label: 'AI Assessment', points: 0, max: 15, reason: 'Not analyzed yet' });
  }

  const score = Math.min(100, total);
  let category = 'Cold';
  if (score >= 70) category = 'Hot';
  else if (score >= 40) category = 'Warm';

  return { score, category, breakdown };
}

// ── AI Email Generator ──
export async function generateEmail(options) {
  if (!isAIEnabled()) throw new Error('AI is not configured');

  const { recipientName, recipientCompany, recipientJobTitle, emailType, tone, length, objective, productInfo, leadDetails } = options;

  const prompt = `Generate a professional sales email.

Recipient: ${recipientName}${recipientCompany ? ` at ${recipientCompany}` : ''}${recipientJobTitle ? `, ${recipientJobTitle}` : ''}
Email Type: ${emailType}
Tone: ${tone}
Length: ${length}
Objective: ${objective || 'General outreach'}
${productInfo ? `Product/Service Info: ${productInfo}` : ''}
${leadDetails ? `Additional Lead Context: ${leadDetails}` : ''}

Respond in JSON with this exact structure:
{
  "subject": "Email subject line",
  "body": "Complete email body with proper formatting",
  "callToAction": "Suggested call to action"
}`;

  return generateContent(prompt, {
    json: true,
    systemInstruction: 'You are an expert sales copywriter. Write compelling, professional emails. Never include placeholder brackets like [Company Name]. Use the actual provided information. Respond only with valid JSON.',
  });
}

// ── AI Sales Assistant Function Definitions ──
export const assistantFunctions = [
  {
    name: 'searchLeads',
    description: 'Search leads by name, company, status, or source',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        status: { type: 'string', description: 'Lead status filter' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
    },
  },
  {
    name: 'getLeadDetails',
    description: 'Get detailed information about a specific lead by ID',
    parameters: {
      type: 'object',
      properties: { leadId: { type: 'string', description: 'Lead ID' } },
      required: ['leadId'],
    },
  },
  {
    name: 'getDealDetails',
    description: 'Get detailed information about a specific deal by ID',
    parameters: {
      type: 'object',
      properties: { dealId: { type: 'string', description: 'Deal ID' } },
      required: ['dealId'],
    },
  },
  {
    name: 'getOverdueFollowups',
    description: 'Get list of overdue follow-up activities',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max results' } },
    },
  },
  {
    name: 'getUpcomingTasks',
    description: 'Get upcoming tasks for the user',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max results' } },
    },
  },
  {
    name: 'getSalesSummary',
    description: 'Get a summary of sales metrics: total leads, deals, revenue, conversion rate',
    parameters: { type: 'object', properties: {} },
  },
];

// ── Function call executors (allow-listed, org-scoped) ──
export async function executeFunctionCall(name, args, orgId, userId) {
  switch (name) {
    case 'searchLeads': {
      const filter = { organization: orgId, isDeleted: { $ne: true } };
      if (args.status) filter.status = args.status;
      if (args.query) filter.$text = { $search: args.query };
      const leads = await Lead.find(filter).limit(args.limit || 5).select('firstName lastName companyName status priority score email source').lean();
      return leads;
    }
    case 'getLeadDetails': {
      const lead = await Lead.findOne({ _id: args.leadId, organization: orgId, isDeleted: { $ne: true } })
        .populate('assignedTo', 'firstName lastName').lean();
      if (!lead) return { error: 'Lead not found' };
      return lead;
    }
    case 'getDealDetails': {
      const deal = await Deal.findOne({ _id: args.dealId, organization: orgId, isDeleted: { $ne: true } })
        .populate('owner', 'firstName lastName').populate('company', 'name').lean();
      if (!deal) return { error: 'Deal not found' };
      return deal;
    }
    case 'getOverdueFollowups': {
      const activities = await Activity.find({
        organization: orgId, isDeleted: { $ne: true }, isCompleted: false, dueAt: { $lt: new Date() },
      }).limit(args.limit || 10).populate('lead', 'firstName lastName').populate('assignedTo', 'firstName lastName').lean();
      return activities;
    }
    case 'getUpcomingTasks': {
      const tasks = await Task.find({
        organization: orgId, isDeleted: { $ne: true }, status: { $ne: 'Completed' },
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      }).sort('dueDate').limit(args.limit || 10).lean();
      return tasks;
    }
    case 'getSalesSummary': {
      const [totalLeads, newLeads, qualifiedLeads, activeDeals, wonDeals] = await Promise.all([
        Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true } }),
        Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'New' }),
        Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Qualified' }),
        Deal.countDocuments({ organization: orgId, isDeleted: { $ne: true }, stage: { $nin: ['Won', 'Lost'] } }),
        Deal.find({ organization: orgId, isDeleted: { $ne: true }, stage: 'Won' }).select('value').lean(),
      ]);
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const convertedLeads = await Lead.countDocuments({ organization: orgId, isDeleted: { $ne: true }, status: 'Converted' });
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      return { totalLeads, newLeads, qualifiedLeads, activeDeals, wonDealsCount: wonDeals.length, totalRevenue, conversionRate };
    }
    default:
      return { error: 'Unknown function' };
  }
}

// ── Business Insights Generation ──
export async function generateBusinessInsights(metrics) {
  if (!isAIEnabled()) throw new Error('AI is not configured');

  const prompt = `You are a business intelligence analyst for a CRM platform.
Based on the following CRM metrics, generate actionable business insights.

CRM Metrics:
${JSON.stringify(metrics, null, 2)}

Generate 5-8 insights. For each insight, provide:
- title: Short insight title
- explanation: Detailed explanation
- metrics: Supporting CRM data points
- action: Recommended action
- priority: "high", "medium", or "low"
- category: One of "leads", "deals", "activities", "performance", "pipeline"

Respond in JSON with this exact structure:
{
  "insights": [
    {
      "title": "...",
      "explanation": "...",
      "metrics": "...",
      "action": "...",
      "priority": "...",
      "category": "..."
    }
  ],
  "overallHealth": "good/needs_attention/critical",
  "topRecommendation": "One most important action to take"
}`;

  return generateContent(prompt, {
    json: true,
    systemInstruction: 'You are a CRM business intelligence AI. Clearly distinguish factual metrics from your interpretations. Respond only with valid JSON.',
  });
}
