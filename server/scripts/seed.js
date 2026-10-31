import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  Organization, User, Company, Contact, Lead, Deal,
  Activity, Task, Notification,
} from '../models/index.js';
import { calculateLeadScore } from '../services/gemini/aiService.js';

await connectDB(env.mongoUri);
console.log('[seed] Connected. Seeding data…');

// ── Clear existing demo data ──
const existingOrg = await Organization.findOne({ name: 'Nexora Demo Corp' });
if (existingOrg) {
  const orgId = existingOrg._id;
  await Promise.all([
    User.deleteMany({ organization: orgId }),
    Company.deleteMany({ organization: orgId }),
    Contact.deleteMany({ organization: orgId }),
    Lead.deleteMany({ organization: orgId }),
    Deal.deleteMany({ organization: orgId }),
    Activity.deleteMany({ organization: orgId }),
    Task.deleteMany({ organization: orgId }),
    Notification.deleteMany({ organization: orgId }),
    Organization.deleteOne({ _id: orgId }),
  ]);
  console.log('[seed] Cleared existing demo data.');
}

// ── Organization ──
const org = await Organization.create({
  name: 'Nexora Demo Corp',
  industry: 'Software & Technology',
  website: 'https://nexorademo.com',
  size: '50-200',
});

// ── Users ──
const [admin, manager, rep] = await User.create([
  { organization: org._id, firstName: 'Alex', lastName: 'Johnson', email: 'admin@nexora.dev', password: 'Password123!', role: 'admin', jobTitle: 'VP of Sales', avatarColor: '#6366f1', phone: '+1-555-0101' },
  { organization: org._id, firstName: 'Sarah', lastName: 'Chen', email: 'manager@nexora.dev', password: 'Password123!', role: 'manager', jobTitle: 'Sales Manager', avatarColor: '#8b5cf6', phone: '+1-555-0102' },
  { organization: org._id, firstName: 'Mike', lastName: 'Williams', email: 'rep@nexora.dev', password: 'Password123!', role: 'rep', jobTitle: 'Sales Representative', avatarColor: '#06b6d4', phone: '+1-555-0103' },
]);
const users = [admin, manager, rep];

// ── Companies ──
const companiesData = [
  { name: 'TechVault Solutions', website: 'https://techvault.io', industry: 'Technology', size: '200-500', location: 'San Francisco, CA', annualRevenueRange: '$10M-$50M', businessType: 'B2B SaaS', description: 'Cloud infrastructure management platform.' },
  { name: 'GreenLeaf Organics', website: 'https://greenleaf.com', industry: 'Agriculture', size: '100-200', location: 'Portland, OR', annualRevenueRange: '$5M-$10M', businessType: 'B2C', description: 'Organic food distribution company.' },
  { name: 'Pinnacle Financial', website: 'https://pinnacle-fin.com', industry: 'Finance', size: '500-1000', location: 'New York, NY', annualRevenueRange: '$50M-$100M', businessType: 'B2B', description: 'Investment and wealth management firm.' },
  { name: 'MedCore Health', website: 'https://medcore.health', industry: 'Healthcare', size: '200-500', location: 'Boston, MA', annualRevenueRange: '$20M-$50M', businessType: 'B2B', description: 'Electronic health records platform.' },
  { name: 'UrbanEdge Realty', website: 'https://urbanedge.co', industry: 'Real Estate', size: '50-100', location: 'Austin, TX', annualRevenueRange: '$5M-$10M', businessType: 'B2C', description: 'Commercial and residential real estate.' },
  { name: 'Axiom Consulting', website: 'https://axiom-consulting.com', industry: 'Consulting', size: '100-200', location: 'Chicago, IL', annualRevenueRange: '$10M-$20M', businessType: 'B2B', description: 'Management consulting and strategy.' },
  { name: 'Quantum Labs', website: 'https://quantumlabs.dev', industry: 'Technology', size: '10-50', location: 'Seattle, WA', annualRevenueRange: '$1M-$5M', businessType: 'B2B', description: 'AI and machine learning research.' },
  { name: 'SkyNet Logistics', website: 'https://skynetlog.com', industry: 'Logistics', size: '500-1000', location: 'Dallas, TX', annualRevenueRange: '$50M-$100M', businessType: 'B2B', description: 'Supply chain and fulfillment solutions.' },
  { name: 'BrightPath Education', website: 'https://brightpath.edu', industry: 'Education', size: '50-100', location: 'Denver, CO', annualRevenueRange: '$2M-$5M', businessType: 'B2B/B2C', description: 'Online learning platform.' },
  { name: 'NovaRetail Inc.', website: 'https://novaretail.com', industry: 'Retail', size: '200-500', location: 'Los Angeles, CA', annualRevenueRange: '$20M-$50M', businessType: 'B2C', description: 'E-commerce platform for fashion.' },
  { name: 'Apex Manufacturing', website: 'https://apexmfg.com', industry: 'Manufacturing', size: '1000+', location: 'Detroit, MI', annualRevenueRange: '$100M+', businessType: 'B2B', description: 'Industrial parts and equipment.' },
  { name: 'CloudBridge Systems', website: 'https://cloudbridge.io', industry: 'Technology', size: '100-200', location: 'Atlanta, GA', annualRevenueRange: '$5M-$10M', businessType: 'B2B SaaS', description: 'Cloud migration and DevOps services.' },
];

