import { create } from 'zustand';
import {
  clientmastercrudPost,
  clientmastercrudPut,
  clientmasterwithoutpagination,
  clientmastersearch,
  clientmasterfilter,
  clientbusinessconfigurationcrudPost,
  clientteamaccesscrudPost,
} from '@/service/api/client-onboarding/api';

export interface OnboardingClient {
  id: string;
  name: string;
  initials: string;
  industry: 'IT Services' | 'Software' | 'Digital Marketing' | 'Manufacturing' | 'Financial Services' | 'Healthcare' | 'Education' | 'Retail' | 'Consulting';
  stage: 'Review & Finish' | 'Configuration' | 'Business Details' | 'Team & Access' | 'Onboarded' | 'Pending' | 'On Hold';
  progress: number; // 0 to 100
  owner: string;
  ownerInitials: string;
  onboardedOn: string; // date string or '-'
  status: 'In Progress' | 'Onboarded' | 'Pending' | 'On Hold';
  legalName?: string;
  companySize?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  brandColor?: string;
  logoUrl?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  taxId?: string;
  regNumber?: string;
  modulesSelected?: string[];
  clientPortalAccess?: boolean;
  apiIntegrationAccess?: boolean;
  weeklyReports?: boolean;
  teamMembers?: { name: string; email: string; role: string }[];
}

interface ClientOnboardingState {
  clients: OnboardingClient[];
  loading: boolean;
  error: string | null;
  fetchClients: (search?: string, filters?: { status?: string; industry?: string; owner?: string; createdDate?: string[] }) => Promise<void>;
  addClient: (client: Omit<OnboardingClient, 'id' | 'initials' | 'ownerInitials' | 'onboardedOn'>) => Promise<void>;
  updateClientProgress: (id: string, progress: number, stage: OnboardingClient['stage']) => Promise<void>;
  updateClientStatus: (id: string, status: OnboardingClient['status']) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// Helper to generate initials from a name string
const getInitials = (name: string) => {
  return (name || '')
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';
};

const getUserId = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const id = Number(userData?.id);
        if (!isNaN(id) && id > 0) {
          return id;
        }
      }
    } catch (e) {
      console.error('Error retrieving userId from localStorage', e);
    }
  }
  return 72; // default fallback matching postman examples
};

const getOrgId = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const orgId = Number(localStorage.getItem('Organization_Id'));
      if (!isNaN(orgId) && orgId > 0) {
        return orgId;
      }
    } catch (e) {
      console.error('Error retrieving Organization_Id from localStorage', e);
    }
  }
  return 1; // default fallback matching postman examples
};

