import { create } from 'zustand';
import { ProblemCategoryRecord } from '@/types/problem-category';

interface ProblemCategoryState {
  categories: ProblemCategoryRecord[];
  addCategory: (category: ProblemCategoryRecord) => void;
  deleteCategory: (id: string) => void;
  updateCategory: (id: string, updatedCategory: Partial<ProblemCategoryRecord>) => void;
}

const initialCategories: ProblemCategoryRecord[] = [
  {
    id: 'CAT-001',
    name: 'Application',
    code: 'APP',
    status: 'Active',
    description: 'Problems relating to software applications, APIs, user logins, and frontend code.',
    displayOrder: 10,
    defaultPriority: 'High',
    impact: 'Medium',
    createdBy: 'Raghav S.',
    createdAt: '2025-06-26'
  },
  {
    id: 'CAT-002',
    name: 'Database',
    code: 'DB',
    status: 'Active',
    description: 'Problems relating to SQL servers, NoSQL collections, connection pooling, and indexing.',
    displayOrder: 20,
    defaultPriority: 'High',
    impact: 'High',
    createdBy: 'Sandeep Verma',
    createdAt: '2025-06-26'
  }
];

export const useProblemCategoryStore = create<ProblemCategoryState>((set) => ({
  categories: initialCategories,
  addCategory: (category) => set((state) => ({ categories: [category, ...state.categories] })),
  deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
  updateCategory: (id, updatedCategory) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updatedCategory } : c)),
    })),
}));
