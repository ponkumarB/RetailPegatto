import { create } from 'zustand';
import * as api from '@/service/api/ProjectPlan';
import * as pidApi from '@/service/api/ProjectInitiationDocument';
import * as resourcePlanApi from '@/service/api/GenerateResourcePlan';
import { toast } from 'sonner';
import { useProjectStore } from './useProjectStore';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project';
import { formatPersonName } from '@/lib/utils';

export interface PIDDocument {
  id: string;
  code: string;
  projectName: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'Draft' | 'Review' | 'Approved';
  lastSaved: string;
  // Hold any additional backend properties for full hydration in UI
  [key: string]: any;
}

export interface ProjectPlanDocument {
  id: string;
  code: string;
  projectName: string;
  clientName: string;
  projectManager: string;
  methodology: string;
  costMethod: 'simple' | 'fpa';
  totalBudget: number;
  status: 'Draft' | 'Review' | 'Approved';
  lastSaved: string;
  description: string;
  [key: string]: any;
}

export interface ResourcePlanDocument {
  id: string;
  code: string;
  projectName: string;
  clientName: string;
  projectManager: string;
  totalResources: number;
  totalEffort: number;
  totalCost: number;
  status: 'Draft' | 'Review' | 'Approved';
  lastSaved: string;
  [key: string]: any;
}

interface ProjectDocumentsState {
  pids: PIDDocument[];
  plans: ProjectPlanDocument[];
  resourcePlans: ResourcePlanDocument[];
  isLoading: boolean;
  plansCount: number;
  plansPage: number;
  pidsCount: number;
  pidsPage: number;
  resourcePlansCount: number;
  resourcePlansPage: number;
  backendProjects: any[];
  
  fetchPIDs: (page?: number) => Promise<void>;
  addPID: (payload: pidApi.PIDDocumentPayload) => Promise<any>;
  deletePID: (id: string) => Promise<void>;
  searchPIDs: (search: string) => Promise<void>;
  filterPIDs: (payload: pidApi.ProjectInitiationDocumentFilterPayload) => Promise<void>;
  
  fetchPlans: (page?: number) => Promise<void>;
  addPlan: (payload: api.ProjectPlanDocumentPayload) => Promise<{ doc: any; pdfUrl: string | null }>;
  deletePlan: (id: string) => Promise<void>;
  searchPlans: (search: string) => Promise<void>;
  filterPlans: (payload: api.ProjectPlanDocumentFilterPayload) => Promise<void>;
  
  fetchResourcePlans: (page?: number) => Promise<void>;
  addResourcePlan: (payload: resourcePlanApi.ResourcePlanDocumentPayload) => Promise<any>;
  deleteResourcePlan: (id: string) => Promise<void>;
  searchResourcePlans: (search: string) => Promise<void>;
  filterResourcePlans: (payload: resourcePlanApi.ResourcePlanDocumentFilterPayload) => Promise<void>;
}

const mapPIDResponse = (item: any, backendProjects: any[] = []): PIDDocument => {
  let manager = '-';

  // 1. Try mapping using dynamic backend projects first
  const matchedBackend = backendProjects.find(
    (p) =>
      (item.Project_Id && p.id?.toString() === item.Project_Id.toString()) ||
      (p.project_name && item.Project_Name && p.project_name.toLowerCase() === item.Project_Name.toLowerCase()) ||
      (p.project_id && item.Project_Code && p.project_id.toLowerCase() === item.Project_Code.toLowerCase())
  );

  if (matchedBackend) {
    manager = matchedBackend.Project_Manager_Name || matchedBackend.project_owner || matchedBackend.Project_Sponsor || (item.Project_Manager ? `Manager ${item.Project_Manager}` : '-');
  } else {
    // 2. Try mapping using static useProjectStore projects as fallback
    try {
      const projects = useProjectStore.getState().projects;
      const matched = projects.find(
        (p) => 
          (p.name && item.Project_Name && p.name.toLowerCase() === item.Project_Name.toLowerCase()) || 
          (p.code && item.Project_Code && p.code.toLowerCase() === item.Project_Code.toLowerCase())
      );
      if (matched) {
        manager = matched.projectManager;
      } else {
        manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
      }
    } catch (e) {
      manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
    }
  }

  return {
    id: item.id.toString(),
    code: item.ProjectInitiationDocument_Id || item.Project_Code || `PID-${item.id}`,
    projectName: item.Project_Name || '',
    clientName: item.Client_Name || '',
    projectManager: formatPersonName(manager) || '-',
    startDate: item.Start_Date || '',
    endDate: item.End_Date || '',
    budget: Number(item.Estimated_Budget || item.Total_Estimated_Budget || 0),
    status: item.Document_Status || item.Status || 'Approved',
    lastSaved: item.Updated_Date ? new Date(item.Updated_Date).toLocaleDateString() : 'Just now',
    ...item
  };
};

