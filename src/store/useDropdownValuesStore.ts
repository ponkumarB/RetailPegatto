import { create } from 'zustand';

export interface DropdownValue {
  id: string;
  value: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface DropdownGroup {
  id: string;
  name: string;
  isSystem: boolean;
  values: DropdownValue[];
}

export interface DropdownCategory {
  id: string;
  name: string;
  iconName: string;
  groups: DropdownGroup[];
}

interface DropdownValuesStore {
  categories: DropdownCategory[];
  addDropdownGroup: (categoryId: string, name: string, isSystem: boolean, initialValues: string[]) => void;
  deleteDropdownGroup: (categoryId: string, groupId: string) => void;
  addValueToGroup: (categoryId: string, groupId: string, value: string) => void;
  updateValueInGroup: (categoryId: string, groupId: string, valueId: string, valueText: string, isActive: boolean) => void;
  deleteValueFromGroup: (categoryId: string, groupId: string, valueId: string) => void;
  setDefaultValue: (categoryId: string, groupId: string, valueId: string) => void;
  reorderValues: (categoryId: string, groupId: string, values: DropdownValue[]) => void;
}

const initialCategories: DropdownCategory[] = [
  {
    id: 'lead',
    name: 'Lead',
    iconName: 'Users',
    groups: [
      {
        id: 'lead-status',
        name: 'Lead Status',
        isSystem: true,
        values: [
          { id: 'val-1', value: 'New', isDefault: true, isActive: true },
          { id: 'val-2', value: 'Contacted', isDefault: false, isActive: true },
          { id: 'val-3', value: 'Qualified', isDefault: false, isActive: true },
          { id: 'val-4', value: 'Proposal Sent', isDefault: false, isActive: true },
          { id: 'val-5', value: 'Negotiation', isDefault: false, isActive: true },
          { id: 'val-6', value: 'Won', isDefault: false, isActive: true },
          { id: 'val-7', value: 'Lost', isDefault: false, isActive: true }
        ]
      },
      {
        id: 'lead-source',
        name: 'Lead Source',
        isSystem: true,
        values: [
          { id: 'val-10', value: 'Website', isDefault: true, isActive: true },
          { id: 'val-11', value: 'Referral', isDefault: false, isActive: true },
          { id: 'val-12', value: 'Cold Call', isDefault: false, isActive: true },
          { id: 'val-13', value: 'LinkedIn', isDefault: false, isActive: true },
          { id: 'val-14', value: 'Event', isDefault: false, isActive: true },
          { id: 'val-15', value: 'Partner', isDefault: false, isActive: true },
          { id: 'val-16', value: 'Other', isDefault: false, isActive: true }
        ]
      },
      {
        id: 'industry',
        name: 'Industry',
        isSystem: true,
        values: [
          { id: 'val-20', value: 'Technology', isDefault: true, isActive: true },
          { id: 'val-21', value: 'Finance', isDefault: false, isActive: true },
          { id: 'val-22', value: 'Healthcare', isDefault: false, isActive: true },
          { id: 'val-23', value: 'Retail', isDefault: false, isActive: true },
          { id: 'val-24', value: 'Manufacturing', isDefault: false, isActive: true },
          { id: 'val-25', value: 'Logistics', isDefault: false, isActive: true },
          { id: 'val-26', value: 'Education', isDefault: false, isActive: true },
          { id: 'val-27', value: 'Construction', isDefault: false, isActive: true },
          { id: 'val-28', value: 'Real Estate', isDefault: false, isActive: true },
          { id: 'val-29', value: 'Consulting', isDefault: false, isActive: true },
          { id: 'val-30', value: 'Hospitality', isDefault: false, isActive: true },
          { id: 'val-31', value: 'Other', isDefault: false, isActive: true }
        ]
      },
      {
        id: 'rating',
        name: 'Rating',
        isSystem: true,
        values: [
          { id: 'val-40', value: 'Hot', isDefault: true, isActive: true },
          { id: 'val-41', value: 'Warm', isDefault: false, isActive: true },
          { id: 'val-42', value: 'Cold', isDefault: false, isActive: true },
          { id: 'val-43', value: 'Unqualified', isDefault: false, isActive: true },
          { id: 'val-44', value: 'Spam', isDefault: false, isActive: true }
        ]
      },
      {
        id: 'lead-owner',
        name: 'Lead Owner',
        isSystem: true,
        values: [
          { id: 'val-50', value: 'Ajay Kumar', isDefault: true, isActive: true },
          { id: 'val-51', value: 'Priya Nair', isDefault: false, isActive: true },
          { id: 'val-52', value: 'Rahul Sharma', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'deal',
    name: 'Deal',
    iconName: 'DollarSign',
    groups: [
      {
        id: 'deal-stage',
        name: 'Deal Stage',
        isSystem: true,
        values: [
          { id: 'val-60', value: 'Qualification', isDefault: true, isActive: true },
          { id: 'val-61', value: 'Needs Analysis', isDefault: false, isActive: true },
          { id: 'val-62', value: 'Proposal Sent', isDefault: false, isActive: true },
          { id: 'val-63', value: 'Negotiation', isDefault: false, isActive: true },
          { id: 'val-64', value: 'Closed Won', isDefault: false, isActive: true },
          { id: 'val-65', value: 'Closed Lost', isDefault: false, isActive: true }
        ]
      },
      {
        id: 'deal-type',
        name: 'Deal Type',
        isSystem: false,
        values: [
          { id: 'val-70', value: 'New Business', isDefault: true, isActive: true },
          { id: 'val-71', value: 'Existing Customer Upgrade', isDefault: false, isActive: true },
          { id: 'val-72', value: 'Renewal', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'contact',
    name: 'Contact',
    iconName: 'User',
    groups: [
      {
        id: 'contact-type',
        name: 'Contact Type',
        isSystem: true,
        values: [
          { id: 'val-80', value: 'Primary Decision Maker', isDefault: true, isActive: true },
          { id: 'val-81', value: 'Billing Contact', isDefault: false, isActive: true },
          { id: 'val-82', value: 'Technical Lead', isDefault: false, isActive: true },
          { id: 'val-83', value: 'End User', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'task',
    name: 'Task',
    iconName: 'CheckSquare',
    groups: [
      {
        id: 'task-priority',
        name: 'Task Priority',
        isSystem: true,
        values: [
          { id: 'val-90', value: 'High', isDefault: false, isActive: true },
          { id: 'val-91', value: 'Medium', isDefault: true, isActive: true },
          { id: 'val-92', value: 'Low', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'ticket',
    name: 'Ticket',
    iconName: 'Ticket',
    groups: [
      {
        id: 'ticket-category',
        name: 'Ticket Category',
        isSystem: true,
        values: [
          { id: 'val-100', value: 'Software Bug', isDefault: true, isActive: true },
          { id: 'val-101', value: 'Hardware Issue', isDefault: false, isActive: true },
          { id: 'val-102', value: 'Billing Inquiry', isDefault: false, isActive: true },
          { id: 'val-103', value: 'Feature Request', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'project',
    name: 'Project',
    iconName: 'FolderKanban',
    groups: [
      {
        id: 'project-status',
        name: 'Project Status',
        isSystem: true,
        values: [
          { id: 'val-110', value: 'Not Started', isDefault: true, isActive: true },
          { id: 'val-111', value: 'In Progress', isDefault: false, isActive: true },
          { id: 'val-112', value: 'On Hold', isDefault: false, isActive: true },
          { id: 'val-113', value: 'Completed', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'invoice',
    name: 'Invoice',
    iconName: 'FileText',
    groups: [
      {
        id: 'invoice-status',
        name: 'Invoice Status',
        isSystem: true,
        values: [
          { id: 'val-120', value: 'Draft', isDefault: true, isActive: true },
          { id: 'val-121', value: 'Sent', isDefault: false, isActive: true },
          { id: 'val-122', value: 'Paid', isDefault: false, isActive: true },
          { id: 'val-123', value: 'Overdue', isDefault: false, isActive: true },
          { id: 'val-124', value: 'Voided', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'payment',
    name: 'Payment',
    iconName: 'CreditCard',
    groups: [
      {
        id: 'payment-method',
        name: 'Payment Method',
        isSystem: true,
        values: [
          { id: 'val-130', value: 'Credit Card', isDefault: true, isActive: true },
          { id: 'val-131', value: 'Bank Transfer (ACH)', isDefault: false, isActive: true },
          { id: 'val-132', value: 'PayPal', isDefault: false, isActive: true },
          { id: 'val-133', value: 'Check', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'campaign',
    name: 'Campaign',
    iconName: 'Megaphone',
    groups: [
      {
        id: 'campaign-channel',
        name: 'Campaign Channel',
        isSystem: true,
        values: [
          { id: 'val-140', value: 'Email', isDefault: true, isActive: true },
          { id: 'val-141', value: 'Social Media', isDefault: false, isActive: true },
          { id: 'val-142', value: 'Webinar', isDefault: false, isActive: true },
          { id: 'val-143', value: 'Direct Mail', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'product',
    name: 'Product',
    iconName: 'Box',
    groups: [
      {
        id: 'product-category',
        name: 'Product Category',
        isSystem: true,
        values: [
          { id: 'val-150', value: 'SaaS Subscriptions', isDefault: true, isActive: true },
          { id: 'val-151', value: 'Consulting Services', isDefault: false, isActive: true },
          { id: 'val-152', value: 'Hardware Devices', isDefault: false, isActive: true }
        ]
      }
    ]
  },
  {
    id: 'general',
    name: 'General',
    iconName: 'Settings',
    groups: [
      {
        id: 'country-list',
        name: 'Country List',
        isSystem: true,
        values: [
          { id: 'val-160', value: 'India', isDefault: true, isActive: true },
          { id: 'val-161', value: 'United States', isDefault: false, isActive: true },
          { id: 'val-162', value: 'Germany', isDefault: false, isActive: true },
          { id: 'val-163', value: 'United Kingdom', isDefault: false, isActive: true }
        ]
      }
    ]
  }
];

export const useDropdownValuesStore = create<DropdownValuesStore>((set) => ({
  categories: initialCategories,

  addDropdownGroup: (categoryId, name, isSystem, initialValues) => set((state) => {
    const nextGroupId = `${categoryId}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const newGroup: DropdownGroup = {
      id: nextGroupId,
      name,
      isSystem,
      values: initialValues.map((val, idx) => ({
        id: `val-dyn-${Math.floor(Math.random() * 10000)}`,
        value: val,
        isDefault: idx === 0,
        isActive: true
      }))
    };

    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: [...cat.groups, newGroup]
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  deleteDropdownGroup: (categoryId, groupId) => set((state) => {
    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.filter((g) => g.id !== groupId)
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  addValueToGroup: (categoryId, groupId, value) => set((state) => {
    const newValue: DropdownValue = {
      id: `val-dyn-${Math.floor(Math.random() * 10000)}`,
      value,
      isDefault: false,
      isActive: true
    };

    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.id === groupId) {
              const shouldBeDefault = group.values.length === 0;
              return {
                ...group,
                values: [...group.values, { ...newValue, isDefault: shouldBeDefault }]
              };
            }
            return group;
          })
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  updateValueInGroup: (categoryId, groupId, valueId, valueText, isActive) => set((state) => {
    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                values: group.values.map((v) => {
                  if (v.id === valueId) {
                    return { ...v, value: valueText, isActive };
                  }
                  return v;
                })
              };
            }
            return group;
          })
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  deleteValueFromGroup: (categoryId, groupId, valueId) => set((state) => {
    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.id === groupId) {
              const target = group.values.find((v) => v.id === valueId);
              const filtered = group.values.filter((v) => v.id !== valueId);
              
              // If deleted was default, make the first remaining default
              if (target?.isDefault && filtered.length > 0) {
                filtered[0].isDefault = true;
              }

              return {
                ...group,
                values: filtered
              };
            }
            return group;
          })
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  setDefaultValue: (categoryId, groupId, valueId) => set((state) => {
    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                values: group.values.map((v) => ({
                  ...v,
                  isDefault: v.id === valueId
                }))
              };
            }
            return group;
          })
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  }),

  reorderValues: (categoryId, groupId, values) => set((state) => {
    const updatedCategories = state.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                values
              };
            }
            return group;
          })
        };
      }
      return cat;
    });

    return { categories: updatedCategories };
  })
}));
