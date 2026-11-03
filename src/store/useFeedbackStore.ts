import { create } from 'zustand';

export interface FeedbackRecord {
  id: string;
  fromName: string;
  fromEmail: string;
  avatarColor: string;
  relatedToName: string;
  relatedToType: 'Company' | 'Deal' | 'Contact';
  rating: number; // 1 to 5
  type: 'Product' | 'Service' | 'Support';
  status: 'Published' | 'Pending' | 'Closed';
  receivedOn: string; // formatted date/time string e.g. "20 May, 2025 10:30 AM"
  content?: string;
}

interface FeedbackStats {
  total: number;
  positiveCount: number;
  positivePct: string;
  neutralCount: number;
  neutralPct: string;
  negativeCount: number;
  negativePct: string;
  averageRating: string;
}

interface FeedbackState {
  feedbacks: FeedbackRecord[];
  stats: FeedbackStats;
  addFeedback: (record: Omit<FeedbackRecord, 'id' | 'receivedOn' | 'avatarColor'>) => void;
  updateFeedback: (id: string, record: Partial<FeedbackRecord>) => void;
  updateFeedbackStatus: (id: string, status: FeedbackRecord['status']) => void;
  deleteFeedback: (id: string) => void;
}

const initialFeedbacks: FeedbackRecord[] = [
  {
    id: 'FB-000152',
    fromName: 'Sadia Afrin',
    fromEmail: 'sadia.afrin@example.com',
    avatarColor: 'bg-emerald-500',
    relatedToName: 'SoftTech Ltd.',
    relatedToType: 'Company',
    rating: 5.0,
    type: 'Product',
    status: 'Published',
    receivedOn: '20 May, 2025 10:30 AM',
    content: 'The product dashboard is extremely intuitive and speeds up our daily workflows significantly.'
  },
  {
    id: 'FB-000151',
    fromName: 'Jisan Mahmud',
    fromEmail: 'jisan.mahmud@example.com',
    avatarColor: 'bg-amber-500',
    relatedToName: 'Bright Digitals',
    relatedToType: 'Company',
    rating: 4.0,
    type: 'Service',
    status: 'Published',
    receivedOn: '19 May, 2025 03:15 PM',
    content: 'Good onboarding training session, the team resolved all our technical integration questions.'
  },
  {
    id: 'FB-000150',
    fromName: 'Monirul Islam',
    fromEmail: 'monirul.islam@example.com',
    avatarColor: 'bg-indigo-500',
    relatedToName: 'Innovate Tech',
    relatedToType: 'Deal',
    rating: 5.0,
    type: 'Support',
    status: 'Published',
    receivedOn: '19 May, 2025 11:45 AM',
    content: 'Outstanding technical support! The rep stayed on call with us until the database connection was fully configured.'
  },
  {
    id: 'FB-000149',
    fromName: 'Arifur Rahman',
    fromEmail: 'arifur.rahman@example.com',
    avatarColor: 'bg-blue-500',
    relatedToName: 'WebGrow Ltd.',
    relatedToType: 'Company',
    rating: 3.0,
    type: 'Product',
    status: 'Pending',
    receivedOn: '18 May, 2025 04:20 PM',
    content: 'The software meets basic requirements but we need more customized reporting filters.'
  },
  {
    id: 'FB-000148',
    fromName: 'Nazia Akter',
    fromEmail: 'nazia.akter@example.com',
    avatarColor: 'bg-cyan-500',
    relatedToName: 'HealthCare Plus',
    relatedToType: 'Company',
    rating: 4.0,
    type: 'Service',
    status: 'Published',
    receivedOn: '18 May, 2025 10:10 AM',
    content: 'Prompt service response and clear pricing package explanation.'
  },
  {
    id: 'FB-000147',
    fromName: 'Rakibul Hasan',
    fromEmail: 'rakibul.hasan@example.com',
    avatarColor: 'bg-slate-500',
    relatedToName: 'TechRise Solutions',
    relatedToType: 'Company',
    rating: 2.0,
    type: 'Support',
    status: 'Closed',
    receivedOn: '17 May, 2025 05:30 PM',
    content: 'Support response took over 24 hours for a critical bug. Rerouted ticket three times.'
  },
  {
    id: 'FB-000146',
    fromName: 'Tania Farah',
    fromEmail: 'tania.farah@example.com',
    avatarColor: 'bg-pink-500',
    relatedToName: 'NextGen CRM',
    relatedToType: 'Deal',
    rating: 5.0,
    type: 'Product',
    status: 'Published',
    receivedOn: '17 May, 2025 09:20 AM',
    content: 'Very satisfied with the CRM pipeline visualization features. Highly recommended!'
  },
  {
    id: 'FB-000145',
    fromName: 'Mehedi Hasan',
    fromEmail: 'mehedi.hasan@example.com',
    avatarColor: 'bg-green-600',
    relatedToName: 'Digital Xperts',
    relatedToType: 'Company',
    rating: 3.0,
    type: 'Service',
    status: 'Pending',
    receivedOn: '16 May, 2025 02:00 PM',
    content: 'Account setup was easy but the system UI feels slightly cluttered in the configuration panel.'
  }
];

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-green-600'
];

