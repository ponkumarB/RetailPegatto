import { create } from 'zustand';
import { Asset, AssetAllocation, AssetRequest, AssetMaintenance } from '@/types/asset';
import * as api from '@/service/api/Assets';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

interface AssetStore {
  assets: Asset[];
  assetsCount: number;
  assetsPage: number;
  allocations: AssetAllocation[];
  allocationsCount: number;
  allocationsPage: number;
  requests: AssetRequest[];
  requestsCount: number;
  requestsPage: number;
  maintenances: AssetMaintenance[];
  maintenancesCount: number;
  maintenancesPage: number;
  categories: Category[];
  paginatedCategories: Category[];
  categoriesCount: number;
  categoriesPage: number;
  paginatedSubCategories: any[];
  subcategoriesCount: number;
  subcategoriesPage: number;
  rawCategories: api.AssetCategory[];
  rawSubCategories: api.AssetSubCategory[];
  rawAssetsForMapping: api.AssetMaster[];
  vendors: any[];
  vendorsCount: number;
  vendorsPage: number;
  isLoaded: boolean;
  isLoading: boolean;
  
  fetchInitialData: () => Promise<void>;
  fetchAssetsPage: (page: number) => Promise<void>;
  fetchAllocationsPage: (page: number) => Promise<void>;
  fetchRequestsPage: (page: number) => Promise<void>;
  fetchMaintenancesPage: (page: number) => Promise<void>;
  fetchCategoriesPage: (page: number) => Promise<void>;
  fetchSubCategoriesPage: (page: number) => Promise<void>;
  fetchVendorsPage: (page: number) => Promise<void>;
  
  addAsset: (asset: Asset) => Promise<void>;
  updateAsset: (id: string, updatedAsset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  
  addAllocation: (allocation: AssetAllocation) => Promise<void>;
  updateAllocation: (id: string, updatedAllocation: Partial<AssetAllocation>) => Promise<void>;
  deleteAllocation: (id: string) => Promise<void>;
  
  addRequest: (request: AssetRequest) => Promise<void>;
  updateRequest: (id: string, updatedRequest: Partial<AssetRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  
  addMaintenance: (maintenance: AssetMaintenance) => Promise<void>;
  updateMaintenance: (id: string, updatedMaintenance: Partial<AssetMaintenance>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  addVendor: (vendor: api.CreateAssetVendorPayload) => Promise<void>;
  updateVendor: (id: string, updatedVendor: Partial<api.AssetVendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;
  deleteSubcategory: (categoryId: string, name: string, subcategoryId?: string) => Promise<void>;
}

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
  return 116; // fallback to default
};

const formatDateToYYYYMMDD = (dateStr: string | null | undefined): string | undefined => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/A' || dateStr.trim() === '') return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return undefined;
};

const formatToISOStringWithTime = (dateStr: string | null | undefined): string | undefined => {
  const yyyymmdd = formatDateToYYYYMMDD(dateStr);
  return yyyymmdd ? `${yyyymmdd}T10:00:00` : undefined;
};


// Helpers to resolve backend IDs for Category, Subcategory, and Vendor
const resolveCategoryId = async (name: string): Promise<number> => {
  const state = useAssetStore.getState();
  const found = state.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (found) {
    return parseInt(found.id);
  }
  // Create it on the fly
  try {
    const backendCat = await api.createAssetCategory({
      Category_Name: name,
      Is_Active: true,
      Created_By: getUserId(),
      Updated_By: getUserId()
    });
    // Add to local state categories
    const newCat: Category = {
      id: backendCat.id.toString(),
      name,
      subcategories: ['Other']
    };
    useAssetStore.setState({ categories: [...state.categories, newCat] });
    return backendCat.id;
  } catch (e) {
    console.error('Failed to resolve/create Category', e);
    return 1; // fallback
  }
};

const resolveSubCategoryId = async (categoryId: number, name: string): Promise<number> => {
  const state = useAssetStore.getState();
  try {
    const backendSubcategories = await api.fetchAssetSubCategoriesWithoutPagination();
    const found = backendSubcategories.find(
      s => Number(s.Category_Id) === Number(categoryId) && s.SubCategory_Name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      return found.id;
    }
    // Create it
    const newSub = await api.createAssetSubCategory({
      Category_Id: categoryId,
      SubCategory_Name: name,
      Is_Active: true,
      Created_By: getUserId(),
      Updated_By: getUserId()
    });
    
    // Update local state categories subcategories
    const updatedCategories = state.categories.map(c => {
      if (c.id === categoryId.toString()) {
        const filtered = c.subcategories.filter(s => s !== 'Other' && s !== 'General');
        return {
          ...c,
          subcategories: [...filtered, name, c.name === 'Other' ? 'General' : 'Other']
        };
      }
      return c;
    });
    useAssetStore.setState({ categories: updatedCategories });
    return newSub.id;
  } catch (e) {
    console.error('Failed to resolve/create SubCategory', e);
    return 1; // fallback
  }
};

const resolveVendorId = async (name: string): Promise<number> => {
  const state = useAssetStore.getState();
  const found = state.vendors.find(v => v.Vendor_Name.toLowerCase() === name.toLowerCase());
  if (found) {
    return found.id;
  }
  // Create it
  try {
    const defaultVendor = await api.createAssetVendor({
      Vendor_Name: name,
      Is_Active: true,
      Created_By: getUserId(),
      Updated_By: getUserId()
    });
    useAssetStore.setState({ vendors: [...state.vendors, defaultVendor] });
    return defaultVendor.id;
  } catch (e) {
    console.error('Failed to resolve/create Vendor', e);
    return 1; // fallback
  }
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  assetsCount: 0,
  assetsPage: 1,
  allocations: [],
  allocationsCount: 0,
  allocationsPage: 1,
  requests: [],
  requestsCount: 0,
  requestsPage: 1,
  maintenances: [],
  maintenancesCount: 0,
  maintenancesPage: 1,
  categories: [],
  paginatedCategories: [],
  categoriesCount: 0,
  categoriesPage: 1,
  paginatedSubCategories: [],
  subcategoriesCount: 0,
  subcategoriesPage: 1,
  rawCategories: [],
  rawSubCategories: [],
  rawAssetsForMapping: [],
  vendors: [],
  vendorsCount: 0,
  vendorsPage: 1,
  isLoaded: false,
  isLoading: false,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch categories, subcategories, and vendors
      let backendCategories: api.AssetCategory[] = [];
      let backendSubcategories: any[] = [];
      let backendVendors: api.AssetVendor[] = [];
      
      try {
        const res: any = await api.fetchAssetCategoriesWithoutPagination();
        backendCategories = Array.isArray(res) ? res : (res?.results || []);
      } catch (e) {
        console.warn('Could not fetch categories from backend.', e);
      }

      try {
        const res: any = await api.fetchAssetSubCategoriesWithoutPagination();
        backendSubcategories = Array.isArray(res) ? res : (res?.results || []);
      } catch (e) {
        console.warn('Could not fetch subcategories from backend.', e);
      }

      try {
        const res: any = await api.fetchAssetVendorsWithoutPagination();
        backendVendors = Array.isArray(res) ? res : (res?.results || []);
      } catch (e) {
        console.warn('Could not fetch vendors from backend.', e);
      }

      // Seed default categories if backend is completely empty
      if (backendCategories.length === 0) {
        console.log('Seeding initial categories to backend...');
        const seedCats = [
          { name: 'Laptop', subs: ['Gaming Laptop', 'Business Laptop', 'Ultrabook', 'Workstation', 'Other'] },
          { name: 'Mobile', subs: ['Android', 'iPhone', 'Other'] },
          { name: 'Monitor', subs: ['LED Monitor', 'OLED Monitor', 'Other'] },
          { name: 'Printer', subs: ['Inkjet Printer', 'Laser Printer', 'Other'] },
          { name: 'Mouse', subs: ['Wired Mouse', 'Wireless Mouse', 'Other'] },
          { name: 'Keyboard', subs: ['Wired Keyboard', 'Wireless Keyboard', 'Other'] },
          { name: 'Storage', subs: ['External HDD', 'External SSD', 'USB Drive', 'Other'] },
          { name: 'Headset', subs: ['Wired Headset', 'Wireless Headset', 'Other'] },
          { name: 'Other', subs: ['General'] }
        ];
        
        for (const sc of seedCats) {
          try {
            const newCat = await api.createAssetCategory({
              Category_Name: sc.name,
              Is_Active: true,
              Created_By: getUserId(),
              Updated_By: getUserId()
            });
            backendCategories.push(newCat);
            for (const sub of sc.subs) {
              try {
                const newSub = await api.createAssetSubCategory({
                  Category_Id: newCat.id,
                  SubCategory_Name: sub,
                  Is_Active: true,
                  Created_By: getUserId(),
                  Updated_By: getUserId()
                });
                backendSubcategories.push(newSub);
              } catch (err) {
                console.error(`Failed to seed subcategory ${sub}`, err);
              }
            }
          } catch (err) {
            console.error(`Failed to seed category ${sc.name}`, err);
          }
        }
      }

      // Seed a generic vendor if vendors are empty
      if (backendVendors.length === 0) {
        try {
          const defaultVendor = await api.createAssetVendor({
            Vendor_Name: 'Generic Vendor',
            Is_Active: true,
            Created_By: getUserId(),
            Updated_By: getUserId()
          });
          backendVendors.push(defaultVendor);
        } catch (err) {
          console.error('Failed to seed default vendor', err);
        }
      }

      // Build categories structure for frontend
      const mappedCategories: Category[] = backendCategories.map(cat => {
        const subs = backendSubcategories
          .filter(sub => Number(sub.Category_Id) === Number(cat.id))
          .map(sub => sub.SubCategory_Name);
        return {
          id: cat.id.toString(),
          name: cat.Category_Name,
          subcategories: subs.length > 0 ? subs : ['Other']
        };
      });

      set({
        categories: mappedCategories,
        rawCategories: backendCategories,
        rawSubCategories: backendSubcategories,
        vendors: backendVendors,
        isLoaded: true
      });

      // Fetch first page of data for all tables in parallel
      await Promise.all([
        get().fetchAssetsPage(1),
        get().fetchAllocationsPage(1),
        get().fetchRequestsPage(1),
        get().fetchMaintenancesPage(1),
        get().fetchCategoriesPage(1),
        get().fetchSubCategoriesPage(1),
        get().fetchVendorsPage(1)
      ]);

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to load initial assets data from backend:', error);
      set({ isLoading: false });
    }
  },

