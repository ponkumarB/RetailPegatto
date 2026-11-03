export interface InvoiceItem {
  id: string;
  description: string;
  details: string;
  quantity: number;
  rate: number;
  tax: string; // e.g. "18% GST" or "0% GST"
  amount: number;
}

export interface InvoicePayment {
  id: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  amountPaid: number;
}

export interface InvoiceNote {
  id: string;
  content: string;
  date: string;
  user: string;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
}

export interface InvoiceActivity {
  id: string;
  type: string; // e.g. "Invoice Created", "Invoice Sent", "Payment Received"
  details: string;
  date: string;
  user: string;
}

export interface InvoiceBilledTo {
  companyName: string;
  contactPerson: string;
  email: string;
  mobileNumber: string;
  address: string;
}

export interface Invoice {
  id: string; // e.g. "INV-2024-00045"
  invoiceNumber: string; // e.g. "INV-2024-00045"
  status: 'Paid' | 'Pending' | 'Overdue' | 'Due Soon' | 'Draft';
  billedTo: InvoiceBilledTo;
  invoiceDate: string; // Date formatted (e.g., "15 May 2024")
  dueDate: string; // Date formatted (e.g., "29 May 2024")
  terms: string; // e.g., "Net 14"
  salesOwner: string; // e.g., "Aarav Rao"
  amountDue: number; // e.g., 0.00
  paidDate?: string; // Date formatted
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number; // calculated at 9% of taxableAmount
  sgst: number; // calculated at 9% of taxableAmount
  total: number; // total amount
  items: InvoiceItem[];
  payments: InvoicePayment[];
  notes: InvoiceNote[];
  attachments: InvoiceAttachment[];
  activities: InvoiceActivity[];
  relatedDeal: string; // e.g., "DEAL-2024-00123"
  relatedAccount: string; // e.g., "Tech Solutions Pvt. Ltd."
  createdBy: string;
  createdAt: string; // Full date-time
  updatedAt: string; // Full date-time
}
