import { create } from 'zustand';
import { toast } from 'sonner';
import * as wbsApi from '@/service/api/WBS/api';

export interface WBSTask {
  id: string;
  code: string;
  name: string;
  level: number;
  startDate: string;
  endDate: string;
  duration: string;
  owner: string;
  expanded: boolean;
  parentId?: string;
}

export interface WBSDocument {
  id: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  methodology: string;
  duration: string;
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  tasks: WBSTask[];
  Generated_File?: string;
  WBD_Id?: string;
}

interface WBSDocumentStore {
  wbsList: WBSDocument[];
  wbsCount: number;
  wbsPage: number;
  currentWbs: WBSDocument | null;
  isLoading: boolean;
  isGenerating: boolean;

  fetchWBSs: (page?: number) => Promise<void>;
  createWBS: () => void;
  selectWBS: (id: string) => void;
  deleteWBS: (id: string) => Promise<void>;
  addWBS: (orgId: number, userId: number, projectId?: number, accountId?: number) => Promise<any>;
  updateWBS: (orgId: number, userId: number, projectId?: number, accountId?: number) => Promise<any>;
  updateCurrentField: (field: string, value: any) => void;
  toggleCurrentScope: (scopeType: 'inScope' | 'outOfScope', item: string) => void;
  toggleExpandTask: (taskId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  addTask: (task: WBSTask) => void;
  deleteTask: (taskId: string) => void;
  generateWBS: () => Promise<void>;
}

// Hierarchical conversion helpers
function buildHierarchicalWBS(flatTasks: WBSTask[]): any[] {
  const taskMap: { [id: string]: any } = {};
  const roots: any[] = [];

  flatTasks.forEach(task => {
    taskMap[task.id] = {
      WBS_Code: task.code,
      Task_Name: task.name,
      Duration: parseInt(task.duration, 10) || 1,
      Level: task.level,
      startDate: task.startDate,
      endDate: task.endDate,
      owner: task.owner,
      Subtasks: []
    };
  });

  flatTasks.forEach(task => {
    const mapped = taskMap[task.id];
    if (task.parentId && taskMap[task.parentId]) {
      taskMap[task.parentId].Subtasks.push(mapped);
    } else {
      roots.push(mapped);
    }
  });

  const cleanSubtasks = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.Subtasks.length === 0) {
        delete node.Subtasks;
      } else {
        cleanSubtasks(node.Subtasks);
      }
    });
  };
  cleanSubtasks(roots);

  return roots;
}

function flattenWBS(hierarchicalTasks: any[], parentId?: string): WBSTask[] {
  const result: WBSTask[] = [];
  
  const recurse = (nodes: any[], pId?: string) => {
    nodes.forEach((node, idx) => {
      const generatedId = node.id?.toString() || Math.random().toString(36).substring(2, 9);
      result.push({
        id: generatedId,
        code: node.WBS_Code || `${idx + 1}.0`,
        name: node.Task_Name || '',
        level: node.Level || 1,
        startDate: node.startDate || new Date().toISOString().split('T')[0],
        endDate: node.endDate || new Date().toISOString().split('T')[0],
        duration: typeof node.Duration === 'number' ? `${node.Duration} Days` : node.Duration || '1 Day',
        owner: node.owner || 'Project Manager',
        expanded: true,
        parentId: pId
      });

      if (node.Subtasks && Array.isArray(node.Subtasks)) {
        recurse(node.Subtasks, generatedId);
      }
    });
  };

  recurse(hierarchicalTasks, parentId);
  return result;
}

