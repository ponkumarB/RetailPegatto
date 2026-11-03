import { create } from 'zustand';
import {
  fetchLoyaltyWalletsAPI,
  createLoyaltyWalletAPI,
  updateLoyaltyWalletAPI,
  deleteLoyaltyWalletAPI,
  fetchLoyaltyTransactionsAPI,
  createLoyaltyTransactionAPI,
  fetchLoyaltyRulesAPI,
  createLoyaltyRuleAPI,
  updateLoyaltyRuleAPI,
  deleteLoyaltyRuleAPI,
} from '@/service/api/loyalty/api';
import { getLocalData, saveLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

export interface LoyaltyRule {
  id: string;
  ruleCode?: string;
  name: string;
  type: string;
  pointsPerAmount: number;
  earningMultiplier: number;
  minPurchase?: number | null;
  maxPoints?: number | null;
  maxPointsPerDay?: number | null;
  priority?: number;
  applicableTo?: string;
  applicableTiers?: string[];
  applicableCategories?: string[];
  validFrom?: string;
  validTo?: string;
  expiryDays?: number;
  reminderDays?: number;
  status: string;
  description?: string;
  termsConditions?: string;
}

export interface LoyaltyTransaction {
  id: string;
  transactionId: string;
  date: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  walletId?: string;
  walletCode?: string;
  type: 'CREDIT' | 'DEBIT' | 'BONUS' | 'ADJUSTMENT' | 'Earned' | 'Redeemed' | 'Expired' | 'Adjusted';
  points: number;
  referenceType?: string;
  referenceNumber?: string;
  invoiceRef?: string;
  balance?: number;
  balanceAfter: number;
  status?: 'COMPLETED' | 'REVERSED' | 'PENDING' | 'CANCELLED';
  remarks?: string;
  notes?: string;
}

export interface LoyaltyWallet {
  id: string;
  walletId?: string;
  backendId?: number;
  customerId?: string;
  customerRawId?: number;
  walletCode?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  currentBalance: number;
  totalPoints?: number;
  availablePoints?: number;
  redeemedPoints?: number;
  pendingPoints?: number;
  nextExpiryDate?: string;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lastActivity: string;
  memberSince: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
}

interface LoyaltyState {
  rules: LoyaltyRule[];
  transactions: LoyaltyTransaction[];
  wallets: LoyaltyWallet[];
  isLoading: boolean;
  
  loadWallets: (params?: any) => Promise<void>;
  loadTransactions: (params?: any) => Promise<void>;
  loadRules: (params?: any) => Promise<void>;

  addRule: (rule: Omit<LoyaltyRule, 'id'>) => Promise<void>;
  updateRule: (id: string, updated: Partial<LoyaltyRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  addPoints: (customerPhone: string, points: number, notes?: string, invoiceRef?: string) => void;
  redeemPoints: (customerPhone: string, points: number, notes?: string, invoiceRef?: string) => boolean;
  addWallet: (wallet: Omit<LoyaltyWallet, 'id' | 'currentBalance' | 'lifetimeEarned' | 'lifetimeRedeemed' | 'lastActivity' | 'memberSince'>) => void;
  createWallet: (data: {
    customerId: string;
    customerRawId?: number;
    walletCode: string;
    initialPoints: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }) => Promise<void>;
  updateWallet: (id: string, data: Partial<LoyaltyWallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  processLoyaltyTransaction: (data: {
    walletId: string;
    type: 'CREDIT' | 'DEBIT' | 'BONUS' | 'ADJUSTMENT';
    points: number;
    referenceType: string;
    referenceNumber: string;
    remarks?: string;
  }) => Promise<void>;
  reverseLoyaltyTransaction: (idOrTxId: string) => void;
  deleteLoyaltyTransaction: (idOrTxId: string) => void;
}

const initialRules: LoyaltyRule[] = [
  {
    id: 'rule-1',
    ruleCode: 'LR-001',
    name: 'Standard Store Shopping Points',
    type: 'Standard',
    pointsPerAmount: 100, // 1 point per 100 spent
    earningMultiplier: 1,
    minPurchase: 100,
    expiryDays: 365,
    status: 'Active',
    description: 'Earn 1 reward point for every ₹100 spent in-store.',
    validFrom: '2026-01-01',
    validTo: '2026-12-31'
  },
  {
    id: 'rule-2',
    ruleCode: 'LR-002',
    name: 'Welcome First Order Bonus',
    type: 'Bonus',
    pointsPerAmount: 100,
    earningMultiplier: 2,
    minPurchase: 500,
    maxPoints: 500,
    expiryDays: 90,
    status: 'Active',
    description: 'Double reward points on the first billing with a minimum purchase of ₹500.',
    validFrom: '2026-01-01',
    validTo: '2026-12-31'
  },
  {
    id: 'rule-3',
    ruleCode: 'LR-003',
    name: 'Weekend Grocery Fest Multiplier',
    type: 'Promotional',
    pointsPerAmount: 100,
    earningMultiplier: 3,
    minPurchase: 1000,
    expiryDays: 180,
    status: 'Active',
    description: 'Triple reward points on Saturday and Sunday billing over ₹1,000.',
    validFrom: '2026-06-01',
    validTo: '2026-12-31'
  },
  {
    id: 'rule-4',
    ruleCode: 'LR-004',
    name: 'Customer Birthday Special Bonus',
    type: 'Birthday',
    pointsPerAmount: 500,
    earningMultiplier: 2,
    minPurchase: 0,
    maxPoints: 1000,
    expiryDays: 30,
    status: 'Active',
    description: 'Instant 200 points credited in the birthday month of registered loyalty member.',
    validFrom: '2026-01-01',
    validTo: '2026-12-31'
  }
];

const initialWallets: LoyaltyWallet[] = [
  {
    id: 'demo-wal-2',
    walletId: 'LYW-DEMO-002',
    walletCode: 'WALLET002',
    customerId: 'CUST-002',
    customerName: 'Pooja Verma',
    customerEmail: 'pooja.verma@example.com',
    customerPhone: '+91 97110 44556',
    tier: 'Platinum',
    currentBalance: 20,
    totalPoints: 25,
    availablePoints: 20,
    redeemedPoints: 5,
    pendingPoints: 0,
    nextExpiryDate: '',
    lifetimeEarned: 25,
    lifetimeRedeemed: 5,
    lastActivity: '2026-09-17',
    memberSince: '2025-01-10',
    status: 'ACTIVE'
  },
  {
    id: 'demo-wal-1',
    walletId: 'LYW-DEMO-001',
    walletCode: 'WALLET001',
    customerId: 'CUST-001',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@example.com',
    customerPhone: '+91 98450 11223',
    tier: 'Gold',
    currentBalance: 500,
    totalPoints: 510,
    availablePoints: 500,
    redeemedPoints: 0,
    pendingPoints: 0,
    nextExpiryDate: '',
    lifetimeEarned: 510,
    lifetimeRedeemed: 0,
    lastActivity: '2026-09-17',
    memberSince: '2024-11-15',
    status: 'ACTIVE'
  }
];

const initialTransactions: LoyaltyTransaction[] = [
  {
    id: 'lyt-3',
    transactionId: 'LYT000000003',
    date: '19 Apr 2026',
    time: '14:30',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98450 11223',
    walletId: 'wal-1',
    walletCode: 'WALLET001',
    type: 'CREDIT',
    points: 6,
    referenceType: 'PURCHASE',
    referenceNumber: '9',
    balance: 20,
    balanceAfter: 20,
    status: 'COMPLETED',
    remarks: 'Purchase reward points'
  },
  {
    id: 'lyt-2',
    transactionId: 'LYT000000002',
    date: '01 Apr 2026',
    time: '11:15',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98450 11223',
    walletId: 'wal-1',
    walletCode: 'WALLET001',
    type: 'CREDIT',
    points: 3,
    referenceType: 'PURCHASE',
    referenceNumber: '3333',
    balance: 19,
    balanceAfter: 19,
    status: 'COMPLETED',
    remarks: 'Store checkout bonus'
  },
  {
    id: 'lyt-1',
    transactionId: 'LYT000000001',
    date: '01 Apr 2026',
    time: '10:00',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98450 11223',
    walletId: 'wal-1',
    walletCode: 'WALLET001',
    type: 'CREDIT',
    points: 500,
    referenceType: 'PURCHASE',
    referenceNumber: 'ORD-001',
    balance: 500,
    balanceAfter: 500,
    status: 'COMPLETED',
    remarks: 'Welcome purchase reward'
  }
];

export const useLoyaltyStore = create<LoyaltyState>((set, get) => {
  const localSavedRules = getLocalData<LoyaltyRule>('pegatto_loyalty_rules');
  const localSavedWallets = getLocalData<LoyaltyWallet>('pegatto_loyalty_wallets');
  const localSavedTx = getLocalData<LoyaltyTransaction>('pegatto_loyalty_transactions');

  // Preserve initialWallets alongside any created wallets (unless explicitly deleted)
  const deletedWalletSet = typeof window !== 'undefined'
    ? new Set(JSON.parse(localStorage.getItem('pegatto_loyalty_wallets_deleted') || '[]'))
    : new Set();
  const validInitialWallets = initialWallets.filter(w => !deletedWalletSet.has(w.id));

  const walletMap = new Map<string, LoyaltyWallet>();
  validInitialWallets.forEach(w => walletMap.set(w.id, w));
  localSavedWallets.forEach(w => walletMap.set(w.id, w));
  const activeWallets = Array.from(walletMap.values());

  return {
    rules: localSavedRules.length > 0 ? localSavedRules : initialRules,
    wallets: activeWallets.length > 0 ? activeWallets : initialWallets,
    transactions: localSavedTx.length > 0 ? localSavedTx : initialTransactions,
    isLoading: false,

    loadWallets: async (params?: any) => {
      set({ isLoading: true });
      try {
        const res = await fetchLoyaltyWalletsAPI(params);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedWallets: LoyaltyWallet[] = list.map((item: any) => {
          const rawCust = item.Customer_Id;
          const custIdVal = typeof rawCust === 'object' && rawCust !== null ? rawCust.id : rawCust;
          const custNameVal = typeof rawCust === 'object' && rawCust !== null ? (rawCust.Account_Name || rawCust.Customer_Name) : item.Customer_Name;
          const custPhoneVal = typeof rawCust === 'object' && rawCust !== null ? (rawCust.Phone || rawCust.Contact_Number) : item.Customer_Phone;
          const custEmailVal = typeof rawCust === 'object' && rawCust !== null ? (rawCust.Email || rawCust.email) : item.Customer_Email;
          const isNumericBackendId = typeof item.id === 'number' || (typeof item.id === 'string' && /^\d+$/.test(item.id) && item.id.length <= 8);

          return {
            id: String(item.id || item.LoyaltyWallet_Id || Date.now()),
            walletId: item.LoyaltyWallet_Id || item.walletId || `LYW${String(item.id).padStart(10, '0')}`,
            backendId: isNumericBackendId ? Number(item.id) : undefined,
            customerId: custIdVal ? String(custIdVal) : (item.customerId || ''),
            customerRawId: typeof custIdVal === 'number' ? custIdVal : (typeof custIdVal === 'string' && /^\d+$/.test(custIdVal) ? parseInt(custIdVal, 10) : undefined),
            walletCode: item.Wallet_Code || item.walletCode || item.WalletCode || item.LoyaltyWallet_Id || '',
            customerName: custNameVal || item.customerName || 'Customer',
            customerPhone: custPhoneVal || item.customerPhone || '',
            customerEmail: custEmailVal || item.customerEmail || '',
            tier: item.Tier || item.tier || 'Bronze',
            currentBalance: Number(item.Current_Balance ?? item.currentBalance ?? 0),
            totalPoints: Number(item.Total_Points ?? item.TotalPoints ?? item.totalPoints ?? item.Current_Balance ?? 0),
            availablePoints: Number(item.Available_Points ?? item.availablePoints ?? item.Current_Balance ?? 0),
            redeemedPoints: Number(item.Redeemed_Points ?? item.redeemedPoints ?? 0),
            pendingPoints: Number(item.Pending_Points ?? item.pendingPoints ?? 0),
            lifetimeEarned: Number(item.Lifetime_Earned ?? item.lifetimeEarned ?? item.Current_Balance ?? 0),
            lifetimeRedeemed: Number(item.Lifetime_Redeemed ?? item.lifetimeRedeemed ?? 0),
            lastActivity: item.Last_Activity || item.lastActivity || new Date().toISOString().split('T')[0],
            memberSince: item.Member_Since || item.memberSince || new Date().toISOString().split('T')[0],
            status: item.Status || item.status || 'ACTIVE',
          };
        });

        const merged = mergeWithLocalData<LoyaltyWallet>('pegatto_loyalty_wallets', mappedWallets, ['id']);
        const finalList = merged.length > 0 ? merged : (params?.search ? [] : initialWallets);
        set({ wallets: finalList, isLoading: false });
      } catch (e: any) {
        if (e?.status === 504 || e?.isTimeout || e?.status === 0) {
          console.warn('Loyalty wallets API timed out (using local cached data):', e?.message || e);
        } else {
          console.error('Failed to load loyalty wallets from API:', e);
        }
        const local = getLocalData<LoyaltyWallet>('pegatto_loyalty_wallets');
        set({ wallets: local.length > 0 ? local : initialWallets, isLoading: false });
      }
    },

    loadTransactions: async (params?: any) => {
      set({ isLoading: true });
      try {
        const res = await fetchLoyaltyTransactionsAPI(params);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedTx: LoyaltyTransaction[] = list.map((item: any) => ({
          id: String(item.id || item.Transaction_Id || Date.now()),
          transactionId: item.Transaction_Id || item.transactionId || `LYT${String(item.id).padStart(9, '0')}`,
          date: item.Date || item.date || new Date().toISOString().split('T')[0],
          time: item.Time || item.time || '',
          customerName: item.Customer_Name || item.customerName || '',
          customerPhone: item.Customer_Phone || item.customerPhone || '',
          walletId: item.Wallet_Id || item.walletId || '',
          walletCode: item.Wallet_Code || item.walletCode || '',
          type: item.Transaction_Type || item.type || 'CREDIT',
          points: Number(item.Points || item.points || 0),
          balanceAfter: Number(item.Balance_After || item.balanceAfter || 0),
          status: item.Status || item.status || 'COMPLETED',
          remarks: item.Remarks || item.remarks || '',
          notes: item.Notes || item.notes || '',
        }));

        const merged = mergeWithLocalData<LoyaltyTransaction>('pegatto_loyalty_transactions', mappedTx, ['id', 'transactionId']);
        const finalList = merged.length > 0 ? merged : (params?.search ? [] : initialTransactions);
        set({ transactions: finalList, isLoading: false });
      } catch (e: any) {
        if (e?.status === 504 || e?.isTimeout || e?.status === 0) {
          console.warn('Loyalty transactions API timed out (using local cached data):', e?.message || e);
        } else {
          console.error('Failed to load loyalty transactions from API:', e);
        }
        const local = getLocalData<LoyaltyTransaction>('pegatto_loyalty_transactions');
        set({ transactions: local.length > 0 ? local : initialTransactions, isLoading: false });
      }
    },

    loadRules: async (params?: any) => {
      set({ isLoading: true });
      try {
        const res = await fetchLoyaltyRulesAPI(params);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedRules: LoyaltyRule[] = list.map((item: any) => ({
          id: String(item.id || item.Rule_Id || Date.now()),
          ruleCode: item.Rule_Code || item.ruleCode || `LR-${item.id}`,
          name: item.Rule_Name || item.name || 'Rule',
          type: item.LoyaltyRule_Type || item.type || 'Standard',
          pointsPerAmount: Number(item.Points_Per_Amount ?? item.pointsPerAmount ?? 100),
          earningMultiplier: Number(item.Earning_Multiplier ?? item.earningMultiplier ?? 1),
          minPurchase: item.Min_Purchase ?? item.minPurchase,
          maxPoints: item.Max_Points ?? item.maxPoints,
          maxPointsPerDay: item.Max_Points_Per_Day ?? item.maxPointsPerDay,
          status: item.Status || item.status || 'ACTIVE',
          description: item.Description || item.description || '',
        }));

        const merged = mergeWithLocalData<LoyaltyRule>('pegatto_loyalty_rules', mappedRules, ['id']);
        const finalList = merged.length > 0 ? merged : (params?.search ? [] : initialRules);
        set({ rules: finalList, isLoading: false });
      } catch (e: any) {
        if (e?.status === 504 || e?.isTimeout || e?.status === 0) {
          console.warn('Loyalty rules API timed out (using local cached data):', e?.message || e);
        } else {
          console.error('Failed to load loyalty rules from API:', e);
        }
        const local = getLocalData<LoyaltyRule>('pegatto_loyalty_rules');
        set({ rules: local.length > 0 ? local : initialRules, isLoading: false });
      }
    },

    addRule: async (rule) => {
      const id = `rule-${Date.now()}`;
      const newRule: LoyaltyRule = { ...rule, id };
      const updated = upsertLocalItem('pegatto_loyalty_rules', newRule, ['id']);
      set({ rules: updated });
      try {
        const res = await createLoyaltyRuleAPI({
          LoyaltyRule_Name: rule.name,
          Rule_Name: rule.name,
          name: rule.name,
          LoyaltyRule_Type: rule.type,
          Points_Per_Amount: rule.pointsPerAmount,
          PointsPerAmount: rule.pointsPerAmount,
          Earning_Multiplier: rule.earningMultiplier,
          EarningMultiplier: rule.earningMultiplier,
          Min_Purchase: rule.minPurchase,
          MinPurchase: rule.minPurchase,
          Max_Points: rule.maxPoints,
          MaxPoints: rule.maxPoints,
          Max_Points_Per_Day: rule.maxPointsPerDay,
          MaxPointsPerDay: rule.maxPointsPerDay,
          Status: rule.status,
          Description: rule.description,
        });
        if (res && res.id) {
          upsertLocalItem('pegatto_loyalty_rules', { ...newRule, id: String(res.id), ruleCode: res.LoyaltyRule_Id || newRule.ruleCode }, ['id']);
        }
      } catch (err) {
        console.warn('API createLoyaltyRule error:', err);
      }
    },

    updateRule: async (id, updated) => {
      const localRules = getLocalData<LoyaltyRule>('pegatto_loyalty_rules');
      const found = localRules.find(r => r.id === id || r.ruleCode === id);
      if (found) {
        const updatedRule = { ...found, ...updated };
        upsertLocalItem('pegatto_loyalty_rules', updatedRule, ['id']);
      }
      set((state) => ({
        rules: state.rules.map((r) => (r.id === id ? { ...r, ...updated } : r))
      }));
      try {
        await updateLoyaltyRuleAPI({ id, ...updated });
      } catch (err) {
        console.error('API updateLoyaltyRule error:', err);
      }
    },

    deleteRule: async (id) => {
      deleteLocalItem('pegatto_loyalty_rules', id, ['id']);
      set((state) => ({
        rules: state.rules.filter((r) => r.id !== id && r.ruleCode !== id)
      }));
      try {
        await deleteLoyaltyRuleAPI(id);
      } catch (err) {
        console.error('API deleteLoyaltyRule error:', err);
      }
    },

  addPoints: (customerPhone, points, notes = 'Manual / System Credit', invoiceRef) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    set((state) => {
      const existingWallet = state.wallets.find((w) => w.customerPhone === customerPhone);
      let customerName = 'Loyalty Customer';
      let newBalance = points;

      let updatedWallets = state.wallets;
      if (existingWallet) {
        customerName = existingWallet.customerName;
        newBalance = existingWallet.currentBalance + points;
        const newLifetime = existingWallet.lifetimeEarned + points;

        // Auto-upgrade tier
        let newTier = existingWallet.tier;
        if (newLifetime >= 5000) newTier = 'Platinum';
        else if (newLifetime >= 2500) newTier = 'Gold';
        else if (newLifetime >= 1000) newTier = 'Silver';

        updatedWallets = state.wallets.map((w) =>
          w.customerPhone === customerPhone
            ? {
                ...w,
                currentBalance: newBalance,
                lifetimeEarned: newLifetime,
                tier: newTier,
                lastActivity: dateStr
              }
            : w
        );
      } else {
        const newWallet: LoyaltyWallet = {
          id: `wal-${Date.now()}`,
          customerName,
          customerPhone,
          tier: 'Bronze',
          currentBalance: points,
          lifetimeEarned: points,
          lifetimeRedeemed: 0,
          lastActivity: dateStr,
          memberSince: dateStr
        };
        updatedWallets = [newWallet, ...state.wallets];
      }

      const newTx: LoyaltyTransaction = {
        id: `tx-${Date.now()}`,
        transactionId: `LTX-${now.getFullYear()}-${String(state.transactions.length + 101).padStart(4, '0')}`,
        date: dateStr,
        time: timeStr,
        customerName,
        customerPhone,
        type: 'Earned',
        points,
        invoiceRef,
        balance: newBalance,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        notes
      };

      saveLocalData('pegatto_loyalty_wallets', updatedWallets);
      saveLocalData('pegatto_loyalty_transactions', [newTx, ...state.transactions]);

      return {
        wallets: updatedWallets,
        transactions: [newTx, ...state.transactions]
      };
    });
  },

  redeemPoints: (customerPhone, points, notes = 'Redeemed during billing', invoiceRef) => {
    const { wallets } = get();
    const wallet = wallets.find((w) => w.customerPhone === customerPhone);
    if (!wallet || wallet.currentBalance < points) {
      return false;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newBalance = wallet.currentBalance - points;

    set((state) => {
      const updatedWallets = state.wallets.map((w) =>
        w.customerPhone === customerPhone
          ? {
              ...w,
              currentBalance: newBalance,
              lifetimeRedeemed: w.lifetimeRedeemed + points,
              lastActivity: dateStr
            }
          : w
      );

      const newTx: LoyaltyTransaction = {
        id: `tx-${Date.now()}`,
        transactionId: `LTX-${now.getFullYear()}-${String(state.transactions.length + 101).padStart(4, '0')}`,
        date: dateStr,
        time: timeStr,
        customerName: wallet.customerName,
        customerPhone,
        type: 'Redeemed',
        points: -points,
        invoiceRef,
        balance: newBalance,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        notes
      };

      saveLocalData('pegatto_loyalty_wallets', updatedWallets);
      saveLocalData('pegatto_loyalty_transactions', [newTx, ...state.transactions]);

      return {
        wallets: updatedWallets,
        transactions: [newTx, ...state.transactions]
      };
    });

    return true;
  },

  addWallet: (walletData) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newWallet: LoyaltyWallet = {
      ...walletData,
      id: `wal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      currentBalance: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      lastActivity: dateStr,
      memberSince: dateStr,
      status: 'ACTIVE'
    };
    const updated = upsertLocalItem('pegatto_loyalty_wallets', newWallet, ['id']);
    set({ wallets: updated });
  },

  createWallet: async (data) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const initialPoints = Math.max(0, data.initialPoints || 0);

    // Scan all existing wallets in memory and local storage to find the true maximum numeric ID
    const allWallets = [
      ...get().wallets,
      ...getLocalData<LoyaltyWallet>('pegatto_loyalty_wallets')
    ];
    let maxNum = 0;
    allWallets.forEach((w) => {
      const widDigits = String(w.walletId || '').replace(/\D/g, '');
      if (widDigits) {
        const n = parseInt(widDigits, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
      const idDigits = String(w.id || '').replace(/\D/g, '');
      if (idDigits && idDigits.length <= 10) {
        const n = parseInt(idDigits, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });

    const nextWalletId = `LYW${String(maxNum + 1).padStart(10, '0')}`;
    const tier = initialPoints >= 2000 ? 'Platinum' : initialPoints >= 1000 ? 'Gold' : initialPoints >= 500 ? 'Silver' : 'Bronze';

    const numericCustomerId = data.customerRawId ?? (
      typeof data.customerId === 'number'
        ? data.customerId
        : (parseInt(String(data.customerId || '').replace(/\D/g, ''), 10) || 1)
    );

    const newWalletId = `wal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newWallet: LoyaltyWallet = {
      id: newWalletId,
      walletId: nextWalletId,
      customerId: data.customerId,
      customerRawId: numericCustomerId,
      walletCode: data.walletCode,
      customerName: data.customerName || data.customerId,
      customerPhone: data.customerPhone || `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
      customerEmail: data.customerEmail || '',
      tier,
      currentBalance: initialPoints,
      totalPoints: initialPoints,
      availablePoints: initialPoints,
      redeemedPoints: 0,
      pendingPoints: 0,
      lifetimeEarned: initialPoints,
      lifetimeRedeemed: 0,
      lastActivity: dateStr,
      memberSince: dateStr,
      status: data.status
    };

    const newTx: LoyaltyTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      date: dateStr,
      time: timeStr,
      customerName: newWallet.customerName,
      customerPhone: newWallet.customerPhone,
      type: 'Earned',
      points: initialPoints,
      invoiceRef: `WAL-${data.walletCode}`,
      balance: initialPoints,
      balanceAfter: initialPoints,
      status: 'COMPLETED',
      notes: 'Initial Points on Wallet Creation'
    };

    // Save strictly by ['id'] to guarantee that no existing wallet is ever replaced
    upsertLocalItem('pegatto_loyalty_wallets', newWallet, ['id']);
    if (initialPoints > 0) {
      upsertLocalItem('pegatto_loyalty_transactions', newTx, ['id']);
    }

    set((state) => ({
      wallets: [newWallet, ...state.wallets],
      transactions: initialPoints > 0 ? [newTx, ...state.transactions] : state.transactions
    }));

    try {
      const res = await createLoyaltyWalletAPI({
        Customer_Id: numericCustomerId,
        customerId: numericCustomerId,
        customerRawId: numericCustomerId,
        Account_Id: numericCustomerId,
        Customer_Code: data.customerId,
        Account_Code: data.customerId,
        Wallet_Code: data.walletCode,
        WalletCode: data.walletCode,
        Current_Balance: initialPoints,
        Total_Points: initialPoints,
        TotalPoints: initialPoints,
        Available_Points: initialPoints,
        Status: data.status,
      });
      if (res && res.id) {
        const persistedId = String(res.id);
        const persistedWalletId = res.LoyaltyWallet_Id || res.walletId || newWallet.walletId;
        // Specifically update only THIS wallet without touching other wallets
        const local = getLocalData<LoyaltyWallet>('pegatto_loyalty_wallets');
        const updated = local.map(w => (w.id === newWallet.id ? { ...w, id: persistedId, walletId: persistedWalletId } : w));
        saveLocalData('pegatto_loyalty_wallets', updated);
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === newWallet.id ? { ...w, id: persistedId, walletId: persistedWalletId } : w))
        }));
      }
    } catch (err) {
      console.error('API createLoyaltyWallet error:', err);
    }
  },

  updateWallet: async (id, updated) => {
    const localWallets = getLocalData<LoyaltyWallet>('pegatto_loyalty_wallets');
    const found = localWallets.find(w => w.id === id || w.walletId === id || w.walletCode === id);
    if (found) {
      const updatedWallet = { ...found, ...updated };
      upsertLocalItem('pegatto_loyalty_wallets', updatedWallet, ['id']);
    }

    set((state) => ({
      wallets: state.wallets.map((w) => (w.id === id || w.walletId === id ? { ...w, ...updated } : w))
    }));

    const numericCustomerId = updated.customerRawId ?? (
      updated.customerId
        ? (typeof updated.customerId === 'number'
            ? updated.customerId
            : (parseInt(String(updated.customerId).replace(/\D/g, ''), 10) || undefined))
        : undefined
    );

    try {
      await updateLoyaltyWalletAPI({
        id,
        ...(numericCustomerId ? { Customer_Id: numericCustomerId, Account_Id: numericCustomerId, customerId: numericCustomerId } : {}),
        Customer_Code: updated.customerId,
        Account_Code: updated.customerId,
        Wallet_Code: updated.walletCode,
        WalletCode: updated.walletCode,
        Status: updated.status,
        ...updated,
      });
    } catch (err) {
      console.error('API updateLoyaltyWallet error:', err);
    }
  },

  deleteWallet: async (id) => {
    deleteLocalItem('pegatto_loyalty_wallets', id, ['id']);
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id && w.walletId !== id)
    }));
    try {
      await deleteLoyaltyWalletAPI(id);
    } catch (err) {
      console.error('API deleteLoyaltyWallet error:', err);
    }
  },

  processLoyaltyTransaction: async (data) => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedWalletsList: LoyaltyWallet[] = [];
    let updatedTxList: LoyaltyTransaction[] = [];

    set((state) => {
      const wallet = state.wallets.find((w) => w.id === data.walletId || w.walletCode === data.walletId);
      if (!wallet) return state;

      const isCredit = data.type === 'CREDIT' || data.type === 'BONUS';
      const isDebit = data.type === 'DEBIT';

      let newBalance = wallet.currentBalance;
      let newLifetimeEarned = wallet.lifetimeEarned;
      let newLifetimeRedeemed = wallet.lifetimeRedeemed;

      if (isCredit) {
        newBalance += data.points;
        newLifetimeEarned += data.points;
      } else if (isDebit) {
        newBalance = Math.max(0, newBalance - data.points);
        newLifetimeRedeemed += data.points;
      } else {
        // ADJUSTMENT
        newBalance = Math.max(0, newBalance + data.points);
      }

      // Format next transaction ID like LYT000000004
      const existingCount = state.transactions.length + 1;
      const txNum = String(existingCount).padStart(9, '0');
      const transactionId = `LYT${txNum}`;

      const newTx: LoyaltyTransaction = {
        id: `lyt-${Date.now()}`,
        transactionId,
        date: dateFormatted,
        time: timeFormatted,
        customerName: wallet.customerName,
        customerPhone: wallet.customerPhone,
        walletId: wallet.id,
        walletCode: wallet.walletCode,
        type: data.type,
        points: isDebit ? -data.points : data.points,
        referenceType: data.referenceType,
        referenceNumber: data.referenceNumber,
        balance: newBalance,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        remarks: data.remarks || `${data.type} transaction processed`
      };

      const updatedWallets = state.wallets.map((w) =>
        w.id === wallet.id
          ? {
              ...w,
              currentBalance: newBalance,
              lifetimeEarned: newLifetimeEarned,
              lifetimeRedeemed: newLifetimeRedeemed,
              lastActivity: now.toISOString().split('T')[0]
            }
          : w
      );

      updatedWalletsList = updatedWallets;
      updatedTxList = [newTx, ...state.transactions];

      return {
        wallets: updatedWallets,
        transactions: updatedTxList
      };
    });

    if (updatedWalletsList.length > 0) saveLocalData('pegatto_loyalty_wallets', updatedWalletsList);
    if (updatedTxList.length > 0) saveLocalData('pegatto_loyalty_transactions', updatedTxList);

    const targetWallet = get().wallets.find((w) => w.id === data.walletId || w.walletCode === data.walletId);
    const backendWalletId = targetWallet?.backendId || (typeof targetWallet?.id === 'string' && /^\d+$/.test(targetWallet.id) && targetWallet.id.length <= 8 ? parseInt(targetWallet.id, 10) : undefined);

    try {
      await createLoyaltyTransactionAPI({
        Wallet_Id: backendWalletId || targetWallet?.id || data.walletId,
        Customer_Id: targetWallet?.customerRawId,
        Transaction_Type: data.type,
        Points: data.points,
        Reference_Type: data.referenceType,
        Reference_No: data.referenceNumber,
        Remarks: data.remarks,
      });
    } catch (err) {
      console.warn('API createLoyaltyTransaction error:', err);
    }
  },

  reverseLoyaltyTransaction: (idOrTxId) => {
    set((state) => {
      const txIndex = state.transactions.findIndex(
        (t) => t.id === idOrTxId || t.transactionId === idOrTxId
      );
      if (txIndex === -1) return state;

      const tx = state.transactions[txIndex];
      if (tx.status === 'REVERSED') return state;

      // Adjust wallet
      const wallet = state.wallets.find(
        (w) => (tx.walletId && w.id === tx.walletId) || (tx.walletCode && w.walletCode === tx.walletCode) || (tx.customerPhone && w.customerPhone === tx.customerPhone)
      );

      let updatedWallets = state.wallets;
      if (wallet) {
        const isCredit = tx.type === 'CREDIT' || tx.type === 'BONUS' || tx.type === 'Earned';
        let newBalance = wallet.currentBalance;
        if (isCredit) {
          newBalance = Math.max(0, newBalance - tx.points);
        } else {
          newBalance += Math.abs(tx.points);
        }

        updatedWallets = state.wallets.map((w) =>
          w.id === wallet.id
            ? {
                ...w,
                currentBalance: newBalance
              }
            : w
        );
      }

      const updatedTx: LoyaltyTransaction = {
        ...tx,
        status: 'REVERSED',
        remarks: tx.remarks ? `${tx.remarks} (Reversed)` : 'Transaction Reversed'
      };

      const updatedTransactions = [...state.transactions];
      updatedTransactions[txIndex] = updatedTx;

      saveLocalData('pegatto_loyalty_wallets', updatedWallets);
      saveLocalData('pegatto_loyalty_transactions', updatedTransactions);

      return {
        wallets: updatedWallets,
        transactions: updatedTransactions
      };
    });
  },

  deleteLoyaltyTransaction: (idOrTxId) => {
    deleteLocalItem('pegatto_loyalty_transactions', idOrTxId, ['id', 'transactionId']);
    set((state) => ({
      transactions: state.transactions.filter(
        (t) => t.id !== idOrTxId && t.transactionId !== idOrTxId
      )
    }));
  }
}; });
