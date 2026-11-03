import { create } from 'zustand';
import * as api from '@/service/api/Territory/api';

export interface Territory {
  id?: number;
  code: string; // Maps to API Territory_Id or ID
  name: string;
  type: string;
  parentTerritory: string;
  region: string;
  country: string;
  state: string;
  timezone: string;
  isActive: boolean;
  description: string;
  pinCodes?: string;
  cities?: string;
  industrySegment?: string;
  revenueRange?: string;
  productLine?: string;
  customerType?: string;
  createdBy: string;
  createdOn: string;
  territoryType?: string;
  managerName?: string;
  managerId?: number;
}

export interface TerritoryAssignment {
  id: string; // Maps to API ID
  user: {
    id?: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  territory: string; // Territory name
  assignmentType: 'Exclusive' | 'Shared' | 'Backup' | 'Primary Assignment';
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
  lastModifiedBy?: string;
  lastModifiedOn?: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  code: string;
  type: string;
  parent: string | null;
  level: number;
  description: string;
  isActive: boolean;
  assignedUsers: string[];
  timezone?: string;
}

export interface TerritoryRuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface TerritoryRule {
  id: string; // Maps to API ID
  name: string;
  description: string;
  conditions: TerritoryRuleCondition[];
  territory: string; // Territory name (for display)
  territoryId?: string; // Numeric territory ID (for API payload)
  priority: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
}

export interface TerritoryQuota {
  territory: string; // Territory name
  revenueTarget: number;
  leadTarget: number;
  opportunityTarget: number;
  conversionTarget: number;
  id?: string;
  notes?: string;
  isActive?: boolean;
}

export interface QuotaSummaryData {
  total_revenue_target: number;
  total_lead_target: number;
  total_opportunity_target: number;
  conversion_target: number;
}

export interface PerformanceAchievement {
  target: number;
  achieved: number;
  percentage?: number;
}

export interface QuotaPerformanceDashboardData {
  revenue_achievement: PerformanceAchievement;
  lead_achievement: PerformanceAchievement;
  opportunity_achievement: PerformanceAchievement;
  average_conversion: Omit<PerformanceAchievement, 'percentage'>;
}

export interface PerformanceTableItem {
  territory_id: number;
  territory_name: string;
  assigned_user_names: string;
  quota_id: string;
  revenue: PerformanceAchievement;
  leads: PerformanceAchievement;
  opportunities: PerformanceAchievement;
  conversion: Omit<PerformanceAchievement, 'percentage'>;
}


export interface TerritoryAchievement {
  territory: string;
  revenueAchieved: number;
  leadsAchieved: number;
  opportunitiesAchieved: number;
  conversionRate: number;
  winRate: number;
}

interface TerritoryStore {
  territories: Territory[];
  assignments: TerritoryAssignment[];
  hierarchyNodes: HierarchyNode[];
  rules: TerritoryRule[];
  quotas: TerritoryQuota[];
  achievements: TerritoryAchievement[];
  isLoading: boolean;
  error: string | null;

  // New API data states
  quotaSummary: QuotaSummaryData | null;
  performanceDashboard: QuotaPerformanceDashboardData | null;
  performanceTable: PerformanceTableItem[];
  territoryDashboardView: any | null;
  territoryPerformanceDashboard: any | null;

  // Counts for pagination
  territoriesCount: number;
  assignmentsCount: number;
  rulesCount: number;
  quotasCount: number;

  // Loading actions
  loadAllData: () => Promise<void>;
  loadTerritories: (search?: string, page?: number) => Promise<void>;
  loadAssignments: (search?: string, page?: number) => Promise<void>;
  loadRules: (search?: string, page?: number) => Promise<void>;
  loadQuotas: (search?: string, page?: number, territoryId?: number | null) => Promise<void>;
  loadHierarchy: () => Promise<void>;

  // Performance and Summary actions
  loadQuotaSummary: () => Promise<void>;
  loadPerformanceDashboard: (territoryId: number | null, period: [string, string]) => Promise<void>;
  loadPerformanceTable: (territoryId: number | null, period: [string, string]) => Promise<void>;
  loadTerritoryDashboardView: (period: [string, string]) => Promise<void>;
  loadTerritoryPerformanceDashboard: (period: [string, string]) => Promise<void>;

