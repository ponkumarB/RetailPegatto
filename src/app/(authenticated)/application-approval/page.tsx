'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ReusableTable } from '@/components/ui/ReusableTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  fetchApprovedList,
  editDocumentApproval,
  fetchMarksheetOverallById,
  updateMarksheetOverall,
  fetchStudentDetailsById,
  fetchDocumentApprovalById,
  updateSetupStudentDetails,
  updatePublishResult
} from '@/service/api/approvals/api';
import { fetchBRDDocumentById, patchBRDDocument } from '@/service/api/BRD/api';
import { fetchFRDDocumentById, patchFRDDocument } from '@/service/api/FRD/api';
import { fetchSRSDocumentById, patchSRSDocument } from '@/service/api/SRS/api';
import { getTenantName, BASE_URL as API_BASE_URL } from '@/service/apiClient';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  X,
  ChevronRight,
  FileText,
  Clock,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Loader2,
  ShieldCheck,
  User,
  FileCheck
} from 'lucide-react';

const BASE_URL = 'https://backend.crmfarm.app/education';

export function getFormattedPreviewUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const tenant = getTenantName();
  let formatted = url;
  if (tenant && formatted.includes('/media/')) {
    formatted = formatted.replace('/media/', `/${tenant}/media/`);
  }
  const base = (API_BASE_URL || 'https://backend.crmfarm.app').replace(/\/+$/, '');
  if (!formatted.startsWith('/')) {
    formatted = `/${formatted}`;
  }
  return `${base}${formatted}`;
}

interface DocumentType {
  label: string;
  field: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { label: 'Aadhar Card', field: 'Identify_proof' },
  { label: 'Passport Size Photo', field: 'Passport_size_photo' },
  { label: 'Signature', field: 'Signature' },
  { label: '10th Marksheet', field: 'Marksheet_10th' },
  { label: '12th Marksheet', field: 'Marksheet_12th' },
  { label: 'UG Marksheet', field: 'Marksheet_UG' },
  { label: 'PG Marksheet', field: 'Marksheet_PG' },
  { label: 'Transfer Certificate', field: 'Transfer_certificate' },
  { label: 'Migration Certificate', field: 'Migration_certificate' },
  { label: 'Caste Certificate', field: 'Caste_certificate' },
  { label: 'NOC Certificate', field: 'NOC_certificate' },
  { label: 'Entrance Exam Scorecard', field: 'Entrance_exam_scorecard' },
];

