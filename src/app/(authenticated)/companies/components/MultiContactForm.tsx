'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Save, 
  Info, 
  X,
  FileText,
  User,
  Phone,
  Mail,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { ContactModel, getLoggedInUserId } from '@/service/api/contacts/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export interface MultiContactFormProps {
  defaultCompanyName?: string;
  onSubmit: (payloads: ContactModel[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
}

interface LocalContact {
  // Common details
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  
  // Advanced details
  jobTitle: string;
  department: string;
  status: string;
  dob: string;
  workPhoneCountry: string;
  workPhone: string;
  leadSource: string;
  reportsTo: string;
  reportsToId: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  tags: string[];
  notes: string;
  picFile: string;
  picFileName: string;
}

export default function MultiContactForm({
  defaultCompanyName = '',
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = 'Save Contacts',
  cancelButtonText = 'Cancel',
}: MultiContactFormProps) {
  const { primaryColor } = useStore();
  const userId = getLoggedInUserId() || 72;

  // Fetch users for Reports To dropdown
  const { data: usersListData } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = useMemo(() => {
    const list = usersListData
      ? (Array.isArray(usersListData) ? usersListData : (usersListData.results || usersListData.data || []))
      : [];
    
    return list.map((u: any) => {
      const id = u.id || u.User_Id || 0;
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'Unknown';
      return { id, name };
    });
  }, [usersListData]);

  // Initial template row
  const createEmptyContact = (): LocalContact => ({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountry: '+91',
    phone: '',
    jobTitle: '',
    department: '',
    status: 'Active',
    dob: '',
    workPhoneCountry: '+91',
    workPhone: '',
    leadSource: 'Website',
    reportsTo: '',
    reportsToId: null,
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    tags: [],
    notes: '',
    picFile: '',
    picFileName: ''
  });

  // Main State: List of contacts being entered
  const [contacts, setContacts] = useState<LocalContact[]>([createEmptyContact()]);

  // Modal State for editing advanced fields of a single contact
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Temporary local state for editing details inside the Dialog Modal
  const [modalContact, setModalContact] = useState<LocalContact | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const hasAdvanced = (c: LocalContact) => {
    return !!(
      c.jobTitle.trim() ||
      c.department.trim() ||
      (c.status !== 'Active') ||
      c.dob ||
      c.workPhone.trim() ||
      c.address.trim() ||
      c.city.trim() ||
      c.state.trim() ||
      c.pinCode.trim() ||
      c.tags.length > 0 ||
      c.notes.trim() ||
      c.picFile
    );
  };

  // Row operations
  const handleAddRow = () => {
    setContacts([...contacts, createEmptyContact()]);
  };

  const handleRemoveRow = (index: number) => {
    if (contacts.length === 1) {
      toast.error('At least one contact is required.');
      return;
    }
    const newContacts = contacts.filter((_, i) => i !== index);
    setContacts(newContacts);
  };

  const handleUpdateRow = (index: number, field: keyof LocalContact, value: any) => {
    const updated = [...contacts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setContacts(updated);
  };

  // Modal Dialog controls
  const handleOpenDetails = (index: number) => {
    setEditingIndex(index);
    setModalContact({ ...contacts[index] });
    setNewTagInput('');
    setIsTagDropdownOpen(false);
    setModalOpen(true);
  };

  const handleSaveModalDetails = () => {
    if (editingIndex !== null && modalContact) {
      const updated = [...contacts];
      updated[editingIndex] = modalContact;
      setContacts(updated);
      setModalOpen(false);
      setEditingIndex(null);
      setModalContact(null);
      toast.success('Advanced details updated locally.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalContact) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setModalContact({
        ...modalContact,
        picFileName: file.name,
        picFile: reader.result as string
      });
      toast.success(`Photo "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = (tag: string) => {
    if (!modalContact) return;
    const formatted = tag.trim();
    if (formatted && !modalContact.tags.includes(formatted)) {
      setModalContact({
        ...modalContact,
        tags: [...modalContact.tags, formatted]
      });
    }
    setNewTagInput('');
    setIsTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!modalContact) return;
    setModalContact({
      ...modalContact,
      tags: modalContact.tags.filter(t => t !== tagToRemove)
    });
  };

  // Submit operations
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const rowNum = i + 1;
      if (!contact.firstName.trim()) {
        toast.error(`Row ${rowNum}: First Name is required.`);
        return;
      }
      if (!contact.lastName.trim()) {
        toast.error(`Row ${rowNum}: Last Name is required.`);
        return;
      }
      if (!contact.email.trim()) {
        toast.error(`Row ${rowNum}: Email is required.`);
        return;
      }
      if (!contact.phone.trim()) {
        toast.error(`Row ${rowNum}: Phone Number is required.`);
        return;
      }
    }

    // Convert local state representation to API payload model
    const payloads: ContactModel[] = contacts.map(c => ({
      Organization_Id: 1,
      FirstName: c.firstName.trim(),
      LastName: c.lastName.trim(),
      Company_Name: defaultCompanyName,
      MobileCountry_Id: c.phoneCountry,
      Mobile_Number: c.phone,
      AlternatePhoneNo: c.workPhone,
      Email_Id: c.email.trim(),
      Job_Title: c.jobTitle.trim(),
      Department: c.department.trim(),
      DateOfBirth: c.dob || '1995-01-01',
      Address: c.address.trim(),
      Country: c.country || 'India',
      State: c.state.trim(),
      City: c.city.trim(),
      Pincode: c.pinCode.trim(),
      LeadSource: c.leadSource || 'Website',
      Contact_Owner: '', // Resolved by backend or company flow owner
      Reportingto_Id: c.reportsToId,
      Tags: c.tags,
      Description: c.notes.trim(),
      Lead_Flag: true,
      Status: c.status,
      User_Photo: c.picFile || undefined,
      FileName: c.picFile ? (c.picFileName || 'pic.png') : undefined,
      Contact_Json: {
        Source: c.leadSource,
        targetList: ''
      },
      Created_By: userId,
      Updated_By: userId
    }));

    onSubmit(payloads);
  };

  return (
    <div className="space-y-6 text-left">
      <Card className="border-0 bg-white dark:bg-slate-900 rounded-[5px] shadow-xs">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Contact Person Information</h3>
              <p className="text-xs text-slate-400 mt-0.5">Add one or more contacts to associate with {defaultCompanyName}.</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Table / Grid view */}
            <div className="overflow-x-auto border dark:border-slate-800 rounded-[5px]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-800">
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[22%]">First Name *</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[22%]">Last Name *</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[22%]">Email Address *</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[24%]">Phone Number *</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[10%] text-center">Details</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[5%] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {contacts.map((contact, index) => (
                    <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                      {/* First Name */}
                      <td className="p-2.5">
                        <Input
                          value={contact.firstName}
                          onChange={(e) => handleUpdateRow(index, 'firstName', e.target.value)}
                          placeholder="e.g. John"
                          required
                          className="rounded-[5px] text-xs h-9"
                        />
                      </td>

                      {/* Last Name */}
                      <td className="p-2.5">
                        <Input
                          value={contact.lastName}
                          onChange={(e) => handleUpdateRow(index, 'lastName', e.target.value)}
                          placeholder="e.g. Doe"
                          required
                          className="rounded-[5px] text-xs h-9"
                        />
                      </td>

                      {/* Email */}
                      <td className="p-2.5">
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleUpdateRow(index, 'email', e.target.value)}
                          placeholder="john@company.com"
                          required
                          className="rounded-[5px] text-xs h-9"
                        />
                      </td>

                       {/* Phone Country Code + Phone */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={contact.phoneCountry}
                            onValueChange={(val) => handleUpdateRow(index, 'phoneCountry', val)}
                          >
                            <SelectTrigger className="w-20 rounded-[5px] text-[11px] !h-9 px-2 shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[5px]">
                              <SelectItem value="+91">🇮🇳 +91</SelectItem>
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+44">🇬🇧 +44</SelectItem>
                              <SelectItem value="+49">🇩🇪 +49</SelectItem>
                              <SelectItem value="+880">🇧🇩 +880</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={contact.phone}
                            onChange={(e) => handleUpdateRow(index, 'phone', e.target.value)}
                            placeholder="9876543210"
                            required
                            className="rounded-[5px] text-xs h-9"
                          />
                        </div>
                      </td>

                      {/* More Details Popup Trigger */}
                      <td className="p-2.5 text-center">
                        {hasAdvanced(contact) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetails(index)}
                            className="h-8 text-[11px] font-bold gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-[5px] px-2 cursor-pointer transition-colors"
                            style={{ color: primaryColor, borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}08` }}
                          >
                            <FileText className="h-3.5 w-3.5" /> Edit Details
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetails(index)}
                            className="h-8 text-[11px] font-bold gap-1 border-slate-200 hover:border-slate-350 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[5px] px-2 cursor-pointer transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Details
                          </Button>
                        )}
                      </td>

                      {/* Delete Row */}
                      <td className="p-2.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={contacts.length === 1}
                          onClick={() => handleRemoveRow(index)}
                          className="h-8.5 w-8.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add More Contact Row Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="w-full py-4 border-dashed border-2 flex items-center justify-center gap-1.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-500 hover:text-primary hover:border-primary/50 transition-all duration-200 cursor-pointer rounded-[5px] text-xs font-bold"
            >
              <Plus className="h-4 w-4" /> Add More Contact
            </Button>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3.5 border-t dark:border-slate-800 pt-5 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-[5px] h-9.5 px-5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {cancelButtonText}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: primaryColor }}
                className="rounded-[5px] h-9.5 px-6 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {submitButtonText}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Details Modal Popup */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[750px] w-[95%] max-h-[85vh] overflow-y-auto rounded-[5px] bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-0">
          {modalContact && (
            <div>
              <div className="bg-slate-50 dark:bg-slate-950 p-5 border-b dark:border-slate-850 flex items-center gap-3">
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center text-base font-extrabold text-white shadow-xs overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0"
                  style={{
                    background: modalContact.picFile ? 'transparent' : `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`
                  }}
                >
                  {modalContact.picFile ? (
                    <img src={modalContact.picFile} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    (modalContact.firstName[0] || '').toUpperCase() + (modalContact.lastName[0] || '').toUpperCase() || 'CP'
                  )}
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-slate-850 dark:text-slate-100">
                    Advanced Details for {modalContact.firstName} {modalContact.lastName || 'Contact'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 mt-0.5">
                    Configure optional attributes, address, and profile photo for this contact row.
                  </DialogDescription>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Section 1: Professional Details */}
                <div className="space-y-4.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 border-b pb-1.5 dark:border-slate-800">
                    Professional Attributes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="jobTitle" className="text-xs font-bold text-slate-600 dark:text-slate-400">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={modalContact.jobTitle}
                        onChange={(e) => setModalContact(prev => prev ? { ...prev, jobTitle: e.target.value } : null)}
                        placeholder="e.g. Marketing Manager"
                        className="rounded-[5px] text-xs h-9.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-xs font-bold text-slate-600 dark:text-slate-400">Department</Label>
                      <Input
                        id="department"
                        value={modalContact.department}
                        onChange={(e) => setModalContact(prev => prev ? { ...prev, department: e.target.value } : null)}
                        placeholder="e.g. Sales"
                        className="rounded-[5px] text-xs h-9.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="status" className="text-xs font-bold text-slate-600 dark:text-slate-400">Status</Label>
                      <Select
                        value={modalContact.status}
                        onValueChange={(val) => setModalContact(prev => prev ? { ...prev, status: val || 'Active' } : null)}
                      >
                        <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="In Active">In Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dob" className="text-xs font-bold text-slate-600 dark:text-slate-400">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={modalContact.dob}
                        onChange={(e) => setModalContact(prev => prev ? { ...prev, dob: e.target.value } : null)}
                        className="rounded-[5px] text-xs h-9.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="workPhone" className="text-xs font-bold text-slate-600 dark:text-slate-400">Work Phone</Label>
                      <div className="flex gap-2">
                        <Select
                          value={modalContact.workPhoneCountry}
                          onValueChange={(val) => setModalContact(prev => prev ? { ...prev, workPhoneCountry: val || '+91' } : null)}
                        >
                          <SelectTrigger className="w-20 rounded-[5px] text-[11px] h-9.5 px-2 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-[5px]">
                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="workPhone"
                          value={modalContact.workPhone}
                          onChange={(e) => setModalContact(prev => prev ? { ...prev, workPhone: e.target.value } : null)}
                          placeholder="e.g. 9876543210"
                          className="rounded-[5px] text-xs h-9.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="leadSource" className="text-xs font-bold text-slate-600 dark:text-slate-400">Lead Source</Label>
                      <Select
                        value={modalContact.leadSource}
                        onValueChange={(val) => setModalContact(prev => prev ? { ...prev, leadSource: val || 'Website' } : null)}
                      >
                        <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Cold Call">Cold Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reportsTo" className="text-xs font-bold text-slate-600 dark:text-slate-400">Reports To</Label>
                      <Select
                        value={modalContact.reportsTo || "none"}
                        onValueChange={(val) => {
                          if (!val || val === "none") {
                            setModalContact(prev => prev ? { ...prev, reportsTo: '', reportsToId: null } : null);
                          } else {
                            const matched = users.find(u => u.name === val);
                            setModalContact(prev => prev ? {
                              ...prev,
                              reportsTo: val,
                              reportsToId: matched ? matched.id : null
                            } : null);
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="none">None</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Profile Photo</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="rounded-[5px] text-xs h-9.5 hidden"
                          id="modalPhotoInput"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('modalPhotoInput')?.click()}
                          className="h-9 rounded-[5px] text-xs font-bold"
                        >
                          Choose Photo
                        </Button>
                        <span className="text-[11px] text-slate-450 truncate max-w-[150px]">
                          {modalContact.picFileName || 'No file selected'}
                        </span>
                        {modalContact.picFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setModalContact(prev => prev ? { ...prev, picFile: '', picFileName: '' } : null)}
                            className="h-7 w-7 text-red-500 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Address Information */}
                <div className="space-y-4.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 border-b pb-1.5 dark:border-slate-800">
                    Address Details
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-bold text-slate-600 dark:text-slate-400">Street Address</Label>
                      <Input
                        id="address"
                        value={modalContact.address}
                        onChange={(e) => setModalContact(prev => prev ? { ...prev, address: e.target.value } : null)}
                        placeholder="123 Street Name"
                        className="rounded-[5px] text-xs h-9.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-bold text-slate-600 dark:text-slate-400">City</Label>
                        <Input
                          id="city"
                          value={modalContact.city}
                          onChange={(e) => setModalContact(prev => prev ? { ...prev, city: e.target.value } : null)}
                          placeholder="e.g. Delhi"
                          className="rounded-[5px] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-bold text-slate-600 dark:text-slate-400">State</Label>
                        <Input
                          id="state"
                          value={modalContact.state}
                          onChange={(e) => setModalContact(prev => prev ? { ...prev, state: e.target.value } : null)}
                          placeholder="e.g. Delhi"
                          className="rounded-[5px] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-xs font-bold text-slate-600 dark:text-slate-400">Country</Label>
                        <Select
                          value={modalContact.country}
                          onValueChange={(val) => setModalContact(prev => prev ? { ...prev, country: val || 'India' } : null)}
                        >
                          <SelectTrigger className="rounded-[5px] text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-[5px]">
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="Netherlands">Netherlands</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pinCode" className="text-xs font-bold text-slate-600 dark:text-slate-400">Pin Code</Label>
                        <Input
                          id="pinCode"
                          value={modalContact.pinCode}
                          onChange={(e) => setModalContact(prev => prev ? { ...prev, pinCode: e.target.value } : null)}
                          placeholder="110001"
                          className="rounded-[5px] text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Tags & Notes */}
                <div className="space-y-4.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 border-b pb-1.5 dark:border-slate-800">
                    Additional Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4.5">
                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-slate-400" /> Tags
                      </Label>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {modalContact.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground border-0 py-0.5 px-2 rounded-md font-bold text-[10px] gap-1 flex items-center"
                            style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                        {modalContact.tags.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">No tags selected. Add one below.</span>
                        )}
                      </div>

                      <div className="relative">
                        {isTagDropdownOpen ? (
                          <div className="flex items-center gap-2 max-w-[320px]">
                            <Input
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              placeholder="Tag name..."
                              className="h-8.5 rounded-[5px] text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag(newTagInput);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddTag(newTagInput)}
                              style={{ backgroundColor: primaryColor }}
                              className="text-white h-8.5 text-xs font-bold px-3.5 rounded-[5px]"
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsTagDropdownOpen(false)}
                              className="h-8.5 text-xs font-bold px-3.5 rounded-[5px]"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsTagDropdownOpen(true)}
                              className="h-8 text-xs font-bold rounded-[5px] text-slate-500 hover:text-primary gap-1 border-dashed"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Custom Tag
                            </Button>
                            {['Important', 'Hot Lead', 'Campaign 2024', 'Partner', 'Prospect', 'Follow-up'].map(presetTag => {
                              const isSel = modalContact.tags.includes(presetTag);
                              return (
                                <button
                                  type="button"
                                  key={presetTag}
                                  disabled={isSel}
                                  onClick={() => handleAddTag(presetTag)}
                                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                    isSel
                                      ? 'bg-slate-50 border-slate-100 text-slate-350 dark:bg-slate-955 dark:border-slate-900 dark:text-slate-650'
                                      : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350'
                                  }`}
                                >
                                  {presetTag}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description / Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-bold text-slate-600 dark:text-slate-400">Description / Notes</Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        value={modalContact.notes}
                        onChange={(e) => setModalContact(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        placeholder="Enter notes about this contact..."
                        className="rounded-[5px] text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t dark:border-slate-850 flex justify-end gap-3 rounded-b-[5px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="rounded-[5px] h-9 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveModalDetails}
                  style={{ backgroundColor: primaryColor }}
                  className="rounded-[5px] h-9 text-xs text-white font-bold"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
