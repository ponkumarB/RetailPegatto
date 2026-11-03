export interface Lead {
  id: string; // Auto-generated
  
  // Section 1: Lead Information
  leadName: string;
  companyName: string;
  leadType: string;
  leadSource: string;
  industry?: string;
  website?: string;
  annualRevenue?: number;
  noOfEmployees?: number;
  gstVatNumber?: string;
  
  // Section 2: Primary Contact Information
  contactPerson: string;
  designation?: string;
  email: string;
  alternateEmail?: string;
  mobileNumber: string;
  alternateMobile?: string;
  officePhone?: string;
  
  // Section 3: Address Information
  addressLine1: string;
  addressLine2?: string;
  country: string;
  state: string;
  city: string;
  postalCode?: string;
  landmark?: string;
  
  // Section 4: Product / Service Interest
  interestedProducts?: string[];
  expectedQuantity?: number;
  budget?: number;
  budgetCurrency?: string;
  requirementDescription?: string;
  expectedPurchaseDate?: string;

  // Metadata/Status Tracker fields
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Proposal Sent' | 'Negotiation' | 'Converted' | 'Disqualified' | 'Nurturing';
  score: number;
  assignedTo: string;
  createdAt: string;

  // Extended fields for Lead Overview
  companySize?: string;
  preferredContactMethod?: string;
  bestTimeToContact?: string;
  leadSourceDetails?: string;
  tags?: string[];
  rating?: number;
  followUpDate?: string;
  
  activities?: Array<{
    id: string;
    type: string;
    status?: string;
    details: string;
    date: string;
    user?: string;
  }>;
  tasksList?: Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
    owner: string;
  }>;
  notesList?: Array<{
    id: string;
    content: string;
    date: string;
    user: string;
  }>;
  documentsList?: Array<{
    id: string;
    name: string;
    date: string;
    type: string;
  }>;
  firstName?: string;
  lastName?: string;
  twitterProfile?: string;
  linkedinProfile?: string;
  fax?: string;
  dateOfBirth?: string;
  sourceDetails?: string;
  noteText?: string;
}

