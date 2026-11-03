// src/utils/estimationExport.ts

interface EstimationData {
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
  ratings: Record<string, number>;
}

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  if (!amount || isNaN(amount)) return `${symbol} 0`;
  const valueStr = Math.round(amount).toString();
  const lastThree = valueStr.substring(valueStr.length - 3);
  const otherNumbers = valueStr.substring(0, valueStr.length - 3);
  if (otherNumbers !== '') {
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${symbol} ${formattedOthers},${lastThree}`;
  }
  return `${symbol} ${lastThree}`;
};

export const exportAsJSON = (data: EstimationData) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `estimation_${data.projectName || 'export'}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAsCSV = (data: EstimationData) => {
  const rows = [
    ['Section', 'Field', 'Value'],
    ['Project Information', 'Project Name', data.projectName],
    ['Project Information', 'Project Type', data.projectType],
    ['Project Information', 'Client / Customer', data.clientName],
    ['Project Information', 'Domain / Industry', data.domain],
    ['Project Information', 'Organization', data.organization],
    ['Project Information', 'Development Approach', data.developmentApproach],
    ['Project Information', 'Project Manager', data.projectManager],
    ['Project Information', 'Technology Stack', data.technologyStack],
    ['Project Information', 'Estimation Date', data.estimationDate],
    ['Project Information', 'Version', data.version],
    [],
    ['Function Point Counts', 'EI Low', data.eiCount.low],
    ['Function Point Counts', 'EI Medium', data.eiCount.medium],
    ['Function Point Counts', 'EI High', data.eiCount.high],
    ['Function Point Counts', 'EO Low', data.eoCount.low],
    ['Function Point Counts', 'EO Medium', data.eoCount.medium],
    ['Function Point Counts', 'EO High', data.eoCount.high],
    ['Function Point Counts', 'EQ Low', data.eqCount.low],
    ['Function Point Counts', 'EQ Medium', data.eqCount.medium],
    ['Function Point Counts', 'EQ High', data.eqCount.high],
    ['Function Point Counts', 'ILF Low', data.ilfCount.low],
    ['Function Point Counts', 'ILF Medium', data.ilfCount.medium],
    ['Function Point Counts', 'ILF High', data.ilfCount.high],
    ['Function Point Counts', 'EIF Low', data.eifCount.low],
    ['Function Point Counts', 'EIF Medium', data.eifCount.medium],
    ['Function Point Counts', 'EIF High', data.eifCount.high],
    [],
    ['GSC Ratings', 'Data Communications', data.ratings.dataComm],
    ['GSC Ratings', 'Distributed Processing', data.ratings.distProcessing],
    ['GSC Ratings', 'Performance', data.ratings.performance],
    ['GSC Ratings', 'Heavily Used Configuration', data.ratings.heavilyUsedConfig],
    ['GSC Ratings', 'Transaction Rate', data.ratings.transactionRate],
    ['GSC Ratings', 'Online Data Entry', data.ratings.onlineDataEntry],
    ['GSC Ratings', 'End User Efficiency', data.ratings.endUserEfficiency],
    ['GSC Ratings', 'Online Update', data.ratings.onlineUpdate],
    ['GSC Ratings', 'Complex Processing', data.ratings.complexProcessing],
    ['GSC Ratings', 'Reusability', data.ratings.reusability],
    ['GSC Ratings', 'Installation Ease', data.ratings.installationEase],
    ['GSC Ratings', 'Operational Ease', data.ratings.operationalEase],
    ['GSC Ratings', 'Multiple Sites', data.ratings.multipleSites],
    ['GSC Ratings', 'Facilitate Change', data.ratings.facilitateChange],
    [],
    ['Calculations', 'UFP', data.ufp],
    ['Calculations', 'TDI', data.tdi],
    ['Calculations', 'VAF', data.vaf],
    ['Calculations', 'AFP', data.afp],
    ['Calculations', 'Rounded AFP', data.roundedAFP],
    ['Calculations', 'Effort Hours', data.effortHours],
    [],
    ['Cost Estimation', 'Base Cost', formatCurrency(data.baseCost, data.currency.match(/\((.*?)\)/)?.[1] || '₹')],
    ['Cost Estimation', 'Contingency %', `${data.contingencyPercent}%`],
    ['Cost Estimation', 'Contingency Amount', formatCurrency(data.contingencyAmount, data.currency.match(/\((.*?)\)/)?.[1] || '₹')],
    ['Cost Estimation', 'Total Cost', formatCurrency(data.totalCost, data.currency.match(/\((.*?)\)/)?.[1] || '₹')],
    ['Cost Estimation', 'Currency', data.currency],
    [],
    ['Duration & Team', 'Team Size', data.teamSize],
    ['Duration & Team', 'Working Days per Month', data.workingDays],
    ['Duration & Team', 'Duration (Months)', data.durationMonths],
    [],
    ['Notes', 'Notes', data.notes]
  ];

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `estimation_${data.projectName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printEstimation = () => {
  window.print();
};

export const generatePrintStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #estimation-print-area, #estimation-print-area * {
        visibility: visible;
      }
      #estimation-print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
        background: white;
        color: black;
      }
      #estimation-print-area .no-print {
        display: none !important;
      }
      #estimation-print-area h1 {
        font-size: 24px;
        margin-bottom: 16px;
        color: #1e293b;
      }
      #estimation-print-area h2 {
        font-size: 16px;
        margin-top: 16px;
        margin-bottom: 8px;
        color: #334155;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 4px;
      }
      #estimation-print-area table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 12px;
      }
      #estimation-print-area th {
        background-color: #f1f5f9;
        font-weight: bold;
        text-align: left;
        padding: 6px 8px;
        border: 1px solid #e2e8f0;
      }
      #estimation-print-area td {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
      }
      #estimation-print-area .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin: 12px 0;
      }
      #estimation-print-area .summary-item {
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        text-align: center;
      }
      #estimation-print-area .summary-item .label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        font-weight: bold;
      }
      #estimation-print-area .summary-item .value {
        font-size: 18px;
        font-weight: bold;
        color: #0f172a;
        margin-top: 4px;
      }
      #estimation-print-area .cost-total {
        font-size: 20px;
        color: #059669;
        font-weight: bold;
      }
      #estimation-print-area .footer {
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
      }
    }
  `;
  document.head.appendChild(style);
  return style;
};