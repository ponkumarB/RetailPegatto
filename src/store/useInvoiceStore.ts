import { create } from 'zustand';
import { Invoice, InvoiceItem, InvoicePayment, InvoiceNote } from '@/types/invoice';

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updatedInvoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addNote: (invoiceId: string, note: Omit<InvoiceNote, 'id' | 'date'> & { id?: string; date?: string }) => void;
  addPayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'paymentDate'> & { id?: string; paymentDate?: string }) => void;
}

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2024-00045',
    invoiceNumber: 'INV-2024-00045',
    status: 'Paid',
    billedTo: {
      companyName: 'Tech Solutions Pvt. Ltd.',
      contactPerson: 'Mr. Rohan Mehta',
      email: 'rohan.mehta@techsolutions.com',
      mobileNumber: '+91 98765 12345',
      address: 'B-120, Sector 62, Noida, Uttar Pradesh - 201309, India'
    },
    invoiceDate: '15 May 2024',
    dueDate: '29 May 2024',
    terms: 'Net 14',
    salesOwner: 'Aarav Rao',
    amountDue: 0.00,
    paidDate: '24 May 2024',
    subTotal: 100000.00,
    discount: 5000.00,
    taxableAmount: 95000.00,
    cgst: 8550.00,
    sgst: 8550.00,
    total: 112100.00,
    items: [
      {
        id: 'itm-1',
        description: 'CRM Implementation',
        details: 'Transaction and setup of CRM system',
        quantity: 1,
        rate: 50000,
        tax: '18% GST',
        amount: 50000
      },
      {
        id: 'itm-2',
        description: 'User Training',
        details: 'On-site training for end users',
        quantity: 2,
        rate: 7500,
        tax: '18% GST',
        amount: 15000
      },
      {
        id: 'itm-3',
        description: 'Customization',
        details: 'Custom module development',
        quantity: 1,
        rate: 20000,
        tax: '18% GST',
        amount: 20000
      },
      {
        id: 'itm-4',
        description: 'Support & Maintenance (Monthly)',
        details: 'System support and maintenance',
        quantity: 3,
        rate: 5000,
        tax: '18% GST',
        amount: 15000
      }
    ],
    payments: [
      {
        id: 'pay-1',
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN-240524-00098',
        paymentDate: '24 May 2024',
        amountPaid: 112100.00
      }
    ],
    notes: [
      {
        id: 'nte-1',
        content: 'Invoice sent successfully via email to client.',
        date: '15 May 2024 10:35 AM',
        user: 'Aarav Rao'
      },
      {
        id: 'nte-2',
        content: 'Payment received via bank transfer. Marked as paid.',
        date: '24 May 2024 04:15 PM',
        user: 'Aarav Rao'
      }
    ],
    attachments: [
      {
        id: 'att-1',
        name: 'Invoice_INV-2024-00045.pdf',
        date: '15 May 2024',
        size: '142 KB',
        type: 'pdf'
      }
    ],
    activities: [
      {
        id: 'act-1',
        type: 'Invoice Created',
        details: 'Invoice was drafted by Aarav Rao.',
        date: '15 May 2024 10:30 AM',
        user: 'Aarav Rao'
      },
      {
        id: 'act-2',
        type: 'Invoice Sent',
        details: 'Invoice sent to rohan.mehta@techsolutions.com',
        date: '15 May 2024 10:35 AM',
        user: 'Aarav Rao'
      },
      {
        id: 'act-3',
        type: 'Payment Confirmed',
        details: 'Payment of ₹112,100.00 confirmed.',
        date: '24 May 2024 04:15 PM',
        user: 'Aarav Rao'
      }
    ],
    relatedDeal: 'DEAL-2024-00123',
    relatedAccount: 'Tech Solutions Pvt. Ltd.',
    createdBy: 'Aarav Rao',
    createdAt: '15 May 2024 10:30 AM',
    updatedAt: '24 May 2024 04:15 PM'
  },
  {
    id: 'INV-2024-00044',
    invoiceNumber: 'INV-2024-00044',
    status: 'Overdue',
    billedTo: {
      companyName: 'Digital Systems India',
      contactPerson: 'Amit Sharma',
      email: 'amit@digitalsystems.in',
      mobileNumber: '+91 99887 76655',
      address: 'A-45, Phase 2, Okhla, New Delhi, India'
    },
    invoiceDate: '12 May 2024',
    dueDate: '26 May 2024',
    terms: 'Net 14',
    salesOwner: 'Sarah Davis',
    amountDue: 85000.00,
    subTotal: 72033.90,
    discount: 0.00,
    taxableAmount: 72033.90,
    cgst: 6483.05,
    sgst: 6483.05,
    total: 85000.00,
    items: [
      {
        id: 'itm-1',
        description: 'Software Consulting',
        details: 'Architecture review & code audit',
        quantity: 1,
        rate: 72033.90,
        tax: '18% GST',
        amount: 85000.00
      }
    ],
    payments: [],
    notes: [],
    attachments: [],
    activities: [
      {
        id: 'act-1',
        type: 'Invoice Created',
        details: 'Invoice was drafted by Sarah Davis.',
        date: '12 May 2024 09:30 AM',
        user: 'Sarah Davis'
      }
    ],
    relatedDeal: 'DEAL-2024-00119',
    relatedAccount: 'Digital Systems India',
    createdBy: 'Sarah Davis',
    createdAt: '12 May 2024 09:30 AM',
    updatedAt: '12 May 2024 09:30 AM'
  },
  {
    id: 'INV-2024-00041',
    invoiceNumber: 'INV-2024-00041',
    status: 'Overdue',
    billedTo: {
      companyName: 'Innovative Infotech',
      contactPerson: 'Sanjay Kapoor',
      email: 'sanjay@innovativeinfo.com',
      mobileNumber: '+91 98765 99999',
      address: 'Plot 104, Sector 44, Gurgaon, India'
    },
    invoiceDate: '08 May 2024',
    dueDate: '22 May 2024',
    terms: 'Net 14',
    salesOwner: 'Michael Brown',
    amountDue: 59000.00,
    subTotal: 50000.00,
    discount: 0.00,
    taxableAmount: 50000.00,
    cgst: 4500.00,
    sgst: 4500.00,
    total: 59000.00,
    items: [
      {
        id: 'itm-1',
        description: 'QA Testing Services',
        details: 'Manual & automated QA testing cycles',
        quantity: 1,
        rate: 50000.00,
        tax: '18% GST',
        amount: 50000.00
      }
    ],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00104',
    relatedAccount: 'Innovative Infotech',
    createdBy: 'Michael Brown',
    createdAt: '08 May 2024 11:00 AM',
    updatedAt: '08 May 2024 11:00 AM'
  },
  {
    id: 'INV-2024-00038',
    invoiceNumber: 'INV-2024-00038',
    status: 'Overdue',
    billedTo: {
      companyName: 'CloudNet Services',
      contactPerson: 'Vikram Malhotra',
      email: 'vikram@cloudnet.com',
      mobileNumber: '+91 91122 33445',
      address: 'Office 702, Ascendas Tower, Chennai, India'
    },
    invoiceDate: '05 May 2024',
    dueDate: '19 May 2024',
    terms: 'Net 14',
    salesOwner: 'Sarah Davis',
    amountDue: 45000.00,
    subTotal: 38135.60,
    discount: 0.00,
    taxableAmount: 38135.60,
    cgst: 3432.20,
    sgst: 3432.20,
    total: 45000.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00099',
    relatedAccount: 'CloudNet Services',
    createdBy: 'Sarah Davis',
    createdAt: '05 May 2024 04:30 PM',
    updatedAt: '05 May 2024 04:30 PM'
  },
  {
    id: 'INV-2024-00046',
    invoiceNumber: 'INV-2024-00046',
    status: 'Overdue',
    billedTo: {
      companyName: 'NextGen Technologies',
      contactPerson: 'Preeti Deshmukh',
      email: 'preeti@nextgentech.com',
      mobileNumber: '+91 90080 70605',
      address: 'Tower C, Tech Oasis, Hyderabad, India'
    },
    invoiceDate: '16 May 2024',
    dueDate: '30 May 2024',
    terms: 'Net 14',
    salesOwner: 'Aarav Rao',
    amountDue: 75600.00,
    subTotal: 64067.80,
    discount: 0.00,
    taxableAmount: 64067.80,
    cgst: 5766.10,
    sgst: 5766.10,
    total: 75600.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00125',
    relatedAccount: 'NextGen Technologies',
    createdBy: 'Aarav Rao',
    createdAt: '16 May 2024 09:00 AM',
    updatedAt: '16 May 2024 09:00 AM'
  },
  {
    id: 'INV-2024-00047',
    invoiceNumber: 'INV-2024-00047',
    status: 'Overdue',
    billedTo: {
      companyName: 'BlueBridge Solutions',
      contactPerson: 'Karan Mehra',
      email: 'karan@bluebridge.com',
      mobileNumber: '+91 98800 11223',
      address: 'B-404, Pinnacle Corporate, Pune, India'
    },
    invoiceDate: '18 May 2024',
    dueDate: '01 Jun 2024',
    terms: 'Net 14',
    salesOwner: 'John Smith',
    amountDue: 98750.00,
    subTotal: 83686.44,
    discount: 0.00,
    taxableAmount: 83686.44,
    cgst: 7531.78,
    sgst: 7531.78,
    total: 98750.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00128',
    relatedAccount: 'BlueBridge Solutions',
    createdBy: 'John Smith',
    createdAt: '18 May 2024 02:00 PM',
    updatedAt: '18 May 2024 02:00 PM'
  },
  {
    id: 'INV-2024-00048',
    invoiceNumber: 'INV-2024-00048',
    status: 'Overdue',
    billedTo: {
      companyName: 'Elite Business Systems',
      contactPerson: 'Nisha Gupta',
      email: 'nisha@elitebiz.com',
      mobileNumber: '+91 99000 88888',
      address: 'Suite 12, Level 4, UB City, Bengaluru, India'
    },
    invoiceDate: '20 May 2024',
    dueDate: '03 Jun 2024',
    terms: 'Net 14',
    salesOwner: 'Sarah Davis',
    amountDue: 64300.00,
    subTotal: 54491.50,
    discount: 0.00,
    taxableAmount: 54491.50,
    cgst: 4904.25,
    sgst: 4904.25,
    total: 64300.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00130',
    relatedAccount: 'Elite Business Systems',
    createdBy: 'Sarah Davis',
    createdAt: '20 May 2024 10:00 AM',
    updatedAt: '20 May 2024 10:00 AM'
  },
  {
    id: 'INV-2024-00050',
    invoiceNumber: 'INV-2024-00050',
    status: 'Due Soon',
    billedTo: {
      companyName: 'Global IT Works',
      contactPerson: 'Ramesh Patel',
      email: 'ramesh@globalit.com',
      mobileNumber: '+91 97766 55443',
      address: 'G-10, Info City, Gandhinagar, India'
    },
    invoiceDate: '22 May 2024', // e.g. Due today relative to June 5, 2024 or whatever
    dueDate: '05 Jun 2024',
    terms: 'Net 14',
    salesOwner: 'John Smith',
    amountDue: 35700.00,
    subTotal: 30254.20,
    discount: 0.00,
    taxableAmount: 30254.20,
    cgst: 2722.90,
    sgst: 2722.90,
    total: 35700.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00135',
    relatedAccount: 'Global IT Works',
    createdBy: 'John Smith',
    createdAt: '22 May 2024 11:30 AM',
    updatedAt: '22 May 2024 11:30 AM'
  },
  {
    id: 'INV-2024-00051',
    invoiceNumber: 'INV-2024-00051',
    status: 'Due Soon',
    billedTo: {
      companyName: 'Prime Software Pvt. Ltd.',
      contactPerson: 'Divya Iyer',
      email: 'divya@primesoft.com',
      mobileNumber: '+91 91234 88776',
      address: 'Ascent Business Hub, Jayanagar, Bengaluru, India'
    },
    invoiceDate: '24 May 2024',
    dueDate: '07 Jun 2024',
    terms: 'Net 14',
    salesOwner: 'Aarav Rao',
    amountDue: 48250.00,
    subTotal: 40889.80,
    discount: 0.00,
    taxableAmount: 40889.80,
    cgst: 3680.10,
    sgst: 3680.10,
    total: 48250.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00140',
    relatedAccount: 'Prime Software Pvt. Ltd.',
    createdBy: 'Aarav Rao',
    createdAt: '24 May 2024 02:30 PM',
    updatedAt: '24 May 2024 02:30 PM'
  },
  {
    id: 'INV-2024-00052',
    invoiceNumber: 'INV-2024-00052',
    status: 'Due Soon',
    billedTo: {
      companyName: 'Matrix Comnet',
      contactPerson: 'Rajesh Nair',
      email: 'rajesh@matrixcomnet.com',
      mobileNumber: '+91 90909 09090',
      address: 'Matrix Plaza, MG Road, Kochi, India'
    },
    invoiceDate: '25 May 2024',
    dueDate: '08 Jun 2024',
    terms: 'Net 14',
    salesOwner: 'Michael Brown',
    amountDue: 51800.00,
    subTotal: 43898.30,
    discount: 0.00,
    taxableAmount: 43898.30,
    cgst: 3950.85,
    sgst: 3950.85,
    total: 51800.00,
    items: [],
    payments: [],
    notes: [],
    attachments: [],
    activities: [],
    relatedDeal: 'DEAL-2024-00142',
    relatedAccount: 'Matrix Comnet',
    createdBy: 'Michael Brown',
    createdAt: '25 May 2024 05:00 PM',
    updatedAt: '25 May 2024 05:00 PM'
  }
];

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: initialInvoices,
  addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
  updateInvoice: (id, updatedInvoice) =>
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updatedInvoice } : inv)),
    })),
  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
    })),
  addNote: (invoiceId, note) =>
    set((state) => ({
      invoices: state.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newNote: InvoiceNote = {
          id: note.id || `nte-${Date.now()}`,
          content: note.content,
          date: note.date || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          user: note.user,
        };
        const updatedNotes = [...(inv.notes || []), newNote];
        const newActivity = {
          id: `act-${Date.now()}`,
          type: 'Note Added',
          details: `Note was added: "${note.content.substring(0, 30)}..."`,
          date: newNote.date,
          user: note.user,
        };
        return {
          ...inv,
          notes: updatedNotes,
          activities: [...(inv.activities || []), newActivity],
          updatedAt: newNote.date,
        };
      }),
    })),
  addPayment: (invoiceId, payment) =>
    set((state) => ({
      invoices: state.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPayment: InvoicePayment = {
          id: payment.id || `pay-${Date.now()}`,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
          paymentDate: payment.paymentDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amountPaid: payment.amountPaid,
        };
        const updatedPayments = [...(inv.payments || []), newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const amountDue = Math.max(0, inv.total - totalPaid);
        const status = amountDue === 0 ? 'Paid' : inv.status;
        const paidDate = amountDue === 0 ? newPayment.paymentDate : inv.paidDate;

        const newActivity = {
          id: `act-${Date.now()}`,
          type: 'Payment Received',
          details: `Recorded payment of ₹${payment.amountPaid.toLocaleString('en-IN')} via ${payment.paymentMethod}.`,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          user: inv.salesOwner,
        };

        return {
          ...inv,
          payments: updatedPayments,
          amountDue,
          status,
          paidDate,
          activities: [...(inv.activities || []), newActivity],
          updatedAt: newActivity.date,
        };
      }),
    })),
}));
