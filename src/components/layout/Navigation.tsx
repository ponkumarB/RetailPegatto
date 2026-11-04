'use client';

import React, { useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { NavLink } from './NavLink';
import {
  ChevronDown, LayoutDashboard, Megaphone, Activity,
  Calendar, Settings, Ticket, Users, FileText, TrendingUp, CheckSquare, CheckCircle2, Building2, Sparkles, FolderKanban, HeartHandshake, MessageSquare, FileEdit, GitBranch, LayoutGrid, LayoutTemplate, Tag, ShieldCheck, Cpu, Phone, Bug, AlertCircle, Target, ListTodo, Bell, Clock, Linkedin, Facebook, Instagram, Bot, Zap, Gauge, History, Monitor,
  Plus, CreditCard, Receipt, Coins, Award,
  Mail,
  MapIcon,
  Video,
  LineChart, FileBarChart2, Puzzle, Calculator, Handshake,
  // Dashboard specific icons
  Crown, // CEO
  Briefcase, // Delivery
  ClipboardCheck, // PM
  GitBranch as GitBranchIcon, // Project Lead
  TestTube, // Test Lead
  Code2, // Developer
  Database,
  Store as StoreIcon,
  Package,
  UsersRound,
  ArrowDownToLine,
  Boxes,
  SlidersHorizontal,
  Tags,
  Truck,
  RefreshCw,
  Brain
} from 'lucide-react';


import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoleListWithoutPagination, getRoleDetails, fetchFormPermissionById } from '@/service/api/role/api';
import { ENABLE_ALL_PERMISSIONS_TESTING, usePermission } from '@/hooks/usePermission';



interface SubMenuItem {
  label: string;
  path: string;
  badge?: boolean;
  permissionCode?: string | null;
  subItems?: { label: string; path: string; badge?: boolean; permissionCode?: string | null }[];
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  subItems?: SubMenuItem[];
  permissionCode?: string | null;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// All dashboard definitions with different icons
export const ALL_DASHBOARDS = [
  { label: 'Admin Dashboard', path: '/role-dashboard/admin', permissionCode: 'RoleDashboard.Admin', icon: Gauge },
  { label: 'CEO Dashboard', path: '/role-dashboard/ceo', permissionCode: 'RoleDashboard.CEO', icon: Crown }
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Admin': [
    'RoleDashboard.Admin',
    'RoleDashboard.CEO',
    'RoleDashboard.pm',
    'Analytics.Project',
    'Analytics.Sales',
    'Analytics.Trend',
    'Analytics.Pipeline',
    'Analytics.Performance',
    'Contacts.View',
    'ScrumMeetings.View',
    'Marketing.LeadGen',
    'Marketing.Leads',
    'Marketing.Track',
    'Deal.View',
    'Deal.Source',
    'Tickets.View',
    'Projects.All',
    'Projects.Track',
    'Projects.Predict',
    'Projects.Allocation',
    'Projects.TestCase',
    'Projects.TestPlan',
    'Projects.Milestones',
    'Projects.MilestoneTracker',
    'Projects.Sprint',
    'Projects.ProjectTaskAllocation',
    'Projects.Gantt',
    'Resource.List',
    'Resource.Utilisation',
    'Resource.Tracking',
    'CustomerSuccess.Retention',
    'CustomerSuccess.Setup',
    'CustomerSuccess.Onboarding',
    'Feedback.View',
    'Administration.LeadScore',
    'Administration.WorkflowRules',
    'Documentations.BRD',
    'Documentations.FRD',
    'Documentations.SRS',
    'Assets.List',
    'Assets.Allocation',
    'Assets.Maintenance',
    'Assets.Request',
    'Tasks.My',
    'Tasks.All',
    'Tasks.Overdue',
    'Tasks.Calendar',
    'Companies.View',
    'Invoice.List',
    'Invoice.Pending',
    'InvoiceBilling.LoyaltyWallet',
    'InvoiceBilling.LoyaltyTransaction',
    'InvoiceBilling.LoyaltyRule',
    'InvoiceBilling.POSInvoice',
    'Settings.DealFactor',
    'Settings.DealPrediction',
    'Settings.DealPredictionSetup',
    'Settings.DealProbability',
    'Settings.DealWeightage',
    'Settings.Privileges',
    'Defect.View',
  ],
  'CEO': [
    'RoleDashboard.CEO',
    'Analytics.Project',
    'Analytics.Sales',
    'Analytics.Trend',
    'Analytics.Pipeline',
    'Analytics.Performance',
    'Contacts.View',
    'ScrumMeetings.View',
    'Marketing.LeadGen',
    'Marketing.Leads',
    'Marketing.Track',
    'Deal.View',
    'Deal.Source',
    'Tickets.View',
    'Projects.All',
    'Projects.Track',
    'Projects.Predict',
    'Projects.Allocation',
    'Projects.TestCase',
    'Projects.TestPlan',
    'Projects.Milestones',
    'Projects.MilestoneTracker',
    'Projects.Sprint',
    'Projects.ProjectTaskAllocation',
    'Projects.Gantt',
    'Resource.List',
    'Resource.Utilisation',
    'Resource.Tracking',
    'CustomerSuccess.Retention',
    'CustomerSuccess.Setup',
    'CustomerSuccess.Onboarding',
    'Feedback.View',
    'Administration.LeadScore',
    'Administration.WorkflowRules',
    'Documentations.BRD',
    'Documentations.FRD',
    'Documentations.SRS',
    'Assets.List',
    'Assets.Allocation',
    'Assets.Maintenance',
    'Assets.Request',
    'Tasks.My',
    'Tasks.All',
    'Tasks.Overdue',
    'Tasks.Calendar',
    'Companies.View',
    'Invoice.List',
    'Invoice.Pending',
    'InvoiceBilling.LoyaltyWallet',
    'InvoiceBilling.LoyaltyTransaction',
    'InvoiceBilling.LoyaltyRule',
    'InvoiceBilling.POSInvoice',
    'Settings.DealFactor',
    'Settings.DealPrediction',
    'Settings.DealPredictionSetup',
    'Settings.DealProbability',
    'Settings.DealWeightage',
    'Settings.Privileges',
    'Defect.View',
  ]
};

