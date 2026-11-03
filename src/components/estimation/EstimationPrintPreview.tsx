// src/components/estimation/EstimationPrintPreview.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PrintPreviewProps {
    data: {
        projectName: string;
        projectType: string;
        clientName: string;
        domain: string;
        organization: string;
        developmentApproach: string;
        projectManager: string;
        technologyStack: string;
        estimationDate: string;
        version: string;
        ufp: number;
        tdi: number;
        vaf: number;
        afp: number;
        roundedAFP: number;
        effortHours: number;
        baseCost: number;
        contingencyPercent: number;
        contingencyAmount: number;
        totalCost: number;
        teamSize: number;
        workingDays: number;
        durationMonths: number;
        currency: string;
        notes: string;
        eiCount: { low: number; medium: number; high: number };
        eoCount: { low: number; medium: number; high: number };
        eqCount: { low: number; medium: number; high: number };
        ilfCount: { low: number; medium: number; high: number };
        eifCount: { low: number; medium: number; high: number };
    };
}

const formatIndianCurrency = (amount: number): string => {
    if (!amount || isNaN(amount)) return '₹ 0';
    const valueStr = Math.round(amount).toString();
    const lastThree = valueStr.substring(valueStr.length - 3);
    const otherNumbers = valueStr.substring(0, valueStr.length - 3);
    if (otherNumbers !== '') {
        const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        return `₹ ${formattedOthers},${lastThree}`;
    }
    return `₹ ${lastThree}`;
};

export const EstimationPrintPreview: React.FC<PrintPreviewProps> = ({ data }) => {
    return (
        <div id="estimation-print-area" className="p-8 bg-white">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Software Estimation Report</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Version: {data.version}</p>
            </div>

            {/* Project Information */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">1. Project Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Project Name:</span> {data.projectName}</div>
                    <div><span className="font-medium">Project Type:</span> {data.projectType}</div>
                    <div><span className="font-medium">Client:</span> {data.clientName}</div>
                    <div><span className="font-medium">Domain:</span> {data.domain}</div>
                    <div><span className="font-medium">Organization:</span> {data.organization}</div>
                    <div><span className="font-medium">Development Approach:</span> {data.developmentApproach}</div>
                    <div><span className="font-medium">Project Manager:</span> {data.projectManager}</div>
                    <div><span className="font-medium">Technology Stack:</span> {data.technologyStack}</div>
                    <div><span className="font-medium">Estimation Date:</span> {data.estimationDate}</div>
                    <div><span className="font-medium">Version:</span> {data.version}</div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">2. Summary</h2>
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <div className="text-xs text-slate-500 font-medium uppercase">UFP</div>
                        <div className="text-xl font-bold text-slate-800">{data.ufp}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <div className="text-xs text-slate-500 font-medium uppercase">VAF</div>
                        <div className="text-xl font-bold text-slate-800">{data.vaf}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <div className="text-xs text-slate-500 font-medium uppercase">AFP</div>
                        <div className="text-xl font-bold text-slate-800">{data.roundedAFP}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <div className="text-xs text-slate-500 font-medium uppercase">Effort (Hours)</div>
                        <div className="text-xl font-bold text-slate-800">{data.effortHours.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Function Point Counts */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">3. Function Point Counts</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left">Function Type</th>
                            <th className="px-3 py-2 text-center">Low</th>
                            <th className="px-3 py-2 text-center">Medium</th>
                            <th className="px-3 py-2 text-center">High</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-3 py-2">External Inputs (EI)</td>
                            <td className="px-3 py-2 text-center">{data.eiCount.low}</td>
                            <td className="px-3 py-2 text-center">{data.eiCount.medium}</td>
                            <td className="px-3 py-2 text-center">{data.eiCount.high}</td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2">External Outputs (EO)</td>
                            <td className="px-3 py-2 text-center">{data.eoCount.low}</td>
                            <td className="px-3 py-2 text-center">{data.eoCount.medium}</td>
                            <td className="px-3 py-2 text-center">{data.eoCount.high}</td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2">External Inquiries (EQ)</td>
                            <td className="px-3 py-2 text-center">{data.eqCount.low}</td>
                            <td className="px-3 py-2 text-center">{data.eqCount.medium}</td>
                            <td className="px-3 py-2 text-center">{data.eqCount.high}</td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2">Internal Logical Files (ILF)</td>
                            <td className="px-3 py-2 text-center">{data.ilfCount.low}</td>
                            <td className="px-3 py-2 text-center">{data.ilfCount.medium}</td>
                            <td className="px-3 py-2 text-center">{data.ilfCount.high}</td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2">External Interface Files (EIF)</td>
                            <td className="px-3 py-2 text-center">{data.eifCount.low}</td>
                            <td className="px-3 py-2 text-center">{data.eifCount.medium}</td>
                            <td className="px-3 py-2 text-center">{data.eifCount.high}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Cost Estimation */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">4. Cost Estimation</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                        <span className="font-medium">Base Cost</span>
                        <span>{formatIndianCurrency(data.baseCost)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                        <span className="font-medium">Contingency ({data.contingencyPercent}%)</span>
                        <span>{formatIndianCurrency(data.contingencyAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-slate-300">
                        <span className="font-bold text-base">Total Estimated Cost</span>
                        <span className="font-bold text-lg text-emerald-600">{formatIndianCurrency(data.totalCost)}</span>
                    </div>
                </div>
            </div>

            {/* Duration & Team */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">5. Duration & Team</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="font-medium">Team Size:</span> {data.teamSize} people</div>
                    <div><span className="font-medium">Working Days/Month:</span> {data.workingDays}</div>
                    <div><span className="font-medium">Duration:</span> {data.durationMonths} months</div>
                </div>
            </div>

            {/* Notes */}
            {data.notes && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">6. Notes</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-center text-xs text-slate-400">
                <p>This is a computer-generated estimation report.</p>
                <p>© {new Date().getFullYear()} Retail Pegatto - Software Estimation System</p>
            </div>
        </div>
    );
};