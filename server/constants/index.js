export const ROLES = { ADMIN: 'admin', MANAGER: 'manager', REP: 'rep' };

export const LEAD_STATUS = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];

export const LEAD_SOURCES = [
  'Website', 'LinkedIn', 'Referral', 'Email Campaign', 'Cold Calling', 'Social Media', 'Advertisement', 'Other',
];

export const LEAD_PRIORITY = ['Low', 'Medium', 'High'];

export const DEAL_STAGES = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const ACTIVITY_TYPES = ['Phone Call', 'Email', 'Meeting', 'Demo', 'Follow-up', 'Note', 'Other'];

export const TASK_STATUS = ['To Do', 'In Progress', 'Review', 'Completed'];
export const TASK_PRIORITY = ['Low', 'Medium', 'High'];

export const NOTIFICATION_TYPES = [
  'lead_assigned', 'followup_due', 'activity_overdue', 'task_assigned', 'deal_updated', 'reminder',
];

export const LEAD_CATEGORY = { HOT: 'Hot', WARM: 'Warm', COLD: 'Cold' };
