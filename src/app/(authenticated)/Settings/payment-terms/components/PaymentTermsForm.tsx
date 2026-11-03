"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Save, Trash2, Download, ChevronLeft, Check, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PaymentTermsTemplate, MilestoneSchedule } from "@/service/api/Settings/PaymentTermsTemplate/api";

interface PaymentTermsFormProps {
  initialData?: PaymentTermsTemplate | null;
  onCancel: () => void;
  onSave: (data: PaymentTermsTemplate) => void;
  isSaving?: boolean;
}

export function PaymentTermsForm({ initialData, onCancel, onSave, isSaving }: PaymentTermsFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateName, setTemplateName] = useState(initialData?.Template_Name || "");
  const [applicability, setApplicability] = useState(initialData?.Applicability || "");
  const [currency, setCurrency] = useState(initialData?.Currency || "");
  const [projectType, setProjectType] = useState(initialData?.Project_Type || "");
  const [projectName, setProjectName] = useState(initialData?.Project_Name || "");
  const [paymentType, setPaymentType] = useState(initialData?.Payment_Type || "");

  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData?.Payment_Methods || []);

  const [milestones, setMilestones] = useState<MilestoneSchedule[]>(initialData?.Milestone_Schedule || [
    { Milestone: "", Percentage: 0, Payment_Due: "" }
  ]);

  const [advancePayment, setAdvancePayment] = useState(initialData?.Advance_Payment_Percentage?.toString() || "");
  const [advancePaymentDue, setAdvancePaymentDue] = useState(initialData?.Advance_Payment_Due || "");
  
  const [paymentTerms, setPaymentTerms] = useState(initialData?.Payment_Terms || "");
  const [taxTerms, setTaxTerms] = useState(initialData?.Tax_Terms || "");
  const [otherTerms, setOtherTerms] = useState(initialData?.Other_Terms || "");
  const [validityDays, setValidityDays] = useState(initialData?.Validity_Days?.toString() || "");
  const [notes, setNotes] = useState(initialData?.Notes || "");
  const [isDefault, setIsDefault] = useState(initialData?.Is_Default_Template ?? true);

  const handleTogglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, { Milestone: "", Percentage: 0, Payment_Due: "" }]);
  };

  const totalPercentage = milestones.reduce((acc, curr) => acc + (Number(curr.Percentage) || 0), 0);

  const handleSave = () => {
    onSave({
      id: initialData?.id,
      Template_Name: templateName,
      Project_Type: projectType,
      Project_Name: projectName,
      Applicability: applicability,
      Currency: currency,
      Payment_Type: paymentType,
      Payment_Methods: paymentMethods,
      Milestone_Schedule: milestones,
      Advance_Payment_Percentage: advancePayment,
      Advance_Payment_Due: advancePaymentDue,
      Payment_Terms: paymentTerms,
      Tax_Terms: taxTerms,
      Other_Terms: otherTerms,
      Validity_Days: Number(validityDays) || 30,
      Notes: notes,
      Is_Default_Template: isDefault,
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Content Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {initialData ? "Edit Payment Terms" : "Create Payment Terms"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {initialData ? "Modify existing payment terms template" : "Create and customize payment terms template"}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="hidden md:flex items-center w-64 mx-8 pb-4">
          <div className="flex items-center relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 font-bold transition-colors ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
              {currentStep > 1 ? <Check className="w-5 h-5" /> : 1}
            </div>
            <div className={`absolute top-10 w-24 -ml-8 text-center text-xs font-semibold ${currentStep >= 1 ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}>
              Configure
            </div>
          </div>
          <div className={`flex-1 h-0.5 transition-colors ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
          <div className="flex items-center relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 font-bold transition-colors ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
              {currentStep > 2 ? <Check className="w-5 h-5" /> : 2}
            </div>
            <div className={`absolute top-10 w-24 -ml-8 text-center text-xs font-semibold ${currentStep >= 2 ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}>
              Preview
            </div>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Configure Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Template Name <span className="text-red-500">*</span></label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Name</label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Applicability <span className="text-red-500">*</span></label>
                <Input value={applicability} onChange={e => setApplicability(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Type <span className="text-red-500">*</span></label>
                <Input value={projectType} onChange={e => setProjectType(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currency <span className="text-red-500">*</span></label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm outline-none">
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Type <span className="text-red-500">*</span></label>
                <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm outline-none">
                  <option>Milestone Based</option>
                  <option>Time Based</option>
                  <option>Upfront</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Methods</label>
              <div className="flex flex-wrap gap-4">
                {["Bank Transfer", "NEFT / RTGS", "UPI", "Cheque"].map(method => (
                  <label key={method} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <Checkbox checked={paymentMethods.includes(method)} onCheckedChange={() => handleTogglePaymentMethod(method)} className="border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white rounded" />
                    <span>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Schedule Based Payment</label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">% of Total</th>
                      <th className="px-4 py-3">Payment Due</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {milestones.map((m, index) => (
                      <tr key={index} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-2">
                          <Input value={m.Milestone} onChange={e => {
                            const newM = [...milestones];
                            newM[index].Milestone = e.target.value;
                            setMilestones(newM);
                          }} className="h-8 text-xs" />
                        </td>
                        <td className="px-4 py-2">
                           <Input type="number" value={m.Percentage} onChange={e => {
                            const newM = [...milestones];
                            newM[index].Percentage = Number(e.target.value);
                            setMilestones(newM);
                          }} className="h-8 text-xs w-20" />
                        </td>
                        <td className="px-4 py-2">
                           <Input value={m.Payment_Due} onChange={e => {
                            const newM = [...milestones];
                            newM[index].Payment_Due = e.target.value;
                            setMilestones(newM);
                          }} className="h-8 text-xs" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => removeMilestone(index)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={addMilestone} variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-white dark:bg-slate-900 border-dashed">
                + Add Schedule
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Advance Payment (If any)</label>
                <div className="relative">
                  <Input value={advancePayment} onChange={e => setAdvancePayment(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 pr-8" />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Advance Payment Due</label>
                <Input value={advancePaymentDue} onChange={e => setAdvancePaymentDue(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Validity Days</label>
                <Input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
              <div className="space-y-1.5 flex items-center mt-5">
                <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <Checkbox checked={isDefault} onCheckedChange={(checked) => setIsDefault(!!checked)} className="border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white rounded" />
                  <span>Set as Default Template</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Terms</label>
              <Textarea
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[60px] text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax Terms</label>
              <Textarea
                value={taxTerms}
                onChange={e => setTaxTerms(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[60px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Other Terms</label>
              <Textarea
                value={otherTerms}
                onChange={e => setOtherTerms(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[60px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes (Internal Use)</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[60px] text-sm"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" className="border-slate-300 text-slate-700 bg-white" onClick={onCancel}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCurrentStep(2)}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50 flex flex-col min-h-0">
          <CardHeader className="pb-4 flex flex-row justify-between items-center border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Payment Terms & Conditions Preview</CardTitle>
            <button className="text-sm font-semibold text-blue-600 hover:underline">View Full Screen</button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 pb-6 px-6 pt-6">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm text-sm text-slate-800 dark:text-slate-300 font-serif">
              <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{templateName}</h2>
              <h3 className="text-center text-lg font-semibold text-blue-700 dark:text-blue-500 mt-2">{applicability}</h3>

              <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 mt-8 mb-8 text-sm">
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-semibold w-1/3 bg-slate-50 dark:bg-slate-900/50">Project Name</td>
                    <td className="p-3 border-l border-slate-200 dark:border-slate-700">{projectName}</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-semibold bg-slate-50 dark:bg-slate-900/50">Project Type</td>
                    <td className="p-3 border-l border-slate-200 dark:border-slate-700">{projectType}</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-semibold bg-slate-50 dark:bg-slate-900/50">Date</td>
                    <td className="p-3 border-l border-slate-200 dark:border-slate-700">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50 dark:bg-slate-900/50">Validity</td>
                    <td className="p-3 border-l border-slate-200 dark:border-slate-700">{validityDays} Days</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-6 text-sm">
                <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 text-base">1. PAYMENT TERMS</h4>
                  <p className="mb-4">{paymentTerms}</p>
                  <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-left font-semibold">Schedule</th>
                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-center font-semibold">% of Total</th>
                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-left font-semibold">Payment Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((m, i) => (
                        <tr key={i}>
                          <td className="border border-slate-200 dark:border-slate-700 p-2">{m.Milestone}</td>
                          <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">{m.Percentage}%</td>
                          <td className="border border-slate-200 dark:border-slate-700 p-2">{m.Payment_Due}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-50 dark:bg-slate-900/50">
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-right">Total</td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">{totalPercentage}%</td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 text-base">2. ADVANCE PAYMENT</h4>
                  <p className="leading-relaxed">An advance payment of {advancePayment}% of the total project cost is required {advancePaymentDue.toLowerCase()}.</p>
                </div>

                <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 text-base">3. TAXES</h4>
                  <p className="leading-relaxed">{taxTerms}</p>
                </div>

                <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 text-base">4. PAYMENT MODE</h4>
                  <p className="leading-relaxed">Payments can be made via {paymentMethods.join(", ")}.</p>
                </div>

                <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 text-base">5. OTHER TERMS</h4>
                  <p className="leading-relaxed">{otherTerms}</p>
                </div>

              </div>
            </div>
          </CardContent>
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center rounded-b-xl">
            <Button variant="outline" className="text-slate-600 bg-white" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Edit
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="text-slate-600 bg-white">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
              <Button disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
                {isSaving ? "Saving..." : "Save & Continue"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
