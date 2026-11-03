import { create } from 'zustand';

export interface Campaign {
  id: string;
  dbId?: number;
  name: string;
  type: 'Email' | 'Facebook' | 'LinkedIn' | 'WhatsApp' | 'Instagram' | 'SMS' | 'Other';
  status: 'Planned' | 'Active' | 'Paused' | 'Completed';
  budget: number;
  spend: number;
  leadsGenerated: number;
  roi: number; // percentage
  startDate: string;
  endDate?: string;
  description?: string;

  // Email-specific Settings
  emailSubject?: string;
  senderName?: string;
  senderEmail?: string;
  emailTemplate?: string;
  targetSegment?: string;

  // WhatsApp-specific Settings
  whatsappSender?: string;
  whatsappTemplateName?: string;
  whatsappMessageBody?: string;
  whatsappMediaUrl?: string;

  // LinkedIn-specific Settings
  linkedinAdAccount?: string;
  linkedinCampaignGroup?: string;
  linkedinTargetAudience?: string;
  linkedinAdCreativeUrl?: string;

  // Facebook-specific Settings
  facebookPage?: string;
  facebookCampaignName?: string;
  facebookTargetAudience?: string;
  facebookAdCreativeUrl?: string;
  facebookCta?: string;

  // Instagram-specific Settings
  instagramAccount?: string;
  instagramPlacement?: 'Feed' | 'Stories' | 'Reels' | 'Explore' | 'All';
  instagramAudienceInterests?: string;
  instagramMediaUrl?: string;
  instagramCta?: string;

  // SMS-specific Settings
  smsSenderId?: string;
  smsMessageBody?: string;
  smsTargetList?: string;

  // Event-specific Settings
  eventVenueType?: 'Physical' | 'Virtual' | 'Hybrid';
  eventAddress?: string;
  eventCapacity?: number;
  eventTicketPrice?: number;
  eventSpeakers?: string;
  eventAgenda?: string;

  // Webinar-specific Settings
  webinarPlatform?: 'Zoom' | 'MS Teams' | 'Google Meet' | 'Webex' | 'Other';
  webinarJoinUrl?: string;
  webinarDuration?: number; // in minutes
  webinarSpeakers?: string;
}

interface CampaignStore {
  campaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  updateCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
}

const initialCampaigns: Campaign[] = [
  {
    id: 'CAM-501',
    name: 'Spring Logistics Newsletter',
    type: 'Email',
    status: 'Active',
    budget: 5000,
    spend: 3200,
    leadsGenerated: 245,
    roi: 340,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    description: 'Outbound product marketing newsletter campaign promoting new logistics tools.',
    emailSubject: 'Say Hello to the New pegatto Logistics Suite!',
    senderName: 'Marketing Team',
    senderEmail: 'marketing@pegatto.com',
    emailTemplate: 'Logistics Special v2',
    targetSegment: 'EU Retail Logistics'
  },
  {
    id: 'CAM-502',
    name: 'Q2 Tech Webinar',
    type: 'Other',
    status: 'Active',
    budget: 2500,
    spend: 1800,
    leadsGenerated: 189,
    roi: 210,
    startDate: '2026-04-15',
    endDate: '2026-04-16',
    description: 'Expert panel session regarding B2B SaaS supply chain optimization.',
    webinarPlatform: 'Zoom',
    webinarJoinUrl: 'https://zoom.us/j/9821738910',
    webinarDuration: 60,
    webinarSpeakers: 'Dr. Emily Watson, John Doe'
  },
  {
    id: 'CAM-503',
    name: 'WhatsApp Business Outreach',
    type: 'WhatsApp',
    status: 'Active',
    budget: 1200,
    spend: 850,
    leadsGenerated: 312,
    roi: 185,
    startDate: '2026-02-10',
    endDate: '2026-04-10',
    description: 'Direct conversational marketing template broadcast for active customers.',
    whatsappSender: '+49 170 1234567',
    whatsappTemplateName: 'order_status_update',
    whatsappMessageBody: 'Hello {{1}}, your order #{{2}} has been processed. Track here: {{3}}',
    whatsappMediaUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'CAM-504',
    name: 'LinkedIn Lead Gen Ads',
    type: 'LinkedIn',
    status: 'Paused',
    budget: 4000,
    spend: 3900,
    leadsGenerated: 98,
    roi: 95,
    startDate: '2026-01-15',
    endDate: '2026-03-15',
    description: 'Sponsored updates targeting Operations Managers in central Europe.',
    linkedinAdAccount: 'pegatto B2B EMEA',
    linkedinCampaignGroup: 'SupplyChain2026',
    linkedinTargetAudience: 'Job Titles: Operations Manager, Supply Chain Director; Location: Germany, Netherlands',
    linkedinAdCreativeUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'CAM-505',
    name: 'Instagram Summer Promo',
    type: 'Instagram',
    status: 'Planned',
    budget: 3500,
    spend: 0,
    leadsGenerated: 0,
    roi: 0,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    description: 'Brand awareness visual promotion for summer discounts.',
    instagramAccount: '@pegatto_logistics',
    instagramPlacement: 'All',
    instagramAudienceInterests: 'Age: 21-45, Interests: E-commerce, Logistics, Supply Chain',
    instagramCta: 'Learn More',
    instagramMediaUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'CAM-506',
    name: 'Munich Logistics Expo 2026',
    type: 'Other',
    status: 'Planned',
    budget: 25000,
    spend: 5000,
    leadsGenerated: 0,
    roi: 0,
    startDate: '2026-06-20',
    endDate: '2026-06-23',
    description: 'Physical exhibition booth at Munich logistics center.',
    eventVenueType: 'Physical',
    eventAddress: 'Messe München, Hall B2, Booth 302',
    eventCapacity: 500,
    eventTicketPrice: 0,
    eventSpeakers: 'Marcus Aurelius, CEO; Jean Dupont, Logistics Lead',
    eventAgenda: '10:00 AM Boot Demos; 2:00 PM Panel Q&A Session; 5:00 PM Networking Drinks'
  },
  {
    id: 'CAM-507',
    name: 'SMS Notification Broadcast',
    type: 'SMS',
    status: 'Completed',
    budget: 1500,
    spend: 1500,
    leadsGenerated: 142,
    roi: 450,
    startDate: '2025-11-01',
    endDate: '2025-11-02',
    description: 'Quick discount notification alert sent to verified phone numbers.',
    smsSenderId: 'pegatto_SMS',
    smsMessageBody: 'pegatto Alert: Get 15% off logistics subscription this month only! Use code pegatto15. Register here: pegatto.com/promo',
    smsTargetList: 'Active Customers Germany'
  }
];

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: initialCampaigns,
  addCampaign: (campaign) => set((state) => {
    const nextId = `CAM-${Math.floor(508 + Math.random() * 400)}`;
    const newCampaign: Campaign = {
      ...campaign,
      id: nextId
    };
    return { campaigns: [newCampaign, ...state.campaigns] };
  }),
  updateCampaign: (campaign) => set((state) => ({
    campaigns: state.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
  })),
  deleteCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter((c) => c.id !== id)
  }))
}));
