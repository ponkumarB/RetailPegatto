export interface CompanyDeal {
  id: string;
  dealName: string;
  stage: string;
  dealValue: number; // in BDT
  expectedClose: string;
  owner: string;
}

export interface CompanyTimelineItem {
  id: string;
  type: string;
  details: string;
  date: string;
  user: string;
}

export interface CompanyNote {
  id: string;
  content: string;
  subject?: string;
  date: string;
  user: string;
}

export interface CompanyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Company {
  id: string; // e.g. COM-2025-00001
  companyName: string;
  status: 'Active' | 'Inactive';
  industry: string;
  phone: string;
  email: string;
  website: string;
  employeeSize: string; // e.g. "120"
  annualRevenue: string; // e.g. "৳ 15,00,00,000"
  companyType: string; // e.g. "Private Limited"
  location: string; // e.g. "Dhaka, Bangladesh"
  currency: string; // e.g. "BDT (৳)"
  
  // Address info
  country: string;
  city: string;
  postalCode: string;
  address: string;
  
  // Additional info
  source: string; // e.g. "Website"
  owner: string; // e.g. "Sadia Afrin"
  tags: string[];
  notes: string;
  about?: string;
  file?: string | null;
  fileName?: string | null;
  
  // Custom fields
  vatNumber?: string;
  registrationNumber?: string;
  branchOffice?: string;
  rating?: number; // 1-5 stars
  gstNo?: string;
  decisionMaker?: boolean;
  landLine?: string;
  fax?: string;
  paymentTerms?: string;
  latitude?: string;
  longitude?: string;
  
  // Sub-items
  deals: CompanyDeal[];
  contacts: CompanyContact[];
  notesList: CompanyNote[];
  timeline: CompanyTimelineItem[];
  
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
}