function mapBackendToFrontend(item: any): WBSDocument {
  const inScope = Array.isArray(item.In_Scope)
    ? item.In_Scope.map((x: any) => x.Module || x.Description || '').filter(Boolean)
    : [];

  const outOfScope = Array.isArray(item.Out_Scope)
    ? item.Out_Scope.map((x: any) => x.Description || '').filter(Boolean)
    : [];

  const deliverables = Array.isArray(item.Key_Deliverables)
    ? item.Key_Deliverables.map((x: any) => x.Deliverable || '').filter(Boolean)
    : [];

  const tasks = Array.isArray(item.WBS_Structure)
    ? flattenWBS(item.WBS_Structure)
    : [];

  return {
    id: item.id?.toString() || '',
    projectName: item.Project_Name || '',
    projectCode: item.Project_Code || '',
    clientName: item.Client_Customer || '',
    projectManager: item.Project_Manager || '',
    startDate: item.Start_Date || '',
    endDate: item.Planned_End_Date || '',
    methodology: item.Methodology || 'Agile',
    duration: item.Total_Duration || (item.Project_Duration ? `${item.Project_Duration} ${item.Project_Duration_Unit || 'Months'}` : '0 Months'),
    inScope,
    outOfScope,
    deliverables,
    tasks,
    Generated_File: item.Generated_File || item.Document_Preview || '',
    WBD_Id: item.WBD_Id || ''
  };
}

function mapFrontendToBackend(doc: WBSDocument, orgId: number, userId: number, projectId?: number, accountId?: number): any {
  const In_Scope = doc.inScope.map((item) => ({
    Module: item,
    Description: item
  }));

  const Out_Scope = doc.outOfScope.map((item) => ({
    Description: item
  }));

  const Key_Deliverables = doc.deliverables.map((item) => ({
    Deliverable: item
  }));

  const WBS_Structure = buildHierarchicalWBS(doc.tasks);
  const totalTasksCount = doc.tasks.length;
  const totalLevels = doc.tasks.reduce((max, t) => Math.max(max, t.level), 1);
  const totalDurationStr = doc.duration || '0 Months';

  return {
    id: doc.id && !doc.id.startsWith('wbs-') ? parseInt(doc.id, 10) : undefined,
    Organization_Id: orgId,
    Project_Id: projectId || 224,
    Project_Name: doc.projectName,
    Project_Code: doc.projectCode,
    Client_Customer: doc.clientName,
    Account_Id: accountId || 347,
    Project_Manager: doc.projectManager,
    Start_Date: doc.startDate,
    Planned_End_Date: doc.endDate,
    Methodology: doc.methodology,
    Project_Duration: parseInt(doc.duration, 10) || 6,
    Project_Duration_Unit: doc.duration.includes('Day') ? 'Days' : 'Months',
    In_Scope,
    Out_Scope,
    Key_Deliverables,
    WBS_Structure,
    Total_Tasks: totalTasksCount,
    Total_Levels: totalLevels,
    Total_Duration: totalDurationStr,
    Prepared_By: doc.projectManager,
    Document_Date: new Date().toISOString().split('T')[0],
    Overall_WBS: {
      Project_Objective: `${doc.projectName} Work Breakdown Structure`,
      Estimated_Effort: totalDurationStr,
      Resources: Array.from(new Set(doc.tasks.map(t => t.owner).filter(Boolean)))
    },
    Document_Version: '1.0',
    Status: 'Draft',
    Created_By: userId,
    Updated_By: userId
  };
}