export const useClientOnboardingStore = create<ClientOnboardingState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async (search?: string, filters?: { status?: string; industry?: string; owner?: string; createdDate?: string[] }) => {
    set({ loading: true, error: null });
    try {
      let data: any[] = [];
      const hasFilters = (filters?.status && filters.status !== 'All') || 
                         (filters?.industry && filters.industry !== 'All Industries') || 
                         (filters?.owner && filters.owner !== 'All Owners') ||
                         (filters?.createdDate);

      if (search) {
        const res = await clientmastersearch({ search, page: 1 });
        data = Array.isArray(res) ? res : res?.results || res?.data || [];
      } else if (hasFilters) {
        const payload: any = {
          ClientMaster_Id: "",
          Client_Code: "",
          Client_Name: "",
          Legal_Name: "",
          Industry: (filters?.industry && filters.industry !== 'All Industries') ? filters.industry : "",
          Primary_Contact_Name: (filters?.owner && filters.owner !== 'All Owners') ? filters.owner : "",
          Primary_Contact_Email: "",
          Primary_Contact_PhoneNo: "",
          Currency: "",
          Status: (filters?.status && filters.status !== 'All') ? filters.status : "",
          Created_Date: filters?.createdDate || [
            `${new Date().getFullYear()}-01-01`,
            `${new Date().getFullYear()}-12-31`
          ],
          page: 1
        };
        
        const res = await clientmasterfilter(payload);
        data = Array.isArray(res) ? res : res?.results || res?.data || [];
      } else {
        const res = await clientmasterwithoutpagination();
        data = Array.isArray(res) ? res : res?.results || res?.data || [];
      }

      const mapped = (data || [])
        .filter((item: any) => !item.Is_Deleted)
        .map((item: any) => {
          const initials = getInitials(item.Client_Name || '');
          const ownerName = item.Primary_Contact_Name || 'Unassigned';
          const ownerInitials = getInitials(ownerName);
          
          let stage = item.Status || 'Pending';
          if (item.Progress_Percentage === 100) {
            stage = 'Onboarded';
          }

          return {
            id: item.id.toString(),
            name: item.Client_Name || '',
            initials,
            industry: (item.Industry || 'IT Services') as any,
            stage: stage as any,
            progress: item.Progress_Percentage || 0,
            owner: ownerName,
            ownerInitials,
            onboardedOn: item.Onboarded_On ? new Date(item.Onboarded_On).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            status: (item.Status || 'Pending') as any,
            legalName: item.Legal_Name,
            companySize: item.Company_Size,
            website: item.Website,
            primaryContactName: item.Primary_Contact_Name,
            primaryContactEmail: item.Primary_Contact_Email,
            primaryContactPhone: item.Primary_Contact_PhoneNo,
            currency: item.Currency,
            timezone: item.TimeZone,
            dateFormat: item.Date_Format,
            brandColor: item.Brand_Color
          };
        });
      set({ clients: mapped, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch clients', loading: false });
    }
  },
  
  addClient: async (client) => {
    set({ loading: true, error: null });
    try {
      const userId = getUserId();
      const orgId = getOrgId();
      
      const clientRes = await clientmastercrudPost({
        Client_Code: `CLI${Date.now().toString().slice(-5)}`,
        Client_Name: client.name,
        Legal_Name: client.legalName || client.name,
        Industry: client.industry,
        Company_Size: client.companySize || 'Medium (50-249)',
        Website: client.website || '',
        Primary_Contact_Name: client.primaryContactName || '',
        Primary_Contact_Email: client.primaryContactEmail || '',
        Primary_Contact_PhoneNo: client.primaryContactPhone || '',
        Currency: client.currency ? client.currency.split(' ')[0] : 'INR',
        TimeZone: client.timezone ? client.timezone.split(') ')[1] || client.timezone : 'Asia/Kolkata',
        Date_Format: client.dateFormat || 'DD MMM YYYY',
        Brand_Color: client.brandColor || '#2563EB',
        Progress_Percentage: client.progress || 0,
        Status: client.status || 'Pending',
        Client_Owner_Id: userId,
        Organization_Id: orgId,
        Created_By: userId,
        Updated_By: userId,
        Draft_Flag: false
      });
      
      const newClientId = clientRes?.id;
      if (!newClientId) {
        throw new Error('Failed to retrieve created Client ID from backend');
      }

      await clientbusinessconfigurationcrudPost({
        Client_Id: newClientId,
        Business_Type: client.companySize || 'Medium (50-249)',
        Registration_Number: client.regNumber || 'N/A',
        GST_Number: client.taxId || 'N/A',
        Address_Line1: client.billingAddress || '',
        Address_Line2: '',
        City: client.city || '',
        State: client.state || '',
        Country: client.country || 'India',
        Postal_Code: client.zipCode || '',
        Configuration_Data: {
          CRM: client.modulesSelected?.includes('CRM') || false,
          Support: client.modulesSelected?.includes('Support') || false,
          Marketing: client.modulesSelected?.includes('Marketing') || false,
          Projects: client.modulesSelected?.includes('Projects') || false,
          Billing: client.modulesSelected?.includes('Billing') || false,
          clientPortalAccess: client.clientPortalAccess ?? true,
          apiIntegrationAccess: client.apiIntegrationAccess ?? false,
          weeklyReports: client.weeklyReports ?? true
        },
        Created_By: userId
      });

      if (client.teamMembers && client.teamMembers.length > 0) {
        for (const member of client.teamMembers) {
          await clientteamaccesscrudPost({
            Client_Id: newClientId,
            User_Id: userId,
            Role_Name: member.role,
            Access_Level: member.role === 'Admin' ? 'Full Access' : 'Read Only',
            Status: 'Active',
            Created_By: userId
          });
        }
      }

      await get().fetchClients();
    } catch (err: any) {
      set({ error: err.message || 'Failed to add client', loading: false });
      throw err;
    }
  },

  updateClientProgress: async (id, progress, stage) => {
    set({ loading: true, error: null });
    try {
      const client = get().clients.find((c) => c.id === id);
      if (!client) throw new Error('Client not found');
      
      const status = stage === 'Onboarded' ? 'Onboarded' : client.status === 'Onboarded' ? 'In Progress' : client.status;
      const onboardedOn = stage === 'Onboarded' ? new Date().toISOString() : undefined;
      
      await clientmastercrudPut({
        id: Number(id),
        Progress_Percentage: progress,
        Status: status,
        Onboarded_On: onboardedOn,
        Updated_By: getUserId()
      });
      
      await get().fetchClients();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update client progress', loading: false });
      throw err;
    }
  },

  updateClientStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const client = get().clients.find((c) => c.id === id);
      if (!client) throw new Error('Client not found');

      const stage = status === 'Onboarded' ? 'Onboarded' : status === 'Pending' ? 'Pending' : status === 'On Hold' ? 'On Hold' : client.stage;
      const progress = status === 'Onboarded' ? 100 : status === 'Pending' ? 0 : client.progress;
      const onboardedOn = status === 'Onboarded' ? new Date().toISOString() : undefined;

      await clientmastercrudPut({
        id: Number(id),
        Status: status,
        Progress_Percentage: progress,
        Onboarded_On: onboardedOn,
        Updated_By: getUserId()
      });

      await get().fetchClients();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update client status', loading: false });
      throw err;
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null });
    try {
      await clientmastercrudPut({
        id: Number(id),
        Is_Deleted: true,
        Updated_By: getUserId()
      });
      await get().fetchClients();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete client', loading: false });
      throw err;
    }
  }
}));