// Keep the mapping for reference
export const ROLE_DASHBOARD_MAPPING: Record<string, { label: string; path: string; permissionCode: string }> = {
  'Admin': { label: 'Admin Dashboard', path: '/role-dashboard/admin', permissionCode: 'crm_admin_dashboard' },
  'CEO': { label: 'CEO Dashboard', path: '/role-dashboard/ceo', permissionCode: 'ceo_dashboard' }
};

export const menuGroups: MenuGroup[] = [
  {
    title: 'Dashboards',
    items: [
      {
        icon: Gauge,
        label: 'Dashboard',
        path: '/dashboard',
        permissionCode: null
      }
    ]
  },
  {
    title: 'Sales & CRM',
    items: [
      {
        icon: Target,
        label: 'Leads',
        path: '/marketing/leads',
        permissionCode: 'Marketing.Leads'
      },
      {
        icon: Building2,
        label: 'Company',
        path: '/companies',
        permissionCode: 'Companies.View'
      },
      {
        icon: Users,
        label: 'Contacts',
        path: '/contacts',
        permissionCode: 'Contacts.View'
      },
      {
        icon: Handshake,
        label: 'Deal Management',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Deals List', path: '/Deal', permissionCode: 'Deal.View' },
          { label: 'Deal Pipeline', path: '/deals-pipeline', permissionCode: 'Deal.View' }
        ]
      },

    ]
  },
  {
    title: 'Marketing',
    items: [
      {
        icon: Megaphone,
        label: 'Campaigns',
        path: '#',
        permissionCode: 'campaigns',
        subItems: [
          {
            label: 'Email & WhatsApp Campaigns',
            path: '/marketing/campaigns?category=direct',
            permissionCode: 'campaigns'
          },
          {
            label: 'Social Media Campaigns',
            path: '/marketing/campaigns?category=social',
            permissionCode: 'campaigns'
          }
        ]
      },
      {
        icon: Phone,
        label: 'Call Management',
        path: '/call-management',
        subItems: [
          { label: 'Call Lists', path: '/call-management/call-lists', permissionCode: 'marketing.call_management.call_lists' },
          { label: 'Call Assignment', path: '/call-management/call-assignment', permissionCode: 'marketing.call_management.call_assignment' },
          { label: "Today's Call List", path: '/call-management/todays-calls', permissionCode: 'call_management.today_s_call_list' },
          { label: 'Call Summary', path: '/call-management/call-summary', permissionCode: 'marketing.call_management.call_summary' },
          { label: 'Employee Call Performance', path: '/call-management/employee-call-performance', permissionCode: 'call_management.employee_call_performance' }
        ]
      }

    ]
  },
  {
    title: 'Invoice and Billings',
    items: [
      {
        icon: Award,
        label: 'Loyalty',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Loyalty Wallet', path: '/loyalty/wallet', permissionCode: 'InvoiceBilling.LoyaltyWallet' },
          { label: 'Loyalty Transaction', path: '/loyalty/transactions', permissionCode: 'InvoiceBilling.LoyaltyTransaction' },
          { label: 'Loyalty Rule', path: '/loyalty/rules', permissionCode: 'InvoiceBilling.LoyaltyRule' }
        ]
      },
      {
        icon: Receipt,
        label: 'POS Invoice',
        path: '/pos-invoices',
        permissionCode: 'InvoiceBilling.POSInvoice'
      }
    ]
  },
  {
    title: 'Order Management',
    items: [
      { icon: MessageSquare, label: 'Customer Enquiry', path: '/sales/customer-enquiry', permissionCode: 'OrderManagement.CustomerEnquiry' },
      { icon: FileEdit, label: 'Quotation', path: '/sales/quotation', permissionCode: 'OrderManagement.Quotation' },
      { icon: Tag, label: 'Sales Order', path: '/sales/sales-order', permissionCode: 'OrderManagement.SalesOrder' },
      { icon: Clock, label: 'Schedule', path: '/sales/schedule', permissionCode: 'OrderManagement.Schedule' },
      { icon: Truck, label: 'Shipment', path: '/sales/shipment', permissionCode: 'OrderManagement.Shipment' },
      { icon: Calendar, label: 'Shipment Calendar', path: '/sales/shipment-calendar', permissionCode: 'OrderManagement.ShipmentCalender' },
      { icon: CheckCircle2, label: 'Delivery Confirmation', path: '/sales/delivery-confirmation', permissionCode: 'OrderManagement.DeliveryConfirmation' },
      { icon: FileText, label: 'Invoice', path: '/invoice', permissionCode: 'OrderManagement.Invoice' },
      { icon: CreditCard, label: 'Payments', path: '/payment', permissionCode: 'OrderManagement.Payments' }
    ]
  },
  {
    title: 'Store',
    items: [
      {
        icon: Package,
        label: 'Product Management',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Product Category', path: '/sales-productCategory', permissionCode: 'StoreManagement.ProductCategory' },
          { label: 'Product Group', path: '/sales-productGroup', permissionCode: 'StoreManagement.ProductGroup' },
          { label: 'Product Item', path: '/sales-productItem', permissionCode: 'StoreManagement.ProductItem' },
          { label: 'Supplier', path: '/sale-supplier-list', permissionCode: 'StoreManagement.Supplier' },
        ]
      },
      {
        icon: StoreIcon,
        label: 'Store Management',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Store', path: '/sales-createStore', permissionCode: 'StoreManagement.CreateStore' },
          { label: 'Counter', path: '/counter-management', permissionCode: 'StoreManagement.CounterManagement' },
          { label: 'Store Employees', path: '/store-employee/assign', permissionCode: 'StoreManagement.StoreEmployees' },
          { label: 'Product Inward', path: '/sales-product-inward', permissionCode: 'StoreManagement.ProductInward' },
          { label: 'Product & Store Stocks', path: '/product-tracking', permissionCode: 'StoreManagement.ProductTracking' },
          { label: 'Store Adjustment', path: '/Store-Adjustment', permissionCode: 'StoreManagement.StoreAdjustment' },
          {
            label: 'Sales Organization',
            path: '#',
            permissionCode: null,
            subItems: [
              { label: 'Territory Hierarchy', path: '/sales/territory-hierarchy', permissionCode: 'sales.territory_management.territory_hierarchy.overview' },
              { label: 'Territory', path: '/sales/territory', permissionCode: 'sales.territory_management.territories.overview' },
              { label: 'Sales target', path: '/sales/target', permissionCode: 'sales.sales_target.overview' },
              { label: 'Sales Owner target', path: '/sales/territory-assignment', permissionCode: 'sales.territory_management.territory_assignment.overview' }
            ]
          }
        ]
      },
      {
        icon: RefreshCw,
        label: 'Returns & Refunds',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Return Management', path: '/returns-management', permissionCode: 'StoreManagement.ReturnsRefunds' },
          { label: 'Replacement Management', path: '/replacement-management', permissionCode: 'StoreManagement.ReturnsRefunds' },
          { label: 'Refund Management', path: '/refund-management', permissionCode: 'StoreManagement.ReturnsRefunds' },
          { label: 'Refund Policy', path: '/refund-policy', permissionCode: 'StoreManagement.ReturnsRefunds' }
        ]
      },
      {
        icon: Tag,
        label: 'Offers Management',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'Offers', path: '/offers-management', permissionCode: 'PriceManagement.Offers' },
          { label: 'Product Price', path: '/sales-Manage-price', permissionCode: 'PriceManagement.ProductPrice' },
          { label: 'Discount', path: '/sales-discount', permissionCode: 'PriceManagement.Discount' },
          { label: 'Coupons', path: '/coupons', permissionCode: 'InvoiceBilling.Coupons' },
        ]
      }
    ]
  },
  {
    title: 'Reports & Analytics',
    items: [
      {
        icon: FileBarChart2,
        label: "Reports",
        path: '#',
        permissionCode: null,
        subItems: [
          {
            label: "Lead and Opportunity Management",
            path: '#',
            subItems: [
              { label: "Lead Conversion Report", path: "/analytics/reports?report=lead-conversion", permissionCode: "reports.lead_and_opportunity_management.lead_conversion_report.overview" },
              { label: "Opportunity Pipeline Report", path: "/analytics/reports?report=opp-pipeline", permissionCode: "reports.lead_and_opportunity_management.opportunity_pipeline_report.overview" },
              { label: "Sales Funnel Report", path: "/analytics/reports?report=sales-funnel-report", permissionCode: "reports.lead_and_opportunity_management.sales_funnel_report.overview" },
              { label: "Lead Source Report", path: "/analytics/reports?report=lead-source", permissionCode: "reports.lead_and_opportunity_management.lead_source_reports.overview" },
              { label: "Opportunity Aging Report", path: "/analytics/reports?report=opp-aging", permissionCode: "reports.lead_and_opportunity_management.opportunity_aging_report.overview" }
            ]
          },
          {
            label: "Customer Engagement",
            path: '#',
            subItems: [
              { label: "Email Campaign performance report", path: "/analytics/reports?report=email-campaign", permissionCode: "reports.customer_engagement.email_campaign_performance_report.overview" },
              { label: "Social media engagement report", path: "/analytics/reports?report=social-media", permissionCode: "reports.customer_engagement.social_media_engagement_report.overview" }
            ]
          },
          {
            label: "Marketing Effectiveness",
            path: '#',
            subItems: [
              { label: "Lead generation report", path: "/analytics/reports?report=lead-generation", permissionCode: "reports.marketing_effectiveness.lead_generation_report.overview" },
              { label: "Conversion Rate Report", path: "/analytics/reports?report=marketing-conversion-rate", permissionCode: "reports.marketing_effectiveness.conversion_rate_reports.overview" }
            ]
          },
          {
            label: "Customer Retention",
            path: '#',
            subItems: [
              { label: "Customer Churn Report", path: "/analytics/reports?report=customer-churn-retention", permissionCode: "reports.customer_retention.customer_churn_report.overview" }
            ]
          },
          {
            label: "General Reports",
            path: '#',
            subItems: [
              { label: "Daily sales report", path: "/analytics/reports?report=daily-sales", permissionCode: "reports.general_reports.daily_sales_report.overview" },
              { label: "Customer Churn report", path: "/analytics/reports?report=customer-churn", permissionCode: "reports.general_reports.customer_churn_report.overview" },
              { label: "Customer addition report", path: "/analytics/reports?report=customer-addition", permissionCode: "reports.general_reports.customer_addition_report.overview" },
              { label: "Customer retention report", path: "/analytics/reports?report=customer-retention", permissionCode: "reports.general_reports.customer_retention_report.overview" },
              { label: "Sales rep perform report", path: "/analytics/reports?report=sales-rep-perform-gen", permissionCode: "reports.general_reports.sales_rep_perform_report.overview" },
              { label: "Lead and Opportunity report", path: "/analytics/reports?report=lead-opp-report-gen", permissionCode: "reports.general_reports.lead_and_opportunity_report.overview" }
            ]
          },
          {
            label: "Sales Funnel Reports",
            path: '#',
            subItems: [
              { label: "Sales Funnel Report", path: "/analytics/reports?report=sales-funnel", permissionCode: "reports.sales_funnel_report.sales_funnel_report.overview" },
              { label: "Pipeline Development Report", path: "/analytics/reports?report=pipeline-dev", permissionCode: "reports.sales_funnel_report.pipeline_development_reports.overview" },
              { label: "Stage Distribution CRM Report", path: "/analytics/reports?report=stage-dist", permissionCode: "reports.sales_funnel_report.stage_distribution_crm_reports.overview" }
            ]
          },
          {
            label: "Tally Sync Report",
            path: "/reports/TallySyncReport",
            permissionCode: "reports.tally_sync_report.overview",
            subItems: [
              { label: "Overview", path: "/analytics/reports?report=tally-sync", permissionCode: "reports.tally_sync_report.overview" },
              { label: "Sync Dashboard", path: "/reports/TallySyncReport", permissionCode: "reports.tally_sync_report.overview" }
            ]
          }
        ]
      },
      {
        icon: LineChart,
        label: 'Analytics',
        path: '/analytics',
        permissionCode: null,
        subItems: [
          { label: 'Sales by Customer', path: '/analytics/sales-by-customer', permissionCode: 'analytics.sales_by_customer.overview' },
          { label: 'Sales Performance', path: '/analytics/sales-performance', permissionCode: 'analytics.sales_performance.overview' },
          { label: 'Activity Overview', path: '/analytics/activity-overview', permissionCode: 'analytics.activity_overview.overview' },
          { label: 'Sales KPI Dashboard', path: '/analytics/sales-kpi-dashboard', permissionCode: 'analytics.sales_kpi_dashboard.overview' },
          { label: 'Lead Sources', path: '/analytics/lead-sources', permissionCode: 'analytics.lead_sources.overview' },
          { label: 'Monthly Retail Sales', path: '/analytics/monthly-retail-sales', permissionCode: 'analytics.monthly_retail_sales.overview' },
          { label: 'Social Media Analytics', path: '/analytics/socialmedia-report', permissionCode: 'analytic.social_media_analytics.overview' },
          { label: 'Project Analytics', path: '/analytics/project-analytics', permissionCode: 'analytics.project_analytics.overview' },
          { label: 'Sales Analytics', path: '/analytics/sales-analytics', permissionCode: 'analytics.sales_analytics.overview' },
          { label: 'Trend & Forecast', path: '/analytics/sales-trend', permissionCode: 'analytics.trend_forecast.overview' },
          { label: 'Pipeline Analytics', path: '/analytics/pipeline-analytics', permissionCode: 'analytics.pipeline_analytics.overview' },
          { label: 'Predictive Project Risk', path: '/analytics/predictive-project-risk', permissionCode: 'analytics.predictive_project_risk.overview' },
          { label: 'Smart Resource Optimization', path: '/analytics/smart-resource-optimization', permissionCode: 'analytics.smart_resource_optimization.overview' },
          { label: 'Budget & Cost Analytics', path: '/analytics/budget-cost-analytics', permissionCode: 'analytics.budget_cost_analytics.overview' },
          {
            label: 'Opportunity Aging Analysis',
            path: '/opportunity-aging-analysis',
            permissionCode: 'analytics.opportunity_aging_analysis.overview'
          },
          {
            label: 'Lead Conversion Tracking',
            path: '/lead-conversatation-tracking',
            permissionCode: 'analytics.lead_conversion_tracking.overview'
          },
          {
            label: 'Revenue Forecast',
            path: '/revenue-forecast',
            permissionCode: 'analytics.revenue_forecast.overview'
          },
        ]
      },
      {
        icon: Brain,
        label: 'AI/ML Analytics',
        path: '#',
        permissionCode: null,
        subItems: [
          { label: 'AI Forecast Dashboard', path: '/ai-forecast-dashboard', permissionCode: 'Analytics.AIForecastDashboard' },
          { label: 'AI Inventory Dashboard', path: '/ai-inventory-dashboard', permissionCode: 'Analytics.AIInventoryDashboard' },
          { label: 'AI Sales Dashboard', path: '/ai-sales-dashboard', permissionCode: 'Analytics.AISalesDashboard' },
          { label: 'AI Customer Insights Dashboard', path: '/ai-customer-insights-dashboard', permissionCode: 'Analytics.AICustomerInsightsDashboard' },
          { label: 'AI Executive Dashboard', path: '/ai-executive-dashboard', permissionCode: 'Analytics.AIExecutiveDashboard' }
        ]
      }]
  },
  {
    title: 'Activities',
    items: [
      {
        icon: CheckSquare,
        label: 'Task List',
        path: '/tasks/all-tasks',
        permissionCode: 'task_list'
      },
      {
        icon: Calendar,
        label: 'Task Calendar', path: '/tasks/calendar', permissionCode: 'task_calendar'
      },
      { icon: Target, label: 'Task Status', path: '/tasks/track-task', permissionCode: 'task_status' },
      { icon: AlertCircle, label: 'Overdue Tasks', path: '/tasks/overdue', permissionCode: 'overdue_tasks' },
    ]
  },

  {
    title: 'System Administration',
    items: [


      {
        icon: LayoutDashboard,
        label: "Customization",
        path: "",
        permissionCode: null,
        subItems: [
          {

            label: 'Customize Forms',
            path: '/customization/customize-forms'

          },
          {
            label: 'Templates',
            path: '/Templates'
          }
        ]
      },
      {
        icon: Cpu,
        label: "Roles & Users",
        path: "",
        permissionCode: null,
        subItems: [
          {

            label: 'Roles',
            path: '/system/roles'
          },
          {
            label: 'User Management',
            path: '#',
            permissionCode: null,
            subItems: [
              { label: 'User List', path: '/user-management/user-list', permissionCode: null },
              { label: 'Teams', path: '/system/teams', permissionCode: null },
              { label: 'User Groups', path: '/system/user-groups', permissionCode: null },
            ]
          },
          {
            label: 'User History',
            path: '/system/user-history'
          },
        ]
      },
      {
        icon: Settings,
        label: 'Settings',
        path: '/Settings',
        permissionCode: null,
        subItems: [
          { label: 'Deal Factor', path: '/Settings/deal-factor-setup', permissionCode: 'Settings.DealFactor' },
          { label: 'Deal Prediction', path: '/Settings/deal-prediction', permissionCode: 'Settings.DealPrediction' },
          { label: 'Deal Prediction Setup', path: '/Settings/deal-prediction-setup', permissionCode: 'Settings.DealPredictionSetup' },
          { label: 'Deal Probability', path: '/Settings/deal-probability', permissionCode: 'Settings.DealProbability' },
          { label: 'Deal Weightage', path: '/Settings/deal-weightage', permissionCode: 'Settings.DealWeightage' },
          { label: 'Privileges', path: '/Settings/privileges', permissionCode: 'settings.privilege' },
          {
            label: "Map Settings",
            path: '/Settings/map-setting'
          },
          {
            label: "Mail Box Settings",
            path: '/Settings/mail-box-setting'
          },
          {
            label: "LinkedIn Settings",

            path: '/Settings/linkedin-setting'
          },
          {
            label: "Facebook Setting",

            path: '/Settings/facebook-setting'
          },
          {
            label: "Instagram Setting",

            path: '/Settings/instagram-setting'
          },
          // {
          //   label: "AI BOT Call script ",
          //   icon: Bot,
          //   path: '/Settings/instagram-setting'
          // },
          {
            label: "Notification Rule",

            path: '/Settings/notification-rule'
          }
        ]
      },
    ]
  },

  {
    title: 'Tools',
    items: [
      // {
      //   icon: MessageSquare,
      //   label: "Chats",
      //   path: '/chats'
      // },
      {
        icon: Bot,
        label: "Chatbot",
        path: '/Chat-bot'
      },
      // {
      //   icon: Video,
      //   label: "Jitsi meet",
      //   path: '/jitsi-meet'
      // }
    ]
  },
  {
    title: 'Administration',
    items:
      [


        // {
        //   icon: ShieldCheck,
        //   label: 'Authentication',
        //   path: '/system/authentication'
        // },

        // {
        //   icon: Monitor,
        //   label: 'Sessions',
        //   path: '/system/sessions'
        // },
        // {
        //   icon: ShieldCheck,
        //   label: 'Security Policies',
        //   path: '/system/security-policies'
        // },
        {
          icon: Zap,
          label: 'Workflow Rules',
          path: '/workflow-rule',
          permissionCode: 'Administration.WorkflowRules',
          subItems: [
            { label: 'Workflow Modules', path: '/workflow-rule/workflow-module', permissionCode: null },
            { label: 'Workflow Events', path: '/workflow-rule/workflow-event', permissionCode: null },
            { label: 'Workflow Rules', path: '/workflow-rule/workflow-rule-creation', permissionCode: null },
            { label: 'Conditions', path: '/workflow-rule/workflow-condition', permissionCode: null },
            { label: 'Actions', path: '/workflow-rule/workflow-action', permissionCode: null },
            { label: 'Email Templates', path: '/workflow-rule/email-template', permissionCode: null },
            { label: 'Notification Templates', path: '/workflow-rule/workflow-notification-template', permissionCode: null },
            { label: 'Notifications', path: '/workflow-rule/workflow-notification', permissionCode: null },
            { label: 'Executions', path: '/workflow-rule/workflow-execution', permissionCode: null },
            { label: 'Notification Logs', path: '/workflow-rule/workflow-notification-log', permissionCode: null },
          ]
        },
        {
          icon: Gauge,
          label: 'Lead Scoring',
          path: '/administration/lead-score',
          permissionCode: 'Administration.LeadScore'
        },
        {
          icon: Building2,
          label: 'Organisation',
          path: '/administration/organisation',
          permissionCode: null
        },
        {
          icon: CheckCircle2,
          label: 'Workflow Approval',
          path: '/administration/workflow-approval',
          permissionCode: null
        },
        {
          icon: ClipboardCheck,
          label: 'Application Approval',
          path: '/application-approval',
          permissionCode: null
        },
        // {
        //   icon: Database,
        //   label: 'DB Backup',
        //   path: '/administration/db-backup',
        //   permissionCode: null
        // },
        // {
        //   icon: Database,
        //   // label: 'DB Schema',
        //   label: 'Instance Request',
        //   path: '/administration/db-schema',
        //   permissionCode: null
        // },





        {
          icon: Puzzle,
          label: 'Add-ons',
          path: '/add-ons',
          permissionCode: null,
          subItems: [
            { label: 'Add-on Purchase Request', path: '/add-ons/add-on-purchase' },
            { label: 'Additional Storage Request', path: '/add-ons/additional-storage' },
            { label: 'Renewal Request', path: '/add-ons/renewal-request' },
            { label: 'Add or Reduce Users', path: '/add-ons/add-reduce-users' },
            // { label: 'CRM License Request', path: '/add-ons/crm-license-request' },
            // { label: 'Additional User License Request', path: '/add-ons/additional-user-license-request' 
            // { label: 'Increase Workspace', path: '/add-ons/increase-workspace' }
          ]
        },




        {
          icon: Users,
          label: 'Customer Segmentation',
          path: '/customer-segmentation',
          permissionCode: 'Settings.CustomerSegmentation'
        },
        {
          icon: Settings,
          label: 'Dropdown Values',
          path: '/dropdown-values',
          permissionCode: 'Settings.DropdownValues'
        },
        {
          icon: Bell,
          label: 'Notification Preferences',
          path: '/notification-preference',
          permissionCode: 'Settings.NotificationPreferences'
        },


        // {
        //   icon: TrendingUp,
        //   label: 'Instance',
        //   path: '/Settings/Instance',
        //   permissionCode: 'Settings.Instance'
        // },
        // {
        //   icon: TrendingUp,
        //   label: 'Incident Assignment',
        //   path: '/Settings/Incident_Assignment',
        //   permissionCode: 'Settings.IncidentAssignment'
        // },
        {
          icon: Bell,
          label: 'Notification Rule',
          path: '/Settings/notification-rule',
          permissionCode: null
        },


        {
          icon: FileText,
          label: 'Payment Terms & Conditions',
          path: '/Settings/payment-terms',
          permissionCode: null
        }
      ]
  }
];

