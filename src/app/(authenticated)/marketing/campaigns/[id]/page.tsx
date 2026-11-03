'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
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
  Pencil,
  MapPin,
  Link as LinkIcon,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCampaignDetails } from '@/service/api/campaign/api';
import { Campaign } from '@/store/useCampaignStore';
import { motion } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';

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

export default function CampaignOverviewPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { canEditCampaign, canViewCampaignOverview, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCampaignOverview) {
      toast.error('You do not have permission to view campaign details.');
      router.push('/marketing/campaigns');
    }
  }, [canViewCampaignOverview, isLoaded, router]);

  const { primaryColor } = useStore();

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
    facebookPage: campaignResponse.Campaign_Json?.facebookPage || 'pegattoto Enterprise',
    facebookCampaignName: campaignResponse.Campaign_Json?.facebookCampaignName || 'Digital Marketing Campaign',
    facebookTargetAudience: campaignResponse.Campaign_Json?.facebookTargetAudience || '',
    facebookAdCreativeUrl: campaignResponse.Campaign_Json?.facebookAdCreativeUrl || campaignResponse.File || '',
    facebookCta: campaignResponse.Campaign_Json?.facebookCta || 'Learn More',

    // LinkedIn specific
    linkedinAdAccount: campaignResponse.Campaign_Json?.linkedinAdAccount || 'pegattoto B2B EMEA',
    linkedinCampaignGroup: campaignResponse.Campaign_Json?.linkedinCampaignGroup || 'SupplyChain2026',
    linkedinTargetAudience: campaignResponse.Campaign_Json?.linkedinTargetAudience || '',
    linkedinAdCreativeUrl: campaignResponse.Campaign_Json?.linkedinAdCreativeUrl || campaignResponse.File || '',

    // Instagram specific
    instagramAccount: campaignResponse.Campaign_Json?.instagramAccount || '@pegattoto_logistics',
    instagramPlacement: campaignResponse.Campaign_Json?.instagramPlacement || 'All',
    instagramAudienceInterests: campaignResponse.Campaign_Json?.instagramAudienceInterests || '',
    instagramMediaUrl: campaignResponse.Campaign_Json?.instagramMediaUrl || campaignResponse.File || '',
    instagramCta: campaignResponse.Campaign_Json?.instagramCta || 'Learn More',

    // SMS specific
    smsSenderId: campaignResponse.Campaign_Json?.sender_id || campaignResponse.Campaign_Json?.smsSenderId || 'pegattoto_SMS',
    smsMessageBody: campaignResponse.Campaign_Json?.sms_template || campaignResponse.Promo_Content || '',
    smsTargetList: campaignResponse.Campaign_Json?.smsTargetList || '',

    // Event specific
    eventVenueType: campaignResponse.Campaign_Json?.eventVenueType || 'Physical',
    eventAddress: campaignResponse.Campaign_Json?.eventAddress || '',
    eventCapacity: campaignResponse.Campaign_Json?.eventCapacity || undefined,
    eventTicketPrice: campaignResponse.Campaign_Json?.eventTicketPrice || undefined,
    eventSpeakers: campaignResponse.Campaign_Json?.eventSpeakers || '',
    eventAgenda: campaignResponse.Campaign_Json?.eventAgenda || '',

    // Webinar specific
    webinarPlatform: campaignResponse.Campaign_Json?.webinarPlatform || 'Zoom',
    webinarJoinUrl: campaignResponse.Campaign_Json?.webinarJoinUrl || '',
    webinarDuration: campaignResponse.Campaign_Json?.webinarDuration || undefined,
    webinarSpeakers: campaignResponse.Campaign_Json?.webinarSpeakers || '',
  } as Campaign : null;

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

  const statusStyles = {
    Planned: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    Paused: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-emerald-850',
    Completed: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  };

  const renderLiveMockup = () => {
    const fallbackImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80";

    switch (campaign.type) {
      case 'Email':
        return (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 text-left w-full">
            <div className="bg-slate-105 dark:bg-slate-850 px-4 py-2 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 select-none">pegattoto-mail-preview.net</span>
              <div className="w-10" />
            </div>
            <div className="p-4 border-b dark:border-slate-800 text-xs space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">From:</span><span className="font-semibold text-slate-700 dark:text-slate-350">{campaign.senderName || 'Marketing Team'} &lt;{campaign.senderEmail || 'newsletter@pegattoto.com'}&gt;</span></div>
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">To:</span><span className="text-slate-650">leads-segment@pegattoto-crm.internal</span></div>
              <div className="flex"><span className="text-slate-400 w-12 shrink-0">Subject:</span><span className="font-bold text-slate-900 dark:text-white">{campaign.emailSubject || 'Welcome to Retail Pegatto!'}</span></div>
            </div>
            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto text-xs leading-relaxed text-slate-650 dark:text-slate-355">
              <div className="border-b pb-3 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Template: {campaign.emailTemplate || 'Product Newsletter'}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Discover the next level of logistics automation</h2>
              <p>Hi there,</p>
              <p>We are excited to share new features in our workspace dashboard. Empower your sales pipelines and campaigns directly through integrated workflow triggers.</p>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-850 text-[11px] italic">
                {campaign.description || 'Campaign details template description block placeholder.'}
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
                    {campaign.facebookPage || 'pegattoto Enterprise'}
                  </h4>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Sponsored • 🌐 B2B Enterprise</span>
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </div>
            <div className="px-4 pt-3 pb-2 text-xs leading-relaxed text-slate-700 dark:text-slate-355">
              <p className="font-semibold text-blue-600 mb-1">Campaign: {campaign.facebookCampaignName || 'Digital Marketing Campaign'}</p>
              <p className="font-bold text-slate-900 dark:text-white mb-2">{campaign.name}</p>
              <p className="text-slate-655">{campaign.description || 'Connect with business prospects through automated workflows and modern CRM pipelines.'}</p>
            </div>
            <div className="border-y dark:border-slate-900 relative bg-slate-50 dark:bg-slate-900 h-[150px] overflow-hidden">
              <img
                src={campaign.facebookAdCreativeUrl || fallbackImage}
                alt="Facebook Ad Creative"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{campaign.facebookPage || 'pegattoto Enterprise'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{campaign.facebookTargetAudience || 'Business Owners'}</span>
              </div>
              <button type="button" className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded text-[10.5px] shadow-xs">
                {campaign.facebookCta || 'Learn More'}
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
                <p className="text-[11px] font-bold leading-tight">pegattoto Broadcast</p>
                <span className="text-[8px] opacity-80 block">online</span>
              </div>
            </div>
            <div className="p-3 space-y-2 min-h-[260px] max-h-[300px] overflow-y-auto flex flex-col justify-end">
              <div className="text-[8px] bg-sky-100 text-sky-850 self-center px-2 py-0.5 rounded shadow-2xs font-semibold uppercase tracking-wider mb-2">
                WhatsApp Template: {campaign.whatsappTemplateName || 'Broadcast'}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 text-[10.5px] max-w-[85%] self-start shadow-3xs leading-relaxed text-slate-850 dark:text-slate-200">
                {campaign.whatsappMediaUrl && (
                  <img
                    src={campaign.whatsappMediaUrl}
                    alt="WhatsApp Media"
                    className="rounded-md mb-2 object-cover max-h-[110px] w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                )}
                <p className="whitespace-pre-wrap">
                  {campaign.whatsappMessageBody || 'WhatsApp template message preview will load here...'}
                </p>
                <div className="text-[8px] text-slate-400 text-right mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="bg-slate-105 dark:bg-slate-950 p-2 border-t flex items-center gap-1.5">
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
          <div className="w-[280px] mx-auto border-8 border-slate-850 dark:border-slate-950 rounded-[36px] overflow-hidden shadow-lg bg-slate-50 dark:bg-slate-900 relative text-left">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-10" />
            <div className="bg-slate-100 dark:bg-slate-950 pt-7 pb-2.5 px-3 border-b text-center">
              <p className="text-[10px] font-bold text-slate-500">Sender ID</p>
              <h4 className="text-xs font-bold text-slate-880 dark:text-white leading-tight mt-0.5">{campaign.smsSenderId || 'pegattoto_SMS'}</h4>
            </div>
            <div className="p-3 space-y-2 min-h-[260px] max-h-[300px] overflow-y-auto flex flex-col justify-end">
              <div className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl px-3 py-2 text-[10px] max-w-[85%] self-start shadow-3xs leading-relaxed whitespace-pre-wrap">
                {campaign.smsMessageBody || 'SMS broadcast body text template preview...'}
              </div>
              <div className="text-[8px] text-slate-400 self-start ml-2">
                iMessage • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-950 p-2 border-t flex items-center">
              <div className="bg-white dark:bg-slate-900 border rounded-full px-3 py-1 flex-1 text-[9px] text-slate-305">
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
                <div className="h-9 w-9 rounded-full bg-slate-100 border flex items-center justify-center text-xs font-extrabold text-blue-800">
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
              <p className="font-semibold text-blue-600 mb-1">Ad Account: {campaign.linkedinAdAccount || 'Default Corporate'}</p>
              <p className="font-bold text-slate-900 dark:text-white mb-2">{campaign.name}</p>
              <p className="text-slate-655">{campaign.description || 'Targeting operations specialists globally with scalable supply chain intelligence.'}</p>
            </div>
            <div className="border-y dark:border-slate-900 relative bg-slate-50 dark:bg-slate-900 h-[150px] overflow-hidden">
              <img
                src={campaign.linkedinAdCreativeUrl || fallbackImage}
                alt="Ad Creative"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">pegattoto Enterprise</span>
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
          <div className="w-[280px] mx-auto border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 text-left shadow-xs">
            <div className="p-3 flex items-center justify-between border-b dark:border-slate-900">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                  <div className="h-full w-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center text-[7px] font-bold">
                    IN
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight">
                    {campaign.instagramAccount || '@pegattoto_logistics'}
                  </h4>
                  <span className="text-[8px] text-slate-400 block">Sponsored</span>
                </div>
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="h-[200px] bg-slate-100 dark:bg-slate-900 overflow-hidden">
              <img
                src={campaign.instagramMediaUrl || fallbackImage}
                alt="Instagram Ad Content"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
            </div>
            <div className="bg-[#3897f0] text-white py-2 px-3 flex justify-between items-center text-[10.5px] font-bold select-none cursor-pointer">
              <span>{campaign.instagramCta || 'Learn More'}</span>
              <span>➔</span>
            </div>
            <div className="p-3 text-[10.5px] leading-relaxed text-slate-850 dark:text-slate-255">
              <p className="font-extrabold">{campaign.instagramAccount || '@pegattoto_logistics'} <span className="font-normal text-slate-655 ml-1">{campaign.description || 'Summer special promotions. Claim your voucher code inside.'}</span></p>
              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Placement: {campaign.instagramPlacement || 'All'}</span>
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

  if (isLoaded && !canViewCampaignOverview) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-12"
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
              <BreadcrumbPage>{campaign.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header section with Actions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/marketing/campaigns')}
            className="h-10 w-10 border dark:border-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`font-semibold text-xs py-0.5 px-2.5 ${statusStyles[campaign.status]}`}>
                {campaign.status}
              </Badge>
              <span className="text-xs font-bold text-slate-400">{campaign.id}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 leading-tight tracking-tight">{campaign.name}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/marketing/campaigns')}
            className="h-10 px-5 border-slate-200 text-xs font-bold rounded-xl"
          >
            Back to Campaigns
          </Button>
          {canEditCampaign && (
            <Button
              onClick={() => router.push(`/marketing/campaigns/${campaign.dbId}/edit`)}
              className="h-10 px-5 text-xs font-bold gap-2 text-white rounded-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <Pencil className="h-4 w-4" /> Edit Campaign
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Allocated Budget</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">₹{campaign.budget.toLocaleString()}</span>
        </div>
        <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Actual Spend</span>
          <span className="text-2xl font-extrabold text-slate-600 dark:text-slate-300 block mt-1">₹{campaign.spend.toLocaleString()}</span>
        </div>
        <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Leads Generated</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-455 block mt-1">{campaign.leadsGenerated}</span>
        </div>
        <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Calculated ROI</span>
          <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 block mt-1">{campaign.roi}%</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Campaign Specs Card (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-2xs space-y-6">
          <div>
            <h3 className="font-extrabold uppercase text-xs text-slate-400 tracking-wider border-b pb-2 dark:border-slate-800">Campaign Specifications</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Channel / Type</label>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.type}</span>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Duration Schedule</label>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mt-1 text-sm">
                  {campaign.startDate} {campaign.endDate ? `to ${campaign.endDate}` : '(No specific end date)'}
                </span>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Description</label>
                <p className="font-medium text-slate-600 dark:text-slate-400 block mt-1 leading-relaxed text-sm bg-slate-50 dark:bg-slate-950 p-3.5 border rounded-xl dark:border-slate-850">
                  {campaign.description || 'No description provided for this marketing campaign.'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-extrabold uppercase text-xs text-slate-400 tracking-wider border-b pb-2 dark:border-slate-800">Channel Setup</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {campaign.type === 'Email' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Subject Line</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.emailSubject || 'Not Specified'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Sender Address</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.senderName} ({campaign.senderEmail})</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">HTML Template</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-350 block mt-1 text-sm">{campaign.emailTemplate || 'Default'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Target Segment</label>
                    <span className="font-semibold text-slate-750 dark:text-slate-350 block mt-1 text-sm">{campaign.targetSegment || 'Not Specified'}</span>
                  </div>
                </>
              )}

              {campaign.type === 'WhatsApp' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">WhatsApp Sender ID</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.whatsappSender}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Approved Template Name</label>
                    <span className="font-mono text-slate-700 dark:text-slate-355 block mt-1 text-sm font-bold">{campaign.whatsappTemplateName}</span>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Message Body</label>
                    <p className="font-mono text-slate-700 dark:text-slate-300 block mt-1 whitespace-pre-wrap bg-slate-50 dark:bg-slate-955 p-3 rounded-xl border dark:border-slate-850">{campaign.whatsappMessageBody}</p>
                  </div>
                  {campaign.whatsappMediaUrl && (
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Attached Media URL</label>
                      <a href={campaign.whatsappMediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mt-1 break-all">{campaign.whatsappMediaUrl}</a>
                    </div>
                  )}
                </>
              )}

              {campaign.type === 'Facebook' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Facebook Page ID / Name</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.facebookPage || 'Not Specified'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Campaign Name</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.facebookCampaignName || 'Not Specified'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Call to Action (CTA)</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.facebookCta || 'Learn More'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Target Audience Demographics</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.facebookTargetAudience || 'Not Specified'}</span>
                  </div>
                  {campaign.facebookAdCreativeUrl && (
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Ad Creative Banner Image URL</label>
                      <a href={campaign.facebookAdCreativeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mt-1 break-all">{campaign.facebookAdCreativeUrl}</a>
                    </div>
                  )}
                </>
              )}

              {campaign.type === 'LinkedIn' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Ad Account</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-350 block mt-1 text-sm">{campaign.linkedinAdAccount}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Campaign Group</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-350 block mt-1 text-sm">{campaign.linkedinCampaignGroup}</span>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Target Audience Criteria</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm bg-slate-50 dark:bg-slate-950 p-3 border rounded-xl dark:border-slate-850">{campaign.linkedinTargetAudience}</span>
                  </div>
                </>
              )}

              {campaign.type === 'Instagram' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">IG Handle</label>
                    <span className="font-semibold text-slate-750 dark:text-slate-350 block mt-1 text-sm">{campaign.instagramAccount}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Placement Format</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.instagramPlacement}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Call to Action (CTA)</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.instagramCta}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Audience Targeting Interests</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-1 text-sm">{campaign.instagramAudienceInterests}</span>
                  </div>
                </>
              )}

              {campaign.type === 'SMS' && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Sender ID</label>
                    <span className="font-mono text-slate-755 dark:text-slate-350 font-bold block mt-1 text-sm">{campaign.smsSenderId}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Target Broadcast List</label>
                    <span className="font-semibold text-slate-700 dark:text-slate-350 block mt-1 text-sm">{campaign.smsTargetList}</span>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">SMS Text Message Body</label>
                    <p className="font-mono text-slate-705 dark:text-slate-300 block mt-1 bg-slate-50 dark:bg-slate-955 p-3 rounded-xl border dark:border-slate-850">{campaign.smsMessageBody}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Preview (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Live Delivery Mockup
              </h4>
            </div>

            <div className="p-4 bg-slate-100/50 dark:bg-slate-955/30 rounded-2xl border dark:border-slate-800 flex items-center justify-center min-h-[380px]">
              {renderLiveMockup()}
            </div>

            <div className="text-[10px] text-slate-450 leading-relaxed p-3.5 bg-slate-50/80 dark:bg-slate-955/30 rounded-xl border dark:border-slate-850 flex gap-2">
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                This is a live mockup representation of how this campaign's target material renders for the end audience.
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
