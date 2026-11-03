'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { useCustomerSegmentList, useUpdateCustomerSegment } from '@/service/api/CustomerSegment/queries';

interface RuleForm {
  field: string;
  operator: string;
  value: string;
}

export default function EditSegmentPage() {
  const { id } = useParams() as { id: string };
  const { primaryColor } = useStore();
  const router = useRouter();

  const { data: listData, isLoading } = useCustomerSegmentList();
  const segment = listData?.results?.find(s => s.id === Number(id));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Warning' | 'Inactive'>('Active');
  const [type, setType] = useState<'Behavioral' | 'Demographic' | 'Transactional' | 'Other'>('Behavioral');
  const [customersCount, setCustomersCount] = useState<number>(0);

  const [rules, setRules] = useState<RuleForm[]>([]);
  const [newRuleField, setNewRuleField] = useState('');
  const [newRuleOperator, setNewRuleOperator] = useState('>=');
  const [newRuleValue, setNewRuleValue] = useState('');

  const updateMutation = useUpdateCustomerSegment();

  useEffect(() => {
    if (segment) {
      setName(segment.Segment_Name);
      setDescription(segment.Description);
      setStatus(segment.Status as 'Active' | 'Warning' | 'Inactive');
      setType(segment.Segment_Type as 'Behavioral' | 'Demographic' | 'Transactional' | 'Other');
      setRules(segment.Rules.map(r => ({
        field: r.field,
        operator: r.operator,
        value: String(r.value)
      })));
      setCustomersCount(segment.Initial_Segment_Size || 100);
    }
  }, [segment]);

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading segment...</div>;
  }

  if (!segment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Segment Not Found</h2>
        <p className="text-sm text-slate-500">The customer segment with ID {id} does not exist.</p>
        <Button
          onClick={() => router.push('/customer-segmentation')}
          className="text-white h-9 px-4 rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          Back to Customer Segmentation
        </Button>
      </div>
    );
  }

  const handleAddRule = () => {
    if (!newRuleField.trim() || !newRuleValue.trim()) {
      toast.error('Field and Value cannot be empty.');
      return;
    }
    setRules(prev => [...prev, { field: newRuleField.trim(), operator: newRuleOperator, value: newRuleValue.trim() }]);
    setNewRuleField('');
    setNewRuleValue('');
    toast.success('Rule condition added.');
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
    toast.info('Rule condition removed.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a segment name.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a segment description.');
      return;
    }
    if (rules.length === 0) {
      toast.error('Please add at least one segmentation rule condition.');
      return;
    }

    updateMutation.mutate(
      {
        id: segment.id,
        Organization_Id: segment.Organization_Id?.id || 1,
        Segment_Name: name.trim(),
        Description: description.trim(),
        Status: status,
        Segment_Type: type,
        Initial_Segment_Size: customersCount,
        Rules: rules.map(r => ({
          ...r,
          value: isNaN(Number(r.value)) ? r.value : Number(r.value)
        })),
        Created_By: segment.Created_By?.id || 1,
        Updated_By: segment.Updated_By?.id || 1
      },
      {
        onSuccess: () => {
          toast.success('Segment updated successfully!');
          router.push('/customer-segmentation');
        },
        onError: () => {
          toast.error('Failed to update segment. Please try again.');
        }
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
    >
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/customer-segmentation">Customer Segmentation</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Segment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-4 text-left">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 border dark:border-slate-800 rounded-xl cursor-pointer"
              onClick={() => router.push('/customer-segmentation')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Customer Segment</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update the demographic or behavioral rules for this segment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer active:scale-95 transition-all"
              onClick={() => router.push('/customer-segmentation')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
              <div className="p-5 border-b dark:border-slate-800">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Segment Information</h3>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segment Name *</Label>
                  <Input
                    placeholder="e.g. VIP Enterprise Buyers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description *</Label>
                  <Textarea
                    placeholder="Describe the target audience behaviour or characteristics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs p-3 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segment Status</Label>
                    <Select value={status} onValueChange={(val: any) => val && setStatus(val)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segment Type</Label>
                    <Select value={type} onValueChange={(val: any) => val && setType(val)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                        <SelectItem value="Transactional">Transactional</SelectItem>
                        <SelectItem value="Demographic">Demographic</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Segment Size</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customersCount}
                      onChange={(e) => setCustomersCount(Number(e.target.value))}
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
              <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-blue-600" style={{ color: primaryColor }} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Segment Rules</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add query conditions that customers must fulfill to belong to this segment.
                </p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Field (e.g. Total_Purchase)"
                      value={newRuleField}
                      onChange={(e) => setNewRuleField(e.target.value)}
                      className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold flex-[2]"
                    />
                    <Select value={newRuleOperator} onValueChange={(val: any) => val && setNewRuleOperator(val)}>
                      <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold flex-1 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">&gt;=</SelectItem>
                        <SelectItem value="<=">&lt;=</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value (e.g. 50000)"
                      value={newRuleValue}
                      onChange={(e) => setNewRuleValue(e.target.value)}
                      className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-9 p-0 border-slate-250 dark:border-slate-800 rounded-lg shrink-0 cursor-pointer"
                      onClick={handleAddRule}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left">Active Conditions ({rules.length})</Label>
                  {rules.length > 0 ? (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                      {rules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350"
                        >
                          <span className="truncate flex-1">
                            {rule.field} {rule.operator} {rule.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(index)}
                            className="text-slate-400 hover:text-rose-600 font-extrabold shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-semibold text-left">No conditions defined yet. Add at least one rule.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
