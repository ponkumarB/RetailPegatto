'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { fetchUserQualifiedLeadListWithoutPagination } from '@/service/api/Leads/api';
import {
  ArrowLeft,
  Mail,
  Facebook,
  Linkedin,
  Instagram,
  Smartphone,
  Calendar,
  Video,
  Globe,
  Info,
  Lock,
  Sparkles,
  MapPin,
  Link,
  MoreHorizontal,
  ChevronDown,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCampaignDetails, updateCampaign, CampaignModel } from '@/service/api/campaign/api';
import { Campaign } from '@/store/useCampaignStore';
import { motion } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

// Helper to map backend channel code to frontend types
const mapChannelType = (channel: string | null | undefined, socialMediaTypes: string[] | null | undefined): Campaign['type'] => {
  const ch = (channel || (socialMediaTypes && socialMediaTypes[0]) || 'Other').toLowerCase().trim();
  if (ch.includes('email')) return 'Email';
  if (ch.includes('facebook')) return 'Facebook';
  if (ch.includes('linkedin')) return 'LinkedIn';
  if (ch.includes('whatsapp')) return 'WhatsApp';
  if (ch.includes('instagram')) return 'Instagram';
  if (ch.includes('sms')) return 'SMS';
  return 'Other';
};

// Helper to map backend status to frontend types
const mapStatus = (status: string | null | undefined): Campaign['status'] => {
  const st = (status || 'Planned').toLowerCase().trim();
  if (st.includes('draft') || st.includes('plan')) return 'Planned';
  if (st.includes('active') || st.includes('live')) return 'Active';
  if (st.includes('pause')) return 'Paused';
  if (st.includes('complete') || st.includes('done')) return 'Completed';
  return 'Planned';
};

// Custom WhatsApp Icon SVG Component
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} text-[#25D366] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.005c5.566 0 10.1-4.532 10.104-10.1.002-2.699-1.047-5.236-2.951-7.143C17.31 1.464 14.773.415 12.008.415 6.43.415 1.895 4.947 1.892 10.528c-.001 1.93.504 3.81 1.462 5.418L2.35 20.358l4.297-1.204zM17.9 14.852c-.322-.16-.1.9-.323-1.6-.16-.322-.59-.516-.913-.677-.323-.16-1.897-.933-2.18-.1.036-.282-.226-.436-.452-.516-.226-.08-1.516-.403-2.58.548-.823.823-1.37 1.823-1.53 2.1-.16.28-.016.43.124.57.126.126.282.322.42.484.14.16.186.274.28.452.093.18.046.338-.023.5-.069.16-.62 1.484-.855 2.048-.228.55-.458.484-.62.476-.153-.008-.33-.008-.508-.008-.18 0-.476.067-.726-.206-.25-.274-.95-.93-.95-2.27 0-1.34.975-2.637 1.112-2.82.137-.184 1.92-2.93 4.65-4.113.65-.28 1.157-.448 1.553-.573.654-.208 1.25-.178 1.72-.25.525-.078 1.62-.663 1.85-.92.228-.258.228-.48.15-.623-.076-.14-.282-.226-.6-.386z" />
  </svg>
);

