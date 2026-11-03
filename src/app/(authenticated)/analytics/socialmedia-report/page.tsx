'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Send, Users, ThumbsUp, MousePointerClick, Share2, Target,
  Filter, Download, Calendar, ArrowRight, PlaySquare, Image as ImageIcon, Link as LinkIcon, Type, Info, TrendingUp
} from 'lucide-react';
import { FaLinkedin, FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';

// --- MOCK DATA ---

const reachData = [
  { date: '1 Jun', reach: 12000 },
  { date: '6 Jun', reach: 35000 },
  { date: '11 Jun', reach: 18000 },
  { date: '16 Jun', reach: 45000 },
  { date: '21 Jun', reach: 25000 },
  { date: '26 Jun', reach: 34000 },
  { date: '30 Jun', reach: 20000 },
];

const platformEngagementData = [
  { name: 'LinkedIn', value: 4730, color: '#0A66C2' },
  { name: 'Facebook', value: 1900, color: '#1877F2' },
  { name: 'Instagram', value: 1370, color: '#E4405F' },
  { name: 'X (Twitter)', value: 540, color: '#000000' },
  { name: 'YouTube', value: 210, color: '#FF0000' },
];

const leadTrendData = [
  { date: '1 Jun', leads: 20 },
  { date: '6 Jun', leads: 50 },
  { date: '11 Jun', leads: 40 },
  { date: '16 Jun', leads: 55 },
  { date: '21 Jun', leads: 70 },
  { date: '26 Jun', leads: 45 },
  { date: '30 Jun', leads: 60 },
];

const clicksData = [
  { name: 'LinkedIn', clicks: 1120, color: '#0A66C2' },
  { name: 'Facebook', clicks: 620, color: '#1877F2' },
  { name: 'Instagram', clicks: 340, color: '#E4405F' },
  { name: 'X (Twitter)', clicks: 180, color: '#000000' },
  { name: 'YouTube', clicks: 80, color: '#FF0000' },
];

const postTypesData = [
  { name: 'Image', value: 3700, color: '#3B82F6' },
  { name: 'Video', value: 2730, color: '#10B981' },
  { name: 'Link', value: 1470, color: '#F59E0B' },
  { name: 'Text', value: 850, color: '#8B5CF6' },
];

const topPosts = [
  { id: 1, platform: 'LinkedIn', title: 'How AI BOT Calling...', date: '25 Jun 2025', engagements: '1.25K' },
  { id: 2, platform: 'Facebook', title: 'CRMFarm IT & SaaS - ...', date: '18 Jun 2025', engagements: '980' },
  { id: 3, platform: 'LinkedIn', title: 'Increase Sales Productivity...', date: '10 Jun 2025', engagements: '875' },
  { id: 4, platform: 'Instagram', title: 'Automate. Engage. Convert...', date: '22 Jun 2025', engagements: '765' },
  { id: 5, platform: 'X', title: 'CRM Tips for IT Companies...', date: '05 Jun 2025', engagements: '620' },
];

const summaryData = [
  { platform: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-600', posts: 18, reach: '67.8K', engagements: '4.73K', clicks: '1.12K', shares: 324, leads: 85, rate: '6.98%' },
  { platform: 'Facebook', icon: FaFacebook, color: 'text-blue-500', posts: 14, reach: '27.3K', engagements: '1.90K', clicks: 620, shares: 152, leads: 38, rate: '6.96%' },
  { platform: 'Instagram', icon: FaInstagram, color: 'text-pink-600', posts: 10, reach: '18.6K', engagements: '1.37K', clicks: 340, shares: 78, leads: 21, rate: '7.37%' },
  { platform: 'X (Twitter)', icon: FaTwitter, color: 'text-gray-800', posts: 4, reach: '7.2K', engagements: '0.54K', clicks: 180, shares: 22, leads: 6, rate: '7.50%' },
  { platform: 'YouTube', icon: FaYoutube, color: 'text-red-600', posts: 2, reach: '4.7K', engagements: '0.21K', clicks: 80, shares: 10, leads: 2, rate: '4.47%' },
];

export default function SocialMediaReportPage() {
  const [dateRange, setDateRange] = useState('01 Jun 2025 - 30 Jun 2025');

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-5 pb-20 font-sans text-gray-800 text-sm">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Social Media Report</h1>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Track your social media performance and engagement</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2.5 py-1.5 shadow-sm text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{dateRange}</span>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded px-2.5 py-1.5 shadow-sm text-xs font-medium transition-colors">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span>Filters</span>
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded px-2.5 py-1.5 shadow-sm text-xs font-medium transition-colors">
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* METRICS GRID - Updated breakpoints for better fit */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 mb-5">
        <MetricCard title="Total Posts" value="48" growth="+20.0%" isPositive={true} icon={<Send className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" />
        <MetricCard title="Total Reach" value="125.6K" growth="+28.4%" isPositive={true} icon={<Users className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-50" />
        <MetricCard title="Engagements" value="8.75K" growth="+32.7%" isPositive={true} icon={<ThumbsUp className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" />
        <MetricCard title="Clicks" value="2.34K" growth="+18.6%" isPositive={true} icon={<MousePointerClick className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" />
        <MetricCard title="Shares" value="586" growth="+15.2%" isPositive={true} icon={<Share2 className="w-5 h-5 text-cyan-500" />} iconBg="bg-cyan-50" />
        <MetricCard title="Leads Generated" value="152" growth="+26.7%" isPositive={true} icon={<Target className="w-5 h-5 text-pink-500" />} iconBg="bg-pink-50" />
      </div>

      {/* MAIN CONTENT GRID - Switched to xl for responsive split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        
        {/* LEFT/MIDDLE CHARTS (Span 2) */}
        <div className="xl:col-span-2 space-y-5">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* REACH OVER TIME */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Reach Over Time</h3>
                <select className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-1 outline-none">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reachData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} tickFormatter={(v) => `${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="reach" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" activeDot={{ r: 5, strokeWidth: 0, fill: '#3B82F6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ENGAGEMENT BY PLATFORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Engagement by Platform</h3>
              <div className="flex h-56 items-center">
                <div className="w-[55%] h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformEngagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {platformEngagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{fontSize: '12px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-gray-800 leading-none">8.75K</span>
                    <span className="text-[10px] text-gray-500 mt-1">Total</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="w-[45%] pl-2 flex flex-col justify-center gap-2">
                  {platformEngagementData.map((item, i) => {
                    const total = 8750;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={i} className="flex flex-col text-[11px] leading-tight">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600 truncate">{item.name}</span>
                        </div>
                        <div className="pl-3.5 text-gray-400">
                          {percent}% ({(item.value / 1000).toFixed(2)}K)
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEAD GENERATION TREND */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
               <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Lead Generation</h3>
                <select className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 outline-none">
                  <option>Daily</option>
                </select>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadTrendData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <Tooltip contentStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CLICKS BY PLATFORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Clicks by Platform</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clicksData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} width={65} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{fontSize: '12px'}} />
                    <Bar dataKey="clicks" radius={[0, 3, 3, 0]} barSize={10}>
                      {clicksData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* POST TYPES PERFORMANCE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Post Types</h3>
              <div className="flex flex-col h-40 justify-center">
                <div className="flex items-center h-full gap-1">
                  <div className="w-[55%] h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={postTypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {postTypesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{fontSize: '12px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold text-gray-800">8.75K</span>
                    </div>
                  </div>
                  
                  <div className="w-[45%] flex flex-col gap-1.5 justify-center">
                    {postTypesData.map((item, i) => {
                      const total = 8750;
                      const percent = ((item.value / total) * 100).toFixed(0);
                      return (
                        <div key={i} className="flex flex-col text-[10px] leading-tight">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-600 font-medium truncate">{item.name}</span>
                          </div>
                          <span className="text-gray-400 pl-2.5">{percent}% ({(item.value / 1000).toFixed(1)}K)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* SUMMARY TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Social Media Summary</h3>
            <table className="w-full text-[11px] text-left whitespace-nowrap">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium text-right">Total Posts</th>
                  <th className="px-3 py-2 font-medium text-right">Reach</th>
                  <th className="px-3 py-2 font-medium text-right">Engagements</th>
                  <th className="px-3 py-2 font-medium text-right">Clicks</th>
                  <th className="px-3 py-2 font-medium text-right">Shares</th>
                  <th className="px-3 py-2 font-medium text-right">Leads</th>
                  <th className="px-3 py-2 font-medium text-right">Eng. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 flex items-center gap-1.5">
                      <row.icon className={`w-3.5 h-3.5 ${row.color}`} />
                      <span className="font-medium text-gray-700">{row.platform}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.posts}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.reach}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.engagements}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.clicks}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.shares}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.leads}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold text-gray-800 border-y border-gray-100">
                <tr>
                  <td className="px-3 py-2.5">Total</td>
                  <td className="px-3 py-2.5 text-right">48</td>
                  <td className="px-3 py-2.5 text-right">125.6K</td>
                  <td className="px-3 py-2.5 text-right">8.75K</td>
                  <td className="px-3 py-2.5 text-right">2.34K</td>
                  <td className="px-3 py-2.5 text-right">586</td>
                  <td className="px-3 py-2.5 text-right">152</td>
                  <td className="px-3 py-2.5 text-right">6.97%</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        {/* RIGHT PANELS (Span 1) */}
        <div className="space-y-5">
          
          {/* TOP PERFORMING POSTS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Top Performing Posts</h3>
            <div className="space-y-3">
              {topPosts.map((post) => {
                let PlatformIcon = FaLinkedin;
                let iconColor = 'text-blue-600';
                if (post.platform === 'Facebook') { PlatformIcon = FaFacebook; iconColor = 'text-blue-500'; }
                if (post.platform === 'Instagram') { PlatformIcon = FaInstagram; iconColor = 'text-pink-600'; }
                if (post.platform === 'X') { PlatformIcon = FaTwitter; iconColor = 'text-gray-800'; }
                
                return (
                  <div key={post.id} className="flex items-start gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <div className="w-9 h-9 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <PlatformIcon className={`w-2.5 h-2.5 ${iconColor}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{post.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{post.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-800">{post.engagements}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Engagements</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="mt-3 flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View All Posts <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* INSIGHTS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Your reach increased by <span className="font-semibold text-emerald-600">28.4%</span><br/>
                    <span className="text-gray-500 text-[11px]">Great job! Your content is reaching more people.</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold text-blue-600">LinkedIn</span> is your top performing platform this month.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <PlaySquare className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold text-purple-600">Video posts get 2.1x more</span> engagement than other post types.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold text-orange-600">152 new leads</span> generated from social media this month.
                  </p>
                </div>
              </div>
            </div>
            
            <button className="mt-4 flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View Detailed Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-component for Top Metric Cards
function MetricCard({ title, value, growth, isPositive, icon, iconBg }: { title: string, value: string, growth: string, isPositive: boolean, icon: React.ReactNode, iconBg: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="text-right ml-2 min-w-0">
          <p className="text-[11px] text-gray-500 font-medium truncate">{title}</p>
          <h2 className="text-lg font-bold text-gray-800 leading-tight mt-0.5">{value}</h2>
        </div>
      </div>
      <div className="mt-auto text-right">
        <span className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {growth}
        </span>
        <span className="text-[9px] text-gray-400 ml-1">vs May 2025</span>
      </div>
    </div>
  );
}

