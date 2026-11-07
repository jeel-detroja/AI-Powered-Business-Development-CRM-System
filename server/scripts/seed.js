import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  Organization, User, Company, Contact, Lead, Deal,
  Activity, Task, Notification,
} from '../models/index.js';
import { calculateLeadScore } from '../services/gemini/aiService.js';

await connectDB(env.mongoUri);
console.log('[seed] Connected. Seeding Indian standard CRM demo data…');

// ── Clear existing demo data ──
const existingOrgs = await Organization.find({
  name: { $in: ['Nexora Demo Corp', 'Nexora Technologies India'] },
});
for (const existingOrg of existingOrgs) {
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
}
console.log('[seed] Cleared existing demo data.');

// ── Organization ──
const org = await Organization.create({
  name: 'Nexora Technologies India',
  industry: 'Software & Technology',
  website: 'https://nexoracrm.in',
  size: '50-200',
  settings: {
    aiEnabled: true,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
});

// ── Users ──
const [admin, manager, rep] = await User.create([
  { organization: org._id, firstName: 'Aarav', lastName: 'Sharma', email: 'admin@nexora.dev', password: 'Password123!', role: 'admin', jobTitle: 'VP of Business Development', avatarColor: '#6366f1', phone: '+91 98765 01001' },
  { organization: org._id, firstName: 'Priya', lastName: 'Nair', email: 'manager@nexora.dev', password: 'Password123!', role: 'manager', jobTitle: 'Regional Sales Manager', avatarColor: '#8b5cf6', phone: '+91 98765 01002' },
  { organization: org._id, firstName: 'Rohan', lastName: 'Verma', email: 'rep@nexora.dev', password: 'Password123!', role: 'rep', jobTitle: 'Sales Account Executive', avatarColor: '#06b6d4', phone: '+91 98765 01003' },
]);
const users = [admin, manager, rep];

// ── Companies ──
const companiesData = [
  { name: 'TechVault Infotech India', website: 'https://techvault.co.in', industry: 'Technology', size: '200-500', location: 'Bengaluru, Karnataka', annualRevenueRange: '₹25 Cr - ₹100 Cr', businessType: 'B2B SaaS', description: 'Cloud infrastructure & hybrid data platforms.' },
  { name: 'GreenLeaf Agro Foods', website: 'https://greenleafagro.in', industry: 'Agriculture', size: '100-200', location: 'Pune, Maharashtra', annualRevenueRange: '₹10 Cr - ₹25 Cr', businessType: 'B2C / Exports', description: 'Organic farm-to-retail cold chain distribution.' },
  { name: 'Pinnacle Capital Advisors', website: 'https://pinnaclecapital.in', industry: 'Finance', size: '500-1000', location: 'Mumbai, Maharashtra', annualRevenueRange: '₹100 Cr - ₹500 Cr', businessType: 'B2B Wealth', description: 'Corporate portfolio and investment banking.' },
  { name: 'MedCore Health Systems', website: 'https://medcorehealth.in', industry: 'Healthcare', size: '200-500', location: 'Hyderabad, Telangana', annualRevenueRange: '₹50 Cr - ₹150 Cr', businessType: 'B2B HealthTech', description: 'Hospital EHR & clinical diagnostic automation.' },
  { name: 'UrbanEdge Realty Infra', website: 'https://urbanedgeinfra.com', industry: 'Real Estate', size: '50-100', location: 'Gurugram, Haryana', annualRevenueRange: '₹20 Cr - ₹60 Cr', businessType: 'Commercial Real Estate', description: 'Grade-A tech park developments and leasing.' },
  { name: 'Axiom Business Advisory', website: 'https://axiombiz.co.in', industry: 'Consulting', size: '100-200', location: 'New Delhi', annualRevenueRange: '₹15 Cr - ₹40 Cr', businessType: 'B2B Consulting', description: 'Strategic transformation and compliance consulting.' },
  { name: 'Quantum AI Research Labs', website: 'https://quantumlabs.in', industry: 'Technology', size: '10-50', location: 'Bengaluru, Karnataka', annualRevenueRange: '₹5 Cr - ₹20 Cr', businessType: 'B2B AI DeepTech', description: 'Enterprise generative AI and vision models.' },
  { name: 'SkyNet Express Logistics', website: 'https://skynetexpress.in', industry: 'Logistics', size: '500-1000', location: 'Chennai, Tamil Nadu', annualRevenueRange: '₹100 Cr - ₹300 Cr', businessType: 'B2B Freight', description: 'Pan-India warehousing and multi-modal transport.' },
  { name: 'BrightPath Edutech', website: 'https://brightpath.edu.in', industry: 'Education', size: '50-100', location: 'Noida, Uttar Pradesh', annualRevenueRange: '₹8 Cr - ₹25 Cr', businessType: 'B2B EdTech', description: 'Higher-ed assessment & career readiness platform.' },
  { name: 'NovaRetail E-commerce', website: 'https://novaretail.in', industry: 'Retail', size: '200-500', location: 'Ahmedabad, Gujarat', annualRevenueRange: '₹40 Cr - ₹120 Cr', businessType: 'D2C Lifestyle', description: 'Omnichannel apparel and lifestyle brand.' },
  { name: 'Apex Heavy Engineering', website: 'https://apexengineering.co.in', industry: 'Manufacturing', size: '1000+', location: 'Faridabad, Haryana', annualRevenueRange: '₹250 Cr+', businessType: 'B2B Industrial', description: 'Precision heavy machinery and industrial tooling.' },
  { name: 'CloudBridge Solutions', website: 'https://cloudbridge.in', industry: 'Technology', size: '100-200', location: 'Kochi, Kerala', annualRevenueRange: '₹15 Cr - ₹40 Cr', businessType: 'B2B DevOps', description: 'Managed cloud operations and security services.' },
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
  { firstName: 'Vikram', lastName: 'Malhotra', email: 'vikram.m@techvault.co.in', phone: '+91 98765 10001', jobTitle: 'Chief Technology Officer', department: 'Engineering', companyIdx: 0 },
  { firstName: 'Ananya', lastName: 'Deshmukh', email: 'ananya.d@techvault.co.in', phone: '+91 98765 10002', jobTitle: 'VP Cloud Engineering', department: 'Engineering', companyIdx: 0 },
  { firstName: 'Deepak', lastName: 'Kulkarni', email: 'deepak.k@greenleafagro.in', phone: '+91 98765 10003', jobTitle: 'Managing Director', department: 'Executive', companyIdx: 1 },
  { firstName: 'Ritu', lastName: 'Aggarwal', email: 'ritu.aggarwal@pinnaclecapital.in', phone: '+91 98765 10004', jobTitle: 'Chief Financial Officer', department: 'Finance', companyIdx: 2 },
  { firstName: 'Sameer', lastName: 'Bose', email: 'sameer.bose@pinnaclecapital.in', phone: '+91 98765 10005', jobTitle: 'Director of Risk & Operations', department: 'Operations', companyIdx: 2 },
  { firstName: 'Dr. Kavita', lastName: 'Reddy', email: 'kavita.reddy@medcorehealth.in', phone: '+91 98765 10006', jobTitle: 'Chief Medical Information Officer', department: 'Clinical Tech', companyIdx: 3 },
  { firstName: 'Arjun', lastName: 'Singhania', email: 'arjun.s@urbanedgeinfra.com', phone: '+91 98765 10007', jobTitle: 'Head of Business Development', department: 'Commercial', companyIdx: 4 },
  { firstName: 'Shweta', lastName: 'Patel', email: 'shweta.patel@axiombiz.co.in', phone: '+91 98765 10008', jobTitle: 'Senior Partner', department: 'Management Consulting', companyIdx: 5 },
  { firstName: 'Nikhil', lastName: 'Varma', email: 'nikhil.v@quantumlabs.in', phone: '+91 98765 10009', jobTitle: 'Co-Founder & AI Lead', department: 'R&D', companyIdx: 6 },
  { firstName: 'Karthik', lastName: 'Sundaram', email: 'karthik.s@skynetexpress.in', phone: '+91 98765 10010', jobTitle: 'Head of National Logistics', department: 'Supply Chain', companyIdx: 7 },
  { firstName: 'Dr. Meera', lastName: 'Chatterjee', email: 'meera.c@brightpath.edu.in', phone: '+91 98765 10011', jobTitle: 'Dean of Academic Partnerships', department: 'Education', companyIdx: 8 },
  { firstName: 'Pooja', lastName: 'Shah', email: 'pooja.shah@novaretail.in', phone: '+91 98765 10012', jobTitle: 'Chief Marketing Officer', department: 'Brand & Growth', companyIdx: 9 },
  { firstName: 'Harish', lastName: 'Tiwari', email: 'harish.tiwari@apexengineering.co.in', phone: '+91 98765 10013', jobTitle: 'VP Procurement & Supply', department: 'Operations', companyIdx: 10 },
  { firstName: 'Divya', lastName: 'Menon', email: 'divya.menon@cloudbridge.in', phone: '+91 98765 10014', jobTitle: 'Director of Enterprise Alliances', department: 'Sales', companyIdx: 11 },
  { firstName: 'Siddharth', lastName: 'Rao', email: 'siddharth.r@techvault.co.in', phone: '+91 98765 10015', jobTitle: 'Platform Architect', department: 'Engineering', companyIdx: 0 },
  { firstName: 'Sunita', lastName: 'Rao', email: 'sunita.rao@medcorehealth.in', phone: '+91 98765 10016', jobTitle: 'Head of Hospital IT', department: 'IT', companyIdx: 3 },
  { firstName: 'Rajesh', lastName: 'Nambiar', email: 'rajesh.n@skynetexpress.in', phone: '+91 98765 10017', jobTitle: 'Chief Information Officer', department: 'Technology', companyIdx: 7 },
  { firstName: 'Tanvi', lastName: 'Bhatt', email: 'tanvi.bhatt@axiombiz.co.in', phone: '+91 98765 10018', jobTitle: 'Engagement Director', department: 'Consulting', companyIdx: 5 },
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
  { firstName: 'Vikram', lastName: 'Joshi', email: 'vjoshi@bharatfin.in', phone: '+91 98765 20001', companyName: 'Bharat Financial Tech', jobTitle: 'Head of IT Infrastructure', industry: 'Finance', location: 'Mumbai, Maharashtra', source: 'Website', status: 'Qualified', priority: 'High', estimatedBudget: 4500000, requirements: 'Full migration to AWS/GCP with microservices governance', interestedIn: 'Cloud Architecture', tags: ['enterprise', 'fintech'], notes: 'Detailed demo scheduled with architectural panel.' },
  { firstName: 'Ananya', lastName: 'Deshmukh', email: 'ananya@bluestarindia.com', phone: '+91 98765 20002', companyName: 'BlueStar Infotech', jobTitle: 'Chief Financial Officer', industry: 'Technology', location: 'Pune, Maharashtra', source: 'Referral', status: 'Negotiation', priority: 'High', estimatedBudget: 7500000, requirements: 'Financial analytics and revenue forecasting intelligence', interestedIn: 'Analytics Platform', tags: ['finance', 'ai-insights'], notes: 'Referred by Pinnacle Capital Advisors.' },
  { firstName: 'Sameer', lastName: 'Kulkarni', email: 'sameer@startuphub.in', phone: '+91 98765 20003', companyName: 'StartupHub India', jobTitle: 'Founder & CEO', industry: 'Technology', location: 'Bengaluru, Karnataka', source: 'LinkedIn', status: 'New', priority: 'Medium', estimatedBudget: 850000, requirements: 'Full pipeline CRM and automated email lead generation', interestedIn: 'CRM Suite', tags: ['startup', 'smb'] },
  { firstName: 'Shweta', lastName: 'Patel', email: 'shweta@meditechindia.org', phone: '+91 98765 20004', companyName: 'MediTech India Diagnostics', jobTitle: 'VP Clinical Operations', industry: 'Healthcare', location: 'Hyderabad, Telangana', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 2800000, requirements: 'Patient EHR integration across 14 hospital branches', interestedIn: 'Integration Services', tags: ['healthcare', 'integration'] },
  { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun@retailnext.in', phone: '+91 98765 20005', companyName: 'RetailNext India', jobTitle: 'Head of Digital Channels', industry: 'Retail', location: 'Hyderabad, Telangana', source: 'Social Media', status: 'Qualified', priority: 'High', estimatedBudget: 3500000, requirements: 'Omnichannel POS sync and automated buyer segmenting', interestedIn: 'E-commerce CRM', tags: ['retail', 'omnichannel'] },
  { firstName: 'Kavita', lastName: 'Menon', email: 'kmenon@greenfieldenergy.in', phone: '+91 98765 20006', companyName: 'Greenfield Solar Power', jobTitle: 'Operations Director', industry: 'Energy', location: 'Kochi, Kerala', source: 'Cold Calling', status: 'Contacted', priority: 'Low', estimatedBudget: 1800000, requirements: 'Site telemetry and preventive equipment service logs', interestedIn: 'Project Management', tags: ['solar', 'clean-energy'] },
  { firstName: 'Aditya', lastName: 'Singhania', email: 'aditya@buildproinfra.com', phone: '+91 98765 20007', companyName: 'BuildPro Constructions', jobTitle: 'VP Business Development', industry: 'Construction', location: 'Gurugram, Haryana', source: 'Referral', status: 'Proposal Sent', priority: 'High', estimatedBudget: 6500000, requirements: 'Enterprise bidding system and subcontractor tracking', interestedIn: 'Enterprise Suite', tags: ['construction', 'enterprise'] },
  { firstName: 'Pooja', lastName: 'Chatterjee', email: 'pooja.c@edulearnindia.edu', phone: '+91 98765 20008', companyName: 'EduLearn Bharat', jobTitle: 'Director of Technology', industry: 'Education', location: 'Kolkata, West Bengal', source: 'Website', status: 'Qualified', priority: 'Medium', estimatedBudget: 2200000, requirements: 'Integrated student lifecycle management and attendance API', interestedIn: 'LMS Solution', tags: ['education', 'lms'] },
  { firstName: 'Rahul', lastName: 'Bose', email: 'rahul.bose@logismart.co.in', phone: '+91 98765 20009', companyName: 'LogiSmart India', jobTitle: 'Head of National Logistics', industry: 'Logistics', location: 'Chennai, Tamil Nadu', source: 'LinkedIn', status: 'New', priority: 'Medium', estimatedBudget: 2500000, requirements: 'Fleet route optimization and cold storage sensors', interestedIn: 'Supply Chain Solution', tags: ['logistics', 'fleet'] },
  { firstName: 'Meera', lastName: 'Nambiar', email: 'meera@healthfirstcare.in', phone: '+91 98765 20010', companyName: 'HealthFirst Clinic Chain', jobTitle: 'Managing Partner', industry: 'Healthcare', location: 'Coimbatore, Tamil Nadu', source: 'Website', status: 'Converted', priority: 'High', estimatedBudget: 4200000, requirements: 'Multi-clinic appointment scheduling and digital billing', interestedIn: 'Clinic Suite', tags: ['healthcare', 'converted'] },
  { firstName: 'Siddharth', lastName: 'Rao', email: 'siddharth@innovatech.co.in', phone: '+91 98765 20011', companyName: 'InnovaTech Bangalore', jobTitle: 'Engineering VP', industry: 'Technology', location: 'Bengaluru, Karnataka', source: 'LinkedIn', status: 'Proposal Sent', priority: 'High', estimatedBudget: 5500000, requirements: 'DevSecOps automation and multi-region failover', interestedIn: 'DevOps Services', tags: ['devops', 'enterprise'] },
  { firstName: 'Tanvi', lastName: 'Bhatt', email: 'tanvi@finadvisors.in', phone: '+91 98765 20012', companyName: 'Gujarat Wealth Partners', jobTitle: 'Executive Director', industry: 'Finance', location: 'Ahmedabad, Gujarat', source: 'Referral', status: 'Qualified', priority: 'Medium', estimatedBudget: 3800000, requirements: 'Portfolio compliance analytics & SEBI audit reporting', interestedIn: 'Compliance Platform', tags: ['finance', 'compliance'] },
  { firstName: 'Gaurav', lastName: 'Saxena', email: 'gaurav@retailhubindia.in', phone: '+91 98765 20013', companyName: 'RetailHub Superstores', jobTitle: 'Commercial VP', industry: 'Retail', location: 'New Delhi', source: 'Advertisement', status: 'Lost', priority: 'Medium', estimatedBudget: 3200000, requirements: 'Inventory forecasting and GST billing integration', interestedIn: 'Retail Solutions', tags: ['retail', 'pos'], notes: 'Postponed project to next fiscal year.' },
  { firstName: 'Sneha', lastName: 'Kapoor', email: 'sneha@cloudnineinfra.in', phone: '+91 98765 20014', companyName: 'CloudNine Data Centers', jobTitle: 'Chief Executive Officer', industry: 'Technology', location: 'Noida, Uttar Pradesh', source: 'Website', status: 'New', priority: 'High', estimatedBudget: 8500000, requirements: 'Server co-location monitoring & SLA automation', interestedIn: 'Cloud Hosting', tags: ['cloud', 'hot-lead'] },
  { firstName: 'Deepak', lastName: 'Choudhary', email: 'deepak@pharmalife.co.in', phone: '+91 98765 20015', companyName: 'PharmaLife Lifesciences', jobTitle: 'R&D Operations Lead', industry: 'Healthcare', location: 'Ahmedabad, Gujarat', source: 'Cold Calling', status: 'Contacted', priority: 'Low', estimatedBudget: 1500000, requirements: 'Clinical batch verification & regulatory audit trails', interestedIn: 'Data Management', tags: ['pharma', 'compliance'] },
  { firstName: 'Radhika', lastName: 'Sen', email: 'radhika@designcraft.in', phone: '+91 98765 20016', companyName: 'DesignCraft Studios', jobTitle: 'Founder', industry: 'Design', location: 'Jaipur, Rajasthan', source: 'Social Media', status: 'New', priority: 'Low', estimatedBudget: 650000, requirements: 'Client pitch management and creative project pipelines', interestedIn: 'Collaboration Suite', tags: ['design', 'smb'] },
  { firstName: 'Karan', lastName: 'Malhotra', email: 'karan@autotechmotors.in', phone: '+91 98765 20017', companyName: 'AutoTech Mobility India', jobTitle: 'IT General Manager', industry: 'Automotive', location: 'Pune, Maharashtra', source: 'LinkedIn', status: 'Contacted', priority: 'Medium', estimatedBudget: 3600000, requirements: 'Dealer management system & service ticket automation', interestedIn: 'Service CRM', tags: ['automotive', 'mobility'] },
  { firstName: 'Divya', lastName: 'Sundaram', email: 'divya@mediamaxindia.com', phone: '+91 98765 20018', companyName: 'MediaMax Advertising', jobTitle: 'Senior Vice President', industry: 'Media', location: 'Mumbai, Maharashtra', source: 'Referral', status: 'Negotiation', priority: 'High', estimatedBudget: 5000000, requirements: 'Omnichannel ad performance dashboard & attribution', interestedIn: 'Marketing Intelligence', tags: ['media', 'marketing'] },
  { firstName: 'Harish', lastName: 'Pillai', email: 'harish@solarurja.in', phone: '+91 98765 20019', companyName: 'SolarUrja Solutions', jobTitle: 'Business Development Lead', industry: 'Energy', location: 'Surat, Gujarat', source: 'Website', status: 'Qualified', priority: 'Medium', estimatedBudget: 2600000, requirements: 'Rooftop solar estimate calculator and client contracts', interestedIn: 'Estimation Software', tags: ['solar', 'energy'] },
  { firstName: 'Ritu', lastName: 'Aggarwal', email: 'ritu@legalcorpasia.in', phone: '+91 98765 20020', companyName: 'Aggarwal & Legal Associates', jobTitle: 'Managing Partner', industry: 'Legal', location: 'New Delhi', source: 'Referral', status: 'Proposal Sent', priority: 'High', estimatedBudget: 4000000, requirements: 'Litigation document automation and billing records', interestedIn: 'Legal Tech', tags: ['legal', 'document-mgmt'] },
  { firstName: 'Sandeep', lastName: 'Tiwari', email: 'sandeep@delhifoodchain.in', phone: '+91 98765 20021', companyName: 'Tiwari Restaurant Chains', jobTitle: 'Operations VP', industry: 'Food & Beverage', location: 'Lucknow, Uttar Pradesh', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 2100000, requirements: 'Centralized kitchen dispatch & supplier invoice audits', interestedIn: 'F&B POS Suite', tags: ['food', 'multi-branch'] },
  { firstName: 'Sunita', lastName: 'Trivedi', email: 'sunita@insurebharat.co.in', phone: '+91 98765 20022', companyName: 'InsureBharat General Insurance', jobTitle: 'VP Customer Experience', industry: 'Insurance', location: 'Chandigarh', source: 'LinkedIn', status: 'Qualified', priority: 'High', estimatedBudget: 6000000, requirements: 'Instant claims settlement portal & WhatsApp bot', interestedIn: 'Insurance Automation', tags: ['insurance', 'fintech'] },
  { firstName: 'Alok', lastName: 'Mishra', email: 'alok@transbharat.in', phone: '+91 98765 20023', companyName: 'TransBharat Freightways', jobTitle: 'Fleet Operations Head', industry: 'Logistics', location: 'Indore, Madhya Pradesh', source: 'Cold Calling', status: 'New', priority: 'Low', estimatedBudget: 1200000, requirements: 'GPS telemetry & toll reconciliation dashboard', interestedIn: 'Fleet Platform', tags: ['transport', 'logistics'] },
  { firstName: 'Neha', lastName: 'Pandey', email: 'neha@fitfirststudios.in', phone: '+91 98765 20024', companyName: 'FitFirst Wellness Clubs', jobTitle: 'Founder', industry: 'Fitness', location: 'Bengaluru, Karnataka', source: 'Social Media', status: 'Contacted', priority: 'Low', estimatedBudget: 550000, requirements: 'Member check-in biometrics and recurring subscriptions', interestedIn: 'Gym Management', tags: ['fitness', 'smb'] },
  { firstName: 'Vivek', lastName: 'Swaminathan', email: 'vivek@dataprimeindia.io', phone: '+91 98765 20025', companyName: 'DataPrime Analytics India', jobTitle: 'Chief Data Architect', industry: 'Technology', location: 'Chennai, Tamil Nadu', source: 'Website', status: 'Negotiation', priority: 'High', estimatedBudget: 9500000, requirements: 'Enterprise lakehouse integration & real-time telemetry', interestedIn: 'BI & Lakehouse', tags: ['data', 'enterprise'] },
  { firstName: 'Lavanya', lastName: 'Murthy', email: 'lavanya@stylekanya.com', phone: '+91 98765 20026', companyName: 'StyleKanya Ethnic Wear', jobTitle: 'Founder & Creative Lead', industry: 'Retail', location: 'Hyderabad, Telangana', source: 'Advertisement', status: 'New', priority: 'Medium', estimatedBudget: 1100000, requirements: 'Social catalog integration and customer re-targeting', interestedIn: 'E-commerce', tags: ['fashion', 'd2c'] },
  { firstName: 'Rajesh', lastName: 'Goyal', email: 'rajesh@govsol.gov.in', phone: '+91 98765 20027', companyName: 'State e-Governance Initiative', jobTitle: 'Special Project Officer', industry: 'Government', location: 'Bhopal, Madhya Pradesh', source: 'Referral', status: 'Qualified', priority: 'Medium', estimatedBudget: 14000000, requirements: 'Unified citizen grievance and municipal service portal', interestedIn: 'GovTech Platform', tags: ['government', 'portal'] },
  { firstName: 'Chhavi', lastName: 'Mathur', email: 'chhavi@unitecauses.org.in', phone: '+91 98765 20028', companyName: 'Seva Bharat Foundation', jobTitle: 'Managing Trustee', industry: 'Non-Profit', location: 'Jaipur, Rajasthan', source: 'Email Campaign', status: 'Lost', priority: 'Low', estimatedBudget: 350000, requirements: 'Donor management and 80G tax exemption certificates', interestedIn: 'NGO Portal', tags: ['nonprofit'], notes: 'Grant cycle starts next quarter.' },
  { firstName: 'Nikhil', lastName: 'Varma', email: 'nikhil@cyberrakshak.in', phone: '+91 98765 20029', companyName: 'CyberRakshak Technologies', jobTitle: 'Chief Information Security Officer', industry: 'Cybersecurity', location: 'Bengaluru, Karnataka', source: 'LinkedIn', status: 'Proposal Sent', priority: 'High', estimatedBudget: 7200000, requirements: 'SOC 2 & ISO 27001 continuous audit automation', interestedIn: 'SOC Platform', tags: ['security', 'enterprise'] },
  { firstName: 'Nandini', lastName: 'Sengupta', email: 'nandini@travelsmartindia.com', phone: '+91 98765 20030', companyName: 'TravelSmart India Holidays', jobTitle: 'Operations Director', industry: 'Travel', location: 'Kolkata, West Bengal', source: 'Website', status: 'Contacted', priority: 'Medium', estimatedBudget: 1400000, requirements: 'Custom itinerary engine and payment gateway integration', interestedIn: 'Travel Suite', tags: ['travel', 'smb'] },
  { firstName: 'Tarun', lastName: 'Bansal', email: 'tarun@proptechdelhi.in', phone: '+91 98765 20031', companyName: 'PropTech Capital Infra', jobTitle: 'Managing Partner', industry: 'Real Estate', location: 'Gurugram, Haryana', source: 'Referral', status: 'Converted', priority: 'High', estimatedBudget: 5500000, requirements: 'Digital lease contract repository and tenant billing', interestedIn: 'PropTech Solution', tags: ['realestate', 'converted'] },
  { firstName: 'Anjali', lastName: 'Hegde', email: 'anjali@vidyaspark.in', phone: '+91 98765 20032', companyName: 'VidyaSpark Learning Academies', jobTitle: 'Managing Principal', industry: 'Education', location: 'Mangaluru, Karnataka', source: 'Social Media', status: 'New', priority: 'Low', estimatedBudget: 800000, requirements: 'Parent-teacher communication app & bus GPS tracker', interestedIn: 'School Software', tags: ['education', 'smb'] },
  { firstName: 'Mayank', lastName: 'Dubey', email: 'mayank@biotechlabs.in', phone: '+91 98765 20033', companyName: 'Bharat BioResearch Labs', jobTitle: 'Research Director', industry: 'Biotechnology', location: 'Bengaluru, Karnataka', source: 'LinkedIn', status: 'Qualified', priority: 'High', estimatedBudget: 8800000, requirements: 'LIMS sample tracking & clinical trial electronic records', interestedIn: 'LIMS Platform', tags: ['biotech', 'lims'] },
  { firstName: 'Ishita', lastName: 'Das', email: 'ishita@artisanfoods.in', phone: '+91 98765 20034', companyName: 'Artisan Foods of Bengal', jobTitle: 'Brand Director', industry: 'Food & Beverage', location: 'Kolkata, West Bengal', source: 'Email Campaign', status: 'Contacted', priority: 'Medium', estimatedBudget: 1800000, requirements: 'D2C subscription box automation and cold chain partner API', interestedIn: 'E-commerce', tags: ['food', 'd2c'] },
  { firstName: 'Pradeep', lastName: 'Solanki', email: 'pradeep@steelworksbharat.in', phone: '+91 98765 20035', companyName: 'Bharat Steel & Castings', jobTitle: 'Plant General Manager', industry: 'Manufacturing', location: 'Jamshedpur, Jharkhand', source: 'Cold Calling', status: 'New', priority: 'Medium', estimatedBudget: 2800000, requirements: 'Shop-floor yield tracking & industrial IoT dispatch logging', interestedIn: 'MES Platform', tags: ['manufacturing', 'quality'] },
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
  { title: 'TechVault Hybrid Cloud Migration', value: 8500000, stage: 'Negotiation', probability: 75, priority: 'High', companyIdx: 0, contactIdx: 0, leadIdx: 0, closeDays: 15 },
  { title: 'Pinnacle Capital Risk AI Suite', value: 6500000, stage: 'Proposal', probability: 50, priority: 'High', companyIdx: 2, contactIdx: 3, leadIdx: 1, closeDays: 30 },
  { title: 'MedCore Hospital EHR Integration', value: 4500000, stage: 'Discovery', probability: 30, priority: 'Medium', companyIdx: 3, contactIdx: 5, leadIdx: 3, closeDays: 45 },
  { title: 'UrbanEdge Tech Park Lease CRM', value: 2400000, stage: 'Qualification', probability: 20, priority: 'Medium', companyIdx: 4, contactIdx: 6, closeDays: 60 },
  { title: 'Axiom Business Transformation', value: 5200000, stage: 'Won', probability: 100, priority: 'High', companyIdx: 5, contactIdx: 7, leadIdx: 19, closeDays: -10, closedAt: d(10) },
  { title: 'SkyNet National Logistics Platform', value: 9800000, stage: 'Negotiation', probability: 65, priority: 'High', companyIdx: 7, contactIdx: 9, leadIdx: 8, closeDays: 20 },
  { title: 'BrightPath Higher-Ed LMS License', value: 2800000, stage: 'Proposal', probability: 45, priority: 'Medium', companyIdx: 8, contactIdx: 10, leadIdx: 7, closeDays: 35 },
  { title: 'NovaRetail Omnichannel Intelligence', value: 4100000, stage: 'Discovery', probability: 25, priority: 'Medium', companyIdx: 9, contactIdx: 11, leadIdx: 4, closeDays: 50 },
  { title: 'Apex Industrial ERP Implementation', value: 14500000, stage: 'Won', probability: 100, priority: 'High', companyIdx: 10, contactIdx: 12, closeDays: -30, closedAt: d(30) },
  { title: 'CloudBridge Managed DevOps Package', value: 3800000, stage: 'Qualification', probability: 15, priority: 'Low', companyIdx: 11, contactIdx: 13, leadIdx: 10, closeDays: 40 },
  { title: 'InsureBharat Claims Automation', value: 7500000, stage: 'Proposal', probability: 55, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 21, closeDays: 25 },
  { title: 'DataPrime Lakehouse Analytics', value: 12000000, stage: 'Negotiation', probability: 70, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 24, closeDays: 12 },
  { title: 'CyberRakshak SOC 2 Platform', value: 8900000, stage: 'Proposal', probability: 50, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 28, closeDays: 28 },
  { title: 'Bharat BioResearch LIMS Setup', value: 11000000, stage: 'Discovery', probability: 35, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 32, closeDays: 55 },
  { title: 'RetailHub Superstores POS', value: 3200000, stage: 'Lost', probability: 0, priority: 'Medium', companyIdx: null, contactIdx: null, leadIdx: 12, closeDays: -15, closedAt: d(15) },
  { title: 'State e-Governance Citizen Portal', value: 15000000, stage: 'Qualification', probability: 20, priority: 'Medium', companyIdx: null, contactIdx: null, leadIdx: 26, closeDays: 75 },
  { title: 'HealthFirst Multi-Clinic Suite', value: 4800000, stage: 'Won', probability: 100, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 9, closeDays: -5, closedAt: d(5) },
  { title: 'PropTech Capital Smart Lease Mgmt', value: 5800000, stage: 'Won', probability: 100, priority: 'High', companyIdx: null, contactIdx: null, leadIdx: 30, closeDays: -20, closedAt: d(20) },
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
  'Initial discovery call on Zoom', 'Technical product architecture demo', 'Follow-up on commercial proposal', 'Contract review with legal team',
  'Requirements alignment workshop', 'Annual IT budget review meeting', 'Enterprise security questionnaire review', 'Quarterly sales cadence call',
  'Customer onboarding kickoff session', 'Custom workflow discussion', 'Pricing and payment milestone negotiation', 'Client reference check call',
  'Share case study and ROI metrics', 'Schedule executive stakeholder introduction', 'Review revised proposal feedback', 'Discuss rollout timeline & SLA',
  'Send GST and commercial invoice terms', 'Check-in on pilot milestone progress', 'Security clearance and SOC review', 'Annual contract renewal discussion',
  'Strategic partnership exploration', 'Team training webinar planning', 'Service level agreement sign-off', 'Competitive feature matrix review',
  'Key performance metrics alignment', 'ERP and database integration call', 'Escalation resolution follow-up', 'Executive sponsor sync meeting',
  'Proof of concept review & test report', 'Final pricing sign-off call', 'Legal and master service agreement review', 'Go-live and cutover planning',
  'Post-deployment feedback call', 'Upsell exploration for additional branches', 'Quarterly business review preparation', 'Compliance audit document handover',
];

const activities = await Activity.insertMany(
  Array.from({ length: 38 }, (_, i) => ({
    organization: org._id,
    type: activityTypes[i % activityTypes.length],
    subject: activitySubjects[i % activitySubjects.length],
    description: `Discussion notes: ${activitySubjects[i % activitySubjects.length]} with Indian client stakeholders.`,
    dueAt: i < 10 ? d(Math.floor(Math.random() * 5) + 1) : (i < 25 ? fd(Math.floor(Math.random() * 14)) : d(Math.floor(Math.random() * 30))),
    priority: ['High', 'Medium', 'Low'][i % 3],
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
  'Prepare proposal for TechVault Hybrid Cloud', 'Update CRM records and GST details', 'Send follow-up WhatsApp/email to Ananya Deshmukh',
  'Review commercial terms for Apex Engineering deal', 'Create slide deck for Pinnacle Capital demo', 'Call Vikram Joshi regarding cloud architecture',
  'Update Q3 pipeline forecast report', 'Prepare quarterly executive sales report', 'Schedule sales rep product training session',
  'Benchmark SaaS competitor pricing in Indian market', 'Fine-tune lead qualification score weights', 'Draft cold outreach email sequence for CTOs',
  'Review customer feedback survey results', 'Prepare client onboarding kit & checklist', 'Update platform API integration guide',
  'Schedule meeting with Bharat BioResearch team', 'Follow up on InsureBharat commercial proposal', 'Draft bilateral non-disclosure agreement',
  'Complete vendor security assessment questionnaire', 'Plan quarterly customer success reviews',
];

await Task.insertMany(
  taskTitles.map((title, i) => ({
    organization: org._id,
    title,
    description: `Action item: ${title}`,
    status: taskStatuses[i % 4],
    priority: ['High', 'Medium', 'Low'][i % 3],
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
  { type: 'lead_assigned', title: 'New lead assigned', message: 'Vikram Joshi from Bharat Financial Tech has been assigned to you.' },
  { type: 'followup_due', title: 'Follow-up due', message: 'Follow up with Ananya Deshmukh at BlueStar Infotech is due today.' },
  { type: 'deal_updated', title: 'Deal stage changed', message: 'TechVault Hybrid Cloud Migration moved to Negotiation.' },
  { type: 'task_assigned', title: 'New task assigned', message: 'Prepare proposal for TechVault has been assigned to you.' },
  { type: 'activity_overdue', title: 'Overdue activity', message: 'Initial discovery call with Shweta Patel is overdue.' },
  { type: 'deal_updated', title: 'Deal won!', message: 'Congratulations! Axiom Business Transformation deal was won for ₹52,00,000.' },
  { type: 'lead_assigned', title: 'New lead from website', message: 'New lead: Sneha Kapoor from CloudNine Data Centers via Website.' },
  { type: 'reminder', title: 'Weekly pipeline review', message: 'Your weekly regional pipeline review is scheduled for today.' },
  { type: 'followup_due', title: 'Follow-up reminder', message: 'Follow up with Arjun Reddy at RetailNext by 5 PM.' },
  { type: 'deal_updated', title: 'Deal value updated', message: 'DataPrime Lakehouse Analytics deal value updated to ₹1,20,00,000.' },
  { type: 'task_assigned', title: 'Task due soon', message: 'Review contract terms for Apex Engineering deal is due tomorrow.' },
  { type: 'lead_assigned', title: 'Lead reassigned', message: 'Mayank Dubey from Bharat BioResearch Labs has been reassigned to you.' },
  { type: 'activity_overdue', title: 'Overdue follow-up', message: 'Budget review meeting with Divya Sundaram is 2 days overdue.' },
  { type: 'deal_updated', title: 'Deal lost', message: 'RetailHub Superstores deal was marked as Lost.' },
  { type: 'reminder', title: 'Monthly report due', message: 'Monthly revenue and GST report is due by end of week.' },
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
╔══════════════════════════════════════════════════════╗
║     Nexora CRM — Indian Standard Seed Complete       ║
╠══════════════════════════════════════════════════════╣
║  Organization: Nexora Technologies India             ║
║  Currency: INR (₹)  |  Timezone: Asia/Kolkata        ║
║                                                      ║
║  Demo Accounts:                                      ║
║  ┌──────────────┬──────────────────┬───────────────┐ ║
║  │ Role         │ Email            │ Password      │ ║
║  ├──────────────┼──────────────────┼───────────────┤ ║
║  │ Admin        │ admin@nexora.dev │ Password123!  │ ║
║  │ Manager      │ manager@nexora.dev│ Password123! │ ║
║  │ Sales Rep    │ rep@nexora.dev   │ Password123!  │ ║
║  └──────────────┴──────────────────┴───────────────┘ ║
║                                                      ║
║  Seeded Data (Indian Standard):                      ║
║  • 12 Companies (Bengaluru, Mumbai, Pune, etc.)      ║
║  • 18 Contacts (Indian names & +91 mobile numbers)   ║
║  • 35 Leads (Scored with realistic INR budgets)      ║
║  • 18 Deals (Values in ₹, 4 Won, 1 Lost, 13 active)  ║
║  • 38 Activities                                     ║
║  • 20 Tasks                                          ║
║  • 15 Notifications (Rupee amounts)                  ║
╚══════════════════════════════════════════════════════╝
`);

await disconnectDB();
