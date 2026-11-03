'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Plus,
  Save,
  Info,
  Star,
  Tag,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Company } from '@/types/companies';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAccountCRUD, createAccountCRUD, updateAccountCRUD } from '@/service/api/Company/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { createContact, ContactModel } from '@/service/api/contacts/api';
import MultiContactForm from '../components/MultiContactForm';
import { fetchCustomForms } from '@/service/api/Customization/api';
import { STANDARD_LAYOUTS } from '@/app/(authenticated)/customization/create-form/page';
import { Checkbox } from '@/components/ui/checkbox';
import { Split, AlertCircle, ChevronDown } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

const companyFormSchema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  status: z.enum(['Active', 'Inactive']),
  industry: z.string().min(1, 'Industry is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address').or(z.string().min(1, 'Email is required')),
  website: z.string().min(1, 'Website is required'),
  employeeSize: z.string().min(1, 'Employee Size is required'),
  annualRevenue: z.string().min(1, 'Annual Revenue is required'),
  companyType: z.string().min(1, 'Company Type is required'),
  location: z.string().min(1, 'Location is required'),
  currency: z.string().min(1, 'Currency is required'),

  // Address
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal Code is required'),
  address: z.string().min(1, 'Address is required'),

  // Additional
  source: z.string().min(1, 'Source is required'),
  owner: z.string().min(1, 'Owner is required'),
  notes: z.string().optional(),

  // Custom
  vatNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  branchOffice: z.string().optional(),
  gstNo: z.string().optional(),
  decisionMaker: z.boolean().optional(),
  landLine: z.string().optional(),
  fax: z.string().optional(),
  paymentTerms: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormValues = z.infer<typeof companyFormSchema>;

