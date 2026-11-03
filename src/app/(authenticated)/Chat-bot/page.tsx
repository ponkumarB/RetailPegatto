'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  Bot, Send, Plus, MoreVertical, Paperclip, Smile, Code, Maximize2, 
  Info, Shield, Zap, FileText, Calendar, Users, BarChart2,
  Copy, BarChart, Download, Check, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type MessageType = {
  id: number;
  type: 'bot' | 'user';
  text?: string;
  time: string;
  isTable?: boolean;
  isChart?: boolean;
  isLeadCreate?: boolean;
};

export default function ChatBotPage() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const donutChartOptions: any = {
    chart: { type: 'donut', fontFamily: 'inherit', background: 'transparent' },
    labels: ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Other'],
    colors: ['#3b82f6', '#84cc16', '#ef4444', '#ec4899', '#1e1b4b'],
    plotOptions: {
      pie: {
        donut: { size: '65%' }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { show: false }, 
    tooltip: {
      theme: 'light',
      y: { formatter: (val: number) => `${val} leads` }
    }
  };

  const donutChartSeries = [42, 36, 28, 24, 22];

  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      type: 'bot',
      text: "Hello! 👋\nI'm your CRMFarm IT Assistant. I can help you with information about your CRM, data, reports, documents, and more.\nHow can I assist you today?",
      time: "10:29 AM"
    },
    {
      id: 2,
      type: 'user',
      text: "Show me the total number of leads this month.",
      time: "10:30 AM"
    },
    {
      id: 3,
      type: 'bot',
      isTable: true,
      time: "10:30 AM"
    },
    {
      id: 4,
      type: 'user',
      text: "Show me leads by source in a chart.",
      time: "10:31 AM"
    },
    {
      id: 5,
      type: 'bot',
      isChart: true,
      time: "10:31 AM"
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const newUserMsg: MessageType = {
      id: Date.now(),
      type: 'user',
      text: message,
      time: timeString
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    const userText = message;
    setMessage('');
    
    try {
      // 1. Send the HTTP POST request to the Rasa REST Channel
      const response = await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: "user1", 
          message: userText
        })
      });

      const data = await response.json();
      
      // 2. Process Rasa's response
      if (data && data.length > 0) {
        data.forEach((botMsg: any, index: number) => {
          setTimeout(() => {
             let botResponse: MessageType = {
                id: Date.now() + index + 1,
                type: 'bot',
                text: botMsg.text,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
             };

             // We can intercept the Rasa response to trigger specific UI logic
             // For example, if the user was asking to create a lead, we append the button!
             if (userText.toLowerCase().includes('create') && userText.toLowerCase().includes('lead')) {
                botResponse.isLeadCreate = true;
             }

             setMessages(prev => [...prev, botResponse]);
          }, index * 500); // Slight delay if Rasa returns multiple messages
        });
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: "Sorry, I didn't get any response from the AI.",
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }
    } catch (error) {
      console.error("Error communicating with Rasa:", error);
      
      // 3. Fallback logic if your Rasa server isn't running yet so the UI doesn't completely break
      setTimeout(() => {
        let fallbackMsg: MessageType = {
          id: Date.now() + 1,
          type: 'bot',
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        const userTextLower = userText.toLowerCase();
        if (userTextLower.includes('create') && userTextLower.includes('lead')) {
          fallbackMsg.isLeadCreate = true;
          fallbackMsg.text = "[Fallback mode - Rasa server is offline]\n\nHere are the steps to create a lead:\n1. Go to the Leads section.\n2. Click 'Create'.";
        } else {
          fallbackMsg.text = "Connection to Rasa server (localhost:5005) failed. Please make sure you start your Rasa backend with:\n`rasa run --enable-api --cors \"*\"`";
        }
        setMessages(prev => [...prev, fallbackMsg]);
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col bg-slate-50 dark:bg-slate-950"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 shrink-0">
        <div className="h-12 w-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ChatBot Assistant</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Get instant answers and assistance from your AI assistant</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        
        {/* Main Chat Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-0">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">CRMFarm AI Assistant</h2>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 gap-2 border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-lg shadow-sm">
                <Plus className="h-4 w-4" /> New Chat
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                
                {msg.type === 'bot' && (
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500 shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                {msg.type === 'user' ? (
                  <div className="bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-[85%]">
                    <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-green-700/70 dark:text-green-300/70 font-bold">
                      {msg.time} <Check className="h-3 w-3" />
                    </div>
                  </div>
                ) : (
                  <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[85%] ${msg.isTable || msg.isChart ? 'w-full sm:w-[500px]' : ''}`}>
                    
                    {/* Regular Text Response */}
                    {msg.text && (
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {/* Lead Creation Workflow Button */}
                    {msg.isLeadCreate && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <Link href="/marketing/leads/create" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm shadow-blue-500/25">
                          Open Lead Creation Form <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}

                    {/* Table Render (Mock) */}
                    {msg.isTable && (
                      <>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Here's the summary of leads for this month (May 2024):</p>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-900/50">
                          <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Leads</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">152</span>
                          </div>
                          <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">New Leads</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">98</span>
                          </div>
                          <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Contacted</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">36</span>
                          </div>
                          <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Qualified</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">12</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Converted</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">6</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Chart Render (Mock) */}
                    {msg.isChart && (
                      <>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-4">Leads by Source (This Month)</p>
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
                          <div className="h-[180px] w-[180px] shrink-0">
                            <Chart options={donutChartOptions} series={donutChartSeries} type="donut" height={180} />
                          </div>
                          <div className="flex-1 space-y-3 w-full">
                            {[
                              { label: 'Website', val: 42, pct: '27.6%', color: 'bg-blue-500' },
                              { label: 'Referral', val: 36, pct: '23.7%', color: 'bg-lime-500' },
                              { label: 'Social Media', val: 28, pct: '18.4%', color: 'bg-rose-500' },
                              { label: 'Email Campaign', val: 24, pct: '15.8%', color: 'bg-pink-500' },
                              { label: 'Other', val: 22, pct: '14.5%', color: 'bg-indigo-900' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}></span>
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-900 dark:text-white">{item.val} ({item.pct})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-2">
                      {msg.time}
                      {(msg.isTable || msg.isChart) && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Copy className="h-3.5 w-3.5" /></Button>
                          {msg.isTable && <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><BarChart className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Download className="h-3.5 w-3.5" /></Button>
                          {msg.isChart && <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Maximize2 className="h-3.5 w-3.5" /></Button>}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
              <input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-transparent border-0 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800">
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSend} className="h-9 px-4 gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm cursor-pointer transition-transform active:scale-95">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-6 flex flex-col min-h-0 overflow-y-auto pr-1">
          
          {/* About Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">About AI Assistant</h3>
            
            <div className="flex items-start gap-3 mb-5">
              <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Your AI assistant for CRM. Ask me how to create leads, fetch reports, or analyze your data!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Info className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">24/7 Instant Support</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Get answers anytime you need them</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Secure & Private</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Your data is safe and confidential</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Zap className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Smart & Contextual</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Answers based on your CRM data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: Users, label: 'How to create a lead?', action: () => { setMessage('How do I create a lead?'); } },
                { icon: BarChart2, label: 'Summarize My Dashboard', action: () => { setMessage('Summarize My Dashboard'); } },
                { icon: Calendar, label: "Today's Activities", action: () => { setMessage("Today's Activities"); } },
                { icon: FileText, label: 'Open Reports', action: () => { setMessage('Open Reports'); } }
              ].map((actionItem, i) => (
                <button key={i} onClick={actionItem.action} className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors text-left cursor-pointer group">
                  <actionItem.icon className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-green-800 dark:group-hover:text-green-200">{actionItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Conversations</h3>
              <button className="text-[11px] font-bold text-blue-600 hover:underline">View all</button>
            </div>
            
            <div className="space-y-4">
              {[
                { text: 'Show me the total number of leads this month.', time: '10:30 AM' },
                { text: 'What are my upcoming meetings today?', time: 'Yesterday' },
                { text: 'Show me the sales pipeline summary.', time: 'May 18' },
                { text: 'Top 5 deals by value.', time: 'May 17' },
                { text: 'How many contacts were added this week?', time: 'May 16' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between gap-3 group cursor-pointer">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 transition-colors">{item.text}</p>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