const companies = await Company.insertMany(
  companiesData.map((c) => ({
    ...c,
    organization: org._id,
    owner: users[Math.floor(Math.random() * users.length)]._id,
    createdBy: admin._id,
  }))
);

// ── Contacts ──
const contactsData = [
  { firstName: 'James', lastName: 'Parker', email: 'james.parker@techvault.io', phone: '+1-555-1001', jobTitle: 'CTO', department: 'Engineering', companyIdx: 0 },
  { firstName: 'Lisa', lastName: 'Wong', email: 'lisa.wong@techvault.io', phone: '+1-555-1002', jobTitle: 'VP Engineering', department: 'Engineering', companyIdx: 0 },
  { firstName: 'David', lastName: 'Martinez', email: 'david.m@greenleaf.com', phone: '+1-555-1003', jobTitle: 'CEO', department: 'Executive', companyIdx: 1 },
  { firstName: 'Emily', lastName: 'Rhodes', email: 'erhodes@pinnacle-fin.com', phone: '+1-555-1004', jobTitle: 'CFO', department: 'Finance', companyIdx: 2 },
  { firstName: 'Robert', lastName: 'Singh', email: 'rsingh@pinnacle-fin.com', phone: '+1-555-1005', jobTitle: 'Director of Operations', department: 'Operations', companyIdx: 2 },
  { firstName: 'Anna', lastName: 'Kowalski', email: 'anna.k@medcore.health', phone: '+1-555-1006', jobTitle: 'Product Manager', department: 'Product', companyIdx: 3 },
  { firstName: 'Chris', lastName: 'Taylor', email: 'ctaylor@urbanedge.co', phone: '+1-555-1007', jobTitle: 'Managing Director', department: 'Executive', companyIdx: 4 },
  { firstName: 'Priya', lastName: 'Sharma', email: 'priya@axiom-consulting.com', phone: '+1-555-1008', jobTitle: 'Partner', department: 'Consulting', companyIdx: 5 },
  { firstName: 'Kevin', lastName: 'Chen', email: 'kchen@quantumlabs.dev', phone: '+1-555-1009', jobTitle: 'Founder & CEO', department: 'Executive', companyIdx: 6 },
  { firstName: 'Maria', lastName: 'Gonzalez', email: 'maria@skynetlog.com', phone: '+1-555-1010', jobTitle: 'Head of Procurement', department: 'Procurement', companyIdx: 7 },
  { firstName: 'Thomas', lastName: 'Brown', email: 'tbrown@brightpath.edu', phone: '+1-555-1011', jobTitle: 'Academic Director', department: 'Education', companyIdx: 8 },
  { firstName: 'Olivia', lastName: 'Johnson', email: 'olivia@novaretail.com', phone: '+1-555-1012', jobTitle: 'CMO', department: 'Marketing', companyIdx: 9 },
  { firstName: 'William', lastName: 'Anderson', email: 'wanderson@apexmfg.com', phone: '+1-555-1013', jobTitle: 'VP Supply Chain', department: 'Operations', companyIdx: 10 },
  { firstName: 'Sophie', lastName: 'Lee', email: 'sophie.lee@cloudbridge.io', phone: '+1-555-1014', jobTitle: 'Head of Sales', department: 'Sales', companyIdx: 11 },
  { firstName: 'Nathan', lastName: 'Kumar', email: 'nkumar@techvault.io', phone: '+1-555-1015', jobTitle: 'DevOps Lead', department: 'Engineering', companyIdx: 0 },
  { firstName: 'Rachel', lastName: 'Davis', email: 'rdavis@medcore.health', phone: '+1-555-1016', jobTitle: 'Director of IT', department: 'IT', companyIdx: 3 },
  { firstName: 'Brandon', lastName: 'Miller', email: 'bmiller@skynetlog.com', phone: '+1-555-1017', jobTitle: 'CIO', department: 'IT', companyIdx: 7 },
  { firstName: 'Jessica', lastName: 'White', email: 'jwhite@axiom-consulting.com', phone: '+1-555-1018', jobTitle: 'Senior Consultant', department: 'Consulting', companyIdx: 5 },
];

const contacts = await Contact.insertMany(
  contactsData.map((c) => ({
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    jobTitle: c.jobTitle,
    department: c.department,
    company: companies[c.companyIdx]._id,
    organization: org._id,
    owner: users[Math.floor(Math.random() * users.length)]._id,
    createdBy: admin._id,
  }))
);