const isPathActive = (targetPath: string, currentPath: string, currentSearchParams?: URLSearchParams) => {
  const [targetBase, targetQuery] = targetPath.split('?');

  let isBaseActive = false;
  if (currentPath === targetBase) {
    isBaseActive = true;
  } else if (targetBase !== '/' && currentPath.startsWith(targetBase + '/')) {
    if (targetBase === '/project') {
      const nextSegment = currentPath.split('/')[2];
      const standaloneRoutes = ['estimations', 'sprint', 'test-case', 'test-plan', 'sla', 'SAD', 'Milestone-Tracker', 'milestones', 'deliverables', 'project-task-allocation', 'predict', 'gantt', 'track'];
      if (nextSegment && standaloneRoutes.includes(nextSegment)) {
        isBaseActive = false;
      } else {
        isBaseActive = true;
      }
    } else {
      isBaseActive = true;
    }
  }

  if (!isBaseActive) return false;
  if (!targetQuery || !currentSearchParams) return true;

  const targetParams = new URLSearchParams(targetQuery);
  for (const [key, value] of targetParams.entries()) {
    if (currentSearchParams.get(key) !== value) {
      return false;
    }
  }
  return true;
};

export function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean, onNavigate?: () => void }) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [expandedSubMenus, setExpandedSubMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentReport = searchParams.get('report');

  const isSubSubActive = (subSubPath: string) => {
    const [basePath, queryStr] = subSubPath.split('?');
    if (pathname !== basePath) return false;
    if (!queryStr) return true;
    const targetReport = new URLSearchParams(queryStr).get('report');
    return currentReport === targetReport;
  };

  const { primaryColor, user } = useStore();
  const userRole = user?.role || 'CEO';

  const {
    canViewAdminDashboardOverview,
    canViewCeoDashboardOverview,
    isLoaded: isPermissionLoaded
  } = usePermission();

  const activeDashboardLabel = React.useMemo(() => {
    if (pathname !== '/') return null;
    return 'Dashboard';
  }, [pathname]);

  // 1. Resolve known role ID from localStorage session first
  const initialKnownRoleIdNav = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const rawId = userData?.Role_Id || userData?.roleId || userData?.role_id;
          if (rawId) return String(rawId);
        }
      } catch (e) {
        console.error('Error reading userData for role ID in Navigation', e);
      }
    }
    return '';
  }, []);

  // 2. Fetch list of all roles only if Role_Id is not already in local session
  const { data: rolesData } = useQuery({
    queryKey: ['rolesListAll'],
    queryFn: fetchRoleListWithoutPagination,
    enabled: !initialKnownRoleIdNav && !ENABLE_ALL_PERMISSIONS_TESTING,
    staleTime: 10 * 60 * 1000,
  });

  // Find user's role object in the list
  const matchedRole = React.useMemo(() => {
    if (initialKnownRoleIdNav) return { id: initialKnownRoleIdNav, Role_Id: initialKnownRoleIdNav };
    if (!rolesData) return null;
    const list = Array.isArray(rolesData) ? rolesData : (rolesData.data || []);
    return list.find((r: any) => {
      const name = r.Role_Name || r.name || '';
      return name.toLowerCase() === userRole.toLowerCase();
    });
  }, [initialKnownRoleIdNav, rolesData, userRole]);

  // 3. Fetch details for that role sharing query cache key with usePermission
  const matchedRoleId = matchedRole?.Role_Id || matchedRole?.id;
  const { data: roleDetailsData } = useQuery({
    queryKey: ['rolePermissionsData', matchedRoleId],
    queryFn: async () => {
      const res = await getRoleDetails(matchedRoleId);
      if (Array.isArray(res)) return res[0];
      if (res?.data) return Array.isArray(res.data) ? res.data[0] : res.data;
      if (res?.results) return Array.isArray(res.results) ? res.results[0] : res.results;
      return res;
    },
    enabled: !!matchedRoleId && !ENABLE_ALL_PERMISSIONS_TESTING,
    staleTime: 5 * 60 * 1000,
  });

  const roleDetails = React.useMemo(() => {
    if (!roleDetailsData) return null;
    const data = Array.isArray(roleDetailsData) ? roleDetailsData[0] : (roleDetailsData.data || roleDetailsData);
    return data;
  }, [roleDetailsData]);

  // Configure_Permission is stored directly on the role as array of dot-separated code strings
  // e.g. ["sales.invoice", "sales.invoice.pending_invoice", "sales.invoice.pending_invoice.create"]
  const configurePermSet = React.useMemo(() => {
    const rawPerms = roleDetails?.Configure_Permission || roleDetails?.permissions || roleDetails?.Permissions;
    let perms: string[] = [];
    if (Array.isArray(rawPerms)) {
      perms = rawPerms.filter((p): p is string => typeof p === 'string');
    } else if (typeof rawPerms === 'string') {
      try {
        const parsed = JSON.parse(rawPerms);
        if (Array.isArray(parsed)) {
          perms = parsed.filter((p): p is string => typeof p === 'string');
        } else if (typeof parsed === 'string') {
          perms = parsed.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        perms = rawPerms.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return new Set(perms.map((p: string) => p.trim().toLowerCase()));
  }, [roleDetails]);

  // Helper to normalize strings for comparison (e.g. "Pending Invoices" -> "pending_invoice")
  const slugify = React.useCallback((text: string): string => {
    if (!text) return '';
    let slug = text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (slug.endsWith('s') && !slug.endsWith('ss')) {
      slug = slug.slice(0, -1);
    }
    return slug;
  }, []);

  // Strict helper function to check if menu/submenu is permitted based on API response
  const hasAccessToForm = React.useCallback(
    (itemLabel: string, path: string, parentLabel?: string, permissionCode?: string | null) => {
      // Flag to bypass all permission checks for testing/development
      const SHOW_ALL_MENUS = ENABLE_ALL_PERMISSIONS_TESTING; // Controlled by the hook flag
      if (SHOW_ALL_MENUS) {
        return true;
      }

      // Invoice & Billing, Loyalty, POS Invoice, and Order Management are always accessible
      if (
        (permissionCode && (
          permissionCode.startsWith('InvoiceBilling') ||
          permissionCode.startsWith('invoice_billing') ||
          permissionCode.startsWith('OffersManagement') ||
          permissionCode.startsWith('OrderManagement')
        )) ||
        itemLabel === 'Invoice & Billing' ||
        itemLabel === 'Loyalty' ||
        itemLabel === 'POS Invoice' ||
        itemLabel === 'Offers Management' ||
        itemLabel === 'Order Management' ||
        parentLabel === 'Order Management' ||
        parentLabel === 'Invoice and Billings' ||
        parentLabel === 'Invoice & Billing' ||
        parentLabel === 'Loyalty' ||
        parentLabel === 'Offers Management'
      ) {
        return true;
      }

      if (configurePermSet.size === 0) {
        return false;
      }

      const labelSlug = slugify(itemLabel);
      const codeSlug = permissionCode ? slugify(permissionCode) : '';

      for (const perm of configurePermSet) {
        const permLower = perm.toLowerCase();

        // 1. Direct match with permissionCode if available
        if (permissionCode) {
          const codeLower = permissionCode.toLowerCase();
          if (permLower === codeLower || permLower.startsWith(codeLower + '.') || codeLower.startsWith(permLower + '.')) {
            return true;
          }
        }

        // 2. Exact token match against dot-separated code parts (NO fuzzy .includes substring matching)
        const parts = permLower.split('.').map((p) => p.trim());
        const partSlugs = parts.map((p) => slugify(p));

        const isExactMatch = partSlugs.some(
          (pSlug) => pSlug === labelSlug || (codeSlug && pSlug === codeSlug)
        );

        if (isExactMatch) {
          return true;
        }
      }

      return false;
    },
    [configurePermSet, slugify]
  );

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const toggleSubMenu = (label: string) => {
    setExpandedSubMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  // Filter menuGroups dynamically based strictly on API response
  const filteredGroups = React.useMemo(() => {
    const isUserAdminOrUserAdmin =
      userRole.toLowerCase() === 'admin' ||
      userRole.toLowerCase() === 'useradmin'

    return menuGroups
      .map((group) => {
        const isSystemAdminOrAdminGroup =
          group.title === 'System Administration' ||
          group.title === 'Administration';

        // Exclusive Visibility Rules:
        if (isSystemAdminOrAdminGroup) {
          // If the logged-in user is 'admin' or 'useradmin', show these groups fully unfiltered.
          if (isUserAdminOrUserAdmin) {
            return group;
          }
          // For all other roles, completely hide these groups (return null or group with empty items).
          return {
            ...group,
            items: []
          };
        }

        // Filter items in each group
        const filteredItems = group.items
          .map((item: any) => {
            if (item.subItems && item.subItems.length > 0) {
              const filteredSubs = item.subItems
                .map((sub: any) => {
                  if (sub.subItems && sub.subItems.length > 0) {
                    const filteredNested = sub.subItems.filter((nested: any) =>
                      hasAccessToForm(nested.label, nested.path, sub.label, nested.permissionCode)
                    );
                    return {
                      ...sub,
                      subItems: filteredNested,
                    };
                  }
                  return sub;
                })
                .filter((sub: any) => {
                  if (sub.subItems && sub.subItems.length > 0) {
                    return true;
                  }
                  return hasAccessToForm(sub.label, sub.path, item.label, sub.permissionCode);
                });

              return {
                ...item,
                subItems: filteredSubs,
              };
            }
            return item;
          })
          .filter((item: any) => {
            if (item.subItems && item.subItems.length > 0) {
              return true;
            }
            return hasAccessToForm(item.label, item.path, group.title, item.permissionCode);
          });

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [hasAccessToForm, userRole]);


  // Automatically expand parent menu containing active path
  React.useEffect(() => {
    filteredGroups.forEach(group => {
      group.items.forEach(item => {
        let shouldExpandParent = false;
        item.subItems?.forEach(sub => {
          const isSubActive = isPathActive(sub.path, pathname, searchParams);
          const isAnySubSubActive = sub.subItems?.some(ss => isSubSubActive(ss.path));
          if (isSubActive || isAnySubSubActive) {
            shouldExpandParent = true;
          }
          if (isAnySubSubActive) {
            setExpandedSubMenus(prev => prev.includes(sub.label) ? prev : [...prev, sub.label]);
          }
        });
        if (shouldExpandParent) {
          setExpandedMenus(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
        }
      });
    });
  }, [pathname, filteredGroups, currentReport, searchParams]);

  const activeBg = `${primaryColor}15`;

  return (
    <nav className="space-y-6">
      {filteredGroups.map((group) => {
        // Filter out groups with no items if applicable
        if (group.items.length === 0) return null;

        return (
          <div key={group.title} className="space-y-1.5">
            {!collapsed && (
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 pt-1">
                {group.title}
              </h3>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isExpanded = expandedMenus.includes(item.label);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                // Active calculation
                const isAnySubItemActive = item.subItems?.some(sub => isPathActive(sub.path, pathname, searchParams));
                const isActiveRoot =
                  !hasSubItems &&
                  (isPathActive(item.path, pathname, searchParams) ||
                    (pathname === '/' && item.label === activeDashboardLabel));
                const isParentActive = hasSubItems && isAnySubItemActive;

                return (
                  <div key={item.label} className="space-y-1">
                    <div className="relative group">
                      {hasSubItems ? (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 mx-2 text-xs font-semibold rounded-lg transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 group text-left",
                            isParentActive ? "text-primary font-bold" : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            collapsed && "justify-center px-0 mx-0"
                          )}
                          style={isParentActive ? { color: primaryColor } : undefined}
                        >
                          <item.icon className="h-4.5 w-4.5 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              <ChevronDown className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200 opacity-50",
                                isExpanded && "rotate-180"
                              )} />
                            </>
                          )}
                        </button>
                      ) : (
                        <NavLink
                          to={item.path}
                          onClick={onNavigate}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 mx-2 text-xs font-semibold rounded-lg transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 group",
                            collapsed && "justify-center px-0 mx-0"
                          )}
                          style={({ isActive }) => (isActive || isActiveRoot) ? { backgroundColor: activeBg, color: primaryColor } : { color: 'var(--foreground)' }}
                        >
                          <item.icon className="h-4.5 w-4.5 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && !collapsed && hasSubItems && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1"
                        >
                          {item.subItems?.map((subItem) => {
                            const hasSubSubItems = subItem.subItems && subItem.subItems.length > 0;
                            const isSubExpanded = expandedSubMenus.includes(subItem.label);
                            const isAnySubSubActive = subItem.subItems?.some(ss => isSubSubActive(ss.path));
                            const isSubActive = isPathActive(subItem.path, pathname, searchParams);
                            const isSubHighlight = isSubActive || isAnySubSubActive;

                            if (hasSubSubItems) {
                              return (
                                <div key={subItem.label} className="space-y-1">
                                  <button
                                    onClick={() => toggleSubMenu(subItem.label)}
                                    className={cn(
                                      "w-full flex items-center justify-between pl-11 pr-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors hover:bg-slate-100/30 dark:hover:bg-slate-800/30 text-left cursor-pointer",
                                      isSubHighlight ? "text-primary font-bold" : "text-slate-500/70 dark:text-slate-400/70 hover:text-slate-900 dark:hover:text-slate-100"
                                    )}
                                    style={isSubHighlight ? { color: primaryColor } : undefined}
                                  >
                                    <span className="truncate">{subItem.label}</span>
                                    <ChevronDown className={cn(
                                      "h-3 w-3 transition-transform duration-200 opacity-50",
                                      isSubExpanded && "rotate-180"
                                    )} />
                                  </button>
                                  <AnimatePresence initial={false}>
                                    {isSubExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-1"
                                      >
                                        {subItem.subItems?.map((subSubItem) => {
                                          const isSubSubItemActive = isSubSubActive(subSubItem.path);
                                          return (
                                            <NavLink
                                              key={`${subSubItem.path}-${subSubItem.label}`}
                                              to={subSubItem.path}
                                              exact={false}
                                              onClick={onNavigate}
                                              className={cn(
                                                "block w-full pl-16 pr-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors hover:bg-slate-100/20 dark:hover:bg-slate-800/20",
                                                isSubSubItemActive ? "font-bold" : "text-slate-500/70 dark:text-slate-400/70 hover:text-slate-900 dark:hover:text-slate-100"
                                              )}
                                              style={isSubSubItemActive ? { backgroundColor: activeBg, color: primaryColor } : {}}
                                            >
                                              <span className="truncate">{subSubItem.label}</span>
                                            </NavLink>
                                          );
                                        })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            }

                            return (
                              <NavLink
                                key={`${subItem.path}-${subItem.label}`}
                                to={subItem.path}
                                exact={subItem.path === item.path}
                                onClick={onNavigate}
                                className={({ isActive }) => cn(
                                  "block w-full pl-11 pr-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors hover:bg-slate-100/30 dark:hover:bg-slate-800/30",
                                  isActive ? "font-bold" : "text-slate-500/70 dark:text-slate-400/70 hover:text-slate-900 dark:hover:text-slate-100"
                                )}
                                style={({ isActive }) => isActive ? { backgroundColor: activeBg, color: primaryColor } : {}}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{subItem.label}</span>
                                  {subItem.badge && (
                                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 ml-1.5 animate-pulse" />
                                  )}
                                </div>
                              </NavLink>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Copyright Footer */}
      {!collapsed && (
        <div className="px-4 py-4 mt-6 text-[10px] text-slate-400 dark:text-slate-500 font-medium select-none border-t border-slate-100 dark:border-slate-800">
          <p>© 2026 IT CRM</p>
          <p className="opacity-75">v1.0.0</p>
        </div>
      )}
    </nav>
  );
}