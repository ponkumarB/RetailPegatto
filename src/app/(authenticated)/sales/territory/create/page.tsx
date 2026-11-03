'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTerritoryStore, Territory } from '@/store/useTerritoryStore';
import { fetchTerritoryFullList } from '@/service/api/Territory/api';
import { fetchUserDropdownList } from '@/service/api/Invoice/api';
import { GetCountries, GetState, GetCity } from 'react-country-state-city';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Map,
  ChevronDown,
  Info,
  Check,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Custom Toggle Switch Component since standard shadcn switch might not be present or custom styled
function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-hidden ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
      />
    </button>
  );
}

import { usePermission } from '@/hooks/usePermission';

function TerritoryCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCode = searchParams.get('edit');
  const { territories, addTerritory, updateTerritory, loadTerritories, isLoading } = useTerritoryStore();

  const isEditMode = !!editCode;
  const { canCreateTerritory, canEditTerritory, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded) {
      if (isEditMode && !canEditTerritory) {
        toast.error('You do not have permission to edit Territories.');
        router.push('/sales/territory');
      } else if (!isEditMode && !canCreateTerritory) {
        toast.error('You do not have permission to create Territories.');
        router.push('/sales/territory');
      }
    }
  }, [isLoaded, isEditMode, canCreateTerritory, canEditTerritory, router]);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Geographical');
  const [parentTerritory, setParentTerritory] = useState('None');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // New fields for Manager and Territory Type
  const [territoryType, setTerritoryType] = useState('Child'); // 'Parent' | 'Child'
  const [managerId, setManagerId] = useState<number | null>(null);
  const [managerName, setManagerName] = useState<string>('');
  const [userList, setUserList] = useState<any[]>([]);

  // Criteria states
  const [pinCodes, setPinCodes] = useState('');
  const [cities, setCities] = useState('');
  const [industrySegment, setIndustrySegment] = useState('All');
  const [revenueRange, setRevenueRange] = useState('All');
  const [productLine, setProductLine] = useState('All');
  const [customerType, setCustomerType] = useState('All');

  // Accordion toggle
  const [showAdditional, setShowAdditional] = useState(false);

  // Dynamic collections from react-country-state-city
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // 1. Fetch countries list on mount
  useEffect(() => {
    async function initCountries() {
      try {
        const list = await GetCountries();
        setCountriesList(list || []);
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    }
    initCountries();
  }, []);

  // 2. Cascade load states when country changes or is initialized in edit mode
  useEffect(() => {
    if (!countriesList.length) return;

    // Find the country ID by name
    const foundCountry = countriesList.find(c => c.name.toLowerCase() === country.toLowerCase());
    if (foundCountry) {
      if (foundCountry.id !== selectedCountryId) {
        setSelectedCountryId(foundCountry.id);
        GetState(foundCountry.id).then(states => {
          setAvailableStates(states || []);
        }).catch(err => console.error(err));
      }
    } else {
      setSelectedCountryId(null);
      setAvailableStates([]);
    }
  }, [country, countriesList, selectedCountryId]);

  // 3. Cascade load cities when state changes or is initialized in edit mode
  useEffect(() => {
    if (selectedCountryId === null || !availableStates.length) {
      setAvailableCities([]);
      return;
    }

    const foundState = availableStates.find(s => s.name.toLowerCase() === state.toLowerCase());
    if (foundState) {
      if (foundState.id !== selectedStateId) {
        setSelectedStateId(foundState.id);
        GetCity(selectedCountryId, foundState.id).then(cities => {
          setAvailableCities(cities || []);
        }).catch(err => console.error(err));
      }
    } else {
      setSelectedStateId(null);
      setAvailableCities([]);
    }
  }, [state, availableStates, selectedCountryId, selectedStateId]);

  // Searchable Select Options Memos
  const countryOptions = useMemo(() => {
    return countriesList.map((c) => ({ value: c.name, label: c.name }));
  }, [countriesList]);

  const stateOptions = useMemo(() => {
    return [
      { value: 'None', label: 'None' },
      ...availableStates.map((s) => ({ value: s.name, label: s.name }))
    ];
  }, [availableStates]);

  const cityOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Cities' },
      ...availableCities.map((c) => ({ value: c.name, label: c.name }))
    ];
  }, [availableCities]);

  const parentOptions = useMemo(() => {
    const list = territories
      .filter((t) => !isEditMode || t.code !== editCode)
      .map((t) => ({ value: t.name, label: t.name }));
    return [
      { value: 'None', label: 'None' },
      ...list
    ];
  }, [territories, isEditMode, editCode]);

  const managerOptions = useMemo(() => {
    return userList.map((u) => {
      const name = u.username || u.Name || `User ${u.id}`;
      return { value: String(u.id), label: name };
    });
  }, [userList]);

  // Fetch territories and users once on mount
  useEffect(() => {
    loadTerritories();
    fetchUserDropdownList().then((data) => {
      if (Array.isArray(data)) {
        setUserList(data);
      }
    }).catch((err) => console.error('Failed to load user list:', err));
  }, [loadTerritories]);

  useEffect(() => {
    if (isEditMode && editCode && territories.length > 0) {
      const existing = territories.find((t) => t.code === editCode);
      if (existing) {
        setCode(existing.code);
        setName(existing.name);
        setType(existing.type);
        setParentTerritory(existing.parentTerritory || 'None');
        setDescription(existing.description || '');
        setRegion(existing.region || '');
        setCountry(existing.country || '');
        setState(existing.state || '');
        setTimezone(existing.timezone || '');
        setIsActive(existing.isActive);
        setPinCodes(existing.pinCodes || '');
        setCities(existing.cities || '');
        setIndustrySegment(existing.industrySegment || 'All');
        setRevenueRange(existing.revenueRange || 'All');
        setProductLine(existing.productLine || 'All');
        setCustomerType(existing.customerType || 'All');
        setTerritoryType(existing.territoryType || 'Child');
        setManagerId(existing.managerId || null);
        setManagerName(existing.managerName || '');
      } else {
        toast.error(`Territory with code ${editCode} not found.`);
        router.push('/sales/territory');
      }
    }
  }, [isEditMode, editCode, territories, router]);

  const handleSubmit = async (e: React.FormEvent, createAnother = false) => {
    e.preventDefault();

    if (isEditMode && !code.trim()) {
      toast.error('Territory Code is required.');
      return;
    }
    if (!name.trim()) {
      toast.error('Territory Name is required.');
      return;
    }
    if (!territoryType) {
      toast.error('Territory Type (Hierarchy) is required.');
      return;
    }
    if (!managerId) {
      toast.error('Territory Manager is required.');
      return;
    }
    if (!country.trim()) {
      toast.error('Country is required.');
      return;
    }

    const payload: Omit<Territory, 'code'> & { code?: string } = {
      code: isEditMode ? code.trim() : undefined,
      name: name.trim(),
      type,
      parentTerritory: parentTerritory === 'None' ? '' : parentTerritory,
      region,
      country,
      state: state === 'None' ? '' : state,
      timezone,
      isActive,
      description: description.trim(),
      pinCodes: pinCodes.trim(),
      cities: cities.trim(),
      industrySegment,
      revenueRange,
      productLine,
      customerType,
      createdBy: isEditMode ? (territories.find(t => t.code === editCode)?.createdBy || 'System Admin') : 'System Admin',
      createdOn: isEditMode ? (territories.find(t => t.code === editCode)?.createdOn || new Date().toLocaleString()) : new Date().toLocaleString(),
      territoryType,
      managerName: managerName,
      managerId: managerId || undefined
    };

    try {
      if (isEditMode) {
        await updateTerritory(editCode!, payload);
        toast.success('Territory updated successfully.');
        router.push('/sales/territory');
      } else {
        await addTerritory(payload);
        toast.success('Territory created successfully.');
        if (createAnother) {
          // Reset form
          setCode('');
          setName('');
          setDescription('');
          setPinCodes('');
          setCities('');
          toast.info('Form cleared. Ready for next entry.');
        } else {
          router.push('/sales/territory');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save territory.');
    }
  };

  if (isLoaded && ((isEditMode && !canEditTerritory) || (!isEditMode && !canCreateTerritory))) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <Link href="/sales/territory" className="hover:text-blue-600 transition-colors">Territories</Link>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">{isEditMode ? 'Edit Territory' : 'Create Territory'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Territory' : 'Create Territory'}
              </h1>
              <p className="text-xs text-slate-450 mt-0.5">Define and configure geographic bounds and criteria segments.</p>
            </div>
          </div>
        </div>

        {/* Buttons at Top */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/sales/territory')}
            className="h-9 rounded-[5px] text-xs font-semibold border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
          >
            Cancel
          </Button>

          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleSubmit(e, true)}
              className="h-9 rounded-[5px] text-xs font-semibold border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
            >
              Save & Create Another
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={(e) => handleSubmit(e, false)}
            className="h-9 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
          >
            Save
          </Button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Territory Information */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-5">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-blue-600 rounded-full" />
                  Territory Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                {/* Code */}
                {/* Code (Only visible in edit mode) */}
                {isEditMode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Territory Code (Read-Only)
                    </Label>
                    <Input
                      id="code"
                      disabled
                      value={code}
                      placeholder="e.g. TN-S-001"
                      className="h-9 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tamil Nadu - South"
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>

                {/* Territory Type (Hierarchy) */}
                <div className="space-y-1.5">
                  <Label htmlFor="territoryType" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Type (Hierarchy) <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={territoryType} onValueChange={(val) => {
                    setTerritoryType(val || 'Child');
                  }}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select hierarchy type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Territory Manager */}
                <div className="space-y-1.5">
                  <Label htmlFor="manager" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Manager <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableSelect
                    id="manager"
                    options={managerOptions}
                    value={managerId ? String(managerId) : ''}
                    placeholder="Select Manager"
                    onChange={(val) => {
                      const idNum = Number(val);
                      setManagerId(idNum);
                      const userObj = userList.find((u) => u.id === idNum);
                      if (userObj) {
                        setManagerName(userObj.username || userObj.Name || `User ${idNum}`);
                      } else {
                        setManagerName('');
                      }
                    }}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <Label htmlFor="region" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Region
                  </Label>
                  <Select value={region} onValueChange={(val) => setRegion(val || 'South India')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                      <SelectItem value="South India">South India</SelectItem>
                      <SelectItem value="North India">North India</SelectItem>
                      <SelectItem value="West Coast">West Coast</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                {/* Country */}
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Country <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableSelect
                    id="country"
                    options={countryOptions}
                    value={country}
                    placeholder="Select Country"
                    onChange={(val) => {
                      setCountry(val || 'India');
                      setState('None');
                      setCities('All');
                    }}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={type} onValueChange={(val) => setType(val || 'Geographical')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="Geographical">Geographical</SelectItem>
                      <SelectItem value="Product Segment">Product Segment</SelectItem>
                      <SelectItem value="Industry Segment">Industry Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="state" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      State
                    </Label>
                    {state !== 'None' && (
                      <button
                        type="button"
                        onClick={() => {
                          setState('None');
                          setCities('All');
                        }}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    id="state"
                    options={stateOptions}
                    value={state}
                    placeholder="Select State"
                    onChange={(val) => {
                      setState(val || 'None');
                      setCities('All');
                    }}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                  />
                </div>

                {/* Parent */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="parent" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Parent Territory
                    </Label>
                    <span title="The hierarchy tree node that encapsulates this sub-territory.">
                      <HelpCircle className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    </span>
                  </div>
                  <SearchableSelect
                    id="parent"
                    options={parentOptions}
                    value={parentTerritory}
                    placeholder="Select Parent Territory"
                    onChange={(val) => setParentTerritory(val || 'None')}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                  />
                  {parentTerritory && parentTerritory !== 'None' && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Parent Timezone: {
                        territories.find(t => t.name === parentTerritory)?.timezone || 'N/A'
                      }
                    </p>
                  )}
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Time Zone
                  </Label>
                  <Select value={timezone} onValueChange={(val) => setTimezone(val || '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                      <SelectItem value="(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                      <SelectItem value="(UTC-08:00) Pacific Time (US & Canada)">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="(UTC+04:00) Gulf Standard Time (Dubai)">(UTC+04:00) Gulf Standard Time (Dubai)</SelectItem>
                      <SelectItem value="(UTC+08:00) Singapore Standard Time">(UTC+08:00) Singapore Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="description" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter details about this territory's coverage boundaries..."
                    className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between md:col-span-2 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Status</p>
                    <p className="text-[10px] text-slate-450 font-normal">Controls if assignments and rules are active for this territory.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Switch checked={isActive} onChange={setIsActive} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Territory Criteria */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-5">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-blue-600 rounded-full" />
                  Territory Criteria <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-semibold">
                {/* Pin Codes */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="pincodes" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Pin Codes
                  </Label>
                  <Input
                    id="pincodes"
                    value={pinCodes}
                    onChange={(e) => setPinCodes(e.target.value)}
                    placeholder="e.g. 625001, 627001"
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                  <span className="text-[9px] text-slate-400 font-normal mt-0.5">Example: 625001, 627001, 628001</span>
                </div>

                {/* Cities */}
                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cities" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Cities
                    </Label>
                    {cities && cities !== 'All' && (
                      <button
                        type="button"
                        onClick={() => setCities('All')}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    id="cities"
                    options={cityOptions}
                    value={cities || 'All'}
                    placeholder="Select City"
                    onChange={(val) => setCities(val || 'All')}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                  />
                  <span className="text-[9px] text-slate-400 font-normal mt-0.5">Example: Madurai, Tirunelveli, Thoothukudi</span>
                </div>

                {/* Industry Segment */}
                <div className="space-y-1.5">
                  <Label htmlFor="industry" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Industry Segment
                  </Label>
                  <Select value={industrySegment} onValueChange={(val) => setIndustrySegment(val || 'All')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Revenue Range */}
                <div className="space-y-1.5">
                  <Label htmlFor="revenue" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Revenue Range (Annual)
                  </Label>
                  <Select value={revenueRange} onValueChange={(val) => setRevenueRange(val || 'All')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select revenue" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="$0 - $100K">$0 - $100K</SelectItem>
                      <SelectItem value="$100K - $1M">$100K - $1M</SelectItem>
                      <SelectItem value="$1M+">$1M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Line */}
                <div className="space-y-1.5">
                  <Label htmlFor="product" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Product Line
                  </Label>
                  <Select value={productLine} onValueChange={(val) => setProductLine(val || 'All')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="customer" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Customer Type
                  </Label>
                  <Select value={customerType} onValueChange={(val) => setCustomerType(val || 'All')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="SMB">SMB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Summary Panel */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 sticky top-6 shadow-xs">
            <CardContent className="p-6 space-y-5 text-xs font-semibold">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-slate-800 dark:bg-slate-100 rounded-full" />
                  Summary
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Category</span>
                  <span className="text-slate-800 dark:text-slate-200">{type || '—'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Hierarchy Type</span>
                  <span className="text-slate-800 dark:text-slate-200">{territoryType || '—'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Manager</span>
                  <span className="text-slate-800 dark:text-slate-200">{managerName || '—'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Parent Territory</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {parentTerritory === 'None' ? '—' : parentTerritory}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Region / Country</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {region && country ? `${region} / ${country}` : '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">State</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {state === 'None' || !state ? '—' : state}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Status</span>
                  <Badge variant="outline" className={isActive
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 font-bold'
                    : 'text-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-slate-400 border-slate-200'
                  }>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Created By</span>
                  <span className="text-slate-700 dark:text-slate-350">
                    {isEditMode ? (territories.find(t => t.code === editCode)?.createdBy || 'System Admin') : 'System Admin'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Created On</span>
                  <span className="text-slate-650 dark:text-slate-400">
                    {isEditMode ? (territories.find(t => t.code === editCode)?.createdOn || '—') : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function CreateTerritoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <span>Loading Form...</span>
      </div>
    }>
      <TerritoryCreateForm />
    </Suspense>
  );
}
