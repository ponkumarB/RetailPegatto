export interface BenchRecord {
  id?: number | string;
  Organization_Id?: number;
  Employee_Id?: number;
  Employee_Name: string;
  Employee_Code: string;
  Department: string;
  Designation: string;
  Skills: string;
  Bench_Date: string;
  Bench_EndDate?: string;
  Location: string;
  Bench_Duration?: string;
  Available_From?: string;
  Availability: string;
  Bench_Reason?: string;
  Bench_Status: string;
  Expected_Project?: string;
  Experience?: number;
  Expected_Allocation_Date?: string;
  Allocation_Priority?: string;
  Bench_Type?: string;
  Allocation_Manager?: number;
  Notes?: string;
  Created_By?: number;
  Updated_By?: number;
}
