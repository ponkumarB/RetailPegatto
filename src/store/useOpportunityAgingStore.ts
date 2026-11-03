import { create } from 'zustand';

export interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  stage: string;
  owner: string;
  amount: number;
  ageDays: number;
  agingBucket: string;
  probability: number;
  expectedCloseDate: string;
  lastActivityDate: string;
  status: 'At Risk' | 'Monitor' | 'On Track';
}

interface OpportunityAgingStore {
  opportunities: Opportunity[];
  searchQuery: string;
  selectedOwner: string;
  selectedStage: string;
  showOnlyAtRisk: boolean;
  currentPage: number;
  pageSize: number;
  
  setSearchQuery: (query: string) => void;
  setSelectedOwner: (owner: string) => void;
  setSelectedStage: (stage: string) => void;
  setShowOnlyAtRisk: (val: boolean) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const generateMockOpportunities = (): Opportunity[] => {
  const list: Opportunity[] = [];
  
  // Specific stages, owners, account names, project types
  const owners = ['Ajay Kumar', 'Priya Sharma', 'Rahul Verma', 'Neha Singh', 'Vikram Patel'];
  const stages = ['Qualification', 'Needs Analysis', 'Proposal/Quote', 'Negotiation'];
  
  const accounts = [
    'TechNova Solutions', 'BrightWay Enterprises', 'NexaTech Pvt. Ltd.',
    'NextGen Retail', 'InnovaSoft Systems', 'Aura Corp', 'Zenith Logistics',
    'Apex Financial', 'Core Health', 'Summit Tech', 'Alpha Group', 'CloudSphere Inc'
  ];
  
  const projects = [
    'Enterprise CRM Implementation', 'Cloud Migration Services', 'IT Support Contract',
    'Marketing Automation', 'Website Redesign Project', 'Security Audit',
    'Data Analytics Platform', 'ERP Upgrade', 'Help Desk Setup', 'SaaS Migration'
  ];

  const generateBucket = (
    count: number,
    targetSum: number,
    minAge: number,
    maxAge: number,
    status: 'At Risk' | 'Monitor' | 'On Track',
    bucketLabel: string,
    startIndex: number
  ) => {
    let currentSum = 0;
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      let amount = 0;
      if (isLast) {
        amount = targetSum - currentSum;
      } else {
        const avg = targetSum / count;
        // Introduce small variance
        const variance = (Math.random() * 0.5 - 0.25) * avg;
        amount = Math.round(avg + variance);
        currentSum += amount;
      }

      // Exact values for first 5 items to match mockup visual rows if needed
      // Row 1: Enterprise CRM Implementation | TechNova Solutions | Proposal/Quote | Ajay Kumar | ₹ 28,50,000 | 196 (red text) | > 180 Days (badge purple) | 60% | Mar 10, 2024 | May 18, 2024 | At Risk
      // Row 2: Cloud Migration Services | BrightWay Enterprises | Negotiation | Priya Sharma | ₹ 21,40,000 | 142 | 91-180 Days | 70% | Apr 5, 2024 | May 17, 2024 | At Risk
      // Row 3: IT Support Contract | NexaTech Pvt. Ltd. | Needs Analysis | Rahul Verma | ₹ 18,70,000 | 78 | 61-90 Days | 50% | Jun 15, 2024 | May 16, 2024 | Monitor
      // Row 4: Marketing Automation | NextGen Retail | Qualification | Neha Singh | ₹ 15,60,000 | 35 | 31-60 Days | 40% | Jun 28, 2024 | May 20, 2024 | On Track
      // Row 5: Website Redesign Project | InnovaSoft Systems | Qualification | Vikram Patel | ₹ 9,80,000 | 18 | 0-30 Days | 30% | Jun 5, 2024 | May 19, 2024 | On Track

      let finalName = '';
      let finalAccount = '';
      let finalStage = '';
      let finalOwner = '';
      let finalAmount = amount;
      let finalAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
      let finalProbability = 0;
      let finalClose = '';
      let finalActivity = '';

      const seedIdx = startIndex + i;
      
      if (bucketLabel === '> 180 Days' && i === 0) {
        finalName = 'Enterprise CRM Implementation';
        finalAccount = 'TechNova Solutions';
        finalStage = 'Proposal/Quote';
        finalOwner = 'Ajay Kumar';
        finalAmount = 2850000;
        finalAge = 196;
        finalProbability = 60;
        finalClose = 'Mar 10, 2024';
        finalActivity = 'May 18, 2024';
        currentSum = currentSum - amount + 2850000;
      } else if (bucketLabel === '91 - 180 Days' && i === 0) {
        finalName = 'Cloud Migration Services';
        finalAccount = 'BrightWay Enterprises';
        finalStage = 'Negotiation';
        finalOwner = 'Priya Sharma';
        finalAmount = 2140000;
        finalAge = 142;
        finalProbability = 70;
        finalClose = 'Apr 05, 2024';
        finalActivity = 'May 17, 2024';
        currentSum = currentSum - amount + 2140000;
      } else if (bucketLabel === '61 - 90 Days' && i === 0) {
        finalName = 'IT Support Contract';
        finalAccount = 'NexaTech Pvt. Ltd.';
        finalStage = 'Needs Analysis';
        finalOwner = 'Rahul Verma';
        finalAmount = 1870000;
        finalAge = 78;
        finalProbability = 50;
        finalClose = 'Jun 15, 2024';
        finalActivity = 'May 16, 2024';
        currentSum = currentSum - amount + 1870000;
      } else if (bucketLabel === '31 - 60 Days' && i === 0) {
        finalName = 'Marketing Automation';
        finalAccount = 'NextGen Retail';
        finalStage = 'Qualification';
        finalOwner = 'Neha Singh';
        finalAmount = 1560000;
        finalAge = 35;
        finalProbability = 40;
        finalClose = 'Jun 28, 2024';
        finalActivity = 'May 20, 2024';
        currentSum = currentSum - amount + 1560000;
      } else if (bucketLabel === '0 - 30 Days' && i === 0) {
        finalName = 'Website Redesign Project';
        finalAccount = 'InnovaSoft Systems';
        finalStage = 'Qualification';
        finalOwner = 'Vikram Patel';
        finalAmount = 980000;
        finalAge = 18;
        finalProbability = 30;
        finalClose = 'Jun 05, 2024';
        finalActivity = 'May 19, 2024';
        currentSum = currentSum - amount + 980000;
      } else {
        finalAccount = accounts[seedIdx % accounts.length];
        const proj = projects[seedIdx % projects.length];
        finalName = `${finalAccount} - ${proj}`;
        finalStage = stages[seedIdx % stages.length];
        finalOwner = owners[seedIdx % owners.length];
        
        finalProbability = finalStage === 'Qualification' ? 30 
                         : finalStage === 'Needs Analysis' ? 50 
                         : finalStage === 'Proposal/Quote' ? 60 
                         : 70;

        const closeDate = new Date();
        closeDate.setDate(closeDate.getDate() + (10 + Math.floor(Math.random() * 80)));
        finalClose = closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const lastActivity = new Date();
        lastActivity.setDate(lastActivity.getDate() - Math.floor(Math.random() * Math.min(finalAge, 20)));
        finalActivity = lastActivity.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      list.push({
        id: `opp-${bucketLabel.replace(/\s+/g, '-')}-${i}`,
        name: finalName,
        accountName: finalAccount,
        stage: finalStage,
        owner: finalOwner,
        amount: finalAmount,
        ageDays: finalAge,
        agingBucket: bucketLabel,
        probability: finalProbability,
        expectedCloseDate: finalClose,
        lastActivityDate: finalActivity,
        status
      });
    }
  };

  // Generate exact distributions matching the dashboard metrics
  generateBucket(54, 11230000, 1, 30, 'On Track', '0 - 30 Days', 0);
  generateBucket(38, 8540000, 31, 60, 'On Track', '31 - 60 Days', 54);
  generateBucket(27, 5470000, 61, 90, 'Monitor', '61 - 90 Days', 92);
  generateBucket(24, 4360000, 91, 180, 'At Risk', '91 - 180 Days', 119);
  generateBucket(13, 2850000, 181, 365, 'At Risk', '> 180 Days', 143);

  return list;
};

export const useOpportunityAgingStore = create<OpportunityAgingStore>((set) => ({
  opportunities: generateMockOpportunities(),
  searchQuery: '',
  selectedOwner: 'All',
  selectedStage: 'All',
  showOnlyAtRisk: false,
  currentPage: 1,
  pageSize: 5,

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedOwner: (owner) => set({ selectedOwner: owner, currentPage: 1 }),
  setSelectedStage: (stage) => set({ selectedStage: stage, currentPage: 1 }),
  setShowOnlyAtRisk: (val) => set({ showOnlyAtRisk: val, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
}));