  // Territory CRUD
  addTerritory: (territory: Omit<Territory, 'code'> & { code?: string }) => Promise<void>;
  updateTerritory: (code: string, updated: Partial<Territory>) => Promise<void>;
  deleteTerritory: (code: string) => Promise<void>;

  // Assignment CRUD
  addAssignment: (assignment: TerritoryAssignment) => Promise<void>;
  updateAssignment: (id: string, updated: Partial<TerritoryAssignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Hierarchy Node Actions
  addHierarchyNode: (node: Omit<HierarchyNode, 'id' | 'code'> & { id?: string; code?: string }) => Promise<void>;
  updateHierarchyNode: (id: string, updated: Partial<HierarchyNode>) => Promise<void>;
  deleteHierarchyNode: (id: string) => Promise<void>;
  moveHierarchyNode: (nodeId: string, newParentId: string | null) => Promise<void>;
  mergeHierarchyNodes: (nodeId1: string, nodeId2: string, mergedName: string, mergedCode: string) => Promise<void>;
  splitHierarchyNode: (nodeId: string, split1Name: string, split1Code: string, split2Name: string, split2Code: string) => Promise<void>;

  // Rule Actions
  addRule: (rule: Omit<TerritoryRule, 'id'> & { id?: string }) => Promise<void>;
  updateRule: (id: string, updated: Partial<TerritoryRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  cloneRule: (id: string) => Promise<void>;

  // Quota Actions
  addQuota: (quota: TerritoryQuota) => Promise<void>;
  updateQuota: (territoryName: string, updated: Partial<TerritoryQuota>) => Promise<void>;
  deleteQuota: (territoryName: string) => Promise<void>;
}

// ----------------------------------------------------
// TRANSLATION MAPPERS BETWEEN API AND UI MODELS
// ----------------------------------------------------

const getTerritoryIdByName = (name: string, territories: Territory[]): number | null => {
  const found = territories.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (found) {
    if (found.id !== undefined) return found.id;
    if (!isNaN(Number(found.code))) {
      return Number(found.code);
    }
  }
  return null;
};

const getTerritoryIdByCodeOrName = (val: string, territories: Territory[]): number | null => {
  const found = territories.find(t => t.code.toLowerCase() === val.toLowerCase() || t.name.toLowerCase() === val.toLowerCase());
  if (found) {
    if (found.id !== undefined) return found.id;
    if (!isNaN(Number(found.code))) {
      return Number(found.code);
    }
  }
  return null;
};

const mapApiToUiTerritory = (data: any): Territory => ({
  id: data.id,
  code: String(data.Territory_Id || data.id || ''),
  name: data.TerritoryName || '',
  type: data.Territery_Categeroy || 'Geographical',
  parentTerritory: data.ParentTerritory_Name ? String(data.ParentTerritory_Name) : (data.ParentTerritory ? String(data.ParentTerritory) : ''),
  region: data.Region || '',
  country: data.Country || '',
  state: data.State || '',
  timezone: data.TimeZone || '',
  isActive: data.Is_Active !== false,
  description: data.Description || '',
  pinCodes: Array.isArray(data.PinCodes) ? data.PinCodes.join(', ') : (data.PinCodes || ''),
  cities: Array.isArray(data.Cities) ? data.Cities.join(', ') : (data.Cities || ''),
  industrySegment: data.IndustrySegment || 'All',
  revenueRange: data.RevenueRange || 'All',
  productLine: data.ProductLine || 'All',
  customerType: data.CustomerType || 'All',
  createdBy: data.Created_By
    ? (typeof data.Created_By === 'object'
      ? (data.Created_By.first_name
        ? `${data.Created_By.first_name} ${data.Created_By.last_name || ''}`.trim()
        : (data.Created_By.username || `User ${data.Created_By.id}`))
      : `User ${data.Created_By}`)
    : 'System Admin',
  createdOn: data.Created_Date ? new Date(data.Created_Date).toLocaleDateString() : new Date().toLocaleDateString(),
  territoryType: data.TerritoryType === 'Parent' ? 'Parent' : 'Child',
  managerName: data.Manager_Name || '',
  managerId: data.TerritoryManager || undefined,
});

const mapUiToApiTerritory = (ui: any, territories: Territory[]): api.ApiTerritory => {
  const parentId = ui.parentTerritory ? getTerritoryIdByCodeOrName(ui.parentTerritory, territories) : null;
  const parentObj = territories.find(t => t.code === ui.parentTerritory || t.name === ui.parentTerritory);
  return {
    id: ui.code && !isNaN(Number(ui.code)) ? Number(ui.code) : undefined,
    Organization_Id: Number(localStorage.getItem("Organization_Id")),
    TerritoryName: ui.name,
    Territery_Categeroy: ui.type,
    TerritoryType: ui.territoryType === 'Parent' ? 'Parent' : 'Child',
    Manager_Name: ui.managerName || undefined,
    TerritoryManager: ui.managerId || undefined,
    ParentTerritory: parentId,
    ParentTerritory_Name: parentObj ? parentObj.name : undefined,
    Region: ui.region,
    Country: ui.country,
    State: ui.state,
    TimeZone: ui.timezone,
    Is_Active: ui.isActive,
    Description: ui.description,
    PinCodes: ui.pinCodes ? ui.pinCodes.split(',').map(s => s.trim()).filter(Boolean) : [],
    Cities: ui.cities ? ui.cities.split(',').map(s => s.trim()).filter(Boolean) : [],
    IndustrySegment: ui.industrySegment,
    RevenueRange: ui.revenueRange,
    ProductLine: ui.productLine,
    CustomerType: ui.customerType,
    Created_By: Number(localStorage.getItem("userId")),
    Updated_By: Number(localStorage.getItem("userId")),
  };
};

const mapApiToUiAssignment = (data: any, territories: Territory[]): TerritoryAssignment => {
  const territoryIdObj = data.Territory && typeof data.Territory === 'object' ? data.Territory : null;
  const territoryId = territoryIdObj ? String(territoryIdObj.id || '') : String(data.Territory || '');
  const territoryName = territoryIdObj ? (territoryIdObj.TerritoryName || `Territory ${territoryIdObj.id}`) : (data.Territory_Name || String(data.Territory));
  const terr = territories.find(t => String(t.id) === territoryId || t.code === territoryId || t.name.toLowerCase() === territoryName.toLowerCase());

  const assignedUserObj = data.AssignedUser && typeof data.AssignedUser === 'object' ? data.AssignedUser : null;
  const assignedUserId = assignedUserObj ? Number(assignedUserObj.id) : (data.AssignedUser ? Number(data.AssignedUser) : undefined);
  const assignedUserName = data.AssignedUsername || (assignedUserObj ? (assignedUserObj.username || assignedUserObj.Name || `User ${assignedUserObj.id}`) : `User ${data.AssignedUser}`);
  const assignedUserEmail = data.AssignedUseremail || (assignedUserObj ? (assignedUserObj.email || assignedUserObj.Email || '') : '');

  const createdByObj = data.Created_By && typeof data.Created_By === 'object' ? data.Created_By : null;
  const createdByName = createdByObj ? (createdByObj.username || createdByObj.Name || `User ${createdByObj.id}`) : (data.Created_By ? `User ${data.Created_By}` : 'System Admin');

  return {
    id: String(data.id || ''),
    user: {
      id: assignedUserId,
      name: assignedUserName,
      email: assignedUserEmail,
    },
    territory: terr ? terr.name : territoryName,
    assignmentType: data.Assignment_type || 'Exclusive',
    startDate: data.Start_date ? new Date(data.Start_date).toLocaleDateString() : '',
    endDate: data.End_date ? new Date(data.End_date).toLocaleDateString() : '—',
    isActive: data.Is_active !== false,
    createdBy: createdByName,
    createdOn: data.Created_Date ? new Date(data.Created_Date).toLocaleDateString() : new Date().toLocaleDateString(),
  };
};

const mapUiToApiAssignment = (ui: TerritoryAssignment, territories: Territory[]): api.ApiTerritoryAssignment => {
  const terrId = getTerritoryIdByName(ui.territory, territories) || 1;
  const parseDate = (dStr: string) => {
    try {
      const parsed = new Date(dStr);
      return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : dStr;
    } catch {
      return dStr;
    }
  };
  return {
    id: ui.id && !isNaN(Number(ui.id)) ? Number(ui.id) : undefined,
    Organization_Id: Number(localStorage.getItem("Organization_Id")),
    Territory: terrId,
    AssignedUsername: ui.user.name,
    AssignedUseremail: ui.user.email,
    AssignedUser: ui.user.id || 1,
    Assignment_type: ui.assignmentType,
    Start_date: parseDate(ui.startDate),
    End_date: ui.endDate && ui.endDate !== '—' ? parseDate(ui.endDate) : null,
    Is_active: ui.isActive,
    Created_By: Number(localStorage.getItem("userId")),
    Updated_By: Number(localStorage.getItem("userId")),
  };
};

const mapApiToUiRule = (data: any, territories: Territory[]): TerritoryRule => {
  // Territory can be a nested object { id, TerritoryName, ... } or a plain ID number/string
  const territoryObj = data.Territory && typeof data.Territory === 'object' ? data.Territory : null;
  const territoryId = territoryObj ? String(territoryObj.id || '') : String(data.Territory || '');
  const territoryName = territoryObj
    ? (territoryObj.TerritoryName || `Territory ${territoryObj.id}`)
    : (data.Territory_Name || '');

  // Parse conditions from JSON object to condition list
  const conditions: TerritoryRuleCondition[] = [];
  if (data.Conditions && typeof data.Conditions === 'object') {
    Object.entries(data.Conditions).forEach(([field, value]) => {
      conditions.push({
        field: field.charAt(0).toUpperCase() + field.slice(1),
        operator: '=',
        value: Array.isArray(value) ? value.join(', ') : String(value),
      });
    });
  }
  return {
    id: String(data.id || ''),
    name: data.Rule_Name || '',
    description: data.Description || '',
    conditions: conditions.length > 0 ? conditions : [{ field: 'Default', operator: '=', value: 'Fallback' }],
    territory: territoryName || territoryId, // display name
    territoryId: territoryId,               // numeric ID for API payload
    priority: data.Priority || 1,
    isActive: data.Is_Active !== false,
    validFrom: data.Valid_From ? new Date(data.Valid_From).toLocaleDateString() : '',
    validTo: data.Valid_To ? new Date(data.Valid_To).toLocaleDateString() : 'No Expiry',
  };
};

const mapUiToApiRule = (ui: any, territories: Territory[]): api.ApiTerritoryRule => {
  // Prefer territoryId (numeric PK) if set; otherwise try numeric parse of territory; else name lookup
  let terrId: number;
  if (ui.territoryId && !isNaN(Number(ui.territoryId))) {
    terrId = Number(ui.territoryId);
  } else if (!isNaN(Number(ui.territory)) && ui.territory !== '') {
    terrId = Number(ui.territory);
  } else {
    terrId = getTerritoryIdByName(ui.territory, territories) || 1;
  }

  // Normalize any date string to YYYY-MM-DD (API requirement)
  const toApiDate = (dateStr: string | undefined): string | undefined => {
    if (!dateStr || dateStr === 'No Expiry') return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return undefined;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return undefined;
    }
  };

  const conditionsObj: Record<string, any> = {};
  ui.conditions.forEach(c => {
    if (c.field && c.field !== 'Default') {
      const cleanField = c.field.toLowerCase();
      conditionsObj[cleanField] = c.value.includes(',') ? c.value.split(',').map(s => s.trim()) : c.value;
    }
  });
  return {
    id: ui.id && !isNaN(Number(ui.id)) ? Number(ui.id) : undefined,
    Organization_Id: Number(localStorage.getItem("Organization_Id")),
    Rule_Name: ui.name,
    Description: ui.description,
    Territory: terrId,
    Conditions: conditionsObj,
    Priority: ui.priority,
    Is_Active: ui.isActive,
    Valid_From: toApiDate(ui.validFrom),
    Valid_To: ui.validTo === 'No Expiry' ? undefined : toApiDate(ui.validTo),
    Created_By: Number(localStorage.getItem("userId")),
    Updated_By: Number(localStorage.getItem("userId")),
  };
};

const mapApiToUiQuota = (data: any, territories: Territory[]): TerritoryQuota => {
  const isObj = data.Territory && typeof data.Territory === 'object';
  const territoryId = isObj ? data.Territory.id : data.Territory;
  const territoryNameFromObj = isObj ? data.Territory.TerritoryName : null;

  const terr = territories.find(t => 
    t.id === Number(territoryId) || 
    t.code === String(territoryId) ||
    (territoryNameFromObj && t.name.toLowerCase() === territoryNameFromObj.toLowerCase()) ||
    t.name.toLowerCase() === String(territoryId).toLowerCase()
  );

  return {
    id: String(data.id || ''),
    territory: terr ? terr.name : (territoryNameFromObj || String(data.Territory || '')),
    revenueTarget: Number(data.Revenue_Target || 0),
    leadTarget: Number(data.Lead_Target || 0),
    opportunityTarget: Number(data.Opportunity_Target || 0),
    conversionTarget: Number(data.Conversion_Target || 0),
    notes: data.Notes || '',
    isActive: data.Is_Active !== false,
  };
};

const mapUiToApiQuota = (ui: TerritoryQuota, territories: Territory[]): any => {
  const terrId = getTerritoryIdByName(ui.territory, territories) || 1;
  const payload: any = {
    Organization_Id: Number(localStorage.getItem("Organization_Id")),
    Territory: terrId,
    Revenue_Target: ui.revenueTarget !== undefined && ui.revenueTarget !== null ? ui.revenueTarget : "",
    Lead_Target: ui.leadTarget !== undefined && ui.leadTarget !== null ? ui.leadTarget : "",
    Opportunity_Target: ui.opportunityTarget !== undefined && ui.opportunityTarget !== null ? ui.opportunityTarget : "",
    Conversion_Target: ui.conversionTarget !== undefined && ui.conversionTarget !== null ? ui.conversionTarget : "",
    Notes: ui.notes || "",
    Is_Active: ui.isActive !== false,
    Created_By: Number(localStorage.getItem("userId")),
    Updated_By: Number(localStorage.getItem("userId")),
  };
  if (ui.id && !isNaN(Number(ui.id))) {
    payload.id = Number(ui.id);
  }
  return payload;
};

// ----------------------------------------------------
// ZUSTAND STORE CREATION
// ----------------------------------------------------

export const useTerritoryStore = create<TerritoryStore>((set, get) => ({
  territories: [],
  assignments: [],
  hierarchyNodes: [],
  rules: [],
  quotas: [],
  achievements: [],
  isLoading: false,
  error: null,

  quotaSummary: null,
  performanceDashboard: null,
  performanceTable: [],
  territoryDashboardView: null,
  territoryPerformanceDashboard: null,

  territoriesCount: 0,
  assignmentsCount: 0,
  rulesCount: 0,
  quotasCount: 0,

  // Load everything
  loadAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().loadTerritories();
      await get().loadAssignments();
      await get().loadRules();
      await get().loadQuotas();
    } catch (err: any) {
      set({ error: err.message || 'Failed to load territory module data.' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTerritories: async (search?: string, page?: number) => {
    try {
      let res;
      if (page !== undefined) {
        res = await api.fetchTerritoryList(page);
      } else if (search) {
        res = await api.searchTerritories(search);
      } else {
        res = await api.fetchTerritoryFullList();
      }
      const list = Array.isArray(res) ? res : (res?.results || []);
      const count = Array.isArray(res) ? res.length : (res?.count || list.length);
      const mapped = list.map(mapApiToUiTerritory);
      set({ territories: mapped, territoriesCount: count });
      await get().loadHierarchy(); // update hierarchy nodes when territories load
    } catch (err: any) {
      console.error('Failed to load territories:', err);
      // Set empty arrays to prevent UI errors
      set({ territories: [], territoriesCount: 0 });
    }
  },

  loadAssignments: async (search?: string, page?: number) => {
    try {
      let res;
      if (page !== undefined) {
        res = await api.fetchAssignmentsList(page);
      } else if (search) {
        res = await api.searchAssignments(search);
      } else {
        res = await api.fetchAssignmentsWithoutPagination();
      }
      const list = Array.isArray(res) ? res : (res?.results || []);
      const count = Array.isArray(res) ? res.length : (res?.count || list.length);
      const mapped = list.map(a => mapApiToUiAssignment(a, get().territories));
      set({ assignments: mapped, assignmentsCount: count });
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
      // Set empty arrays to prevent UI errors
      set({ assignments: [], assignmentsCount: 0 });
    }
  },

  loadRules: async (search?: string, page?: number) => {
    try {
      let res;
      if (page !== undefined) {
        res = await api.fetchRulesList(page);
      } else if (search) {
        res = await api.searchRules(search);
      } else {
        res = await api.fetchRulesWithoutPagination();
      }
      const list = Array.isArray(res) ? res : (res?.results || []);
      const count = Array.isArray(res) ? res.length : (res?.count || list.length);
      const mapped = list.map(r => mapApiToUiRule(r, get().territories));
      set({ rules: mapped, rulesCount: count });
    } catch (err: any) {
      console.error('Failed to load rules:', err);
    }
  },

  loadQuotas: async (search?: string, page?: number, territoryId?: number | null) => {
    try {
      let res;
      if (territoryId !== undefined && territoryId !== null) {
        res = await api.filterQuotas({
          Territory: territoryId,
          page: page || 1
        });
      } else if (page !== undefined) {
        res = await api.fetchQuotasList(page);
      } else if (search) {
        res = await api.searchQuotas(search);
      } else {
        res = await api.fetchQuotasWithoutPagination();
      }
      const list = Array.isArray(res) ? res : (res?.results || []);
      const count = Array.isArray(res) ? res.length : (res?.count || list.length);
      const mapped = list.map(q => mapApiToUiQuota(q, get().territories));

      // MapAchievements dynamically from quota targets or fetched list
      const mappedAchievements = list.map((data: any) => {
        const isObj = data.Territory && typeof data.Territory === 'object';
        const territoryIdVal = isObj ? data.Territory.id : data.Territory;
        const territoryNameFromObj = isObj ? data.Territory.TerritoryName : null;

        const terrName = get().territories.find(t => 
          t.id === Number(territoryIdVal) || 
          t.code === String(territoryIdVal) ||
          (territoryNameFromObj && t.name.toLowerCase() === territoryNameFromObj.toLowerCase())
        )?.name || territoryNameFromObj || String(data.Territory || '');

        return {
          territory: terrName,
          revenueAchieved: Number(data.Revenue_Achieved || 0),
          leadsAchieved: Number(data.Lead_Achieved || 0),
          opportunitiesAchieved: Number(data.Opportunity_Achieved || 0),
          conversionRate: Number(data.Conversion_Achieved || 0),
          winRate: Number(data.Conversion_Achieved || 0) * 1.25, // estimate win rate
        };
      });

      set({ quotas: mapped, achievements: mappedAchievements, quotasCount: count });
    } catch (err: any) {
      console.error('Failed to load quotas:', err);
    }
  },

  loadHierarchy: async () => {
    const list = get().territories;
    const nodes: HierarchyNode[] = [
      { id: 'Global', name: 'Global', code: 'GLOB', type: 'Global', parent: null, level: 1, description: 'Global organization level.', isActive: true, assignedUsers: [], timezone: 'UTC' }
    ];

    list.forEach(t => {
      let level = 2;
      let parentId = t.parentTerritory || 'Global';
      if (parentId && parentId !== 'Global') {
        const parent = list.find(p => String(p.id) === parentId || p.code === parentId || p.name === parentId);
        if (parent) {
          level = parent.parentTerritory ? 4 : 3;
          parentId = String(parent.id);
        }
      }

      nodes.push({
        id: String(t.id || t.code),
        name: t.name,
        code: t.code,
        type: t.type,
        parent: parentId,
        level,
        description: t.description || '',
        isActive: t.isActive,
        assignedUsers: [],
        timezone: t.timezone || ''
      });
    });

    // Populate assigned users from assignments
    const asgs = get().assignments;
    asgs.forEach(asg => {
      const node = nodes.find(n => n.name === asg.territory || n.id === asg.territory);
      if (node && asg.user?.name) {
        if (!node.assignedUsers.includes(asg.user.name)) {
          node.assignedUsers.push(asg.user.name);
        }
      }
    });

    set({ hierarchyNodes: nodes });
  },

  // ----------------------------------------------------
  // CRUD OPERATIONS CALLING BACKEND APIs
  // ----------------------------------------------------

  addTerritory: async (territory) => {
    set({ isLoading: true });
    try {
      const payload = mapUiToApiTerritory(territory, get().territories);
      await api.createTerritory(payload);
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTerritory: async (code, updated) => {
    set({ isLoading: true });
    try {
      const existing = get().territories.find(t => t.code === code);
      if (!existing) throw new Error(`Territory with code ${code} not found in store.`);
      const merged = { ...existing, ...updated };
      const payload = mapUiToApiTerritory(merged, get().territories);
      await api.updateTerritory(payload);
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTerritory: async (code) => {
    set({ isLoading: true });
    try {
      const existing = get().territories.find(t => t.code === code);
      const idNum = existing && existing.id ? existing.id : Number(code);
      if (isNaN(idNum)) throw new Error('Invalid territory ID.');
      await api.deleteTerritory(idNum);
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  addAssignment: async (assignment) => {
    set({ isLoading: true });
    try {
      const payload = mapUiToApiAssignment(assignment, get().territories);
      await api.createAssignment(payload);
      await get().loadAssignments();
      await get().loadHierarchy();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAssignment: async (id, updated) => {
    set({ isLoading: true });
    try {
      const existing = get().assignments.find(a => a.id === id);
      if (!existing) throw new Error(`Assignment with ID ${id} not found.`);
      const merged = { ...existing, ...updated };
      const payload = mapUiToApiAssignment(merged, get().territories);
      await api.updateAssignment(payload);
      await get().loadAssignments();
      await get().loadHierarchy();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true });
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('Invalid assignment ID.');
      await api.deleteAssignment(idNum);
      await get().loadAssignments();
      await get().loadHierarchy();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  addHierarchyNode: async (node) => {
    // Creating node creates a Territory under the hood
    const fakeTerritory: Territory = {
      code: '',
      name: node.name,
      type: node.type || 'Geographical',
      parentTerritory: node.parent || '',
      region: 'South India',
      country: 'India',
      state: '',
      timezone: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
      isActive: node.isActive,
      description: node.description,
      createdBy: 'System Admin',
      createdOn: new Date().toLocaleString()
    };
    await get().addTerritory(fakeTerritory);
  },

  updateHierarchyNode: async (id, updated) => {
    const existing = get().territories.find(t => t.code === id);
    if (existing) {
      await get().updateTerritory(id, {
        name: updated.name,
        type: updated.type,
        description: updated.description,
        isActive: updated.isActive,
        parentTerritory: updated.parent || undefined
      });
    }
  },

  deleteHierarchyNode: async (id) => {
    await get().deleteTerritory(id);
  },

  moveHierarchyNode: async (nodeId, newParentId) => {
    set({ isLoading: true });
    try {
      const idNum = Number(nodeId);
      const parentNum = newParentId ? Number(newParentId) : null;
      if (isNaN(idNum)) throw new Error('Invalid territory node ID.');
      await api.moveTerritory({
        territory_id: idNum,
        new_parent_id: parentNum,
        Updated_By: Number(localStorage.getItem("userId"))
      });
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  mergeHierarchyNodes: async (nodeId1, nodeId2, mergedName, mergedCode) => {
    set({ isLoading: true });
    try {
      const id1 = Number(nodeId1);
      const id2 = Number(nodeId2);
      if (isNaN(id1) || isNaN(id2)) throw new Error('Invalid territory ID.');
      await api.mergeTerritories({
        source_territories: [id1, id2],
        new_territory_name: mergedName,
        new_territory_operation: `${mergedName} Operations`,
        created_by: Number(localStorage.getItem("userId")),
        updated_by: Number(localStorage.getItem("userId"))
      });
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  splitHierarchyNode: async (nodeId, split1Name, split1Code, split2Name, split2Code) => {
    set({ isLoading: true });
    try {
      const idNum = Number(nodeId);
      if (isNaN(idNum)) throw new Error('Invalid territory ID.');
      await api.splitTerritory({
        territory_id: idNum,
        created_by: Number(localStorage.getItem("userId")),
        updated_by: Number(localStorage.getItem("userId")),
        children: [
          { territory_name: split1Name },
          { territory_name: split2Name }
        ]
      });
      await get().loadTerritories();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  addRule: async (rule) => {
    set({ isLoading: true });
    try {
      const payload = mapUiToApiRule(rule, get().territories);
      await api.createRule(payload);
      await get().loadRules();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRule: async (id, updated) => {
    set({ isLoading: true });
    try {
      const existing = get().rules.find(r => r.id === id);
      if (!existing) throw new Error(`Rule with ID ${id} not found.`);
      const merged = { ...existing, ...updated };
      const payload = mapUiToApiRule(merged, get().territories);
      await api.updateRule(payload);
      await get().loadRules();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRule: async (id) => {
    set({ isLoading: true });
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('Invalid Rule ID.');
      await api.deleteRule(idNum);
      await get().loadRules();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cloneRule: async (id) => {
    set({ isLoading: true });
    try {
      const rule = get().rules.find(r => r.id === id);
      if (!rule) throw new Error(`Rule ${id} not found.`);
      const payload = mapUiToApiRule({
        ...rule,
        id: '',
        name: `${rule.name} (Copy)`,
        priority: rule.priority + 1
      }, get().territories);
      await api.createRule(payload);
      await get().loadRules();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  addQuota: async (quota) => {
    set({ isLoading: true });
    try {
      const payload = mapUiToApiQuota(quota, get().territories);
      await api.createQuota(payload);
      await get().loadQuotas();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuota: async (territoryName, updated) => {
    set({ isLoading: true });
    try {
      const existing = get().quotas.find(q => q.territory.toLowerCase() === territoryName.toLowerCase());
      if (!existing) throw new Error(`Quota for territory ${territoryName} not found.`);
      const merged = { ...existing, ...updated };
      const payload = mapUiToApiQuota(merged, get().territories);
      await api.updateQuota(payload);
      await get().loadQuotas();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteQuota: async (territoryName) => {
    set({ isLoading: true });
    try {
      const existing = get().quotas.find(q => q.territory.toLowerCase() === territoryName.toLowerCase());
      if (!existing || !existing.id) throw new Error(`Quota not found or missing ID for ${territoryName}.`);
      await api.deleteQuota(Number(existing.id));
      await get().loadQuotas();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  loadQuotaSummary: async () => {
    try {
      const res = await api.fetchQuotaSummary();
      if (res && res.status) {
        set({ quotaSummary: res.data });
      }
    } catch (err: any) {
      console.error('Failed to load quota summary:', err);
    }
  },

  loadPerformanceDashboard: async (territoryId, period) => {
    set({ isLoading: true });
    try {
      const res = await api.fetchQuotaPerformanceDashboard({
        territory_id: territoryId,
        period,
      });
      if (res && res.status) {
        set({ performanceDashboard: res });
      }
    } catch (err: any) {
      console.error('Failed to load quota performance dashboard:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadPerformanceTable: async (territoryId, period) => {
    set({ isLoading: true });
    try {
      const res = await api.fetchQuotaPerformanceTable({
        territory_id: territoryId,
        period,
      });
      if (res && res.status) {
        set({ performanceTable: res.data || [] });
      }
    } catch (err: any) {
      console.error('Failed to load quota performance table:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTerritoryDashboardView: async (period) => {
    set({ isLoading: true });
    try {
      const res = await api.fetchTerritoryDashboardView({ period });
      if (res && res.status) {
        set({ territoryDashboardView: res });
      }
    } catch (err: any) {
      console.error('Failed to load territory dashboard view:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTerritoryPerformanceDashboard: async (period) => {
    set({ isLoading: true });
    try {
      const res = await api.fetchTerritoryPerformanceDashboard({ period });
      if (res && res.status) {
        set({ territoryPerformanceDashboard: res });
      }
    } catch (err: any) {
      console.error('Failed to load territory performance dashboard:', err);
    } finally {
      set({ isLoading: false });
    }
  }
}));