export default function ApplicationApprovalPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId') || localStorage.getItem('UserId') || '');
      setUserRole(localStorage.getItem('Role') || '');
    }
  }, []);

  const [page, setPage] = useState(1);
  const [listPage, setListPage] = useState(true);
  const [openApprovalPage, setOpenApprovalPage] = useState(false);
  const [updatedData, setUpdatedData] = useState<any>(null);

  // Data list states
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Form states
  const [statusBtn, setStatusBtn] = useState('');
  const [comments, setComments] = useState('');
  const [approvals, setApprovals] = useState<any[]>([]);

  // Inspect modes & Dialogs
  const [openViewRequest, setOpenViewRequest] = useState(false);
  const [closeRequest, setCloseRequest] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Loaded Details
  const [docApprovalDetails, setDocApprovalDetails] = useState<any>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [marksheetData, setMarksheetData] = useState<any>(null);

  // Load pending list
  const loadPendingList = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetchApprovedList(userId, page);
      const list = res?.results || (Array.isArray(res) ? res : []);
      const count = res?.count || list.length;
      setPendingList(list);
      setTotalCount(count);
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
      toast.error('Failed to load pending approvals');
      setPendingList([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    loadPendingList();
  }, [loadPendingList]);

  // Load student or marksheet details when item is selected
  useEffect(() => {
    if (!updatedData?.Request_Id) return;
    const reqId = updatedData.Request_Id;

    if (updatedData.Request_Name === 'Verify Application') {
      fetchStudentDetailsById(reqId)
        .then((res) => setStudentDetails(res))
        .catch(() => setStudentDetails(null));
    } else if (updatedData.Request_Name === 'Verify Overall Marksheet') {
      fetchMarksheetOverallById(reqId)
        .then((res) => setMarksheetData(res))
        .catch(() => setMarksheetData(null));
    }
  }, [updatedData]);

  useEffect(() => {
    if (updatedData) {
      const initialApprovals = Array.isArray(updatedData.Approve) && updatedData.Approve.length > 0
        ? updatedData.Approve
        : Array.isArray(updatedData.Approval_Id) && updatedData.Approval_Id.length > 0
          ? updatedData.Approval_Id
          : [
            {
              id: 1,
              Approvername: 'Tamil Selvan',
              ApproverRole: 'PRINCIPAL',
              comments: '',
              status_btn: '',
              Approved_flg: false,
              status: false,
              time: '',
            },
            {
              id: userId ? Number(userId) : 2,
              Approvername: updatedData.Initiated_By || (updatedData.Created_By ? `${updatedData.Created_By.first_name || ''} ${updatedData.Created_By.last_name || ''}`.trim() : '') || 'Christo Kiran',
              ApproverRole: 'APPROVER',
              comments: '',
              status_btn: '',
              Approved_flg: false,
              status: false,
              time: '',
            },
          ];
      setApprovals(initialApprovals);

      const current = initialApprovals.find((a: any) => Number(a.id) === Number(userId));
      if (current) {
        setStatusBtn(current.status_btn || '');
        setComments(current.comments || '');
      } else {
        setStatusBtn('');
        setComments('');
      }
    }
  }, [updatedData, userId]);

  const handleVerify = (item: any) => {
    setUpdatedData(item);
    setOpenApprovalPage(true);
    setListPage(false);
    setCloseRequest(true);
  };

  const handleBackToList = () => {
    setOpenApprovalPage(false);
    setListPage(true);
    setUpdatedData(null);
    setCloseRequest(true);
    setOpenViewRequest(false);
  };

  const handleOpenDocument = async () => {
    const docId = updatedData?.Documentapproval_Id;
    const reqId = updatedData?.Request_Id;
    const reqName = (updatedData?.Request_Name || '').toUpperCase();

    setDocLoading(true);
    setDocApprovalDetails(null);

    try {
      let rawRes: any;
      if (reqName.includes('BRD')) {
        rawRes = await fetchBRDDocumentById(reqId || docId);
      } else if (reqName.includes('FRD')) {
        rawRes = await fetchFRDDocumentById(reqId || docId);
      } else if (reqName.includes('SRS')) {
        rawRes = await fetchSRSDocumentById(reqId || docId);
      } else {
        if (!docId) {
          toast.error('Document approval ID is missing');
          setDocLoading(false);
          return;
        }
        rawRes = await fetchDocumentApprovalById(docId);
      }

      let docObj = rawRes;
      if (Array.isArray(rawRes)) {
        docObj = rawRes[0];
      } else if (Array.isArray(rawRes?.data)) {
        docObj = rawRes.data[0];
      } else if (rawRes?.data && typeof rawRes.data === 'object') {
        docObj = rawRes.data;
      } else if (Array.isArray(rawRes?.results)) {
        docObj = rawRes.results[0];
      }

      setDocApprovalDetails(docObj);

      const docPreviewPath = docObj?.Document_Preview || docObj?.DocumentPreview || docObj?.Document_preview || docObj?.document_preview;
      const docTitle = docObj?.Document_Title || docObj?.DocumentTitle || docObj?.BRDDocument_Id || docObj?.FRDDocument_Id || docObj?.SRSDocument_Id || updatedData?.Request_Name || 'Document';

      if (docPreviewPath) {
        const fullUrl = getFormattedPreviewUrl(docPreviewPath);
        setPreviewFile(fullUrl);
        setPreviewTitle(docTitle);
        setPreviewOpen(true);
      } else {
        const firstField = DOCUMENT_TYPES.find(d => docObj?.[d.field]);
        if (firstField && docObj?.[firstField.field]) {
          const fileUrl = docObj[firstField.field];
          const fullUrl = getFormattedPreviewUrl(fileUrl);
          setPreviewFile(fullUrl);
          setPreviewTitle(firstField.label);
          setPreviewOpen(true);
        } else {
          toast.error('No preview document file available for this request');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load document preview');
    } finally {
      setDocLoading(false);
    }
  };

  // Submit Approval
  const handleUpdateApprovalStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!statusBtn) {
      toast.error('Please select Approve (Yes) or Reject (No)');
      return;
    }

    if (!comments.trim()) {
      toast.error('Please enter comments / reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedApprovals = approvals.map((appr) => {
        if (Number(appr.id) === Number(userId)) {
          return {
            ...appr,
            status_btn: statusBtn,
            comments,
            Approved_flg: statusBtn === 'yes',
            status: statusBtn === 'yes',
            OneTimeApproved_flg: true,
            time: new Date().toISOString(),
          };
        }
        return appr;
      });

      const currentIndex = updatedApprovals.findIndex((a) => Number(a.id) === Number(userId));
      const isLastApprover = currentIndex === updatedApprovals.length - 1 || currentIndex === -1;
      const isApproved = statusBtn === 'yes';
      const isRejected = statusBtn === 'no';

      // 1. Submit Document Approval Put
      const docPayload = {
        Documentapproval_Id: updatedData?.Documentapproval_Id,
        Request_Id: updatedData?.Request_Id,
        Created_By: updatedData?.Created_By?.id || updatedData?.Created_By,
        Updated_By: userId,
        Approval_Id: updatedApprovals,
        Approve: updatedApprovals,
        Request_Key: updatedData?.Request_Key,
        Request_Name: updatedData?.Request_Name,
      };

      await editDocumentApproval(docPayload);

      const reqId = updatedData?.Request_Id;

      // 2. Perform module specific updates
      const reqName = (updatedData?.Request_Name || '').toUpperCase();
      if (reqName.includes('BRD') && reqId) {
        if (isRejected) {
          await patchBRDDocument(reqId, { Status: 'Rejected' });
        } else if (isApproved && isLastApprover) {
          await patchBRDDocument(reqId, { Status: 'Approved' });
        }
      } else if (reqName.includes('FRD') && reqId) {
        if (isRejected) {
          await patchFRDDocument(reqId, { Status: 'Rejected' });
        } else if (isApproved && isLastApprover) {
          await patchFRDDocument(reqId, { Status: 'Approved' });
        }
      } else if (reqName.includes('SRS') && reqId) {
        if (isRejected) {
          await patchSRSDocument(reqId, { Status: 'Rejected' });
        } else if (isApproved && isLastApprover) {
          await patchSRSDocument(reqId, { Status: 'Approved' });
        }
      } else if (updatedData?.Request_Name === 'Verify Application' && reqId) {
        if (isRejected) {
          await updateSetupStudentDetails({
            id: reqId,
            Approved_flg: false,
            Status: false,
            Application_Status: 'Rejected',
            Reason: comments,
          });
        } else if (isApproved) {
          await updateSetupStudentDetails({
            id: reqId,
            Approved_flg: isLastApprover,
            Status: isLastApprover,
            Application_Status: isLastApprover ? 'Shortlisted' : 'Documents Verified',
            Reason: '',
          });
        }
      } else if (updatedData?.Request_Name === 'Verify Overall Marksheet' && reqId) {
        if (isRejected) {
          await updateMarksheetOverall({
            id: reqId,
            Approved_flg: false,
            Status: 'Rejected',
          });
        } else if (isApproved && isLastApprover) {
          await updateMarksheetOverall({
            id: reqId,
            Approved_flg: true,
            Status: 'Approved',
          });
        }
      } else if (updatedData?.Request_Name === 'Verify Result' && reqId) {
        if (isRejected) {
          await updatePublishResult({
            id: reqId,
            Approved_Flag: false,
            Status: 'Rejected',
          });
        } else if (isApproved && isLastApprover) {
          await updatePublishResult({
            id: reqId,
            Approved_Flag: true,
            Status: 'Approved',
          });
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('approvalUpdated'));
      }

      toast.success(isRejected ? 'Application Rejected' : isLastApprover ? 'Final Approval Completed' : 'Approval Submitted Successfully');
      handleBackToList();
      loadPendingList();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit approval decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document download helper
  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : getFormattedPreviewUrl(fileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accesstoken')) : '';
      const res = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const ext = fullUrl.split('.').pop()?.split('?')[0] || 'pdf';
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${fileName}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  // ReusableTable Columns
  const columns = useMemo(() => [
    {
      key: 'Created_Date',
      label: 'Applied Date',
      render: (row: any) => {
        if (!row.Created_Date) return '-';
        try {
          return new Date(row.Created_Date).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          });
        } catch {
          return row.Created_Date;
        }
      },
    },
    {
      key: 'Initiated_By',
      label: 'Applicant Name',
      render: (row: any) => {
        if (row.Initiated_By) return row.Initiated_By;
        if (row.Created_By) {
          return `${row.Created_By.first_name || ''} ${row.Created_By.last_name || ''}`.trim() || 'N/A';
        }
        return 'N/A';
      },
    },
    {
      key: 'Request_Name',
      label: 'Verification Type',
      render: (row: any) => row.Request_Name || '-',
    },
    {
      key: 'Status',
      label: 'Status',
      render: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs border border-amber-200/50 dark:border-amber-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </span>
      ),
    },
  ], []);

  const actions = (row: any) => (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVerify(row)}
        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer transition-colors"
        title="Verify Request"
      >
        <CheckCircle2 className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 text-left p-6 font-sans">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Application Approvals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {listPage && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 text-indigo-600">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                Application Approvals
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium">
                Review and process all pending student document and result approval requests.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-4 py-2 rounded-xl text-amber-600 dark:text-amber-400 font-bold text-xs">
              Pending Requests: {totalCount}
            </div>
          </div>

          {/* Pending Table list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-xs overflow-hidden">
            <ReusableTable
              columns={columns}
              data={pendingList}
              loading={isLoading}
              page={page}
              totalRecords={totalCount}
              onChangePage={setPage}
              actions={actions}
              title="Pending Approvals"
            />
          </div>
        </div>
      )}

      {/* DECISION SCREEN FORM */}
      {openApprovalPage && closeRequest && updatedData && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Document Approvals</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                Approvers shall use this form to approve or reject documents received from users.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenDocument}
              disabled={docLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full px-5 py-2.5 flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {docLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </>
              )}
            </Button>
          </div>

          {/* Request Header Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                REQUEST NAME
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {updatedData.Request_Name || 'Verify Overall Marksheet'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                INITIATED BY USER
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {updatedData.Initiated_By || (updatedData.Created_By ? `${updatedData.Created_By.first_name || ''} ${updatedData.Created_By.last_name || ''}`.trim() : '') || 'Christo Kiran'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                VERIFICATION STATUS
              </span>
              <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
                {updatedData.Verification_Status || updatedData.Status || 'PENDING REVIEW'}
              </span>
            </div>
          </div>

          {/* APPROVAL SEQUENCE WORKFLOW SECTION */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              APPROVAL SEQUENCE WORKFLOW
            </h4>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {approvals && approvals.length > 0 ? (
                approvals.map((appr: any, idx: number) => {
                  const roleName = (appr.ApproverRole || appr.Approver_Role || appr.Role || (idx === 0 ? 'PRINCIPAL' : 'APPROVER')).toUpperCase();
                  const name = appr.Approvername || appr.Approver_Name || appr.name || appr.username || (idx === 0 ? 'Tamil Selvan' : 'Christo Kiran');
                  const isApproved = appr.status_btn === 'yes' || appr.Approved_flg === true || appr.status === true;
                  const isRejected = appr.status_btn === 'no' || appr.status_btn === 'rejected';

                  let statusText = 'PENDING';
                  let statusBgClass = 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40';

                  if (isApproved) {
                    statusText = 'APPROVED';
                    statusBgClass = 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40';
                  } else if (isRejected) {
                    statusText = 'REJECTED';
                    statusBgClass = 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40';
                  }

                  return (
                    <React.Fragment key={appr.id || idx}>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 min-w-[160px] sm:min-w-[180px] flex flex-col items-center justify-center text-center space-y-2 shadow-xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {roleName}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {name}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${statusBgClass}`}>
                          {statusText}
                        </span>
                      </div>
                      {idx < approvals.length - 1 && (
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 mx-1" />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic p-2">
                  No approval sequence configured.
                </div>
              )}
            </div>
          </div>

          {/* Form Decision */}
          <form onSubmit={handleUpdateApprovalStatus} className="space-y-6 pt-4 border-t dark:border-slate-800">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block uppercase tracking-wide">
                APPROVE VERIFICATION <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                  <input
                    type="radio"
                    name="statusBtn"
                    value="yes"
                    checked={statusBtn === 'yes'}
                    onChange={() => setStatusBtn('yes')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Yes (Approve)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                  <input
                    type="radio"
                    name="statusBtn"
                    value="no"
                    checked={statusBtn === 'no'}
                    onChange={() => setStatusBtn('no')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>No (Reject)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block uppercase tracking-wide">
                ENTER YOUR COMMENTS <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Enter your Comments here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-4 py-3 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToList}
                disabled={isSubmitting}
                className="text-xs font-bold rounded-xl px-4 py-2 flex items-center gap-1.5 cursor-pointer border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Close</span>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-6 py-2.5 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}



      {/* DOCUMENT PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        url={previewFile || ''}
        title={previewTitle}
      />
    </div>
  );
}

function DocumentPreviewModal({
  isOpen,
  onClose,
  url,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) {
      setBlobUrl('');
      return;
    }

    let active = true;
    let createdUrl = '';

    const loadPdf = async () => {
      setIframeLoading(true);
      setLoadError(false);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accesstoken')) : '';
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load PDF');
        const blob = await res.blob();
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        }
      } catch (err) {
        console.warn('Blob PDF fetch failed, falling back to direct URL:', err);
        if (active) {
          setLoadError(true);
          setBlobUrl(url);
        }
      } finally {
        if (active) {
          setIframeLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, url]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 pr-6">
          <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Document Preview - {title}
          </DialogTitle>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> Open in new tab
            </a>
          )}
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden rounded-xl border dark:border-slate-800 mt-2 bg-slate-950/5 flex flex-col items-center justify-center">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs z-10">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading document preview...</span>
            </div>
          )}

          {loadError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Preview Document</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Direct embedding is restricted by security header settings. You can open or download the PDF in a new tab.
              </p>
              <Button
                onClick={() => window.open(url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 w-full"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Open Document in New Tab
              </Button>
            </div>
          ) : (
            blobUrl && (
              <iframe
                src={blobUrl}
                className="w-full h-full border-none"
                title={`Document Preview - ${title}`}
                onLoad={() => setIframeLoading(false)}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