const mapPlanResponse = (item: any, backendProjects: any[] = []): ProjectPlanDocument => {
  let manager = '-';

  // 1. Try mapping using dynamic backend projects first
  const matchedBackend = backendProjects.find(
    (p) =>
      (item.Project_Id && p.id?.toString() === item.Project_Id.toString()) ||
      (p.project_name && item.Project_Name && p.project_name.toLowerCase() === item.Project_Name.toLowerCase()) ||
      (p.project_id && item.Project_Code && p.project_id.toLowerCase() === item.Project_Code.toLowerCase())
  );

  if (matchedBackend) {
    manager = matchedBackend.Project_Manager_Name || matchedBackend.project_owner || matchedBackend.Project_Sponsor || (item.Project_Manager ? `Manager ${item.Project_Manager}` : '-');
  } else {
    // 2. Try mapping using static useProjectStore projects as fallback
    try {
      const projects = useProjectStore.getState().projects;
      const matched = projects.find(
        (p) => 
          (p.name && item.Project_Name && p.name.toLowerCase() === item.Project_Name.toLowerCase()) || 
          (p.code && item.Project_Code && p.code.toLowerCase() === item.Project_Code.toLowerCase())
      );
      if (matched) {
        manager = matched.projectManager;
      } else {
        manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
      }
    } catch (e) {
      manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
    }
  }

  return {
    id: item.id.toString(),
    code: item.ProjectPlanDocument_Id || item.Project_Code || `PLN-${item.id}`,
    projectName: item.Project_Name || '',
    clientName: item.Client_Name || '',
    projectManager: formatPersonName(manager) || '-',
    methodology: item.Methodology || 'Agile',
    costMethod: (item.WBS_Template && item.WBS_Template.toLowerCase().includes('fpa')) ? 'fpa' : 'simple',
    totalBudget: Number(item.Total_Budget || 0),
    status: item.Status || 'Approved',
    lastSaved: item.Updated_Date ? new Date(item.Updated_Date).toLocaleDateString() : 'Just now',
    description: item.Project_Description || item.project_description || item.description || '',
    ...item
  };
};

const mapResourcePlanResponse = (item: any, backendProjects: any[] = []): ResourcePlanDocument => {
  let manager = '-';

  // 1. Try mapping using dynamic backend projects first
  const matchedBackend = backendProjects.find(
    (p) =>
      (item.Project_Id && p.id?.toString() === item.Project_Id.toString()) ||
      (p.project_name && item.Project_Name && p.project_name.toLowerCase() === item.Project_Name.toLowerCase()) ||
      (p.project_id && item.Project_Code && p.project_id.toLowerCase() === item.Project_Code.toLowerCase())
  );

  if (matchedBackend) {
    manager = matchedBackend.Project_Manager_Name || matchedBackend.project_owner || matchedBackend.Project_Sponsor || (item.Project_Manager ? `Manager ${item.Project_Manager}` : '-');
  } else {
    // 2. Try mapping using static useProjectStore projects as fallback
    try {
      const projects = useProjectStore.getState().projects;
      const matched = projects.find(
        (p) => 
          (p.name && item.Project_Name && p.name.toLowerCase() === item.Project_Name.toLowerCase()) || 
          (p.code && item.Project_Code && p.code.toLowerCase() === item.Project_Code.toLowerCase())
      );
      if (matched) {
        manager = matched.projectManager;
      } else {
        manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
      }
    } catch (e) {
      manager = item.Project_Manager ? `Manager ${item.Project_Manager}` : '-';
    }
  }

  return {
    id: item.id.toString(),
    code: item.ResourcePlan_Id || item.Project_Code || `RES-${item.id}`,
    projectName: item.Project_Name || '',
    clientName: item.Client_Name || '',
    projectManager: formatPersonName(manager) || '-',
    totalResources: Number(item.Total_Resources || 0),
    totalEffort: Number(item.Total_Effort || 0),
    totalCost: Number(item.Total_Cost || 0),
    status: item.Document_Status || item.Status || 'Approved',
    lastSaved: item.Updated_Date ? new Date(item.Updated_Date).toLocaleDateString() : 'Just now',
    ...item
  };
};

