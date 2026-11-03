'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  User,
  Mail,
  Calendar,
  Edit,
  MoreHorizontal,
  Check,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Plus,
  Trash2,
  History,
  Phone,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  File,
  Trophy,
  Activity,
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
  UserCheck,
  Eye,
  UserPlus,
  RefreshCw,
  CheckSquare,
  PhoneCall,
  Star,
  LayoutGrid,
  List,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  fetchDeals,
  ApiDeal,
  fetchDealScreenKPIs,
  fetchMyDeals,
  DealKPIs,
  createDeal,
  updateDealApi,
  deleteDealApi,
  mapApiDealToUiDeal,
  createDealNote,
  createDealTask,
  ApiDealTask
} from '@/service/api/deal/api';
import { generateEmailContent } from '@/service/api/Leads/api';
import { useDealStore } from '@/store/useDealStore';

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg className="h-4 w-4 text-[#25D366] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.005c5.566 0 10.1-4.532 10.104-10.1.002-2.699-1.047-5.236-2.951-7.143C17.31 1.464 14.773.415 12.008.415 6.43.415 1.895 4.947 1.892 10.528c-.001 1.93.504 3.81 1.462 5.418L2.35 20.358l4.297-1.204zM17.9 14.852c-.322-.16-.1.9-.323-1.6-.16-.322-.59-.516-.913-.677-.323-.16-1.897-.933-2.18-.1.036-.282-.226-.436-.452-.516-.226-.08-1.516-.403-2.58.548-.823.823-1.37 1.823-1.53 2.1-.16.28-.016.43.124.57.126.126.282.322.42.484.14.16.186.274.28.452.093.18.046.338-.023.5-.069.16-.62 1.484-.855 2.048-.228.55-.458.484-.62.476-.153-.008-.33-.008-.508-.008-.18 0-.476.067-.726-.206-.25-.274-.95-.93-.95-2.27 0-1.34.975-2.637 1.112-2.82.137-.184 1.92-2.93 4.65-4.113.65-.28 1.157-.448 1.553-.573.654-.208 1.25-.178 1.72-.25.525-.078 1.62-.663 1.85-.92.228-.258.228-.48.15-.623-.076-.14-.282-.226-.6-.386z" />
  </svg>
);

interface Deal {
  id: string;
  name: string;
  stage: 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  company: string;
  companyInitials: string;
  companyBgColor: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  contactInitials: string;
  contactBgColor: string;
  dealValue: number;
  expectedClose: string;
  probability: number;
  owner: string;
  ownerInitials: string;
  ownerAvatarColor: string;
  createdOn: string;
  lastUpdated: string;
  currency: string;
  currencySymbol: string;
  summary: string;
  source: string;
  internalNotes: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  details: string;
  date: string;
  time: string;
  user: string;
  color: string;
  category: 'create' | 'stage' | 'note' | 'task' | 'email';
}

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'pptx';
}

interface DealTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  owner: string;
}

const initialDeals: Deal[] = [
  {
    id: 'DEAL-802',
    name: 'Website Development Project',
    stage: 'Proposal',
    company: 'SoftTech Ltd.',
    companyInitials: 'ST',
    companyBgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
    contactName: 'Monirul Islam',
    contactEmail: 'monirul@softtech.com',
    contactPhone: '+880 1711-123456',
    contactRole: 'Manager, SoftTech Ltd.',
    contactInitials: 'MR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 650000,
    expectedClose: '2025-05-25',
    probability: 60,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-10',
    lastUpdated: '2025-05-20',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'SoftTech Ltd. is looking to build a modern, responsive corporate website to improve their online presence and showcase their services. The project includes design, development, content integration, and basic SEO setup.',
    source: 'Website',
    internalNotes: 'Client is happy with the proposal. Waiting for final approval from management.'
  },
  {
    id: 'DEAL-803',
    name: 'CRM Implementation',
    stage: 'Negotiation',
    company: 'Bright Digitals',
    companyInitials: 'BD',
    companyBgColor: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400',
    contactName: 'Arefin Rahman',
    contactEmail: 'arefin@brightdigitals.com',
    contactPhone: '+880 1812-987654',
    contactRole: 'CTO, Bright Digitals',
    contactInitials: 'AR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 1200000,
    expectedClose: '2025-06-10',
    probability: 85,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-12',
    lastUpdated: '2025-05-22',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Implementation of custom Salesforce CRM suite for tracking sales channels, including data migration and 5 training sessions.',
    source: 'Referral',
    internalNotes: 'Pricing negotiation is going on. They requested a 10% discount on support fees.'
  },
  {
    id: 'DEAL-804',
    name: 'Mobile App Development',
    stage: 'Qualification',
    company: 'Innovate Tech',
    companyInitials: 'IT',
    companyBgColor: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400',
    contactName: 'Nusrat Jahan',
    contactEmail: 'nusrat@innovatetech.com',
    contactPhone: '+880 1715-321654',
    contactRole: 'Product Owner, Innovate Tech',
    contactInitials: 'NJ',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 875000,
    expectedClose: '2025-06-18',
    probability: 20,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-05-15',
    lastUpdated: '2025-05-18',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Cross-platform React Native app delivery for e-commerce store with integrated SSLCommerz payment portal.',
    source: 'Google Ads',
    internalNotes: 'First intro call done. Client is preparing detailed system requirement specs.'
  },
  {
    id: 'DEAL-805',
    name: 'Digital Marketing Service',
    stage: 'Proposal',
    company: 'WebGrow Ltd.',
    companyInitials: 'WG',
    companyBgColor: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400',
    contactName: 'Fahim Ahmed',
    contactEmail: 'fahim@webgrow.com',
    contactPhone: '+880 1913-654987',
    contactRole: 'Marketing Director, WebGrow',
    contactInitials: 'FA',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 320000,
    expectedClose: '2025-05-30',
    probability: 60,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-11',
    lastUpdated: '2025-05-15',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: '6-month search engine optimization and Facebook advertising pipeline optimization to drive inbound product leads.',
    source: 'Cold Email',
    internalNotes: 'Sent proposal copy. Client reviewing and checking budget availability.'
  },
  {
    id: 'DEAL-806',
    name: 'SEO Optimization',
    stage: 'Closed Won',
    company: 'Rank Kings',
    companyInitials: 'RK',
    companyBgColor: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-455',
    contactName: 'Shakib Rahman',
    contactEmail: 'shakib@rankkings.com',
    contactPhone: '+880 1814-741852',
    contactRole: 'Owner, Rank Kings',
    contactInitials: 'SR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 410000,
    expectedClose: '2025-05-15',
    probability: 100,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-04-20',
    lastUpdated: '2025-05-15',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Comprehensive SEO site audit, page index fixes, and keyword rankings growth package.',
    source: 'Organic',
    internalNotes: 'Signed service agreement. Invoice paid in full. Handed off to delivery team.'
  },
  {
    id: 'DEAL-807',
    name: 'E-commerce Solution',
    stage: 'Closed Lost',
    company: 'Fashion Store',
    companyInitials: 'FS',
    companyBgColor: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400',
    contactName: 'Tanjila Akter',
    contactEmail: 'tanjila@fashionstore.com',
    contactPhone: '+880 1612-951753',
    contactRole: 'CEO, Fashion Store',
    contactInitials: 'TA',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 225000,
    expectedClose: '2025-05-05',
    probability: 0,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-04-15',
    lastUpdated: '2025-05-05',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'WooCommerce custom redesign and hosting migration for fashion brand.',
    source: 'Website',
    internalNotes: 'Lost to competitor offering cheaper rate. Follow up in 6 months for maintenance.'
  },
  {
    id: 'DEAL-808',
    name: 'Custom Software Development',
    stage: 'Negotiation',
    company: 'Global Logistics',
    companyInitials: 'GL',
    companyBgColor: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400',
    contactName: 'Imran Hossain',
    contactEmail: 'imran@globallogistics.com',
    contactPhone: '+880 1511-753951',
    contactRole: 'Operations Chief, Global Logistics',
    contactInitials: 'IH',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 1560000,
    expectedClose: '2025-06-28',
    probability: 85,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-05-01',
    lastUpdated: '2025-05-25',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Custom ERP and warehousing tracker system development, integrating with local barcode scanner equipment API.',
    source: 'Referral',
    internalNotes: 'Contract drafts exchanged. Legal review ongoing. Expect signing next week.'
  }
];