export const useWBSDocumentStore = create<WBSDocumentStore>((set, get) => ({
  wbsList: [],
  wbsCount: 0,
  wbsPage: 1,
  currentWbs: null,
  isLoading: false,
  isGenerating: false,

  fetchWBSs: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await wbsApi.fetchWBSDocumentsWithPagination(page);
      const results = Array.isArray(response) ? response : (response?.results || []);
      const mapped = results.map(mapBackendToFrontend);
      set({
        wbsList: mapped,
        wbsCount: response?.count || results.length,
        wbsPage: page,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch WBSs:', error);
      toast.error('Failed to load WBS list from server.');
      set({ isLoading: false });
    }
  },

  createWBS: () => set((state) => ({
    currentWbs: {
      id: `wbs-${Math.random().toString(36).substring(2, 9)}`,
      projectName: '',
      projectCode: '',
      clientName: '',
      projectManager: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      methodology: 'Agile',
      duration: '3 Months',
      inScope: [],
      outOfScope: [],
      deliverables: [],
      tasks: [
        {
          id: '1',
          code: '1.0',
          name: 'Project Root',
          level: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
          duration: '3 Months',
          owner: 'Project Manager',
          expanded: true,
        }
      ],
    }
  })),

  selectWBS: (id) => set((state) => {
    const wbs = state.wbsList.find(w => w.id === id);
    return {
      currentWbs: wbs ? JSON.parse(JSON.stringify(wbs)) : null
    };
  }),

  deleteWBS: async (id) => {
    set({ isLoading: true });
    try {
      await wbsApi.deleteWBSDocument(id);
      toast.success('Work Breakdown Structure deleted successfully.');
      await get().fetchWBSs(get().wbsPage);
    } catch (error) {
      console.error('Failed to delete WBS:', error);
      toast.error('Failed to delete WBS document from server.');
      set({ isLoading: false });
    }
  },

  addWBS: async (orgId, userId, projectId, accountId) => {
    const doc = get().currentWbs;
    if (!doc) return;
    set({ isLoading: true });
    try {
      const payload = mapFrontendToBackend(doc, orgId, userId, projectId, accountId);
      const res = await wbsApi.createWBSDocument(payload);
      toast.success('WBS saved successfully to server!');
      await get().fetchWBSs(get().wbsPage);
      set({ isLoading: false });
      return res;
    } catch (error) {
      console.error('Failed to add WBS:', error);
      toast.error('Failed to save WBS document.');
      set({ isLoading: false });
      throw error;
    }
  },

  updateWBS: async (orgId, userId, projectId, accountId) => {
    const doc = get().currentWbs;
    if (!doc || !doc.id) return;
    set({ isLoading: true });
    try {
      const payload = mapFrontendToBackend(doc, orgId, userId, projectId, accountId);
      const res = await wbsApi.updateWBSDocument(doc.id, payload);
      toast.success('WBS updated successfully on server!');
      await get().fetchWBSs(get().wbsPage);
      set({ isLoading: false });
      return res;
    } catch (error) {
      console.error('Failed to update WBS:', error);
      toast.error('Failed to update WBS document.');
      set({ isLoading: false });
      throw error;
    }
  },

  updateCurrentField: (field, value) => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };

    if (field === 'startDate' || field === 'endDate') {
      const start = new Date(field === 'startDate' ? value : updated.startDate);
      const end = new Date(field === 'endDate' ? value : updated.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        updated.duration = Math.max(1, diffMonths === 0 ? 1 : diffMonths + 1) + ' Months';
      }
    }

    (updated as any)[field] = value;
    return { currentWbs: updated };
  }),

  toggleCurrentScope: (scopeType, item) => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    const list = updated[scopeType];
    updated[scopeType] = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    return { currentWbs: updated };
  }),

  toggleExpandTask: (taskId) => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    updated.tasks = updated.tasks.map((task) =>
      task.id === taskId ? { ...task, expanded: !task.expanded } : task
    );
    return { currentWbs: updated };
  }),

  expandAll: () => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    updated.tasks = updated.tasks.map((task) => ({ ...task, expanded: true }));
    return { currentWbs: updated };
  }),

  collapseAll: () => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    updated.tasks = updated.tasks.map((task) => ({ ...task, expanded: false }));
    return { currentWbs: updated };
  }),

  addTask: (task) => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    updated.tasks = [...updated.tasks, task];
    return { currentWbs: updated };
  }),

  deleteTask: (taskId) => set((state) => {
    if (!state.currentWbs) return {};
    const updated = { ...state.currentWbs };
    const idsToDelete = new Set([taskId]);
    let prevSize = 0;
    while (idsToDelete.size !== prevSize) {
      prevSize = idsToDelete.size;
      updated.tasks.forEach((t) => {
        if (t.parentId && idsToDelete.has(t.parentId)) {
          idsToDelete.add(t.id);
        }
      });
    }
    updated.tasks = updated.tasks.filter((t) => !idsToDelete.has(t.id));
    return { currentWbs: updated };
  }),

  generateWBS: async () => {
    set({ isGenerating: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ isGenerating: false });
  },
}));