export const useProjectDocumentsStore = create<ProjectDocumentsState>((set, get) => ({
  pids: [],
  plans: [],
  resourcePlans: [],
  isLoading: false,
  plansCount: 0,
  plansPage: 1,
  pidsCount: 0,
  pidsPage: 1,
  resourcePlansCount: 0,
  resourcePlansPage: 1,
  backendProjects: [],

  fetchPIDs: async (page = 1) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          console.error('Failed to fetch backend projects in store:', e);
          projects = [];
        }
      }
      
      const response = await pidApi.fetchProjectInitiationDocumentsWithPagination(page);
      const mappedPIDs = response.results.map((item: any) => mapPIDResponse(item, projects));
      set({
        pids: mappedPIDs,
        pidsCount: response.count,
        pidsPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch PIDs:', error);
      toast.error('Failed to load Project Initiation Documents from server.');
      set({ isLoading: false });
    }
  },

  addPID: async (payload) => {
    set({ isLoading: true });
    try {
      const doc = await pidApi.createProjectInitiationDocument(payload);
      toast.success('Project Initiation Document saved successfully to the server!');
      await get().fetchPIDs(get().pidsPage);
      set({ isLoading: false });
      return doc;
    } catch (error) {
      console.error('Failed to save PID:', error);
      toast.error('Failed to save Project Initiation Document.');
      set({ isLoading: false });
      throw error;
    }
  },

  deletePID: async (id) => {
    set({ isLoading: true });
    try {
      await pidApi.deleteProjectInitiationDocument(id);
      toast.success('Project Initiation Document deleted from server.');
      await get().fetchPIDs(get().pidsPage);
    } catch (error) {
      console.error('Failed to delete PID:', error);
      toast.error('Failed to delete Project Initiation Document.');
      set({ isLoading: false });
    }
  },

  searchPIDs: async (search) => {
    if (!search.trim()) {
      await get().fetchPIDs(1);
      return;
    }
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const results = await pidApi.searchProjectInitiationDocuments(search);
      const mappedPIDs = results.map((item: any) => mapPIDResponse(item, projects));
      set({
        pids: mappedPIDs,
        pidsCount: results.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to search PIDs:', error);
      set({ isLoading: false });
    }
  },

  filterPIDs: async (payload) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const results = await pidApi.filterProjectInitiationDocuments(payload);
      const mappedPIDs = results.map((item: any) => mapPIDResponse(item, projects));
      set({
        pids: mappedPIDs,
        pidsCount: results.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to filter PIDs:', error);
      set({ isLoading: false });
    }
  },
  
  fetchPlans: async (page = 1) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          console.error('Failed to fetch backend projects in store:', e);
          projects = [];
        }
      }
      
      const response = await api.fetchProjectPlanDocumentsWithPagination(page);
      const mappedPlans = response.results.map((item: any) => mapPlanResponse(item, projects));
      set({
        plans: mappedPlans,
        plansCount: response.count,
        plansPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch project plan documents:', error);
      toast.error('Failed to load project plans from server.');
      set({ isLoading: false });
    }
  },

  addPlan: async (payload) => {
    set({ isLoading: true });
    try {
      const doc = await api.createProjectPlanDocument(payload);
      toast.success('Project Plan Document saved successfully to the server!');
      
      let pdfUrl = null;
      if (doc && doc.id) {
        try {
          const pdfResponse = await api.generateProjectPlanDocumentPDF(doc.id);
          if (pdfResponse && pdfResponse.Generated_File) {
            pdfUrl = pdfResponse.Generated_File;
            toast.success('PDF generated successfully!');
          }
        } catch (pdfErr) {
          console.error('Failed to generate PDF:', pdfErr);
          toast.error('Document saved, but PDF generation failed.');
        }
      }
      
      await get().fetchPlans(get().plansPage);
      set({ isLoading: false });
      return { doc, pdfUrl };
    } catch (error) {
      console.error('Failed to save project plan document:', error);
      toast.error('Failed to save Project Plan Document.');
      set({ isLoading: false });
      throw error;
    }
  },

  deletePlan: async (id) => {
    set({ isLoading: true });
    try {
      await api.deleteProjectPlanDocument(id);
      toast.success('Project Plan Document deleted from server.');
      await get().fetchPlans(get().plansPage);
    } catch (error) {
      console.error('Failed to delete project plan document:', error);
      toast.error('Failed to delete Project Plan Document.');
      set({ isLoading: false });
    }
  },

  searchPlans: async (search) => {
    if (!search.trim()) {
      await get().fetchPlans(1);
      return;
    }
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const results = await api.searchProjectPlanDocuments(search);
      const mappedPlans = results.map((item: any) => mapPlanResponse(item, projects));
      set({
        plans: mappedPlans,
        plansCount: results.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to search project plan documents:', error);
      set({ isLoading: false });
    }
  },

  filterPlans: async (payload) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const results = await api.filterProjectPlanDocuments(payload);
      const mappedPlans = results.map((item: any) => mapPlanResponse(item, projects));
      set({
        plans: mappedPlans,
        plansCount: results.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to filter project plan documents:', error);
      set({ isLoading: false });
    }
  },

  fetchResourcePlans: async (page = 1) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          console.error('Failed to fetch backend projects in store:', e);
          projects = [];
        }
      }
      
      const response = await resourcePlanApi.fetchResourcePlanDocumentsWithPagination(page);
      const mappedPlans = response.results.map((item: any) => mapResourcePlanResponse(item, projects));
      set({
        resourcePlans: mappedPlans,
        resourcePlansCount: response.count,
        resourcePlansPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch resource plans:', error);
      toast.error('Failed to load Resource Plan Documents from server.');
      set({ isLoading: false });
    }
  },

  addResourcePlan: async (payload) => {
    set({ isLoading: true });
    try {
      const doc = await resourcePlanApi.createResourcePlanDocument(payload);
      toast.success('Resource Plan Document saved successfully to the server!');
      await get().fetchResourcePlans(get().resourcePlansPage || 1);
      set({ isLoading: false });
      return doc;
    } catch (error) {
      console.error('Failed to save Resource Plan Document:', error);
      toast.error('Failed to save Resource Plan Document.');
      set({ isLoading: false });
      throw error;
    }
  },

  deleteResourcePlan: async (id) => {
    set({ isLoading: true });
    try {
      await resourcePlanApi.deleteResourcePlanDocument(id);
      toast.success('Resource Plan Document deleted from server.');
      await get().fetchResourcePlans(get().resourcePlansPage || 1);
    } catch (error) {
      console.error('Failed to delete Resource Plan Document:', error);
      toast.error('Failed to delete Resource Plan Document.');
      set({ isLoading: false });
    }
  },

  searchResourcePlans: async (search) => {
    if (!search.trim()) {
      await get().fetchResourcePlans(1);
      return;
    }
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const response = await resourcePlanApi.searchResourcePlanDocuments(search);
      let list: any[] = [];
      let count = 0;
      if (response) {
        if (Array.isArray(response)) {
          list = response;
          count = response.length;
        } else if ((response as any).results && Array.isArray((response as any).results)) {
          list = (response as any).results;
          count = (response as any).count || (response as any).results.length;
        } else if (typeof response === 'object') {
          list = [response];
          count = 1;
        }
      }
      const mappedPlans = list.map((item: any) => mapResourcePlanResponse(item, projects));
      set({
        resourcePlans: mappedPlans,
        resourcePlansCount: count,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to search Resource Plans:', error);
      set({ isLoading: false });
    }
  },

  filterResourcePlans: async (payload) => {
    set({ isLoading: true });
    try {
      let projects = get().backendProjects;
      if (!projects || projects.length === 0) {
        try {
          projects = await fetchProjectlistwithoutpaginaton();
          set({ backendProjects: projects });
        } catch (e) {
          projects = [];
        }
      }
      const response = await resourcePlanApi.filterResourcePlanDocuments(payload);
      let list: any[] = [];
      let count = 0;
      if (response) {
        if (Array.isArray(response)) {
          list = response;
          count = response.length;
        } else if ((response as any).results && Array.isArray((response as any).results)) {
          list = (response as any).results;
          count = (response as any).count || (response as any).results.length;
        } else if (typeof response === 'object') {
          list = [response];
          count = 1;
        }
      }
      const mappedPlans = list.map((item: any) => mapResourcePlanResponse(item, projects));
      set({
        resourcePlans: mappedPlans,
        resourcePlansCount: count,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to filter Resource Plans:', error);
      set({ isLoading: false });
    }
  }
}));
