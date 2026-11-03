'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Mail,
  Phone as PhoneIcon,
  Printer,
  ChevronLeft,
  X,
  Save,
  Search,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  FileEdit,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { fetchFromApi, BASE_URL, getTenantName } from '@/service/apiClient';

interface Organisation {
  id: string;
  name: string;
  code: string;
  website: string;
  industry: string;
  size: string;
  status: 'Active' | 'Inactive';
  description: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;

  // Contact
  contactName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  altPhoneCode: string;
  altPhoneNumber: string;
  faxCode: string;
  faxNumber: string;

  // Additional
  parentOrg: string;
  timeZone: string;
  dateFormat: string;
  currency: string;
  logoUrl?: string;
  logoName?: string;
  notes: string;
}

const defaultOrganisations: Organisation[] = [
  {
    id: 'org-1',
    name: 'Acme Solutions Pvt. Ltd.',
    code: 'ACME001',
    website: 'https://www.acmesolutions.com',
    industry: 'Information Technology',
    size: '201 - 500 Employees',
    status: 'Active',
    description: 'Acme Solutions is a leading provider of IT consulting, software development, and digital transformation services for enterprises across the globe.',
    addressLine1: 'No. 123, Business Park, Tower A',
    addressLine2: '4th Floor',
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    zipCode: '600034',
    contactName: 'Sandeep Verma',
    email: 'sandeep.verma@acmesolutions.com',
    phoneCode: '+91',
    phoneNumber: '98765 43210',
    altPhoneCode: '+91',
    altPhoneNumber: '91234 56789',
    faxCode: '+91',
    faxNumber: '44 2345 6789',
    parentOrg: 'Acme Holdings Ltd.',
    timeZone: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR - Indian Rupee (₹)',
     logoName: 'acme_logo.png',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%233b82f6"><rect width="100" height="100" rx="15" fill="%23e0f2fe"/><text x="50" y="55" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230284c7" text-anchor="middle">ACME</text></svg>',
    notes: 'Preferred partner for enterprise solutions.'
  }
];

