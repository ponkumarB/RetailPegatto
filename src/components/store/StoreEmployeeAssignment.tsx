import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFromApi } from '@/service/apiClient';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Store, Search, Users, Trash2, X, PlusCircle, UserPlus, ClipboardList, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const getEmployeeId = (emp: any) => {
  const id = emp.id || emp.UserId || emp.user_id || emp.employee_id || emp.Employee_Id || emp.pk || emp.employeeId || emp.EmployeeId;
  console.log('Getting employee ID for:', emp, '=>', id);
  return id;
};

export default function StoreEmployeeAssignment() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({});
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<any>(null);

  // 1. Fetch Stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => fetchFromApi('/user/StoreMasterAdditional/?Is_Deleted=False&page_size=100'),
  });
  
  // 2. Fetch All Employees (Users)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      // Try useradmin UsersList first (from old project)
      try {
        return await fetchFromApi('/useradmin/UsersList/?page_size=1000');
      } catch (e) {
        // Fallbacks
        try {
          return await fetchFromApi('/auth/users/?page_size=1000');
        } catch (error) {
          try {
            return await fetchFromApi('/user/users/?page_size=1000');
          } catch (error2) {
            return await fetchFromApi('/user/EmployeeMasterList/?page_size=1000');
          }
        }
      }
    },
  });

  // 3. Fetch Assigned Employees for Selected Store
  const { data: assignedData, isLoading: assignedLoading, refetch: refetchAssigned } = useQuery({
    queryKey: ['store-employees', selectedStore?.id || selectedStore?.Store_Id, selectedStore?.Store_Name],
    queryFn: async () => {
      const storeId = selectedStore?.id || selectedStore?.Store_Id;
      console.log('Fetching assigned employees for store:', selectedStore?.Store_Name, 'ID:', storeId);
      // Use the correct endpoint from OLD RETAIL PROJECT
      try {
        const response = await fetchFromApi(`/user/RetailStoreEmployee/?Store_Id=${storeId}`);
        console.log('RetailStoreEmployee endpoint response:', response);
        return response;
      } catch (error) {
        console.log('RetailStoreEmployee endpoint failed, trying filter endpoint');
        // Fallback to filter endpoint
        const response = await fetchFromApi(`/user/StoreemployeeFilter/?Store_Id=${storeId}`);
        console.log('Filter endpoint response:', response);
        return response;
      }
    },
    enabled: !!selectedStore,
  });

  const stores = useMemo(() => Array.isArray(storesData) ? storesData : storesData?.results || storesData?.data || [], [storesData]);
  const allEmployees = useMemo(() => {
    let employees: any[] = [];
    if (Array.isArray(usersData)) employees = usersData;
    else if (Array.isArray(usersData?.results)) employees = usersData.results;
    else if (Array.isArray(usersData?.data)) employees = usersData.data;
    else if (Array.isArray(usersData?.data?.results)) employees = usersData.data.results;
    else if (Array.isArray(usersData?.Data)) employees = usersData.Data;
    else if (usersData?.results) employees = usersData.results;
    else if (usersData?.data) employees = usersData.data;

    console.log('=== ALL EMPLOYEES DEBUG ===');
    console.log('Raw usersData:', usersData);
    console.log('Processed employees:', employees);
    console.log('Total employees count:', employees.length);
    employees.forEach((emp, idx) => {
      console.log(`Employee ${idx}:`, {
        id: emp.id,
        UserId: emp.UserId,
        user_id: emp.user_id,
        Employee_Id: emp.Employee_Id,
        pk: emp.pk,
        name: emp.first_name || emp.username || emp.name
      });
    });
    return employees;
  }, [usersData]);
  const assignedRecords = useMemo(() => {
    const records = Array.isArray(assignedData) ? assignedData : assignedData?.results || assignedData?.data || [];
    console.log('=== ASSIGNED RECORDS DEBUG ===');
    console.log('Selected store:', selectedStore?.Store_Name, 'ID:', selectedStore?.id || selectedStore?.Store_Id);
    console.log('Raw assignedData:', assignedData);
    console.log('Processed assigned records:', records);
    console.log('Total assigned records count:', records.length);
    records.forEach((record, idx) => {
      console.log(`Record ${idx}:`, {
        id: record.id,
        Store_Id: record.Store_Id,
        store_id: record.store_id,
        Employee_Id: record.Employee_Id,
        employee_id: record.employee_id
      });
    });
    return records;
  }, [assignedData, selectedStore?.Store_Name, selectedStore?.id, selectedStore?.Store_Id]);

  const currentAssignmentObj = assignedRecords[0] || {};
  const hasExistingAssignment = !!currentAssignmentObj.id;
  const currentlyAssignedEmployees = currentAssignmentObj.Employee_Id || [];
  
  console.log('=== CURRENT ASSIGNMENT DEBUG ===');
  console.log('Current assignment object:', currentAssignmentObj);
  console.log('Currently assigned employees:', currentlyAssignedEmployees);
  
  // Handle both cases: Employee_Id can be array of objects or array of IDs
  const assignedIds = currentlyAssignedEmployees.map((e: any) => {
    // If it's an object with id property, use it
    if (typeof e === 'object' && e !== null && e.id) {
      return e.id;
    }
    // If it's already an ID (number/string), use it directly
    return e;
  }).filter(id => id !== null && id !== undefined);
  
  console.log('Extracted assigned IDs:', assignedIds);
  
  // Additional filter: ensure the assignment actually belongs to the selected store
  const filteredAssignedRecords = assignedRecords.filter((record: any) => {
    const recordStoreId = record.Store_Id || record.store_id;
    const selectedStoreId = selectedStore?.id || selectedStore?.Store_Id;
    const matches = recordStoreId === selectedStoreId;
    console.log(`Record store ID: ${recordStoreId} vs Selected: ${selectedStoreId} -> ${matches}`);
    return matches;
  });
  
  console.log('Filtered assigned records:', filteredAssignedRecords);
  
  // Use the filtered assignment if available
  const finalAssignmentObj = filteredAssignedRecords.length > 0 ? filteredAssignedRecords[0] : currentAssignmentObj;
  const finalAssignedEmployees = finalAssignmentObj.Employee_Id || [];
  const finalAssignedIds = finalAssignedEmployees.map((e: any) => {
    if (typeof e === 'object' && e !== null && e.id) {
      return e.id;
    }
    return e;
  }).filter(id => id !== null && id !== undefined);
  
  console.log('=== FINAL ASSIGNMENT DEBUG ===');
  console.log('Final assignment object:', finalAssignmentObj);
  console.log('Final assigned employees:', finalAssignedEmployees);
  console.log('Final assigned IDs:', finalAssignedIds);

  const filteredStores = stores.filter((s: any) => 
    (s.Store_Name || '').toLowerCase().includes(storeSearch.toLowerCase()) ||
    (s.Store_Id || s.id || '').toString().toLowerCase().includes(storeSearch.toLowerCase())
  );

  const unassignedEmployees = allEmployees.filter((emp: any) => {
    const empId = getEmployeeId(emp);
    // Convert both to string for comparison to handle type mismatches
    const isAssigned = finalAssignedIds.some(id => String(id) === String(empId));
    console.log(`Checking employee ${emp.first_name || emp.username}: ID=${empId}, Assigned=${isAssigned}`);
    return empId && !isAssigned;
  });
  const filteredUnassigned = unassignedEmployees.filter((emp: any) => 
    (emp.first_name || emp.username || emp.name || '').toLowerCase().includes(employeeSearch.toLowerCase())
  );
  
  console.log('=== UNASSIGNED EMPLOYEES DEBUG ===');
  console.log('Total employees:', allEmployees.length);
  console.log('Assigned IDs:', finalAssignedIds);
  console.log('Unassigned employees count:', unassignedEmployees.length);
  console.log('Filtered unassigned count:', filteredUnassigned.length);
  console.log('Unassigned employees:', unassignedEmployees);
  
  // TEMPORARY: Show all employees for debugging
  const debugAllEmployees = allEmployees.map((emp: any) => ({
    name: emp.first_name || emp.username || emp.name,
    id: getEmployeeId(emp),
    isAssigned: finalAssignedIds.some(id => String(id) === String(getEmployeeId(emp)))
  }));
  console.log('=== ALL EMPLOYEES WITH ASSIGNMENT STATUS ===');
  console.table(debugAllEmployees);

  // Mutations
  const createAssignment = useMutation({
    mutationFn: (payload: any) => fetchFromApi('/user/StoreemployeeCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      toast.success('Employees assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['store-employees', selectedStore?.id] });
      setShowAssignPanel(false);
      setSelectedEmployees({});
    },
    onError: (err: any) => toast.error(err.message || 'Failed to assign employees')
  });

  const updateAssignment = useMutation({
    mutationFn: (payload: any) => fetchFromApi(`/user/StoreemployeeCRUD/?id=${payload.id}`, {
      method: 'PUT', // or PATCH
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      toast.success('Store assignments updated successfully');
      queryClient.invalidateQueries({ queryKey: ['store-employees', selectedStore?.id] });
      setShowAssignPanel(false);
      setSelectedEmployees({});
      setIsDeleteOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update assignments')
  });

  const handleStoreSelect = (store: any) => {
    console.log('Store selected:', store);
    setSelectedStore(store);
    setSelectedEmployees({});
    setShowAssignPanel(false);
    setEmployeeSearch('');
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => ({ ...prev, [id]: !prev[id] }));
  };



  const handleSaveAssignments = () => {
    if (!selectedStore) return;
    
    const newEmployeeIds = Object.keys(selectedEmployees).filter(k => selectedEmployees[k]).map(Number);
    
    if (newEmployeeIds.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    // Get current assigned IDs (handle both object and ID formats)
    const currentIds = finalAssignedIds.map((id: any) => typeof id === 'object' ? id.id : id);
    const mergedIds = [...new Set([...currentIds, ...newEmployeeIds])]; // Remove duplicates

    if (finalAssignmentObj.id) {
      updateAssignment.mutate({
        id: finalAssignmentObj.id,
        Store_Id: selectedStore.id || selectedStore.Store_Id,
        Employee_Id: mergedIds
      });
    } else {
      createAssignment.mutate({
        Store_Id: selectedStore.id || selectedStore.Store_Id,
        Employee_Id: mergedIds,
        Active_Status: true
      });
    }
  };

  const confirmRemove = () => {
    if (!assignmentToRemove || !selectedStore || !finalAssignmentObj.id) return;
    
    const empIdToRemove = typeof assignmentToRemove === 'object' ? assignmentToRemove.id : assignmentToRemove;
    const newIds = finalAssignedIds.filter((id: any) => String(id) !== String(empIdToRemove));
    
    updateAssignment.mutate({
      id: finalAssignmentObj.id,
      Store_Id: selectedStore.id || selectedStore.Store_Id,
      Employee_Id: newIds
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('manager')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (r.includes('head')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
    if (r.includes('cashier')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <Card className="bg-white dark:bg-slate-900 shadow-xs border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Store Employee Management</h2>
              <p className="text-xs text-slate-500 font-medium">Assign employees to stores and manage their roles efficiently</p>
            </div>
          </div>
          <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Access
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Pane - Stores */}
        <Card className="md:col-span-4 lg:col-span-4 shadow-xs border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-sm">
              <Store className="h-4 w-4" /> Select Store
            </h3>
          </div>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by store name..." 
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {storesLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-700" /></div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                <Store className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-xs">No stores found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStores.map((store: any) => (
                  <button
                    key={store.id || store.Store_Id}
                    onClick={() => handleStoreSelect(store)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 group",
                      selectedStore?.id === store.id 
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      selectedStore?.id === store.id ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30"
                    )}>
                      <Store className={cn("h-5 w-5", selectedStore?.id === store.id ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{store.Store_Name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {store.Store_Id || store.id}</p>
                    </div>
                    {selectedStore?.id === store.id && (
                      <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Right Pane - Employees */}
        <Card className="md:col-span-8 lg:col-span-8 shadow-xs border-slate-200 dark:border-slate-800 h-[calc(100vh-220px)] min-h-[500px] flex flex-col overflow-hidden">
          {!selectedStore ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Store className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-slate-500">No Store Selected</h3>
              <p className="text-xs text-slate-400 mt-1">Please select a store from the left panel to assign employees</p>
            </div>
          ) : (
            <>
              {/* Selected Store Header */}
              <div className="p-4 bg-emerald-700 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 opacity-80" />
                  <h3 className="font-bold text-base">{selectedStore.Store_Name}</h3>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-xs">
                  Store ID: {selectedStore.Store_Id || selectedStore.id}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="space-y-4 max-w-4xl mx-auto">
                  
                  {/* Current Assignments */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                      <ClipboardList className="h-4 w-4 text-emerald-600" />
                      Currently Assigned Employees ({finalAssignedEmployees.length})
                    </h4>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-bold">Employee</th>
                              <th className="px-4 py-3 font-bold">Employee ID</th>
                              <th className="px-4 py-3 font-bold">Role</th>
                              <th className="px-4 py-3 font-bold text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {assignedLoading ? (
                              <tr><td colSpan={4} className="text-center py-8"><div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" /></td></tr>
                            ) : currentlyAssignedEmployees.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-400">
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                  <p className="text-xs">No employees assigned yet</p>
                                </td>
                              </tr>
                            ) : (
                              finalAssignedEmployees.map((emp: any) => {
                                // Handle both object and ID cases
                                const empId = typeof emp === 'object' && emp !== null ? emp.id : emp;
                                const empData = typeof emp === 'object' && emp !== null ? emp : allEmployees.find((e: any) => e.id === emp);
                                
                                return (
                                  <tr key={empId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                          <Users className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                                        </div>
                                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                                          {empData?.first_name || empData?.username || empData?.name || 'Unknown'} {empData?.last_name || ''}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{empId || empData?.UserId || '-'}</td>
                                    <td className="px-4 py-2.5">
                                      <Badge variant="outline" className={cn("text-[10px] font-bold border-transparent", getRoleBadgeColor(empData?.Designation || 'Sales Executive'))}>
                                        {empData?.Designation || 'Sales Executive'}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                        onClick={() => { setAssignmentToRemove({ id: empId, ...empData }); setIsDeleteOpen(true); }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Assign New Employees Panel Toggle */}
                  <AnimatePresence mode="wait">
                    {!showAssignPanel ? (
                      <motion.div
                        key="btn"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 h-11 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-bold border-dashed"
                          onClick={() => setShowAssignPanel(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" /> Assign New Employees
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-200/20 dark:shadow-none"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-blue-500" /> Select Employees to Assign
                          </h4>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowAssignPanel(false)}>
                            <X className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                        
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            placeholder="Search by name..." 
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-950"
                          />
                        </div>

                        <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 mb-4">
                          {usersLoading ? (
                             <div className="text-center py-4"><div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" /></div>
                          ) : filteredUnassigned.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                              {employeeSearch ? 'No matching employees' : 'All employees are already assigned'}
                            </div>
                          ) : (
                            filteredUnassigned.map((emp: any) => {
                              const empId = getEmployeeId(emp);
                              if (!empId) return null;
                              
                              return (
                                <label
                                  key={empId}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                                    selectedEmployees[empId] ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800"
                                  )}
                                >
                                  <Checkbox 
                                    checked={!!selectedEmployees[empId]} 
                                    onCheckedChange={() => toggleEmployee(empId)}
                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                  />
                                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                      {emp.first_name || emp.username || emp.name || 'Unknown'} {emp.last_name || ''}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{emp.Designation || 'General Staff'} • ID: {empId}</p>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Button variant="ghost" onClick={() => setShowAssignPanel(false)} className="h-9 text-xs">Cancel</Button>
                          <Button 
                            onClick={handleSaveAssignments}
                            disabled={createAssignment.isPending || updateAssignment.isPending || !Object.values(selectedEmployees).some(Boolean)}
                            className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {(createAssignment.isPending || updateAssignment.isPending) ? 'Saving...' : 'Save Assignments'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Removal
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to remove <strong className="text-slate-700 dark:text-slate-300">{assignmentToRemove?.first_name || 'this employee'}</strong> from {selectedStore?.Store_Name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={updateAssignment.isPending} className="rounded-xl h-9 text-xs font-bold">
              {updateAssignment.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