export default function DealPipelinePage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();
  const {
    canCreateDeal,
    canEditDeal,
    canDeleteDeal,
    canViewDealOverview,
    canExportDeal,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewDealOverview) {
      toast.error('You do not have permission to view Deals.');
      router.push('/');
    }
  }, [canViewDealOverview, isLoaded, router]);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [kpis, setKpis] = useState<DealKPIs | null>(null);
  const [myDealsCountState, setMyDealsCountState] = useState<number>(0);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Zustand cache store hooks
  const cachedPages = useDealStore((state) => state.cachedPages);
  const setCachedPage = useDealStore((state) => state.setCachedPage);
  const storeKpis = useDealStore((state) => state.kpis);
  const setStoreKPIs = useDealStore((state) => state.setKPIs);
  const storeMyDealsCount = useDealStore((state) => state.myDealsCount);
  const setStoreMyDealsCount = useDealStore((state) => state.setMyDealsCount);
  const clearCache = useDealStore((state) => state.clearCache);

  // Layout view & Selection States
  const [layoutView, setLayoutView] = useState<'list' | 'grid'>('list');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [favoriteDeals, setFavoriteDeals] = useState<string[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<'All' | 'My' | 'Recent' | 'Won'>('All');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [nameFilter, setNameFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [contactFilter, setContactFilter] = useState('');
  const [valueFilter, setValueFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Dialog State for Creating Deal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newStage, setNewStage] = useState<'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'>('Qualification');
  const [newCloseDate, setNewCloseDate] = useState('');
  const [newOwner, setNewOwner] = useState('Sadia Afrin');

  // Detail View Interactive Sub-states
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);

  // States for action menu dialogs (Note, Task, Email)
  const [selectedDealForAction, setSelectedDealForAction] = useState<Deal | null>(null);

  // Note dialog states
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('');

  // Task dialog states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskFormName, setTaskFormName] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormStartDate, setTaskFormStartDate] = useState('');
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState<string>('Normal');
  const [taskFormStatus, setTaskFormStatus] = useState<string>('Pending');
  const [taskFormCompletion, setTaskFormCompletion] = useState<string>('0%');
  const [taskFormAssignedPerson, setTaskFormAssignedPerson] = useState('');

  // Email dialog states
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Edit form states for selected deal
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editValue, setEditValue] = useState(0);
  const [editProbability, setEditProbability] = useState(0);
  const [editExpectedClose, setEditExpectedClose] = useState('');
  const [editSummary, setEditSummary] = useState('');

  // Selected Deal Detail states
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [tasks, setTasks] = useState<DealTask[]>([]);

  // Custom new notes/tasks form
  const [newNoteText, setNewNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Reset page to 1 when search query or active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTabFilter]);

  // Debounce search query input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load KPIs on mount (with caching)
  useEffect(() => {
    if (storeKpis) {
      setKpis(storeKpis);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    fetchDealScreenKPIs(token)
      .then((res) => {
        if (res.status) {
          setKpis(res.data);
          setStoreKPIs(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load KPIs:', err);
      });
  }, [storeKpis, setStoreKPIs]);

  // Load My Deals count on mount/user change (with caching)
  useEffect(() => {
    if (storeMyDealsCount !== null) {
      setMyDealsCountState(storeMyDealsCount);
      return;
    }
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const rawUserId = storedUserId ? parseInt(storedUserId, 10) : (user?.id || 71);
    const userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    fetchMyDeals(1, userId, '', token)
      .then((res) => {
        setMyDealsCountState(res.count);
        setStoreMyDealsCount(res.count);
      })

      .catch((err) => {
        console.error('Failed to load My Deals count:', err);
      });
  }, [user?.id, storeMyDealsCount, setStoreMyDealsCount]);

  // Load deals dynamically when page, debounced search, or active tab changes (with page caching)
  useEffect(() => {
    let active = true;

    // Unique cache key based on query settings
    const cacheKey = `${activeTabFilter}_${currentPage}_${debouncedSearchQuery}`;

    // Read from client-side Zustand cache if available
    if (cachedPages[cacheKey]) {
      setDeals(cachedPages[cacheKey].results);
      setTotalCount(cachedPages[cacheKey].count);
      setIsLoading(false);
      setIsFirstLoad(false);
      return;
    }

    setIsLoading(true);

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const rawUserId = storedUserId ? parseInt(storedUserId, 10) : (user?.id || 71);
    const userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;

    const fetchPromise = activeTabFilter === 'My'
      ? fetchMyDeals(currentPage, userId, debouncedSearchQuery, token)
      : fetchDeals(currentPage, debouncedSearchQuery, token);

    fetchPromise
      .then((response) => {
        if (!active) return;
        const mapped = response.results.map(mapApiDealToUiDeal);
        setDeals(mapped);
        setTotalCount(response.count);

        // Store response in cache
        setCachedPage(cacheKey, mapped, response.count);

        setIsLoading(false);
        setIsFirstLoad(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        toast.error('Failed to load deals from server.');
        setIsLoading(false);
        setIsFirstLoad(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, debouncedSearchQuery, activeTabFilter, user?.id, cachedPages, setCachedPage]);

  const currentDeal = deals.find(d => d.id === selectedDealId);

  // Load timeline, tasks, and files when a deal is selected
  const handleSelectDeal = (dealId: string) => {
    router.push(`/Deal/${dealId}`);
  };

  // Stage changes inside detail view
  const handleStageChange = (newStage: typeof initialDeals[number]['stage']) => {
    if (!selectedDealId) return;

    let prob = 50;
    if (newStage === 'Qualification') prob = 20;
    else if (newStage === 'Proposal') prob = 60;
    else if (newStage === 'Negotiation') prob = 85;
    else if (newStage === 'Closed Won') prob = 100;
    else if (newStage === 'Closed Lost') prob = 0;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const type = newStage === 'Closed Won' ? 'Won' : newStage === 'Closed Lost' ? 'Lost' : 'Open';

    updateDealApi(selectedDealId, { Deal_Stage: newStage, Deal_Type: type, Deal_Probablity: `${prob} %` }, token)
      .then(() => {
        clearCache();
        // Update main list
        setDeals(prev => prev.map(d =>
          d.id === selectedDealId
            ? { ...d, stage: newStage, probability: prob, lastUpdated: new Date().toISOString().split('T')[0] }
            : d
        ));

        // Update timeline
        const now = new Date();
        const event: TimelineEvent = {
          id: `EV-${Date.now()}`,
          type: `Stage changed to ${newStage}`,
          details: `Deal status updated to ${newStage}. Probability adjusted to ${prob}%.`,
          date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: currentDeal?.owner || 'Sadia Afrin',
          color: newStage === 'Closed Won' ? 'bg-emerald-500' : newStage === 'Closed Lost' ? 'bg-rose-500' : 'bg-blue-600',
          category: 'stage'
        };
        setTimeline(prev => [event, ...prev]);
        toast.success(`Stage updated to ${newStage}`);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to update deal stage on server.');
      });
  };

  // Submit edit details dialog
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    updateDealApi(selectedDealId, {
      Deal_Name: editName,
      Account_Name: editCompany,
      Lead_Name: editCompany,
      Amount: editValue,
      Deal_Probablity: `${editProbability} %`,
      ExpClosing_Date: editExpectedClose ? `${editExpectedClose}T00:00:00Z` : undefined,
      Deal_Note: editSummary,
      Updated_Date: new Date().toISOString().split('T')[0]
    }, token)
      .then(() => {
        clearCache();
        setDeals(prev => prev.map(d =>
          d.id === selectedDealId
            ? {
              ...d,
              name: editName,
              company: editCompany,
              dealValue: editValue,
              probability: editProbability,
              expectedClose: editExpectedClose,
              summary: editSummary
            }
            : d
        ));
        setIsEditOpen(false);
        toast.success('Deal details updated successfully!');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to update deal details on server.');
      });
  };

  // Add Task inside detail view
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const tsk: DealTask = {
      id: `T-${Date.now()}`,
      title: newTaskTitle,
      dueDate: newTaskDueDate || 'No Due Date',
      completed: false,
      owner: currentDeal?.owner || 'Sadia Afrin'
    };
    setTasks(prev => [...prev, tsk]);
    setNewTaskTitle('');
    setNewTaskDueDate('');

    const now = new Date();
    setTimeline(prev => [
      {
        id: `EV-${Date.now()}`,
        type: 'Task created',
        details: `New task: "${tsk.title}" was added.`,
        date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        user: currentDeal?.owner || 'Sadia Afrin',
        color: 'bg-indigo-500',
        category: 'task'
      },
      ...prev
    ]);
    toast.success('Task created successfully!');
  };

  // Toggle complete task
  const handleToggleTask = (taskId: string, checked: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: checked } : t));
    toast.success(`Task marked as ${checked ? 'completed' : 'incomplete'}`);
  };

  // Update notes
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setDeals(prev => prev.map(d =>
      d.id === selectedDealId ? { ...d, internalNotes: newNoteText } : d
    ));

    const now = new Date();
    setTimeline(prev => [
      {
        id: `EV-${Date.now()}`,
        type: 'Note added',
        details: newNoteText,
        date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        user: currentDeal?.owner || 'Sadia Afrin',
        color: 'bg-amber-500',
        category: 'note'
      },
      ...prev
    ]);
    setNewNoteText('');
    toast.success('Internal notes updated!');
  };

  // Upload file simulation
  const handleFileUpload = () => {
    const fileNames = ['Contract_Agreements_Signed.pdf', 'Specification_Architecture_V2.pptx', 'Commercial_Budget_Spreadsheet.xlsx'];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const extension = randomName.split('.').pop() as any;
    const newFile: FileAttachment = {
      id: `F-${Date.now()}`,
      name: randomName,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: extension
    };
    setFiles(prev => [newFile, ...prev]);

    const now = new Date();
    setTimeline(prev => [
      {
        id: `EV-${Date.now()}`,
        type: 'File uploaded',
        details: `Uploaded file: ${randomName}`,
        date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        user: currentDeal?.owner || 'Sadia Afrin',
        color: 'bg-sky-500',
        category: 'email'
      },
      ...prev
    ]);
    toast.success(`Uploaded ${randomName}`);
  };

  // Action menu handlers (Note, Task, Email)
  const handleActionAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForAction) return;
    if (!newNote.trim()) return;

    const finalSubject = newNoteSubject.trim() || 'General Note';

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const dealIdNum = parseInt(selectedDealForAction.id, 10);
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 1;

    createDealNote({
      Organization_Id: 1,
      Deal_Id: isNaN(dealIdNum) ? 0 : dealIdNum,
      Subject: finalSubject,
      Notes: newNote,
      Active_Flag: true,
      Created_By: userId,
      Updated_By: userId
    }, token)
      .then(() => {
        toast.success('Note added successfully!');
        setNewNote('');
        setNewNoteSubject('');
        setIsAddNoteOpen(false);
        setSelectedDealForAction(null);
      })
      .catch((err) => {
        console.error('Failed to create note:', err);
        toast.error('Failed to create note on server.');
      });
  };

  const handleActionAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForAction) return;
    if (!taskFormName.trim()) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;
    const dealIdNum = parseInt(selectedDealForAction.id, 10);

    const payload: Partial<ApiDealTask> = {
      Organization_Id: 1,
      Deal_Id: isNaN(dealIdNum) ? 0 : dealIdNum,
      TaskName: taskFormName,
      Task_Desc: taskFormDesc || taskFormName,
      Start_Date: taskFormStartDate ? `${taskFormStartDate}T00:00:00+05:30` : new Date().toISOString().split('T')[0] + 'T00:00:00+05:30',
      Due_Date: taskFormDueDate ? `${taskFormDueDate}T00:00:00+05:30` : new Date().toISOString().split('T')[0] + 'T00:00:00+05:30',
      Priority: taskFormPriority,
      Status: taskFormStatus,
      Completion: taskFormCompletion,
      Assigned_person: taskFormAssignedPerson || null,
      Is_Deleted: false,
      Created_By: userId,
      Updated_By: userId,
      UserReminder: null
    };

    createDealTask(payload, token)
      .then(() => {
        toast.success('Task logged successfully!');
        setTaskFormName('');
        setTaskFormDesc('');
        setTaskFormStartDate('');
        setTaskFormDueDate('');
        setTaskFormPriority('Normal');
        setTaskFormStatus('Pending');
        setTaskFormCompletion('0%');
        setTaskFormAssignedPerson('');
        setIsAddTaskOpen(false);
        setSelectedDealForAction(null);
      })
      .catch((err) => {
        console.error('Failed to create task:', err);
        toast.error('Failed to create task on server.');
      });
  };

  const handleActionSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject.trim() || !mailBody.trim()) {
      toast.error('Subject and Body are required.');
      return;
    }
    setIsSendingMail(true);
    setTimeout(() => {
      setIsSendingMail(false);
      setIsMailOpen(false);
      setMailSubject('');
      setMailBody('');
      setSelectedDealForAction(null);
      toast.success('Email sent successfully!');
    }, 800);
  };

  const handleActionGenerateAiMail = async () => {
    if (!mailSubject.trim()) {
      toast.error('Please enter an Email Subject prompt first.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await generateEmailContent(mailSubject);
      const text = res?.Result || res?.generated_content || res?.content || (typeof res === 'string' ? res : '');
      setMailBody(text);
      toast.success('AI Email drafted!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate AI email draft.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Create new Deal from list page Dialog form
  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCompany.trim() || !newContactName.trim() || !newValue || !newCloseDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const val = parseFloat(newValue) || 0;
    let prob = 50;
    if (newStage === 'Qualification') prob = 20;
    else if (newStage === 'Proposal') prob = 60;
    else if (newStage === 'Negotiation') prob = 85;
    else if (newStage === 'Closed Won') prob = 100;
    else if (newStage === 'Closed Lost') prob = 0;

    const initials = newCompany.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    const contInitials = newContactName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId) : Number(user?.id || 71);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;

    const apiPayload = {
      Deal_Code: "",
      Deal_Name: newName,
      Deal_Type: newStage === 'Closed Won' ? 'Won' : newStage === 'Closed Lost' ? 'Lost' : 'Open',
      Account_Name: newCompany,
      Lead_Name: newCompany,
      Contact_Person: newContactName,
      Phoene: null,
      Amount: val,
      Deal_Owner: newOwner,
      DealScore: 0.0,
      ApproxDealAmount: 0.0,
      ActualDealAmount: 0.0,
      MinimumTurnOver: 0.0,
      Current_Status: null,
      Deal_Stage: newStage,
      Lost_Reason: null,
      Lead_Source: 'Website',
      Deal_Competitor: {},
      Deal_Probablity: `${prob} %`,
      Probability_Id: 0,
      Next_Step: null,
      Deal_Note: `${newName} in cooperation with ${newCompany}.`,
      ExpClosing_Date: newCloseDate ? `${newCloseDate}T00:00:00Z` : new Date().toISOString(),
      Recommaned_Action: null,
      Prediction: null,
      Active_Flag: true,
      Is_Deleted: false,
      Deal_Json: {},
      Won_Deal_Date: newStage === 'Closed Won' ? new Date().toISOString().split('T')[0] : null,
      Created_Date: new Date().toISOString().split('T')[0],
      Updated_Date: new Date().toISOString().split('T')[0],
      Pipeline_Name: null,
      Campaign_Name: null,
      Organization_Id: 1,
      Lead_Id: null,
      Created_By: userId,
      Contact_Id: null,
      UserLeadfromCampaign_Id: null,
      SocialMediaCampaign_Id: null,
      Updated_By: userId
    };

    createDeal(apiPayload, token)
      .then((res) => {
        clearCache();
        const newDealItem: Deal = {
          id: (res.id || `DEAL-${Math.floor(810 + Math.random() * 190)}`).toString(),
          name: newName,
          stage: newStage,
          company: newCompany,
          companyInitials: initials || 'CO',
          companyBgColor: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
          contactName: newContactName,
          contactEmail: newContactEmail || `${newContactName.toLowerCase().replace(/ /g, '')}@company.com`,
          contactPhone: '+880 1700-000000',
          contactRole: `Representative, ${newCompany}`,
          contactInitials: contInitials || 'CT',
          contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
          dealValue: val,
          expectedClose: newCloseDate,
          probability: prob,
          owner: newOwner,
          ownerInitials: newOwner.split(' ').map(w => w[0]).join('').toUpperCase(),
          ownerAvatarColor: newOwner === 'Sadia Afrin' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white',
          createdOn: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          currency: 'BDT (₹)',
          currencySymbol: '₹',
          summary: `${newName} in cooperation with ${newCompany}. Core pipeline values estimated at BDT ${val.toLocaleString()}.`,
          source: 'Website',
          internalNotes: 'Deal initialized. Scheduling follow-up details soon.'
        };

        setDeals(prev => [newDealItem, ...prev]);
        setIsCreateOpen(false);
        toast.success(`Deal created successfully!`);

        // Reset forms
        setNewName('');
        setNewCompany('');
        setNewContactName('');
        setNewContactEmail('');
        setNewValue('');
        setNewStage('Qualification');
        setNewCloseDate('');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to create deal on server.');
      });
  };

  // Unique items for dropdown filters
  const uniqueCompanies = Array.from(new Set(deals.map(d => d.company))).sort();
  const uniqueOwners = Array.from(new Set(deals.map(d => d.owner))).sort();

  // Filter deals based on activeTabFilter, stageFilter, and searchQuery
  const filteredDeals = deals.filter(d => {
    if (activeTabFilter === 'Recent' && d.createdOn < '2025-05-01') return false;
    if (activeTabFilter === 'Won' && d.stage !== 'Closed Won') return false;

    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (stageFilter !== 'All' && d.stage !== stageFilter) return false;
    if (nameFilter && !d.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (companyFilter !== 'All' && d.company !== companyFilter) return false;
    if (contactFilter && !d.contactName.toLowerCase().includes(contactFilter.toLowerCase()) && !d.contactEmail.toLowerCase().includes(contactFilter.toLowerCase())) return false;
    if (valueFilter && d.dealValue > parseFloat(valueFilter)) return false;
    if (dateFilter && d.expectedClose !== dateFilter) return false;
    if (ownerFilter !== 'All' && d.owner !== ownerFilter) return false;

    return true;
  });

  // Tab counts
  const myDealsCount = myDealsCountState;
  const recentDealsCount = deals.filter(d => d.createdOn >= '2025-05-01').length;

  // Selection toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(filteredDeals.map(d => d.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDeals(prev => [...prev, id]);
    } else {
      setSelectedDeals(prev => prev.filter(item => item !== id));
    }
  };

  // Favorite toggle
  const handleToggleFavorite = (id: string) => {
    setFavoriteDeals(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    toast.success(favoriteDeals.includes(id) ? 'Removed from favorites' : 'Added to favorites');
  };

  // Calculations for stats metrics banner
  const totalDealsCount = kpis ? kpis.Total_Deals : totalCount;
  const totalPipelineSum = kpis ? kpis.Total_Pipeline_Value : deals.reduce((acc, d) => d.stage !== 'Closed Lost' ? acc + d.dealValue : acc, 0);
  const wonDealsCount = kpis
    ? (kpis.Deal_Stage_Counts?.['Closed Won'] ?? kpis.Won_Deals ?? 0)
    : deals.filter(d => d.stage === 'Closed Won').length;
  const lostDealsCount = kpis
    ? (kpis.Deal_Stage_Counts?.['Closed Lost'] ?? kpis.Lost_Deals ?? 0)
    : deals.filter(d => d.stage === 'Closed Lost').length;

  const getStageColor = (stageName: string) => {
    switch (stageName) {
      case 'Qualification': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/40';
      case 'Proposal': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40';
      case 'Negotiation': return 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-450 dark:border-sky-900/40';
      case 'Closed Won': return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800';
      case 'Closed Lost': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/40';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  const getStageIndex = (stageName: typeof initialDeals[number]['stage']) => {
    const stages = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    return stages.indexOf(stageName);
  };

  const columns = useMemo<ColumnConfig<Deal>[]>(() => [

    {
      key: 'name',
      header: 'Deal Name',
      sortable: true,
      render: (item) => (
        <div className="text-xs font-bold text-blue-605 dark:text-blue-400 group-hover:underline">
          {item.name}
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded flex items-center justify-center font-bold text-[9px] border shrink-0 ${item.companyBgColor}`}>
            {item.companyInitials}
          </span>
          <span className="text-xs font-semibold text-slate-705 dark:text-slate-350">{item.company}</span>
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Contact',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${item.contactBgColor}`}>
            {item.contactInitials}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-300">{item.contactName}</p>
            <span className="text-[10px] text-slate-405 font-medium">{item.contactEmail}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className={`rounded font-bold text-[9px] px-2 py-0.2 uppercase ${getStageColor(item.stage)}`}>
          {item.stage}
        </Badge>
      ),
    },
    {
      key: 'dealValue',
      header: 'Deal Value',
      sortable: true,
      className: 'text-right pr-6',
      render: (item) => (
        <span className="font-bold text-slate-850 dark:text-white font-mono w-full block">
          {item.currencySymbol} {item.dealValue.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'expectedClose',
      header: 'Expected Close',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-[11px] font-semibold text-slate-550 dark:text-slate-400">
          {new Date(item.expectedClose).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${item.ownerAvatarColor}`}>
            {item.ownerInitials}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-355">{item.owner}</span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      bool: false,
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{item.source || '-'}</span>
      ),
    },
    {
      key: 'probability',
      header: 'Probability',
      sortable: true,
      bool: false,
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{item.probability}%</span>
      ),
    },
    {
      key: 'contactPhone',
      header: 'Contact Phone',
      sortable: true,
      bool: false,
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{item.contactPhone || '-'}</span>
      ),
    },
  ], [favoriteDeals]);

  const handleActions = (item: Deal) => {
    return (
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-lg cursor-pointer">
              <MoreHorizontal className="h-4.5 w-4.5" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg text-xs font-semibold">
            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Deal Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => handleSelectDeal(item.id)}>
              <Eye className="h-4 w-4 text-slate-500" /> View Details
            </DropdownMenuItem>
            {canEditDeal && (
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/Deal/${item.id}/edit`)}>
                <Edit className="h-4 w-4 text-slate-500" /> Edit Deal
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
              setSelectedDealForAction(item);
              setIsAddNoteOpen(true);
            }}>
              <FileText className="h-4 w-4 text-slate-500" /> Add Note
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
              setSelectedDealForAction(item);
              setTaskFormName('');
              setTaskFormDesc('');
              setTaskFormStartDate('');
              setTaskFormDueDate('');
              setTaskFormPriority('Normal');
              setTaskFormStatus('Pending');
              setTaskFormCompletion('0%');
              setTaskFormAssignedPerson('');
              setIsAddTaskOpen(true);
            }}>
              <CheckSquare className="h-4 w-4 text-slate-500" /> Add Task
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
              setSelectedDealForAction(item);
              setMailSubject('');
              setMailBody('');
              setIsMailOpen(true);
            }}>
              <Mail className="h-4 w-4 text-slate-500" /> Send Email
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                <RefreshCw className="h-4 w-4 text-slate-500" /> Change Stage
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                {(['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={() => {
                      let prob = 50;
                      if (stage === 'Qualification') prob = 20;
                      else if (stage === 'Proposal') prob = 60;
                      else if (stage === 'Negotiation') prob = 85;
                      else if (stage === 'Closed Won') prob = 100;
                      else if (stage === 'Closed Lost') prob = 0;

                      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
                      const type = stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : 'Open';

                      updateDealApi(item.id, { Deal_Stage: stage, Deal_Type: type, Deal_Probablity: prob.toString() }, token)
                        .then(() => {
                          clearCache();
                          setDeals(prev => prev.map(d =>
                            d.id === item.id
                              ? { ...d, stage, probability: prob, lastUpdated: new Date().toISOString().split('T')[0] }
                              : d
                          ));
                          toast.success(`Deal stage updated to ${stage}`);
                        })
                        .catch((err) => {
                          console.error(err);
                          toast.error('Failed to update deal stage on server.');
                        });
                    }}
                    className="cursor-pointer text-xs font-medium"
                  >
                    {stage}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />

            {canDeleteDeal && (
              <DropdownMenuItem className="gap-2 cursor-pointer text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={() => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
                deleteDealApi(item.id, token)
                  .then(() => {
                    clearCache();
                    setDeals(prev => prev.filter(d => d.id !== item.id));
                    toast.success(`Deal deleted successfully!`);
                  })
                  .catch((err) => {
                    console.error(err);
                    toast.error('Failed to delete deal on server.');
                  });
              }}>
                <Trash2 className="h-4 w-4 text-rose-600" /> Delete Deal
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (isLoaded && !canViewDealOverview) {
    return null;
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* 1. SKELETON LOADER STATE */}
        {isLoading && isFirstLoad && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left"
          >
            {/* Header section skeleton */}
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2">
                <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>

            {/* Metrics cards row skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Filters bar skeleton */}
            <div className="flex justify-between items-center gap-4 py-1.5">
              <div className="h-9.5 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              <div className="flex items-center gap-2">
                <div className="h-9.5 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                <div className="h-9.5 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              </div>
            </div>

            {/* Table skeleton */}
            <div className="border dark:border-slate-900 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 p-4">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="flex justify-between items-center gap-4 py-3 border-b dark:border-slate-900 last:border-0">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. REAL DEALS LIST VIEW */}
        {(!isLoading || !isFirstLoad) && view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left"
          >

            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1.5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Deals</h1>
                <p className="text-muted-foreground text-xs md:text-sm pt-0.5">Track and manage your deals in one place.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">


                {canExportDeal && (
                  <Button
                    variant="outline"
                    className="border-slate-200 dark:border-slate-800 rounded-xl h-9.5 text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-950"
                    onClick={() => {
                      const headers = ['ID', 'Deal Name', 'Company', 'Stage', 'Value', 'Expected Close', 'Owner'];
                      const csvData = deals.map(d => [d.id, d.name, d.company, d.stage, d.dealValue, d.expectedClose, d.owner]);
                      const csvContent = [headers.join(','), ...csvData.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'deals.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('Deals exported successfully!');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                )}

                {/* Deal by Source Button */}
                <Button
                  variant="outline"
                  onClick={() => router.push('/Deal/deal-by-sourse')}
                  className="border-slate-200 dark:border-slate-800 rounded-xl h-9.5 text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs hover:cursor-pointer"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Deal by Source
                </Button>

                {/* Filters Trigger */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`border-slate-200 dark:border-slate-800 rounded-xl h-9.5 text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-950 ${showFilters ? 'bg-slate-100 dark:bg-slate-800 border-blue-500 text-blue-600' : ''
                    }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </Button>

                {/* Create Deal Button */}
                {canCreateDeal && (
                  <Button
                    onClick={() => router.push('/Deal/create')}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white font-bold h-9.5 px-4 rounded-xl text-xs gap-1.5 cursor-pointer hover:opacity-90 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Deal
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Collapsible Filter Panel */}
            {showFilters && (
              <div className="border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl shadow-2xs p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                  {/* Deal Name Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deal Name</label>
                    <Input
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs"
                    />
                  </div>

                  {/* Company Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</label>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="h-8.5 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs outline-none cursor-pointer"
                    >
                      <option value="All">All Companies</option>
                      {uniqueCompanies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</label>
                    <Input
                      placeholder="Filter by contact..."
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs"
                    />
                  </div>

                  {/* Owner Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner</label>
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="h-8.5 w-full px-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs outline-none cursor-pointer"
                    >
                      <option value="All">All Owners</option>
                      {uniqueOwners.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max Value Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Value</label>
                    <Input
                      type="number"
                      placeholder="Max value..."
                      value={valueFilter}
                      onChange={(e) => setValueFilter(e.target.value)}
                      className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs"
                    />
                  </div>

                  {/* Expected Close Date Filter */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Close</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="h-8.5 px-2.5 border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-200 text-xs cursor-pointer"
                        style={{ flex: 1 }}
                      />

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSearchQuery('');
                          setStageFilter('All');
                          setNameFilter('');
                          setCompanyFilter('All');
                          setContactFilter('');
                          setValueFilter('');
                          setDateFilter('');
                          setOwnerFilter('All');
                        }}
                        className="h-8.5 text-xs font-bold text-rose-500 hover:text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2.5 cursor-pointer shadow-none"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Metrics cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Total Deals */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-900/20">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Deals</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-mono">{totalDealsCount}</span>
                </div>
              </div>

              {/* Total Pipeline Value */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-655 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-900/20">
                  <span className="font-bold text-base">₹</span>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Pipeline Value</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-mono">
                    ₹ {totalPipelineSum.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Won Deals */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/50 dark:border-purple-900/20">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Won Deals</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-mono">{wonDealsCount}</span>
                </div>
              </div>

              {/* Lost Deals */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/50 dark:border-amber-900/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Lost Deals</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-mono">{lostDealsCount}</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs, Search & View Toggle row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-955 p-4 border dark:border-slate-900 rounded-2xl">
              {/* Left: Tabs */}
              <div className="flex flex-wrap items-center gap-1 border-b xl:border-b-0 dark:border-slate-900 pb-2 xl:pb-0">
                {([
                  { name: 'All', label: 'All Deals', count: totalDealsCount },
                  { name: 'My', label: 'My Deals', count: myDealsCount },
                  { name: 'Recent', label: 'Recently Added', count: recentDealsCount },
                  { name: 'Won', label: 'Won Deals', count: wonDealsCount }
                ] as const).map((tab) => {
                  const isActive = activeTabFilter === tab.name;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTabFilter(tab.name)}
                      className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-[2px] xl:mb-0 cursor-pointer ${isActive
                        ? 'border-blue-600 text-blue-605 dark:border-blue-500 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {/* Right: Search, Toggle & Settings */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9.5 pr-3 h-9.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold w-full font-sans text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* View Toggles */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLayoutView('list')}
                    className={`h-7 w-7 rounded-lg cursor-pointer ${layoutView === 'list'
                      ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-xs'
                      : 'text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLayoutView('grid')}
                    className={`h-7 w-7 rounded-lg cursor-pointer ${layoutView === 'grid'
                      ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-xs'
                      : 'text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stage Filter */}
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="h-9.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <option value="All">All Stages</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
            </div>

            {/* List / Table View */}
            {layoutView === 'list' && (
              <ReusableTable
                data={filteredDeals}
                setData={setDeals}
                columns={columns}
                selectable={true}
                selectedRowIds={selectedDeals}
                onSelectionChange={(selectedRows) => setSelectedDeals(selectedRows.map(row => row.id))}
                actions={handleActions}
                onRowClick={(row) => handleSelectDeal(row.id)}
                page={currentPage}
                totalRecords={totalCount}
                onChangePage={(newPage) => setCurrentPage(newPage)}
                pageSize={10}
                className="[&_th]:!text-[10px]"
              />
            )}

            {/* Grid/Card View container */}
            {layoutView === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 space-y-4 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="flex flex-col items-center space-y-3 pt-2">
                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="border-t dark:border-slate-900 pt-3 flex justify-between items-center">
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredDeals.map((item) => {
                    const isSelected = selectedDeals.includes(item.id);
                    const isFavorite = favoriteDeals.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectDeal(item.id)}
                        className={`relative bg-white dark:bg-slate-950 border dark:border-slate-900 hover:border-blue-200 dark:hover:border-blue-900/60 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between text-left group gap-4 ${isSelected ? 'ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/5 border-blue-200 dark:border-blue-900/40' : ''
                          }`}
                      >
                        {/* Top actions line */}
                        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(item.id, !!checked)}
                            className="cursor-pointer"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleFavorite(item.id)}
                              className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                            >
                              <Star
                                className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-350'
                                  }`}
                              />
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg text-xs font-semibold">
                                <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">Deal Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => handleSelectDeal(item.id)}>
                                  <Eye className="h-4 w-4 text-slate-500" /> View Details
                                </DropdownMenuItem>
                                {canEditDeal && (
                                  <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/Deal/${item.id}/edit`)}>
                                    <Edit className="h-4 w-4 text-slate-500" /> Edit Deal
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                                  setSelectedDealForAction(item);
                                  setIsAddNoteOpen(true);
                                }}>
                                  <FileText className="h-4 w-4 text-slate-500" /> Add Note
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                                  setSelectedDealForAction(item);
                                  setTaskFormName('');
                                  setTaskFormDesc('');
                                  setTaskFormStartDate('');
                                  setTaskFormDueDate('');
                                  setTaskFormPriority('Normal');
                                  setTaskFormStatus('Pending');
                                  setTaskFormCompletion('0%');
                                  setTaskFormAssignedPerson('');
                                  setIsAddTaskOpen(true);
                                }}>
                                  <CheckSquare className="h-4 w-4 text-slate-500" /> Add Task
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                                  setSelectedDealForAction(item);
                                  setMailSubject('');
                                  setMailBody('');
                                  setIsMailOpen(true);
                                }}>
                                  <Mail className="h-4 w-4 text-slate-500" /> Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                                    <RefreshCw className="h-4 w-4 text-slate-500" /> Change Stage
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                                    {(['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((stage) => (
                                      <DropdownMenuItem
                                        key={stage}
                                        onClick={() => {
                                          let prob = 50;
                                          if (stage === 'Qualification') prob = 20;
                                          else if (stage === 'Proposal') prob = 60;
                                          else if (stage === 'Negotiation') prob = 85;
                                          else if (stage === 'Closed Won') prob = 100;
                                          else if (stage === 'Closed Lost') prob = 0;

                                          const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
                                          const type = stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : 'Open';

                                          updateDealApi(item.id, { Deal_Stage: stage, Deal_Type: type, Deal_Probablity: prob.toString() }, token)
                                            .then(() => {
                                              clearCache();
                                              setDeals(prev => prev.map(d =>
                                                d.id === item.id
                                                  ? { ...d, stage, probability: prob, lastUpdated: new Date().toISOString().split('T')[0] }
                                                  : d
                                              ));
                                              toast.success(`Deal stage updated to ${stage}`);
                                            })
                                            .catch((err) => {
                                              console.error(err);
                                              toast.error('Failed to update deal stage on server.');
                                            });
                                        }}
                                        className="cursor-pointer text-xs font-medium"
                                      >
                                        {stage}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                                  setSelectedDealForAction(item);
                                  setIsAddNoteOpen(true);
                                }}>
                                  <FileText className="h-4 w-4 text-slate-500" /> Add Note
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                                  setSelectedDealForAction(item);
                                  setTaskFormName('');
                                  setTaskFormDesc('');
                                  setTaskFormStartDate('');
                                  setTaskFormDueDate('');
                                  setTaskFormPriority('Normal');
                                  setTaskFormStatus('Pending');
                                  setTaskFormCompletion('0%');
                                  setTaskFormAssignedPerson('');
                                  setIsAddTaskOpen(true);
                                }}>
                                  <CheckSquare className="h-4 w-4 text-slate-500" /> Add Task
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => window.open(`mailto:${item.contactEmail}`)}>
                                  <Mail className="h-4 w-4 text-slate-500" /> Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => window.open(`tel:${item.contactPhone}`)}>
                                  <PhoneCall className="h-4 w-4 text-slate-500" /> Make Call
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {canDeleteDeal && (
                                  <DropdownMenuItem className="gap-2 cursor-pointer text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={() => {
                                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
                                    deleteDealApi(item.id, token)
                                      .then(() => {
                                        clearCache();
                                        setDeals(prev => prev.filter(d => d.id !== item.id));
                                        toast.success(`Deal deleted successfully!`);
                                      })
                                      .catch((err) => {
                                        console.error(err);
                                        toast.error('Failed to delete deal on server.');
                                      });
                                  }}>
                                    <Trash2 className="h-4 w-4 text-rose-600" /> Delete Deal
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Card Content (Center) */}
                        <div className="flex flex-col items-center text-center space-y-3 pt-2">
                          {/* Company avatar circle in center */}
                          <div className={`h-16 w-16 rounded-full flex items-center justify-center font-extrabold text-lg shadow-2xs border shrink-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${item.companyBgColor.split(' ')[1] || 'text-slate-800 dark:text-slate-100'}`}>
                            {item.companyInitials}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-950 dark:text-white group-hover:text-blue-605 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                              {item.name}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {item.company}
                            </p>
                          </div>

                          {/* Deal Value */}
                          <div className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-350 font-mono">
                              {item.currencySymbol} {item.dealValue.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom Row */}
                        <div className="border-t dark:border-slate-900 pt-3 flex items-center justify-between text-xs mt-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${item.ownerAvatarColor}`}>
                              {item.ownerInitials}
                            </span>
                            <span className="font-bold text-slate-500 dark:text-slate-400 truncate text-[11px]">{item.owner}</span>
                          </div>

                          <Badge variant="outline" className={`rounded-md font-extrabold text-[10px] py-0.5 px-2 tracking-wide uppercase shrink-0 ${getStageColor(item.stage)}`}>
                            {item.stage}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
                {!isLoading && filteredDeals.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-405 bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                      <span className="text-sm font-semibold">No deals found matching current filters.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination Banner (only for Grid view since List view uses ReusableTable's built-in pagination) */}
            {layoutView === 'grid' && (
              <div className="flex items-center justify-between text-xs font-semibold text-slate-405 py-2">
                <span>
                  Showing {totalCount > 0 ? (currentPage - 1) * 10 + 1 : 0} to {Math.min(currentPage * 10, totalCount)} of {totalCount} deals
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg border-slate-200 dark:border-slate-850"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 w-7 p-0 rounded-lg ${currentPage === pageNum
                        ? 'bg-blue-605 text-white border-blue-600 font-extrabold'
                        : 'border-slate-200 dark:border-slate-855'
                        }`}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg border-slate-200 dark:border-slate-850"
                    disabled={currentPage >= Math.ceil(totalCount / 10) || totalCount === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / 10)))}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* 3. REAL DEAL DETAIL VIEW */}
        {!isLoading && view === 'detail' && currentDeal && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left"
          >
            {/* Header controls with Back to list */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1.5">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                  onClick={() => setView('list')}
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </Button>
                <div>
                  <div className="text-xs text-slate-400 font-semibold space-x-1 flex items-center">
                    <span onClick={() => setView('list')} className="hover:text-slate-650 cursor-pointer">Deals</span>
                    <span>&gt;</span>
                    <span className="text-slate-600 dark:text-slate-350">Deal Overview</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">Deal Overview</h1>
                </div>
              </div>

              {/* Action buttons on detail view */}
              <div className="flex items-center gap-2">
                {canEditDeal && (
                  <Button
                    variant="outline"
                    className="h-9 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl gap-1.5 text-slate-750 dark:text-slate-350 bg-white dark:bg-slate-950"
                    onClick={() => router.push(`/Deal/${currentDeal.id}/edit`)}
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}

                {/* Mark as Won Dropdown/Button */}
                <div className="flex items-center shadow-xs rounded-xl overflow-hidden border border-blue-600 dark:border-blue-500">
                  <Button
                    style={{ backgroundColor: primaryColor }}
                    className="h-9 px-4 text-xs font-bold text-white rounded-r-none hover:opacity-90 border-r border-blue-700/50"
                    onClick={() => handleStageChange('Closed Won')}
                  >
                    {currentDeal.stage === 'Closed Won' ? (
                      <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Won!</span>
                    ) : 'Mark as Won'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button
                        style={{ backgroundColor: primaryColor }}
                        size="icon"
                        className="h-9 w-8 text-white rounded-l-none hover:opacity-90 flex items-center justify-center"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800">
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold text-emerald-605 dark:text-emerald-450" onClick={() => handleStageChange('Closed Won')}>
                        <Trophy className="h-4 w-4" /> Mark Won
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold text-rose-605 dark:text-rose-450" onClick={() => handleStageChange('Closed Lost')}>
                        <AlertCircle className="h-4 w-4" /> Mark Lost
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleStageChange('Negotiation')}>
                        Move to Negotiation
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleStageChange('Proposal')}>
                        Move to Proposal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Action Triple Dot */}
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800">
                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800 text-xs">
                    <DropdownMenuItem onClick={() => toast.info('Deal archived.')} className="cursor-pointer">
                      Archive Deal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStageChange('Closed Lost')} className="cursor-pointer text-rose-500">
                      Mark as Lost
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Title Metadata Block */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {currentDeal.name}
                </h2>
                <Badge variant="outline" className={`rounded-md font-bold text-[10px] py-0.5 px-2.5 uppercase tracking-wide border ${getStageColor(currentDeal.stage)}`}>
                  {currentDeal.stage}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-450 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                  {currentDeal.company}
                </span>
                <span className="text-slate-300 dark:text-slate-800">&bull;</span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                  {currentDeal.contactName}
                </span>
                <span className="text-slate-300 dark:text-slate-800">&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                  <a href={`mailto:${currentDeal.contactEmail}`} className="hover:text-blue-500 transition-colors">{currentDeal.contactEmail}</a>
                </span>
                <span className="text-slate-300 dark:text-slate-800">&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                  Created on {new Date(currentDeal.createdOn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Stage Stepper */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs">
                  <div className="flex flex-col md:flex-row items-stretch justify-between gap-1 w-full pt-1.5">
                    {['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((step, idx) => {
                      const currentIdx = getStageIndex(currentDeal.stage);
                      const stepIdx = getStageIndex(step as any);

                      const isCurrent = currentDeal.stage === step;
                      const isPast = stepIdx < currentIdx && currentDeal.stage !== 'Closed Lost';
                      const isLost = currentDeal.stage === 'Closed Lost' && step === 'Closed Lost';

                      const hasNext = idx < 4;

                      return (
                        <div key={idx} className="flex-1 flex flex-col md:flex-row items-center relative group">
                          <button
                            onClick={() => handleStageChange(step as any)}
                            className="flex flex-col items-center focus:outline-none w-full md:w-auto z-10 cursor-pointer"
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${isCurrent ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/40 shadow-sm font-extrabold' :
                              isLost ? 'bg-rose-500 text-white border-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/40 shadow-sm font-extrabold' :
                                isPast ? 'bg-emerald-500 text-white border-emerald-500' :
                                  'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-650 border-slate-200 dark:border-slate-800'
                              }`}>
                              {isPast ? (
                                <Check className="h-4.5 w-4.5 stroke-[3]" />
                              ) : isCurrent ? (
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                              ) : (
                                <span className="text-[10px] font-bold">{idx + 1}</span>
                              )}
                            </div>

                            <span className={`text-[10px] font-extrabold mt-2 tracking-wide uppercase ${isCurrent ? 'text-blue-600 dark:text-blue-450 font-black' :
                              isLost ? 'text-rose-500 dark:text-rose-455 font-black' :
                                isPast ? 'text-slate-700 dark:text-slate-350' :
                                  'text-slate-400 dark:text-slate-605'
                              }`}>
                              {step}
                            </span>
                            {isCurrent && (
                              <span className="text-[8px] text-blue-500/70 font-semibold uppercase tracking-wider block -mt-0.5">
                                Current Stage
                              </span>
                            )}
                          </button>

                          {hasNext && (
                            <div className="hidden md:block flex-1 h-[2px] bg-slate-100 dark:bg-slate-900 mx-4 -mt-6">
                              <div
                                className={`h-full transition-all duration-300 ${stepIdx < currentIdx && currentDeal.stage !== 'Closed Lost' ? 'bg-emerald-450' : 'bg-transparent'
                                  }`}
                                style={{ width: stepIdx < currentIdx ? '100%' : '0%' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  {/* Deal Value */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 text-left font-semibold">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deal Value</span>
                      <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                        {currentDeal.currencySymbol} {currentDeal.dealValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expected Close */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-655 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 text-left font-semibold">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Close</span>
                      <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                        {new Date(currentDeal.expectedClose).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Probability */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-50/80 dark:bg-purple-950/20 text-purple-600 dark:text-purple-405 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 text-left font-semibold">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probability</span>
                      <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                        {currentDeal.probability}%
                      </span>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 flex items-center justify-center shrink-0 font-bold text-sm">
                      {currentDeal.ownerInitials}
                    </div>
                    <div className="space-y-0.5 text-left font-semibold">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner</span>
                      <span className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white block truncate">
                        {currentDeal.owner}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs Panel */}
                <div className="border-b dark:border-slate-900 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                  {['Overview', 'Notes', 'Tasks', 'Activities', 'Emails', 'Invoices'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${isActive ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-slate-400 dark:text-slate-500'
                          }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tab contents */}
                <div className="min-h-[250px] text-left">

                  {activeTab === 'Overview' && (
                    <div className="space-y-6">

                      {/* Deal Summary */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Deal Summary</h3>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-semibold bg-slate-50/50 dark:bg-slate-950/20 p-4 border dark:border-slate-900 rounded-2xl">
                          {currentDeal.summary}
                        </p>
                      </div>

                      {/* Attribute specs */}
                      <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="px-5 py-3 border-b dark:border-slate-900">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Deal Attributes</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-semibold">
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Deal Name</span>
                            <span className="text-slate-800 dark:text-white font-bold">{currentDeal.name}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Stage</span>
                            <Badge variant="outline" className={`rounded font-bold text-[9px] py-0 px-2 uppercase ${getStageColor(currentDeal.stage)}`}>
                              {currentDeal.stage}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Company</span>
                            <span className="text-slate-800 dark:text-white font-bold">{currentDeal.company}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Probability</span>
                            <span className="text-slate-800 dark:text-white font-mono">{currentDeal.probability}%</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Contact</span>
                            <span className="text-slate-800 dark:text-white font-bold">{currentDeal.contactName}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Expected Close</span>
                            <span className="text-slate-800 dark:text-white font-mono">{currentDeal.expectedClose}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Email</span>
                            <a href={`mailto:${currentDeal.contactEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{currentDeal.contactEmail}</a>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Source</span>
                            <span className="text-slate-800 dark:text-white font-bold">{currentDeal.source}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b md:border-b-0 dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Phone</span>
                            <span className="text-slate-800 dark:text-white font-mono">{currentDeal.contactPhone}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b md:border-b-0 dark:border-slate-900">
                            <span className="text-slate-400 font-medium">Owner</span>
                            <span className="text-slate-800 dark:text-white font-bold">{currentDeal.owner}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 md:border-b-0">
                            <span className="text-slate-400 font-medium">Deal Value</span>
                            <span className="text-slate-800 dark:text-white font-mono font-bold">{currentDeal.currencySymbol} {currentDeal.dealValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 md:border-b-0">
                            <span className="text-slate-400 font-medium">Created On</span>
                            <span className="text-slate-800 dark:text-white font-mono">{currentDeal.createdOn}</span>
                          </div>
                        </div>
                      </div>

                      {/* Internal Notes */}
                      <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                          className="w-full px-5 py-4 flex items-center justify-between border-b dark:border-slate-900 focus:outline-none cursor-pointer"
                        >
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-300">Internal Notes</span>
                          {isNotesCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
                        </button>
                        <AnimatePresence initial={false}>
                          {!isNotesCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 space-y-4">
                                <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/40 p-4 border dark:border-slate-900 rounded-xl text-left leading-relaxed">
                                  {currentDeal.internalNotes || 'No internal notes recorded yet.'}
                                </p>
                                <form onSubmit={handleAddNote} className="flex gap-2">
                                  <Input
                                    placeholder="Add notes logs..."
                                    value={newNoteText}
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    className="h-9.5 text-xs bg-slate-50 dark:bg-slate-905 border border-slate-205 dark:border-slate-800 rounded-xl"
                                  />
                                  <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white h-9.5 px-4 text-xs font-semibold rounded-xl shrink-0">
                                    Add Note
                                  </Button>
                                </form>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>
                  )}

                  {activeTab === 'Products/Services' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-550 font-semibold space-y-4">
                      <Briefcase className="h-8 w-8 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Products & Associated Solutions</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Configure licenses or service structures related to this deal estimation.</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product / Service Name</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-bold">{currentDeal.name} Delivery</TableCell>
                            <TableCell className="text-right font-mono">{currentDeal.currencySymbol} {(currentDeal.dealValue * 0.8).toLocaleString()}</TableCell>
                            <TableCell className="text-center font-mono">1</TableCell>
                            <TableCell className="text-right font-mono font-bold">{currentDeal.currencySymbol} {(currentDeal.dealValue * 0.8).toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-bold">Setup, Integration & Support Suite</TableCell>
                            <TableCell className="text-right font-mono">{currentDeal.currencySymbol} {(currentDeal.dealValue * 0.2).toLocaleString()}</TableCell>
                            <TableCell className="text-center font-mono">1</TableCell>
                            <TableCell className="text-right font-mono font-bold">{currentDeal.currencySymbol} {(currentDeal.dealValue * 0.2).toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {activeTab === 'Notes' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Internal Notes log</h3>
                      <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-xl leading-relaxed">
                        {currentDeal.internalNotes}
                      </p>
                      <form onSubmit={handleAddNote} className="space-y-2 text-left">
                        <textarea
                          placeholder="Log a new note description..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="w-full min-h-[100px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        />
                        <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white h-9 px-4 rounded-xl text-xs font-semibold">Add Note</Button>
                      </form>
                    </div>
                  )}

                  {activeTab === 'Tasks' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Deal Checklist</h3>

                      <div className="space-y-3.5">
                        {tasks.map(tsk => (
                          <div key={tsk.id} className="flex items-start justify-between py-1 border-b last:border-b-0 dark:border-slate-900">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={tsk.completed}
                                onCheckedChange={(checked) => handleToggleTask(tsk.id, !!checked)}
                                className="mt-0.5 border-slate-300 rounded"
                              />
                              <div className="text-xs text-left">
                                <p className={`font-semibold ${tsk.completed ? 'line-through text-slate-405 dark:text-slate-550' : 'text-slate-800 dark:text-white'}`}>
                                  {tsk.title}
                                </p>
                                <span className={`text-[10px] font-semibold ${tsk.completed ? 'text-slate-400' : 'text-rose-500 font-bold'}`}>
                                  Due: {tsk.dueDate}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] rounded font-semibold bg-slate-50 dark:bg-slate-900">
                              {tsk.owner}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t dark:border-slate-900 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Task Title</label>
                          <Input
                            placeholder="Add action item..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="h-9 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Due Date</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. 25 May, 2025"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="h-9 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                            <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white h-9 px-4 rounded-xl text-xs font-semibold shrink-0">Add Task</Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {activeTab === 'Activities' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Activities History</h3>
                      <div className="relative border-l dark:border-slate-850 pl-4 space-y-5 py-2">
                        {timeline.map((act) => (
                          <div key={act.id} className="relative">
                            <div className="absolute -left-6.5 top-0.5 bg-white dark:bg-slate-950 p-0.5 rounded-full border dark:border-slate-900">
                              <div className={`h-4.5 w-4.5 rounded-full ${act.color}`} />
                            </div>
                            <div className="text-xs space-y-0.5 text-left">
                              <span className="font-bold text-slate-850 dark:text-white">{act.type}</span>
                              <p className="text-slate-600 dark:text-slate-400 font-semibold">{act.details}</p>
                              <span className="text-[9px] text-slate-400 block pt-0.5">{act.date} at {act.time} &bull; {act.user}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Emails' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-500 font-semibold space-y-3">
                      <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Email Integration</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Directly compose and read mail threads associated with {currentDeal.contactName}.</p>
                      </div>
                      <Button variant="outline" className="border-slate-200 dark:border-slate-800 rounded-xl h-9 text-xs font-bold gap-2">Compose Email</Button>
                    </div>
                  )}

                  {activeTab === 'Invoices' && (
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-500 font-semibold space-y-3">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Billing & Payments</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Invoice templates and transactional records appear here once finalized.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (1/3 width) - Sidebar details */}
              <div className="space-y-6">

                {/* Contact widget */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 border-b dark:border-slate-900 pb-2 text-left">Contact</h3>
                  <div className="flex gap-4 items-start text-left">
                    <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${currentDeal.contactBgColor}`}>
                      {currentDeal.contactInitials}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-slate-850 dark:text-white leading-tight">{currentDeal.contactName}</h4>
                      <p className="text-[11px] font-semibold text-slate-405">{currentDeal.contactRole}</p>

                      <div className="space-y-2 pt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <a href={`mailto:${currentDeal.contactEmail}`} className="hover:text-blue-500 transition-colors truncate">{currentDeal.contactEmail}</a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{currentDeal.contactPhone}</span>
                          <a
                            href={`https://wa.me/${currentDeal.contactPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-0.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition-colors"
                          >
                            <WhatsAppIcon />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                    onClick={() => toast.info(`Viewing contact details for ${currentDeal.contactName}`)}
                  >
                    View Contact
                  </Button>
                </div>

                {/* Timeline widget */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-900 pb-2 text-left">Timeline</h3>
                  <div className="relative border-l dark:border-slate-900 pl-4 space-y-5 py-1 text-left">
                    {timeline.slice(0, 3).map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-6.5 top-0.5 bg-white dark:bg-slate-950 p-0.5 rounded-full border dark:border-slate-900">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center text-white ${event.category === 'stage' ? 'bg-purple-500' :
                            event.category === 'note' ? 'bg-amber-500' :
                              event.category === 'task' ? 'bg-indigo-500' :
                                'bg-emerald-500'
                            }`}>
                            {event.category === 'stage' ? <TrendingUp className="h-2 w-2" /> :
                              event.category === 'note' ? <MessageSquare className="h-2 w-2" /> :
                                event.category === 'task' ? <Check className="h-2 w-2" /> :
                                  <Activity className="h-2 w-2" />}
                          </div>
                        </div>
                        <div className="text-[11px] space-y-0.5 font-semibold">
                          <span className="font-bold text-slate-800 dark:text-white block">{event.type}</span>
                          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed truncate">{event.details}</p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">{event.date} {event.time} &bull; by {event.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                    onClick={() => setActiveTab('Activities')}
                  >
                    View Full Timeline
                  </Button>
                </div>

                {/* Files widget */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                  <div className="flex justify-between items-center border-b dark:border-slate-900 pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455">Files</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      onClick={handleFileUpload}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3.5 text-left">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-2 py-0.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 text-white font-bold text-[9px] uppercase ${file.type === 'pdf' ? 'bg-rose-500' :
                            file.type === 'docx' ? 'bg-blue-500' :
                              file.type === 'xlsx' ? 'bg-emerald-500' :
                                'bg-indigo-500'
                            }`}>
                            {file.type}
                          </div>
                          <div className="text-[11px] font-semibold min-w-0">
                            <p className="text-slate-800 dark:text-white truncate font-bold">{file.name}</p>
                            <span className="text-slate-400 text-[10px] font-medium">{file.type.toUpperCase()} &bull; {file.size} &bull; {file.date}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-405 hover:text-slate-700" onClick={() => toast.info(`Downloading ${file.name}...`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                    onClick={() => toast.info('File attachments dashboard loaded.')}
                  >
                    View All Files
                  </Button>
                </div>

              </div>

            </div>

            {/* Edit details popup dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">Edit Deal Details</DialogTitle>
                    <DialogDescription>Update the core properties of this sales pipeline item.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deal Name *</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company *</label>
                      <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Value (BDT) *</label>
                        <Input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probability (%)</label>
                        <Input type="number" min="0" max="100" value={editProbability} onChange={(e) => setEditProbability(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Close Date *</label>
                      <Input type="date" value={editExpectedClose} onChange={(e) => setEditExpectedClose(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Summary</label>
                      <textarea
                        className="w-full min-h-[80px] p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white font-bold">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Add Note Pop-up Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white dark:bg-slate-955 border dark:border-slate-900 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-900 pb-4">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} /> Log a New Note {selectedDealForAction && `for ${selectedDealForAction.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Log discussions, updates, and timelines with the client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActionAddNote} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Note Subject</label>
              <Input
                placeholder="e.g. Project Scope Review or Client Call"
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
                className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider block">Note Details</label>
              <textarea
                placeholder="Type note details or discussion points here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full min-h-[120px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
            <DialogFooter className="pt-4 border-t dark:border-slate-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddNoteOpen(false);
                  setNewNote('');
                  setNewNoteSubject('');
                  setSelectedDealForAction(null);
                }}
                className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Log Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Pop-up Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl bg-white dark:bg-slate-955 border dark:border-slate-900 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-900 pb-4">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} /> Create a New Task {selectedDealForAction && `for ${selectedDealForAction.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Add actions, priorities, and assigned personnel to keep your deal on track.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActionAddTask} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Task Name *</label>
                <Input
                  placeholder="e.g. Schedule Product Demo"
                  value={taskFormName}
                  onChange={(e) => setTaskFormName(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Task Description</label>
                <Input
                  placeholder="e.g. Review requirements with technical architect"
                  value={taskFormDesc}
                  onChange={(e) => setTaskFormDesc(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Start Date</label>
                <Input
                  type="date"
                  value={taskFormStartDate}
                  onChange={(e) => setTaskFormStartDate(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Due Date</label>
                <Input
                  type="date"
                  value={taskFormDueDate}
                  onChange={(e) => setTaskFormDueDate(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block">Priority</label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-905 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block">Status</label>
                  <select
                    value={taskFormStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTaskFormStatus(val);
                      if (val === 'Completed') setTaskFormCompletion('100%');
                      else if (val === 'Pending') setTaskFormCompletion('0%');
                    }}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-905 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-955"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block">Completion</label>
                  <select
                    value={taskFormCompletion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTaskFormCompletion(val);
                      if (val === '100%') setTaskFormStatus('Completed');
                      else if (val === '0%') setTaskFormStatus('Pending');
                      else setTaskFormStatus('In Progress');
                    }}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-905 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
                  >
                    <option value="0%">0%</option>
                    <option value="25%">25%</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                    <option value="100%">100%</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Person</label>
                <Input
                  placeholder="e.g. Sadia Afrin"
                  value={taskFormAssignedPerson}
                  onChange={(e) => setTaskFormAssignedPerson(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t dark:border-slate-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddTaskOpen(false);
                  setTaskFormName('');
                  setTaskFormDesc('');
                  setTaskFormStartDate('');
                  setTaskFormDueDate('');
                  setTaskFormPriority('Normal');
                  setTaskFormStatus('Pending');
                  setTaskFormCompletion('0%');
                  setTaskFormAssignedPerson('');
                  setSelectedDealForAction(null);
                }}
                className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog Modal */}
      <Dialog open={isMailOpen} onOpenChange={setIsMailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl bg-white dark:bg-slate-955 border dark:border-slate-900 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-900 pb-4">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} /> Compose New Email {selectedDealForAction && `for ${selectedDealForAction.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Write an email or generate one using the AI helper.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActionSendMail} className="space-y-4 pt-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Email Subject</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Subject"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  required
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-205 dark:border-slate-800 rounded-xl flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleActionGenerateAiMail}
                  disabled={isAiGenerating}
                  className="h-10 text-xs rounded-xl font-bold border-slate-200 dark:border-slate-855 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 gap-1.5 shrink-0"
                >
                  {isAiGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  )}
                  AI Draft
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Email Content</label>
              <textarea
                placeholder="Write your email here..."
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
                required
                className="w-full min-h-[160px] p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <DialogFooter className="pt-4 border-t dark:border-slate-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMailOpen(false);
                  setMailSubject('');
                  setMailBody('');
                  setSelectedDealForAction(null);
                }}
                className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingMail}
                style={{ backgroundColor: primaryColor }}
                className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                {isSendingMail ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
