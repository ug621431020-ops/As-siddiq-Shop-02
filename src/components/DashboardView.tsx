import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Clock, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Users, 
  Award, 
  Download, 
  Filter, 
  Search, 
  Eye, 
  BarChart3,
  Layers,
  ChevronRight,
  ArrowUpRight,
  Truck
} from 'lucide-react';
import { PackRecord, TimeFilter, PackerStaff } from '../types';
import { DEFAULT_PACKERS } from '../utils/staffData';

interface DashboardViewProps {
  records: PackRecord[];
  onViewRecordDetail: (record: PackRecord) => void;
  onSwitchToConsole: () => void;
  packers?: PackerStaff[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onViewRecordDetail,
  onSwitchToConsole,
  packers = DEFAULT_PACKERS,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [selectedCourierFilter, setSelectedCourierFilter] = useState<string>('all');
  const [selectedPackerFilter, setSelectedPackerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Date Range Filtering Logic
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of week (Monday)
    const dayOfWeek = now.getDay() || 7; // Sunday = 7
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
    const startOfWeekTime = startOfWeek.getTime();

    // Start of month
    const startOfMonthTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return records.filter((r) => {
      const recordTime = new Date(r.timestamp).getTime();
      if (timeFilter === 'today') {
        return recordTime >= startOfToday;
      } else if (timeFilter === 'week') {
        return recordTime >= startOfWeekTime;
      } else {
        return recordTime >= startOfMonthTime;
      }
    });
  }, [records, timeFilter]);

  // Secondary filters for the table
  const displayRecords = useMemo(() => {
    return filteredRecords.filter((r) => {
      const matchCourier = selectedCourierFilter === 'all' || r.courier.name === selectedCourierFilter;
      const matchPacker = selectedPackerFilter === 'all' || r.operatorId === selectedPackerFilter;
      const matchSearch = !searchQuery.trim() || 
        r.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.operatorName && r.operatorName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCourier && matchPacker && matchSearch;
    });
  }, [filteredRecords, selectedCourierFilter, selectedPackerFilter, searchQuery]);

  // 2. Metrics & KPI Calculations
  const totalCount = filteredRecords.length;
  
  const avgDuration = useMemo(() => {
    if (totalCount === 0) return 0;
    const totalSecs = filteredRecords.reduce((acc, curr) => acc + (curr.durationSec || 0), 0);
    return Math.round(totalSecs / totalCount);
  }, [filteredRecords, totalCount]);

  const estimatedBoxesPerHour = useMemo(() => {
    if (avgDuration === 0) return 0;
    return Math.round(3600 / avgDuration);
  }, [avgDuration]);

  const uploadSuccessCount = useMemo(() => {
    return filteredRecords.filter((r) => r.uploadStatus === 'success').length;
  }, [filteredRecords]);

  const successRate = totalCount > 0 ? ((uploadSuccessCount / totalCount) * 100).toFixed(1) : '100';

