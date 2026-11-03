export interface Asset {
  id: string;
  name: string;
  tagId: string;
  type: 'Hardware' | 'Software' | 'Peripheral' | 'Mobile' | 'Furniture' | 'Office Supply';
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  serialNumber: string;
  barcodeRfid?: string;
  status: 'Active' | 'In Use' | 'Available' | 'Maintenance' | 'Retired' | 'Disposed';
  purchaseDate: string;
  warrantyExpiryDate: string;
  purchasePrice: string;
  vendorSupplier: string;
  invoiceNumber: string;
  poNumber: string;
  criticality: 'High' | 'Medium' | 'Low';
  
  // Assignment
  assignedTo?: string;
  department?: string;
  location?: string;
  reportingManager?: string;
  
  // Details
  description?: string;
  Description?: string;
  configurationSpecification?: string;
  operatingSystemSoftware?: string;
  ipAddress?: string;
  macAddress?: string;
  assetValue?: string;
  depreciationMethod?: string;
  depreciationRate?: string;
  
  // Attachments & notes
  image?: string;
  documents?: string[];
  notes?: string;
  Attachment?: any[];
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  assetType: string;
  allocatedTo: string;
  email: string;
  phone: string;
  department: string;
  reportingManager: string;
  location: string;
  address: string;
  costCenter: string;
  allocationDate: string;
  expectedReturnDate: string;
  status: 'Allocated' | 'Returned' | 'Available' | 'Maintenance';
  purposeComments?: string;
  attachments?: string[];
}

export interface AssetRequest {
  id: string;
  requestedBy: string;
  department: string;
  email: string;
  phone: string;
  reportingManager: string;
  costCenter: string;
  location: string;
  
  // Details
  assetType: string;
  brand: string;
  model: string;
  configuration?: string;
  quantity: number;
  priority: 'High' | 'Medium' | 'Low';
  requiredFor: string;
  requiredDate: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Issued' | 'Rejected';
  requestDate: string;
  
  allocatedUserRadio: 'Yes' | 'No';
  expectedDuration: string;
  attachments?: string[];
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  maintenanceType: 'Preventive' | 'Corrective' | 'Upgrade' | 'Calibration';
  description: string;
  cost: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  performedBy: string;
  notes?: string;
}
