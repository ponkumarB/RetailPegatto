export interface FunctionPointCount {
  low: number;
  medium: number;
  high: number;
}

export interface EstimationItem {
  id: string;
  projectName: string;
  projectType: string;
  clientName: string;
  domain: string;
  organization: string;
  developmentApproach: string;
  projectManager: string;
  technologyStack: string;
  estimationDate: string;
  version: string;
  
  // FP counts
  counts: {
    ei: FunctionPointCount;
    eo: FunctionPointCount;
    eq: FunctionPointCount;
    ilf: FunctionPointCount;
    eif: FunctionPointCount;
  };
  
  // GSC ratings (General System Characteristics)
  ratings: {
    dataComm: number;
    distProcessing: number;
    performance: number;
    heavilyUsedConfig: number;
    transactionRate: number;
    onlineDataEntry: number;
    endUserEfficiency: number;
    onlineUpdate: number;
    complexProcessing: number;
    reusability: number;
    installationEase: number;
    operationalEase: number;
    multipleSites: number;
    facilitateChange: number;
  };
  
  // Calculations
  ufp: number;
  tdi: number;
  vaf: number;
  afp: number;
  roundedAFP: number;
  productivityHours: number;
  effortHours: number;
  costPerHour: number;
  contingencyPercent: number;
  currency: string;
  notes: string;
  teamSize: number;
  workingDays: number;
  durationMonths: number;
  totalCost: number;
}