export default function OrganisationPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  const getDisplayLogoUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    const tenant = getTenantName();
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}/${tenant}${cleanUrl}`;
  };

  const columns = useMemo<ColumnConfig<Organisation>[]>(() => [
    {
      key: 'name',
      header: 'Organization Name',
      sortable: true,
      render: (row: Organisation) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row: Organisation) => <span className="text-slate-500 font-semibold">{row.code}</span>
    },
    {
      key: 'website',
      header: 'Website',
      render: (row: Organisation) => (
        <span className="text-slate-500 font-medium">
          {row.website ? (
            <a href={row.website} target="_blank" rel="noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
              {row.website}
            </a>
          ) : '—'}
        </span>
      )
    },
    {
      key: 'industry',
      header: 'Industry',
      sortable: true,
      render: (row: Organisation) => <span className="text-slate-655 dark:text-slate-400 font-medium">{row.industry || '—'}</span>
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (row: Organisation) => <span className="text-slate-655 dark:text-slate-400 font-medium">{row.size || '—'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Organisation) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.status === 'Active' 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.status}
        </span>
      )
    }
  ], []);

  // Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawOrgData, setRawOrgData] = useState<any>(null);
  
  // Selected organisation for editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [description, setDescription] = useState('');
  
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altPhoneCode, setAltPhoneCode] = useState('+91');
  const [altPhoneNumber, setAltPhoneNumber] = useState('');
  const [faxCode, setFaxCode] = useState('+91');
  const [faxNumber, setFaxNumber] = useState('');

  const [parentOrg, setParentOrg] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [currency, setCurrency] = useState('');
  const [logoName, setLogoName] = useState<string | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');

  // Bank Details States
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Fiscal Year States
  const [fiscalMonthName, setFiscalMonthName] = useState('June');
  const [fiscalQuarterName, setFiscalQuarterName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2025-05-29');
  const [fiscalFinancialYear, setFiscalFinancialYear] = useState('2025-05-29');

  // Business Hours State
  const [businessHrs, setBusinessHrs] = useState<any>({
    Monday_Chekbox: true, Monday_Starttime: '09:30', Monday_EndTime: '19:00',
    Tuesday_Chekbox: true, Tuesday_Starttime: '09:30', Tuesday_Endtime: '19:00',
    Wednessday_Chekbox: true, Wednessday_Starttime: '09:30', Wednessday_Endtime: '19:00',
    Thursday_Chekbox: true, Thursday_Starttime: '09:30', Thursday_Endtime: '19:00',
    Friday_Chekbox: true, Friday_Starttime: '09:30', Friday_Endtime: '19:00',
    Saturday_Chekbox: false, Saturday_Starttime: '', Saturday_Endtime: '',
    Sunday_Chekbox: false, Sunday_Starttime: '', Sunday_Endtime: ''
  });

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const res = await fetchFromApi('/useradmin/CRMorganizationCRUD/?id=1', {
        method: 'GET',
      });
      if (res) {
        setRawOrgData(res);

        // Convert server logo relative path to base64 data URI
        let base64Logo = res.Organization_Logo || '';
        if (base64Logo && !base64Logo.startsWith('data:')) {
          try {
            const tenant = getTenantName();
            const logoPath = base64Logo.startsWith('/') ? base64Logo : `/${base64Logo}`;
            const targetUrl = `${BASE_URL}/${tenant}${logoPath}`;
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(targetUrl, { headers });
            if (response.ok) {
              const blob = await response.blob();
              base64Logo = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            console.warn('Error converting server logo to base64:', e);
          }
        }

        const mapped: Organisation = {
          id: String(res.id || 1),
          name: res.Organization_Name || 'Super College',
          code: res.Organization_Code || 'ORG000000001',
          website: res.Organization_Website || '',
          industry: res.Industry || 'Education',
          size: res.Organization_Size || '201 - 500 Employees',
          status: res.Is_Active !== false ? 'Active' : 'Inactive',
          description: res.Description || '',
          addressLine1: res.Organization_Address?.Building_Name || res.Organization_Address?.Building_Street || '',
          addressLine2: res.Organization_Address?.Building_Area || '',
          country: res.Organization_Address?.Building_Country || 'India',
          state: res.Organization_Address?.Building_State || 'Tamil Nadu',
          city: res.Organization_Address?.Building_City || 'Chennai',
          zipCode: res.Organization_Address?.Zip_Code || '',
          contactName: res.Organization_BankDetails?.Beneficiary_Account_Name || 'Super College',
          email: res.Organization_Mail || '',
          phoneCode: '+91',
          phoneNumber: res.Organization_Contact_Number?.Org_Contact_NO_1 || '',
          altPhoneCode: '+91',
          altPhoneNumber: res.Organization_Contact_Number?.Org_Contact_NO_2 || '',
          faxCode: '+91',
          faxNumber: res.Fax_Number || '',
          parentOrg: res.Parent_Organization || 'None',
          timeZone: res.Default_Time_Zone || '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
          dateFormat: res.DateFormat === 'dd/MM/yyyy' ? 'DD/MM/YYYY' : res.DateFormat === 'MM/dd/yyyy' ? 'MM/DD/YYYY' : res.DateFormat || 'DD/MM/YYYY',
          currency: res.Currencies === 'INR' ? 'INR - Indian Rupee (₹)' : res.Currencies === 'USD' ? 'USD - US Dollar ($)' : res.Currencies === 'GBP' ? 'GBP - British Pound (£)' : res.Currencies === 'EUR' ? 'EUR - Euro (€)' : res.Currencies || 'INR - Indian Rupee (₹)',
          logoUrl: base64Logo,
          logoName: res.Organization_Logo ? res.Organization_Logo.split('/').pop() : '',
          notes: res.Notes || '',
        };
        setOrganisations([mapped]);
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      toast.error('Failed to load organization profile from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const handleResetForm = () => {
    setName('');
    setCode('');
    setWebsite('');
    setIndustry('Information Technology');
    setSize('201 - 500 Employees');
    setStatus('Active');
    setDescription('');
    
    setAddressLine1('');
    setAddressLine2('');
    setCountry('India');
    setState('Tamil Nadu');
    setCity('');
    setZipCode('');

    setContactName('');
    setEmail('');
    setPhoneCode('+91');
    setPhoneNumber('');
    setAltPhoneCode('+91');
    setAltPhoneNumber('');
    setFaxCode('+91');
    setFaxNumber('');

    setParentOrg('Acme Holdings Ltd.');
    setTimeZone('(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi');
    setDateFormat('DD/MM/YYYY');
    setCurrency('INR - Indian Rupee (₹)');
    setLogoName('acme_logo.png');
    setLogoUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%233b82f6"><rect width="100" height="100" rx="15" fill="%23e0f2fe"/><text x="50" y="55" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230284c7" text-anchor="middle">ACME</text></svg>');
    setNotes('');
    setEditingId(null);

    setBankAccountName('');
    setBankAccountNumber('');
    setBankName('');
    setBankIfsc('');

    setFiscalMonthName('June');
    setFiscalQuarterName('');
    setFiscalYear('2025-05-29');
    setFiscalFinancialYear('2025-05-29');

    setBusinessHrs({
      Monday_Chekbox: true, Monday_Starttime: '09:30', Monday_EndTime: '19:00',
      Tuesday_Chekbox: true, Tuesday_Starttime: '09:30', Tuesday_Endtime: '19:00',
      Wednessday_Chekbox: true, Wednessday_Starttime: '09:30', Wednessday_Endtime: '19:00',
      Thursday_Chekbox: true, Thursday_Starttime: '09:30', Thursday_Endtime: '19:00',
      Friday_Chekbox: true, Friday_Starttime: '09:30', Friday_Endtime: '19:00',
      Saturday_Chekbox: false, Saturday_Starttime: '', Saturday_Endtime: '',
      Sunday_Chekbox: false, Sunday_Starttime: '', Sunday_Endtime: ''
    });
  };

  const handleStartCreate = () => {
    handleResetForm();
    setViewMode('create');
  };

  const handleStartEdit = (org: Organisation) => {
    setEditingId(org.id);
    setName(org.name || '');
    setCode(org.code || '');
    setWebsite(org.website || '');
    setIndustry(org.industry || '');
    setSize(org.size || '');
    setStatus(org.status || 'Active');
    setDescription(org.description || '');
    
    setAddressLine1(org.addressLine1 || '');
    setAddressLine2(org.addressLine2 || '');
    setCountry(org.country || '');
    setState(org.state || '');
    setCity(org.city || '');
    setZipCode(org.zipCode || '');

    setContactName(org.contactName || '');
    setEmail(org.email || '');
    setPhoneCode(org.phoneCode || '+91');
    setPhoneNumber(org.phoneNumber || '');
    setAltPhoneCode(org.altPhoneCode || '+91');
    setAltPhoneNumber(org.altPhoneNumber || '');
    setFaxCode(org.faxCode || '+91');
    setFaxNumber(org.faxNumber || '');

    setParentOrg(org.parentOrg || '');
    setTimeZone(org.timeZone || '');
    setDateFormat(org.dateFormat || '');
    setCurrency(org.currency || '');
    setLogoName(org.logoName);
    setLogoUrl(org.logoUrl);
    setNotes(org.notes || '');

    // Bind Bank, Fiscal, and Business hours from the rawGETData if available
    if (rawOrgData) {
      setBankAccountName(rawOrgData.Organization_BankDetails?.Beneficiary_Account_Name || '');
      setBankAccountNumber(rawOrgData.Organization_BankDetails?.Beneficiary_Account_Number || '');
      setBankName(rawOrgData.Organization_BankDetails?.Beneficiary_Bank_Name || '');
      setBankIfsc(rawOrgData.Organization_BankDetails?.IFSC_CODE || '');

      setFiscalMonthName(rawOrgData.Fiscal_Year?.Calendar_MonthName || 'June');
      setFiscalQuarterName(rawOrgData.Fiscal_Year?.Calender_QuarterName || '');
      setFiscalYear(rawOrgData.Fiscal_Year?.Calender_Year || '2025-05-29');
      setFiscalFinancialYear(rawOrgData.Fiscal_Year?.Calendar_FinancialYear || '2025-05-29');

      if (rawOrgData.Business_Hour) {
        setBusinessHrs({
          Monday_Chekbox: rawOrgData.Business_Hour.Monday_Chekbox ?? true,
          Monday_Starttime: rawOrgData.Business_Hour.Monday_Starttime || '09:30',
          Monday_EndTime: rawOrgData.Business_Hour.Monday_EndTime || '19:00',
          Tuesday_Chekbox: rawOrgData.Business_Hour.Tuesday_Chekbox ?? true,
          Tuesday_Starttime: rawOrgData.Business_Hour.Tuesday_Starttime || '09:30',
          Tuesday_Endtime: rawOrgData.Business_Hour.Tuesday_Endtime || '19:00',
          Wednessday_Chekbox: rawOrgData.Business_Hour.Wednessday_Chekbox ?? true,
          Wednessday_Starttime: rawOrgData.Business_Hour.Wednessday_Starttime || '09:30',
          Wednessday_Endtime: rawOrgData.Business_Hour.Wednessday_Endtime || '19:00',
          Thursday_Chekbox: rawOrgData.Business_Hour.Thursday_Chekbox ?? true,
          Thursday_Starttime: rawOrgData.Business_Hour.Thursday_Starttime || '09:30',
          Thursday_Endtime: rawOrgData.Business_Hour.Thursday_Endtime || '19:00',
          Friday_Chekbox: rawOrgData.Business_Hour.Friday_Chekbox ?? true,
          Friday_Starttime: rawOrgData.Business_Hour.Friday_Starttime || '09:30',
          Friday_Endtime: rawOrgData.Business_Hour.Friday_Endtime || '19:00',
          Saturday_Chekbox: rawOrgData.Business_Hour.Saturday_Chekbox ?? false,
          Saturday_Starttime: rawOrgData.Business_Hour.Saturday_Starttime || '',
          Saturday_Endtime: rawOrgData.Business_Hour.Saturday_Endtime || '',
          Sunday_Chekbox: rawOrgData.Business_Hour.Sunday_Chekbox ?? false,
          Sunday_Starttime: rawOrgData.Business_Hour.Sunday_Starttime || '',
          Sunday_Endtime: rawOrgData.Business_Hour.Sunday_Endtime || '',
        });
      }
    }

    setViewMode('edit');
  };

  const handleSave = () => {
    // Basic Form validation
    if (!name.trim()) return toast.error('Organization Name is required.');
    if (!code.trim()) return toast.error('Organization Code is required.');
    if (!status) return toast.error('Status is required.');
    if (!addressLine1.trim()) return toast.error('Address Line 1 is required.');
    if (!country) return toast.error('Country is required.');
    if (!state) return toast.error('State / Province is required.');
    if (!zipCode.trim()) return toast.error('PIN / ZIP Code is required.');
    if (!contactName.trim()) return toast.error('Primary Contact Name is required.');
    if (!email.trim()) return toast.error('Primary Email is required.');
    if (!phoneNumber.trim()) return toast.error('Primary Phone is required.');
    if (!timeZone) return toast.error('Default Time Zone is required.');
    if (!dateFormat) return toast.error('Date Format is required.');
    if (!currency) return toast.error('Currency is required.');

    const isEdit = viewMode === 'edit';
    const method = isEdit ? 'PUT' : 'POST';

    const cleanBase64 = (val?: string) => {
      if (!val) return '';
      if (val.startsWith('data:')) {
        const parts = val.split(';base64,');
        if (parts.length > 1) {
          return parts[1];
        }
      }
      return val;
    };

    const payload = {
      ...rawOrgData,
      id: rawOrgData?.id || 1,
      Organization_Name: name,
      Organization_Code: code,
      Organization_Website: website,
      Industry: industry,
      Organization_Size: size,
      Is_Active: status === 'Active',
      Description: description,
      Organization_Logo: cleanBase64(logoUrl),
      Organization_Mail: email,
      Organization_Contact_Number: {
        Org_Contact_NO_1: phoneNumber,
        Org_Contact_NO_2: altPhoneNumber,
        Org_Contact_NO_3: rawOrgData?.Organization_Contact_Number?.Org_Contact_NO_3 || ''
      },
      DateFormat: dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : dateFormat === 'MM/DD/YYYY' ? 'MM/dd/yyyy' : dateFormat,
      Currencies: currency.includes('INR') ? 'INR' : currency.includes('USD') ? 'USD' : currency.includes('GBP') ? 'GBP' : currency.includes('EUR') ? 'EUR' : currency,
      Notes: notes,
      Parent_Organization: parentOrg,
      Default_Time_Zone: timeZone,
      Fax_Number: faxNumber,
      Organization_Address: {
        ...(rawOrgData?.Organization_Address || {}),
        Building_Name: addressLine1,
        Building_Street: addressLine1,
        Building_Area: addressLine2,
        Building_City: city,
        Building_State: state,
        Building_Country: country,
        Zip_Code: zipCode,
      },
      Organization_BankDetails: rawOrgData?.Organization_BankDetails?.id || (typeof rawOrgData?.Organization_BankDetails === 'number' ? rawOrgData.Organization_BankDetails : 1),
      Fiscal_Year: {
        ...(rawOrgData?.Fiscal_Year || {}),
        Calendar_MonthName: fiscalMonthName,
        Calender_QuarterName: fiscalQuarterName,
        Calender_Year: fiscalYear,
        Calendar_FinancialYear: fiscalFinancialYear,
      },
      Business_Hour: {
        ...(rawOrgData?.Business_Hour || {}),
        Monday_Chekbox: businessHrs.Monday_Chekbox,
        Monday_Starttime: businessHrs.Monday_Starttime,
        Monday_EndTime: businessHrs.Monday_EndTime,
        Tuesday_Chekbox: businessHrs.Tuesday_Chekbox,
        Tuesday_Starttime: businessHrs.Tuesday_Starttime,
        Tuesday_Endtime: businessHrs.Tuesday_Endtime,
        Wednessday_Chekbox: businessHrs.Wednessday_Chekbox,
        Wednessday_Starttime: businessHrs.Wednessday_Starttime,
        Wednessday_Endtime: businessHrs.Wednessday_Endtime,
        Thursday_Chekbox: businessHrs.Thursday_Chekbox,
        Thursday_Starttime: businessHrs.Thursday_Starttime,
        Thursday_Endtime: businessHrs.Thursday_EndTime,
        Friday_Chekbox: businessHrs.Friday_Chekbox,
        Friday_Starttime: businessHrs.Friday_Starttime,
        Friday_Endtime: businessHrs.Friday_EndTime,
        Saturday_Chekbox: businessHrs.Saturday_Chekbox,
        Saturday_Starttime: businessHrs.Saturday_Starttime,
        Saturday_Endtime: businessHrs.Saturday_Endtime,
        Sunday_Chekbox: businessHrs.Sunday_Chekbox,
        Sunday_Starttime: businessHrs.Sunday_Starttime,
        Sunday_Endtime: businessHrs.Sunday_Endtime,
      }
    };

    setLoading(true);
    fetchFromApi('/useradmin/CRMorganizationCRUD/', {
      method: method,
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res) {
          toast.success(isEdit ? 'Organization updated successfully.' : 'Organization created successfully.');
          fetchOrganization();
          setViewMode('list');
        } else {
          toast.error('Failed to save organization details.');
        }
      })
      .catch((err) => {
        console.error('Failed to save organisation:', err);
        toast.error('An error occurred while saving organization settings.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.error('Main corporate profile cannot be deleted.');
  };

  const tableActions = (org: Organisation) => (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px]"
        onClick={(e) => { e.stopPropagation(); handleStartEdit(org); }}
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-[5px]"
        onClick={(e) => handleDelete(org.id, e)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const filteredOrgs = useMemo(() => {
    return organisations.filter(o => {
      const query = searchQuery.toLowerCase();
      return (
        (o.name || '').toLowerCase().includes(query) ||
        (o.code || '').toLowerCase().includes(query) ||
        (o.email || '').toLowerCase().includes(query) ||
        (o.industry || '').toLowerCase().includes(query)
      );
    });
  }, [organisations, searchQuery]);

  return (
    <div className="flex flex-col gap-6 text-left pb-24">
      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-650 transition-colors">Administration</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Organisation Setup</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {viewMode === 'list' ? (
        // LIST VIEW
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
                <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Organisation</h1>
                <p className="text-xs text-slate-450">Manage and configure corporate profiles, addresses, and details.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search name, code or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-[280px] text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                />
              </div>
              <Button
                onClick={handleStartCreate}
                className="h-9 text-xs font-bold text-white shadow-xs gap-1.5 hover:opacity-90 rounded-[5px]"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="h-4 w-4" />
                <span>New Organisation</span>
              </Button>
            </div>
          </div>

          <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900 relative min-h-[150px]">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12 gap-2 text-slate-400 text-xs font-semibold">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading organization details...</span>
                </div>
              ) : (
                <ReusableTable
                  columns={columns}
                  data={filteredOrgs}
                  actions={tableActions}
                  onRowClick={(row) => handleStartEdit(row)}
                  showGear={true}
                  selectable={false}
                  borderless={true}
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // CREATE OR EDIT VIEW
        <>
          {/* Top Form Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
                <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {viewMode === 'edit' ? 'Edit Organization' : 'New Organization'}
                </h1>
                <p className="text-xs text-slate-450">
                  {viewMode === 'edit' ? 'Update organization information' : 'Create a new corporate profile'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-855 gap-1.5 rounded-[5px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back to List</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-855 gap-1.5 rounded-[5px]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="h-8.5 text-xs font-bold text-white hover:opacity-90 gap-1.5 rounded-[5px]"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </Button>
            </div>
          </div>

          {/* Form Content Layout (2-Column Grid) */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            
            {/* Left Side: General Profile, Address & Additional Info (Spans 3 Columns) */}
            <div className="xl:col-span-3 flex flex-col gap-6">
              
              {/* 1. Basic Information Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <FileEdit className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Basic Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Name */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Organization Name <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Acme Solutions Pvt. Ltd."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]"
                      />
                    </div>

                    {/* Code */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Organization Code <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. ACME001"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-[5px]"
                      />
                      <span className="text-[10px] text-slate-450 leading-none pl-0.5">Used for internal identification (e.g., ACME001)</span>
                    </div>

                    {/* Website */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Website</Label>
                      <Input
                        placeholder="e.g. https://www.acmesolutions.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Industry */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Industry</Label>
                      <Select value={industry} onValueChange={(val) => setIndustry(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Industry" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="Information Technology">Information Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Size */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Organization Size</Label>
                      <Select value={size} onValueChange={(val) => setSize(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Size" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="1 - 10 Employees">1 - 10 Employees</SelectItem>
                          <SelectItem value="11 - 50 Employees">11 - 50 Employees</SelectItem>
                          <SelectItem value="51 - 200 Employees">51 - 200 Employees</SelectItem>
                          <SelectItem value="201 - 500 Employees">201 - 500 Employees</SelectItem>
                          <SelectItem value="501 - 1000 Employees">501 - 1000 Employees</SelectItem>
                          <SelectItem value="1000+ Employees">1000+ Employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Status <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="Active">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </SelectItem>
                          <SelectItem value="Inactive">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Description</Label>
                    
                    {/* Mock Text Editor Toolbar */}
                    <div className="border border-b-0 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950 flex items-center gap-1 rounded-t-[5px]">
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <Underline className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-px h-4 bg-slate-250 dark:bg-slate-800 mx-1" />
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <ListOrdered className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-px h-4 bg-slate-250 dark:bg-slate-800 mx-1" />
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <LinkIcon className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded text-slate-600 dark:text-slate-400">
                        <ImageIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Textarea
                      placeholder="Enter organization description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-24 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-b-[5px] rounded-t-none"
                    />
                  </div>

                </CardContent>
              </Card>

              {/* 2. Address Information Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <MapPin className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Address Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Line 1 */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Address Line 1 <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. No. 123, Business Park, Tower A"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* Line 2 */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Address Line 2</Label>
                      <Input
                        placeholder="e.g. 4th Floor"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Country */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Country <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={country} onValueChange={(val) => setCountry(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Singapore">Singapore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        State / Province <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={state} onValueChange={(val) => setState(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="California">California</SelectItem>
                          <SelectItem value="New York">New York</SelectItem>
                          <SelectItem value="Texas">Texas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">City</Label>
                      <Input
                        placeholder="e.g. Chennai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* ZIP Code */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        PIN / ZIP Code <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. 600034"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                  </div>

                </CardContent>
              </Card>

              {/* 3. Additional Information Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <Clock className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Additional Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Parent Org */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Parent Organization</Label>
                      <Select value={parentOrg} onValueChange={(val) => setParentOrg(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Parent Org" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Acme Holdings Ltd.">Acme Holdings Ltd.</SelectItem>
                          <SelectItem value="Globex Corporation">Globex Corporation</SelectItem>
                          <SelectItem value="Initech">Initech</SelectItem>
                          <SelectItem value="Umbrella Corp">Umbrella Corp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Zone */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Default Time Zone <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={timeZone} onValueChange={(val) => setTimeZone(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Time Zone" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi">
                            (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi
                          </SelectItem>
                          <SelectItem value="(UTC-05:00) Eastern Time (US & Canada)">
                            (UTC-05:00) Eastern Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="(UTC+00:00) London, Dublin">
                            (UTC+00:00) London, Dublin
                          </SelectItem>
                          <SelectItem value="(UTC+08:00) Singapore, Beijing">
                            (UTC+08:00) Singapore, Beijing
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Format */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Date Format <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={dateFormat} onValueChange={(val) => setDateFormat(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Format" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    
                    {/* Currency */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Currency <span className="text-rose-500 font-extrabold">*</span>
                      </Label>
                      <Select value={currency} onValueChange={(val) => setCurrency(val || '')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="INR - Indian Rupee (₹)">INR - Indian Rupee (₹)</SelectItem>
                          <SelectItem value="USD - US Dollar ($)">USD - US Dollar ($)</SelectItem>
                          <SelectItem value="GBP - British Pound (£)">GBP - British Pound (£)</SelectItem>
                          <SelectItem value="EUR - Euro (€)">EUR - Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Logo (Optional) */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Logo (Optional)</Label>
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('Image size must be less than 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLogoUrl(reader.result as string);
                              setLogoName(file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 border dark:border-slate-855 p-2 rounded-[5px] bg-slate-50/50 dark:bg-slate-950/20 h-9 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        {logoUrl ? (
                          <div className="h-6 w-10 flex items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden shrink-0">
                            <img src={getDisplayLogoUrl(logoUrl)} alt="Logo" className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="bg-primary/10 text-primary font-bold text-[10px] uppercase px-2.5 py-1 rounded-[5px] select-none tracking-wider shrink-0">
                            Logo
                          </div>
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate">
                            {logoName || 'No logo selected'}
                          </span>
                          <span className="text-[8px] text-slate-450 font-semibold leading-none mt-0.5">Click to change logo</span>
                        </div>
                        {logoName && (
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoName(undefined);
                              setLogoUrl(undefined);
                            }}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Notes (Optional)</Label>
                      <Input
                        placeholder="Preferred partner..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                  </div>

                </CardContent>
              </Card>

              {/* 4. Bank Details Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <DollarSign className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Bank Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Beneficiary Account Name */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Beneficiary Account Name</Label>
                      <Input
                        placeholder="e.g. Super College"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* Beneficiary Account Number */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Beneficiary Account Number</Label>
                      <Input
                        placeholder="e.g. 1234567890"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Beneficiary Bank Name */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Beneficiary Bank Name</Label>
                      <Input
                        placeholder="e.g. State Bank of India"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* IFSC Code */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">IFSC Code</Label>
                      <Input
                        placeholder="e.g. SBIN0000300"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 5. Fiscal Year Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <Calendar className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Fiscal Year</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Calendar Month Name */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Start Month Name</Label>
                      <Select value={fiscalMonthName} onValueChange={(val) => setFiscalMonthName(val || 'June')}>
                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="June" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quarter Name */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Quarter Name</Label>
                      <Input
                        placeholder="e.g. Q1"
                        value={fiscalQuarterName}
                        onChange={(e) => setFiscalQuarterName(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* Calendar Year */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Calendar Year</Label>
                      <Input
                        type="date"
                        value={fiscalYear}
                        onChange={(e) => setFiscalYear(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>

                    {/* Calendar Financial Year */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Financial Year</Label>
                      <Input
                        type="date"
                        value={fiscalFinancialYear}
                        onChange={(e) => setFiscalFinancialYear(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 6. Business Hours Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <Clock className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Business Hours</h2>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Monday', checkKey: 'Monday_Chekbox', startKey: 'Monday_Starttime', endKey: 'Monday_EndTime' },
                      { label: 'Tuesday', checkKey: 'Tuesday_Chekbox', startKey: 'Tuesday_Starttime', endKey: 'Tuesday_Endtime' },
                      { label: 'Wednesday', checkKey: 'Wednessday_Chekbox', startKey: 'Wednessday_Starttime', endKey: 'Wednessday_Endtime' },
                      { label: 'Thursday', checkKey: 'Thursday_Chekbox', startKey: 'Thursday_Starttime', endKey: 'Thursday_EndTime' },
                      { label: 'Friday', checkKey: 'Friday_Chekbox', startKey: 'Friday_Starttime', endKey: 'Friday_EndTime' },
                      { label: 'Saturday', checkKey: 'Saturday_Chekbox', startKey: 'Saturday_Starttime', endKey: 'Saturday_Endtime' },
                      { label: 'Sunday', checkKey: 'Sunday_Chekbox', startKey: 'Sunday_Starttime', endKey: 'Sunday_Endtime' },
                    ].map((day) => {
                      const isChecked = businessHrs[day.checkKey] || false;
                      return (
                        <div key={day.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border dark:border-slate-800 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setBusinessHrs({
                                ...businessHrs,
                                [day.checkKey]: e.target.checked
                              })}
                              className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-800 rounded-sm focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-205">{day.label}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-semibold">Start Time</span>
                              <input
                                type="time"
                                disabled={!isChecked}
                                value={businessHrs[day.startKey] || ''}
                                onChange={(e) => setBusinessHrs({
                                  ...businessHrs,
                                  [day.startKey]: e.target.value
                                })}
                                className="h-8 px-2 border dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold rounded-[5px] outline-none disabled:opacity-50"
                              />
                            </div>
                            <span className="text-slate-300 dark:text-slate-800 font-extrabold">-</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-semibold">End Time</span>
                              <input
                                type="time"
                                disabled={!isChecked}
                                value={businessHrs[day.endKey] || ''}
                                onChange={(e) => setBusinessHrs({
                                  ...businessHrs,
                                  [day.endKey]: e.target.value
                                })}
                                className="h-8 px-2 border dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold rounded-[5px] outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Side: Contact Information (Spans 1 Column) */}
            <div className="flex flex-col gap-6">
              
              {/* Contact Card */}
              <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col gap-5">
                  
                  <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
                    <PhoneIcon className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Contact Information</h2>
                  </div>

                  {/* Contact Name */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Primary Contact Name <span className="text-rose-500 font-extrabold">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Sandeep Verma"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Email <span className="text-rose-500 font-extrabold">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. sandeep.verma@acmesolutions.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Phone <span className="text-rose-500 font-extrabold">*</span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Select value={phoneCode} onValueChange={(val) => setPhoneCode(val || '')}>
                        <SelectTrigger className="h-9 w-20 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="+91" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-9 flex-1 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>

                  {/* Alternate Phone */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Alternate Phone</Label>
                    <div className="flex items-center gap-1.5">
                      <Select value={altPhoneCode} onValueChange={(val) => setAltPhoneCode(val || '')}>
                        <SelectTrigger className="h-9 w-20 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]">
                          <SelectValue placeholder="+91" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[5px]">
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="91234 56789"
                        value={altPhoneNumber}
                        onChange={(e) => setAltPhoneNumber(e.target.value)}
                        className="h-9 flex-1 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>

                  {/* Fax */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Fax</Label>
                    <div className="relative">
                      <Printer className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="+91 44 2345 6789"
                        value={faxNumber}
                        onChange={(e) => setFaxNumber(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-855 rounded-[5px]"
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>

            </div>

          </div>

          {/* Bottom asterisks disclaimer notice */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 uppercase tracking-wide mt-2">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Fields marked with an asterisk (*) are mandatory.</span>
          </div>
        </>
      )}
    </div>
  );
}
