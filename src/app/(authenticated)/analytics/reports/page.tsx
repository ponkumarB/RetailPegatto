'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import { fetchFromApi } from '@/service/apiClient';
import { ReusableTable } from '@/components/ui/ReusableTable';
import {
  TrendingUp, Sparkles, Users, FolderKanban,
  Download, Printer, AlertCircle, HelpCircle,
  BarChart3,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { fetchDropDownList } from '@/service/api/Resource/api';
import { formatPersonName, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { syncInvoiceToTally, fetchTallyReportInvoices } from '@/api/transactions';

interface ReportColumn {
  key: string;
  label: string;
  format?: (v: any, row?: any) => string;
}

interface ReportConfig {
  id: string;
  label: string;
  category: 'sales' | 'lead-opp' | 'engagement' | 'marketing' | 'retention' | 'general' | 'funnel' | 'project';
  endpoint: string;
  method: 'GET' | 'POST';
  payloadBuilder: (orgId: string, startDate: string, endDate: string, extra?: { owner?: string; stage?: string; leadSource?: string; salesId?: string; projectId?: string }) => any;
  columns: ReportColumn[];
}

const formatRupee = (value: number) => {
  if (!value || value === 0) return '₹ 0';
  if (value >= 10000000) {
    return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹ ${(value / 100000).toFixed(2)} L`;
  }
  return `₹ ${value.toLocaleString('en-IN')}`;
};

const formatDateForApi = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CATEGORIES = [
  { id: 'lead-opp', label: 'Lead and Opportunity Management', icon: Sparkles },
  { id: 'engagement', label: 'Customer Engagement', icon: Users },
  { id: 'marketing', label: 'Marketing Effectiveness', icon: HelpCircle },
  { id: 'retention', label: 'Customer Retention', icon: Users },
  { id: 'general', label: 'General Reports', icon: BarChart3 },
  { id: 'funnel', label: 'Sales Funnel Reports', icon: Sparkles },
  { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
] as const;

const REPORTS: ReportConfig[] = [
  // Sales Performance
  {
    id: 'sales-pipeline-report-perf',
    label: 'Sales Pipeline Report',
    category: 'sales',
    endpoint: '/user/SalesPipelineReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => ({
      fromdate: from,
      todate: to,
      Is_Deleted: false,
      Deal_Owner: extra?.owner || '',
      Deal_Stage: extra?.stage || ''
    }),
    columns: [
      { key: 'Deal_Name', label: 'Deal Name' },
      { key: 'Deal_Stage', label: 'Stage' },
      { key: 'Deal_Probablity', label: 'Probability' },
      { key: 'Amount', label: 'Amount', format: formatRupee },
      { key: 'ExpClosing_Date', label: 'Close Date', format: (v) => v ? v.split('T')[0] : '-' },
      {
        key: 'Account_Id',
        label: 'Company Name',
        format: (val, row) => val?.Lead_Name || val?.CompanyName || row?.Lead_Id?.CompanyName || '-'
      },
      {
        key: 'Contact_Person',
        label: 'Contact Name',
        format: (val, row) => val || (row.Lead_Id ? `${row.Lead_Id.LeadFirstName || ''} ${row.Lead_Id.LeadLastName || ''}`.trim() : null) || '-'
      }
    ]
  },

  // Lead and Opportunity Management
  {
    id: 'lead-conversion',
    label: 'Lead Conversion Report',
    category: 'lead-opp',
    endpoint: '/user/LeadConversionReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Total_Leads', label: 'Total Leads' },
      { key: 'Lead_Score', label: 'Lead Score' },
      { key: 'Opportunity_Conversion_Rate', label: 'Conversion Rate', format: (v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Opportunities_Created', label: 'Opportunities Created' },
      { key: 'Opportunities_Converted', label: 'Opportunities Converted' },
      { key: 'Average_Time_to_Conversion', label: 'Avg Time' }
    ]
  },
  {
    id: 'opp-pipeline',
    label: 'Opportunity Pipeline Report',
    category: 'lead-opp',
    endpoint: '/user/OpportunityPipelineReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => ({
      fromdate: from,
      todate: to,
      Is_Deleted: false,
      DealStage: extra?.stage || '',
      LeadSource: extra?.leadSource || ''
    }),
    columns: [
      { key: 'Opportunity_Name', label: 'Opportunity Name' },
      { key: 'Stage', label: 'Stage' },
      { key: 'Probability', label: 'Probability', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Amount', label: 'Amount', format: formatRupee },
      { key: 'Close_Date', label: 'Close Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Contact_Name', label: 'Contact Name' },
      { key: 'Days_In_Stage', label: 'Days in Stage' }
    ]
  },

  {
    id: 'sales-funnel-report',
    label: 'Sales Funnel Report',
    category: 'lead-opp',
    endpoint: '/user/SalesForcastReportLeadSourceWise/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Stage', label: 'Stage' },
      { key: 'Total_Pipeline_Value', label: 'Total Pipeline Value', format: formatRupee },
      { key: 'Number_of_Opportunities', label: 'Number of Opportunities' },
      { key: 'Average_Opportunity_Value', label: 'Avg Opportunity Value', format: formatRupee },
      { key: 'Probability_Weighted_Value', label: 'Weighted Value', format: formatRupee },
      { key: 'Time_Spent_in_Stage', label: 'Time in Stage', format: (v) => v !== undefined && v !== null ? `${v} days` : '-' },
      { key: 'Sales_Rep_Assigned', label: 'Assigned Sales Reps', format: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
      { key: 'Win_Rate', label: 'Win Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Loss_Rate', label: 'Loss Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' }
    ]
  },
  {
    id: 'lead-source',
    label: 'Lead Source Report',
    category: 'lead-opp',
    endpoint: '/user/LeadSourceReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Total_Leads', label: 'Total Leads' },
      { key: 'Lead_Score', label: 'Lead Score' },
      { key: 'Meeting_Count', label: 'Meeting Count' },
      { key: 'Email_Count', label: 'Email Count' },
      { key: 'Call_Count', label: 'Call Count' },
      { key: 'Average_Deal_Value', label: 'Avg Deal Value', format: formatRupee },
      { key: 'Total_Revenue', label: 'Total Revenue', format: formatRupee },
      { key: 'Opportunity_Conversion_Rate', label: 'Conversion Rate', format: (v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Opportunities_Created', label: 'Opportunities Created' },
      { key: 'Opportunities_Converted', label: 'Opportunities Converted' },
      { key: 'Average_Time_to_Conversion', label: 'Avg Time' }
    ]
  }, {
    id: 'opp-aging',
    label: 'Opportunity Aging Report',
    category: 'lead-opp',
    endpoint: '/user/OpportunityAgingReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => ({
      fromdate: from,
      todate: to,
      Is_Deleted: false,
      Deal_Owner: extra?.owner || ''
    }),
    columns: [
      { key: 'Opportunity_Name', label: 'Opportunity Name' },
      { key: 'Stage', label: 'Stage' },
      { key: 'Age_Days', label: 'Age (Days)' },
      { key: 'Amount', label: 'Amount', format: formatRupee },
      { key: 'Deal_Owner', label: 'Deal Owner' },
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Customer_Name', label: 'Customer Name' }
    ]
  },


  // Customer Engagement
  {
    id: 'email-campaign',
    label: 'Email Campaign performance report',
    category: 'engagement',
    endpoint: '/user/EmailCampaignPerformanceReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Campaign_Name', label: 'Campaign Name' },
      { key: 'Subject', label: 'Subject' },
      { key: 'Sent_Date', label: 'Sent Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Recipients_Count', label: 'Recipients Count' },
      { key: 'Opened', label: 'Opened' },
      { key: 'Clicked', label: 'Clicked' },
      { key: 'Downloaded', label: 'Downloaded' },
      { key: 'Bounced', label: 'Bounced' },
      { key: 'Open_Rate (%)', label: 'Open Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Click_Rate (%)', label: 'Click Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Bounce_Rate (%)', label: 'Bounce Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' }
    ]
  },
  {
    id: 'social-media',
    label: 'Social media engagement report',
    category: 'engagement',
    endpoint: '/user/SocialMediaEngagementReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Promo_Content', label: 'Promo Content' },
      { key: 'SocialMedia_Type', label: 'Social Platform', format: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
      { key: 'Created_Date', label: 'Created Date', format: (v) => v ? v.split(' ')[0] : '-' },
      { key: 'Generated_Id', label: 'Generated ID', format: (v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.entries(v).map(([k, val]) => `${k}: ${val}`).join(', ') : Array.isArray(v) && v.length === 0 ? '-' : String(v || '-') }
    ]
  },


  // Marketing Effectiveness
  {
    id: 'lead-generation',
    label: 'Lead generation report',
    category: 'marketing',
    endpoint: '/user/LeadGenerationReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Total_Leads', label: 'Total Leads' },
      { key: 'Qualified_Leads', label: 'Qualified Leads' },
      { key: 'Lead_Score', label: 'Lead Score' },
      { key: 'Meeting_Count', label: 'Meeting Count' },
      { key: 'Email_Count', label: 'Email Count' },
      { key: 'Call_Count', label: 'Call Count' },
      { key: 'Average_Deal_Value', label: 'Avg Deal Value', format: formatRupee },
      { key: 'Total_Revenue', label: 'Total Revenue', format: formatRupee },
      { key: 'Opportunity_Conversion_Rate', label: 'Conversion Rate', format: (v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Opportunities_Created', label: 'Opportunities Created' },
      { key: 'Opportunities_Converted', label: 'Opportunities Converted' },
      { key: 'Average_Time_to_Conversion', label: 'Avg Time' }
    ]
  },
  {
    id: 'marketing-conversion-rate',
    label: 'Conversion Rate Report',
    category: 'marketing',
    endpoint: '/user/MargetingConversionRateReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Total_Leads', label: 'Total Leads' },
      { key: 'Lead_Score', label: 'Lead Score' },
      { key: 'Meeting_Count', label: 'Meeting Count' },
      { key: 'Email_Count', label: 'Email Count' },
      { key: 'Call_Count', label: 'Call Count' },
      { key: 'Opportunity_Conversion_Rate', label: 'Conversion Rate', format: (v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Opportunities_Created', label: 'Opportunities Created' },
      { key: 'Opportunities_Converted', label: 'Opportunities Converted' },
      { key: 'Average_Time_to_Conversion', label: 'Avg Time' }
    ]
  },

  // Customer Retention
  {
    id: 'customer-churn-retention',
    label: 'Customer Churn Report',
    category: 'retention',
    endpoint: '/user/Customerchurnreport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Created_Date', label: 'Date of Joining', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Account_Manager', label: 'Account Manager' },
      { key: 'Reason', label: 'Reason' }
    ]
  },

  // General Reports
  {
    id: 'daily-sales',
    label: 'Daily sales report',
    category: 'general',
    endpoint: '/user/DailySalesactivityReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => {
      const salesId = extra?.salesId || 'all';
      return {
        fromdate: from,
        todate: to,
        Sales_Id: salesId === 'all' ? 'all' : parseInt(salesId, 10),
        Is_Deleted: false
      };
    },
    columns: [
      { key: 'Date', label: 'Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'No_of_Leads_Generated', label: 'Leads Generated' },
      { key: 'No_of_Sales_Opportunities', label: 'Opportunities' },
      { key: 'No_of_Outbound_Calls', label: 'Outbound Calls' },
      { key: 'No_of_Emails_Sent', label: 'Emails Sent' },
      { key: 'Total_Sales_Amount', label: 'Total Sales Amount', format: formatRupee },
      { key: 'Conversion_Rate (%)', label: 'Conversion Rate (%)', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' }
    ]
  },
  {
    id: 'customer-churn',
    label: 'Customer Churn report',
    category: 'general',
    endpoint: '/user/Customerchurnreport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Created_Date', label: 'Date of Joining', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Account_Manager', label: 'Account Manager' },
      { key: 'Reason', label: 'Reason' }
    ]
  },
  {
    id: 'customer-addition',
    label: 'Customer addition report',
    category: 'general',
    endpoint: '/user/Customeradditionreport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Date_Of_Joining', label: 'Date of Joining', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Turn_Over', label: 'Turnover', format: formatRupee },
      { key: 'Account_Mgr', label: 'Account Manager' }
    ]
  },
  {
    id: 'customer-retention',
    label: 'Customer retention report',
    category: 'general',
    endpoint: '/user/Customerretentionreport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false, Account_Owner: '' }),
    columns: [
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Account_Owner', label: 'Account Owner' },
      { key: 'Date_Of_Joining', label: 'Date of Joining', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Retention_Period', label: 'Retention Period (Days)' },
      { key: 'No_Of_Opportunities', label: 'Opportunities' },
      { key: 'Opportunity_Value', label: 'Opportunity Value', format: formatRupee }
    ]
  },
  {
    id: 'sales-rep-perform-gen',
    label: 'Sales rep perform report',
    category: 'general',
    endpoint: '/user/SalesRepPerformanceReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false, Sales_Person: '' }),
    columns: [
      { key: 'Sales_Rep_Name', label: 'Sales Rep' },
      { key: 'No_Of_Leads', label: 'Leads Count' },
      { key: 'No_Of_Deals', label: 'Deals Count' },
      { key: 'Deal_Size', label: 'Deal Size', format: formatRupee },
      { key: 'Sales', label: 'Sales', format: formatRupee },
      { key: 'Pipeline', label: 'Pipeline', format: formatRupee },
      { key: 'Target', label: 'Target', format: formatRupee },
      { key: 'Achievement_%', label: 'Achievement %', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' }
    ]
  },
  {
    id: 'lead-opp-report-gen',
    label: 'Lead and Opportunity report',
    category: 'general',
    endpoint: '/user/Leadopportunitymgmtreport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ Sales_Person: '', Is_Deleted: false }),
    columns: [
      { key: 'Lead_No', label: 'Lead No' },
      { key: 'Name', label: 'Name' },
      { key: 'Deal_No', label: 'Deal No' },
      { key: 'Deal_Value', label: 'Deal Value', format: formatRupee },
      { key: 'Deal_Stage', label: 'Stage' },
      { key: 'Probability_Percentage', label: 'Probability' }
    ]
  },

  // Sales Funnel
  {
    id: 'sales-funnel',
    label: 'Sales Funnel Report',
    category: 'funnel',
    endpoint: '/user/SalesFunnelReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => ({
      Deal_Owner: extra?.owner || '',
      DealStage: extra?.stage || '',
      fromdate: from,
      todate: to,
      Is_Deleted: false
    }),
    columns: [
      { key: 'Date', label: 'Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Lead_Source', label: 'Lead Source' },
      { key: 'Prospect_Name', label: 'Prospect Name' },
      { key: 'Contact_Info', label: 'Contact Info' },
      { key: 'Deal_Amount', label: 'Deal Amount', format: formatRupee },
      { key: 'Probability', label: 'Probability' },
      { key: 'Notes', label: 'Notes' }
    ]
  },
  {
    id: 'pipeline-dev',
    label: 'Pipeline Development Report',
    category: 'funnel',
    endpoint: '/user/PipelineDevelopmentReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to, extra) => ({
      LeadSource: extra?.leadSource || '',
      DealStage: extra?.stage || '',
      fromdate: from,
      todate: to,
      Is_Deleted: false
    }),
    columns: [
      { key: 'Deal_Name', label: 'Deal Name' },
      { key: 'Deal_Owner', label: 'Deal Owner' },
      { key: 'Deal_Stage', label: 'Deal Stage' },
      { key: 'Exp_Close_Date', label: 'Expected Close Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Deal_Amount', label: 'Deal Amount', format: formatRupee },
      { key: 'Contact_Info', label: 'Contact Info' },
      { key: 'Lead_Source', label: 'Lead Source' }
    ]
  },
  {
    id: 'stage-dist',
    label: 'Stage Distribution CRM Report',
    category: 'funnel',
    endpoint: '/user/StageDistributionCRMReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({ fromdate: from, todate: to, Is_Deleted: false }),
    columns: [
      { key: 'Deal_Stage', label: 'Deal Stage' },
      { key: 'No_Of_Opportunity', label: 'No. of Opportunities' },
      { key: 'Perc_Of_Total_Opp', label: 'Percentage of Total %', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Total_Deal_Amt', label: 'Total Deal Amount', format: formatRupee },
      { key: 'Won_Rate', label: 'Won Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Loss_Rate', label: 'Loss Rate', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' }
    ]
  },
  {
    id: 'tally-sync',
    label: 'Tally Sync Report',
    category: 'general',
    endpoint: '/user/SalesInvoiceAllAdditional/',
    method: 'GET',
    payloadBuilder: (orgId, from, to) => ({ page: 1 }),
    columns: [
      { key: 'Invoice_Id', label: 'Invoice No' },
      { key: 'Invoice_Date', label: 'Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Invoice_Amount', label: 'Taxable Amount', format: formatRupee },
      { key: 'Tax_Amount', label: 'Total Tax', format: formatRupee },
      { key: 'Net_Amount', label: 'Net Amount', format: formatRupee },
      { key: 'Tally_Sync_Status', label: 'Sync Status', format: (v) => v || 'PENDING' }
    ]
  },

  // Project Management
  {
    id: 'project-summary',
    label: 'Project Summary Report',
    category: 'project',
    endpoint: '/user/ProjectSummaryReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to) => ({ start_date: from, end_date: to, page: 1 }),
    columns: [
      { key: 'project_id', label: 'Project ID' },
      { key: 'project_name', label: 'Project Name' },
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'project_owner', label: 'Project Manager', format: (v) => formatPersonName(v) || '-' },
      { key: 'Status', label: 'Status' },
      { key: 'project_estimation_start_date', label: 'Start Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'project_estimation_end_date', label: 'End Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'project_duration', label: 'Duration (Days)' },
      { key: 'Priority', label: 'Priority' }
    ]
  },
  {
    id: 'project-milestone',
    label: 'Project Milestone Report',
    category: 'project',
    endpoint: '/user/ProjectMilestoneReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to, extra) => ({ start_date: from, end_date: to, project_id: extra?.projectId || '', page: 1 }),
    columns: [
      { key: 'Milestone_Id', label: 'Milestone ID' },
      { key: 'Milestone_Name', label: 'Milestone Name' },
      { key: 'Project_Name', label: 'Project Name' },
      { key: 'Estimated_Cost', label: 'Estimated Cost', format: formatRupee },
      { key: 'Milestone_Duration', label: 'Duration (Days)' },
      { key: 'Responsible_Persion', label: 'Responsible Person' },
      { key: 'Start_Date', label: 'Start Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'End_Date', label: 'End Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Status', label: 'Status' },
      { key: 'Complete_Percentage', label: 'Completion %' }
    ]
  },
  {
    id: 'task-progress',
    label: 'Task Progress Report',
    category: 'project',
    endpoint: '/user/TaskProgressReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to, extra) => ({ project_id: extra?.projectId || '', start_date: from, end_date: to, page: 1 }),
    columns: [
      { key: 'Projecttask_Id', label: 'Task ID' },
      { key: 'Task_Name', label: 'Task Name' },
      { key: 'Task_Type', label: 'Task Type' },
      { key: 'Project_Name', label: 'Project Name' },
      { key: 'Estimated_Cost', label: 'Estimated Hours' },
      { key: 'Responsible_Persion', label: 'Responsible Person' },
      { key: 'Start_Date', label: 'Start Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'End_Date', label: 'End Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Status', label: 'Status' },
      { key: 'Complete_Percentage', label: 'Completion %', format: (v) => v !== undefined && v !== null ? `${v}%` : '-' },
      { key: 'Priority', label: 'Priority' }
    ]
  },
  {
    id: 'resource-utilization',
    label: 'Resource Utilization Report',
    category: 'project',
    endpoint: '/user/ResourceUtilizationReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to, extra) => ({ project_id: extra?.projectId || '', start_date: from, end_date: to, page: 1 }),
    columns: [
      { key: 'Resource_Id', label: 'Resource ID' },
      { key: 'Name', label: 'Name' },
      { key: 'Designation', label: 'Designation' },
      { key: 'Cost_Perday', label: 'Cost Per Day', format: formatRupee },
      { key: 'Complete_Percentage', label: 'Utilization %' },
      { key: 'Monday', label: 'Mon', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Tuesday', label: 'Tue', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Wednesday', label: 'Wed', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Thursday', label: 'Thu', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Friday', label: 'Fri', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Saturday', label: 'Sat', format: (v) => v ? 'Yes' : 'No' },
      { key: 'Sunday', label: 'Sun', format: (v) => v ? 'Yes' : 'No' }
    ]
  },
  {
    id: 'timesheet',
    label: 'Timesheet Report',
    category: 'project',
    endpoint: '/user/TimeSheetReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to, extra) => ({ project_id: extra?.projectId || '', start_date: from, end_date: to, page: 1 }),
    columns: [
      { key: 'Timesheet_Id', label: 'Timesheet ID' },
      { key: 'User_Name', label: 'Resource Name' },
      { key: 'Project_Name', label: 'Project Name' },
      { key: 'Deliverable_Name', label: 'Deliverable' },
      { key: 'Task_Name', label: 'Task Name' },
      { key: 'Day', label: 'Day' },
      { key: 'Date', label: 'Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Hours_Spent', label: 'Hours Spent' },
      { key: 'Work_Description', label: 'Work Description' },
      { key: 'Status', label: 'Status' }
    ]
  },
  {
    id: 'budget-cost',
    label: 'Budget and Cost Report',
    category: 'project',
    endpoint: '/user/BudgetandCostReport/',
    method: 'POST',
    payloadBuilder: (orgId, from, to) => ({
      start_date: { start_date: from, end_date: to, page: 1 },
      page: 1
    }),
    columns: [
      { key: 'project_id', label: 'Project ID', format: (_, row) => row?.budget_cost_report?.project_details?.project_id || '-' },
      { key: 'project_name', label: 'Project Name', format: (_, row) => row?.budget_cost_report?.project_details?.project_name || '-' },
      { key: 'Customer_Name', label: 'Customer Name', format: (_, row) => row?.budget_cost_report?.project_details?.Customer_Name || '-' },
      { key: 'planned_cost', label: 'Planned Cost', format: (_, row) => formatRupee(row?.budget_cost_report?.planned_cost) },
      { key: 'actual_cost', label: 'Actual Cost', format: (_, row) => formatRupee(row?.budget_cost_report?.actual_cost) },
      { key: 'labour_cost', label: 'Labour Cost', format: (_, row) => formatRupee(row?.budget_cost_report?.labour_cost) },
      { key: 'variance_amount', label: 'Variance Amount', format: (_, row) => formatRupee(row?.budget_cost_report?.variance_amount) },
      {
        key: 'variance_percentage', label: 'Variance %', format: (_, row) => {
          const v = row?.budget_cost_report?.variance_percentage;
          return v !== undefined && v !== null ? `${v}%` : '-';
        }
      },
      { key: 'profit_margin', label: 'Profit Margin', format: (_, row) => formatRupee(row?.budget_cost_report?.profit_margin) },
      {
        key: 'completion_percentage', label: 'Completion %', format: (_, row) => {
          const v = row?.budget_cost_report?.completion_percentage;
          return v !== undefined && v !== null ? `${v}%` : '-';
        }
      },
      { key: 'status', label: 'Status', format: (_, row) => row?.budget_cost_report?.status || '-' }
    ]
  },
  {
    id: 'project-closure',
    label: 'Project Closure Report',
    category: 'project',
    endpoint: '/user/ProjectClosureReport/',
    method: 'GET',
    payloadBuilder: (orgId, from, to, extra) => ({ project_id: extra?.projectId || '', start_date: from, end_date: to, page: 1 }),
    columns: [
      { key: 'project_id', label: 'Project ID' },
      { key: 'project_name', label: 'Project Name' },
      { key: 'Customer_Name', label: 'Customer Name' },
      { key: 'Project_Iniit_No', label: 'Init No' },
      { key: 'Project_Cost', label: 'Project Cost', format: formatRupee },
      { key: 'project_duration', label: 'Duration (Days)' },
      { key: 'project_owner', label: 'Project Manager', format: (v) => formatPersonName(v) || '-' },
      { key: 'Status', label: 'Status' },
      { key: 'project_estimation_start_date', label: 'Start Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'project_estimation_end_date', label: 'End Date', format: (v) => v ? v.split('T')[0] : '-' },
      { key: 'Completion_Date', label: 'Completion Date', format: (v) => v ? v.split('T')[0] : '-' }
    ]
  }
];

const extractDataArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.Result)) return res.Result;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  if (res.data && Array.isArray(res.data.Result)) return res.data.Result;
  if (typeof res === 'object') {
    for (const key of Object.keys(res)) {
      if (Array.isArray(res[key])) {
        return res[key];
      }
    }
    if (res.Result && typeof res.Result === 'object' && !Array.isArray(res.Result)) {
      return [res.Result];
    }
    return [res];
  }
  return [];
};

function ReportsPage() {
  const searchParams = useSearchParams();
  const reportQuery = searchParams.get('report');

  const [activeCategory, setActiveCategory] = useState<'sales' | 'lead-opp' | 'engagement' | 'marketing' | 'retention' | 'general' | 'funnel' | 'project'>('lead-opp');
  const [selectedReportId, setSelectedReportId] = useState<string>('lead-conversion');
  const [dateRange, setDateRange] = useState('24 Jun 2025 - 24 Jun 2026');
  const [period, setPeriod] = useState('Custom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  // Extra state variables for Deal Owner, Stage & Lead Source dropdowns
  const [dealOwners, setDealOwners] = useState<string[]>([]);
  const [dealStages, setDealStages] = useState<string[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedLeadSource, setSelectedLeadSource] = useState<string>('');

  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedSalesId, setSelectedSalesId] = useState<string>('all');
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [syncingTallyId, setSyncingTallyId] = useState<string | null>(null);

  const handleSyncSingleInvoice = async (invoiceId: string) => {
    if (!invoiceId) return;
    setSyncingTallyId(invoiceId);
    try {
      const res = await syncInvoiceToTally(invoiceId);
      if (res?.success === true || res?.status === 200 || res?.status === 'success') {
        toast.success(res?.message || `Invoice ${invoiceId} synced to Tally successfully!`);
      } else if (res?.error || res?.details || res?.message) {
        toast.error(res?.error || res?.details || res?.message || `Failed to sync invoice ${invoiceId}`);
      } else {
        toast.success(`Invoice ${invoiceId} synced to Tally successfully!`);
      }
      handleFetchReport();
    } catch (err: any) {
      console.error('Tally Sync Error:', err);
      toast.error(err?.data?.error || err?.data?.message || err?.message || 'Tally Sync Server Error');
    } finally {
      setSyncingTallyId(null);
    }
  };

  // Find currently active report config
  const selectedReport = REPORTS.find(r => r.id === selectedReportId) || REPORTS[0];

  // Load category relevant reports
  const categoryReports = REPORTS.filter(r => r.category === activeCategory);

  // Sync state with URL search param
  useEffect(() => {
    if (reportQuery) {
      const rep = REPORTS.find(r => r.id === reportQuery);
      if (rep) {
        setActiveCategory(rep.category);
        setSelectedReportId(rep.id);
      }
    }
  }, [reportQuery]);

  // Sync selected report id when switching categories manually (not via query param)
  useEffect(() => {
    const isCategoryMatched = categoryReports.some(r => r.id === selectedReportId);
    if (!isCategoryMatched && categoryReports.length > 0) {
      setSelectedReportId(categoryReports[0].id);
    }
  }, [activeCategory]);

  // Fetch owners, stages, lead sources, users, and projects lookup lists
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [dealsDropdownRes, stagesRes, sourcesRes, usersRes, projectsRes] = await Promise.all([
          fetchFromApi('/user/DealDropdownList/').catch(err => { console.error('Error fetching deal dropdown list:', err); return []; }),
          fetchDropDownList('Deal Stage').catch(err => { console.error('Error fetching deal stages:', err); return null; }),
          fetchDropDownList('Lead Source').catch(err => { console.error('Error fetching lead sources:', err); return null; }),
          fetchFromApi('/user/UserDropdownAPI/').catch(err => { console.error('Error fetching users dropdown list:', err); return []; }),
          fetchFromApi('/user/Projectlistwithoutpaginaton/').catch(err => { console.error('Error fetching projects list:', err); return []; })
        ]);

        if (Array.isArray(usersRes)) {
          setUsersList(usersRes);
        }

        const realProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []);
        if (Array.isArray(realProjects)) {
          setProjectsList(realProjects);
        }

        // Process deals dropdown list to extract unique Deal Owners
        const dealsList = Array.isArray(dealsDropdownRes) ? dealsDropdownRes : (dealsDropdownRes?.results || dealsDropdownRes?.data || []);
        const mappedOwners = dealsList.map((d: any) => d.Deal_Owner).filter(Boolean);
        const uniqueOwners = Array.from(new Set(mappedOwners)) as string[];
        setDealOwners(uniqueOwners);

        // Process stages into list
        let stagesList: string[] = [];
        if (stagesRes) {
          const list = Array.isArray(stagesRes) ? stagesRes : (stagesRes.results || stagesRes.data || []);
          if (Array.isArray(list) && list.length > 0) {
            const group = list[0];
            if (group) {
              if (Array.isArray(group.Values)) {
                stagesList = group.Values.map((v: any) => typeof v === 'string' ? v : v.value || v.name || '').filter(Boolean);
              } else if (typeof group.Dropdown_Values === 'string') {
                stagesList = group.Dropdown_Values.split(',').map((v: string) => v.trim()).filter(Boolean);
              }
            }
          }
        }

        const fallbackStages = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost', 'Deals Enquiry Stage'];
        const finalStages = stagesList.length > 0 ? stagesList : fallbackStages;
        if (!finalStages.includes('Deals Enquiry Stage')) {
          finalStages.push('Deals Enquiry Stage');
        }
        const uniqueStages = Array.from(new Set(finalStages)) as string[];
        setDealStages(uniqueStages);

        // Process lead sources into list
        let sourcesList: string[] = [];
        if (sourcesRes) {
          const list = Array.isArray(sourcesRes) ? sourcesRes : (sourcesRes.results || sourcesRes.data || []);
          if (Array.isArray(list) && list.length > 0) {
            const group = list[0];
            if (group) {
              if (Array.isArray(group.Values)) {
                sourcesList = group.Values.map((v: any) => typeof v === 'string' ? v : v.value || v.name || '').filter(Boolean);
              } else if (typeof group.Dropdown_Values === 'string') {
                sourcesList = group.Dropdown_Values.split(',').map((v: string) => v.trim()).filter(Boolean);
              }
            }
          }
        }
        const fallbackSources = ['Website', 'Referral', 'Google Ads', 'Cold Email', 'Organic', 'Facebook', 'Email Marketing', 'News Paper'];
        const finalSources = sourcesList.length > 0 ? sourcesList : fallbackSources;
        const uniqueSources = Array.from(new Set(finalSources)) as string[];
        setLeadSources(uniqueSources);

        // Set default values
        if (uniqueOwners.length > 0) {
          const defaultOwner = uniqueOwners.find(o => o.toLowerCase().includes('palaniappan')) ||
            uniqueOwners.find(o => o.toLowerCase().includes('tamil')) ||
            uniqueOwners[0];
          setSelectedOwner(defaultOwner);
        } else {
          setSelectedOwner('Palaniappan');
        }

        const defaultStage = uniqueStages.find(s => s.toLowerCase().includes('enquiry')) ||
          uniqueStages[0] ||
          'Deals Enquiry Stage';
        setSelectedStage(defaultStage);
        setSelectedLeadSource(''); // default to empty string as requested

      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    }

    loadFilterOptions();
  }, []);

  const handleFetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedReportId === 'tally-sync') {
        const tallyInvoices = await fetchTallyReportInvoices();
        setReportData(tallyInvoices);
        setLoading(false);
        return;
      }

      const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || '1') : '1';
      const dates = dateRange.split(' - ');
      const start = formatDateForApi(dates[0]) || '2025-01-01';
      const end = formatDateForApi(dates[1] || dates[0]) || '2026-06-30';

      const payload = selectedReport.payloadBuilder(orgId, start, end, {
        owner: selectedOwner,
        stage: selectedStage,
        leadSource: selectedLeadSource,
        salesId: selectedSalesId,
        projectId: selectedProjectId
      });
      let res: any;

      if (selectedReport.method === 'POST') {
        res = await fetchFromApi(selectedReport.endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            queryParams.append(k, String(v));
          }
        });
        res = await fetchFromApi(`${selectedReport.endpoint}?${queryParams.toString()}`);
      }

      setReportData(extractDataArray(res));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching the report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchReport();
  }, [selectedReportId, dateRange, selectedOwner, selectedStage, selectedLeadSource, selectedSalesId, selectedProjectId]);

  const handleExportToExcel = () => {
    // @ts-ignore
    import('xlsx').then((XLSX: any) => {
      const table = document.getElementById('report-data-table');
      if (!table) return;
      const wb = XLSX.utils.table_to_book(table, { sheet: 'Report' });
      XLSX.writeFile(wb, `${selectedReport.label}_Report.xlsx`);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReportStatusBadge = (status: any, isSyncing: boolean = false, errorMsg?: string) => {
    if (isSyncing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
          <span>SYNCING...</span>
        </span>
      );
    }

    const str = String(status || '').trim();
    const lower = str.toLowerCase();

    // Success / Synced / Active / Paid / Won / Completed / Approved
    if (lower === 'success' || lower === 'synced' || lower === 'active' || lower === 'paid' || lower === 'won' || lower === 'completed' || lower === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
          <span>{str ? str.toUpperCase() : 'SYNCED'}</span>
        </span>
      );
    }

    // Failed / Error / Inactive / Unpaid / Lost / Rejected / Delayed
    if (lower === 'failed' || lower === 'error' || lower === 'inactive' || lower === 'unpaid' || lower === 'closed lost' || lower === 'lost' || lower === 'rejected' || lower === 'delayed') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs"
          title={errorMsg || 'Failed'}
        >
          <XCircle className="w-3.5 h-3.5 fill-rose-500 text-white shrink-0" />
          <span>{str ? str.toUpperCase() : 'FAILED'}</span>
        </span>
      );
    }

    // Pending / Draft / In Progress / Open / Due
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
        <AlertCircle className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0 animate-pulse" />
        <span>{str ? str.toUpperCase() : 'PENDING'}</span>
      </span>
    );
  };

  const tableColumns = useMemo(() => {
    const cols: any[] = selectedReport.columns.map((col) => ({
      key: col.key,
      header: col.label,
      sortable: true,
      render: (row: any) => {
        // Render rich, distinct badge for status columns
        if (
          col.key === 'Tally_Sync_Status' ||
          col.key === 'Status' ||
          col.key === 'status' ||
          col.key.toLowerCase().endsWith('_status') ||
          col.key.toLowerCase().includes('status')
        ) {
          const val = row[col.key] || (col.key === 'Tally_Sync_Status' ? 'PENDING' : '');
          const isSyncing = syncingTallyId === row.Invoice_Id;
          const errorMsg = row.Tally_Sync_Error;
          return renderReportStatusBadge(val, isSyncing, errorMsg);
        }

        const val = row[col.key];
        return col.format ? col.format(val, row) : val !== undefined && val !== null ? String(val) : '-';
      }
    }));

    if (selectedReportId === 'tally-sync') {
      cols.push({
        key: 'actions',
        header: 'Actions',
        sortable: false,
        render: (row: any) => {
          const isSynced = row.Tally_Sync_Status === 'SUCCESS';
          const isSyncing = syncingTallyId === row.Invoice_Id;
          return (
            <button
              type="button"
              onClick={() => handleSyncSingleInvoice(row.Invoice_Id)}
              disabled={isSyncing}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer",
                isSynced
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  : "bg-[#2e7d32] hover:bg-[#256628] text-white",
                isSyncing && "opacity-70 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? 'Syncing...' : isSynced ? 'Re-sync' : 'Sync To Tally'}</span>
            </button>
          );
        }
      });
    }

    return cols;
  }, [selectedReport, selectedReportId, syncingTallyId]);

  // Border radius style helper representing exactly 5px corners
  const edges5PctStyle = { borderRadius: '5px' };

  return (
    <div className="space-y-2.5 text-left relative">
      {/* Dynamic Printing Style overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 no-print">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-2">
            Report Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Access, view, export, and print operational reports for sales, funnel, customer success, and projects.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print"
        style={edges5PctStyle}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Date Range</span>
            <PeriodFilter
              value={dateRange}
              period={period}
              onChange={(newRange, newPeriod) => {
                setDateRange(newRange);
                setPeriod(newPeriod);
              }}
              style={edges5PctStyle}
            />
          </div>

          {(selectedReportId === 'sales-pipeline-report-perf' || selectedReportId === 'sales-funnel') && (
            <>
              <div className="flex items-center gap-1.5 min-w-[170px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Owner</span>
                <div className="relative flex-1">
                  <select
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    style={edges5PctStyle}
                    className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                  >
                    {dealOwners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 min-w-[170px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Stage</span>
                <div className="relative flex-1">
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    style={edges5PctStyle}
                    className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                  >
                    {dealStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {(selectedReportId === 'opp-pipeline' || selectedReportId === 'pipeline-dev') && (
            <>
              <div className="flex items-center gap-1.5 min-w-[170px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Stage</span>
                <div className="relative flex-1">
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    style={edges5PctStyle}
                    className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                  >
                    {dealStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 min-w-[170px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Source</span>
                <div className="relative flex-1">
                  <select
                    value={selectedLeadSource}
                    onChange={(e) => setSelectedLeadSource(e.target.value)}
                    style={edges5PctStyle}
                    className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                  >
                    <option value="">All Lead Sources</option>
                    {leadSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {selectedReportId === 'opp-aging' && (
            <div className="flex items-center gap-1.5 min-w-[170px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Owner</span>
              <div className="relative flex-1">
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  style={edges5PctStyle}
                  className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                >
                  <option value="">All Owners</option>
                  {dealOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {selectedReportId === 'daily-sales' && (
            <div className="flex items-center gap-1.5 min-w-[180px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Rep</span>
              <div className="relative flex-1">
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  style={edges5PctStyle}
                  className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                >
                  <option value="all">All Sales Reps</option>
                  {usersList.map((u) => {
                    const name = u.username || u.Name || `User ${u.id}`;
                    return (
                      <option key={u.id} value={String(u.id)}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {selectedReport.category === 'project' && selectedReportId !== 'project-summary' && (
            <div className="flex items-center gap-1.5 min-w-[180px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Project</span>
              <div className="relative flex-1">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={edges5PctStyle}
                  className="w-full h-8 pl-2.5 pr-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer transition-all"
                >
                  <option value="">All Projects</option>
                  {projectsList.map((proj) => {
                    const name = proj.project_name || proj.project_id || `Project ${proj.id}`;
                    return (
                      <option key={proj.id} value={String(proj.id)}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleFetchReport}
          style={edges5PctStyle}
          className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {selectedReportId === 'tally-sync' && (
        <div className="px-3.5 py-2 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Tally GST Reports & Direct ERP Sync Dashboard
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                View summary KPI metrics and batch voucher sync
              </span>
            </div>
          </div>
          <a
            href="/reports/TallySyncReport"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2e7d32] hover:bg-[#256628] text-white text-[11px] font-semibold rounded shadow-xs shrink-0 transition-all self-start sm:self-auto"
          >
            <span>Open Dedicated Tally Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Main Report Table Area */}
      <div
        id="print-section"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
        style={edges5PctStyle}
      >
        <div>
          {/* Table Header Controls */}
          <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                {selectedReport.label}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">• {dateRange}</span>
            </div>

            <div className="flex items-center gap-1.5 no-print">
              <button
                onClick={handleExportToExcel}
                style={edges5PctStyle}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Excel</span>
              </button>
              <button
                onClick={handlePrint}
                style={edges5PctStyle}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="h-3 w-3 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Table body */}
          {loading ? (
            <div className="h-[30vh] w-full flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Compiling report data...</p>
            </div>
          ) : error ? (
            <div className="h-[30vh] w-full flex flex-col items-center justify-center gap-2 text-rose-500">
              <AlertCircle className="h-6 w-6" />
              <p className="text-xs font-bold">Failed to load report: {error}</p>
              <button
                onClick={handleFetchReport}
                style={edges5PctStyle}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold mt-1 shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div id="report-data-table" className="overflow-x-auto min-w-0 w-full">
              <ReusableTable
                columns={tableColumns}
                data={reportData}
                loading={loading}
                showGear={false}
                borderless={true}
                initialPageSize={10}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
          <span>Report compiled dynamically from live CRM transaction tables.</span>
          <span>Pegatto CRM</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportsRootPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading Report Center...</p>
      </div>
    }>
      <ReportsPage />
    </Suspense>
  );
}
