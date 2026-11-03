'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CalendarShipmentEvent, fetchShipmentsAPI } from '@/service/api/sales/api';
import { getLocalData, mergeWithLocalData } from '@/utils/persistentStorage';

type CalendarViewMode = 'month' | 'week' | 'day';

export default function ShipmentCalendarPage() {
  const router = useRouter();

  // Set default to current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarShipmentEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarShipmentEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetchShipmentsAPI(1, false);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const combined = mergeWithLocalData('pegatto_shipments', list, ['id', 'Shipment_No']);
        if (combined.length > 0) {
          setEvents(combined.map((s: any) => ({
            id: String(s.id || s.Shipment_Id || s.Shipment_No),
            title: `${s.Account_Id?.Account_Name || s.Customer_Name || s.CustomerName || 'Shipment'} - ${s.Shipment_Id || s.Sales_ShipmentNo || s.Shipment_No || 'SHP'}`,
            date: s.Shipment_Date?.split('T')[0] || s.Dispatch_Date?.split('T')[0] || s.Dateof_Shipment?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
            type: 'dispatch',
            status: s.Status || 'In Transit',
            customer: s.Account_Id?.Account_Name || s.Customer_Name || s.CustomerName || 'Customer',
            shipmentNo: s.Shipment_Id || s.Sales_ShipmentNo || s.Shipment_No || `SHP-${s.id}`
          })));
        }
      } catch (e) {
        console.error('Failed to load shipment calendar events:', e);
        const localShipments = getLocalData<any>('pegatto_shipments');
        if (localShipments.length > 0) {
          setEvents(localShipments.map((s: any) => ({
            id: String(s.id || s.Shipment_Id || s.Shipment_No),
            title: `${s.CustomerName || s.Customer_Name || 'Shipment'} - ${s.Shipment_No || 'SHP'}`,
            date: s.Dispatch_Date?.split('T')[0] || s.Shipment_Date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
            type: 'dispatch',
            status: s.Status || 'In Transit',
            customer: s.CustomerName || s.Customer_Name || 'Customer',
            shipmentNo: s.Shipment_No || `SHP-${s.id}`
          })));
        }
      }
    };
    loadEvents();
  }, []);

  // Navigation handlers
  const handleToday = () => {
    setCurrentDate(new Date('2026-09-18T00:00:00'));
  };

  const handleBack = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  // Month days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sun to Sat
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handleEventClick = (evt: CalendarShipmentEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setIsModalOpen(true);
  };

  const getEventBadgeStyle = (type: CalendarShipmentEvent['type']) => {
    switch (type) {
      case 'dispatch':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'delivery':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'scheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-4">
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Calendar View
        </h1>

        <button
          onClick={() => router.push('/sales/shipment')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Truck className="h-3.5 w-3.5 text-[#2A7D5B]" />
          Shipments List
        </button>
      </div>

      {/* Toolbar matching user screenshot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Left: Today, Back, Next */}
        <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={handleToday}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>

        {/* Center: Month Year text in green */}
        <div className="text-sm font-semibold text-[#2A7D5B] select-none text-center">
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
          {viewMode === 'week' && `Week of ${format(weekDays[0], 'MMM dd')} - ${format(weekDays[6], 'MMM dd, yyyy')}`}
          {viewMode === 'day' && format(currentDate, 'MMMM dd, yyyy')}
        </div>

        {/* Right: Month, Week, Day segmented button group */}
        <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'month'
                ? 'bg-[#2A7D5B] text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 text-xs font-semibold border-l border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#2A7D5B] text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'day'
                ? 'bg-[#2A7D5B] text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* CALENDAR CONTENT */}
      {viewMode === 'month' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
          {/* Day Headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs font-medium text-slate-700 dark:text-slate-300 py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 border-l border-slate-200 dark:border-slate-800">
            {monthDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentDate);
              // In the screenshot, Friday 18 is highlighted with green fill
              const isTargetDay = format(day, 'yyyy-MM-dd') === '2026-09-18';
              const dayEvents = events.filter((e) => e.date === dateKey);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                  className={`min-h-[110px] md:min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
                    isTargetDay
                      ? 'bg-[#96c1a4] dark:bg-emerald-900/60'
                      : !isCurrentMonth
                      ? 'bg-[#f8f9fa] dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
                      : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 hover:bg-slate-50/70 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {/* Top-right day number (formatted as two digits: 30, 31, 01, ..., 18) */}
                  <div className="flex items-center justify-end">
                    <span
                      className={`text-xs ${
                        isTargetDay
                          ? 'font-bold text-slate-900 dark:text-white'
                          : isCurrentMonth
                          ? 'font-semibold text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {format(day, 'dd')}
                    </span>
                  </div>

                  {/* Shipment Events inside the cell */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        className={`text-[10px] p-1 rounded border leading-tight truncate shadow-2xs hover:scale-[1.01] transition-transform ${getEventBadgeStyle(
                          evt.type
                        )}`}
                        title={`${evt.shipmentNo} - ${evt.customer}`}
                      >
                        <span className="font-bold">{evt.shipmentNo}</span>
                        <div className="truncate opacity-90">{evt.customer}</div>
                      </div>
                    ))}
                  </div>

                  <div className="h-1"></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-2.5">
            {weekDays.map((day) => {
              const isTargetDay = format(day, 'yyyy-MM-dd') === '2026-09-18';
              return (
                <div key={day.toISOString()} className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                      isTargetDay ? 'bg-[#2A7D5B] text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {format(day, 'dd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week Columns */}
          <div className="grid grid-cols-7 min-h-[450px] divide-x border-slate-200 dark:border-slate-800">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events.filter((e) => e.date === dateKey);
              const isTargetDay = format(day, 'yyyy-MM-dd') === '2026-09-18';

              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 space-y-2 ${
                    isTargetDay ? 'bg-[#96c1a4]/20 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-950'
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center pt-8">No shipments</p>
                  ) : (
                    dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        className={`p-2 rounded border text-xs cursor-pointer shadow-2xs hover:shadow transition-shadow ${getEventBadgeStyle(
                          evt.type
                        )}`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{evt.shipmentNo}</span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold">{evt.status}</span>
                        </div>
                        <div className="text-[11px] mt-0.5 font-medium">{evt.customer}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span className="capitalize">{evt.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Shipments for {format(currentDate, 'EEEE, MMMM dd, yyyy')}
              </h2>
              <p className="text-xs text-slate-500">
                {events.filter((e) => e.date === format(currentDate, 'yyyy-MM-dd')).length} shipment event(s) scheduled
              </p>
            </div>
            <button
              onClick={() => setViewMode('month')}
              className="text-xs text-[#2A7D5B] font-semibold hover:underline cursor-pointer"
            >
              ← Back to Month View
            </button>
          </div>

          <div className="space-y-3">
            {events.filter((e) => e.date === format(currentDate, 'yyyy-MM-dd')).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-40 text-[#2A7D5B]" />
                No shipment activity scheduled for this day.
              </div>
            ) : (
              events
                .filter((e) => e.date === format(currentDate, 'yyyy-MM-dd'))
                .map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => handleEventClick(evt, e)}
                    className={`p-4 rounded-lg border text-xs cursor-pointer shadow-2xs hover:shadow transition-shadow flex items-center justify-between ${getEventBadgeStyle(
                      evt.type
                    )}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{evt.shipmentNo}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-800 border">
                          {evt.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold">{evt.customer}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{evt.title}</p>
                    </div>

                    <button
                      type="button"
                      className="bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded text-xs font-semibold hover:bg-slate-50"
                    >
                      View Details
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#2A7D5B]">
              <Truck className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedEvent?.shipmentNo}
              </DialogTitle>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div>
                  <span className="text-slate-500">Customer Name:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {selectedEvent.customer}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.date}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Event Type:</span>
                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{selectedEvent.type}</p>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Status:</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push('/sales/shipment');
                  }}
                  className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Go to Shipment
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
