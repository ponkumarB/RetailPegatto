import { fetchFromApi } from '@/service/apiClient';

/**
 * Fetch pending approvals list for user
 * Endpoint: POST /user/approvallistPagination/?page=${page}
 */
export async function fetchApprovedList(id: number | string, page: number = 1): Promise<any> {
  return fetchFromApi(`/user/approvallistPagination/?page=${page}`, {
    method: 'POST',
    body: JSON.stringify({ id: Number(id) }),
  });
}

/**
 * Update document approval status
 * Endpoint: PUT /user/DocumentapprovalCRUD/
 */
export async function editDocumentApproval(payload: any): Promise<any> {
  return fetchFromApi('/user/DocumentapprovalCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch overall marksheet details by ID
 * Endpoint: GET /user/OverallMarksheetCRUD/?id=${id}
 */
export async function fetchMarksheetOverallById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/OverallMarksheetCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update overall marksheet status
 * Endpoint: PATCH /user/OverallMarksheetCRUD/
 */
export async function updateMarksheetOverall(payload: any): Promise<any> {
  return fetchFromApi('/user/OverallMarksheetCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch student details by ID
 * Endpoint: GET /user/Student_Details_CRUD/?id=${id}
 */
export async function fetchStudentDetailsById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/Student_Details_CRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Fetch document approval details by document approval ID
 * Endpoint: GET /user/DocumentapprovalCRUD/?Documentapproval_Id=${docId}
 */
export async function fetchDocumentApprovalById(docId: number | string): Promise<any> {
  return fetchFromApi(`/user/DocumentapprovalCRUD/?Documentapproval_Id=${docId}`, {
    method: 'GET',
  });
}

/**
 * Patch setup student details
 * Endpoint: PATCH /education/SetupStudentDetailsList/
 */
export async function updateSetupStudentDetails(payload: any): Promise<any> {
  return fetchFromApi('/education/SetupStudentDetailsList/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Patch publish result status
 * Endpoint: PATCH /education/PublishResultCRUD/
 */
export async function updatePublishResult(payload: any): Promise<any> {
  return fetchFromApi('/education/PublishResultCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Workflow configuration by Name
 * Endpoint: GET /user/Workflowbyname/?Workflow_Name=${workflowName}
 */
export async function fetchWorkflowByName(workflowName: string): Promise<any> {
  return fetchFromApi(`/user/Workflowbyname/?Workflow_Name=${encodeURIComponent(workflowName)}`, {
    method: 'GET',
  });
}

/**
 * Create document approval entry
 * Endpoint: POST /user/DocumentapprovalCRUD/
 */
export async function createDocumentApproval(payload: any): Promise<any> {
  return fetchFromApi('/user/DocumentapprovalCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete existing document approval entries
 * Endpoint: POST /user/Documentapprovaldelete/
 */
export async function deleteDocumentApproval(ids: number | string | (number | string)[]): Promise<any> {
  return fetchFromApi('/user/Documentapprovaldelete/', {
    method: 'POST',
    body: JSON.stringify({
      id: Array.isArray(ids) ? ids : [ids],
    }),
  });
}

/**
 * Helper to process workflow approvals structure and post document approval
 */
export async function handleCreateDocumentApproval(
  requestId: any,
  requestNo: any,
  approvals: any,
  name: string,
  initiatedBy?: string
): Promise<any> {
  const headApproverId = parseInt(
    (typeof window !== 'undefined' && (localStorage.getItem('Edu_Reporting_to') || localStorage.getItem('Reporting_to'))) || '1',
    10
  );
  const headApproverName =
    (typeof window !== 'undefined' && (localStorage.getItem('Edu_Reporter_Name') || localStorage.getItem('Reporter_Name'))) || '';
  const headApproverRole =
    (typeof window !== 'undefined' && (localStorage.getItem('ReportHeadRole') || localStorage.getItem('Report_Head_Role'))) || '';

  const listOfApprovers: any[] = [];
  const numberOfApproversCount = approvals?.No_of_levels || 0;

  if (approvals?.Head_Approval === true) {
    listOfApprovers.push({
      id: headApproverId,
      Approvername: headApproverName,
      ApproverRole: headApproverRole,
      comments: '',
      approved_flg: '',
      Approved_flg: false,
      status: false,
      time: '',
    });
  }

  for (let i = 0; i < numberOfApproversCount; i++) {
    listOfApprovers.push({
      id: approvals?.Approver_details?.[i]?.Approver_Id,
      Approvername: approvals?.Approver_details?.[i]?.Approver_Name,
      ApproverRole: approvals?.Approver_details?.[i]?.Approver_Role,
      email: approvals?.Approver_details?.[i]?.email,
      comments: '',
      approved_flg: '',
      Approved_flg: false,
      status: false,
      time: '',
    });
  }

  try {
    if (requestNo) {
      try {
        await deleteDocumentApproval(requestNo);
        console.log('Existing approval deleted');
      } catch (deleteError) {
        console.log('No existing approval found, continuing...');
      }

      const currentUserId =
        typeof window !== 'undefined' ? localStorage.getItem('UserId') || localStorage.getItem('user_id') || '1' : '1';

      const payload = {
        Request_Id: requestNo,
        Approval_Id: listOfApprovers,
        Approve: listOfApprovers,
        Initiated_By: initiatedBy || (typeof window !== 'undefined' ? localStorage.getItem('username') || 'User' : 'User'),
        Request_Name: name,
        Created_By: currentUserId,
        Updated_By: currentUserId,
        Request_Key: requestNo,
        Created_Date: new Date().toISOString().split('T')[0],
      };

      return await createDocumentApproval(payload);
    }
  } catch (error) {
    console.error('Error creating document approval:', error);
    throw error;
  }
}

