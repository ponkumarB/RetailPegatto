import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermissionStore } from '@/store/usePermissionStore';
import { useStore } from '@/store/useStore';
import { getRoleDetails, fetchRoleListWithoutPagination } from '@/service/api/role/api';
/**
 * Flag to enable all action permissions for testing purposes.
 * Set to `true` to bypass role checks and grant all permissions.
 * Set to `false` for normal RBAC permission enforcement.
 */
export const ENABLE_ALL_PERMISSIONS_TESTING = true;

export function usePermission(roleIdOverride?: string) {
  const { permissions, isLoaded, setPermissions, hasPermission, hasAnyPermission } =
    usePermissionStore();
  const { user } = useStore();
  const userRole = user?.role || '';

  // 1. Resolve known role ID from override or localStorage first
  const initialKnownRoleId = useMemo(() => {
    if (roleIdOverride) return roleIdOverride;

    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const rawId = userData?.Role_Id || userData?.roleId || userData?.role_id;
          if (rawId) return String(rawId);
        }
      } catch (e) {
        console.error('Error reading userData for role ID', e);
      }
    }
    return '';
  }, [roleIdOverride]);

  // 2. Fetch list of all roles only if Role_Id is not already in local session
  const { data: rolesListData } = useQuery({
    queryKey: ['rolesListAll'],
    queryFn: fetchRoleListWithoutPagination,
    enabled: !initialKnownRoleId && !ENABLE_ALL_PERMISSIONS_TESTING,
    staleTime: 10 * 60 * 1000,
  });

  const matchedRoleId = useMemo(() => {
    if (initialKnownRoleId) return initialKnownRoleId;
    if (!rolesListData || !userRole) return '';
    const list = Array.isArray(rolesListData) ? rolesListData : (rolesListData.data || []);
    const matched = list.find((r: any) => {
      const name = r.Role_Name || r.name || '';
      return name.toLowerCase() === userRole.toLowerCase();
    });
    return matched ? String(matched.Role_Id || matched.id || '') : '';
  }, [initialKnownRoleId, rolesListData, userRole]);

  // Fetch Role Details API containing Configure_Permission
  const { data: roleApiData } = useQuery({
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
  // Sync Configure_Permission into Zustand store in memory
  useEffect(() => {
    if (roleApiData) {
      const rawPerms = roleApiData.Configure_Permission || roleApiData.permissions || roleApiData.Permissions;
      let configurePermissions: string[] = [];
      if (Array.isArray(rawPerms)) {
        configurePermissions = rawPerms.filter((p): p is string => typeof p === 'string');
      } else if (typeof rawPerms === 'string') {
        try {
          const parsed = JSON.parse(rawPerms);
          if (Array.isArray(parsed)) {
            configurePermissions = parsed.filter((p): p is string => typeof p === 'string');
          } else if (typeof parsed === 'string') {
            configurePermissions = parsed.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } catch {
          configurePermissions = rawPerms.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      setPermissions(configurePermissions);
    }
  }, [roleApiData, setPermissions]);
  const checkPermission = (perm: string): boolean => {
    if (ENABLE_ALL_PERMISSIONS_TESTING) return true;
    return hasPermission(perm);
  };
  const checkAnyPermission = (perms: string[]): boolean => {
    if (ENABLE_ALL_PERMISSIONS_TESTING) return true;
    return hasAnyPermission(perms);
  };
  return {
    permissions,
    isLoaded: ENABLE_ALL_PERMISSIONS_TESTING ? true : isLoaded,
    isTestingAllPermissions: ENABLE_ALL_PERMISSIONS_TESTING,
    // Granular Lead Permissions
    canCreateLead: checkPermission('lead.create'),
    canEditLead: checkPermission('lead.edit'),
    canDeleteLead: checkPermission('lead.delete'),
    canViewLeadOverview: checkPermission('lead.overview'),
    canImportLead: checkPermission('lead.import'),
    canExportLead: checkPermission('lead.export'),
    // Granular Company / Account Permissions
    canCreateCompany: checkAnyPermission(['company.create', 'companies.create', 'account.create']),
    canEditCompany: checkAnyPermission(['company.edit', 'companies.edit', 'account.edit']),
    canDeleteCompany: checkAnyPermission(['company.delete', 'companies.delete', 'account.delete']),
    canViewCompanyOverview: checkAnyPermission([
      'company.overview',
      'companies.overview',
      'company.view',
      'companies.view',
      'account.overview',
      'account.view',
    ]),
    // Granular Contact Permissions
    canCreateContact: checkAnyPermission(['contact.create', 'contacts.create']),
    canEditContact: checkAnyPermission(['contact.edit', 'contacts.edit']),
    canDeleteContact: checkAnyPermission(['contact.delete', 'contacts.delete']),
    canViewContactOverview: checkAnyPermission([
      'contact.overview',
      'contacts.overview',
      'contact.view',
      'contacts.view',
    ]),
    canImportContact: checkAnyPermission(['contact.import', 'contacts.import']),
    canExportContact: checkAnyPermission(['contact.export', 'contacts.export']),
    // Granular Deal / Opportunity Permissions
    canCreateDeal: checkAnyPermission(['deal.create', 'deals.create', 'opportunity.create']),
    canEditDeal: checkAnyPermission(['deal.edit', 'deals.edit', 'opportunity.edit']),
    canDeleteDeal: checkAnyPermission(['deal.delete', 'deals.delete', 'opportunity.delete']),
    canViewDealOverview: checkAnyPermission([
      'deal.overview',
      'deals.overview',
      'deal.view',
      'deals.view',
      'opportunity.overview',
      'opportunity.view',
    ]),
    canImportDeal: checkAnyPermission(['deal.import', 'deals.import']),
    canExportDeal: checkAnyPermission(['deal.export', 'deals.export']),
    // Granular Project Estimation Permissions
    canCreateEstimation: checkAnyPermission(['sales.project_estimation.create', 'project_estimation.create', 'estimations.create']),
    canEditEstimation: checkAnyPermission(['sales.project_estimation.edit', 'project_estimation.edit', 'estimations.edit']),
    canDeleteEstimation: checkAnyPermission(['sales.project_estimation.delete', 'project_estimation.delete', 'estimations.delete']),
    canViewEstimationOverview: checkAnyPermission([
      'sales.project_estimation.overview',
      'project_estimation.overview',
      'project_estimation.view',
      'estimations.overview',
      'estimations.view',
    ]),
    canExportEstimation: checkAnyPermission(['sales.project_estimation.export', 'project_estimation.export', 'estimations.export']),
    // Granular List of Invoices Permissions
    canCreateInvoice: checkAnyPermission(['sales.invoice.list_of_invoices.create', 'invoice.list_of_invoices.create', 'invoice.create']),
    canEditInvoice: checkAnyPermission(['sales.invoice.list_of_invoices.edit', 'invoice.list_of_invoices.edit', 'invoice.edit']),
    canDeleteInvoice: checkAnyPermission(['sales.invoice.list_of_invoices.delete', 'invoice.list_of_invoices.delete', 'invoice.delete']),
    canViewInvoiceOverview: checkAnyPermission([
      'sales.invoice.list_of_invoices.overview',
      'invoice.list_of_invoices.overview',
      'invoice.list_of_invoices.view',
      'invoice.overview',
      'invoice.view',
    ]),
    canImportInvoice: checkAnyPermission(['sales.invoice.list_of_invoices.import', 'invoice.list_of_invoices.import', 'invoice.import']),
    canExportInvoice: checkAnyPermission(['sales.invoice.list_of_invoices.export', 'invoice.list_of_invoices.export', 'invoice.export']),
    // Granular Pending Invoices Permissions
    canCreatePendingInvoice: checkAnyPermission(['sales.invoice.pending_invoices.create', 'invoice.pending_invoices.create', 'pending_invoices.create']),
    canEditPendingInvoice: checkAnyPermission(['sales.invoice.pending_invoices.edit', 'invoice.pending_invoices.edit', 'pending_invoices.edit']),
    canDeletePendingInvoice: checkAnyPermission(['sales.invoice.pending_invoices.delete', 'invoice.pending_invoices.delete', 'pending_invoices.delete']),
    canViewPendingInvoiceOverview: checkAnyPermission([
      'sales.invoice.pending_invoices.overview',
      'invoice.pending_invoices.overview',
      'invoice.pending_invoices.view',
      'pending_invoices.overview',
      'pending_invoices.view',
    ]),
    canImportPendingInvoice: checkAnyPermission(['sales.invoice.pending_invoices.import', 'invoice.pending_invoices.import', 'pending_invoices.import']),
    canExportPendingInvoice: checkAnyPermission(['sales.invoice.pending_invoices.export', 'invoice.pending_invoices.export', 'pending_invoices.export']),

    // Granular Payment Permissions
    canCreatePayment: checkAnyPermission(['sales.payment.create', 'payment.create']),
    canEditPayment: checkAnyPermission(['sales.payment.edit', 'payment.edit']),
    canDeletePayment: checkAnyPermission(['sales.payment.delete', 'payment.delete']),
    canViewPaymentOverview: checkAnyPermission(['sales.payment.overview', 'payment.overview', 'payment.view']),
    canExportPayment: checkAnyPermission(['sales.payment.export', 'payment.export']),

    // Granular Invoice & Billing Permissions (matching oldretailproject)
    canViewPOSInvoice: checkAnyPermission(['InvoiceBilling.POSInvoice', 'invoice_billing.pos_invoice', 'pos_invoice.overview', 'pos_invoice.view']),
    canCreatePOSInvoice: checkAnyPermission(['InvoiceBilling.POSInvoice.create', 'invoice_billing.pos_invoice.create', 'pos_invoice.create']),
    canEditPOSInvoice: checkAnyPermission(['InvoiceBilling.POSInvoice.edit', 'invoice_billing.pos_invoice.edit', 'pos_invoice.edit']),
    canDeletePOSInvoice: checkAnyPermission(['InvoiceBilling.POSInvoice.delete', 'invoice_billing.pos_invoice.delete', 'pos_invoice.delete']),
    canViewLoyaltyWallet: checkAnyPermission(['InvoiceBilling.LoyaltyWallet', 'invoice_billing.loyalty_wallet', 'loyalty_wallet.overview', 'loyalty_wallet.view']),
    canViewLoyaltyTransaction: checkAnyPermission(['InvoiceBilling.LoyaltyTransaction', 'invoice_billing.loyalty_transaction', 'loyalty_transaction.overview', 'loyalty_transaction.view']),
    canViewLoyaltyRule: checkAnyPermission(['InvoiceBilling.LoyaltyRule', 'invoice_billing.loyalty_rule', 'loyalty_rule.overview', 'loyalty_rule.view']),

    // Granular Sales Orders Permissions
    canCreateSalesOrder: checkAnyPermission(['sales.sales_orders.create', 'sales_orders.create']),
    canEditSalesOrder: checkAnyPermission(['sales.sales_orders.edit', 'sales_orders.edit']),
    canDeleteSalesOrder: checkAnyPermission(['sales.sales_orders.delete', 'sales_orders.delete']),
    canViewSalesOrderOverview: checkAnyPermission([
      'sales.sales_orders.overview',
      'sales_orders.overview',
      'sales_orders.view',
    ]),
    canImportSalesOrder: checkAnyPermission(['sales.sales_orders.import', 'sales_orders.import']),
    canExportSalesOrder: checkAnyPermission(['sales.sales_orders.export', 'sales_orders.export']),
    // Granular Sales Target Permissions
    canCreateSalesTarget: checkAnyPermission(['sales.sales_target.create', 'sales_target.create']),
    canEditSalesTarget: checkAnyPermission(['sales.sales_target.edit', 'sales_target.edit']),
    canDeleteSalesTarget: checkAnyPermission(['sales.sales_target.delete', 'sales_target.delete']),
    canViewSalesTargetOverview: checkAnyPermission([
      'sales.sales_target.overview',
      'sales_target.overview',
      'sales_target.view',
    ]),
    canImportSalesTarget: checkAnyPermission(['sales.sales_target.import', 'sales_target.import']),
    canExportSalesTarget: checkAnyPermission(['sales.sales_target.export', 'sales_target.export']),
    // Granular Sales Target Vs Achievement Permissions
    canCreateSalesTargetVsAchievement: checkAnyPermission(['sales.sales_target_vs_achievement.create', 'sales_target_vs_achievement.create']),
    canEditSalesTargetVsAchievement: checkAnyPermission(['sales.sales_target_vs_achievement.edit', 'sales_target_vs_achievement.edit']),
    canDeleteSalesTargetVsAchievement: checkAnyPermission(['sales.sales_target_vs_achievement.delete', 'sales_target_vs_achievement.delete']),
    canViewSalesTargetVsAchievementOverview: checkAnyPermission([
      'sales.sales_target_vs_achievement.overview',
      'sales_target_vs_achievement.overview',
      'sales_target_vs_achievement.view',
    ]),
    canImportSalesTargetVsAchievement: checkAnyPermission(['sales.sales_target_vs_achievement.import', 'sales_target_vs_achievement.import']),
    canExportSalesTargetVsAchievement: checkAnyPermission(['sales.sales_target_vs_achievement.export', 'sales_target_vs_achievement.export']),
    // Granular Territories Permissions
    canCreateTerritory: checkAnyPermission(['sales.territory_management.territories.create', 'territory_management.territories.create', 'territories.create']),
    canEditTerritory: checkAnyPermission(['sales.territory_management.territories.edit', 'territory_management.territories.edit', 'territories.edit']),
    canDeleteTerritory: checkAnyPermission(['sales.territory_management.territories.delete', 'territory_management.territories.delete', 'territories.delete']),
    canViewTerritoryOverview: checkAnyPermission([
      'sales.territory_management.territories.overview',
      'territory_management.territories.overview',
      'territories.overview',
      'territories.view',
    ]),
    canImportTerritory: checkAnyPermission(['sales.territory_management.territories.import', 'territory_management.territories.import', 'territories.import']),
    canExportTerritory: checkAnyPermission(['sales.territory_management.territories.export', 'territory_management.territories.export', 'territories.export']),
    // Granular Territory Hierarchy Permissions
    canCreateTerritoryHierarchy: checkAnyPermission(['sales.territory_management.territory_hierarchy.create', 'territory_management.territory_hierarchy.create', 'territory_hierarchy.create']),
    canEditTerritoryHierarchy: checkAnyPermission(['sales.territory_management.territory_hierarchy.edit', 'territory_management.territory_hierarchy.edit', 'territory_hierarchy.edit']),
    canDeleteTerritoryHierarchy: checkAnyPermission(['sales.territory_management.territory_hierarchy.delete', 'territory_management.territory_hierarchy.delete', 'territory_hierarchy.delete']),
    canViewTerritoryHierarchyOverview: checkAnyPermission([
      'sales.territory_management.territory_hierarchy.overview',
      'territory_management.territory_hierarchy.overview',
      'territory_hierarchy.overview',
      'territory_hierarchy.view',
    ]),
    canImportTerritoryHierarchy: checkAnyPermission(['sales.territory_management.territory_hierarchy.import', 'territory_management.territory_hierarchy.import', 'territory_hierarchy.import']),
    canExportTerritoryHierarchy: checkAnyPermission(['sales.territory_management.territory_hierarchy.export', 'territory_management.territory_hierarchy.export', 'territory_hierarchy.export']),
    // Granular Territory Assignment Permissions
    canCreateTerritoryAssignment: checkAnyPermission(['sales.territory_management.territory_assignment.create', 'territory_management.territory_assignment.create', 'territory_assignment.create']),
    canEditTerritoryAssignment: checkAnyPermission(['sales.territory_management.territory_assignment.edit', 'territory_management.territory_assignment.edit', 'territory_assignment.edit']),
    canDeleteTerritoryAssignment: checkAnyPermission(['sales.territory_management.territory_assignment.delete', 'territory_management.territory_assignment.delete', 'territory_assignment.delete']),
    canViewTerritoryAssignmentOverview: checkAnyPermission([
      'sales.territory_management.territory_assignment.overview',
      'territory_management.territory_assignment.overview',
      'territory_assignment.overview',
      'territory_assignment.view',
    ]),
    canImportTerritoryAssignment: checkAnyPermission(['sales.territory_management.territory_assignment.import', 'territory_management.territory_assignment.import', 'territory_assignment.import']),
    canExportTerritoryAssignment: checkAnyPermission(['sales.territory_management.territory_assignment.export', 'territory_management.territory_assignment.export', 'territory_assignment.export']),
    // Granular Territory Rules Permissions
    canCreateTerritoryRules: checkAnyPermission(['sales.territory_management.territory_rules.create', 'territory_management.territory_rules.create', 'territory_rules.create']),
    canEditTerritoryRules: checkAnyPermission(['sales.territory_management.territory_rules.edit', 'territory_management.territory_rules.edit', 'territory_rules.edit']),
    canDeleteTerritoryRules: checkAnyPermission(['sales.territory_management.territory_rules.delete', 'territory_management.territory_rules.delete', 'territory_rules.delete']),
    canViewTerritoryRulesOverview: checkAnyPermission([
      'sales.territory_management.territory_rules.overview',
      'territory_management.territory_rules.overview',
      'territory_rules.overview',
      'territory_rules.view',
    ]),
    canImportTerritoryRules: checkAnyPermission(['sales.territory_management.territory_rules.import', 'territory_management.territory_rules.import', 'territory_rules.import']),
    canExportTerritoryRules: checkAnyPermission(['sales.territory_management.territory_rules.export', 'territory_management.territory_rules.export', 'territory_rules.export']),
    // Granular Territory Quotas Permissions
    canCreateTerritoryQuotas: checkAnyPermission(['sales.territory_management.territory_quotas.create', 'territory_management.territory_quotas.create', 'territory_quotas.create']),
    canEditTerritoryQuotas: checkAnyPermission(['sales.territory_management.territory_quotas.edit', 'territory_management.territory_quotas.edit', 'territory_quotas.edit']),
    canDeleteTerritoryQuotas: checkAnyPermission(['sales.territory_management.territory_quotas.delete', 'territory_management.territory_quotas.delete', 'territory_quotas.delete']),
    canViewTerritoryQuotasOverview: checkAnyPermission([
      'sales.territory_management.territory_quotas.overview',
      'territory_management.territory_quotas.overview',
      'territory_quotas.overview',
      'territory_quotas.view',
    ]),
    canImportTerritoryQuotas: checkAnyPermission(['sales.territory_management.territory_quotas.import', 'territory_management.territory_quotas.import', 'territory_quotas.import']),
    canExportTerritoryQuotas: checkAnyPermission(['sales.territory_management.territory_quotas.export', 'territory_management.territory_quotas.export', 'territory_quotas.export']),
    // Granular Territory Performance Permissions
    canCreateTerritoryPerformance: checkAnyPermission(['sales.territory_management.territory_performance.create', 'territory_management.territory_performance.create', 'territory_performance.create']),
    canEditTerritoryPerformance: checkAnyPermission(['sales.territory_management.territory_performance.edit', 'territory_management.territory_performance.edit', 'territory_performance.edit']),
    canDeleteTerritoryPerformance: checkAnyPermission(['sales.territory_management.territory_performance.delete', 'territory_management.territory_performance.delete', 'territory_performance.delete']),
    canViewTerritoryPerformanceOverview: checkAnyPermission([
      'sales.territory_management.territory_performance.overview',
      'territory_management.territory_performance.overview',
      'territory_performance.overview',
      'territory_performance.view',
    ]),
    canImportTerritoryPerformance: checkAnyPermission(['sales.territory_management.territory_performance.import', 'territory_management.territory_performance.import', 'territory_performance.import']),
    canExportTerritoryPerformance: checkAnyPermission(['sales.territory_management.territory_performance.export', 'territory_management.territory_performance.export', 'territory_performance.export']),

    // Granular Campaigns Permissions
    canCreateCampaign: checkAnyPermission(['campaigns.create', 'marketing.campaigns.create', 'campaigns']),
    canEditCampaign: checkAnyPermission(['campaigns.edit', 'marketing.campaigns.edit', 'campaigns']),
    canDeleteCampaign: checkAnyPermission(['campaigns.delete', 'marketing.campaigns.delete', 'campaigns']),
    canViewCampaignOverview: checkAnyPermission([
      'campaigns.overview',
      'campaigns.view',
      'marketing.campaigns.overview',
      'campaigns',
      'Marketing.Campaigns',
    ]),
    canImportCampaign: checkAnyPermission(['campaigns.import', 'marketing.campaigns.import', 'campaigns']),
    canExportCampaign: checkAnyPermission(['campaigns.export', 'marketing.campaigns.export', 'campaigns']),

    // Granular Call Lists Permissions
    canCreateCallList: checkAnyPermission(['call_management.call_lists.create', 'call_lists.create', 'call_management.call_lists']),
    canEditCallList: checkAnyPermission(['call_management.call_lists.edit', 'call_lists.edit', 'call_management.call_lists']),
    canDeleteCallList: checkAnyPermission(['call_management.call_lists.delete', 'call_lists.delete', 'call_management.call_lists']),
    canViewCallListOverview: checkAnyPermission([
      'call_management.call_lists.overview',
      'call_lists.overview',
      'call_lists.view',
      'call_management.call_lists',
    ]),
    canImportCallList: checkAnyPermission(['call_management.call_lists.import', 'call_lists.import', 'call_management.call_lists']),
    canExportCallList: checkAnyPermission(['call_management.call_lists.export', 'call_lists.export', 'call_management.call_lists']),

    // Granular Call Assignment Permissions
    canCreateCallAssignment: checkAnyPermission(['call_management.call_assignment.create', 'call_assignment.create', 'call_management.call_assignment']),
    canEditCallAssignment: checkAnyPermission(['call_management.call_assignment.edit', 'call_assignment.edit', 'call_management.call_assignment']),
    canDeleteCallAssignment: checkAnyPermission(['call_management.call_assignment.delete', 'call_assignment.delete', 'call_management.call_assignment']),
    canViewCallAssignmentOverview: checkAnyPermission([
      'call_management.call_assignment.overview',
      'call_assignment.overview',
      'call_assignment.view',
      'call_management.call_assignment',
    ]),
    canImportCallAssignment: checkAnyPermission(['call_management.call_assignment.import', 'call_assignment.import', 'call_management.call_assignment']),
    canExportCallAssignment: checkAnyPermission(['call_management.call_assignment.export', 'call_assignment.export', 'call_management.call_assignment']),

    // Granular Today's Call List Permissions
    canCreateTodaysCallList: checkAnyPermission(['call_management.today_s_call_list.create', 'today_s_call_list.create', 'call_management.today_s_call_list']),
    canEditTodaysCallList: checkAnyPermission(['call_management.today_s_call_list.edit', 'today_s_call_list.edit', 'call_management.today_s_call_list']),
    canDeleteTodaysCallList: checkAnyPermission(['call_management.today_s_call_list.delete', 'today_s_call_list.delete', 'call_management.today_s_call_list']),
    canViewTodaysCallListOverview: checkAnyPermission([
      'call_management.today_s_call_list.overview',
      'today_s_call_list.overview',
      'today_s_call_list.view',
      'call_management.today_s_call_list',
    ]),
    canImportTodaysCallList: checkAnyPermission(['call_management.today_s_call_list.import', 'today_s_call_list.import', 'call_management.today_s_call_list']),
    canExportTodaysCallList: checkAnyPermission(['call_management.today_s_call_list.export', 'today_s_call_list.export', 'call_management.today_s_call_list']),

    // Granular Call Summary Permissions
    canCreateCallSummary: checkAnyPermission(['call_management.call_summary.create', 'call_summary.create', 'call_management.call_summary']),
    canEditCallSummary: checkAnyPermission(['call_management.call_summary.edit', 'call_summary.edit', 'call_management.call_summary']),
    canDeleteCallSummary: checkAnyPermission(['call_management.call_summary.delete', 'call_summary.delete', 'call_management.call_summary']),
    canViewCallSummaryOverview: checkAnyPermission([
      'call_management.call_summary.overview',
      'call_summary.overview',
      'call_summary.view',
      'call_management.call_summary',
    ]),
    canImportCallSummary: checkAnyPermission(['call_management.call_summary.import', 'call_summary.import', 'call_management.call_summary']),
    canExportCallSummary: checkAnyPermission(['call_management.call_summary.export', 'call_summary.export', 'call_management.call_summary']),

    // Granular Employee Call Performance Permissions
    canCreateEmployeeCallPerformance: checkAnyPermission(['call_management.employee_call_performance.create', 'employee_call_performance.create', 'call_management.employee_call_performance']),
    canEditEmployeeCallPerformance: checkAnyPermission(['call_management.employee_call_performance.edit', 'employee_call_performance.edit', 'call_management.employee_call_performance']),
    canDeleteEmployeeCallPerformance: checkAnyPermission(['call_management.employee_call_performance.delete', 'employee_call_performance.delete', 'call_management.employee_call_performance']),
    canViewEmployeeCallPerformanceOverview: checkAnyPermission([
      'call_management.employee_call_performance.overview',
      'employee_call_performance.overview',
      'employee_call_performance.view',
      'call_management.employee_call_performance',
    ]),
    canImportEmployeeCallPerformance: checkAnyPermission(['call_management.employee_call_performance.import', 'employee_call_performance.import', 'call_management.employee_call_performance']),
    canExportEmployeeCallPerformance: checkAnyPermission(['call_management.employee_call_performance.export', 'employee_call_performance.export', 'call_management.employee_call_performance']),

    // Granular Task List Permissions
    canCreateTaskList: checkAnyPermission(['task_list.create', 'tasks.all.create', 'task_list', 'Tasks.All']),
    canEditTaskList: checkAnyPermission(['task_list.edit', 'tasks.all.edit', 'task_list', 'Tasks.All']),
    canDeleteTaskList: checkAnyPermission(['task_list.delete', 'tasks.all.delete', 'task_list', 'Tasks.All']),
    canViewTaskListOverview: checkAnyPermission([
      'task_list.overview',
      'task_list.view',
      'tasks.all.overview',
      'task_list',
      'Tasks.All',
    ]),
    canImportTaskList: checkAnyPermission(['task_list.import', 'tasks.all.import', 'task_list', 'Tasks.All']),
    canExportTaskList: checkAnyPermission(['task_list.export', 'tasks.all.export', 'task_list', 'Tasks.All']),

    // Granular Task Calendar Permissions
    canCreateTaskCalendar: checkAnyPermission(['task_calendar.create', 'tasks.calendar.create', 'task_calendar', 'Tasks.Calendar']),
    canEditTaskCalendar: checkAnyPermission(['task_calendar.edit', 'tasks.calendar.edit', 'task_calendar', 'Tasks.Calendar']),
    canDeleteTaskCalendar: checkAnyPermission(['task_calendar.delete', 'tasks.calendar.delete', 'task_calendar', 'Tasks.Calendar']),
    canViewTaskCalendarOverview: checkAnyPermission([
      'task_calendar.overview',
      'task_calendar.view',
      'tasks.calendar.overview',
      'task_calendar',
      'Tasks.Calendar',
    ]),
    canImportTaskCalendar: checkAnyPermission(['task_calendar.import', 'tasks.calendar.import', 'task_calendar', 'Tasks.Calendar']),
    canExportTaskCalendar: checkAnyPermission(['task_calendar.export', 'tasks.calendar.export', 'task_calendar', 'Tasks.Calendar']),

    // Granular Task Status Permissions
    canCreateTaskStatus: checkAnyPermission(['task_status.create', 'tasks.track.create', 'task_status', 'Tasks.Track']),
    canEditTaskStatus: checkAnyPermission(['task_status.edit', 'tasks.track.edit', 'task_status', 'Tasks.Track']),
    canDeleteTaskStatus: checkAnyPermission(['task_status.delete', 'tasks.track.delete', 'task_status', 'Tasks.Track']),
    canViewTaskStatusOverview: checkAnyPermission([
      'task_status.overview',
      'task_status.view',
      'tasks.track.overview',
      'task_status',
      'Tasks.Track',
    ]),
    canImportTaskStatus: checkAnyPermission(['task_status.import', 'tasks.track.import', 'task_status', 'Tasks.Track']),
    canExportTaskStatus: checkAnyPermission(['task_status.export', 'tasks.track.export', 'task_status', 'Tasks.Track']),

    // Granular Overdue Tasks Permissions
    canCreateOverdueTasks: checkAnyPermission(['overdue_tasks.create', 'tasks.overdue.create', 'overdue_tasks', 'Tasks.Overdue']),
    canEditOverdueTasks: checkAnyPermission(['overdue_tasks.edit', 'tasks.overdue.edit', 'overdue_tasks', 'Tasks.Overdue']),
    canDeleteOverdueTasks: checkAnyPermission(['overdue_tasks.delete', 'tasks.overdue.delete', 'overdue_tasks', 'Tasks.Overdue']),
    canViewOverdueTasksOverview: checkAnyPermission([
      'overdue_tasks.overview',
      'overdue_tasks.view',
      'tasks.overdue.overview',
      'overdue_tasks',
      'Tasks.Overdue',
    ]),
    canImportOverdueTasks: checkAnyPermission(['overdue_tasks.import', 'tasks.overdue.import', 'overdue_tasks', 'Tasks.Overdue']),
    canExportOverdueTasks: checkAnyPermission(['overdue_tasks.export', 'tasks.overdue.export', 'overdue_tasks', 'Tasks.Overdue']),

    // Granular Generate BRD Document Permissions
    canCreateBrdDocument: checkAnyPermission(['presales_document.generate_brd_document.create', 'presales_document.generate_brd_document', 'Documentations.BRD']),
    canEditBrdDocument: checkAnyPermission(['presales_document.generate_brd_document.edit', 'presales_document.generate_brd_document', 'Documentations.BRD']),
    canDeleteBrdDocument: checkAnyPermission(['presales_document.generate_brd_document.delete', 'presales_document.generate_brd_document', 'Documentations.BRD']),
    canViewBrdDocumentOverview: checkAnyPermission([
      'presales_document.generate_brd_document.overview',
      'presales_document.generate_brd_document.view',
      'presales_document.generate_brd_document',
      'Documentations.BRD',
    ]),
    canImportBrdDocument: checkAnyPermission(['presales_document.generate_brd_document.import', 'presales_document.generate_brd_document', 'Documentations.BRD']),
    canExportBrdDocument: checkAnyPermission(['presales_document.generate_brd_document.export', 'presales_document.generate_brd_document', 'Documentations.BRD']),

    // Granular Generate FRD Document Permissions
    canCreateFrdDocument: checkAnyPermission(['presales_document.generate_frd_document.create', 'presales_document.generate_frd_document', 'Documentations.FRD']),
    canEditFrdDocument: checkAnyPermission(['presales_document.generate_frd_document.edit', 'presales_document.generate_frd_document', 'Documentations.FRD']),
    canDeleteFrdDocument: checkAnyPermission(['presales_document.generate_frd_document.delete', 'presales_document.generate_frd_document', 'Documentations.FRD']),
    canViewFrdDocumentOverview: checkAnyPermission([
      'presales_document.generate_frd_document.overview',
      'presales_document.generate_frd_document.view',
      'presales_document.generate_frd_document',
      'Documentations.FRD',
    ]),
    canImportFrdDocument: checkAnyPermission(['presales_document.generate_frd_document.import', 'presales_document.generate_frd_document', 'Documentations.FRD']),
    canExportFrdDocument: checkAnyPermission(['presales_document.generate_frd_document.export', 'presales_document.generate_frd_document', 'Documentations.FRD']),

    // Granular Generate SRS Document Permissions
    canCreateSrsDocument: checkAnyPermission(['presales_document.generate_srs_document.create', 'presales_document.generate_srs_document', 'Documentations.SRS']),
    canEditSrsDocument: checkAnyPermission(['presales_document.generate_srs_document.edit', 'presales_document.generate_srs_document', 'Documentations.SRS']),
    canDeleteSrsDocument: checkAnyPermission(['presales_document.generate_srs_document.delete', 'presales_document.generate_srs_document', 'Documentations.SRS']),
    canViewSrsDocumentOverview: checkAnyPermission([
      'presales_document.generate_srs_document.overview',
      'presales_document.generate_srs_document.view',
      'presales_document.generate_srs_document',
      'Documentations.SRS',
    ]),
    canImportSrsDocument: checkAnyPermission(['presales_document.generate_srs_document.import', 'presales_document.generate_srs_document', 'Documentations.SRS']),
    canExportSrsDocument: checkAnyPermission(['presales_document.generate_srs_document.export', 'presales_document.generate_srs_document', 'Documentations.SRS']),

    // Granular Generate Scope Document Permissions
    canCreateScopeDocument: checkAnyPermission(['presales_document.generate_scope_document.create', 'presales_document.generate_scope_document', 'Documentations.Scope']),
    canEditScopeDocument: checkAnyPermission(['presales_document.generate_scope_document.edit', 'presales_document.generate_scope_document', 'Documentations.Scope']),
    canDeleteScopeDocument: checkAnyPermission(['presales_document.generate_scope_document.delete', 'presales_document.generate_scope_document', 'Documentations.Scope']),
    canViewScopeDocumentOverview: checkAnyPermission([
      'presales_document.generate_scope_document.overview',
      'presales_document.generate_scope_document.view',
      'presales_document.generate_scope_document',
      'Documentations.Scope',
    ]),
    canImportScopeDocument: checkAnyPermission(['presales_document.generate_scope_document.import', 'presales_document.generate_scope_document', 'Documentations.Scope']),
    canExportScopeDocument: checkAnyPermission(['presales_document.generate_scope_document.export', 'presales_document.generate_scope_document', 'Documentations.Scope']),

    // Granular Generate Proposal Document Permissions
    canCreateProposalDocument: checkAnyPermission(['presales_document.generate_proposal_document.create', 'presales_document.generate_proposal_document', 'Documentations.Proposal']),
    canEditProposalDocument: checkAnyPermission(['presales_document.generate_proposal_document.edit', 'presales_document.generate_proposal_document', 'Documentations.Proposal']),
    canDeleteProposalDocument: checkAnyPermission(['presales_document.generate_proposal_document.delete', 'presales_document.generate_proposal_document', 'Documentations.Proposal']),
    canViewProposalDocumentOverview: checkAnyPermission([
      'presales_document.generate_proposal_document.overview',
      'presales_document.generate_proposal_document.view',
      'presales_document.generate_proposal_document',
      'Documentations.Proposal',
    ]),
    canImportProposalDocument: checkAnyPermission(['presales_document.generate_proposal_document.import', 'presales_document.generate_proposal_document', 'Documentations.Proposal']),
    canExportProposalDocument: checkAnyPermission(['presales_document.generate_proposal_document.export', 'presales_document.generate_proposal_document', 'Documentations.Proposal']),

    // Granular Test Plan Permissions
    canCreateTestPlan: checkAnyPermission(['test_plan.create', 'test_plan', 'Projects.TestPlan']),
    canEditTestPlan: checkAnyPermission(['test_plan.edit', 'test_plan', 'Projects.TestPlan']),
    canDeleteTestPlan: checkAnyPermission(['test_plan.delete', 'test_plan', 'Projects.TestPlan']),
    canViewTestPlanOverview: checkAnyPermission([
      'test_plan.overview',
      'test_plan.view',
      'test_plan',
      'Projects.TestPlan',
    ]),
    canImportTestPlan: checkAnyPermission(['test_plan.import', 'test_plan', 'Projects.TestPlan']),
    canExportTestPlan: checkAnyPermission(['test_plan.export', 'test_plan', 'Projects.TestPlan']),

    // Granular Test Case Permissions
    canCreateTestCase: checkAnyPermission(['test_case.create', 'test_case', 'Projects.TestCase']),
    canEditTestCase: checkAnyPermission(['test_case.edit', 'test_case', 'Projects.TestCase']),
    canDeleteTestCase: checkAnyPermission(['test_case.delete', 'test_case', 'Projects.TestCase']),
    canViewTestCaseOverview: checkAnyPermission([
      'test_case.overview',
      'test_case.view',
      'test_case',
      'Projects.TestCase',
    ]),
    canImportTestCase: checkAnyPermission(['test_case.import', 'test_case', 'Projects.TestCase']),
    canExportTestCase: checkAnyPermission(['test_case.export', 'test_case', 'Projects.TestCase']),

    // Granular Defects Permissions
    canCreateDefects: checkAnyPermission(['defects.create', 'defects', 'Defect.View']),
    canEditDefects: checkAnyPermission(['defects.edit', 'defects', 'Defect.View']),
    canDeleteDefects: checkAnyPermission(['defects.delete', 'defects', 'Defect.View']),
    canViewDefectsOverview: checkAnyPermission([
      'defects.overview',
      'defects.view',
      'defects',
      'Defect.View',
    ]),
    canImportDefects: checkAnyPermission(['defects.import', 'defects', 'Defect.View']),
    canExportDefects: checkAnyPermission(['defects.export', 'defects', 'Defect.View']),

    // Granular SLA Permissions
    canCreateSla: checkAnyPermission(['sla.create', 'sla']),
    canEditSla: checkAnyPermission(['sla.edit', 'sla']),
    canDeleteSla: checkAnyPermission(['sla.delete', 'sla']),
    canViewSlaOverview: checkAnyPermission([
      'sla.overview',
      'sla.view',
      'sla',
    ]),
    canImportSla: checkAnyPermission(['sla.import', 'sla']),
    canExportSla: checkAnyPermission(['sla.export', 'sla']),

    // Granular Test Reports Permissions
    canCreateTestReports: checkAnyPermission(['test_reports.create', 'test_reports']),
    canEditTestReports: checkAnyPermission(['test_reports.edit', 'test_reports']),
    canDeleteTestReports: checkAnyPermission(['test_reports.delete', 'test_reports']),
    canViewTestReportsOverview: checkAnyPermission([
      'test_reports.overview',
      'test_reports.view',
      'test_reports',
    ]),
    canImportTestReports: checkAnyPermission(['test_reports.import', 'test_reports']),
    // Granular Dashboard Overview Permissions
    canViewAdminDashboardOverview: checkAnyPermission(['crm_admin_dashboard.overview', 'crm_admin_dashboard', 'admin_dashboard.overview', 'admin_dashboard', 'RoleDashboard.Admin']),
    canViewRegionalManagerDashboardOverview: checkAnyPermission(['regional_manager_dashboard.overview', 'regional_manager_dashboard', 'RoleDashboard.RegionalManager']),
    canViewCeoDashboardOverview: checkAnyPermission(['ceo_dashboard.overview', 'ceo_dashboard', 'RoleDashboard.CEO']),
    canViewStoreManagerDashboardOverview: checkAnyPermission(['store_manager_dashboard.overview', 'store_manager_dashboard', 'RoleDashboard.StoreManager']),
    canViewInventoryManagerDashboardOverview: checkAnyPermission(['inventory_manager_dashboard.overview', 'inventory_manager_dashboard', 'RoleDashboard.InventoryManager']),
    canViewSalesAssociateDashboardOverview: checkAnyPermission(['sales_associate_dashboard.overview', 'sales_associate_dashboard', 'RoleDashboard.SalesAssociate']),
    
    // Granular Tickets Permissions
    canCreateTickets: checkAnyPermission(['service_support.tickets.create', 'service_support.tickets', 'Tickets.Create', 'Tickets.View']),
    canEditTickets: checkAnyPermission(['service_support.tickets.edit', 'service_support.tickets', 'Tickets.Edit', 'Tickets.View']),
    canDeleteTickets: checkAnyPermission(['service_support.tickets.delete', 'service_support.tickets', 'Tickets.Delete', 'Tickets.View']),
    canViewTicketsOverview: checkAnyPermission([
      'service_support.tickets.overview',
      'service_support.tickets.view',
      'service_support.tickets',
      'Tickets.View',
    ]),
    canImportTickets: checkAnyPermission(['service_support.tickets.import', 'service_support.tickets', 'Tickets.View']),
    canExportTickets: checkAnyPermission(['service_support.tickets.export', 'service_support.tickets', 'Tickets.View']),

    // Granular Incident Permissions
    canCreateIncident: checkAnyPermission(['service_support.incident.create', 'service_support.incident', 'Settings.Incident']),
    canEditIncident: checkAnyPermission(['service_support.incident.edit', 'service_support.incident', 'Settings.Incident']),
    canDeleteIncident: checkAnyPermission(['service_support.incident.delete', 'service_support.incident', 'Settings.Incident']),
    canViewIncidentOverview: checkAnyPermission([
      'service_support.incident.overview',
      'service_support.incident.view',
      'service_support.incident',
      'Settings.Incident',
    ]),
    canImportIncident: checkAnyPermission(['service_support.incident.import', 'service_support.incident', 'Settings.Incident']),
    canExportIncident: checkAnyPermission(['service_support.incident.export', 'service_support.incident', 'Settings.Incident']),

    // Granular Knowledge Base Permissions
    canCreateKnowledgeBase: checkAnyPermission(['service_support.knowledge_base.create', 'service_support.knowledge_base', 'Settings.KnowledgeBase']),
    canEditKnowledgeBase: checkAnyPermission(['service_support.knowledge_base.edit', 'service_support.knowledge_base', 'Settings.KnowledgeBase']),
    canDeleteKnowledgeBase: checkAnyPermission(['service_support.knowledge_base.delete', 'service_support.knowledge_base', 'Settings.KnowledgeBase']),
    canViewKnowledgeBaseOverview: checkAnyPermission([
      'service_support.knowledge_base.overview',
      'service_support.knowledge_base.view',
      'service_support.knowledge_base',
      'Settings.KnowledgeBase',
    ]),
    canImportKnowledgeBase: checkAnyPermission(['service_support.knowledge_base.import', 'service_support.knowledge_base', 'Settings.KnowledgeBase']),
    canExportKnowledgeBase: checkAnyPermission(['service_support.knowledge_base.export', 'service_support.knowledge_base', 'Settings.KnowledgeBase']),

    // Granular Customer Retention Permissions
    canCreateCustomerRetention: checkAnyPermission(['customer_success.customer_retention.create', 'customer_success.customer_retention', 'CustomerSuccess.Retention']),
    canEditCustomerRetention: checkAnyPermission(['customer_success.customer_retention.edit', 'customer_success.customer_retention', 'CustomerSuccess.Retention']),
    canDeleteCustomerRetention: checkAnyPermission(['customer_success.customer_retention.delete', 'customer_success.customer_retention', 'CustomerSuccess.Retention']),
    canViewCustomerRetentionOverview: checkAnyPermission([
      'customer_success.customer_retention.overview',
      'customer_success.customer_retention.view',
      'customer_success.customer_retention',
      'CustomerSuccess.Retention',
    ]),
    canImportCustomerRetention: checkAnyPermission(['customer_success.customer_retention.import', 'customer_success.customer_retention', 'CustomerSuccess.Retention']),
    canExportCustomerRetention: checkAnyPermission(['customer_success.customer_retention.export', 'customer_success.customer_retention', 'CustomerSuccess.Retention']),

    // Granular Customer Retention Setup Permissions
    canCreateCustomerRetentionSetup: checkAnyPermission(['customer_success.customer_retention_setup.create', 'customer_success.customer_retention_setup', 'CustomerSuccess.Setup']),
    canEditCustomerRetentionSetup: checkAnyPermission(['customer_success.customer_retention_setup.edit', 'customer_success.customer_retention_setup', 'CustomerSuccess.Setup']),
    canDeleteCustomerRetentionSetup: checkAnyPermission(['customer_success.customer_retention_setup.delete', 'customer_success.customer_retention_setup', 'CustomerSuccess.Setup']),
    canViewCustomerRetentionSetupOverview: checkAnyPermission([
      'customer_success.customer_retention_setup.overview',
      'customer_success.customer_retention_setup.view',
      'customer_success.customer_retention_setup',
      'CustomerSuccess.Setup',
    ]),
    canImportCustomerRetentionSetup: checkAnyPermission(['customer_success.customer_retention_setup.import', 'customer_success.customer_retention_setup', 'CustomerSuccess.Setup']),
    canExportCustomerRetentionSetup: checkAnyPermission(['customer_success.customer_retention_setup.export', 'customer_success.customer_retention_setup', 'CustomerSuccess.Setup']),

    // Granular Client Onboarding Permissions
    canCreateClientOnboarding: checkAnyPermission(['customer_success.client_onboarding.create', 'customer_success.client_onboarding', 'CustomerSuccess.Onboarding']),
    canEditClientOnboarding: checkAnyPermission(['customer_success.client_onboarding.edit', 'customer_success.client_onboarding', 'CustomerSuccess.Onboarding']),
    canDeleteClientOnboarding: checkAnyPermission(['customer_success.client_onboarding.delete', 'customer_success.client_onboarding', 'CustomerSuccess.Onboarding']),
    canViewClientOnboardingOverview: checkAnyPermission([
      'customer_success.client_onboarding.overview',
      'customer_success.client_onboarding.view',
      'customer_success.client_onboarding',
      'CustomerSuccess.Onboarding',
    ]),
    canImportClientOnboarding: checkAnyPermission(['customer_success.client_onboarding.import', 'customer_success.client_onboarding', 'CustomerSuccess.Onboarding']),
    canExportClientOnboarding: checkAnyPermission(['customer_success.client_onboarding.export', 'customer_success.client_onboarding', 'CustomerSuccess.Onboarding']),

    // Granular Customer Churn Permissions
    canCreateCustomerChurn: checkAnyPermission(['customer_success.customer_churn.create', 'customer_success.customer_churn', 'Settings.CustomerChurn']),
    canEditCustomerChurn: checkAnyPermission(['customer_success.customer_churn.edit', 'customer_success.customer_churn', 'Settings.CustomerChurn']),
    canDeleteCustomerChurn: checkAnyPermission(['customer_success.customer_churn.delete', 'customer_success.customer_churn', 'Settings.CustomerChurn']),
    canViewCustomerChurnOverview: checkAnyPermission([
      'customer_success.customer_churn.overview',
      'customer_success.customer_churn.view',
      'customer_success.customer_churn',
      'Settings.CustomerChurn',
    ]),
    canImportCustomerChurn: checkAnyPermission(['customer_success.customer_churn.import', 'customer_success.customer_churn', 'Settings.CustomerChurn']),
    canExportCustomerChurn: checkAnyPermission(['customer_success.customer_churn.export', 'customer_success.customer_churn', 'Settings.CustomerChurn']),

    // Granular Feedbacks Permissions
    canCreateFeedbacks: checkAnyPermission(['feedback_management.feedbacks.create', 'feedback_management.feedbacks', 'Feedback.View']),
    canEditFeedbacks: checkAnyPermission(['feedback_management.feedbacks.edit', 'feedback_management.feedbacks', 'Feedback.View']),
    canDeleteFeedbacks: checkAnyPermission(['feedback_management.feedbacks.delete', 'feedback_management.feedbacks', 'Feedback.View']),
    canViewFeedbacksOverview: checkAnyPermission([
      'feedback_management.feedbacks.overview',
      'feedback_management.feedbacks.view',
      'feedback_management.feedbacks',
      'Feedback.View',
    ]),
    canImportFeedbacks: checkAnyPermission(['feedback_management.feedbacks.import', 'feedback_management.feedbacks', 'Feedback.View']),
    canExportFeedbacks: checkAnyPermission(['feedback_management.feedbacks.export', 'feedback_management.feedbacks', 'Feedback.View']),

    // Granular Sprint Permissions
    canCreateSprint: checkAnyPermission(['sprint.create', 'sprint', 'Projects.Sprint']),
    canEditSprint: checkAnyPermission(['sprint.edit', 'sprint', 'Projects.Sprint']),
    canDeleteSprint: checkAnyPermission(['sprint.delete', 'sprint', 'Projects.Sprint']),
    canViewSprintOverview: checkAnyPermission([
      'sprint.overview',
      'sprint.view',
      'sprint',
      'Projects.Sprint',
    ]),
    canImportSprint: checkAnyPermission(['sprint.import', 'sprint', 'Projects.Sprint']),
    canExportSprint: checkAnyPermission(['sprint.export', 'sprint', 'Projects.Sprint']),

    // Granular Timesheet Permissions
    canCreateTimesheet: checkAnyPermission(['timesheet.create', 'timesheet', 'Timesheets.View']),
    canEditTimesheet: checkAnyPermission(['timesheet.edit', 'timesheet', 'Timesheets.View']),
    canDeleteTimesheet: checkAnyPermission(['timesheet.delete', 'timesheet', 'Timesheets.View']),
    canViewTimesheetOverview: checkAnyPermission([
      'timesheet.overview',
      'timesheet.view',
      'timesheet',
      'Timesheets.View',
    ]),
    canImportTimesheet: checkAnyPermission(['timesheet.import', 'timesheet', 'Timesheets.View']),
    canExportTimesheet: checkAnyPermission(['timesheet.export', 'timesheet', 'Timesheets.View']),

    // Granular Scrum Meeting Permissions
    canCreateScrumMeeting: checkAnyPermission(['scrum_meeting.create', 'scrum_meeting', 'ScrumMeetings.View']),
    canEditScrumMeeting: checkAnyPermission(['scrum_meeting.edit', 'scrum_meeting', 'ScrumMeetings.View']),
    canDeleteScrumMeeting: checkAnyPermission(['scrum_meeting.delete', 'scrum_meeting', 'ScrumMeetings.View']),
    canViewScrumMeetingOverview: checkAnyPermission([
      'scrum_meeting.overview',
      'scrum_meeting.view',
      'scrum_meeting',
      'ScrumMeetings.View',
    ]),
    canImportScrumMeeting: checkAnyPermission(['scrum_meeting.import', 'scrum_meeting', 'ScrumMeetings.View']),
    canExportScrumMeeting: checkAnyPermission(['scrum_meeting.export', 'scrum_meeting', 'ScrumMeetings.View']),

    // Granular Track Project Permissions
    canCreateTrackProject: checkAnyPermission(['projects.track_project.create', 'projects.track_project', 'Projects.Track']),
    canEditTrackProject: checkAnyPermission(['projects.track_project.edit', 'projects.track_project', 'Projects.Track']),
    canDeleteTrackProject: checkAnyPermission(['projects.track_project.delete', 'projects.track_project', 'Projects.Track']),
    canViewTrackProjectOverview: checkAnyPermission(['projects.track_project.overview', 'projects.track_project.view', 'projects.track_project', 'Projects.Track']),
    canImportTrackProject: checkAnyPermission(['projects.track_project.import', 'projects.track_project', 'Projects.Track']),
    canExportTrackProject: checkAnyPermission(['projects.track_project.export', 'projects.track_project', 'Projects.Track']),

    // Granular All Projects Permissions
    canCreateAllProjects: checkAnyPermission(['projects.all_projects.create', 'projects.all_projects', 'Projects.All']),
    canEditAllProjects: checkAnyPermission(['projects.all_projects.edit', 'projects.all_projects', 'Projects.All']),
    canDeleteAllProjects: checkAnyPermission(['projects.all_projects.delete', 'projects.all_projects', 'Projects.All']),
    canViewAllProjectsOverview: checkAnyPermission(['projects.all_projects.overview', 'projects.all_projects.view', 'projects.all_projects', 'Projects.All']),
    canImportAllProjects: checkAnyPermission(['projects.all_projects.import', 'projects.all_projects', 'Projects.All']),
    canExportAllProjects: checkAnyPermission(['projects.all_projects.export', 'projects.all_projects', 'Projects.All']),

    // Granular Milestone Tracker Permissions
    canCreateMilestoneTracker: checkAnyPermission(['projects.milestone_tracker.create', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),
    canEditMilestoneTracker: checkAnyPermission(['projects.milestone_tracker.edit', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),
    canDeleteMilestoneTracker: checkAnyPermission(['projects.milestone_tracker.delete', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),
    canViewMilestoneTrackerOverview: checkAnyPermission(['projects.milestone_tracker.overview', 'projects.milestone_tracker.view', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),
    canImportMilestoneTracker: checkAnyPermission(['projects.milestone_tracker.import', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),
    canExportMilestoneTracker: checkAnyPermission(['projects.milestone_tracker.export', 'projects.milestone_tracker', 'Projects.MilestoneTracker']),

    // Granular Milestones Permissions
    canCreateMilestones: checkAnyPermission(['projects.milestones.create', 'projects.milestones', 'Projects.Milestones']),
    canEditMilestones: checkAnyPermission(['projects.milestones.edit', 'projects.milestones', 'Projects.Milestones']),
    canDeleteMilestones: checkAnyPermission(['projects.milestones.delete', 'projects.milestones', 'Projects.Milestones']),
    canViewMilestonesOverview: checkAnyPermission(['projects.milestones.overview', 'projects.milestones.view', 'projects.milestones', 'Projects.Milestones']),
    canImportMilestones: checkAnyPermission(['projects.milestones.import', 'projects.milestones', 'Projects.Milestones']),
    canExportMilestones: checkAnyPermission(['projects.milestones.export', 'projects.milestones', 'Projects.Milestones']),

    // Granular Deliverables Permissions
    canCreateDeliverables: checkAnyPermission(['projects.deliverables.create', 'projects.deliverables', 'Projects.Milestones']),
    canEditDeliverables: checkAnyPermission(['projects.deliverables.edit', 'projects.deliverables', 'Projects.Milestones']),
    canDeleteDeliverables: checkAnyPermission(['projects.deliverables.delete', 'projects.deliverables', 'Projects.Milestones']),
    canViewDeliverablesOverview: checkAnyPermission(['projects.deliverables.overview', 'projects.deliverables.view', 'projects.deliverables', 'Projects.Milestones']),
    canImportDeliverables: checkAnyPermission(['projects.deliverables.import', 'projects.deliverables', 'Projects.Milestones']),
    canExportDeliverables: checkAnyPermission(['projects.deliverables.export', 'projects.deliverables', 'Projects.Milestones']),

    // Granular Project Task Allocation Permissions
    canCreateProjectTaskAllocation: checkAnyPermission(['projects.project_task_allocation.create', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),
    canEditProjectTaskAllocation: checkAnyPermission(['projects.project_task_allocation.edit', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),
    canDeleteProjectTaskAllocation: checkAnyPermission(['projects.project_task_allocation.delete', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),
    canViewProjectTaskAllocationOverview: checkAnyPermission(['projects.project_task_allocation.overview', 'projects.project_task_allocation.view', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),
    canImportProjectTaskAllocation: checkAnyPermission(['projects.project_task_allocation.import', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),
    canExportProjectTaskAllocation: checkAnyPermission(['projects.project_task_allocation.export', 'projects.project_task_allocation', 'Projects.ProjectTaskAllocation']),

    // Granular Predict Completion Permissions
    canCreatePredictCompletion: checkAnyPermission(['projects.predict_completion.create', 'projects.predict_completion']),
    canEditPredictCompletion: checkAnyPermission(['projects.predict_completion.edit', 'projects.predict_completion']),
    canDeletePredictCompletion: checkAnyPermission(['projects.predict_completion.delete', 'projects.predict_completion']),
    canViewPredictCompletionOverview: checkAnyPermission(['projects.predict_completion.overview', 'projects.predict_completion.view', 'projects.predict_completion']),
    canImportPredictCompletion: checkAnyPermission(['projects.predict_completion.import', 'projects.predict_completion']),
    canExportPredictCompletion: checkAnyPermission(['projects.predict_completion.export', 'projects.predict_completion']),

    // Granular Gantt Chart Permissions
    canCreateGanttChart: checkAnyPermission(['projects.gantt_chart.create', 'projects.gantt_chart', 'Projects.Gantt']),
    canEditGanttChart: checkAnyPermission(['projects.gantt_chart.edit', 'projects.gantt_chart', 'Projects.Gantt']),
    canDeleteGanttChart: checkAnyPermission(['projects.gantt_chart.delete', 'projects.gantt_chart', 'Projects.Gantt']),
    canViewGanttChartOverview: checkAnyPermission(['projects.gantt_chart.overview', 'projects.gantt_chart.view', 'projects.gantt_chart', 'Projects.Gantt']),
    canImportGanttChart: checkAnyPermission(['projects.gantt_chart.import', 'projects.gantt_chart', 'Projects.Gantt']),
    canExportGanttChart: checkAnyPermission(['projects.gantt_chart.export', 'projects.gantt_chart', 'Projects.Gantt']),

    // Granular Project Initiation Document Permissions
    canCreateProjectInitiationDocument: checkAnyPermission(['project_plan_document.project_initiation_document.create', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),
    canEditProjectInitiationDocument: checkAnyPermission(['project_plan_document.project_initiation_document.edit', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),
    canDeleteProjectInitiationDocument: checkAnyPermission(['project_plan_document.project_initiation_document.delete', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),
    canViewProjectInitiationDocumentOverview: checkAnyPermission(['project_plan_document.project_initiation_document.overview', 'project_plan_document.project_initiation_document.view', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),
    canImportProjectInitiationDocument: checkAnyPermission(['project_plan_document.project_initiation_document.import', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),
    canExportProjectInitiationDocument: checkAnyPermission(['project_plan_document.project_initiation_document.export', 'project_plan_document.project_initiation_document', 'Documentations.BRD']),

    // Granular Work Breakdown Structure Permissions
    canCreateWorkBreakDownStructure: checkAnyPermission(['project_plan_document.work_break_down_structure.create', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),
    canEditWorkBreakDownStructure: checkAnyPermission(['project_plan_document.work_break_down_structure.edit', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),
    canDeleteWorkBreakDownStructure: checkAnyPermission(['project_plan_document.work_break_down_structure.delete', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),
    canViewWorkBreakDownStructureOverview: checkAnyPermission(['project_plan_document.work_break_down_structure.overview', 'project_plan_document.work_break_down_structure.view', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),
    canImportWorkBreakDownStructure: checkAnyPermission(['project_plan_document.work_break_down_structure.import', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),
    canExportWorkBreakDownStructure: checkAnyPermission(['project_plan_document.work_break_down_structure.export', 'project_plan_document.work_break_down_structure', 'Documentations.WBS']),

    // Granular Resource Plan Permissions
    canCreateResourcePlan: checkAnyPermission(['project_plan_document.resource_plan.create', 'project_plan_document.resource_plan', 'Documentations.SRS']),
    canEditResourcePlan: checkAnyPermission(['project_plan_document.resource_plan.edit', 'project_plan_document.resource_plan', 'Documentations.SRS']),
    canDeleteResourcePlan: checkAnyPermission(['project_plan_document.resource_plan.delete', 'project_plan_document.resource_plan', 'Documentations.SRS']),
    canViewResourcePlanOverview: checkAnyPermission(['project_plan_document.resource_plan.overview', 'project_plan_document.resource_plan.view', 'project_plan_document.resource_plan', 'Documentations.SRS']),
    canImportResourcePlan: checkAnyPermission(['project_plan_document.resource_plan.import', 'project_plan_document.resource_plan', 'Documentations.SRS']),
    canExportResourcePlan: checkAnyPermission(['project_plan_document.resource_plan.export', 'project_plan_document.resource_plan', 'Documentations.SRS']),

    // Granular Project Plan Document Permissions
    canCreateProjectPlanDocument: checkAnyPermission(['project_plan_document.project_plan_document.create', 'project_plan_document.project_plan_document', 'Documentations.FRD']),
    canEditProjectPlanDocument: checkAnyPermission(['project_plan_document.project_plan_document.edit', 'project_plan_document.project_plan_document', 'Documentations.FRD']),
    canDeleteProjectPlanDocument: checkAnyPermission(['project_plan_document.project_plan_document.delete', 'project_plan_document.project_plan_document', 'Documentations.FRD']),
    canViewProjectPlanDocumentOverview: checkAnyPermission(['project_plan_document.project_plan_document.overview', 'project_plan_document.project_plan_document.view', 'project_plan_document.project_plan_document', 'Documentations.FRD']),
    canImportProjectPlanDocument: checkAnyPermission(['project_plan_document.project_plan_document.import', 'project_plan_document.project_plan_document', 'Documentations.FRD']),
    canExportProjectPlanDocument: checkAnyPermission(['project_plan_document.project_plan_document.export', 'project_plan_document.project_plan_document', 'Documentations.FRD']),

    // Granular Solution Architecture Document Permissions
    canCreateSolutionArchitectureDocument: checkAnyPermission(['design_documents.solution_architecture_document.create', 'design_documents.solution_architecture_document', 'Documentations.BRD']),
    canEditSolutionArchitectureDocument: checkAnyPermission(['design_documents.solution_architecture_document.edit', 'design_documents.solution_architecture_document', 'Documentations.BRD']),
    canDeleteSolutionArchitectureDocument: checkAnyPermission(['design_documents.solution_architecture_document.delete', 'design_documents.solution_architecture_document', 'Documentations.BRD']),
    canViewSolutionArchitectureDocumentOverview: checkAnyPermission(['design_documents.solution_architecture_document.overview', 'design_documents.solution_architecture_document.view', 'design_documents.solution_architecture_document', 'Documentations.BRD']),
    canImportSolutionArchitectureDocument: checkAnyPermission(['design_documents.solution_architecture_document.import', 'design_documents.solution_architecture_document', 'Documentations.BRD']),
    canExportSolutionArchitectureDocument: checkAnyPermission(['design_documents.solution_architecture_document.export', 'design_documents.solution_architecture_document', 'Documentations.BRD']),

    // Granular SOW Document Permissions
    canCreateSOWDocument: checkAnyPermission(['design_documents.sow_document.create', 'design_documents.sow_document', 'Documentations.SOW']),
    canEditSOWDocument: checkAnyPermission(['design_documents.sow_document.edit', 'design_documents.sow_document', 'Documentations.SOW']),
    canDeleteSOWDocument: checkAnyPermission(['design_documents.sow_document.delete', 'design_documents.sow_document', 'Documentations.SOW']),
    canViewSOWDocumentOverview: checkAnyPermission(['design_documents.sow_document.overview', 'design_documents.sow_document.view', 'design_documents.sow_document', 'Documentations.SOW']),
    canImportSOWDocument: checkAnyPermission(['design_documents.sow_document.import', 'design_documents.sow_document', 'Documentations.SOW']),
    canExportSOWDocument: checkAnyPermission(['design_documents.sow_document.export', 'design_documents.sow_document', 'Documentations.SOW']),

    // Granular HLD Document Permissions
    canCreateHLDDocument: checkAnyPermission(['design_documents.hld_document.create', 'design_documents.hld_document', 'Documentations.FRD']),
    canEditHLDDocument: checkAnyPermission(['design_documents.hld_document.edit', 'design_documents.hld_document', 'Documentations.FRD']),
    canDeleteHLDDocument: checkAnyPermission(['design_documents.hld_document.delete', 'design_documents.hld_document', 'Documentations.FRD']),
    canViewHLDDocumentOverview: checkAnyPermission(['design_documents.hld_document.overview', 'design_documents.hld_document.view', 'design_documents.hld_document', 'Documentations.FRD']),
    canImportHLDDocument: checkAnyPermission(['design_documents.hld_document.import', 'design_documents.hld_document', 'Documentations.FRD']),
    canExportHLDDocument: checkAnyPermission(['design_documents.hld_document.export', 'design_documents.hld_document', 'Documentations.FRD']),

    // Granular LLD Document Permissions
    canCreateLLDDocument: checkAnyPermission(['design_documents.lld_document.create', 'design_documents.lld_document', 'Documentations.SRS']),
    canEditLLDDocument: checkAnyPermission(['design_documents.lld_document.edit', 'design_documents.lld_document', 'Documentations.SRS']),
    canDeleteLLDDocument: checkAnyPermission(['design_documents.lld_document.delete', 'design_documents.lld_document', 'Documentations.SRS']),
    canViewLLDDocumentOverview: checkAnyPermission(['design_documents.lld_document.overview', 'design_documents.lld_document.view', 'design_documents.lld_document', 'Documentations.SRS']),
    canImportLLDDocument: checkAnyPermission(['design_documents.lld_document.import', 'design_documents.lld_document', 'Documentations.SRS']),
    canExportLLDDocument: checkAnyPermission(['design_documents.lld_document.export', 'design_documents.lld_document', 'Documentations.SRS']),

    // Granular Database Design Document Permissions
    canCreateDatabaseDesignDocument: checkAnyPermission(['design_documents.database_design_document.create', 'design_documents.database_design_document', 'Documentations.SRS']),
    canEditDatabaseDesignDocument: checkAnyPermission(['design_documents.database_design_document.edit', 'design_documents.database_design_document', 'Documentations.SRS']),
    canDeleteDatabaseDesignDocument: checkAnyPermission(['design_documents.database_design_document.delete', 'design_documents.database_design_document', 'Documentations.SRS']),
    canViewDatabaseDesignDocumentOverview: checkAnyPermission(['design_documents.database_design_document.overview', 'design_documents.database_design_document.view', 'design_documents.database_design_document', 'Documentations.SRS']),
    canImportDatabaseDesignDocument: checkAnyPermission(['design_documents.database_design_document.import', 'design_documents.database_design_document', 'Documentations.SRS']),
    canExportDatabaseDesignDocument: checkAnyPermission(['design_documents.database_design_document.export', 'design_documents.database_design_document', 'Documentations.SRS']),

    // Granular Resource Management Permissions
    canCreateResourceList: checkAnyPermission(['resource_management.resource_list.create', 'resource_management.resource_list', 'Resource.List']),
    canEditResourceList: checkAnyPermission(['resource_management.resource_list.edit', 'resource_management.resource_list', 'Resource.List']),
    canDeleteResourceList: checkAnyPermission(['resource_management.resource_list.delete', 'resource_management.resource_list', 'Resource.List']),
    canViewResourceListOverview: checkAnyPermission(['resource_management.resource_list.overview', 'resource_management.resource_list.view', 'resource_management.resource_list', 'Resource.List']),

    canCreateResourceAllocation: checkAnyPermission(['resource_management.resource_allocation.create', 'resource_management.resource_allocation', 'Resource.Allocation']),
    canEditResourceAllocation: checkAnyPermission(['resource_management.resource_allocation.edit', 'resource_management.resource_allocation', 'Resource.Allocation']),
    canDeleteResourceAllocation: checkAnyPermission(['resource_management.resource_allocation.delete', 'resource_management.resource_allocation', 'Resource.Allocation']),
    canViewResourceAllocationOverview: checkAnyPermission(['resource_management.resource_allocation.overview', 'resource_management.resource_allocation.view', 'resource_management.resource_allocation', 'Resource.Allocation']),

    canViewResourceUtilisationOverview: checkAnyPermission(['resource_management.resource_utilisation.overview', 'resource_management.resource_utilisation.view', 'resource_management.resource_utilisation', 'Resource.Utilisation']),
    canViewResourceTrackingOverview: checkAnyPermission(['resource_management.resource_tracking.overview', 'resource_management.resource_tracking.view', 'resource_management.resource_tracking', 'Resource.Tracking']),

    // Bench Management
    canCreateBenchManagement: checkAnyPermission(['bench_management.create', 'bench_management']),
    canEditBenchManagement: checkAnyPermission(['bench_management.edit', 'bench_management']),
    canDeleteBenchManagement: checkAnyPermission(['bench_management.delete', 'bench_management']),
    canViewBenchManagementOverview: checkAnyPermission(['bench_management.overview', 'bench_management.view', 'bench_management']),

    // Competitor Tracking
    canCreateCompetitorTracking: checkAnyPermission(['competitor_tracking.create', 'competitor_tracking']),
    canEditCompetitorTracking: checkAnyPermission(['competitor_tracking.edit', 'competitor_tracking']),
    canDeleteCompetitorTracking: checkAnyPermission(['competitor_tracking.delete', 'competitor_tracking']),
    canViewCompetitorTrackingOverview: checkAnyPermission(['competitor_tracking.overview', 'competitor_tracking.view', 'competitor_tracking']),

    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
  };
}