const resolveDbId = (val: any): number | null => {
  if (!val) return null;
  if (typeof val === 'object') {
    if ('id' in val && val.id !== undefined && val.id !== null) {
      return Number(val.id);
    }
    if ('Account_Id' in val && val.Account_Id !== undefined && val.Account_Id !== null) {
      return Number(val.Account_Id);
    }
    return null;
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
};

export default function CompanyFormPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { primaryColor } = useStore();
  const { companies, addCompany, updateCompany } = useCompanyStore();
  const { canCreateCompany, canEditCompany } = usePermission();

  const isEditMode = !!id;
  const canAccessPage = isEditMode ? canEditCompany : canCreateCompany;

  useEffect(() => {
    if (!canAccessPage) {
      toast.error(`You do not have permission to ${isEditMode ? 'edit' : 'create'} companies.`);
      router.push('/companies');
    }
  }, [canAccessPage, isEditMode, router]);

  if (!canAccessPage) {
    return null;
  }
  const storeCompany = companies.find(c => c.id === id);

  // Wizard state: 1 = Company Details, 2 = Contact Details
  const [step, setStep] = useState(1);
  const [savedCompanyData, setSavedCompanyData] = useState<FormValues | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [createdCompany, setCreatedCompany] = useState<any>(null);



  // Custom rating state (1-5 stars)
  const [rating, setRating] = useState<number>(4);

  // Get logged in user ID from localStorage
  const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const parsedUserId = userIdStr ? parseInt(userIdStr, 10) : 73;
  const finalUserId = isNaN(parsedUserId) ? 73 : parsedUserId;

  // Fetch users list for Account Owner field from backend
  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = useMemo(() => {
    if (Array.isArray(usersRaw)) {
      return usersRaw;
    }
    return [];
  }, [usersRaw]);

  // Custom Form States
  const [activeForm, setActiveForm] = useState<any | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadActiveCompanyForm() {
      try {
        const formsList = await fetchCustomForms();
        const activeForm = formsList.find((f: any) => f.module === 'Companies' && f.status === 'Active');
        if (activeForm) {
          setActiveForm(activeForm);
        }
      } catch (e) {
        console.error('Failed to load active custom form for Companies:', e);
      }
    }
    loadActiveCompanyForm();
  }, []);

  const renderCustomField = (field: any) => {
    if (field.type === 'section') {
      return (
        <div key={field.id} className="col-span-1 sm:col-span-2 pt-3 pb-1 border-b border-slate-150 dark:border-slate-800 mt-2 text-left">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Split className="h-3.5 w-3.5 text-blue-500" />
            {field.label}
          </h4>
          {field.helpText && (
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{field.helpText}</p>
          )}
        </div>
      );
    }

    const hasError = customErrors[field.id];

    return (
      <div key={field.id} className={`space-y-1 text-left ${field.type === 'textarea' ? 'col-span-1 sm:col-span-2' : ''}`}>
        <div className="flex justify-between items-center">
          <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </Label>
          {hasError && (
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3 animate-pulse" />
              {hasError}
            </span>
          )}
        </div>

        {field.type === 'textarea' ? (
          <textarea
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`w-full min-h-[80px] p-3 text-xs border rounded-[5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300 font-semibold text-slate-800 dark:text-slate-200 ${
              hasError ? 'border-red-500 focus-visible:ring-red-400' : 'border-slate-200 dark:border-slate-800 bg-transparent'
            }`}
          />
        ) : field.type === 'dropdown' ? (
          <div className="relative">
            <select
              value={customValues[field.id] || ''}
              onChange={(e) => {
                setCustomValues({ ...customValues, [field.id]: e.target.value });
                if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
              }}
              className={`w-full h-9.5 pl-3 pr-10 text-xs border rounded-[5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300 font-semibold appearance-none text-slate-855 dark:text-slate-100 cursor-pointer ${
                hasError ? 'border-red-500 focus-visible:ring-red-400' : 'border-slate-200 dark:border-slate-800 bg-transparent'
              }`}
            >
              <option value="">Select option</option>
              {field.options && field.options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center gap-2 pt-2 pb-1">
            <Checkbox
              id={`custom-${field.id}`}
              checked={customValues[field.id] === 'true'}
              onCheckedChange={(checked) => {
                setCustomValues({ ...customValues, [field.id]: checked ? 'true' : '' });
                if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
              }}
              className="border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor={`custom-${field.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
              {field.placeholder || `Check if ${field.label.toLowerCase()}`}
            </label>
          </div>
        ) : field.type === 'date' || field.type === 'datetime' || field.type === 'time' ? (
          <Input
            type={field.type === 'time' ? 'time' : field.type === 'datetime' ? 'datetime-local' : 'date'}
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            className={`rounded-[5px] text-xs h-9.5 ${
              hasError ? 'border-red-500' : ''
            }`}
          />
        ) : (
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`rounded-[5px] text-xs h-9.5 ${
              hasError ? 'border-red-500' : ''
            }`}
          />
        )}

        {field.helpText && !hasError && (
          <p className="text-[10px] text-slate-405 font-medium pl-0.5 mt-0.5">{field.helpText}</p>
        )}
      </div>
    );
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: {
      status: 'Active',
      industry: 'IT Services',
      companyType: 'Private Limited',
      currency: 'USD ($)',
      country: '',
      source: 'Website',
      owner: 'Sadia Afrin',
      notes: '',
      vatNumber: '',
      registrationNumber: '',
      branchOffice: '',
      gstNo: '',
      decisionMaker: false,
      landLine: '',
      fax: '',
      paymentTerms: '',
      latitude: '',
      longitude: '',
    }
  });

  // Fetch Company details using AccountCRUD API if in edit mode and not in store
  const { data: apiCompanyRaw, isLoading: loadingCompany } = useQuery({
    queryKey: ['accountCRUD', id],
    queryFn: () => fetchAccountCRUD(id!),
    enabled: isEditMode && !storeCompany,
  });

  const companyToEdit = useMemo<Company | null>(() => {
    if (storeCompany) return storeCompany;
    if (!apiCompanyRaw) return null;
    const found = apiCompanyRaw;

    // Parse tags safely (it could be a JSON string, a list, or null)
    let parsedTags: string[] = [];
    if (found.Tags) {
      if (Array.isArray(found.Tags)) {
        parsedTags = found.Tags;
      } else if (typeof found.Tags === 'string') {
        try {
          parsedTags = JSON.parse(found.Tags);
        } catch {
          parsedTags = [found.Tags];
        }
      }
    } else if (found.tags) {
      if (Array.isArray(found.tags)) {
        parsedTags = found.tags;
      } else if (typeof found.tags === 'string') {
        try {
          parsedTags = JSON.parse(found.tags);
        } catch {
          parsedTags = [found.tags];
        }
      }
    }

    return {
      id: found.id?.toString() || id!,
      companyName: found.Organization_Name || 'N/A',
      status: found.Active_Flag ? 'Active' as const : 'Inactive' as const,
      industry: found.Industry || 'N/A',
      phone: found.Phone_Number || 'N/A',
      email: found.Mail || 'N/A',
      website: found.Website || '',
      employeeSize: found.Employees ? found.Employees.toString() : '0',
      annualRevenue: found.Turn_Over ? found.Turn_Over.toString() : '',
      companyType: found.Client_Type || '',
      location: found.Location || 'N/A',
      currency: found.Currency || 'USD ($)',
      country: found.Country || '',
      city: found.City || '',
      postalCode: '',
      address: found.Address || '',
      source: found.Lead_Source || '',
      owner: found.Account_Owner || 'Unassigned',
      tags: parsedTags,
      notes: found.About || '',
      about: found.About || '',
      file: found.File || null,
      fileName: found.FileName || null,
      vatNumber: found.Vat_Number || found.vatNumber || '',
      registrationNumber: found.Reg_Number || found.registrationNumber || '',
      branchOffice: found.Branch_Office || found.branchOffice || '',
      gstNo: found.GST_No || found.gstNo || '',
      decisionMaker: found.Decision_Maker !== undefined ? found.Decision_Maker : false,
      landLine: found.Land_Line || found.landLine || '',
      fax: found.Fax || found.fax || '',
      paymentTerms: found.Payment_Terms || found.paymentTerms || '',
      latitude: found.Latitude || found.latitude || '',
      longitude: found.Longitude || found.longitude || '',
      deals: Array.from({ length: found.deals || 0 }).map((_, i) => ({
        id: `deal-${i}`,
        dealName: '',
        stage: '',
        dealValue: 0,
        expectedClose: '',
        owner: ''
      })),
      contacts: [],
      notesList: [],
      timeline: [],
      createdAt: found.Created_Date || '',
      updatedAt: found.Updated_Date || found.Created_Date || ''
    };
  }, [id, storeCompany, apiCompanyRaw]);

  // Load editing company data
  useEffect(() => {
    if (isEditMode && companyToEdit) {
      reset({
        companyName: companyToEdit.companyName,
        status: companyToEdit.status,
        industry: companyToEdit.industry,
        phone: companyToEdit.phone,
        email: companyToEdit.email,
        website: companyToEdit.website,
        employeeSize: companyToEdit.employeeSize,
        annualRevenue: companyToEdit.annualRevenue,
        companyType: companyToEdit.companyType,
        location: companyToEdit.location,
        currency: companyToEdit.currency,
        country: companyToEdit.country,
        city: companyToEdit.city,
        postalCode: companyToEdit.postalCode,
        address: companyToEdit.address,
        source: companyToEdit.source,
        owner: companyToEdit.owner,
        notes: companyToEdit.notes || '',
        vatNumber: companyToEdit.vatNumber || '',
        registrationNumber: companyToEdit.registrationNumber || '',
        branchOffice: companyToEdit.branchOffice || '',
        gstNo: companyToEdit.gstNo || '',
        decisionMaker: companyToEdit.decisionMaker || false,
        landLine: companyToEdit.landLine || '',
        fax: companyToEdit.fax || '',
        paymentTerms: companyToEdit.paymentTerms || '',
        latitude: companyToEdit.latitude || '',
        longitude: companyToEdit.longitude || '',
      });
      setRating(companyToEdit.rating || 4);
    }
  }, [isEditMode, companyToEdit, reset]);

  // Load editing custom form data
  useEffect(() => {
    if (isEditMode && apiCompanyRaw) {
      const jsonStr = apiCompanyRaw.Company_Json || apiCompanyRaw.Account_Json;
      if (jsonStr) {
        try {
          const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          setCustomValues(parsed || {});
        } catch (e) {
          console.error("Failed to parse company custom json:", e);
        }
      }
    }
  }, [isEditMode, apiCompanyRaw]);

  // Watch dropdown values to handle Base UI Selects correctly
  const watchedStatus = watch('status');
  const watchedIndustry = watch('industry');
  const watchedCompanyType = watch('companyType');
  const watchedOwner = watch('owner');
  const watchedSource = watch('source');
  const watchedCurrency = watch('currency');

  const onSubmit = async (data: FormValues) => {
    if (activeForm && activeForm.fields) {
      let hasCustomErrors = false;
      const newErrors: Record<string, string> = {};

      activeForm.fields.forEach((field: any) => {
        if (field.required) {
          const val = customValues[field.id];
          if (!val || val.trim() === '') {
            newErrors[field.id] = `${field.label} is required`;
            hasCustomErrors = true;
          }
        }
      });

      if (hasCustomErrors) {
        setCustomErrors(newErrors);
        toast.error('Please fill in all required custom fields.');
        return;
      }
    }

    if (isEditMode) {
      await handleUpdateCompanyAndCreateContacts([], data);
    } else {
      setSavedCompanyData(data);
      setStep(2);
    }
  };

  const handleUpdateCompanyAndCreateContacts = async (contactPayloads: ContactModel[], overrideData?: FormValues) => {
    const dataToUse = overrideData || savedCompanyData;
    if (!dataToUse) {
      toast.error('Company details are missing. Please go back and fill them.');
      return;
    }

    setIsSavingAll(true);
    try {
      const generatedId = companyToEdit?.id || id!;
      const payload: Company = {
        ...companyToEdit,
        id: generatedId,
        companyName: dataToUse.companyName,
        status: dataToUse.status,
        industry: dataToUse.industry,
        phone: dataToUse.phone,
        email: dataToUse.email,
        website: dataToUse.website,
        employeeSize: dataToUse.employeeSize,
        annualRevenue: dataToUse.annualRevenue,
        companyType: dataToUse.companyType,
        location: dataToUse.location,
        currency: dataToUse.currency,
        country: dataToUse.country,
        city: dataToUse.city,
        postalCode: dataToUse.postalCode,
        address: dataToUse.address,
        source: dataToUse.source,
        owner: dataToUse.owner,
        tags: companyToEdit?.tags || [],
        notes: dataToUse.notes || '',
        vatNumber: dataToUse.vatNumber,
        registrationNumber: dataToUse.registrationNumber,
        branchOffice: dataToUse.branchOffice,
        rating: rating,
        deals: companyToEdit?.deals || [],
        contacts: companyToEdit?.contacts || [],
        notesList: companyToEdit?.notesList || [],
        timeline: companyToEdit?.timeline || [],
        createdAt: companyToEdit?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const formData = new FormData();

      if (apiCompanyRaw && typeof apiCompanyRaw === 'object') {
        Object.keys(apiCompanyRaw).forEach((key) => {
          if (key === 'File' || key === 'FileName' || key === 'Attachment' || key === 'attachments' || key === 'Address') return;
          const val = apiCompanyRaw[key];
          if (val === null || val === undefined) return;
          if (typeof val === 'object') {
            if ('id' in val && val.id !== undefined && val.id !== null) {
              formData.append(key, val.id.toString());
            } else {
              formData.append(key, JSON.stringify(val));
            }
          } else {
            formData.append(key, val.toString());
          }
        });
      }

      formData.set('Organization_Name', dataToUse.companyName);
      formData.set('Active_Flag', (dataToUse.status === 'Active').toString());
      formData.set('Industry', dataToUse.industry);
      formData.set('Phone_Number', dataToUse.phone);
      formData.set('Mail', dataToUse.email);
      formData.set('Website', dataToUse.website);
      formData.set('Employees', dataToUse.employeeSize.replace(/[^\d]/g, '') || '0');
      formData.set('Turn_Over', dataToUse.annualRevenue.replace(/[^\d.-]/g, '') || '0');
      formData.set('Client_Type', dataToUse.companyType);
      formData.set('Location', dataToUse.location);
      formData.set('Country', dataToUse.country);
      formData.set('City', dataToUse.city);
      formData.set('Address', JSON.stringify(dataToUse.address || ''));
      formData.set('Lead_Source', dataToUse.source);
      formData.set('Account_Owner', dataToUse.owner);
      formData.set('About', dataToUse.notes || '');
      formData.set('Tags', companyToEdit?.tags?.length ? JSON.stringify(companyToEdit.tags) : 'null');
      formData.set('Vat_Number', dataToUse.vatNumber || '');
      formData.set('Reg_Number', dataToUse.registrationNumber || '');
      formData.set('Branch_Office', dataToUse.branchOffice || '');
      
      // Inject Custom Form Data Payload
      formData.set('Company_Json', JSON.stringify(customValues));

      const orgIdVal = apiCompanyRaw?.Organization_Id || 1;
      const resolvedAccId = resolveDbId(apiCompanyRaw?.Account_Id) || resolveDbId(apiCompanyRaw?.id) || resolveDbId(id);
      const accIdVal = resolvedAccId || id || '';
      const createdByVal = apiCompanyRaw?.Created_By?.id || apiCompanyRaw?.Created_By || finalUserId;
      const notesIdVal = apiCompanyRaw?.AccountNotes_Id || '';

      formData.set('Organization_Id', orgIdVal.toString());
      formData.set('Account_Id', accIdVal.toString());
      formData.set('Created_By', createdByVal.toString());
      formData.set('AccountNotes_Id', notesIdVal.toString());

      await updateAccountCRUD(id!, formData);
      updateCompany(generatedId, payload);
      
      await queryClient.invalidateQueries({ queryKey: ['accountMyListWithDealCount', finalUserId] });
      await queryClient.invalidateQueries({ queryKey: ['accountDashboardCards', finalUserId] });
      await queryClient.invalidateQueries({ queryKey: ['accountCRUD', id] });

      const finalAccountId = resolvedAccId;

      // Create contacts
      try {
        if (contactPayloads.length > 0) {
          for (const contactPayload of contactPayloads) {
            const finalContactPayload = {
              ...contactPayload,
              Company_Name: dataToUse.companyName,
              Account_Id: finalAccountId,
            };
            await createContact(finalContactPayload);
          }
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
          queryClient.invalidateQueries({ queryKey: ['contactsDashboardCards'] });
        }
      } catch (contactError: any) {
        toast.error(`Company updated, but failed to create contacts: ${contactError.message}`);
        return;
      }

      if (contactPayloads.length > 0) {
        const contactNames = contactPayloads.map(c => `${c.FirstName} ${c.LastName}`).join(', ');
        toast.success(`Company ${dataToUse.companyName} updated and Contacts (${contactNames}) created successfully.`);
      } else {
        toast.success(`Company ${dataToUse.companyName} updated successfully.`);
      }
      router.push(`/companies/${generatedId}`);
    } catch (err: any) {
      toast.error(`Failed to update company details: ${err.message || err}`);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCreateCompanyAndContacts = async (contactPayloads: ContactModel[]) => {
    if (!savedCompanyData) {
      toast.error('Company details are missing. Please go back and fill them.');
      return;
    }

    setIsSavingAll(true);
    try {
      let companyResponse = createdCompany;

      if (!companyResponse) {
        const latestIdNum = companies.reduce((max, c) => {
          const parts = c.id.split('-');
          const num = parseInt(parts[parts.length - 1], 10);
          return isNaN(num) ? max : (num > max ? num : max);
        }, 10);

        const generatedId = `COM-2025-${String(latestIdNum + 1).padStart(5, '0')}`;

        const payload: Company = {
          id: generatedId,
          companyName: savedCompanyData.companyName,
          status: savedCompanyData.status,
          industry: savedCompanyData.industry,
          phone: savedCompanyData.phone,
          email: savedCompanyData.email,
          website: savedCompanyData.website,
          employeeSize: savedCompanyData.employeeSize,
          annualRevenue: savedCompanyData.annualRevenue,
          companyType: savedCompanyData.companyType,
          location: savedCompanyData.location,
          currency: savedCompanyData.currency,
          country: savedCompanyData.country,
          city: savedCompanyData.city,
          postalCode: savedCompanyData.postalCode,
          address: savedCompanyData.address,
          source: savedCompanyData.source,
          owner: savedCompanyData.owner,
          tags: [],
          notes: savedCompanyData.notes || '',
          vatNumber: savedCompanyData.vatNumber,
          registrationNumber: savedCompanyData.registrationNumber,
          branchOffice: savedCompanyData.branchOffice,
          rating: rating,
          deals: [],
          contacts: [],
          notesList: [],
          timeline: [
            {
              id: `TL-${Date.now()}`,
              type: 'Company created',
              details: `Company profile for ${savedCompanyData.companyName} created`,
              date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
              user: savedCompanyData.owner
            }
          ],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        };

        const backendPayload = {
          Gender: null,
          Date_Of_Birth: null,
          Account_Id: null,
          Lead_Source: savedCompanyData.source || null,
          File: undefined,
          FileName: undefined,
          Lead_Name: savedCompanyData.companyName,
          Contact_Name: savedCompanyData.companyName,
          Account_Owner: savedCompanyData.owner || null,
          Country_Code: null,
          Phone_Number: savedCompanyData.phone || null,
          Land_Line: null,
          Mail: savedCompanyData.email || null,
          Fax: null,
          Decision_Maker: false,
          Turn_Over: savedCompanyData.annualRevenue ? parseFloat(savedCompanyData.annualRevenue.replace(/[^\d.-]/g, '')) || null : null,
          Employees: savedCompanyData.employeeSize ? parseInt(savedCompanyData.employeeSize.replace(/[^\d]/g, ''), 10) || null : null,
          Industry: savedCompanyData.industry || null,
          Website: savedCompanyData.website || null,
          Country: savedCompanyData.country || null,
          State: null,
          City: savedCompanyData.city || null,
          Location: savedCompanyData.location || null,
          Client_Type: savedCompanyData.companyType || null,
          Client_Status: null,
          Latitude: null,
          Longitude: null,
          GST_No: null,
          Payment_Terms: null,
          Organization_Name: savedCompanyData.companyName,
          Address: savedCompanyData.address || null,
          ReasonForChurn: null,
          LeadCheck: 1,
          Active_Flag: savedCompanyData.status === 'Active',
          Status_Flag: null,
          Is_Deleted: false,
          Tags: null,
          About: savedCompanyData.notes || null,
          Vat_Number: savedCompanyData.vatNumber || null,
          Reg_Number: savedCompanyData.registrationNumber || null,
          Branch_Office: savedCompanyData.branchOffice || null,
          Organization_Id: 1,
          Lead_Id: null,
          RealestateLad_Id: null,
          Company_Json: JSON.stringify(customValues),
          Created_By: finalUserId,
          Updated_By: finalUserId
        };

        // Create company first
        companyResponse = await createAccountCRUD(backendPayload);
        setCreatedCompany(companyResponse);

        const dbAccountId = resolveDbId(companyResponse?.Account_Id) || resolveDbId(companyResponse?.id);
        const newCompanyId = dbAccountId?.toString() || generatedId;

        const localCompany: Company = {
          ...payload,
          id: newCompanyId,
        };
        addCompany(localCompany);

        // Invalidate queries so that the company list and dashboard cards are refreshed
        await queryClient.invalidateQueries({ queryKey: ['accountMyListWithDealCount', finalUserId] });
        await queryClient.invalidateQueries({ queryKey: ['accountDashboardCards', finalUserId] });
      }

      const finalAccountId = resolveDbId(companyResponse?.Account_Id) || resolveDbId(companyResponse?.id);

      // Create contacts
      try {
        for (const contactPayload of contactPayloads) {
          const finalContactPayload = {
            ...contactPayload,
            Company_Name: savedCompanyData.companyName,
            Account_Id: finalAccountId,
          };
          await createContact(finalContactPayload);
        }
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        queryClient.invalidateQueries({ queryKey: ['contactsDashboardCards'] });
      } catch (contactError: any) {
        toast.error(`Company created, but failed to create contacts: ${contactError.message}`);
        // Keep the user on Step 2 and let them retry saving the contacts
        return;
      }

      const contactNames = contactPayloads.map(c => `${c.FirstName} ${c.LastName}`).join(', ');
      toast.success(`Company ${savedCompanyData.companyName} and Contacts (${contactNames}) created successfully.`);
      router.push('/companies');
    } catch (err) {
      toast.error('An error occurred while saving the company.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const orderedSections = activeForm?.sectionOrder && activeForm.sectionOrder.length > 0
    ? activeForm.sectionOrder
    : ['Company Information', 'Address Information', 'Additional Information'];

  const getUnifiedFieldsForSection = (sectionName: string) => {
    // Standard fields for this section
    const standardFields = STANDARD_LAYOUTS['Companies'].filter((f: any) => {
      if (sectionName === 'Company Information') {
        return f.orderIndex <= 100 && f.type !== 'section';
      } else if (sectionName === 'Address Information') {
        return f.orderIndex > 100 && f.orderIndex <= 160 && f.type !== 'section';
      } else if (sectionName === 'Additional Information') {
        return f.orderIndex > 160 && f.orderIndex <= 200 && f.type !== 'section';
      }
      return false;
    });

    // Custom fields for this section
    const customFields = activeForm?.fields?.filter((f: any) =>
      f.sectionPlacement === sectionName && !f.isStandard
    ) || [];

    const unified = [...standardFields, ...customFields];
    unified.sort((a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 999;
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 999;
      return orderA - orderB;
    });
    return unified;
  };

  if (isEditMode && loadingCompany && !storeCompany) {
    return (
      <div className="space-y-6 text-left animate-pulse py-12">
        <Skeleton className="h-8 w-60 rounded mb-4" />
        <Skeleton className="h-64 w-full rounded-[5px]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-28 text-left"
    >
      {/* Breadcrumbs & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => {
            if (step === 2) {
              setCreatedCompany(null);
              setStep(1);
            } else {
              router.push(isEditMode ? `/companies/${id}` : '/companies');
            }
          }}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
            <NavLink to="/companies" className="hover:text-slate-650 transition-colors">Companies</NavLink>
            <BreadcrumbSeparator className="h-3 w-3" />
            <span className="text-slate-500">
              {isEditMode 
                ? (step === 1 ? 'Edit Company' : 'Primary Contact')
                : (step === 1 ? 'New Company' : 'Primary Contact')}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isEditMode
              ? (step === 1 ? `Edit ${companyToEdit?.companyName}` : `Add Primary Contact for ${savedCompanyData?.companyName}`)
              : (step === 1 ? 'Create New Company' : `Add Primary Contact for ${savedCompanyData?.companyName}`)}
          </h1>
        </div>
      </div>
      {/* Minimal Stepper */}
      {!isEditMode && (
        <div className="flex items-center gap-2 pb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
              step === 1
                ? "text-white border-primary"
                : "bg-primary border-primary text-white"
            )}
              style={step === 1 ? { backgroundColor: primaryColor, borderColor: primaryColor } : (step > 1 ? { backgroundColor: primaryColor, borderColor: primaryColor } : {})}
            >
              {step > 1 ? <Check className="h-3 w-3" /> : "1"}
            </span>
            <span className={cn(
              "text-xs font-bold transition-colors",
              step === 1 ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}>
              Company Details
            </span>
          </div>

          <div className="w-12 h-[1px] bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
              step === 2
                ? "text-white border-primary"
                : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800"
            )}
              style={step === 2 ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              2
            </span>
            <span className={cn(
              "text-xs font-bold transition-colors",
              step === 2 ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}>
              Primary Contact
            </span>
          </div>
        </div>
      )}


      {step === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dynamic Sections Map */}
            {(() => {
              return orderedSections.map((sectionName: string) => {
                const fieldsForSection = getUnifiedFieldsForSection(sectionName);
                if (fieldsForSection.length === 0) return null;

                return (
                  <Card key={sectionName} className="border-0 bg-white dark:bg-slate-900 rounded-[5px] shadow-xs">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">{sectionName}</h3>
                        {sectionName === 'Company Information' && (
                          <p className="text-xs text-slate-400 mt-0.5">Enter general information, industry type, and contact details of the organization.</p>
                        )}
                        {sectionName === 'Address Information' && (
                          <p className="text-xs text-slate-400 mt-0.5">Physical location details of the company head office or branch.</p>
                        )}
                        {sectionName === 'Additional Information' && (
                          <p className="text-xs text-slate-400 mt-0.5">Internal assignments, source tracks, tags, and custom summaries.</p>
                        )}
                        {!['Company Information', 'Address Information', 'Additional Information'].includes(sectionName) && (
                          <p className="text-xs text-slate-400 mt-0.5">Custom fields for {sectionName.toLowerCase()}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                        {fieldsForSection.map((field: any) => {
                          if (!field.isStandard) return renderCustomField(field);

                          // Standard Field Renderers
                          switch (field.id) {
                            case 'std-comp-name':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="companyName" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input
                                    id="companyName"
                                    placeholder={field.placeholder}
                                    className={cn("rounded-[5px] text-xs h-9.5", errors.companyName && "border-red-550")}
                                    {...register('companyName')}
                                  />
                                  {errors.companyName && <p className="text-[10px] text-red-500 font-semibold">{errors.companyName.message}</p>}
                                </div>
                              );
                            case 'std-comp-status':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="status" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedStatus} onValueChange={(val) => setValue('status', val as any)}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'std-comp-industry':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="industry" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedIndustry} onValueChange={(val) => setValue('industry', val || 'IT Services')}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Industry" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'std-comp-type':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="companyType" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedCompanyType} onValueChange={(val) => setValue('companyType', val || 'Private Limited')}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'std-comp-website':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="website" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="website" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('website')} />
                                  {errors.website && <p className="text-[10px] text-red-500 font-semibold">{errors.website.message}</p>}
                                </div>
                              );
                            case 'std-comp-phone':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="phone" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="phone" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('phone')} />
                                  {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>}
                                </div>
                              );
                            case 'std-comp-email':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="email" type="email" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('email')} />
                                  {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
                                </div>
                              );
                            case 'std-comp-emp':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="employeeSize" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="employeeSize" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('employeeSize')} />
                                  {errors.employeeSize && <p className="text-[10px] text-red-500 font-semibold">{errors.employeeSize.message}</p>}
                                </div>
                              );
                            case 'std-comp-rev':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="annualRevenue" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="annualRevenue" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('annualRevenue')} />
                                  {errors.annualRevenue && <p className="text-[10px] text-red-500 font-semibold">{errors.annualRevenue.message}</p>}
                                </div>
                              );
                            case 'std-comp-currency':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="currency" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedCurrency || undefined} onValueChange={(val) => setValue('currency', val || 'USD ($)')}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  {errors.currency && <p className="text-[10px] text-red-500 font-semibold">{errors.currency.message}</p>}
                                </div>
                              );
                            case 'std-comp-country':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="country" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="country" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('country')} />
                                  {errors.country && <p className="text-[10px] text-red-500 font-semibold">{errors.country.message}</p>}
                                </div>
                              );
                            case 'std-comp-city':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="city" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="city" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('city')} />
                                  {errors.city && <p className="text-[10px] text-red-500 font-semibold">{errors.city.message}</p>}
                                </div>
                              );
                            case 'std-comp-postal':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="postalCode" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="postalCode" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('postalCode')} />
                                  {errors.postalCode && <p className="text-[10px] text-red-500 font-semibold">{errors.postalCode.message}</p>}
                                </div>
                              );
                            case 'std-comp-street':
                              return (
                                <div key={field.id} className="sm:col-span-2 space-y-1.5">
                                  <Label htmlFor="address" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="address" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('address')} />
                                  {errors.address && <p className="text-[10px] text-red-500 font-semibold">{errors.address.message}</p>}
                                </div>
                              );
                            case 'std-comp-location-tag':
                              return (
                                <div key={field.id} className="sm:col-span-2 space-y-1.5">
                                  <Label htmlFor="location" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Input id="location" placeholder={field.placeholder} className="rounded-[5px] text-xs h-9.5" {...register('location')} />
                                  {errors.location && <p className="text-[10px] text-red-500 font-semibold">{errors.location.message}</p>}
                                </div>
                              );
                            case 'std-comp-source':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="source" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedSource} onValueChange={(val) => setValue('source', val || 'Website')}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {field.options?.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'std-comp-owner':
                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <Label htmlFor="owner" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label} {field.required && '*'}</Label>
                                  <Select value={watchedOwner} onValueChange={(val) => setValue('owner', val || 'Sadia Afrin')}>
                                    <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                                      <SelectValue placeholder="Select Owner" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[5px]">
                                      {users.map((u: any) => <SelectItem key={u.id} value={u.username}>{u.username}</SelectItem>)}
                                      {watchedOwner && !users.some((u: any) => u.username === watchedOwner) && <SelectItem value={watchedOwner}>{watchedOwner}</SelectItem>}
                                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'std-comp-notes':
                              return (
                                <div key={field.id} className="sm:col-span-2 space-y-1.5">
                                  <Label htmlFor="notes" className="text-xs font-bold text-slate-600 dark:text-slate-400">{field.label}</Label>
                                  <Textarea id="notes" rows={4} placeholder={field.placeholder} className="rounded-[5px] text-xs resize-none" {...register('notes')} />
                                </div>
                              );
                            default:
                              return null;
                          }
                        })}
                        {/* Fields ended */}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}

          </div>
          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Card 4: Custom Fields */}
            <Card className="border-0 bg-white dark:bg-slate-900 rounded-[5px] shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Custom Fields</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Specify compliance details, branches, and custom ratings.</p>
                </div>

                <div className="space-y-4">
                  {/* VAT Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="vatNumber" className="text-xs font-bold text-slate-600 dark:text-slate-400">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      placeholder="e.g. VAT-987654321"
                      className="rounded-[5px] text-xs h-9.5"
                      {...register('vatNumber')}
                    />
                  </div>

                  {/* Registration Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="registrationNumber" className="text-xs font-bold text-slate-600 dark:text-slate-400">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      placeholder="e.g. REG-123456"
                      className="rounded-[5px] text-xs h-9.5"
                      {...register('registrationNumber')}
                    />
                  </div>

                  {/* Branch Office */}
                  <div className="space-y-1.5">
                    <Label htmlFor="branchOffice" className="text-xs font-bold text-slate-600 dark:text-slate-400">Branch Office</Label>
                    <Input
                      id="branchOffice"
                      placeholder="e.g. London"
                      className="rounded-[5px] text-xs h-9.5"
                      {...register('branchOffice')}
                    />
                  </div>

                  {/* Rating (Stars Selection) */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Company Rating</Label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="cursor-pointer transition-all hover:scale-110 p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5",
                              star <= rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-350 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-500 ml-2 font-mono">{rating} Stars</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Quick Tips */}
            <Card className="border-0 bg-slate-50/50 dark:bg-slate-900/40 rounded-[5px] shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-750 dark:text-slate-200">Quick Configuration Tips</h4>
                    <ul className="list-disc pl-4 mt-2 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <li>Company information updates immediately in deals details lists.</li>
                      <li>The <strong>Location Tag</strong> is displayable on pipelines and tables. Format it as <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-mono">City, Country</code>.</li>
                      <li>Ensure the website contains the prefix (e.g. <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-mono">www.</code>) for proper redirection.</li>
                      <li>Custom fields such as VAT numbers are used in automated client invoicing.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Bottom Bar Actions */}
          <div className="col-span-1 lg:col-span-3 flex items-center justify-end gap-3.5 border-t dark:border-slate-800 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(isEditMode ? `/companies/${id}` : '/companies')}
              className="rounded-[5px] h-9.5 px-5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className="rounded-[5px] h-9.5 px-6 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {isEditMode ? 'Save Changes' : 'Next: Primary Contact'}
            </Button>
          </div>

        </form>
      )}

      {step === 2 && (
        <MultiContactForm
          defaultCompanyName={savedCompanyData?.companyName}
          onSubmit={isEditMode ? handleUpdateCompanyAndCreateContacts : handleCreateCompanyAndContacts}
          onCancel={() => {
            setCreatedCompany(null);
            setStep(1);
          }}
          isSubmitting={isSavingAll}
          submitButtonText={isEditMode ? "Update Company & Create Contacts" : "Create Company & Contacts"}
          cancelButtonText="Back to Company Details"
        />
      )}
    </motion.div>
  );
}