// ── Leads ──
const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
const sources = ['Website', 'LinkedIn', 'Referral', 'Email Campaign', 'Cold Calling', 'Social Media', 'Advertisement', 'Other'];
const priorities = ['Low', 'Medium', 'High'];
const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Consulting', 'Logistics'];

function d(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function fd(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

const leadsData = [
  { firstName: 'Daniel', lastName: 'Foster', email: 'dfoster@acmecorp.com', phone: '+1-555-2001', companyName: 'Acme Corp', jobTitle: 'Head of IT', industry: 'Technology', location: 'San Jose, CA', source: 'Website', status: 'Qualified', priority: 'High', estimatedBudget: 75000, requirements: 'Need cloud migration solution for 200+ servers', interestedIn: 'Cloud Infrastructure', tags: ['enterprise', 'cloud'], notes: 'Very interested, requested demo.' },
  { firstName: 'Emma', lastName: 'Wilson', email: 'ewilson@bluestar.com', phone: '+1-555-2002', companyName: 'BlueStar Inc', jobTitle: 'CFO', industry: 'Finance', location: 'New York, NY', source: 'Referral', status: 'Negotiation', priority: 'High', estimatedBudget: 120000, requirements: 'Financial analytics dashboard with AI', interestedIn: 'Analytics Platform', tags: ['finance', 'ai'], notes: 'Referred by Pinnacle Financial.' },
  { firstName: 'Liam', lastName: 'Chen', email: 'lchen@startupx.io', phone: '+1-555-2003', companyName: 'StartupX', jobTitle: 'Founder', industry: 'Technology', location: 'Seattle, WA', source: 'LinkedIn', status: 'New', priority: 'Medium', estimatedBudget: 15000, requirements: 'Basic CRM with sales tracking', interestedIn: 'CRM Solution', tags: ['startup', 'smb'] },
  { firstName: 'Sophia', lastName: 'Patel', email: 'spatel@meditech.com', phone: '+1-555-2004', companyName: 'MediTech Solutions', jobTitle: 'VP Product', industry: 'Healthcare', location: 'Boston, MA', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 45000, requirements: 'Patient management system integration', interestedIn: 'Integration Services', tags: ['healthcare', 'integration'] },
  { firstName: 'Noah', lastName: 'Kim', email: 'nkim@retailplus.com', phone: '+1-555-2005', companyName: 'RetailPlus', jobTitle: 'Digital Marketing Director', industry: 'Retail', location: 'Los Angeles, CA', source: 'Social Media', status: 'Qualified', priority: 'High', estimatedBudget: 55000, requirements: 'E-commerce analytics and customer insights', interestedIn: 'Analytics Platform', tags: ['retail', 'ecommerce'] },
  { firstName: 'Isabella', lastName: 'Brown', email: 'ibrown@greenfield.com', phone: '+1-555-2006', companyName: 'Greenfield Energy', jobTitle: 'Operations Manager', industry: 'Energy', location: 'Houston, TX', source: 'Cold Calling', status: 'Contacted', priority: 'Low', estimatedBudget: 30000, requirements: 'Project tracking and reporting', interestedIn: 'Project Management', tags: ['energy'] },
  { firstName: 'Oliver', lastName: 'Wright', email: 'owright@buildpro.com', phone: '+1-555-2007', companyName: 'BuildPro Construction', jobTitle: 'Director of BD', industry: 'Construction', location: 'Dallas, TX', source: 'Referral', status: 'Proposal Sent', priority: 'High', estimatedBudget: 95000, requirements: 'Contract management and bidding system', interestedIn: 'Enterprise Platform', tags: ['construction', 'enterprise'] },
  { firstName: 'Ava', lastName: 'Thompson', email: 'athompson@edulearn.com', phone: '+1-555-2008', companyName: 'EduLearn Global', jobTitle: 'CTO', industry: 'Education', location: 'Denver, CO', source: 'Website', status: 'Qualified', priority: 'Medium', estimatedBudget: 35000, requirements: 'Learning management system with analytics', interestedIn: 'LMS Platform', tags: ['education', 'lms'] },
  { firstName: 'Ethan', lastName: 'Garcia', email: 'egarcia@logismart.com', phone: '+1-555-2009', companyName: 'LogiSmart', jobTitle: 'Supply Chain Lead', industry: 'Logistics', location: 'Miami, FL', source: 'LinkedIn', status: 'New', priority: 'Medium', estimatedBudget: 40000, requirements: 'Supply chain visibility platform', interestedIn: 'Supply Chain', tags: ['logistics', 'scm'] },
  { firstName: 'Mia', lastName: 'Johnson', email: 'mjohnson@healthfirst.org', phone: '+1-555-2010', companyName: 'HealthFirst Clinic', jobTitle: 'Practice Manager', industry: 'Healthcare', location: 'Philadelphia, PA', source: 'Website', status: 'Converted', priority: 'High', estimatedBudget: 60000, requirements: 'Complete practice management suite', interestedIn: 'Healthcare Platform', tags: ['healthcare', 'converted'] },
  { firstName: 'Alexander', lastName: 'Lee', email: 'alee@innovatech.com', phone: '+1-555-2011', companyName: 'InnovaTech', jobTitle: 'Engineering Manager', industry: 'Technology', location: 'San Francisco, CA', source: 'LinkedIn', status: 'Proposal Sent', priority: 'High', estimatedBudget: 85000, requirements: 'DevOps automation and CI/CD pipeline', interestedIn: 'DevOps Platform', tags: ['devops', 'automation'] },
  { firstName: 'Charlotte', lastName: 'Davis', email: 'cdavis@financegroup.com', phone: '+1-555-2012', companyName: 'Finance Group LLC', jobTitle: 'Managing Director', industry: 'Finance', location: 'Charlotte, NC', source: 'Referral', status: 'Qualified', priority: 'Medium', estimatedBudget: 70000, requirements: 'Risk management and compliance tools', interestedIn: 'Compliance Platform', tags: ['finance', 'compliance'] },
  { firstName: 'Lucas', lastName: 'Martin', email: 'lmartin@retailhub.com', phone: '+1-555-2013', companyName: 'RetailHub', jobTitle: 'VP Sales', industry: 'Retail', location: 'Chicago, IL', source: 'Advertisement', status: 'Lost', priority: 'Medium', estimatedBudget: 50000, requirements: 'POS and inventory management', interestedIn: 'Retail Solutions', tags: ['retail', 'pos'], notes: 'Went with competitor. Budget constraints.' },
  { firstName: 'Amelia', lastName: 'Robinson', email: 'arobinson@cloudnine.io', phone: '+1-555-2014', companyName: 'CloudNine Hosting', jobTitle: 'CEO', industry: 'Technology', location: 'Portland, OR', source: 'Website', status: 'New', priority: 'High', estimatedBudget: 100000, requirements: 'Managed hosting and scalable infrastructure', interestedIn: 'Cloud Hosting', tags: ['hosting', 'cloud', 'hot-lead'] },
  { firstName: 'Benjamin', lastName: 'Clark', email: 'bclark@pharmalife.com', phone: '+1-555-2015', companyName: 'PharmaLife Sciences', jobTitle: 'R&D Director', industry: 'Healthcare', location: 'San Diego, CA', source: 'Cold Calling', status: 'Contacted', priority: 'Low', estimatedBudget: 25000, requirements: 'Research data management system', interestedIn: 'Data Management', tags: ['pharma', 'research'] },
  { firstName: 'Harper', lastName: 'Moore', email: 'hmoore@designstudio.com', phone: '+1-555-2016', companyName: 'Design Studio Co', jobTitle: 'Creative Director', industry: 'Design', location: 'Austin, TX', source: 'Social Media', status: 'New', priority: 'Low', estimatedBudget: 10000, requirements: 'Project collaboration tool', interestedIn: 'Collaboration', tags: ['design', 'smb'] },
  { firstName: 'Jack', lastName: 'Lewis', email: 'jlewis@autoverse.com', phone: '+1-555-2017', companyName: 'AutoVerse Motors', jobTitle: 'IT Manager', industry: 'Automotive', location: 'Detroit, MI', source: 'LinkedIn', status: 'Contacted', priority: 'Medium', estimatedBudget: 55000, requirements: 'Customer portal and service ticketing', interestedIn: 'Service Platform', tags: ['automotive', 'service'] },
  { firstName: 'Evelyn', lastName: 'Walker', email: 'ewalker@mediamax.com', phone: '+1-555-2018', companyName: 'MediaMax Agency', jobTitle: 'Account Director', industry: 'Media', location: 'New York, NY', source: 'Referral', status: 'Negotiation', priority: 'High', estimatedBudget: 80000, requirements: 'Campaign management and client reporting', interestedIn: 'Marketing Platform', tags: ['media', 'marketing'] },
  { firstName: 'Henry', lastName: 'Young', email: 'hyoung@solartech.com', phone: '+1-555-2019', companyName: 'SolarTech Energy', jobTitle: 'BD Manager', industry: 'Energy', location: 'Phoenix, AZ', source: 'Website', status: 'Qualified', priority: 'Medium', estimatedBudget: 45000, requirements: 'Solar project estimation tool', interestedIn: 'Estimation Software', tags: ['solar', 'energy'] },
  { firstName: 'Grace', lastName: 'Hall', email: 'ghall@lawfirm.com', phone: '+1-555-2020', companyName: 'Hall & Associates', jobTitle: 'Senior Partner', industry: 'Legal', location: 'Washington, DC', source: 'Referral', status: 'Proposal Sent', priority: 'High', estimatedBudget: 65000, requirements: 'Case management and document automation', interestedIn: 'Legal Tech', tags: ['legal', 'document-mgmt'] },
  { firstName: 'Samuel', lastName: 'Allen', email: 'sallen@foodchain.com', phone: '+1-555-2021', companyName: 'FoodChain Restaurants', jobTitle: 'Operations VP', industry: 'Food & Beverage', location: 'Nashville, TN', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 35000, requirements: 'Multi-location POS and inventory', interestedIn: 'Restaurant Tech', tags: ['food', 'multi-location'] },
  { firstName: 'Victoria', lastName: 'Scott', email: 'vscott@insureplus.com', phone: '+1-555-2022', companyName: 'InsurePlus', jobTitle: 'VP Technology', industry: 'Insurance', location: 'Hartford, CT', source: 'LinkedIn', status: 'Qualified', priority: 'High', estimatedBudget: 90000, requirements: 'Claims processing automation', interestedIn: 'Insurance Platform', tags: ['insurance', 'automation'] },
  { firstName: 'Daniel', lastName: 'Hill', email: 'dhill@translogic.com', phone: '+1-555-2023', companyName: 'TransLogic Inc', jobTitle: 'CTO', industry: 'Logistics', location: 'Memphis, TN', source: 'Cold Calling', status: 'New', priority: 'Low', estimatedBudget: 20000, requirements: 'Fleet tracking and dispatch system', interestedIn: 'Logistics Tech', tags: ['transport', 'fleet'] },
  { firstName: 'Zoe', lastName: 'Adams', email: 'zadams@fitlife.com', phone: '+1-555-2024', companyName: 'FitLife Studios', jobTitle: 'Founder', industry: 'Fitness', location: 'Miami, FL', source: 'Social Media', status: 'Contacted', priority: 'Low', estimatedBudget: 8000, requirements: 'Membership management and scheduling', interestedIn: 'Fitness Software', tags: ['fitness', 'smb'] },
  { firstName: 'Matthew', lastName: 'Nelson', email: 'mnelson@dataprime.io', phone: '+1-555-2025', companyName: 'DataPrime Analytics', jobTitle: 'Chief Data Officer', industry: 'Technology', location: 'San Francisco, CA', source: 'Website', status: 'Negotiation', priority: 'High', estimatedBudget: 150000, requirements: 'Enterprise data warehouse and BI tools', interestedIn: 'Data Platform', tags: ['data', 'enterprise', 'bi'] },
  { firstName: 'Lily', lastName: 'Carter', email: 'lcarter@styleboutique.com', phone: '+1-555-2026', companyName: 'Style Boutique', jobTitle: 'E-commerce Manager', industry: 'Retail', location: 'New York, NY', source: 'Advertisement', status: 'New', priority: 'Medium', estimatedBudget: 18000, requirements: 'Online store optimization', interestedIn: 'E-commerce', tags: ['fashion', 'ecommerce'] },
  { firstName: 'Ryan', lastName: 'Mitchell', email: 'rmitchell@govtech.gov', phone: '+1-555-2027', companyName: 'GovTech Solutions', jobTitle: 'Program Manager', industry: 'Government', location: 'Arlington, VA', source: 'Referral', status: 'Qualified', priority: 'Medium', estimatedBudget: 200000, requirements: 'Citizen services portal and CMS', interestedIn: 'GovTech Platform', tags: ['government', 'portal'] },
  { firstName: 'Chloe', lastName: 'Evans', email: 'cevans@nonprofitorg.org', phone: '+1-555-2028', companyName: 'United Causes', jobTitle: 'Executive Director', industry: 'Non-Profit', location: 'Portland, OR', source: 'Email Campaign', status: 'Lost', priority: 'Low', estimatedBudget: 5000, requirements: 'Donor management and fundraising', interestedIn: 'Non-Profit CRM', tags: ['nonprofit'], notes: 'Budget too small. May revisit next year.' },
  { firstName: 'Andrew', lastName: 'Turner', email: 'aturner@cybershield.io', phone: '+1-555-2029', companyName: 'CyberShield Security', jobTitle: 'CISO', industry: 'Cybersecurity', location: 'Reston, VA', source: 'LinkedIn', status: 'Proposal Sent', priority: 'High', estimatedBudget: 110000, requirements: 'Security operations center platform', interestedIn: 'SIEM/SOC Platform', tags: ['security', 'enterprise'] },
  { firstName: 'Natalie', lastName: 'Brooks', email: 'nbrooks@travelwise.com', phone: '+1-555-2030', companyName: 'TravelWise Agency', jobTitle: 'GM', industry: 'Travel', location: 'Orlando, FL', source: 'Website', status: 'Contacted', priority: 'Medium', estimatedBudget: 22000, requirements: 'Booking management and CRM', interestedIn: 'Travel CRM', tags: ['travel'] },
  { firstName: 'Jacob', lastName: 'Reed', email: 'jreed@proptech.co', phone: '+1-555-2031', companyName: 'PropTech Solutions', jobTitle: 'CEO', industry: 'Real Estate', location: 'Austin, TX', source: 'Referral', status: 'Converted', priority: 'High', estimatedBudget: 70000, requirements: 'Property management platform', interestedIn: 'PropTech Platform', tags: ['realestate', 'converted'] },
  { firstName: 'Aria', lastName: 'Cooper', email: 'acooper@eduspark.com', phone: '+1-555-2032', companyName: 'EduSpark Academy', jobTitle: 'Director', industry: 'Education', location: 'Atlanta, GA', source: 'Social Media', status: 'New', priority: 'Low', estimatedBudget: 12000, requirements: 'Student enrollment and billing', interestedIn: 'School Management', tags: ['education', 'smb'] },
  { firstName: 'Marcus', lastName: 'Nguyen', email: 'mnguyen@bioreserch.com', phone: '+1-555-2033', companyName: 'BioResearch Labs', jobTitle: 'Lab Director', industry: 'Biotechnology', location: 'Cambridge, MA', source: 'LinkedIn', status: 'Qualified', priority: 'High', estimatedBudget: 130000, requirements: 'Laboratory information management system', interestedIn: 'LIMS Platform', tags: ['biotech', 'lims', 'enterprise'] },
  { firstName: 'Elena', lastName: 'Russo', email: 'erusso@artisanfoods.com', phone: '+1-555-2034', companyName: 'Artisan Foods Co', jobTitle: 'Marketing Director', industry: 'Food & Beverage', location: 'San Francisco, CA', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 28000, requirements: 'Brand management and social commerce', interestedIn: 'Marketing Platform', tags: ['food', 'branding'] },
  { firstName: 'Trevor', lastName: 'Phillips', email: 'tphillips@steelworks.com', phone: '+1-555-2035', companyName: 'SteelWorks Industries', jobTitle: 'Plant Manager', industry: 'Manufacturing', location: 'Pittsburgh, PA', source: 'Cold Calling', status: 'New', priority: 'Medium', estimatedBudget: 40000, requirements: 'Production tracking and quality control', interestedIn: 'MES Platform', tags: ['manufacturing', 'quality'] },
];

const leads = await Lead.insertMany(
  leadsData.map((l, i) => ({
    ...l,
    organization: org._id,
    createdBy: admin._id,
    assignedTo: users[i % 3]._id,
    createdAt: d(Math.floor(Math.random() * 90)),
    lastContactedAt: ['Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted'].includes(l.status)
      ? d(Math.floor(Math.random() * 30)) : undefined,
    nextFollowUpAt: ['Contacted', 'Qualified', 'Proposal Sent', 'Negotiation'].includes(l.status)
      ? fd(Math.floor(Math.random() * 14) - 3) : undefined,
  }))
);

// Calculate scores for all leads
for (const lead of leads) {
  const { score, category, breakdown } = calculateLeadScore(lead);
  lead.score = score;
  lead.category = category;
  lead.scoreBreakdown = breakdown;
  lead.scoredAt = new Date();
  await lead.save();
}

// ── Deals ──
const dealsData = [
  { title: 'TechVault Cloud Migration', value: 125000, stage: 'Negotiation', probability: 75, priority: 'High', companyIdx: 0, contactIdx: 0, leadIdx: 0, closeDays: 15 },
  { title: 'Pinnacle Financial Analytics', value: 95000, stage: 'Proposal', probability: 50, priority: 'High', companyIdx: 2, contactIdx: 3, leadIdx: 1, closeDays: 30 },
  { title: 'MedCore EHR Integration', value: 65000, stage: 'Discovery', probability: 30, priority: 'Medium', companyIdx: 3, contactIdx: 5, leadIdx: 3, closeDays: 45 },
  { title: 'UrbanEdge CRM Setup', value: 35000, stage: 'Qualification', probability: 20, priority: 'Medium', companyIdx: 4, contactIdx: 6, closeDays: 60 },
  { title: 'Axiom Consulting Platform', value: 78000, stage: 'Won', probability: 100, priority: 'High', companyIdx: 5, contactIdx: 7, leadIdx: 19, closeDays: -10, closedAt: d(10) },
  { title: 'SkyNet Supply Chain SaaS', value: 145000, stage: 'Negotiation', probability: 65, priority: 'High', companyIdx: 7, contactIdx: 9, leadIdx: 8, closeDays: 20 },
  { title: 'BrightPath LMS License', value: 42000, stage: 'Proposal', probability: 45, priority: 'Medium', companyIdx: 8, contactIdx: 10, leadIdx: 7, closeDays: 35 },
  { title: 'NovaRetail E-commerce Analytics', value: 58000, stage: 'Discovery', probability: 25, priority: 'Medium', companyIdx: 9, contactIdx: 11, leadIdx: 4, closeDays: 50 },
  { title: 'Apex MFG ERP Module', value: 210000, stage: 'Won', probability: 100, priority: 'High', companyIdx: 10, contactIdx: 12, closeDays: -30, closedAt: d(30) },
  { title: 'CloudBridge DevOps Package', value: 55000, stage: 'Qualification', probability: 15, priority: 'Low', companyIdx: 11, contactIdx: 13, leadIdx: 10, closeDays: 40 },
  { title: 'InsurePlus Claims Automation', value: 110000, stage: 'Proposal', probability: 55, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 21, closeDays: 25 },
  { title: 'DataPrime BI Suite', value: 175000, stage: 'Negotiation', probability: 70, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 24, closeDays: 12 },
  { title: 'CyberShield SOC Platform', value: 135000, stage: 'Proposal', probability: 50, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 28, closeDays: 28 },
  { title: 'BioResearch LIMS', value: 160000, stage: 'Discovery', probability: 35, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 32, closeDays: 55 },
  { title: 'RetailHub POS System', value: 48000, stage: 'Lost', probability: 0, priority: 'Medium', companyIdx: null, contactIdx: null, leadIdx: 12, closeDays: -15, closedAt: d(15) },
  { title: 'GovTech Citizens Portal', value: 220000, stage: 'Qualification', probability: 20, priority: 'Medium', companyIdx: null, contactIdx: null, leadIdx: 26, closeDays: 75 },
  { title: 'HealthFirst Practice Suite', value: 72000, stage: 'Won', probability: 100, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 9, closeDays: -5, closedAt: d(5) },
  { title: 'PropTech Property Mgmt', value: 85000, stage: 'Won', probability: 100, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 30, closeDays: -20, closedAt: d(20) },
];

const deals = await Deal.insertMany(
  dealsData.map((d_item, i) => ({
    title: d_item.title,
    value: d_item.value,
    stage: d_item.stage,
    probability: d_item.probability,
    priority: d_item.priority,
    company: d_item.companyIdx !== null ? companies[d_item.companyIdx]?._id : undefined,
    contact: d_item.contactIdx !== null ? contacts[d_item.contactIdx]?._id : undefined,
    lead: d_item.leadIdx !== undefined ? leads[d_item.leadIdx]?._id : undefined,
    owner: users[i % 3]._id,
    createdBy: admin._id,
    organization: org._id,
    expectedCloseDate: fd(d_item.closeDays),
    closedAt: d_item.closedAt || undefined,
    stageHistory: [
      { stage: d_item.stage, changedAt: d(Math.floor(Math.random() * 30) + 5), changedBy: users[i % 3]._id },
    ],
  }))
);

// ── Activities ──
const activityTypes = ['Phone Call', 'Email', 'Meeting', 'Demo', 'Follow-up', 'Note'];
const activitySubjects = [
  'Initial discovery call', 'Product demo walkthrough', 'Follow-up on proposal', 'Contract discussion',
  'Requirements gathering', 'Budget review meeting', 'Technical architecture review', 'Quarterly review call',
  'Onboarding kickoff', 'Feature request discussion', 'Pricing negotiation', 'Reference check call',
  'Send case study materials', 'Schedule team introduction', 'Review proposal feedback', 'Discuss timeline',
  'Send ROI analysis', 'Check-in on pilot progress', 'Review security questionnaire', 'Contract renewal discussion',
  'Partnership exploration call', 'Training session planning', 'Service level discussion', 'Competitive analysis review',
  'Success metrics alignment', 'Integration planning call', 'Escalation follow-up', 'Executive sponsor meeting',
  'Proof of concept review', 'Final negotiation call', 'Legal review coordination', 'Go-live planning',
  'Post-sale check-in', 'Upsell opportunity call', 'Customer feedback session', 'Annual review prep',
];

const activities = await Activity.insertMany(
  Array.from({ length: 38 }, (_, i) => ({
    organization: org._id,
    type: activityTypes[i % activityTypes.length],
    subject: activitySubjects[i % activitySubjects.length],
    description: `Activity notes for: ${activitySubjects[i % activitySubjects.length]}`,
    dueAt: i < 10 ? d(Math.floor(Math.random() * 5) + 1) : (i < 25 ? fd(Math.floor(Math.random() * 14)) : d(Math.floor(Math.random() * 30))),
    priority: priorities[i % 3],
    lead: leads[i % leads.length]._id,
    contact: contacts[i % contacts.length]?._id,
    company: companies[i % companies.length]?._id,
    deal: i < deals.length ? deals[i]?._id : undefined,
    assignedTo: users[i % 3]._id,
    createdBy: admin._id,
    isCompleted: i >= 25,
    completedAt: i >= 25 ? d(Math.floor(Math.random() * 10)) : undefined,
  }))
);

// ── Tasks ──
const taskStatuses = ['To Do', 'In Progress', 'Review', 'Completed'];
const taskTitles = [
  'Prepare proposal for TechVault', 'Update CRM records', 'Send follow-up email to Emma Wilson',
  'Review contract terms for Apex deal', 'Create presentation for Pinnacle demo', 'Call Daniel Foster about cloud migration',
  'Update pipeline forecast', 'Prepare quarterly sales report', 'Schedule team training session',
  'Research competitor pricing', 'Update lead scoring criteria', 'Create email template for cold outreach',
  'Review customer feedback survey', 'Prepare onboarding materials', 'Update product documentation',
  'Schedule meeting with BioResearch', 'Follow up on InsurePlus proposal', 'Draft partnership agreement',
  'Complete security assessment form', 'Plan customer success check-ins',
];

await Task.insertMany(
  taskTitles.map((title, i) => ({
    organization: org._id,
    title,
    description: `Task details for: ${title}`,
    status: taskStatuses[i % 4],
    priority: priorities[i % 3],
    dueDate: i < 5 ? d(Math.floor(Math.random() * 3) + 1) : fd(Math.floor(Math.random() * 14)),
    assignedTo: users[i % 3]._id,
    createdBy: admin._id,
    relatedType: i < leads.length ? 'Lead' : (i < leads.length + deals.length ? 'Deal' : null),
    relatedId: i < leads.length ? leads[i]?._id : (i < leads.length + deals.length ? deals[i - leads.length]?._id : undefined),
    completedAt: taskStatuses[i % 4] === 'Completed' ? d(Math.floor(Math.random() * 5)) : undefined,
  }))
);

// ── Notifications (for admin) ──
const notifData = [
  { type: 'lead_assigned', title: 'New lead assigned', message: 'Daniel Foster from Acme Corp has been assigned to you.' },
  { type: 'followup_due', title: 'Follow-up due', message: 'Follow up with Emma Wilson at BlueStar Inc is due today.' },
  { type: 'deal_updated', title: 'Deal stage changed', message: 'TechVault Cloud Migration moved to Negotiation.' },
  { type: 'task_assigned', title: 'New task assigned', message: 'Prepare proposal for TechVault has been assigned to you.' },
  { type: 'activity_overdue', title: 'Overdue activity', message: 'Initial discovery call with Sophia Patel is overdue.' },
  { type: 'deal_updated', title: 'Deal won!', message: 'Congratulations! Axiom Consulting Platform deal was won for $78,000.' },
  { type: 'lead_assigned', title: 'New lead from website', message: 'New lead: Amelia Robinson from CloudNine Hosting via Website.' },
  { type: 'reminder', title: 'Weekly pipeline review', message: 'Your weekly pipeline review is scheduled for today.' },
  { type: 'followup_due', title: 'Follow-up reminder', message: 'Follow up with Noah Kim at RetailPlus by end of day.' },
  { type: 'deal_updated', title: 'Deal value updated', message: 'DataPrime BI Suite deal value updated to $175,000.' },
  { type: 'task_assigned', title: 'Task due soon', message: 'Review contract terms for Apex deal is due tomorrow.' },
  { type: 'lead_assigned', title: 'Lead reassigned', message: 'Marcus Nguyen from BioResearch Labs has been reassigned to you.' },
  { type: 'activity_overdue', title: 'Overdue follow-up', message: 'Budget review meeting with Evelyn Walker is 2 days overdue.' },
  { type: 'deal_updated', title: 'Deal lost', message: 'RetailHub POS System deal was marked as Lost.' },
  { type: 'reminder', title: 'Monthly report due', message: 'Monthly sales report is due by end of week.' },
];

await Notification.insertMany(
  notifData.map((n, i) => ({
    ...n,
    organization: org._id,
    user: admin._id,
    isRead: i > 5,
    createdAt: d(i),
  }))
);

console.log(`
╔══════════════════════════════════════════════════╗
║          Nexora CRM — Seed Complete              ║
╠══════════════════════════════════════════════════╣
║  Organization: Nexora Demo Corp                  ║
║                                                  ║
║  Demo Accounts:                                  ║
║  ┌──────────────┬──────────────────┬───────────┐ ║
║  │ Role         │ Email            │ Password  │ ║
║  ├──────────────┼──────────────────┼───────────┤ ║
║  │ Admin        │ admin@nexora.dev │Password123!║ ║
║  │ Manager      │ manager@nexora.dev│Password123!║║
║  │ Sales Rep    │ rep@nexora.dev   │Password123!║ ║
║  └──────────────┴──────────────────┴───────────┘ ║
║                                                  ║
║  Seeded Data:                                    ║
║  • 12 Companies                                  ║
║  • 18 Contacts                                   ║
║  • 35 Leads (with scores)                        ║
║  • 18 Deals (4 Won, 1 Lost, 13 active)          ║
║  • 38 Activities (13 completed)                  ║
║  • 20 Tasks                                      ║
║  • 15 Notifications                              ║
╚══════════════════════════════════════════════════╝
`);

await disconnectDB();
