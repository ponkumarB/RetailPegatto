import { fetchFromApi } from '@/service/apiClient';

// Helper to compile query parameters
function compileQueryParams(params?: Record<string, any>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

// ==========================================
// 1. WorkflowModule API
// ==========================================
export async function fetchWorkflowModules(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowModuleList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowModulesWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowModulewithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowModules(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowModuleSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowModules(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowModuleFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowModule(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowModuleCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowModule(data: any): Promise<any> {
  const id = data.id || '';
  return fetchFromApi(`/useradmin/WorkflowModuleCRUD/${id ? `?id=${id}` : ''}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowModule(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowModuleCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 2. WorkflowEvent API
// ==========================================
export async function fetchWorkflowEvents(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowEventList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowEventsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowEventwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowEvents(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowEventSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowEvents(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowEventFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowEvent(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowEventCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowEvent(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowEventCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowEvent(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowEventCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 3. WorkflowRuleCreation API
// ==========================================
export async function fetchWorkflowRules(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowRuleCreationList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowRulesWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowRuleCreationwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowRules(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowRuleCreationSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowRules(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowRuleCreationFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowRule(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowRuleCreationCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowRule(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowRuleCreationCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowRule(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowRuleCreationCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 4. WorkflowCondition API
// ==========================================
export async function fetchWorkflowConditions(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowConditionList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowConditionsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowConditionwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowConditions(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowConditionSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowConditions(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowConditionFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowCondition(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowConditionCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowCondition(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowConditionCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowCondition(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowConditionCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 5. WorkflowAction API
// ==========================================
export async function fetchWorkflowActions(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowActionList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowActionsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowActionwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowActions(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowActionSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowActions(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowActionFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowAction(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowActionCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowAction(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowActionCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowAction(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowActionCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 6. EmailTemplate API
// ==========================================
export async function fetchEmailTemplates(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/EmailTemplateList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchEmailTemplatesWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/EmailTemplatewithoutpagination/', { method: 'GET' });
}
export async function searchEmailTemplates(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/EmailTemplateSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterEmailTemplates(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/EmailTemplateFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createEmailTemplate(data: any): Promise<any> {
  return fetchFromApi('/useradmin/EmailTemplateCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateEmailTemplate(data: any): Promise<any> {
  return fetchFromApi('/useradmin/EmailTemplateCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteEmailTemplate(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/EmailTemplateCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 7. WorkflowNotificationTemplate API
// ==========================================
export async function fetchNotificationTemplates(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationTemplateList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchNotificationTemplatesWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationTemplatewithoutpagination/', { method: 'GET' });
}
export async function searchNotificationTemplates(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationTemplateSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterNotificationTemplates(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationTemplateFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createNotificationTemplate(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationTemplateCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateNotificationTemplate(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationTemplateCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteNotificationTemplate(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationTemplateCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 8. WorkflowNotification API
// ==========================================
export async function fetchWorkflowNotifications(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowNotificationsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowNotifications(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowNotifications(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowNotification(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowNotification(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowNotification(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 9. WorkflowExecution API
// ==========================================
export async function fetchWorkflowExecutions(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowExecutionList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchWorkflowExecutionsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowExecutionwithoutpagination/', { method: 'GET' });
}
export async function searchWorkflowExecutions(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowExecutionSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterWorkflowExecutions(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowExecutionFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createWorkflowExecution(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowExecutionCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateWorkflowExecution(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowExecutionCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteWorkflowExecution(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowExecutionCRUD/?id=${id}`, { method: 'DELETE' });
}

// ==========================================
// 10. WorkflowNotificationLog API
// ==========================================
export async function fetchNotificationLogs(page?: number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationLogList/${compileQueryParams({ page })}`, { method: 'GET' });
}
export async function fetchNotificationLogsWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationLogwithoutpagination/', { method: 'GET' });
}
export async function searchNotificationLogs(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationLogSearch/${compileQueryParams({ search })}`, { method: 'GET' });
}
export async function filterNotificationLogs(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationLogFilter/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function createNotificationLog(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationLogCRUD/', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateNotificationLog(data: any): Promise<any> {
  return fetchFromApi('/useradmin/WorkflowNotificationLogCRUD/', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteNotificationLog(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/WorkflowNotificationLogCRUD/?id=${id}`, { method: 'DELETE' });
}

export async function logWorkflowChange(
  moduleName: string,
  actionDesc: string,
  recordId: string | number,
  orgId: number,
  workflowId?: number | null,
  templateId?: number | null
): Promise<void> {
  try {
    let resolvedWorkflowId = workflowId;
    if (!resolvedWorkflowId) {
      const rules = await fetchWorkflowRulesWithoutPagination();
      const list = Array.isArray(rules) ? rules : (rules?.data || rules?.results || []);
      if (list.length > 0) {
        resolvedWorkflowId = Number(list[0].id);
      } else {
        resolvedWorkflowId = 1;
      }
    }

    let resolvedTemplateId = templateId;
    if (!resolvedTemplateId) {
      const templates = await fetchNotificationTemplatesWithoutPagination();
      const list = Array.isArray(templates) ? templates : (templates?.data || templates?.results || []);
      if (list.length > 0) {
        resolvedTemplateId = Number(list[0].id);
      } else {
        resolvedTemplateId = 1;
      }
    }

    const email = typeof window !== 'undefined' ? (localStorage.getItem('email') || localStorage.getItem('username') || 'admin@crm.com') : 'admin@crm.com';

    await createWorkflowExecution({
      Workflow: Number(resolvedWorkflowId),
      Record_Id: String(recordId),
      Module: moduleName,
      Status: 'Success',
      Duration: 0,
      Error: actionDesc,
      Retry_Count: 0,
      Organization_Id: orgId || 1
    });

    await createNotificationLog({
      Notification: Number(resolvedTemplateId),
      Record_Id: String(recordId),
      Recipient: email,
      Channel: 'Email',
      Status: 'Sent',
      Response: actionDesc,
      Organization_Id: orgId || 1
    });
  } catch (err) {
    console.error('Error writing dual audit log', err);
  }
}

// ==========================================
// 12. Workflow Approval Setup API (/user/workflow/)
// ==========================================
export async function fetchWorkflowApprovalList(page: number = 1): Promise<any> {
  return fetchFromApi(`/user/WorkflowAllList/?page=${page}`, { method: 'GET' });
}

export async function searchWorkflowApproval(search: string): Promise<any> {
  return fetchFromApi('/user/workflowsearch/', {
    method: 'POST',
    body: JSON.stringify({ search }),
  });
}

export async function createWorkflowApproval(payload: any): Promise<any> {
  return fetchFromApi('/user/workflow/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWorkflowApproval(payload: any): Promise<any> {
  return fetchFromApi('/user/workflow/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkflowApproval(id: number | string): Promise<any> {
  return fetchFromApi(`/user/workflow/?id=${id}`, { method: 'DELETE' });
}

