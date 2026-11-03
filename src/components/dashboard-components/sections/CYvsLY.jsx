import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import ChartCard from '../components/ChartCard';

const departmentData = [
  { name: "Production", current: 75, last: 60 },
  { name: "Sales", current: 65, last: 52 },
  { name: "Purchase", current: 55, last: 45 },
  { name: "Inventory", current: 68, last: 58 },
  { name: "Finance", current: 82, last: 68 },
  { name: "Quality", current: 62, last: 48 },
];

export default function CYvsLY() {
  return (
    <ChartCard title="Department Performance">
      <div className="h-[280px] flex flex-col justify-between pt-4 pb-2">
        <div className="flex-1 min-h-[220px] min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <BarChart 
              data={departmentData} 
              barGap={4} 
              barSize={12} 
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 650 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: "rgba(0,0,0,0.02)" }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar
                dataKey="current"
                name="Current Month"
                fill="#880808"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="last"
                name="Last Month"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#880808]" />
            <span>CURRENT MONTH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" />
            <span>LAST MONTH</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
