import React from "react";
import { LogIn, FileText, Search, Database, Link, Lightbulb, CheckCircle2 } from "lucide-react";

export const formatCurrency = (amount: number, symbol: string = '₹') => {
  if (!amount || isNaN(amount)) return `${symbol} 0`;
  return `${symbol} ${new Intl.NumberFormat('en-IN').format(amount)}`;
};

export const safeNumber = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString('en-IN');
};

// Icon components for Block 1
const EIIcon = () => <div className="bg-blue-600 text-white p-2 rounded-md"><LogIn className="h-6 w-6" /></div>;
const EOIcon = () => <div className="bg-emerald-500 text-white p-2 rounded-md"><FileText className="h-6 w-6" /></div>;
const EQIcon = () => <div className="bg-amber-500 text-white p-2 rounded-md"><Search className="h-6 w-6" /></div>;
const ILFIcon = () => <div className="bg-purple-600 text-white p-2 rounded-md"><Database className="h-6 w-6" /></div>;
const EIFIcon = () => <div className="bg-teal-600 text-white p-2 rounded-md"><Link className="h-6 w-6" /></div>;

interface FPAReportUIProps {
  estData: any;
  currencySymbol?: string;
}

export function FPAReportUI({ estData, currencySymbol = '₹' }: FPAReportUIProps) {
  if (!estData) return null;

  // Calculate totals for UFP table
  const ufpData = [
    { type: "External Inputs (EI)", count: (estData.ei_low || 0) + (estData.ei_medium || 0) + (estData.ei_high || 0), complexity: "Medium", weight: 4, ufp: (estData.ei_low || 0) * 3 + (estData.ei_medium || 0) * 4 + (estData.ei_high || 0) * 6 },
    { type: "External Outputs (EO)", count: (estData.eo_low || 0) + (estData.eo_medium || 0) + (estData.eo_high || 0), complexity: "Medium", weight: 5, ufp: (estData.eo_low || 0) * 4 + (estData.eo_medium || 0) * 5 + (estData.eo_high || 0) * 7 },
    { type: "External Inquiries (EQ)", count: (estData.eq_low || 0) + (estData.eq_medium || 0) + (estData.eq_high || 0), complexity: "Medium", weight: 4, ufp: (estData.eq_low || 0) * 3 + (estData.eq_medium || 0) * 4 + (estData.eq_high || 0) * 6 },
    { type: "Internal Logical Files (ILF)", count: (estData.ilf_low || 0) + (estData.ilf_medium || 0) + (estData.ilf_high || 0), complexity: "Medium", weight: 10, ufp: (estData.ilf_low || 0) * 7 + (estData.ilf_medium || 0) * 10 + (estData.ilf_high || 0) * 15 },
    { type: "External Interface Files (EIF)", count: (estData.eif_low || 0) + (estData.eif_medium || 0) + (estData.eif_high || 0), complexity: "Medium", weight: 7, ufp: (estData.eif_low || 0) * 5 + (estData.eif_medium || 0) * 7 + (estData.eif_high || 0) * 10 },
  ];

  const totalUFP = estData.ufp || 0;
  const tdi = estData.tdi || 0;
  const vaf = estData.vaf || 0;
  const afp = estData.afp || 0;
  const effortHours = estData.effort_hours || 0;
  const costPerHour = estData.cost_per_hour || 1200;
  const projectCost = estData.total_estimated_cost || 0;
  const hoursPerFp = estData.hours_per_fp || 12;

  return (
    <div className="bg-white border shadow-lg print:shadow-none print:border-none w-full">
      {/* Report Meta Info */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b print:p-4 gap-4 bg-white">
        <div className="flex-shrink-0">
          <img src="/CRMFARM_LOGO.png" alt="Organization Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="text-right flex flex-col items-start sm:items-end gap-1">
          <div className="text-xs text-gray-500 flex gap-2">
            <span className="font-medium text-left sm:text-right">Generated Date:</span>
            <span className="font-bold text-gray-800 text-left">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#1a4b82] text-white text-center py-3 sm:py-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide px-2">Software Development Cost Estimation</h1>
        <h2 className="text-xs sm:text-sm md:text-base font-medium mt-1">Using Function Point Analysis (FPA Method)</h2>
      </div>

      <div className="p-2 text-center text-gray-600 text-[11px] sm:text-xs border-b">
        FPA is a standardized method to estimate the size, effort, cost and duration of a software project based on the functionality provided to the user.
      </div>

      {/* Project Details */}
      <div className="p-4 sm:p-6 bg-slate-50/50 border-b print:p-4 print:bg-transparent">
        <h3 className="text-xs sm:text-sm font-bold text-[#1a4b82] mb-3 uppercase tracking-wider">Project Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Project Name</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.project_name || estData?.Project_Name || 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Client Name</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.clientName ?? estData?.client_name ?? estData?.Customer_Name ?? estData?.customer ?? 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Domain</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.Domain || 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Dev Approach</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.Development_Approach || 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Technology Stack</span>
            <span className="text-xs font-semibold text-gray-800">{Array.isArray(estData?.Technology_Stack) ? estData.Technology_Stack.join(', ') : (estData?.Technology_Stack || 'N/A')}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Project Version</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.Project_Version || '1.0'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Start Date</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.Estimated_StartDate ? new Date(estData.Estimated_StartDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">End Date</span>
            <span className="text-xs font-semibold text-gray-800">{estData?.Estimated_EndDate ? new Date(estData.Estimated_EndDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">

          {/* Block 1 */}
          <div className="col-span-1 lg:col-span-4 border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-[#f8fbff] print:bg-transparent">
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
              <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">1</div>
              <h3 className="font-bold text-[#1a4b82]">IDENTIFY FUNCTION TYPES</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3 sm:gap-4 items-center">
                <EIIcon />
                <div><h4 className="font-bold text-xs sm:text-sm">External Inputs (EI)</h4><p className="text-[10px] sm:text-xs text-gray-600">User inputs data into the system</p></div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <EOIcon />
                <div><h4 className="font-bold text-xs sm:text-sm">External Outputs (EO)</h4><p className="text-[10px] sm:text-xs text-gray-600">Reports, files, dashboards</p></div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <EQIcon />
                <div><h4 className="font-bold text-xs sm:text-sm">External Inquiries (EQ)</h4><p className="text-[10px] sm:text-xs text-gray-600">Searches, lookups, queries</p></div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <ILFIcon />
                <div><h4 className="font-bold text-xs sm:text-sm">Internal Logical Files (ILF)</h4><p className="text-[10px] sm:text-xs text-gray-600">Data stored within application</p></div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <EIFIcon />
                <div><h4 className="font-bold text-xs sm:text-sm">External Interface Files (EIF)</h4><p className="text-[10px] sm:text-xs text-gray-600">Data from external systems</p></div>
              </div>
            </div>
          </div>

          {/* Block 2 */}
          <div className="col-span-1 lg:col-span-8 border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-white">
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
              <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">2</div>
              <h3 className="font-bold text-[#1a4b82]">ASSIGN COMPLEXITY WEIGHTS</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* EI, EO, EQ Tables */}
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-center text-sm">External Inputs (EI)</h4>
                <table className="w-full border text-center">
                  <thead><tr><th className="bg-blue-600 text-white p-1">Complexity</th><th className="bg-orange-400 text-white p-1">Weight</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-1">Low</td><td className="border p-1">3</td></tr>
                    <tr><td className="border p-1">Medium</td><td className="border p-1">4</td></tr>
                    <tr><td className="border p-1">High</td><td className="border p-1">6</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-center text-sm">External Outputs (EO)</h4>
                <table className="w-full border text-center">
                  <thead><tr><th className="bg-green-600 text-white p-1">Complexity</th><th className="bg-green-400 text-white p-1">Weight</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-1">Low</td><td className="border p-1">4</td></tr>
                    <tr><td className="border p-1">Medium</td><td className="border p-1">5</td></tr>
                    <tr><td className="border p-1">High</td><td className="border p-1">7</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-center text-sm">External Inquiries (EQ)</h4>
                <table className="w-full border text-center">
                  <thead><tr><th className="bg-orange-500 text-white p-1">Complexity</th><th className="bg-orange-400 text-white p-1">Weight</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-1">Low</td><td className="border p-1">3</td></tr>
                    <tr><td className="border p-1">Medium</td><td className="border p-1">4</td></tr>
                    <tr><td className="border p-1">High</td><td className="border p-1">6</td></tr>
                  </tbody>
                </table>
              </div>

              {/* ILF, EIF, Note */}
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-center text-sm">Internal Logical Files (ILF)</h4>
                <table className="w-full border text-center">
                  <thead><tr><th className="bg-purple-700 text-white p-1">Complexity</th><th className="bg-purple-500 text-white p-1">Weight</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-1">Low</td><td className="border p-1">7</td></tr>
                    <tr><td className="border p-1">Medium</td><td className="border p-1">10</td></tr>
                    <tr><td className="border p-1">High</td><td className="border p-1">15</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-center text-sm">External Interface Files (EIF)</h4>
                <table className="w-full border text-center">
                  <thead><tr><th className="bg-teal-700 text-white p-1">Complexity</th><th className="bg-teal-500 text-white p-1">Weight</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-1">Low</td><td className="border p-1">5</td></tr>
                    <tr><td className="border p-1">Medium</td><td className="border p-1">7</td></tr>
                    <tr><td className="border p-1">High</td><td className="border p-1">10</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="border border-blue-200 rounded p-4 bg-blue-50/50 text-xs">
                <div className="flex items-center gap-2 mb-2 text-[#1a4b82] font-bold">
                  <Lightbulb className="h-5 w-5" /> NOTE
                </div>
                <p className="mb-2">Determine complexity based on:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Data Element Types</li>
                  <li>Record Types</li>
                  <li>File Types</li>
                  <li>Referenced Files</li>
                  <li>Complexity of Logic</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">

          {/* Block 3 */}
          <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-white">
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
              <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">3</div>
              <h3 className="font-bold text-[#1a4b82]">CALCULATE UNADJUSTED FUNCTION POINTS (UFP)</h3>
            </div>
            <div className="p-3 sm:p-4 overflow-x-auto">
              <table className="w-full text-[10px] sm:text-xs text-center border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="p-1 sm:p-1.5 text-left min-w-[100px] sm:min-w-[140px]">Function Type</th>
                    <th className="p-1 sm:p-1.5">Count</th>
                    <th className="p-1 sm:p-1.5">Complexity</th>
                    <th className="p-1 sm:p-1.5">Weight</th>
                    <th className="p-1 sm:p-1.5 border-l border-gray-300">UFP<br /><span className="text-[9px] sm:text-[10px] font-normal">(Count × Weight)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {ufpData.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-1 sm:p-1.5 text-left">{row.type}</td>
                      <td className="p-1 sm:p-1.5">{row.count}</td>
                      <td className="p-1 sm:p-1.5">{row.complexity}</td>
                      <td className="p-1 sm:p-1.5">{row.weight}</td>
                      <td className="p-1 sm:p-1.5 font-bold border-l border-gray-300">{row.ufp}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold text-[#1a4b82] text-[11px] sm:text-xs">
                    <td colSpan={4} className="p-1.5 sm:p-2 text-right">TOTAL UFP</td>
                    <td className="p-1.5 sm:p-2 border-l border-blue-200 text-sm sm:text-base">{totalUFP}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Block 4 */}
          <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-[#f8fbff] print:bg-transparent">
            <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
              <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">4</div>
              <h3 className="font-bold text-[#1a4b82]">CALCULATE VALUE ADJUSTMENT FACTOR (VAF)</h3>
            </div>
            <div className="p-3 sm:p-4 flex flex-col xl:flex-row gap-4">
              <div className="w-full xl:w-[55%]">
                <table className="w-full text-[10px] sm:text-xs bg-white border">
                  <thead>
                    <tr className="bg-gray-100"><th className="p-1 border text-left">General System Characteristics</th><th className="p-1 border">Rating (0 to 5)</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-1 border pl-2">1. Data Communications</td><td className="p-1 border text-center">{estData.gsc_data_communications || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">2. Distributed Processing</td><td className="p-1 border text-center">{estData.gsc_distributed_processing || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">3. Performance</td><td className="p-1 border text-center">{estData.gsc_performance || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">4. Heavily Used Configuration</td><td className="p-1 border text-center">{estData.gsc_heavily_used_configuration || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">5. Transaction Rate</td><td className="p-1 border text-center">{estData.gsc_transaction_rate || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">6. Online Data Entry</td><td className="p-1 border text-center">{estData.gsc_online_data_entry || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">7. End User Efficiency</td><td className="p-1 border text-center">{estData.gsc_end_user_efficiency || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">8. Online Update</td><td className="p-1 border text-center">{estData.gsc_online_update || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">9. Complex Processing</td><td className="p-1 border text-center">{estData.gsc_complex_processing || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">10. Reusability</td><td className="p-1 border text-center">{estData.gsc_reusability || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">11. Installation Ease</td><td className="p-1 border text-center">{estData.gsc_installation_ease || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">12. Operational Ease</td><td className="p-1 border text-center">{estData.gsc_operational_ease || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">13. Multiple Sites</td><td className="p-1 border text-center">{estData.gsc_multiple_sites || 0}</td></tr>
                    <tr><td className="p-1 border pl-2">14. Facilitate Change</td><td className="p-1 border text-center">{estData.gsc_facilitate_change || 0}</td></tr>
                    <tr className="bg-blue-50 font-bold"><td className="p-1 border pl-2">Total Degree of Influence (TDI)</td><td className="p-1 border text-center text-blue-800">{tdi}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 w-full xl:w-[40%]">
                <div className="border border-green-200 bg-green-50 rounded py-4 px-3 flex flex-col items-center justify-center gap-2">
                  <div className="text-[10px] sm:text-xs font-bold text-gray-700">VAF = 0.65 + (0.01 × TDI)</div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-700">VAF = 0.65 + (0.01 × {tdi})</div>
                  <div className="bg-teal-600 text-white font-bold px-4 py-1.5 rounded text-xs sm:text-sm mt-1 shadow-sm">VAF = {vaf.toFixed(2)}</div>
                </div>

                <div className="border border-orange-200 bg-orange-50 rounded py-4 px-3 flex flex-col justify-center flex-1">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 font-bold justify-center text-xs sm:text-sm">
                    RATING SCALE
                  </div>
                  <div className="space-y-1 text-center text-[10px] sm:text-xs">
                    <div>0 – Not Present</div>
                    <div>1 – Incidental</div>
                    <div>2 – Moderate</div>
                    <div>3 – Average</div>
                    <div>4 – Significant</div>
                    <div>5 – Strong</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ROW 3 & 4 (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">

          <div className="flex flex-col gap-6 print:block">
            {/* Block 5 */}
            <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-white">
              <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">5</div>
                <h3 className="font-bold text-[#1a4b82]">CALCULATE ADJUSTED FUNCTION POINTS (AFP)</h3>
              </div>
              <div className="p-4 sm:p-6 flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                <div className="text-base sm:text-lg font-bold">AFP = UFP × VAF</div>
                <div className="text-base sm:text-lg font-bold">AFP = {totalUFP} × {vaf.toFixed(2)}</div>
                <div className="bg-teal-600 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-lg sm:text-2xl text-center">
                  <div>AFP = {safeNumber(afp)}</div>
                  <div className="text-[10px] sm:text-xs font-normal mt-1">(Adjusted Function Points)</div>
                </div>
              </div>
            </div>

            {/* Block 7 */}
            <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-[#fef9c3] print:bg-transparent flex-1 flex flex-col print:block">
              <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">7</div>
                <h3 className="font-bold text-[#1a4b82]">CALCULATE PROJECT COST</h3>
              </div>
              <div className="p-3 sm:p-4 flex flex-col xl:flex-row gap-3 sm:gap-4 flex-1">
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-[#fef08a]/30 p-3 sm:p-4 rounded-xl border border-yellow-200">
                  <div className="text-xs sm:text-sm font-bold text-center">Project Cost = Effort Hours × Cost per Hour</div>
                  <div className="text-xs sm:text-sm font-bold text-center">Assume Blended Cost per Hour = {formatCurrency(costPerHour, currencySymbol)}</div>
                  <div className="text-xs sm:text-sm font-bold text-center">Project Cost = {effortHours.toLocaleString()} × {costPerHour.toLocaleString()}</div>
                  <div className="bg-[#facc15] text-[#713f12] font-extrabold px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-lg w-full text-center shadow-sm">
                    Project Cost = {formatCurrency(projectCost, currencySymbol)}
                  </div>
                </div>

                <div className="w-full xl:w-[45%]">
                  <table className="w-full text-xs text-center border-2 border-[#1e3a8a]">
                    <thead>
                      <tr className="bg-[#1e3a8a] text-white"><th colSpan={2} className="p-1.5">Cost Components (Optional)</th></tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr><td className="border p-1.5 text-left pl-2">Development Cost</td><td className="border p-1.5 bg-blue-50">{estData.percentage_development || 80}%</td></tr>
                      <tr><td className="border p-1.5 text-left pl-2">Testing Cost</td><td className="border p-1.5 bg-blue-50">{estData.percentage_testing || 10}%</td></tr>
                      <tr><td className="border p-1.5 text-left pl-2">Project Management</td><td className="border p-1.5 bg-blue-50">{estData.percentage_management || 5}%</td></tr>
                      <tr><td className="border p-1.5 text-left pl-2">Infrastructure / Others</td><td className="border p-1.5 bg-blue-50">{estData.percentage_infrastructure || 5}%</td></tr>
                      <tr className="bg-[#1e3a8a] text-white font-bold"><td className="border-t border-[#1e3a8a] p-1.5">Total</td><td className="border-t border-[#1e3a8a] p-1.5">100%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 print:block">
            {/* Block 6 */}
            <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-white">
              <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">6</div>
                <h3 className="font-bold text-[#1a4b82]">CONVERT TO EFFORT (HOURS)</h3>
              </div>
              <div className="p-3 sm:p-4 flex flex-col xl:flex-row gap-3 sm:gap-4">
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
                  <div className="text-xs sm:text-sm font-bold text-center">Effort (Hours) = AFP × Hours per FP</div>
                  <div className="text-xs sm:text-sm text-center">Assume Productivity = {hoursPerFp} Hours per FP</div>
                  <div className="text-xs sm:text-sm font-bold text-center">Effort = {safeNumber(afp)} × {hoursPerFp}</div>
                  <div className="bg-green-100 text-green-900 border border-green-300 font-bold px-3 sm:px-4 py-1.5 rounded text-sm sm:text-lg w-full text-center">
                    Effort = {effortHours.toLocaleString()} Hours
                  </div>
                </div>
                <div className="w-full xl:w-[50%]">
                  <table className="w-full text-[11px] border text-center">
                    <thead>
                      <tr className="bg-blue-50"><th colSpan={2} className="p-1 border-b">Typical Productivity <span className="font-normal">(Hours per FP)</span></th></tr>
                      <tr className="bg-gray-50"><th className="p-1 border-b text-left pl-2">Technology / Type</th><th className="p-1 border-b">Hours per FP</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="p-1 border-b text-left pl-2">Standard Web Application</td><td className="p-1 border-b">8 - 12</td></tr>
                      <tr><td className="p-1 border-b text-left pl-2">Enterprise Application</td><td className="p-1 border-b">10 - 15</td></tr>
                      <tr><td className="p-1 border-b text-left pl-2">Complex / Integrated System</td><td className="p-1 border-b">15 - 20</td></tr>
                      <tr><td className="p-1 border-b text-left pl-2">AI / ML Based Application</td><td className="p-1 border-b">20 - 30</td></tr>
                      <tr><td className="p-1 text-left pl-2">Mobile Application</td><td className="p-1">12 - 18</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Block 8 */}
            <div className="border rounded-xl overflow-hidden print:overflow-visible print:border-none print:mb-6 bg-white flex-1 flex flex-col print:block">
              <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                <div className="bg-[#1a4b82] text-white w-8 h-8 flex items-center justify-center font-bold rounded">8</div>
                <h3 className="font-bold text-[#1a4b82]">ESTIMATION SUMMARY (EXAMPLE)</h3>
              </div>
              <div className="p-3 sm:p-4 flex-1 flex items-center overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[280px]">
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Unadjusted Function Points (UFP)</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">{totalUFP}</td></tr>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Value Adjustment Factor (VAF)</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">{vaf.toFixed(2)}</td></tr>
                    <tr className="border-b bg-blue-50/50"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2 font-medium">Adjusted Function Points (AFP)</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right font-bold text-[#1a4b82]">{safeNumber(afp)}</td></tr>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Effort (Hours)</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">{effortHours.toLocaleString()}</td></tr>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Team Size</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">{estData.team_size || 0} Developers</td></tr>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Duration</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">~ {estData.duration_months || 0} Months</td></tr>
                    <tr className="border-b"><td className="py-1.5 sm:py-2 pl-1 sm:pl-2">Cost per Hour</td><td className="py-1.5 sm:py-2 pr-1 sm:pr-2 text-right">{formatCurrency(costPerHour, currencySymbol)}</td></tr>
                    <tr className="bg-blue-50 text-[#1a4b82] font-bold"><td className="py-2 sm:py-3 pl-1 sm:pl-2 uppercase">Total Estimated Cost</td><td className="py-2 sm:py-3 pr-1 sm:pr-2 text-right text-sm sm:text-lg">{formatCurrency(projectCost, currencySymbol)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t pt-6 print:block">
          <div className="flex gap-4 p-4 border rounded-xl bg-[#f8fbff]">
            <FileText className="h-12 w-12 text-[#1a4b82] shrink-0" />
            <div>
              <h4 className="font-bold text-[#1a4b82] mb-3 uppercase">Benefits of FPA</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Technology independent</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Improves estimation accuracy</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Focus on user functionality</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Useful for benchmarking</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Industry standard method</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Helps in planning and tracking</div>
              </div>
            </div>
          </div>

          <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 text-orange-600 font-bold">
              <Lightbulb className="h-5 w-5" /> NOTE
            </div>
            <p className="text-sm text-gray-700">
              The productivity (hours per FP) and cost per hour should be calibrated based on your organization's historical data.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