const CHANNELS = [
  { id: 'Email', name: 'Email Campaign', icon: Mail, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 border-blue-100 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-900/30', desc: 'Outbound newsletter & email flows' },
  { id: 'Facebook', name: 'Facebook Ads', icon: Facebook, color: 'text-blue-850 dark:text-blue-405', bg: 'bg-blue-50/50 border-blue-100 hover:border-blue-300 dark:bg-blue-955/20 dark:border-blue-900/30', desc: 'Social feeds, story & messenger ads' },
  { id: 'LinkedIn', name: 'LinkedIn Ads', icon: Linkedin, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-900/30', desc: 'B2B sponsored posts & lead gen' },
  { id: 'WhatsApp', name: 'WhatsApp', icon: WhatsAppIcon, color: 'text-emerald-600 dark:text-emerald-450', bg: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/30', desc: 'Direct chat alerts & broad messages' },
  { id: 'Instagram', name: 'Instagram Campaign', icon: Instagram, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50/50 border-pink-100 hover:border-pink-300 dark:bg-pink-955/20 dark:border-pink-900/30', desc: 'Visual story, reels & feed ads' }
] as const;

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'all'; // 'direct' | 'social' | 'all'
  const { canEditCampaign, isLoaded } = usePermission();

  // Leads list states
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [searchLeadQuery, setSearchLeadQuery] = useState('');
  const [isLeadsDropdownOpen, setIsLeadsDropdownOpen] = useState(false);
  const leadsDropdownRef = React.useRef<HTMLDivElement>(null);


  // Fetch Qualified Leads
  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await fetchUserQualifiedLeadListWithoutPagination();
        if (Array.isArray(data)) {
          setLeadsList(data);
        }
      } catch (err) {
        console.error("Failed to load qualified leads:", err);
      }
    }
    loadLeads();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (leadsDropdownRef.current && !leadsDropdownRef.current.contains(e.target as Node)) {
        setIsLeadsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoaded && !canEditCampaign) {
      toast.error('You do not have permission to edit campaigns.');
      router.push('/marketing/campaigns');
    }
  }, [canEditCampaign, isLoaded, router]);

  const { primaryColor } = useStore();
  const queryClient = useQueryClient();

  const { data: campaignResponse, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaignDetails(id),
    retry: false,
  });

  const campaign = campaignResponse ? {
    id: campaignResponse.Promo_Id || String(campaignResponse.id),
    dbId: campaignResponse.id,
    name: campaignResponse.Promo_Name || 'Unnamed Campaign',
    type: mapChannelType(campaignResponse.Campaign_Channel, campaignResponse.SocialMedia_Type),
    status: mapStatus(campaignResponse.Campaign_Status),
    budget: Number(campaignResponse.Budget) || 0,
    spend: Number(campaignResponse.Spend_Amount) || 0,
    leadsGenerated: Number(campaignResponse.Actual_Leads) || Number(campaignResponse.Estimated_Leads) || 0,
    roi: Number(campaignResponse.Actual_ROI) || Number(campaignResponse.Estimated_ROI) || 0,
    startDate: campaignResponse.Start_Date || campaignResponse.Promo_Date || '',
    endDate: campaignResponse.End_Date || '',
    description: campaignResponse.Campaign_Description || campaignResponse.Promo_Content || '',

    // Email specific settings mapping
    emailSubject: campaignResponse.Campaign_Json?.emailSubject || campaignResponse.Promo_Name || '',
    senderName: campaignResponse.Campaign_Json?.senderName || 'Marketing Team',
    senderEmail: campaignResponse.Campaign_Json?.senderEmail || 'newsletter@pegatto.com',
    emailTemplate: campaignResponse.Campaign_Json?.emailTemplate || 'Product Newsletter',
    targetSegment: campaignResponse.Campaign_Json?.targetSegment || '',

    // WhatsApp specific
    whatsappSender: campaignResponse.Campaign_Json?.whatsappSender || '+49 170 1234567',
    whatsappTemplateName: campaignResponse.Campaign_Json?.whatsappTemplateName || 'order_status_update',
    whatsappMessageBody: campaignResponse.Campaign_Json?.whatsappMessageBody || campaignResponse.Promo_Content || '',
    whatsappMediaUrl: campaignResponse.Campaign_Json?.whatsappMediaUrl || campaignResponse.File || '',

    // Facebook specific
    facebookPage: campaignResponse.Campaign_Json?.facebookPage || 'pegatto Enterprise',
    facebookCampaignName: campaignResponse.Campaign_Json?.facebookCampaignName || 'Digital Marketing Campaign',
    facebookTargetAudience: campaignResponse.Campaign_Json?.facebookTargetAudience || '',
    facebookAdCreativeUrl: campaignResponse.Campaign_Json?.facebookAdCreativeUrl || campaignResponse.File || '',
    facebookCta: campaignResponse.Campaign_Json?.facebookCta || 'Learn More',

    // LinkedIn specific
    linkedinAdAccount: campaignResponse.Campaign_Json?.linkedinAdAccount || 'pegatto B2B EMEA',
    linkedinCampaignGroup: campaignResponse.Campaign_Json?.linkedinCampaignGroup || 'SupplyChain2026',
    linkedinTargetAudience: campaignResponse.Campaign_Json?.linkedinTargetAudience || '',
    linkedinAdCreativeUrl: campaignResponse.Campaign_Json?.linkedinAdCreativeUrl || campaignResponse.File || '',

    // Instagram specific
    instagramAccount: campaignResponse.Campaign_Json?.instagramAccount || '@pegatto_logistics',
    instagramPlacement: campaignResponse.Campaign_Json?.instagramPlacement || 'All',
    instagramAudienceInterests: campaignResponse.Campaign_Json?.instagramAudienceInterests || '',
    instagramMediaUrl: campaignResponse.Campaign_Json?.instagramMediaUrl || campaignResponse.File || '',
    instagramCta: campaignResponse.Campaign_Json?.instagramCta || 'Learn More',

    // SMS specific
    smsSenderId: campaignResponse.Campaign_Json?.sender_id || campaignResponse.Campaign_Json?.smsSenderId || 'pegatto_SMS',
    smsMessageBody: campaignResponse.Campaign_Json?.sms_template || campaignResponse.Promo_Content || '',
    smsTargetList: campaignResponse.Campaign_Json?.smsTargetList || '',
  } as Campaign : null;

  // Filter channels list based on current campaign type (direct vs social)
  const filteredChannels = React.useMemo(() => {
    if (campaign) {
      const isDirect = campaign.type === 'Email' || campaign.type === 'WhatsApp';
      if (isDirect) {
        return CHANNELS.filter(ch => ch.id === 'Email' || ch.id === 'WhatsApp');
      } else {
        return CHANNELS.filter(ch => ch.id === 'Facebook' || ch.id === 'LinkedIn' || ch.id === 'Instagram');
      }
    }
    if (category === 'direct') {
      return CHANNELS.filter(ch => ch.id === 'Email' || ch.id === 'WhatsApp');
    }
    if (category === 'social') {
      return CHANNELS.filter(ch => ch.id === 'Facebook' || ch.id === 'LinkedIn' || ch.id === 'Instagram');
    }
    return CHANNELS;
  }, [campaign, category]);

  // Form States
  const [name, setName] = useState('');
  const [type, setType] = useState<Campaign['type']>('Email');
  const [status, setStatus] = useState<Campaign['status']>('Planned');
  const [budget, setBudget] = useState('');
  const [spend, setSpend] = useState('0');
  const [leadsGenerated, setLeadsGenerated] = useState('0');
  const [roi, setRoi] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Email States
  const [emailSubject, setEmailSubject] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('Product Newsletter');
  const [targetSegment, setTargetSegment] = useState('');

  // WhatsApp States
  const [whatsappSender, setWhatsappSender] = useState('');
  const [whatsappTemplateName, setWhatsappTemplateName] = useState('');
  const [whatsappMessageBody, setWhatsappMessageBody] = useState('');
  const [whatsappMediaUrl, setWhatsappMediaUrl] = useState('');

  // Facebook States
  const [facebookPage, setFacebookPage] = useState('pegatto Enterprise');
  const [facebookCampaignName, setFacebookCampaignName] = useState('Digital Marketing Campaign');
  const [facebookTargetAudience, setFacebookTargetAudience] = useState('Business Owners');
  const [facebookAdCreativeUrl, setFacebookAdCreativeUrl] = useState('');
  const [facebookCta, setFacebookCta] = useState('Learn More');

  // LinkedIn States
  const [linkedinAdAccount, setLinkedinAdAccount] = useState('');
  const [linkedinCampaignGroup, setLinkedinCampaignGroup] = useState('');
  const [linkedinTargetAudience, setLinkedinTargetAudience] = useState('');
  const [linkedinAdCreativeUrl, setLinkedinAdCreativeUrl] = useState('');

  // Instagram States
  const [instagramAccount, setInstagramAccount] = useState('');
  const [instagramPlacement, setInstagramPlacement] = useState<Campaign['instagramPlacement']>('All');
  const [instagramAudienceInterests, setInstagramAudienceInterests] = useState('');
  const [instagramMediaUrl, setInstagramMediaUrl] = useState('');
  const [instagramCta, setInstagramCta] = useState('Learn More');

  // SMS States
  const [smsSenderId, setSmsSenderId] = useState('');
  const [smsMessageBody, setSmsMessageBody] = useState('');
  const [smsTargetList, setSmsTargetList] = useState('');

  // Event States
  const [eventVenueType, setEventVenueType] = useState<Campaign['eventVenueType']>('Physical');
  const [eventAddress, setEventAddress] = useState('');
  const [eventCapacity, setEventCapacity] = useState('');
  const [eventTicketPrice, setEventTicketPrice] = useState('0');
  const [eventSpeakers, setEventSpeakers] = useState('');
  const [eventAgenda, setEventAgenda] = useState('');

  // Webinar States
  const [webinarPlatform, setWebinarPlatform] = useState<Campaign['webinarPlatform']>('Zoom');
  const [webinarJoinUrl, setWebinarJoinUrl] = useState('');
  const [webinarDuration, setWebinarDuration] = useState('65');
  const [webinarSpeakers, setWebinarSpeakers] = useState('');

  // Populate page values once the campaign data is loaded
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setType(campaign.type);
      setStatus(campaign.status);
      setBudget(String(campaign.budget));
      setSpend(String(campaign.spend));
      setLeadsGenerated(String(campaign.leadsGenerated));
      setRoi(String(campaign.roi));
      setStartDate(campaign.startDate);
      setEndDate(campaign.endDate || '');
      setDescription(campaign.description || '');

      setEmailSubject(campaign.emailSubject || '');
      setSenderName(campaign.senderName || 'pegatto Sales');
      setSenderEmail(campaign.senderEmail || 'sales@pegatto.com');
      setEmailTemplate(campaign.emailTemplate || 'Product Newsletter');
      setTargetSegment(campaign.targetSegment || '');
      setSelectedLeadIds(campaignResponse?.Campaign_Json?.selectedLeadIds || []);

      setWhatsappSender(campaign.whatsappSender || '+49 170 999999');
      setWhatsappTemplateName(campaign.whatsappTemplateName || 'welcome_template');
      setWhatsappMessageBody(campaign.whatsappMessageBody || '');
      setWhatsappMediaUrl(campaign.whatsappMediaUrl || '');

      setFacebookPage(campaign.facebookPage || 'pegatto Enterprise');
      setFacebookCampaignName(campaign.facebookCampaignName || 'Digital Marketing Campaign');
      setFacebookTargetAudience(campaign.facebookTargetAudience || 'Business Owners');
      setFacebookAdCreativeUrl(campaign.facebookAdCreativeUrl || '');
      setFacebookCta(campaign.facebookCta || 'Learn More');

      setLinkedinAdAccount(campaign.linkedinAdAccount || 'pegatto Corporate');
      setLinkedinCampaignGroup(campaign.linkedinCampaignGroup || 'Q2 LeadGen');
      setLinkedinTargetAudience(campaign.linkedinTargetAudience || '');
      setLinkedinAdCreativeUrl(campaign.linkedinAdCreativeUrl || '');

      setInstagramAccount(campaign.instagramAccount || '@pegatto_erp');
      setInstagramPlacement(campaign.instagramPlacement || 'All');
      setInstagramAudienceInterests(campaign.instagramAudienceInterests || '');
      setInstagramMediaUrl(campaign.instagramMediaUrl || '');
      setInstagramCta(campaign.instagramCta || 'Learn More');

      setSmsSenderId(campaign.smsSenderId || 'pegatto_ERP');
      setSmsMessageBody(campaign.smsMessageBody || '');
      setSmsTargetList(campaign.smsTargetList || '');

      setEventVenueType(campaign.eventVenueType || 'Physical');
      setEventAddress(campaign.eventAddress || '');
      setEventCapacity(campaign.eventCapacity ? String(campaign.eventCapacity) : '');
      setEventTicketPrice(campaign.eventTicketPrice ? String(campaign.eventTicketPrice) : '0');
      setEventSpeakers(campaign.eventSpeakers || '');
      setEventAgenda(campaign.eventAgenda || '');

      setWebinarPlatform(campaign.webinarPlatform || 'Zoom');
      setWebinarJoinUrl(campaign.webinarJoinUrl || '');
      setWebinarDuration(campaign.webinarDuration ? String(campaign.webinarDuration) : '60');
      setWebinarSpeakers(campaign.webinarSpeakers || '');
    }
  }, [campaignResponse]);

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (fieldName: string, value: string, currentType: Campaign['type']) => {
    let errText = '';

    if (fieldName === 'name') {
      if (!value.trim()) {
        errText = 'Campaign name is required';
      }
    }

    if (fieldName === 'startDate') {
      if (!value) {
        errText = 'Start date is required';
      }
    }

    if (fieldName === 'endDate') {
      if (value && startDate && new Date(startDate) > new Date(value)) {
        errText = 'End date must be on or after start date';
      }
    }

    if (fieldName === 'budget') {
      if (!value) {
        errText = 'Budget is required';
      } else {
        const val = Number(value);
        if (isNaN(val)) {
          errText = 'Budget must be a numeric value';
        } else if (val <= 0) {
          errText = 'Budget must be a positive number';
        }
      }
    }

    if (fieldName === 'spend') {
      if (value) {
        const val = Number(value);
        if (isNaN(val)) {
          errText = 'Spend must be a numeric value';
        } else if (val < 0) {
          errText = 'Spend cannot be negative';
        }
      }
    }

    if (fieldName === 'leadsGenerated') {
      if (value) {
        const val = Number(value);
        if (isNaN(val)) {
          errText = 'Est. leads target must be a numeric value';
        } else if (val < 0) {
          errText = 'Est. leads target cannot be negative';
        } else if (!Number.isInteger(val)) {
          errText = 'Est. leads target must be a whole number';
        }
      }
    }

    if (fieldName === 'roi') {
      if (value) {
        const val = Number(value);
        if (isNaN(val)) {
          errText = 'Est. target ROI must be a numeric value';
        } else if (val < 0) {
          errText = 'Est. target ROI cannot be negative';
        }
      }
    }

    if (fieldName === 'emailSubject' && currentType === 'Email') {
      if (!value.trim()) {
        errText = 'Subject line is required';
      }
    }

    if (fieldName === 'whatsappMessageBody' && currentType === 'WhatsApp') {
      if (!value.trim()) {
        errText = 'Message body text is required';
      }
    }

    if (fieldName === 'smsMessageBody' && currentType === 'SMS') {
      if (!value.trim()) {
        errText = 'SMS text message body is required';
      }
    }

    setErrors(prev => {
      const next = { ...prev };
      if (errText) {
        next[fieldName] = errText;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  };

  const validateForm = (currentType: Campaign['type']) => {
    const tempErrors: Record<string, string> = {};

    if (!name.trim()) {
      tempErrors.name = 'Campaign name is required';
    }

    if (!startDate) {
      tempErrors.startDate = 'Start date is required';
    }

    if (endDate && startDate && new Date(startDate) > new Date(endDate)) {
      tempErrors.endDate = 'End date must be on or after start date';
    }

    if (!budget) {
      tempErrors.budget = 'Budget is required';
    } else {
      const val = Number(budget);
      if (isNaN(val)) {
        tempErrors.budget = 'Budget must be a numeric value';
      } else if (val <= 0) {
        tempErrors.budget = 'Budget must be a positive number';
      }
    }

    if (spend) {
      const val = Number(spend);
      if (isNaN(val)) {
        tempErrors.spend = 'Spend must be a numeric value';
      } else if (val < 0) {
        tempErrors.spend = 'Spend cannot be negative';
      }
    }

    if (leadsGenerated) {
      const val = Number(leadsGenerated);
      if (isNaN(val)) {
        tempErrors.leadsGenerated = 'Est. leads target must be a numeric value';
      } else if (val < 0) {
        tempErrors.leadsGenerated = 'Est. leads target cannot be negative';
      } else if (!Number.isInteger(val)) {
        tempErrors.leadsGenerated = 'Est. leads target must be a whole number';
      }
    }

    if (roi) {
      const val = Number(roi);
      if (isNaN(val)) {
        tempErrors.roi = 'Est. target ROI must be a numeric value';
      } else if (val < 0) {
        tempErrors.roi = 'Est. target ROI cannot be negative';
      }
    }

    if (currentType === 'Email' && !emailSubject.trim()) {
      tempErrors.emailSubject = 'Subject line is required';
    }

    if (currentType === 'WhatsApp' && !whatsappMessageBody.trim()) {
      tempErrors.whatsappMessageBody = 'Message body text is required';
    }

    if (currentType === 'SMS' && !smsMessageBody.trim()) {
      tempErrors.smsMessageBody = 'SMS text message body is required';
    }

    if ((currentType === 'Email' || currentType === 'WhatsApp') && selectedLeadIds.length === 0) {
      tempErrors.selectedLeads = 'Please select at least one lead recipient';
    }

    setErrors(tempErrors);
    return tempErrors;
  };

  const handleTypeChange = (newType: Campaign['type']) => {
    setType(newType);
    setErrors(prev => {
      const next = { ...prev };
      delete next.emailSubject;
      delete next.whatsappMessageBody;
      delete next.smsMessageBody;
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CampaignModel> & { id: number }) => updateCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success(`Campaign updated successfully!`);
      router.push(`/marketing/campaigns/${id}`);
    },
    onError: (err: any) => {
      toast.error(`Failed to update campaign: ${err.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Loading Campaign...</h2>
        <p className="text-sm text-slate-500">Please wait while we retrieve campaign details.</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Campaign Not Found</h2>
        <p className="text-sm text-slate-500">The campaign ID {id} does not exist.</p>
        <Button onClick={() => router.push('/marketing/campaigns')} className="text-white" style={{ backgroundColor: primaryColor }}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm(type);
    if (Object.keys(formErrors).length > 0) {
      toast.error('Please correct the validation errors in the form.');
      return;
    }

    const isSocialMedia = type === 'Facebook' || type === 'LinkedIn' || type === 'Instagram';
    const isDirect = type === 'Email' || type === 'WhatsApp';

    const selectedLeadObjects = selectedLeadIds
      .map(id => leadsList.find(l => (l.id || l.Lead_Id) === id))
      .filter(Boolean);

    const payload: Partial<CampaignModel> & { id: number } = {
      id: Number(campaign.dbId || id),
      Organization_Id: campaignResponse?.Organization_Id || 1,
      Promo_Code: campaignResponse?.Promo_Code || "",
      Promo_Name: name,
      Promo_Date: campaignResponse?.Promo_Date || new Date().toISOString().split('T')[0],
      Promo_Content: description || "",
      Campaign_Type: isSocialMedia ? "Social Media Promotion" : "Promotion",
      Campaign_Channel: type,
      Campaign_Status: status,
      Campaign_Description: description || "",
      Start_Date: startDate,
      End_Date: endDate || null,
      Budget: parseFloat(budget) || 0,
      Spend_Amount: parseFloat(spend) || 0,
      Estimated_Leads: parseInt(leadsGenerated) || 0,
      Actual_Leads: campaignResponse?.Actual_Leads || 0,
      Estimated_ROI: parseFloat(roi) || 0,
      Actual_ROI: campaignResponse?.Actual_ROI || 0,
      Campaign_Owner: campaignResponse?.Campaign_Owner || "Admin",
      Campaign_Owner_Id: campaignResponse?.Campaign_Owner_Id || 1,
      Target_Audience: isDirect
        ? selectedLeadObjects.map(l => `${l.LeadFirstName || ''} ${l.LeadLastName || ''}`).join(', ')
        : (isSocialMedia ? (type === 'Facebook' ? facebookTargetAudience : (type === 'LinkedIn' ? linkedinTargetAudience : instagramAudienceInterests)) : "Existing Customers"),
      Target_Count: isDirect ? selectedLeadIds.length : (campaignResponse?.Target_Count || 1000),
      Response_Count: campaignResponse?.Response_Count || 0,
      Conversion_Count: campaignResponse?.Conversion_Count || 0,
      Campaign_Source: isSocialMedia ? "Social Media" : "CRM",
      Campaign_Json: {
        ...(type === 'Email' && { emailSubject, senderName, senderEmail, emailTemplate, selectedLeadIds }),
        ...(type === 'Facebook' && { facebookPage, facebookCampaignName, facebookTargetAudience, facebookAdCreativeUrl, facebookCta }),
        ...(type === 'LinkedIn' && { linkedinAdAccount, linkedinCampaignGroup, linkedinTargetAudience, linkedinAdCreativeUrl }),
        ...(type === 'WhatsApp' && { whatsappTemplateName, whatsappMessageBody, whatsappMediaUrl, selectedLeadIds }),
        ...(type === 'Instagram' && { instagramAccount, instagramPlacement, instagramAudienceInterests, instagramMediaUrl, instagramCta }),
        ...(type === 'SMS' && {
          smsSenderId,
          smsMessageBody,
          smsTargetList,
          sms_template: smsMessageBody,
          sender_id: smsSenderId
        }),
      },
      Active_Flag: campaignResponse?.Active_Flag !== undefined ? campaignResponse?.Active_Flag : true,
      Is_Deleted: campaignResponse?.Is_Deleted || false,
      File: campaignResponse?.File || null,
      FileName: campaignResponse?.FileName || null,
      Days_to_Run: campaignResponse?.Days_to_Run || "5",
      Posting_Date: startDate ? `${startDate} 10:00:00` : `${new Date().toISOString().split('T')[0]} 10:00:00`,
      SocialMedia_Type: [type],
      Is_Stoped: campaignResponse?.Is_Stoped || false,
      Created_By: campaignResponse?.Created_By || 1,
      Updated_By: 1,
      UserId: campaignResponse?.UserId || 1,
      sub: campaignResponse?.sub || "admin",
      name: campaignResponse?.name || "Administrator"
    };

    updateMutation.mutate(payload);
  };

  const renderLiveMockup = () => {
    const fallbackImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80";

    switch (type) {
      case 'Email':
        return (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 text-left w-full">
            <div className="bg-slate-105 dark:bg-slate-850 px-4 py-2 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 select-none">pegatto-mail-preview.net</span>
              <div className="w-10" />
            </div>
            <div className="p-4 border-b dark:border-slate-800 text-xs space-y-1.5 bg-slate-50/50 dark:bg-slate-955/20">
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">From:</span><span className="font-semibold text-slate-700 dark:text-slate-355">{senderName || 'Marketing Team'} &lt;{senderEmail || 'newsletter@pegatto.com'}&gt;</span></div>
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">To:</span><span className="text-slate-650">leads-segment@pegatto-crm.internal</span></div>
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">Subject:</span><span className="font-bold text-slate-900 dark:text-white">{emailSubject || 'Welcome to Retail Pegatto!'}</span></div>
            </div>
            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto text-xs leading-relaxed text-slate-655 dark:text-slate-355">
              <div className="border-b pb-3 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Template: {emailTemplate || 'Product Newsletter'}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Discover the next level of logistics automation</h2>
              <p>Hi there,</p>
              <p>We are excited to share new features in our workspace dashboard. Empower your sales pipelines and campaigns directly through integrated workflow triggers.</p>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-850 text-[11px] italic">
                {description || 'Campaign details template description block placeholder.'}
              </div>
              <div className="pt-3">
                <button type="button" className="bg-blue-600 text-white font-bold py-1.5 px-4 rounded text-[11px] shadow-xs">
                  Explore Features
                </button>
              </div>
              <div className="border-t pt-4 dark:border-slate-850 text-[10px] text-slate-400 text-center">
                © 2026 Retail Pegatto. All rights reserved. 123 Business Rd, Munich.
              </div>
            </div>
          </div>
        );

      case 'Facebook':
        return (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-955 text-left shadow-2xs w-full">
            <div className="p-4 flex items-center justify-between border-b dark:border-slate-900">
              <div className="flex gap-2.5 items-center">
                <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-extrabold text-white">
                  f
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {facebookPage || 'pegatto Enterprise'}
                  </h4>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Sponsored • 🌐 B2B Enterprise</span>
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </div>
            <div className="px-4 pt-3 pb-2 text-xs leading-relaxed text-slate-700 dark:text-slate-355">
              <p className="font-semibold text-blue-600 mb-1">Campaign: {facebookCampaignName || 'Digital Marketing Campaign'}</p>
              <p className="font-bold text-slate-900 dark:text-white mb-2">{name || 'New Facebook Ad Campaign'}</p>
              <p className="text-slate-655">{description || 'Connect with business prospects through automated workflows and modern CRM pipelines.'}</p>
            </div>
            <div className="border-y dark:border-slate-900 relative bg-slate-50 dark:bg-slate-900 h-[150px] overflow-hidden">
              <img
                src={facebookAdCreativeUrl || fallbackImage}
                alt="Facebook Ad Creative"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{facebookPage || 'pegatto Enterprise'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{facebookTargetAudience || 'Business Owners'}</span>
              </div>
              <button type="button" className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded text-[10.5px] shadow-xs">
                {facebookCta || 'Learn More'}
              </button>
            </div>
          </div>
        );

      case 'WhatsApp':
        return (
          <div className="w-[280px] mx-auto border-8 border-slate-800 dark:border-slate-955 rounded-[36px] overflow-hidden shadow-lg bg-[#efeae2] relative text-left">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-750" />
            </div>
            <div className="bg-[#075e54] text-white pt-7 pb-2.5 px-3 flex items-center gap-2 shadow-xs">
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-teal-800">
                I
              </div>
              <div>
                <p className="text-[11px] font-bold leading-tight">pegatto Broadcast</p>
                <span className="text-[8px] opacity-80 block">online</span>
              </div>
            </div>
            <div className="p-3 space-y-2 min-h-[260px] max-h-[300px] overflow-y-auto flex flex-col justify-end">
              <div className="text-[8px] bg-sky-100 text-sky-850 self-center px-2 py-0.5 rounded shadow-2xs font-semibold uppercase tracking-wider mb-2">
                WhatsApp Template: {whatsappTemplateName || 'Broadcast'}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 text-[10.5px] max-w-[85%] self-start shadow-3xs leading-relaxed text-slate-850 dark:text-slate-200">
                {whatsappMediaUrl && (
                  <img
                    src={whatsappMediaUrl}
                    alt="WhatsApp Media"
                    className="rounded-md mb-2 object-cover max-h-[110px] w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                )}
                <p className="whitespace-pre-wrap">
                  {whatsappMessageBody || 'WhatsApp template message preview will load here...'}
                </p>
                <div className="text-[8px] text-slate-400 text-right mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="bg-slate-105 dark:bg-slate-955 p-2 border-t flex items-center gap-1.5">
              <div className="bg-white dark:bg-slate-900 flex-1 rounded-full px-3 py-1 text-[9px] text-slate-400">
                Message...
              </div>
              <div className="h-6 w-6 rounded-full bg-[#128c7e] flex items-center justify-center text-white text-[10px]">
                ➤
              </div>
            </div>
          </div>
        );

      case 'SMS':
        return (
          <div className="w-[280px] mx-auto border-8 border-slate-855 dark:border-slate-955 rounded-[36px] overflow-hidden shadow-lg bg-slate-50 dark:bg-slate-900 relative text-left">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-10" />
            <div className="bg-slate-100 dark:bg-slate-955 pt-7 pb-2.5 px-3 border-b text-center">
              <p className="text-[10px] font-bold text-slate-500">Sender ID</p>
              <h4 className="text-xs font-bold text-slate-880 dark:text-white leading-tight mt-0.5">{smsSenderId || 'pegatto_SMS'}</h4>
            </div>
            <div className="p-3 space-y-2 min-h-[260px] max-h-[300px] overflow-y-auto flex flex-col justify-end">
              <div className="bg-slate-200 dark:bg-slate-850 text-slate-805 dark:text-slate-200 rounded-2xl px-3 py-2 text-[10px] max-w-[85%] self-start shadow-3xs leading-relaxed whitespace-pre-wrap">
                {smsMessageBody || 'SMS broadcast body text template preview...'}
              </div>
              <div className="text-[8px] text-slate-450 self-start ml-2">
                iMessage • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-955 p-2 border-t flex items-center">
              <div className="bg-white dark:bg-slate-900 border rounded-full px-3 py-1 flex-1 text-[9px] text-slate-300">
                Text Message
              </div>
            </div>
          </div>
        );

      case 'LinkedIn':
        return (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-955 text-left shadow-2xs w-full">
            <div className="p-4 flex items-center justify-between border-b dark:border-slate-900">
              <div className="flex gap-2.5 items-center">
                <div className="h-9 w-9 rounded-full bg-slate-105 border flex items-center justify-center text-xs font-extrabold text-blue-800">
                  IN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Retail Pegatto Solutions</h4>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Sponsored • 🌐 B2B Enterprise</span>
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </div>
            <div className="px-4 pt-3 pb-2 text-xs leading-relaxed text-slate-700 dark:text-slate-355">
              <p className="font-semibold text-blue-600 mb-1">Ad Account: {linkedinAdAccount || 'Default Corporate'}</p>
              <p className="font-bold text-slate-900 dark:text-white mb-2">{name || 'New LinkedIn Ad campaign'}</p>
              <p className="text-slate-650">{description || 'Targeting operations specialists globally with scalable supply chain intelligence.'}</p>
            </div>
            <div className="border-y dark:border-slate-900 relative bg-slate-50 dark:bg-slate-900 h-[150px] overflow-hidden">
              <img
                src={linkedinAdCreativeUrl || fallbackImage}
                alt="Ad Creative"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">pegatto Enterprise</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Request a Free Platform Trial</span>
              </div>
              <button type="button" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 font-extrabold px-3 py-1 rounded text-[10.5px]">
                Sign Up
              </button>
            </div>
          </div>
        );

      case 'Instagram':
        return (
          <div className="w-[280px] mx-auto border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-955 text-left shadow-xs">
            <div className="p-3 flex items-center justify-between border-b dark:border-slate-900">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                  <div className="h-full w-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center text-[7px] font-bold">
                    IN
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight">
                    {instagramAccount || '@pegatto_logistics'}
                  </h4>
                  <span className="text-[8px] text-slate-400 block">Sponsored</span>
                </div>
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="h-[200px] bg-slate-105 dark:bg-slate-900 overflow-hidden">
              <img
                src={instagramMediaUrl || fallbackImage}
                alt="Instagram Ad Content"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="bg-[#3897f0] text-white py-2 px-3 flex justify-between items-center text-[10.5px] font-bold select-none cursor-pointer">
              <span>{instagramCta || 'Learn More'}</span>
              <span>➔</span>
            </div>
            <div className="p-3 text-[10.5px] leading-relaxed text-slate-850 dark:text-slate-255">
              <p className="font-extrabold">{instagramAccount || '@pegatto_logistics'} <span className="font-normal text-slate-655 ml-1">{description || 'Summer special promotions. Claim your voucher code inside.'}</span></p>
              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Placement: {instagramPlacement || 'All'}</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-slate-400 border rounded-xl bg-slate-50 dark:bg-slate-900 border-dashed dark:border-slate-800 w-full">
            <Globe className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Custom Campaign Channel</h4>
            <p className="text-[11px] leading-relaxed mt-1 text-slate-500">Custom targeting formats are configured using third-party integrations.</p>
          </div>
        );
    }
  };

  const filteredLeadsList = React.useMemo(() => {
    if (!searchLeadQuery) return leadsList;
    const lower = searchLeadQuery.toLowerCase();
    return leadsList.filter(lead => {
      const name = `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}`.toLowerCase();
      const email = (lead.Email || '').toLowerCase();
      const phone = (lead.Mobile_No || lead.Phone_No || lead.Phone || '').toLowerCase();
      return name.includes(lower) || email.includes(lower) || phone.includes(lower);
    });
  }, [leadsList, searchLeadQuery]);

  const handleToggleLead = (leadId: number) => {
    setSelectedLeadIds(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    setSelectedLeadIds(leadsList.map(l => l.id || l.Lead_Id).filter(Boolean));
  };

  const handleClearAllLeads = () => {
    setSelectedLeadIds([]);
  };

  const renderLeadsSelectDropdown = () => {
    const selectedCount = selectedLeadIds.length;
    const selectedLabels = selectedLeadIds
      .map(id => {
        const lead = leadsList.find(l => (l.id || l.Lead_Id) === id);
        return lead ? `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}` : '';
      })
      .filter(Boolean)
      .join(', ');

    return (
      <div className="space-y-1.5 relative" ref={leadsDropdownRef}>
        <label className="font-bold text-slate-550 dark:text-slate-400 uppercase block">Select Leads (Recipients) *</label>
        <button
          type="button"
          onClick={() => setIsLeadsDropdownOpen(prev => !prev)}
          className="w-full min-h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 flex justify-between items-center cursor-pointer"
        >
          <span className="truncate flex-1">
            {selectedCount > 0 ? `${selectedLabels} (${selectedCount} selected)` : 'Choose recipient leads...'}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-205 ${isLeadsDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLeadsDropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 space-y-2 max-h-[220px] flex flex-col">
            <div className="flex items-center gap-2 border-b pb-2 dark:border-slate-800 shrink-0">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchLeadQuery}
                onChange={e => setSearchLeadQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 px-1 select-none">
              <button type="button" onClick={handleSelectAllLeads} className="hover:underline">Select All ({leadsList.length})</button>
              <button type="button" onClick={handleClearAllLeads} className="hover:underline text-slate-400 hover:text-slate-500">Clear All</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {filteredLeadsList.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">No leads found</p>
              ) : (
                filteredLeadsList.map(lead => {
                  const leadId = lead.id || lead.Lead_Id;
                  const isChecked = selectedLeadIds.includes(leadId);
                  const name = `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}`;
                  return (
                    <label
                      key={leadId}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer text-xs text-slate-755 dark:text-slate-355 select-none font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleLead(leadId)}
                        className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500/20 h-3.5 w-3.5"
                      />
                      <span className="truncate flex-1 font-bold text-slate-800 dark:text-slate-200">{name}</span>
                      {lead.Email && <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">{lead.Email}</span>}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const smsBodyLength = smsMessageBody.length;
  const smsSegments = Math.ceil(smsBodyLength / 160) || 1;

  if (isLoaded && !canEditCampaign) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-28"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/marketing/campaigns">Marketing</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/marketing/campaigns">Campaigns</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to={`/marketing/campaigns/${id}`}>{campaign.name}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Campaign</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header section with Back Button */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/marketing/campaigns/${id}`)}
            className="h-10 w-10 border dark:border-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Campaign Editor
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Campaign: {id}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Forms (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Channel Selector */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-2xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Select Marketing Channel *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {filteredChannels.map((ch) => {
                const Icon = ch.icon;
                const isSelected = type === ch.id;
                return (
                  <button
                    type="button"
                    key={ch.id}
                    onClick={() => handleTypeChange(ch.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-155 relative ${isSelected
                      ? 'bg-blue-50/30 border-blue-500 dark:bg-blue-955/20 ring-1 ring-blue-500'
                      : 'bg-slate-50/50 dark:bg-slate-955/20 border-slate-205 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                  >
                    <span className={`p-1.5 rounded-lg border inline-block mb-2 ${ch.bg} ${ch.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-855 dark:text-slate-200 leading-tight block truncate">{ch.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 leading-snug line-clamp-2">{ch.desc}</p>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 text-blue-600 font-extrabold text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Campaign Settings</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name *</label>
              <Input
                placeholder="e.g. Q4 Black Friday Promo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateField('name', e.target.value, type);
                }}
                className={`h-10 ${errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              />
              {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date *</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    validateField('startDate', e.target.value, type);
                  }}
                  className={`h-10 text-xs ${errors.startDate ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.startDate && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.startDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date (Optional)</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    validateField('endDate', e.target.value, type);
                  }}
                  className={`h-10 text-xs ${errors.endDate ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.endDate && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.endDate}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Description</label>
                <Input
                  placeholder="Brief description of goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Finance Metrics */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Budget & Performance Goals</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget (INR) *</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    validateField('budget', e.target.value, type);
                  }}
                  className={`h-10 font-mono ${errors.budget ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.budget && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.budget}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spend (INR)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={spend}
                  onChange={(e) => {
                    setSpend(e.target.value);
                    validateField('spend', e.target.value, type);
                  }}
                  className={`h-10 font-mono ${errors.spend ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.spend && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.spend}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Leads Target</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={leadsGenerated}
                  onChange={(e) => {
                    setLeadsGenerated(e.target.value);
                    validateField('leadsGenerated', e.target.value, type);
                  }}
                  className={`h-10 font-mono ${errors.leadsGenerated ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.leadsGenerated && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.leadsGenerated}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Target ROI (%)</label>
                <Input
                  type="number"
                  placeholder="150"
                  value={roi}
                  onChange={(e) => {
                    setRoi(e.target.value);
                    validateField('roi', e.target.value, type);
                  }}
                  className={`h-10 font-mono ${errors.roi ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.roi && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.roi}</p>}
              </div>
            </div>
          </div>

          {/* Step 4: Channel Specific Configurations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">4. Channel Configurations</h3>
              <Badge className="bg-blue-100 text-blue-755 dark:bg-blue-950 dark:text-blue-300 font-bold uppercase text-[9px] rounded-md">
                {type} Mode
              </Badge>
            </div>

            {/* Email Specific Inputs */}
            {type === 'Email' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Subject Line *</label>
                  <Input
                    placeholder="Email Subject"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      validateField('emailSubject', e.target.value, type);
                    }}
                    className={`h-10 ${errors.emailSubject ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                  {errors.emailSubject && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.emailSubject}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Sender Name</label>
                    <Input placeholder="pegatto Marketing" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Sender Email</label>
                    <Input type="email" placeholder="marketing@pegatto.com" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">HTML Email Template</label>
                    <Select value={emailTemplate || ""} onValueChange={(val) => setEmailTemplate(val || '')}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product Newsletter">Product Newsletter</SelectItem>
                        <SelectItem value="Spring Special v2">Spring Special v2</SelectItem>
                        <SelectItem value="Holiday Discount Draft">Holiday Discount Draft</SelectItem>
                        <SelectItem value="Customer Winback">Customer Winback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    {renderLeadsSelectDropdown()}
                    {errors.selectedLeads && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.selectedLeads}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Specific Inputs */}
            {type === 'WhatsApp' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    {renderLeadsSelectDropdown()}
                    {errors.selectedLeads && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.selectedLeads}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Approved Template Name</label>
                    <Input placeholder="order_status_update" value={whatsappTemplateName} onChange={(e) => setWhatsappTemplateName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-550 uppercase">Message Body Text *</label>
                  <Textarea
                    placeholder="Hello {{1}}, welcome! Use verification code {{2}} to proceed."
                    value={whatsappMessageBody}
                    onChange={(e) => {
                      setWhatsappMessageBody(e.target.value);
                      validateField('whatsappMessageBody', e.target.value, type);
                    }}
                    className={`min-h-[90px] ${errors.whatsappMessageBody ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                  {errors.whatsappMessageBody && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.whatsappMessageBody}</p>}
                  <p className="text-[9.5px] text-slate-400 leading-snug">
                    Note: Variables {"{{1}}"}, {"{{2}}"} correspond to client name, code, etc.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Media Header Attachment URL (Image/PDF)</label>
                  <Input
                    placeholder="https://pegatto.com/media/newsletter.png"
                    value={whatsappMediaUrl}
                    onChange={(e) => setWhatsappMediaUrl(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* LinkedIn Specific Inputs */}
            {type === 'LinkedIn' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">LinkedIn Ad Account ID</label>
                    <Input placeholder="Retail Pegatto Corporate EMEA" value={linkedinAdAccount} onChange={(e) => setLinkedinAdAccount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Campaign Group Name</label>
                    <Input placeholder="LeadGenSummer2026" value={linkedinCampaignGroup} onChange={(e) => setLinkedinCampaignGroup(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Target Audience Demographics</label>
                  <Input placeholder="Job Title: Logistics Director; Industry: Retail" value={linkedinTargetAudience} onChange={(e) => setLinkedinTargetAudience(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Ad Creative Banner Image URL</label>
                  <Input placeholder="https://pegatto.com/assets/linkedin-banner.jpg" value={linkedinAdCreativeUrl} onChange={(e) => setLinkedinAdCreativeUrl(e.target.value)} />
                </div>
              </div>
            )}

            {/* Instagram Specific Inputs */}
            {type === 'Instagram' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Professional IG Profile</label>
                    <Input placeholder="@pegatto_software" value={instagramAccount} onChange={(e) => setInstagramAccount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Call to Action (CTA)</label>
                    <Select value={instagramCta || ""} onValueChange={(val) => setInstagramCta(val || '')}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Learn More">Learn More</SelectItem>
                        <SelectItem value="Sign Up">Sign Up</SelectItem>
                        <SelectItem value="Shop Now">Shop Now</SelectItem>
                        <SelectItem value="Contact Us">Contact Us</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Placement Format</label>
                    <Select value={instagramPlacement} onValueChange={(val: any) => setInstagramPlacement(val)}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Formats (Stories/Reels/Feed)</SelectItem>
                        <SelectItem value="Stories">Stories Only</SelectItem>
                        <SelectItem value="Reels">Reels Only</SelectItem>
                        <SelectItem value="Feed">Feed Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Target Audience Interests</label>
                    <Input placeholder="Age: 20-50; Interests: Technology" value={instagramAudienceInterests} onChange={(e) => setInstagramAudienceInterests(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Ad Media URL (Image/Video)</label>
                  <Input placeholder="https://pegatto.com/assets/instagram-discount.jpg" value={instagramMediaUrl} onChange={(e) => setInstagramMediaUrl(e.target.value)} />
                </div>
              </div>
            )}

            {/* SMS Specific Inputs */}
            {type === 'SMS' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Sender Shortcode / ID</label>
                    <Input placeholder="pegatto_SMS" value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Target Contacts Segment</label>
                    <Input placeholder="Active Mobile Opt-ins" value={smsTargetList} onChange={(e) => setSmsTargetList(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-550 uppercase">SMS Text Message Body *</label>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${smsBodyLength > 160 ? 'bg-amber-100 text-amber-700' : 'bg-slate-105 text-slate-600'}`}>
                      {smsBodyLength} / 160 chars ({smsSegments} SMS)
                    </span>
                  </div>
                  <Textarea
                    placeholder="Enter SMS alert copy..."
                    value={smsMessageBody}
                    onChange={(e) => {
                      setSmsMessageBody(e.target.value);
                      validateField('smsMessageBody', e.target.value, type);
                    }}
                    className={`min-h-[90px] ${errors.smsMessageBody ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                  {errors.smsMessageBody && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.smsMessageBody}</p>}
                </div>
              </div>
            )}

            {/* Facebook Specific Inputs */}
            {type === 'Facebook' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Facebook Page ID / Name</label>
                    <Input placeholder="pegatto Corporate page" value={facebookPage} onChange={(e) => setFacebookPage(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Campaign Name</label>
                    <Input placeholder="LeadGenSummer2026" value={facebookCampaignName} onChange={(e) => setFacebookCampaignName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Target Audience Demographics</label>
                    <Input placeholder="Job Title: Operations, Sales; Location: US" value={facebookTargetAudience} onChange={(e) => setFacebookTargetAudience(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Call to Action (CTA)</label>
                    <Select value={facebookCta || ""} onValueChange={(val) => setFacebookCta(val || '')}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Learn More">Learn More</SelectItem>
                        <SelectItem value="Sign Up">Sign Up</SelectItem>
                        <SelectItem value="Shop Now">Shop Now</SelectItem>
                        <SelectItem value="Contact Us">Contact Us</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-505 uppercase">Ad Creative Banner Image URL</label>
                  <Input placeholder="https://pegatto.com/assets/facebook-banner.jpg" value={facebookAdCreativeUrl} onChange={(e) => setFacebookAdCreativeUrl(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Mockup Preview (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Live Device Mockup
              </h4>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-955/20 rounded-md border-emerald-150">
                ⚡ Real-time Update
              </Badge>
            </div>

            <div className="p-4 bg-slate-100/50 dark:bg-slate-955/30 rounded-2xl border dark:border-slate-800 flex items-center justify-center min-h-[380px]">
              {renderLiveMockup()}
            </div>

            <div className="text-[10px] text-slate-450 leading-relaxed p-3.5 bg-slate-50/80 dark:bg-slate-955/30 rounded-xl border dark:border-slate-850 flex gap-2">
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                This preview layout simulates the actual device/desktop display format as experienced by your customer list.
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Actions Bar at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-4.5 z-40 md:pl-[260px] transition-all shadow-[0_-4px_18px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1600px] mx-auto flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/marketing/campaigns/${id}`)}
              className="px-5 border-slate-205 dark:border-slate-800 font-bold text-slate-705 dark:text-slate-350 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="px-8 font-bold text-white text-xs rounded-xl h-10 shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
