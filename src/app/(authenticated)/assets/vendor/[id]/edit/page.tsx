'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import * as api from '@/service/api/Assets/api';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  Save, 
  Loader2,
  FileText,
  Info,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAssetVendorPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const { updateVendor, isLoading } = useAssetStore();

  const [formFields, setFormFields] = useState({
    Vendor_Name: '',
    Contact_Person: '',
    Email: '',
    Mobile_Number: '',
    GST_Number: '',
    Address: '',
    Is_Active: true
  });

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    
    let isMounted = true;
    setIsDataLoading(true);
    
    api.fetchAssetVendorById(Number(vendorId))
      .then((vendorData) => {
        if (isMounted) {
          if (vendorData) {
            setFormFields({
              Vendor_Name: vendorData.Vendor_Name || '',
              Contact_Person: vendorData.Contact_Person || '',
              Email: vendorData.Email || '',
              Mobile_Number: vendorData.Mobile_Number || '',
              GST_Number: vendorData.GST_Number || '',
              Address: vendorData.Address || '',
              Is_Active: vendorData.Is_Active ?? true
            });
          } else {
            setError('Vendor not found.');
          }
          setIsDataLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching vendor:', err);
        if (isMounted) {
          setError('Failed to load vendor details.');
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [vendorId]);

  const handleFormFieldChange = (key: string, value: any) => {
    setFormFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.Vendor_Name.trim()) {
      toast.error('Vendor Name is required.');
      return;
    }

    // Optional email validation
    if (formFields.Email.trim() && !/\S+@\S+\.\S+/.test(formFields.Email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      await updateVendor(vendorId, formFields);
      // updateVendor store action redirects or we can redirect here
      router.push('/assets/vendor');
    } catch (err) {
      console.error('Failed to update vendor:', err);
    }
  };

  if (isDataLoading) {
    return (
      <div className="max-w-[1400px] mx-auto py-20 text-center text-slate-400 space-y-6">
        <Skeleton className="h-10 w-1/4 rounded-[5px]" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{error}</h3>
        <p className="text-sm text-center text-slate-400">The vendor record you requested could not be retrieved.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/vendor')}>
          Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 text-left relative">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push('/assets/vendor')}>Assets</span>
          <span>&gt;</span>
          <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push('/assets/vendor')}>Asset Vendors</span>
          <span>&gt;</span>
          <span className="text-slate-505 font-medium">Edit Vendor</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px]"
            onClick={() => router.push('/assets/vendor')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Asset Vendor</h1>
            <p className="text-xs text-slate-450 mt-0.5">Modify vendor details, tax registrations, contact info, and status.</p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <Card className="lg:col-span-2 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Vendor Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Vendor Name *
                  </label>
                  <Input 
                    placeholder="e.g. HP India Pvt Ltd"
                    value={formFields.Vendor_Name}
                    onChange={(e) => handleFormFieldChange('Vendor_Name', e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    Contact Person
                  </label>
                  <Input 
                    placeholder="e.g. Rajesh Kumar"
                    value={formFields.Contact_Person}
                    onChange={(e) => handleFormFieldChange('Contact_Person', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* GST Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <FileText className="h-3 w-3 text-slate-400" />
                    GST Number
                  </label>
                  <Input 
                    placeholder="e.g. 33HPIND1234F1Z5"
                    value={formFields.GST_Number}
                    onChange={(e) => handleFormFieldChange('GST_Number', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold font-mono uppercase focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    Email Address
                  </label>
                  <Input 
                    type="email"
                    placeholder="e.g. sales@vendor.com"
                    value={formFields.Email}
                    onChange={(e) => handleFormFieldChange('Email', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    Mobile Number
                  </label>
                  <Input 
                    placeholder="e.g. +91 98765 43210"
                    value={formFields.Mobile_Number}
                    onChange={(e) => handleFormFieldChange('Mobile_Number', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    Address
                  </label>
                  <Input 
                    placeholder="e.g. Bangalore, Karnataka"
                    value={formFields.Address}
                    onChange={(e) => handleFormFieldChange('Address', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Is Active Status */}
                <div className="flex items-center gap-2.5 pt-2 md:col-span-2">
                  <input 
                    type="checkbox" 
                    id="Is_Active_Checkbox"
                    checked={formFields.Is_Active} 
                    onChange={(e) => handleFormFieldChange('Is_Active', e.target.checked)}
                    disabled={isLoading}
                    className="rounded-[5px] border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 shrink-0 transition-all"
                  />
                  <label 
                    htmlFor="Is_Active_Checkbox" 
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                  >
                    Vendor Status is Active
                  </label>
                </div>

              </div>

              {/* Form Buttons */}
              <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/assets/vendor')}
                  disabled={isLoading}
                  className="h-10 px-4 rounded-[5px] text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-10 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Side Panel Info Column */}
        <div className="space-y-6">
          {/* Card 1: Information and Tips */}
          <Card className="border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[5px] bg-blue-50 dark:bg-blue-955/20 text-blue-600 shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-805 dark:text-white">Editing vendor info</h4>
                <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                  Modifying vendor information will update the profile details linked across all current and future assets procurement records and active service tickets mapped to this vendor.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-800/65 pt-4 space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Useful Guidelines</h5>
              <ul className="space-y-2 text-[11px] text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Vendor Name:</strong> Use the exact legal or trade name to avoid invoice mapping errors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>GST Number:</strong> Ensure the format matches local tax registration rules (e.g. 15-digit GSTIN in India).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Active Status:</strong> Inactive vendors cannot be selected when creating new assets.</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