  // 3. Courier Distribution Breakdown
  const courierStats = useMemo(() => {
    const counts: Record<string, { count: number; name: string; nameTh: string; badgeBg: string; icon: string }> = {};
    filteredRecords.forEach((r) => {
      const cId = r.courier.name;
      if (!counts[cId]) {
        counts[cId] = {
          count: 0,
          name: r.courier.name,
          nameTh: r.courier.nameTh,
          badgeBg: r.courier.badgeBg,
          icon: r.courier.iconText,
        };
      }
      counts[cId].count++;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  // 4. Packer Staff Performance Breakdown
  const packerStats = useMemo(() => {
    const stats: Record<string, { staff: PackerStaff; count: number; totalSec: number }> = {};
    
    // Initialize with all known packers
    packers.forEach((p) => {
      stats[p.id] = { staff: p, count: 0, totalSec: 0 };
    });

    filteredRecords.forEach((r) => {
      const opId = r.operatorId || 'OP-01';
      if (!stats[opId]) {
        const found = packers.find((p) => p.id === opId) || {
          id: opId,
          name: r.operatorName || 'พนักงานทั่วไป',
          nickname: 'แพ็คเกอร์',
          role: 'พนักงานแพ็คกิ้ง',
          avatarColor: 'bg-stone-600',
        };
        stats[opId] = { staff: found, count: 0, totalSec: 0 };
      }
      stats[opId].count++;
      stats[opId].totalSec += (r.durationSec || 0);
    });

    return Object.values(stats)
      .map((item) => ({
        ...item,
        avgSec: item.count > 0 ? Math.round(item.totalSec / item.count) : 0,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords, totalCount]);

  // Top Packer
  const topPacker = packerStats[0]?.count > 0 ? packerStats[0] : null;

  // 5. Volume Timeline Chart Data
  const chartData = useMemo(() => {
    if (timeFilter === 'today') {
      // 08:00 to 18:00 hourly buckets
      const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
      const counts = new Array(hours.length).fill(0);
      filteredRecords.forEach((r) => {
        const h = new Date(r.timestamp).getHours();
        const idx = h - 8;
        if (idx >= 0 && idx < hours.length) {
          counts[idx]++;
        }
      });
      const max = Math.max(...counts, 1);
      return hours.map((h, i) => ({ label: h, count: counts[i], heightPct: Math.round((counts[i] / max) * 100) }));
    } else if (timeFilter === 'week') {
      const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      filteredRecords.forEach((r) => {
        const d = new Date(r.timestamp).getDay(); // 0 Sun .. 6 Sat
        const idx = d === 0 ? 6 : d - 1;
        counts[idx]++;
      });
      const max = Math.max(...counts, 1);
      return days.map((d, i) => ({ label: d, count: counts[i], heightPct: Math.round((counts[i] / max) * 100) }));
    } else {
      const weeks = ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4', 'สัปดาห์ 5'];
      const counts = [0, 0, 0, 0, 0];
      filteredRecords.forEach((r) => {
        const date = new Date(r.timestamp).getDate();
        const idx = Math.min(Math.floor((date - 1) / 7), 4);
        counts[idx]++;
      });
      const max = Math.max(...counts, 1);
      return weeks.map((w, i) => ({ label: w, count: counts[i], heightPct: Math.round((counts[i] / max) * 100) }));
    }
  }, [filteredRecords, timeFilter]);

  // Download CSV Report
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['RecordID', 'Timestamp', 'StationID', 'OperatorID', 'OperatorName', 'TrackingNo', 'Courier', 'DurationSec', 'UploadStatus'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.timestamp,
      r.stationId,
      r.operatorId || '',
      `"${r.operatorName || ''}"`,
      r.trackingNumber,
      r.courier.name,
      r.durationSec,
      r.uploadStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `packspace-report-${timeFilter}-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTimeFilterLabel = () => {
    const now = new Date();
    if (timeFilter === 'today') {
      return `วันนี้ (${now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (timeFilter === 'week') {
      return 'สัปดาห์ปัจจุบัน (7 วันล่าสุด)';
    } else {
      return `เดือน ${now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Period Filter Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#fef3ee] text-[#f06b4b]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                แดชบอร์ดสถิติการแพ็คสินค้า (Packing Analytics)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                สรุปยอดพัสดุ ประสิทธิภาพการแพ็ครายบุคคล และการกระจายตัวของขนส่ง
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-stone-600">
            <Calendar className="w-3.5 h-3.5 text-[#f06b4b]" />
            <span>ช่วงเวลา: <b>{getTimeFilterLabel()}</b></span>
            <span className="text-stone-300">|</span>
            <span>บันทึกทั้งหมด <b>{filteredRecords.length}</b> รายการ</span>
          </div>
        </div>

        {/* Filter Tab Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pill Selector */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              id="filter-today"
              onClick={() => setTimeFilter('today')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                timeFilter === 'today'
                  ? 'bg-white text-[#f06b4b] shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>วันนี้ (Today)</span>
            </button>
            <button
              id="filter-week"
              onClick={() => setTimeFilter('week')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                timeFilter === 'week'
                  ? 'bg-white text-[#f06b4b] shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>สัปดาห์นี้ (Week)</span>
            </button>
            <button
              id="filter-month"
              onClick={() => setTimeFilter('month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                timeFilter === 'month'
                  ? 'bg-white text-[#f06b4b] shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>เดือนนี้ (Month)</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
            title="ส่งออกรายงานเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Packed */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">ยอดแพ็คทั้งหมด</span>
            <span className="w-9 h-9 rounded-xl bg-orange-50 text-[#f06b4b] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {totalCount}
              </span>
              <span className="text-xs text-stone-500 font-medium">กล่อง</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{timeFilter === 'today' ? 'อัปเดตแบบเรียลไทม์' : 'ครอบคลุมทุกกะงาน'}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Average Packing Duration */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">เวลาแพ็คเฉลี่ย</span>
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {avgDuration}
              </span>
              <span className="text-xs text-stone-500 font-medium">วินาที / กล่อง</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-2">
              <Zap className="w-3.5 h-3.5" />
              <span>{avgDuration <= 20 ? 'เกณฑ์ความเร็ว: เร็วมาก (Optimal)' : 'เกณฑ์ความเร็ว: มาตรฐาน'}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Estimated Throughput */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">กำลังการผลิตเฉลี่ย</span>
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                ~{estimatedBoxesPerHour}
              </span>
              <span className="text-xs text-stone-500 font-medium">กล่อง / ชม.</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-2">
              คำนวณจากความเร็วต่อเนื่อง
            </div>
          </div>
        </div>

        {/* KPI 4: Evidence Upload Success Rate */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">อัตราอัปโหลดหลักฐาน</span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {successRate}%
              </span>
              <span className="text-xs text-stone-500 font-medium">({uploadSuccessCount}/{totalCount})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>หลักฐานรูป+วิดีโอถูกส่งเข้า API</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Timeline Volume Chart & Courier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Volume Distribution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#f06b4b]" />
                กราฟแสดงปริมาณการแพ็คตามช่วงเวลา
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {timeFilter === 'today' ? 'การกระจายตัวตามช่วงโมงการทำงาน (08:00 - 18:00)' : timeFilter === 'week' ? 'ยอดรวมรายวันในสัปดาห์นี้' : 'ยอดรวมรายสัปดาห์ในเดือนนี้'}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              {timeFilter === 'today' ? 'รายชั่วโมง' : timeFilter === 'week' ? 'รายวัน' : 'รายสัปดาห์'}
            </span>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-52 pt-4 pb-2 flex items-end gap-2 sm:gap-3 border-b border-stone-100">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on Hover */}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md whitespace-nowrap z-20">
                  {item.count} กล่อง ({item.label})
                </div>

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-stone-100 rounded-t-lg h-full flex items-end overflow-hidden">
                  <div 
                    className="w-full bg-gradient-to-t from-[#f06b4b] to-orange-400 rounded-t-lg transition-all duration-500 group-hover:from-orange-600 group-hover:to-[#f06b4b]"
                    style={{ height: `${Math.max(item.heightPct, item.count > 0 ? 12 : 2)}%` }}
                  />
                </div>

                {/* Count badge above or in bar if large */}
                <span className="text-[10px] font-mono font-bold text-slate-700 mt-1.5">
                  {item.count}
                </span>

                {/* X Axis Label */}
                <span className="text-[10px] text-stone-400 font-medium truncate max-w-full">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f06b4b]"></span>
              ปริมาณพัสดุที่แพ็คเสร็จ
            </span>
            <span className="font-medium text-slate-700">
              จุดพีคสูงสุด: {Math.max(...chartData.map(c => c.count))} กล่อง
            </span>
          </div>
        </div>

        {/* Courier Distribution (1 col) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f06b4b]" />
                สัดส่วนตามบริษัทขนส่ง
              </h3>
              <span className="text-xs text-stone-400">
                {courierStats.length} ค่าย
              </span>
            </div>

            {/* Courier List */}
            <div className="space-y-3">
              {courierStats.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  ยังไม่มีข้อมูลขนส่งในช่วงเวลานี้
                </div>
              ) : (
                courierStats.map((item) => {
                  const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <div key={item.name} className="p-2.5 rounded-xl border border-stone-100 bg-stone-50/70 hover:bg-stone-50 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block leading-tight">
                              {item.nameTh}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono leading-tight">
                              {item.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {item.count} กล่อง
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium block">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#f06b4b] rounded-full transition-all duration-300" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400 text-center">
            ระบบจัดหมวดหมู่อัตโนมัติด้วย Regular Expression
          </div>
        </div>
      </div>

      {/* 4. Staff Packing Leaderboard & Performance (สถิติรายบุคคลของพนักงานผู้แพ็ค) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#f06b4b]" />
              สถิติประสิทธิภาพพนักงานผู้แพ็ค (Packer Performance)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ติดตามผลงานการแพ็คสินค้า ความเร็วเฉลี่ย และสัดส่วนภาระงานของทีม
            </p>
          </div>

          {topPacker && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>แพ็คได้สูงสุด: {topPacker.staff.name} ({topPacker.count} กล่อง)</span>
            </div>
          )}
        </div>

        {/* Staff Performance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {packerStats.map((item, index) => {
            const isTop = index === 0 && item.count > 0;
            return (
              <div 
                key={item.staff.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isTop 
                    ? 'border-amber-300 bg-amber-50/30 shadow-xs' 
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${item.staff.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                        {item.staff.nickname.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs leading-tight">
                          {item.staff.name}
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium leading-tight mt-0.5">
                          {item.staff.id} ({item.staff.nickname})
                        </div>
                      </div>
                    </div>

                    {isTop && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">
                        #1 Top
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 mb-3 truncate">
                    {item.staff.role}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">จำนวนที่แพ็ค:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.count} <span className="text-[10px] font-normal text-stone-400">กล่อง</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">เวลาเฉลี่ย:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.avgSec} <span className="text-[10px] font-normal text-stone-400">วินาที</span>
                    </span>
                  </div>

                  {/* Share of Workload bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                      <span>สัดส่วนงาน</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isTop ? 'bg-amber-500' : 'bg-[#f06b4b]'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Detailed Records Log with Search & Filter */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-850 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-[#f06b4b]" />
              บันทึกรายการพัสดุในช่วงเวลาที่เลือก
            </h3>
            <span className="text-xs text-stone-500">
              แสดง {displayRecords.length} จาก {filteredRecords.length} รายการ
            </span>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาเลขพัสดุ / ชื่อผู้แพ็ค..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f06b4b] w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Courier Filter */}
            <select
              value={selectedCourierFilter}
              onChange={(e) => setSelectedCourierFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#f06b4b]"
            >
              <option value="all">ทุกขนส่ง (All Couriers)</option>
              {courierStats.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.nameTh} ({c.name})
                </option>
              ))}
            </select>

            {/* Packer Filter */}
            <select
              value={selectedPackerFilter}
              onChange={(e) => setSelectedPackerFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#f06b4b]"
            >
              <option value="all">ทุกคน (All Staff)</option>
              {packers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.nickname})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">เวลาที่แพ็ค</th>
                <th className="px-4 py-3">เลขแทรคกิ้ง</th>
                <th className="px-4 py-3">บริษัทขนส่ง</th>
                <th className="px-4 py-3">พนักงานผู้แพ็ค</th>
                <th className="px-4 py-3">จุดแพ็ค</th>
                <th className="px-4 py-3">เวลาบันทึก</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">หลักฐาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-slate-700">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-400">
                    ไม่พบรายการพัสดุตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                displayRecords.map((record) => {
                  const recordDate = new Date(record.timestamp);
                  const timeDisplay = recordDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateDisplay = recordDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

                  return (
                    <tr key={record.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800">{timeDisplay}</span>
                        <span className="text-[10px] text-stone-400 block">{dateDisplay}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
                          {record.trackingNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${record.courier.badgeBg}`}>
                          <Truck className="w-3 h-3" />
                          <span>{record.courier.name}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">
                            {record.operatorName || 'ไม่ระบุ'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600">
                        {record.stationId}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-600">
                        {record.durationSec}s
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.uploadStatus === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            ล้มเหลว
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => onViewRecordDetail(record)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#fef3ee] hover:text-[#f06b4b] text-stone-700 text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรูป</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Action switch back to console */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            ต้องการบันทึกพัสดุกล่องใหม่หรือไม่?
          </span>
          <button
            onClick={onSwitchToConsole}
            className="px-4 py-2 rounded-xl bg-[#f06b4b] hover:bg-[#e05837] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#f06b4b]/20"
          >
            <span>กลับสู่แผงบันทึกการแพ็ค</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