  fetchAssetsPage: async (page: number) => {
    set({ isLoading: true });
    try {
      const response = await api.fetchAssetMasterList(page);
      const backendVendors = get().vendors;
      const rawCategories = get().rawCategories;
      const rawSubCategories = get().rawSubCategories;

      const mappedAssets: Asset[] = response.results.map(item => {
        const catObj = rawCategories.find(c => Number(c.id) === Number(item.Category_Id));
        const subObj = rawSubCategories.find(s => Number(s.id) === Number(item.SubCategory_Id));
        const vendObj = backendVendors.find(v => Number(v.id) === Number(item.Vendor_Id));
        
        const categoryName = catObj ? catObj.Category_Name : 'Laptop';
        
        let type: Asset['type'] = 'Hardware';
        if (categoryName.toLowerCase() === 'software') type = 'Software';
        else if (categoryName.toLowerCase() === 'mobile') type = 'Mobile';
        else if (categoryName.toLowerCase() === 'mouse' || categoryName.toLowerCase() === 'keyboard') type = 'Peripheral';

        return {
          id: item.id.toString(),
          name: item.Asset_Name,
          tagId: item.Asset_Code || item.id.toString(),
          type,
          category: categoryName,
          subcategory: subObj ? subObj.SubCategory_Name : 'Other',
          brand: item.Brand || '',
          model: item.Model_Number || '',
          serialNumber: item.Serial_Number || '',
          barcodeRfid: item.Serial_Number || '',
          status: (item.Asset_Status as any) || 'Available',
          purchaseDate: item.Purchase_Date || '',
          warrantyExpiryDate: item.Warranty_Expiry_Date || '',
          purchasePrice: `${Number(item.Purchase_Cost || 0).toLocaleString()}`,
          vendorSupplier: vendObj ? vendObj.Vendor_Name : 'Generic Vendor',
          invoiceNumber: item.Invoice_Number || '',
          poNumber: item.PO_Number || '',
          criticality: 'Medium',
          assignedTo: item.Current_Employee || undefined,
          department: item.Current_Department || undefined,
          location: item.Location || undefined,
          reportingManager: '',
          description: item.Description || '',
          configurationSpecification: item.Description || '',
          notes: item.Remarks || '',
          operatingSystemSoftware: item.Operating_System || '',
          ipAddress: item.IP_Address || '',
          macAddress: item.MAC_Address || '',
          assetValue: item.Asset_Value ? `${Number(item.Asset_Value).toLocaleString()}` : undefined,
          depreciationMethod: item.Depreciation_Method || 'Straight Line',
          depreciationRate: item.Depreciation_Rate || '',
          Attachment: item.Attachment || []
        };
      });

      set({
        assets: mappedAssets,
        assetsCount: response.count,
        assetsPage: page,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch assets page:', e);
      set({ isLoading: false });
    }
  },

  fetchAllocationsPage: async (page: number) => {
    set({ isLoading: true });
    try {
      const response = await api.fetchAssetTransactions(page);
      
      let rawAssets = get().rawAssetsForMapping;
      if (rawAssets.length === 0) {
        rawAssets = await api.fetchAssetMasterWithoutPagination();
        set({ rawAssetsForMapping: rawAssets });
      }

      const mappedAllocations: AssetAllocation[] = response.results.map(item => {
        const assetObj = rawAssets.find(a => a.id === item.Asset_Id);
        return {
          id: item.id.toString(),
          assetId: item.Asset_Id.toString(),
          assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
          assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown Tag',
          assetType: 'Hardware',
          allocatedTo: item.Employee_Name || '',
          email: item.Email || '',
          phone: item.Mobile_Number || '',
          department: item.Department || '',
          reportingManager: '',
          location: item.Location || '',
          address: item.Address || '',
          costCenter: item.Cost_Center || '',
          allocationDate: item.Transaction_Date || '',
          expectedReturnDate: item.Expected_Return || '',
          status: (assetObj && assetObj.Asset_Status === 'Maintenance') ? 'Maintenance' : (item.Transaction_Type === 'ALLOCATE' ? 'Allocated' : 'Returned'),
          purposeComments: item.Remarks
        };
      });

      set({
        allocations: mappedAllocations,
        allocationsCount: response.count,
        allocationsPage: page,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch allocations page:', e);
      set({ isLoading: false });
    }
  },

  fetchRequestsPage: async (page: number) => {
    set({ isLoading: true });
    try {
      const response = await api.fetchAssetRequests(page);
      
      const mappedRequests: AssetRequest[] = response.results.map(item => ({
        id: item.id.toString(),
        requestedBy: item.Requested_By || '',
        department: item.Department || '',
        email: item.Email || '',
        phone: item.Phone || '',
        reportingManager: item.Reporting_Manager || '',
        costCenter: '',
        location: item.Location || '',
        assetType: item.Asset_Type || 'Laptop',
        brand: item.Preferred_Brand || '',
        model: item.Preferred_Model || '',
        configuration: item.Configuration || '',
        quantity: parseInt(item.Quantity || '1') || 1,
        priority: (item.Priority as any) || 'Medium',
        requiredFor: item.Purpose || '',
        requiredDate: item.Required_Date || '',
        purpose: item.Purpose || '',
        status: (item.Status as any) || 'Pending',
        requestDate: item.Created_Date || '',
        allocatedUserRadio: 'Yes',
        expectedDuration: item.Expected_Duration || 'More than 1 year'
      }));

      set({
        requests: mappedRequests,
        requestsCount: response.count,
        requestsPage: page,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch requests page:', e);
      set({ isLoading: false });
    }
  },

  fetchMaintenancesPage: async (page: number) => {
    set({ isLoading: true });
    try {
      const response = await api.fetchAssetMaintenances(page);

      let rawAssets = get().rawAssetsForMapping;
      if (rawAssets.length === 0) {
        rawAssets = await api.fetchAssetMasterWithoutPagination();
        set({ rawAssetsForMapping: rawAssets });
      }

      const mappedMaintenances: AssetMaintenance[] = response.results.map(item => {
        const assetObj = rawAssets.find(a => a.id === item.Asset_Id);
        return {
          id: item.id.toString(),
          assetId: item.Asset_Id.toString(),
          assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
          assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : 'Unknown Tag',
          maintenanceType: 'Corrective',
          description: item.Issue_Description,
          cost: `${Number(item.Maintenance_Cost || 0).toLocaleString()}`,
          startDate: item.Start_Date ? item.Start_Date.split('T')[0] : '',
          endDate: item.End_Date ? item.End_Date.split('T')[0] : '',
          status: (item.Status as any) || 'Pending',
          performedBy: item.Vendor_Id ? 'Vendor ' + item.Vendor_Id : 'IT Support Team',
          notes: item.Remarks
        };
      });

      set({
        maintenances: mappedMaintenances,
        maintenancesCount: response.count,
        maintenancesPage: page,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch maintenances page:', e);
      set({ isLoading: false });
    }
  },

  fetchCategoriesPage: async (page: number) => {
    try {
      const response = await api.fetchAssetCategories(page);
      const rawSubCategories = get().rawSubCategories;
      const mapped = response.results.map(cat => {
        const subs = rawSubCategories
          .filter(sub => Number(sub.Category_Id) === Number(cat.id))
          .map(sub => sub.SubCategory_Name);
        return {
          id: cat.id.toString(),
          name: cat.Category_Name,
          subcategories: subs.length > 0 ? subs : ['Other']
        };
      });
      set({
        paginatedCategories: mapped,
        categoriesCount: response.count,
        categoriesPage: page
      });
    } catch (e) {
      console.error('Failed to fetch categories page', e);
    }
  },

  fetchSubCategoriesPage: async (page: number) => {
    try {
      const response = await api.fetchAssetSubCategories(page);
      const rawCategories = get().rawCategories;
      const mapped = response.results.map(sub => {
        const catObj = rawCategories.find(c => Number(c.id) === Number(sub.Category_Id));
        return {
          id: sub.id.toString(),
          catId: sub.Category_Id.toString(),
          catName: catObj ? catObj.Category_Name : 'Unknown Category',
          subName: sub.SubCategory_Name
        };
      });
      set({
        paginatedSubCategories: mapped,
        subcategoriesCount: response.count,
        subcategoriesPage: page
      });
    } catch (e) {
      console.error('Failed to fetch subcategories page', e);
    }
  },
  
  addAsset: async (asset) => {
    // Optimistic Update
    set((state) => ({ assets: [asset, ...state.assets] }));
    
    try {
      const categoryId = await resolveCategoryId(asset.category);
      const subCategoryId = await resolveSubCategoryId(categoryId, asset.subcategory || 'Other');
      const vendorId = await resolveVendorId(asset.vendorSupplier || 'Generic Vendor');
      
      const backendAsset = await api.createAssetMaster({
        Asset_Name: asset.name,
        Category_Id: categoryId,
        SubCategory_Id: subCategoryId,
        Vendor_Id: vendorId,
        Brand: asset.brand,
        Model_Number: asset.model,
        Serial_Number: asset.serialNumber,
        Purchase_Date: asset.purchaseDate,
        Invoice_Number: asset.invoiceNumber,
        PO_Number: asset.poNumber,
        Purchase_Cost: parseFloat(asset.purchasePrice.replace(/[^0-9.]/g, '')) || 0,
        Warranty_Start_Date: asset.purchaseDate || new Date().toISOString().split('T')[0],
        Warranty_End_Date: asset.warrantyExpiryDate,
        Current_Employee: asset.assignedTo || '',
        Current_Department: asset.department || '',
        Location: asset.location || '',
        Asset_Status: asset.status,
        Remarks: asset.notes || '',
        Description: asset.description || asset.configurationSpecification || '',
        IP_Address: asset.ipAddress || '',
        MAC_Address: asset.macAddress || '',
        Operating_System: asset.operatingSystemSoftware || '',
        Asset_Value: asset.assetValue ? parseFloat(asset.assetValue.replace(/[^0-9.]/g, ''))?.toString() : '',
        Depreciation_Method: asset.depreciationMethod || 'Straight Line',
        Depreciation_Rate: asset.depreciationRate || '',
        Warranty_Expiry_Date: asset.warrantyExpiryDate,
        Is_Active: true,
        Created_By: getUserId(),
        Updated_By: getUserId(),
        Attachment: asset.Attachment || []
      });

      set((state) => ({
        rawAssetsForMapping: [...state.rawAssetsForMapping, backendAsset],
        assets: state.assets.map((a) => 
          a.id === asset.id 
            ? { 
                ...a, 
                id: backendAsset.id.toString(), 
                tagId: backendAsset.Asset_Code || backendAsset.id.toString() 
              } 
            : a
        )
      }));
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to save asset to backend:', error);
    }
  },

  updateAsset: async (id, updatedAsset) => {
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...updatedAsset } : a))
    }));

    try {
      const backendId = parseInt(id);
      if (isNaN(backendId)) return;

      const existing = useAssetStore.getState().assets.find((a) => a.id === id);
      const rawExisting = useAssetStore.getState().rawAssetsForMapping.find((a) => a.id === backendId);

      if (!existing && !rawExisting) return;

      let payload: any;
      if (existing) {
        const categoryId = await resolveCategoryId(existing.category);
        const subCategoryId = await resolveSubCategoryId(categoryId, existing.subcategory || 'Other');
        const vendorId = await resolveVendorId(existing.vendorSupplier || 'Generic Vendor');

        payload = {
          id: backendId,
          Asset_Name: existing.name,
          Category_Id: categoryId,
          SubCategory_Id: subCategoryId,
          Vendor_Id: vendorId,
          Brand: existing.brand,
          Model_Number: existing.model,
          Serial_Number: existing.serialNumber,
          Purchase_Date: existing.purchaseDate,
          Invoice_Number: existing.invoiceNumber,
          PO_Number: existing.poNumber,
          Purchase_Cost: parseFloat(existing.purchasePrice.replace(/[^0-9.]/g, '')) || 0,
          Warranty_Start_Date: existing.purchaseDate,
          Warranty_End_Date: existing.warrantyExpiryDate,
          Current_Employee: existing.assignedTo || '',
          Current_Department: existing.department || '',
          Location: existing.location || '',
          Asset_Status: existing.status,
          Remarks: existing.notes || '',
          Description: existing.description || existing.configurationSpecification || '',
          IP_Address: existing.ipAddress || '',
          MAC_Address: existing.macAddress || '',
          Operating_System: existing.operatingSystemSoftware || '',
          Asset_Value: existing.assetValue ? parseFloat(existing.assetValue.replace(/[^0-9.]/g, ''))?.toString() : '',
          Depreciation_Method: existing.depreciationMethod || 'Straight Line',
          Depreciation_Rate: existing.depreciationRate || '',
          Warranty_Expiry_Date: existing.warrantyExpiryDate,
          Is_Active: true,
          Is_Deleted: false,
          Created_By: getUserId(),
          Updated_By: getUserId(),
          Attachment: existing.Attachment || []
        };
      } else if (rawExisting) {
        const statusVal = updatedAsset.status !== undefined ? updatedAsset.status : rawExisting.Asset_Status;
        const employeeVal = updatedAsset.assignedTo !== undefined ? (updatedAsset.assignedTo || '') : (rawExisting.Current_Employee || '');
        const deptVal = updatedAsset.department !== undefined ? (updatedAsset.department || '') : (rawExisting.Current_Department || '');
        const locVal = updatedAsset.location !== undefined ? (updatedAsset.location || '') : (rawExisting.Location || '');

        payload = {
          id: backendId,
          Asset_Name: rawExisting.Asset_Name,
          Category_Id: rawExisting.Category_Id,
          SubCategory_Id: rawExisting.SubCategory_Id,
          Vendor_Id: rawExisting.Vendor_Id,
          Brand: rawExisting.Brand,
          Model_Number: rawExisting.Model_Number,
          Serial_Number: rawExisting.Serial_Number,
          Purchase_Date: rawExisting.Purchase_Date,
          Invoice_Number: rawExisting.Invoice_Number,
          PO_Number: rawExisting.PO_Number,
          Purchase_Cost: rawExisting.Purchase_Cost,
          Warranty_Start_Date: rawExisting.Warranty_Start_Date,
          Warranty_End_Date: rawExisting.Warranty_End_Date,
          Current_Employee: employeeVal,
          Current_Department: deptVal,
          Location: locVal,
          Asset_Status: statusVal,
          Remarks: rawExisting.Remarks || '',
          Description: rawExisting.Description || '',
          IP_Address: rawExisting.IP_Address || '',
          MAC_Address: rawExisting.MAC_Address || '',
          Operating_System: rawExisting.Operating_System || '',
          Asset_Value: rawExisting.Asset_Value,
          Depreciation_Method: rawExisting.Depreciation_Method,
          Depreciation_Rate: rawExisting.Depreciation_Rate,
          Warranty_Expiry_Date: rawExisting.Warranty_Expiry_Date,
          Is_Active: rawExisting.Is_Active,
          Is_Deleted: rawExisting.Is_Deleted,
          Created_By: rawExisting.Created_By,
          Updated_By: rawExisting.Updated_By,
          Attachment: rawExisting.Attachment || []
        };
      }

      const updatedBackend = await api.updateAssetMaster(payload);
      set((state) => ({
        rawAssetsForMapping: state.rawAssetsForMapping.map(a => a.id === backendId ? updatedBackend : a)
      }));
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to update asset on backend:', error);
    }
  },

  deleteAsset: async (id) => {
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id)
    }));

    try {
      const backendId = parseInt(id);
      if (!isNaN(backendId)) {
        await api.deleteAssetMaster(backendId);
        set((state) => ({
          rawAssetsForMapping: state.rawAssetsForMapping.filter(a => a.id !== backendId)
        }));
        await get().fetchAssetsPage(get().assetsPage);
      }
    } catch (error) {
      console.error('Failed to delete asset from backend:', error);
    }
  },
  
  addAllocation: async (allocation) => {
    set((state) => ({
      allocations: [allocation, ...state.allocations],
      assets: state.assets.map((a) => a.id === allocation.assetId ? { ...a, status: 'In Use', assignedTo: allocation.allocatedTo } : a)
    }));

    try {
      const backendAssetId = parseInt(allocation.assetId);
      if (isNaN(backendAssetId)) return;

      const backendTx = await api.createAssetTransaction({
        Asset_Id: backendAssetId,
        Transaction_Type: 'ALLOCATE',
        Employee_Name: allocation.allocatedTo,
        Department: allocation.department,
        Location: allocation.location,
        Transaction_Date: formatDateToYYYYMMDD(allocation.allocationDate),
        Expected_Return: formatDateToYYYYMMDD(allocation.expectedReturnDate),
        Email: allocation.email,
        Mobile_Number: allocation.phone,
        Address: allocation.address,
        Cost_Center: allocation.costCenter,
        Remarks: allocation.purposeComments || '',
        Is_Active: true,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });

      set((state) => ({
        allocations: state.allocations.map((al) =>
          al.id === allocation.id
            ? { ...al, id: backendTx?.id != null ? backendTx.id.toString() : al.id }
            : al
        )
      }));

      // Update backend Asset status to In Use
      const asset = useAssetStore.getState().assets.find((a) => a.id === allocation.assetId);
      if (asset) {
        const categoryId = await resolveCategoryId(asset.category);
        const subCategoryId = await resolveSubCategoryId(categoryId, asset.subcategory || 'Other');
        const vendorId = await resolveVendorId(asset.vendorSupplier || 'Generic Vendor');
        await api.updateAssetMaster({
          id: backendAssetId,
          Asset_Name: asset.name,
          Category_Id: categoryId,
          SubCategory_Id: subCategoryId,
          Vendor_Id: vendorId,
          Brand: asset.brand,
          Model_Number: asset.model,
          Serial_Number: asset.serialNumber,
          Purchase_Date: asset.purchaseDate,
          Invoice_Number: asset.invoiceNumber,
          PO_Number: asset.poNumber,
          Purchase_Cost: parseFloat(asset.purchasePrice.replace(/[^0-9.]/g, '')) || 0,
          Warranty_Start_Date: asset.purchaseDate,
          Warranty_End_Date: asset.warrantyExpiryDate,
          Current_Employee: allocation.allocatedTo,
          Current_Department: allocation.department,
          Location: allocation.location,
          Asset_Status: 'In Use',
          Remarks: asset.description || asset.notes || '',
          IP_Address: asset.ipAddress || '',
          MAC_Address: asset.macAddress || '',
          Operating_System: asset.operatingSystemSoftware || '',
          Asset_Value: asset.assetValue ? parseFloat(asset.assetValue.replace(/[^0-9.]/g, ''))?.toString() : '',
          Depreciation_Method: asset.depreciationMethod || 'Straight Line',
          Depreciation_Rate: asset.depreciationRate || '',
          Warranty_Expiry_Date: asset.warrantyExpiryDate,
          Is_Active: true,
          Is_Deleted: false,
          Created_By: getUserId(),
          Updated_By: getUserId()
        });
      }
      await get().fetchAllocationsPage(get().allocationsPage);
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to create allocation on backend:', error);
    }
  },

  updateAllocation: async (id, updatedAllocation) => {
    set((state) => ({
      allocations: state.allocations.map((al) => (al.id === id ? { ...al, ...updatedAllocation } : al))
    }));

    try {
      const backendId = parseInt(id);
      if (isNaN(backendId)) return;

      const existing = useAssetStore.getState().allocations.find((al) => al.id === id);
      if (!existing) return;

      const backendAssetId = parseInt(existing.assetId);
      if (isNaN(backendAssetId)) return;

      await api.updateAssetTransaction({
        id: backendId,
        Asset_Id: backendAssetId,
        Transaction_Type: existing.status === 'Returned' ? 'RETURN' : 'ALLOCATE',
        Employee_Name: existing.allocatedTo,
        Department: existing.department,
        Location: existing.location,
        Transaction_Date: formatDateToYYYYMMDD(existing.allocationDate),
        Expected_Return: formatDateToYYYYMMDD(existing.expectedReturnDate),
        Email: existing.email,
        Mobile_Number: existing.phone,
        Address: existing.address,
        Cost_Center: existing.costCenter,
        Remarks: existing.purposeComments || '',
        Is_Active: true,
        Is_Deleted: false,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });
      await get().fetchAllocationsPage(get().allocationsPage);
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to update allocation on backend:', error);
    }
  },

  deleteAllocation: async (id) => {
    set((state) => ({
      allocations: state.allocations.filter((al) => al.id !== id)
    }));

    try {
      const backendId = parseInt(id);
      if (!isNaN(backendId)) {
        await api.deleteAssetTransaction(backendId);
      }
      await get().fetchAllocationsPage(get().allocationsPage);
      await get().fetchAssetsPage(get().assetsPage);
      toast.success('Asset allocation deleted successfully');
    } catch (error) {
      console.error('Failed to delete allocation from backend:', error);
      toast.error('Failed to delete asset allocation');
    }
  },
  
  addRequest: async (request) => {
    set((state) => ({ requests: [request, ...state.requests] }));

    try {
      const backendReq = await api.createAssetRequest({
        Requested_By: request.requestedBy,
        Department: request.department,
        Email: request.email,
        Phone: request.phone,
        Reporting_Manager: request.reportingManager,
        Location: request.location,
        Asset_Type: request.assetType,
        Preferred_Brand: request.brand,
        Preferred_Model: request.model,
        Configuration: request.configuration || '',
        Quantity: request.quantity.toString(),
        Priority: request.priority,
        Purpose: request.purpose,
        Required_Date: request.requiredDate,
        Expected_Duration: request.expectedDuration,
        Status: request.status,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });

      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === request.id ? { ...r, id: backendReq?.id != null ? backendReq.id.toString() : r.id } : r
        )
      }));
      await get().fetchRequestsPage(get().requestsPage);
    } catch (error) {
      console.error('Failed to create request on backend:', error);
    }
  },

  updateRequest: async (id, updatedRequest) => {
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, ...updatedRequest } : r))
    }));

    try {
      const backendId = parseInt(id);
      if (isNaN(backendId)) return;

      const existing = useAssetStore.getState().requests.find((r) => r.id === id);
      if (!existing) return;

      await api.updateAssetRequest({
        id: backendId,
        Requested_By: existing.requestedBy,
        Department: existing.department,
        Email: existing.email,
        Phone: existing.phone,
        Reporting_Manager: existing.reportingManager,
        Location: existing.location,
        Asset_Type: existing.assetType,
        Preferred_Brand: existing.brand,
        Preferred_Model: existing.model,
        Configuration: existing.configuration || '',
        Quantity: existing.quantity.toString(),
        Priority: existing.priority,
        Purpose: existing.purpose,
        Required_Date: existing.requiredDate,
        Expected_Duration: existing.expectedDuration,
        Status: existing.status,
        Is_Deleted: false,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });
      await get().fetchRequestsPage(get().requestsPage);
    } catch (error) {
      console.error('Failed to update request on backend:', error);
    }
  },

  deleteRequest: async (id) => {
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== id)
    }));

    try {
      const backendId = parseInt(id);
      if (!isNaN(backendId)) {
        await api.deleteAssetRequest(backendId);
      }
      await get().fetchRequestsPage(get().requestsPage);
      toast.success('Asset request deleted successfully');
    } catch (error) {
      console.error('Failed to delete request from backend:', error);
      toast.error('Failed to delete asset request');
    }
  },
  
  addMaintenance: async (maintenance) => {
    set((state) => ({
      maintenances: [maintenance, ...state.maintenances],
      assets: state.assets.map((a) => a.id === maintenance.assetId ? { ...a, status: 'Maintenance' } : a)
    }));

    try {
      const backendAssetId = parseInt(maintenance.assetId);
      if (isNaN(backendAssetId)) return;

      const backendMnt = await api.createAssetMaintenance({
        Asset_Id: backendAssetId,
        Vendor_Id: 1,
        Issue_Description: maintenance.description,
        Maintenance_Cost: parseFloat(maintenance.cost.replace(/[^0-9.]/g, '')) || 0,
        Start_Date: formatToISOStringWithTime(maintenance.startDate),
        End_Date: formatToISOStringWithTime(maintenance.endDate),
        Status: maintenance.status,
        Remarks: maintenance.notes || '',
        Created_By: getUserId(),
        Updated_By: getUserId()
      });

      set((state) => ({
        maintenances: state.maintenances.map((m) =>
          m.id === maintenance.id ? { ...m, id: backendMnt?.id != null ? backendMnt.id.toString() : m.id } : m
        )
      }));

      // Update backend Asset status to Maintenance
      const asset = useAssetStore.getState().assets.find((a) => a.id === maintenance.assetId);
      if (asset) {
        const categoryId = await resolveCategoryId(asset.category);
        const subCategoryId = await resolveSubCategoryId(categoryId, asset.subcategory || 'Other');
        const vendorId = await resolveVendorId(asset.vendorSupplier || 'Generic Vendor');
        await api.updateAssetMaster({
          id: backendAssetId,
          Asset_Name: asset.name,
          Category_Id: categoryId,
          SubCategory_Id: subCategoryId,
          Vendor_Id: vendorId,
          Brand: asset.brand,
          Model_Number: asset.model,
          Serial_Number: asset.serialNumber,
          Purchase_Date: asset.purchaseDate,
          Invoice_Number: asset.invoiceNumber,
          PO_Number: asset.poNumber,
          Purchase_Cost: parseFloat(asset.purchasePrice.replace(/[^0-9.]/g, '')) || 0,
          Warranty_Start_Date: asset.purchaseDate,
          Warranty_End_Date: asset.warrantyExpiryDate,
          Asset_Status: 'Maintenance',
          Remarks: asset.description || asset.notes || '',
          IP_Address: asset.ipAddress || '',
          MAC_Address: asset.macAddress || '',
          Operating_System: asset.operatingSystemSoftware || '',
          Asset_Value: asset.assetValue ? parseFloat(asset.assetValue.replace(/[^0-9.]/g, ''))?.toString() : '',
          Depreciation_Method: asset.depreciationMethod || 'Straight Line',
          Depreciation_Rate: asset.depreciationRate || '',
          Warranty_Expiry_Date: asset.warrantyExpiryDate,
          Is_Active: true,
          Is_Deleted: false,
          Created_By: getUserId(),
          Updated_By: getUserId()
        });
      }
      await get().fetchMaintenancesPage(get().maintenancesPage);
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to create maintenance on backend:', error);
    }
  },

  updateMaintenance: async (id, updatedMaintenance) => {
    set((state) => ({
      maintenances: state.maintenances.map((m) => (m.id === id ? { ...m, ...updatedMaintenance } : m)),
      assets: state.assets.map((a) => {
        const relatedMaintenance = state.maintenances.find(m => m.id === id);
        if (relatedMaintenance && relatedMaintenance.assetId === a.id && updatedMaintenance.status === 'Completed') {
          return { ...a, status: 'Available' };
        }
        return a;
      })
    }));

    try {
      const backendId = parseInt(id);
      if (isNaN(backendId)) return;

      const existing = useAssetStore.getState().maintenances.find((m) => m.id === id);
      if (!existing) return;

      const backendAssetId = parseInt(existing.assetId);
      if (isNaN(backendAssetId)) return;

      await api.updateAssetMaintenance({
        id: backendId,
        Asset_Id: backendAssetId,
        Vendor_Id: 1,
        Issue_Description: existing.description,
        Maintenance_Cost: parseFloat(existing.cost.replace(/[^0-9.]/g, '')) || 0,
        Start_Date: formatToISOStringWithTime(existing.startDate),
        End_Date: formatToISOStringWithTime(existing.endDate),
        Status: existing.status,
        Remarks: existing.notes || '',
        Is_Deleted: false,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });

      if (updatedMaintenance.status === 'Completed') {
        const asset = useAssetStore.getState().assets.find((a) => a.id === existing.assetId);
        if (asset) {
          const categoryId = await resolveCategoryId(asset.category);
          const subCategoryId = await resolveSubCategoryId(categoryId, asset.subcategory || 'Other');
          const vendorId = await resolveVendorId(asset.vendorSupplier || 'Generic Vendor');
          await api.updateAssetMaster({
            id: backendAssetId,
            Asset_Name: asset.name,
            Category_Id: categoryId,
            SubCategory_Id: subCategoryId,
            Vendor_Id: vendorId,
            Brand: asset.brand,
            Model_Number: asset.model,
            Serial_Number: asset.serialNumber,
            Purchase_Date: asset.purchaseDate,
            Invoice_Number: asset.invoiceNumber,
            PO_Number: asset.poNumber,
            Purchase_Cost: parseFloat(asset.purchasePrice.replace(/[^0-9.]/g, '')) || 0,
            Warranty_Start_Date: asset.purchaseDate,
            Warranty_End_Date: asset.warrantyExpiryDate,
            Asset_Status: 'Available',
            Remarks: asset.description || asset.notes || '',
            IP_Address: asset.ipAddress || '',
            MAC_Address: asset.macAddress || '',
            Operating_System: asset.operatingSystemSoftware || '',
            Asset_Value: asset.assetValue ? parseFloat(asset.assetValue.replace(/[^0-9.]/g, ''))?.toString() : '',
            Depreciation_Method: asset.depreciationMethod || 'Straight Line',
            Depreciation_Rate: asset.depreciationRate || '',
            Warranty_Expiry_Date: asset.warrantyExpiryDate,
            Is_Active: true,
            Is_Deleted: false,
            Created_By: getUserId(),
            Updated_By: getUserId()
          });
        }
      }
      await get().fetchMaintenancesPage(get().maintenancesPage);
      await get().fetchAssetsPage(get().assetsPage);
    } catch (error) {
      console.error('Failed to update maintenance on backend:', error);
    }
  },

  deleteMaintenance: async (id) => {
    set((state) => ({
      maintenances: state.maintenances.filter((m) => m.id !== id)
    }));

    try {
      const backendId = parseInt(id);
      if (!isNaN(backendId)) {
        await api.deleteAssetMaintenance(backendId);
      }
      await get().fetchMaintenancesPage(get().maintenancesPage);
      await get().fetchAssetsPage(get().assetsPage);
      toast.success('Maintenance record deleted successfully');
    } catch (error) {
      console.error('Failed to delete maintenance from backend:', error);
      toast.error('Failed to delete maintenance record');
    }
  },

  addCategory: async (name) => {
    if (useAssetStore.getState().categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.warning(`Category "${name}" already exists.`);
      return;
    }
    
    const tempId = `cat-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCat: Category = {
      id: tempId,
      name,
      subcategories: ['Other']
    };
    set((state) => ({ categories: [...state.categories, newCat] }));

    try {
      const backendCat = await api.createAssetCategory({
        Category_Name: name,
        Is_Active: true,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });

      const rawCats = await api.fetchAssetCategoriesWithoutPagination();
      const rawSubs = get().rawSubCategories;
      const mapped = rawCats.map(cat => {
        const subs = rawSubs.filter(s => Number(s.Category_Id) === Number(cat.id)).map(s => s.SubCategory_Name);
        return { id: cat.id.toString(), name: cat.Category_Name, subcategories: subs.length > 0 ? subs : ['Other'] };
      });
      set({ 
        rawCategories: rawCats,
        categories: mapped
      });

      toast.success(`Category "${name}" created successfully.`);
      await get().fetchCategoriesPage(get().categoriesPage);
    } catch (error) {
      console.error('Failed to add category on backend:', error);
      toast.error(`Failed to create category "${name}".`);
    }
  },

  deleteCategory: async (id) => {
    const existingCat = useAssetStore.getState().categories.find(c => c.id === id || c.name === id);
    const catLabel = existingCat ? existingCat.name : '';
    set((state) => ({
      categories: state.categories.filter(c => c.id !== id && c.name !== id)
    }));

    try {
      let catId = parseInt(id);
      if (isNaN(catId)) {
        const cat = useAssetStore.getState().categories.find(c => c.name === id);
        if (cat) catId = parseInt(cat.id);
      }
      if (!isNaN(catId)) {
        await api.deleteAssetCategory(catId);
        
        const rawCats = await api.fetchAssetCategoriesWithoutPagination();
        const rawSubs = get().rawSubCategories;
        const mapped = rawCats.map(cat => {
          const subs = rawSubs.filter(s => Number(s.Category_Id) === Number(cat.id)).map(s => s.SubCategory_Name);
          return { id: cat.id.toString(), name: cat.Category_Name, subcategories: subs.length > 0 ? subs : ['Other'] };
        });
        set({ 
          rawCategories: rawCats,
          categories: mapped
        });

        toast.success(`Category "${catLabel || id}" deleted successfully.`);
        await get().fetchCategoriesPage(get().categoriesPage);
      }
    } catch (error) {
      console.error('Failed to delete category from backend:', error);
      toast.error(`Failed to delete category "${catLabel || id}".`);
    }
  },

  addSubcategory: async (categoryId, name) => {
    let parentCat = useAssetStore.getState().categories.find(c => c.id === categoryId || c.name === categoryId);
    if (parentCat && parentCat.subcategories.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.warning(`Subcategory "${name}" already exists under category "${parentCat.name}".`);
      return;
    }

    set((state) => ({
      categories: state.categories.map(c => {
        if (c.id === categoryId || c.name === categoryId) {
          const filtered = c.subcategories.filter(s => s !== 'Other' && s !== 'General');
          return {
            ...c,
            subcategories: [...filtered, name, c.name === 'Other' ? 'General' : 'Other']
          };
        }
        return c;
      })
    }));

    try {
      let catId = parseInt(categoryId);
      if (isNaN(catId)) {
        const cat = useAssetStore.getState().categories.find(c => c.name === categoryId || c.id === categoryId);
        if (cat) catId = parseInt(cat.id);
      }

      if (!isNaN(catId)) {
        await api.createAssetSubCategory({
          Category_Id: catId,
          SubCategory_Name: name,
          Is_Active: true,
          Created_By: getUserId(),
          Updated_By: getUserId()
        });

        const rawCats = get().rawCategories;
        const rawSubs = await api.fetchAssetSubCategoriesWithoutPagination();
        const mapped = rawCats.map(cat => {
          const subs = rawSubs.filter(s => Number(s.Category_Id) === Number(cat.id)).map(s => s.SubCategory_Name);
          return { id: cat.id.toString(), name: cat.Category_Name, subcategories: subs.length > 0 ? subs : ['Other'] };
        });
        set({ 
          rawSubCategories: rawSubs,
          categories: mapped
        });

        toast.success(`Subcategory "${name}" added to category "${parentCat ? parentCat.name : categoryId}".`);
        await get().fetchCategoriesPage(get().categoriesPage);
        await get().fetchSubCategoriesPage(get().subcategoriesPage);
      }
    } catch (error) {
      console.error('Failed to add subcategory on backend:', error);
      toast.error(`Failed to add subcategory "${name}".`);
    }
  },

  deleteSubcategory: async (categoryId, name, subcategoryId) => {
    set((state) => ({
      categories: state.categories.map(c => {
        const targetIdStr = categoryId.toString();
        if (c.id === targetIdStr || c.name === categoryId) {
          return {
            ...c,
            subcategories: c.subcategories.filter(s => s !== name)
          };
        }
        return c;
      })
    }));

    try {
      let subId: number | null = null;

      if (subcategoryId) {
        subId = parseInt(subcategoryId);
      } else {
        let catId = parseInt(categoryId);
        if (isNaN(catId)) {
          const cat = useAssetStore.getState().categories.find(c => c.name === categoryId || c.id === categoryId);
          if (cat) catId = parseInt(cat.id);
        }

        if (!isNaN(catId)) {
          const rawSubs = get().rawSubCategories;
          const subObj = rawSubs.find(
            s => Number(s.Category_Id) === Number(catId) && s.SubCategory_Name.trim().toLowerCase() === name.trim().toLowerCase()
          );
          if (subObj) {
            subId = subObj.id;
          }
        }
      }

      if (subId !== null && !isNaN(subId)) {
        await api.deleteAssetSubCategory(subId);

        const updatedRawSubs = await api.fetchAssetSubCategoriesWithoutPagination();
        const rawCats = get().rawCategories;
        const mapped = rawCats.map(cat => {
          const subs = updatedRawSubs.filter(s => Number(s.Category_Id) === Number(cat.id)).map(s => s.SubCategory_Name);
          return { id: cat.id.toString(), name: cat.Category_Name, subcategories: subs.length > 0 ? subs : ['Other'] };
        });
        set({ 
          rawSubCategories: updatedRawSubs,
          categories: mapped
        });

        toast.success(`Subcategory "${name}" deleted successfully.`);
        await get().fetchCategoriesPage(get().categoriesPage);
        await get().fetchSubCategoriesPage(get().subcategoriesPage);
      } else {
        toast.error(`Could not locate subcategory "${name}" to delete.`);
      }
    } catch (error) {
      console.error('Failed to delete subcategory on backend:', error);
      toast.error(`Failed to delete subcategory "${name}".`);
    }
  },

  fetchVendorsPage: async (page: number) => {
    set({ isLoading: true });
    try {
      const response = await api.fetchAssetVendors(page);
      set({
        vendors: response.results,
        vendorsCount: response.count,
        vendorsPage: page,
        isLoading: false
      });
    } catch (e) {
      console.error('Failed to fetch vendors page:', e);
      set({ isLoading: false });
    }
  },

  addVendor: async (vendor) => {
    set({ isLoading: true });
    try {
      const backendVendor = await api.createAssetVendor({
        ...vendor,
        Created_By: getUserId(),
        Updated_By: getUserId()
      });
      set((state) => ({
        vendors: [backendVendor, ...state.vendors],
        vendorsCount: state.vendorsCount + 1,
        isLoading: false
      }));
      toast.success(`Vendor "${vendor.Vendor_Name}" added successfully.`);
      await get().fetchVendorsPage(get().vendorsPage);
    } catch (error) {
      console.error('Failed to save vendor to backend:', error);
      set({ isLoading: false });
      toast.error('Failed to add vendor.');
    }
  },

  updateVendor: async (id, updatedVendor) => {
    set({ isLoading: true });
    try {
      const backendId = parseInt(id);
      if (isNaN(backendId)) return;

      const updated = await api.updateAssetVendor({
        id: backendId,
        ...updatedVendor,
        Updated_By: getUserId()
      });

      set((state) => ({
        vendors: state.vendors.map((v) => (v.id === backendId ? updated : v)),
        isLoading: false
      }));
      toast.success('Vendor updated successfully.');
      await get().fetchVendorsPage(get().vendorsPage);
    } catch (error) {
      console.error('Failed to update vendor on backend:', error);
      set({ isLoading: false });
      toast.error('Failed to update vendor.');
    }
  },

  deleteVendor: async (id) => {
    set({ isLoading: true });
    try {
      const backendId = parseInt(id);
      if (!isNaN(backendId)) {
        await api.deleteAssetVendor(backendId);
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== backendId),
          vendorsCount: Math.max(0, state.vendorsCount - 1),
          isLoading: false
        }));
        toast.success('Vendor deleted successfully.');
        await get().fetchVendorsPage(get().vendorsPage);
      }
    } catch (error) {
      console.error('Failed to delete vendor from backend:', error);
      set({ isLoading: false });
      toast.error('Failed to delete vendor.');
    }
  }
}));
