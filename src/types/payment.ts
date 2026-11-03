export interface PaymentRecord {
  id?: number;
  Payment_Id?: string;
  Receipt_No?: string;
  Amount?: number;
  Customer_Name?: string;
  Customer_Id?: string | number;
  Account_Id?: number | string;
  Invoice_Id?: number | string;
  Invoice_No?: string;
  Invoice_Amount?: number;
  Advance_Amount?: number | string;
  Mode_of_Payment?: string;
  Payment_Date?: string;
  Paid_Amount?: number;
  Transaction_No?: string;
  Payment_Flag?: boolean;
  Status?: string | null;
  Is_Deleted?: boolean;
  Counter_Id?: any;
  Shipment_Id?: any;
  Organization_Id?: number | string;
  Sales_Id?: number | string;
  SalesUser_Id?: number | string;
  Created_By?: number | string;
  Updated_By?: number | string;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface PaymentFilterParams {
  Is_Deleted?: boolean;
  page?: number;
  search?: string;
  mode_of_payment?: string;
  from_date?: string;
  to_date?: string;
  customer_name?: string;
}