// Helper to compute statistics dynamically
const calculateStats = (records: FeedbackRecord[]): FeedbackStats => {
  const total = records.length;
  if (total === 0) {
    return {
      total: 0,
      positiveCount: 0,
      positivePct: '0%',
      neutralCount: 0,
      neutralPct: '0%',
      negativeCount: 0,
      negativePct: '0%',
      averageRating: '0.0'
    };
  }

  const positive = records.filter(r => r.rating >= 4).length;
  const neutral = records.filter(r => r.rating === 3).length;
  const negative = records.filter(r => r.rating <= 2).length;
  const sumRatings = records.reduce((acc, r) => acc + r.rating, 0);

  return {
    total,
    positiveCount: positive,
    positivePct: `${Math.round((positive / total) * 100)}%`,
    neutralCount: neutral,
    neutralPct: `${Math.round((neutral / total) * 100)}%`,
    negativeCount: negative,
    negativePct: `${Math.round((negative / total) * 100)}%`,
    averageRating: (sumRatings / total).toFixed(1)
  };
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedbacks: initialFeedbacks,
  stats: calculateStats(initialFeedbacks),

  addFeedback: (record) => set((state) => {
    // Generate a unique ID (based on next number)
    const nextNum = 153 + state.feedbacks.length - initialFeedbacks.length;
    const nextId = `FB-000${nextNum}`;
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const dateStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', ''); // e.g. "09 Jun 2026 04:30 PM"

    const newRecord: FeedbackRecord = {
      ...record,
      id: nextId,
      receivedOn: dateStr,
      avatarColor
    };

    const newFeedbacks = [newRecord, ...state.feedbacks];
    return {
      feedbacks: newFeedbacks,
      stats: calculateStats(newFeedbacks)
    };
  }),

  updateFeedback: (id, record) => set((state) => {
    const newFeedbacks = state.feedbacks.map(f =>
      f.id === id ? { ...f, ...record } : f
    );
    return {
      feedbacks: newFeedbacks,
      stats: calculateStats(newFeedbacks)
    };
  }),

  updateFeedbackStatus: (id, status) => set((state) => {
    const newFeedbacks = state.feedbacks.map(f =>
      f.id === id ? { ...f, status } : f
    );
    return {
      feedbacks: newFeedbacks,
      stats: calculateStats(newFeedbacks)
    };
  }),

  deleteFeedback: (id) => set((state) => {
    const newFeedbacks = state.feedbacks.filter(f => f.id !== id);
    return {
      feedbacks: newFeedbacks,
      stats: calculateStats(newFeedbacks)
    };
  })
}));
