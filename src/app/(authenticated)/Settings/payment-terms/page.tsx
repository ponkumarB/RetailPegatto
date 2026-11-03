"use client";

import React, { useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Edit2, Trash2 } from "lucide-react";
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { PaymentTermsForm } from "./components/PaymentTermsForm";
import { PaymentTermsTemplate } from "@/service/api/Settings/PaymentTermsTemplate/api";
import { usePaymentTermsTemplateList, useSavePaymentTermsTemplate, useDeletePaymentTermsTemplate } from "@/service/api/Settings/PaymentTermsTemplate/queries";
import { toast } from "sonner";

export default function PaymentTermsPage() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedItem, setSelectedItem] = useState<PaymentTermsTemplate | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PaymentTermsTemplate | null>(null);
  
  const [page, setPage] = useState(1);

  const { data: listResponse, isLoading, isFetching } = usePaymentTermsTemplateList(page);
  const listData = listResponse?.results || [];

  const saveMutation = useSavePaymentTermsTemplate();
  const deleteMutation = useDeletePaymentTermsTemplate();

  const handleEdit = (item: PaymentTermsTemplate) => {
    setSelectedItem(item);
    setViewMode("edit");
  };

  const columns: ColumnConfig<PaymentTermsTemplate>[] = [
    { key: "Template_Name", label: "Template Name" },
    { key: "Applicability", label: "Applicability" },
    { 
      key: "Created_Date", 
      label: "Created Date", 
      render: (item) => item.Created_Date ? new Date(item.Created_Date).toLocaleDateString() : "N/A"
    },
  ];

  const handleDeleteClick = (item: PaymentTermsTemplate) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete && itemToDelete.id) {
      try {
        await deleteMutation.mutateAsync(itemToDelete.id);
        toast.success("Payment Terms template deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete template.");
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const tableActions = (row: PaymentTermsTemplate) => (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDeleteClick(row)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const handleSave = async (data: PaymentTermsTemplate) => {
    try {
      await saveMutation.mutateAsync(data);
      toast.success(data.id ? "Template updated successfully!" : "Template created successfully!");
      setViewMode("list");
      setSelectedItem(null);
    } catch (err) {
      toast.error("Failed to save template.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/documentations">Presales Documents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payment Terms & Conditions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Payment Terms Templates
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage standard payment terms, conditions, and milestone schedules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200">
                <HelpCircle className="w-4 h-4 mr-2" /> Help
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => { setSelectedItem(null); setViewMode("create"); }}>
                <Plus className="w-4 h-4 mr-2" /> New Template
              </Button>
            </div>
          </div>

          <ReusableTable
            data={listData}
            columns={columns}
            loading={isLoading || isFetching}
            actions={tableActions}
          />
        </div>
      ) : (
        <PaymentTermsForm 
          initialData={selectedItem}
          isSaving={saveMutation.isPending}
          onCancel={() => { setViewMode("list"); setSelectedItem(null); }}
          onSave={handleSave}
        />
      )}

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Payment Terms Template"
        description={`Are you sure you want to delete "${itemToDelete?.Template_Name}"? This action cannot be undone.`}
      />
    </div>
  );
}
