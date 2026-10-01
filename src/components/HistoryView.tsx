import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Download, 
  Search, 
  X, 
  Calendar, 
  Clock, 
  Trash2, 
  FileVideo, 
  Image as ImageIcon,
  User,
  Building,
  RotateCcw,
  Table as TableIcon,
  LayoutGrid,
  Eye,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { PackRecord } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface HistoryViewProps {
  records: PackRecord[];
  onClearHistory: () => void;
  onDeleteRecord?: (id: string) => void;
  onSwitchToConsole?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onClearHistory,
  onDeleteRecord,
  onSwitchToConsole,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<PackRecord | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'calendar'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination State for Table & Cards
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Calendar View State
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Deletion modals state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filters State
  const [searchTracking, setSearchTracking] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'custom'>('all');
  const [customTimeStart, setCustomTimeStart] = useState('');
  const [customTimeEnd, setCustomTimeEnd] = useState('');
  const [selectedPacker, setSelectedPacker] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTracking,
    dateFilter,
    customDate,
    timeFilter,
    customTimeStart,
    customTimeEnd,
    selectedPacker,
    selectedStation,
    pageSize
  ]);

  // Extract unique packers and stations
  const uniquePackers = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      const name = r.operatorName || r.operatorId || 'ไม่ระบุ';
      map.set(name, name);
    });
    return Array.from(map.keys());
  }, [records]);

  const uniqueStations = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.stationId) set.add(r.stationId);
    });
    return Array.from(set);
  }, [records]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTracking('');
    setDateFilter('all');
    setCustomDate('');
    setTimeFilter('all');
    setCustomTimeStart('');
    setCustomTimeEnd('');
    setSelectedPacker('all');
    setSelectedStation('all');
    setCurrentPage(1);
  };

  const isFilterActive = 
    searchTracking.trim() !== '' || 
    dateFilter !== 'all' || 
    customDate !== '' || 
    timeFilter !== 'all' || 
    customTimeStart !== '' || 
    customTimeEnd !== '' || 
    selectedPacker !== 'all' || 
    selectedStation !== 'all';

  // Filtered records
  const filteredRecords = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return records.filter((r) => {
      const recDateObj = new Date(r.timestamp);
      const recDateStr = recDateObj.toISOString().split('T')[0];
      const hours = recDateObj.getHours();
      const minutes = recDateObj.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      // 1. Search by Tracking Number
      if (searchTracking.trim()) {
        const query = searchTracking.trim().toLowerCase();
        if (!r.trackingNumber.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Filter by Date
      if (dateFilter === 'today') {
        if (recDateStr !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        if (recDateStr !== yesterdayStr) return false;
      } else if (dateFilter === 'week') {
        if (recDateObj < sevenDaysAgo) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (recDateStr !== customDate) return false;
      }

      // 3. Filter by Time
      if (timeFilter === 'morning') {
        if (hours < 6 || hours >= 12) return false;
      } else if (timeFilter === 'afternoon') {
        if (hours < 12 || hours >= 18) return false;
      } else if (timeFilter === 'evening') {
        if (hours < 18) return false;
      } else if (timeFilter === 'custom') {
        if (customTimeStart) {
          const [sH, sM] = customTimeStart.split(':').map(Number);
          if (timeInMinutes < sH * 60 + sM) return false;
        }
        if (customTimeEnd) {
          const [eH, eM] = customTimeEnd.split(':').map(Number);
          if (timeInMinutes > eH * 60 + eM) return false;
        }
      }

      // 4. Filter by Packer
      if (selectedPacker !== 'all') {
        const pName = r.operatorName || r.operatorId || 'ไม่ระบุ';
        if (pName !== selectedPacker) return false;
      }

      // 5. Filter by Station
      if (selectedStation !== 'all') {
        if (r.stationId !== selectedStation) return false;
      }

      return true;
    });
  }, [
    records, 
    searchTracking, 
    dateFilter, 
    customDate, 
    timeFilter, 
    customTimeStart, 
    customTimeEnd, 
    selectedPacker, 
    selectedStation
  ]);

  // Paginated records for Table & Cards
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, safeCurrentPage, pageSize]);

  // Copy tracking number
  const handleCopyTracking = (tracking: string, id: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['ลำดับ', 'วันที่', 'เวลา', 'เลขพัสดุ', 'ขนส่ง', 'ผู้แพ็ค', 'โต๊ะ', 'เวลาแพ็ค(วินาที)', 'สถานะ'];
    const rows = filteredRecords.map((r, idx) => {
      const d = new Date(r.timestamp);
      return [
        idx + 1,
        d.toLocaleDateString('th-TH'),
        d.toLocaleTimeString('th-TH'),
        `"${r.trackingNumber}"`,
        `"${r.courier.name}"`,
        `"${r.operatorName || r.operatorId || 'ไม่ระบุ'}"`,
        `"${r.stationId}"`,
        r.durationSec,
        r.uploadStatus === 'success' ? 'สำเร็จ' : 'ล้มเหลว'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `packing_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // Calendar Computation
  // -------------------------------------------------------------
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // First day of current month (0: Sun, 1: Mon, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Days in current month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Mapping of date string -> PackRecord[]
    const dateRecordsMap = new Map<string, PackRecord[]>();
    filteredRecords.forEach((r) => {
      const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
      const list = dateRecordsMap.get(dateStr) || [];
      list.push(r);
      dateRecordsMap.set(dateStr, list);
    });

    interface DayCell {
      dateNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      records: PackRecord[];
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cells: DayCell[] = [];

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const dObj = new Date(year, month - 1, dNum);
      const dStr = dObj.toISOString().split('T')[0];
      cells.push({
        dateNumber: dNum,
        dateString: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        records: dateRecordsMap.get(dStr) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dObj = new Date(year, month, d);
      const dStr = dObj.toISOString().split('T')[0];
      cells.push({
        dateNumber: d,
        dateString: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        records: dateRecordsMap.get(dStr) || [],
      });
    }

    // Next month leading days to complete the 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const dObj = new Date(year, month + 1, n);
      const dStr = dObj.toISOString().split('T')[0];
      cells.push({
        dateNumber: n,
        dateString: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        records: dateRecordsMap.get(dStr) || [],
      });
    }

    return cells;
  }, [calendarMonth, filteredRecords]);

  // Records for selected calendar date
  const selectedDateRecords = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return filteredRecords.filter((r) => {
      const dStr = new Date(r.timestamp).toISOString().split('T')[0];
      return dStr === selectedCalendarDate;
    });
  }, [filteredRecords, selectedCalendarDate]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCalendarMonth(now);
    setSelectedCalendarDate(now.toISOString().split('T')[0]);
  };

  // Month year Thai format
  const monthYearLabel = calendarMonth.toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f06b4b] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                ประวัติการแพ็ค
              </h2>
              <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                {filteredRecords.length} / {records.length} รายการ
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              ค้นหาและตรวจดูหลักฐานการแพ็คพัสดุ
            </p>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Table, Cards, Calendar */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-slate-800'
              }`}
              title="มุมมองตาราง"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-slate-800'
              }`}
              title="มุมมองการ์ด"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-slate-800'
              }`}
              title="มุมมองปฏิทิน"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ปฏิทิน</span>
            </button>
          </div>

          {/* Export CSV Button */}
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5 shadow-2xs"
              title="ดาวน์โหลดไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>ส่งออก CSV</span>
            </button>
          )}

          {/* Clear All Button */}
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="h-8 px-3 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 text-xs font-medium transition inline-flex items-center gap-1.5"
              title="ลบประวัติการแพ็คทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างทั้งหมด</span>
            </button>
          )}

          {/* Switch to Console Button */}
          {onSwitchToConsole && (
            <button
              type="button"
              onClick={onSwitchToConsole}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ไปหน้าแพ็ค</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Row 1: Search + Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Tracking Search Input */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              placeholder="ค้นหาเลขพัสดุ..."
              className="w-full h-8.5 pl-8 pr-7 text-xs font-mono font-medium rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#f06b4b] focus:border-[#f06b4b] text-slate-800 placeholder:font-sans placeholder:text-stone-400"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTracking && (
              <button
                type="button"
                onClick={() => setSearchTracking('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Packer Filter */}
          <div className="sm:col-span-3 relative">
            <select
              value={selectedPacker}
              onChange={(e) => setSelectedPacker(e.target.value)}
              className="w-full h-8.5 pl-7 pr-4 text-xs font-medium rounded-lg border border-stone-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#f06b4b] focus:border-[#f06b4b] appearance-none cursor-pointer"
            >
              <option value="all">ผู้แพ็คทั้งหมด</option>
              {uniquePackers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Station Filter */}
          <div className="sm:col-span-3 relative">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full h-8.5 pl-7 pr-4 text-xs font-medium rounded-lg border border-stone-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#f06b4b] focus:border-[#f06b4b] appearance-none cursor-pointer"
            >
              <option value="all">ทุกโต๊ะแพ็ค</option>
              {uniqueStations.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <Building className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Date, Time & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-stone-100">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Pill Group */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#f06b4b]" /> วันที่:
              </span>
              {(['all', 'today', 'yesterday', 'week', 'custom'] as const).map((key) => {
                const labels: Record<string, string> = {
                  all: 'ทั้งหมด',
                  today: 'วันนี้',
                  yesterday: 'เมื่อวาน',
                  week: '7 วัน',
                  custom: 'เลือกวัน',
                };
                const active = dateFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateFilter(key)}
                    className={`h-7 px-2.5 rounded-md text-xs transition ${
                      active 
                        ? 'bg-[#f06b4b] text-white font-semibold shadow-2xs' 
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-7 px-2 text-xs rounded-md border border-stone-300 bg-white font-mono focus:border-[#f06b4b] outline-none"
                />
              )}
            </div>

            {/* Time Pill Group */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" /> เวลา:
              </span>
              {(['all', 'morning', 'afternoon', 'evening', 'custom'] as const).map((key) => {
                const labels: Record<string, string> = {
                  all: 'ทั้งหมด',
                  morning: 'เช้า',
                  afternoon: 'บ่าย',
                  evening: 'ค่ำ',
                  custom: 'เลือกเวลา',
                };
                const active = timeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimeFilter(key)}
                    className={`h-7 px-2.5 rounded-md text-xs transition ${
                      active 
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs' 
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}

              {timeFilter === 'custom' && (
                <div className="flex items-center gap-1 bg-white h-7 px-2 rounded-md border border-stone-300">
                  <input
                    type="time"
                    value={customTimeStart}
                    onChange={(e) => setCustomTimeStart(e.target.value)}
                    className="text-xs font-mono outline-none"
                  />
                  <span className="text-stone-400">-</span>
                  <input
                    type="time"
                    value={customTimeEnd}
                    onChange={(e) => setCustomTimeEnd(e.target.value)}
                    className="text-xs font-mono outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reset Filters */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-7 px-2.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition inline-flex items-center gap-1"
              title="ล้างเงื่อนไขตัวกรอง"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}

        </div>
      </div>

      {/* 3. Content Area: Table View | Cards View | Calendar View */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 py-16 px-4 text-center shadow-xs">
          <History className="w-10 h-10 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-800">
            {isFilterActive ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีประวัติการแพ็ค'}
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {isFilterActive 
              ? 'ลองปรับเปลี่ยนเงื่อนไขวันที่ เวลา หรือคำค้นหาเลขพัสดุ' 
              : 'เมื่อสแกนพัสดุและบันทึกวิดีโอสำเร็จ หลักฐานจะแสดงในรายการนี้ทันที'}
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ================= TABLE VIEW ================= */
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="w-12 px-3 py-2.5 text-center">#</th>
                    <th className="w-28 px-3 py-2.5">เวลา</th>
                    <th className="px-3 py-2.5">เลขพัสดุ</th>
                    <th className="px-3 py-2.5">ขนส่ง</th>
                    <th className="px-3 py-2.5">ผู้แพ็ค</th>
                    <th className="w-20 px-3 py-2.5">โต๊ะ</th>
                    <th className="w-20 px-3 py-2.5">เวลาแพ็ค</th>
                    <th className="w-20 px-3 py-2.5">สถานะ</th>
                    <th className="w-24 px-3 py-2.5 text-center">หลักฐาน</th>
                    <th className="w-32 px-3 py-2.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-slate-700">
                  {paginatedRecords.map((rec, index) => {
                    const recDate = new Date(rec.timestamp);
                    const dateStr = recDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                    const timeStr = recDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    const isCopied = copiedId === rec.id;
                    const itemNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                    return (
                      <tr 
                        key={rec.id} 
                        className="hover:bg-orange-50/30 transition group"
                      >
                        {/* 1. Index */}
                        <td className="px-3 py-2.5 text-center text-stone-400 font-mono text-[11px]">
                          {itemNumber}
                        </td>

                        {/* 2. Time */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 text-xs block leading-tight">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-stone-400 block leading-tight mt-0.5">
                            {dateStr}
                          </span>
                        </td>

                        {/* 3. Tracking Number */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                              {rec.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(rec.trackingNumber, rec.id)}
                              className="p-1 rounded text-stone-400 hover:text-slate-700 hover:bg-stone-100 transition"
                              title="คัดลอกเลขพัสดุ"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* 4. Courier */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${rec.courier.badgeBg}`}>
                            {rec.courier.name}
                          </span>
                        </td>

                        {/* 5. Packer */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-medium text-slate-800 text-xs">
                            {rec.operatorName || rec.operatorId || 'ไม่ระบุ'}
                          </span>
                        </td>

                        {/* 6. Station */}
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-stone-600 text-xs">
                          {rec.stationId}
                        </td>

                        {/* 7. Duration */}
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-stone-600 text-xs">
                          {rec.durationSec}s
                        </td>

                        {/* 8. Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {rec.uploadStatus === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> สำเร็จ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> ล้มเหลว
                            </span>
                          )}
                        </td>

                        {/* 9. Proof preview */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {rec.imageBlobUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="inline-block relative rounded-md overflow-hidden border border-stone-200 hover:scale-105 transition"
                              title="ดูรูปหลักฐาน"
                            >
                              <img
                                src={rec.imageBlobUrl}
                                alt="Proof"
                                className="w-10 h-7 object-cover"
                              />
                            </button>
                          ) : rec.videoBlobUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-purple-50 text-purple-600 border border-purple-200"
                              title="ดูวิดีโอ"
                            >
                              <FileVideo className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-stone-300 text-[10px]">-</span>
                          )}
                        </td>

                        {/* 10. Actions */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            {/* Inspect / View */}
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="h-7 px-2 rounded-md bg-stone-100 hover:bg-[#f06b4b] hover:text-white text-stone-700 text-xs font-semibold transition inline-flex items-center gap-1"
                              title="ดูหลักฐานเต็ม"
                            >
                              <Eye className="w-3 h-3" />
                              <span>ดู</span>
                            </button>

                            {/* Download Video */}
                            {rec.videoBlobUrl && (
                              <a
                                href={rec.videoBlobUrl}
                                download={`${rec.trackingNumber}_video.webm`}
                                className="h-7 px-2 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition inline-flex items-center gap-1"
                                title="โหลดวิดีโอ"
                              >
                                <FileVideo className="w-3 h-3 text-stone-500" />
                                <span className="hidden sm:inline">คลิป</span>
                              </a>
                            )}

                            {/* Download Photo */}
                            {rec.imageBlobUrl && (
                              <a
                                href={rec.imageBlobUrl}
                                download={`${rec.trackingNumber}_proof.jpg`}
                                className="h-7 px-2 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition inline-flex items-center gap-1"
                                title="โหลดรูป"
                              >
                                <ImageIcon className="w-3 h-3 text-stone-500" />
                                <span className="hidden sm:inline">ภาพ</span>
                              </a>
                            )}

                            {/* Delete */}
                            {onDeleteRecord && (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(rec.id)}
                                className="h-7 w-7 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition inline-flex items-center justify-center"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <PaginationBar 
            total={filteredRecords.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW ================= */
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedRecords.map((rec) => {
              const recDate = new Date(rec.timestamp);
              const dateStr = recDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
              const timeStr = recDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              const isCopied = copiedId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${rec.courier.badgeBg}`}>
                          {rec.courier.name}
                        </span>
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono">
                          {rec.stationId}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {rec.durationSec}s
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-sm truncate">
                          {rec.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(rec.trackingNumber, rec.id)}
                          className="p-1 rounded text-stone-400 hover:text-slate-700 hover:bg-stone-100 transition shrink-0"
                          title="คัดลอก"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                        <span>ผู้แพ็ค: {rec.operatorName || 'ไม่ระบุ'}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{dateStr} {timeStr}</span>
                      </div>
                    </div>

                    {rec.imageBlobUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(rec)}
                        className="shrink-0 rounded-lg overflow-hidden border border-stone-200"
                      >
                        <img
                          src={rec.imageBlobUrl}
                          alt="Proof"
                          className="w-14 h-11 object-cover"
                        />
                      </button>
                    )}
                  </div>

                  {/* Card Action bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(rec)}
                      className="h-7 px-2.5 rounded-md bg-stone-100 hover:bg-[#f06b4b] hover:text-white text-stone-700 text-xs font-semibold transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูหลักฐาน</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {rec.videoBlobUrl && (
                        <a
                          href={rec.videoBlobUrl}
                          download={`${rec.trackingNumber}_video.webm`}
                          className="h-7 px-2 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs transition inline-flex items-center gap-1"
                          title="โหลดคลิป"
                        >
                          <FileVideo className="w-3 h-3" />
                        </a>
                      )}
                      {rec.imageBlobUrl && (
                        <a
                          href={rec.imageBlobUrl}
                          download={`${rec.trackingNumber}_proof.jpg`}
                          className="h-7 px-2 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs transition inline-flex items-center gap-1"
                          title="โหลดภาพ"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </a>
                      )}
                      {onDeleteRecord && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(rec.id)}
                          className="h-7 w-7 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition inline-flex items-center justify-center"
                          title="ลบ"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <PaginationBar 
            total={filteredRecords.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      ) : (
        /* ================= CALENDAR VIEW ================= */
        <div className="flex flex-col gap-4">
          
          {/* Calendar Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-slate-700 transition"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight min-w-[130px] text-center capitalize">
                  {monthYearLabel}
                </h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-slate-700 transition"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="h-8 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-slate-700 text-xs font-semibold transition"
                >
                  วันนี้
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-stone-400 mb-1.5 uppercase">
              <div className="text-rose-500 py-1">อา.</div>
              <div className="py-1">จ.</div>
              <div className="py-1">อ.</div>
              <div className="py-1">พ.</div>
              <div className="py-1">พฤ.</div>
              <div className="py-1">ศ.</div>
              <div className="text-sky-600 py-1">ส.</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day, idx) => {
                const isSelected = selectedCalendarDate === day.dateString;
                const count = day.records.length;

                return (
                  <button
                    key={`${day.dateString}-${idx}`}
                    type="button"
                    onClick={() => setSelectedCalendarDate(day.dateString)}
                    className={`min-h-[60px] sm:min-h-[74px] p-1.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#f06b4b] bg-orange-50/40 ring-2 ring-[#f06b4b]/20 shadow-2xs'
                        : day.isCurrentMonth
                        ? 'border-stone-200/80 bg-white hover:bg-stone-50/80'
                        : 'border-stone-100 bg-stone-50/40 text-stone-300 hover:bg-stone-100/50'
                    }`}
                  >
                    {/* Top day number & Today indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold leading-none ${
                          day.isToday
                            ? 'w-5 h-5 rounded-full bg-[#f06b4b] text-white flex items-center justify-center'
                            : day.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-stone-300'
                        }`}
                      >
                        {day.dateNumber}
                      </span>
                    </div>

                    {/* Badge showing pack proof count */}
                    <div className="mt-1">
                      {count > 0 ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#f06b4b]/10 text-[#f06b4b] font-mono font-bold text-[10px] leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f06b4b] inline-block"></span>
                          <span>{count}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-transparent select-none">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#f06b4b]" />
                <h4 className="font-bold text-sm text-slate-900">
                  พัสดุวันที่ {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  {selectedDateRecords.length} ชิ้น
                </span>
              </div>
            </div>

            {selectedDateRecords.length === 0 ? (
              <div className="py-8 text-center text-stone-400">
                <Calendar className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs text-stone-500 font-medium">ไม่มีรายการบันทึกการแพ็คในวันที่เลือก</p>
                <p className="text-[11px] text-stone-400 mt-0.5">คลิกเลือกวันที่ที่มีตัวเลขกำกับเพื่อดูรายการพัสดุ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="w-12 px-3 py-2 text-center">#</th>
                      <th className="w-20 px-3 py-2">เวลา</th>
                      <th className="px-3 py-2">เลขพัสดุ</th>
                      <th className="px-3 py-2">ขนส่ง</th>
                      <th className="px-3 py-2">ผู้แพ็ค</th>
                      <th className="w-16 px-3 py-2">โต๊ะ</th>
                      <th className="w-20 px-3 py-2 text-center">หลักฐาน</th>
                      <th className="w-28 px-3 py-2 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-700 font-medium">
                    {selectedDateRecords.map((rec, idx) => {
                      const recDate = new Date(rec.timestamp);
                      const timeStr = recDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                      const isCopied = copiedId === rec.id;

                      return (
                        <tr key={rec.id} className="hover:bg-orange-50/30 transition">
                          <td className="px-3 py-2 text-center text-stone-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono font-bold text-slate-800 text-xs">
                            {timeStr}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-slate-900 bg-stone-100 px-1.5 py-0.5 rounded text-xs">
                                {rec.trackingNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(rec.trackingNumber, rec.id)}
                                className="p-0.5 text-stone-400 hover:text-slate-700"
                                title="คัดลอก"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${rec.courier.badgeBg}`}>
                              {rec.courier.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            {rec.operatorName || 'ไม่ระบุ'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-stone-500 text-xs">
                            {rec.stationId}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {rec.imageBlobUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(rec)}
                                className="inline-block rounded overflow-hidden border border-stone-200 hover:scale-105 transition"
                              >
                                <img src={rec.imageBlobUrl} alt="Proof" className="w-8 h-6 object-cover" />
                              </button>
                            ) : rec.videoBlobUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(rec)}
                                className="inline-flex items-center justify-center w-7 h-6 rounded bg-purple-50 text-purple-600"
                              >
                                <FileVideo className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="h-6.5 px-2 rounded bg-stone-100 hover:bg-[#f06b4b] hover:text-white text-stone-700 text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>ดู</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Inspection Lightbox Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold text-[#f06b4b]">
                    {selectedRecord.trackingNumber}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${selectedRecord.courier.badgeBg}`}>
                    {selectedRecord.courier.name}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    {selectedRecord.stationId}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5 truncate">
                  ผู้แพ็ค: {selectedRecord.operatorName || 'ไม่ระบุ'} • {new Date(selectedRecord.timestamp).toLocaleDateString('th-TH')} {new Date(selectedRecord.timestamp).toLocaleTimeString('th-TH')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Photo Proof */}
              {selectedRecord.imageBlobUrl && (
                <div>
                  <span className="text-xs font-bold text-stone-400 mb-2 block">
                    ภาพถ่ายหลักฐานพร้อมลายน้ำ:
                  </span>
                  <img
                    src={selectedRecord.imageBlobUrl}
                    alt="Full Proof"
                    className="w-full rounded-xl border border-slate-800 bg-black max-h-[50vh] object-contain mx-auto"
                  />
                </div>
              )}

              {/* Video Playback */}
              {selectedRecord.videoBlobUrl && (
                <div>
                  <span className="text-xs font-bold text-stone-400 mb-2 block">
                    วิดีโอขณะแพ็ค:
                  </span>
                  <video
                    src={selectedRecord.videoBlobUrl}
                    controls
                    className="w-full rounded-xl border border-slate-800 bg-black aspect-video max-h-[50vh] mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono">
                ความยาว: {selectedRecord.durationSec}s
              </span>
              <div className="flex items-center gap-2">
                {selectedRecord.imageBlobUrl && (
                  <a
                    href={selectedRecord.imageBlobUrl}
                    download={`${selectedRecord.trackingNumber}_proof.jpg`}
                    className="h-8 px-3 rounded-lg bg-[#f06b4b] hover:bg-[#e05837] text-white font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>บันทึกภาพ</span>
                  </a>
                )}
                {selectedRecord.videoBlobUrl && (
                  <a
                    href={selectedRecord.videoBlobUrl}
                    download={`${selectedRecord.trackingNumber}_video.webm`}
                    className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>บันทึกวิดีโอ</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Single Record Confirmation */}
      {deleteTargetId && (
        <ConfirmModal
          isOpen={!!deleteTargetId}
          title="ยืนยันการลบรายการ"
          message="คุณต้องการลบรายการประวัติการแพ็คนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
          confirmLabel="ลบรายการ"
          cancelLabel="ยกเลิก"
          isDestructive={true}
          onConfirm={() => {
            if (deleteTargetId && onDeleteRecord) {
              onDeleteRecord(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* 6. Clear All History Confirmation */}
      {showClearConfirm && (
        <ConfirmModal
          isOpen={showClearConfirm}
          title="ยืนยันการล้างประวัติทั้งหมด"
          message={`คุณต้องการลบประวัติการแพ็คทั้งหมด ${records.length} รายการใช่หรือไม่? ข้อมูลหลักฐานในระบบจะถูกล้าง`}
          confirmLabel="ล้างทั้งหมด"
          cancelLabel="ยกเลิก"
          isDestructive={true}
          onConfirm={() => {
            onClearHistory();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

    </div>
  );
};

// -------------------------------------------------------------
// Pagination Controls Sub-Component
// -------------------------------------------------------------
interface PaginationBarProps {
  total: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  total,
  pageSize,
  setPageSize,
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  if (total === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="bg-white rounded-xl border border-stone-200 px-3.5 py-2.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
      {/* Left: Summary & Page Size Selector */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span>
          แสดง <span className="font-semibold text-slate-800 font-mono">{start}</span> - <span className="font-semibold text-slate-800 font-mono">{end}</span> จาก <span className="font-semibold text-slate-800 font-mono">{total}</span> รายการ
        </span>
        <div className="flex items-center gap-1.5 pl-2 sm:border-l border-stone-200">
          <span className="text-stone-400">ต่อหน้า:</span>
          <div className="inline-flex rounded-md bg-stone-100 p-0.5 border border-stone-200">
            {[10, 20, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition ${
                  pageSize === size
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Navigation Prev / Page / Next */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-7 px-2.5 rounded-md border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-medium transition inline-flex items-center gap-1 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>ก่อนหน้า</span>
        </button>

        <span className="px-2 font-mono text-stone-600 text-xs">
          หน้า <span className="font-bold text-slate-900">{currentPage}</span> / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="h-7 px-2.5 rounded-md border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-medium transition inline-flex items-center gap-1 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
        >
          <span>ถัดไป</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
