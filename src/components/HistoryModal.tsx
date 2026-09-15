import React, { useState, useMemo } from 'react';
import { 
  History, 
  Download, 
  Search, 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Trash2, 
  FileVideo, 
  Image as ImageIcon,
  User,
  Filter,
  RotateCcw,
  Building
} from 'lucide-react';
import { PackRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PackRecord[];
  onClearHistory: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onClearHistory,
  onDeleteRecord,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<PackRecord | null>(null);

  // Filters State
  const [searchTracking, setSearchTracking] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'custom'>('all');
  const [customTimeStart, setCustomTimeStart] = useState('');
  const [customTimeEnd, setCustomTimeEnd] = useState('');
  const [selectedPacker, setSelectedPacker] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');

  // Extract unique packers and stations from existing records
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

      // 1. Search by Tracking Number (หาด้วยเลขพัสดุ)
      if (searchTracking.trim()) {
        const query = searchTracking.trim().toLowerCase();
        if (!r.trackingNumber.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Filter by Date (กรองวันที่)
      if (dateFilter === 'today') {
        if (recDateStr !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        if (recDateStr !== yesterdayStr) return false;
      } else if (dateFilter === 'week') {
        if (recDateObj < sevenDaysAgo) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (recDateStr !== customDate) return false;
      }

      // 3. Filter by Time (กรองเวลา)
      if (timeFilter === 'morning') {
        // 06:00 - 11:59
        if (hours < 6 || hours >= 12) return false;
      } else if (timeFilter === 'afternoon') {
        // 12:00 - 17:59
        if (hours < 12 || hours >= 18) return false;
      } else if (timeFilter === 'evening') {
        // 18:00 - 23:59
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

      // 4. Filter by Packer (กรองผู้แพ็ค)
      if (selectedPacker !== 'all') {
        const pName = r.operatorName || r.operatorId || 'ไม่ระบุ';
        if (pName !== selectedPacker) return false;
      }

      // 5. Filter by Station (กรองโต๊ะแพ็ค)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f06b4b] text-white flex items-center justify-center font-bold shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">ประวัติการแพ็คสินค้าและหลักฐาน</h3>
              <p className="text-xs text-stone-500">
                ค้นหาและกรองตรวจสอบหลักฐานวิดีโอ/ภาพถ่ายย้อนหลัง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-stone-500 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar Section */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/50 space-y-3">
          
          {/* Row 1: Search by Tracking Number + Packer select + Station select */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* 1. ค้นหาด้วยเลขพัสดุ */}
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                placeholder="🔍 หาด้วยเลขพัสดุ (Tracking Number)..."
                className="w-full pl-9 pr-8 py-2 text-xs font-mono font-medium rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] text-slate-800 placeholder:font-sans placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchTracking && (
                <button
                  onClick={() => setSearchTracking('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. กรองผู้แพ็ค */}
            <div className="sm:col-span-3 relative">
              <select
                value={selectedPacker}
                onChange={(e) => setSelectedPacker(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] appearance-none cursor-pointer"
              >
                <option value="all">👤 ผู้แพ็คทั้งหมด</option>
                {uniquePackers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <User className="w-3.5 h-3.5 text-[#f06b4b] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. กรองโต๊ะแพ็ค */}
            <div className="sm:col-span-3 relative">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] appearance-none cursor-pointer"
              >
                <option value="all">🏢 ทุกโต๊ะแพ็ค</option>
                {uniqueStations.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <Building className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: Date & Time Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-200/60">
            {/* กรองวันที่ */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-[#f06b4b]" /> วันที่:
              </span>
              {(['all', 'today', 'yesterday', 'week', 'custom'] as const).map((key) => {
                const labels: Record<string, string> = {
                  all: 'ทั้งหมด',
                  today: 'วันนี้',
                  yesterday: 'เมื่อวาน',
                  week: '7 วันล่าสุด',
                  custom: 'เลือกวัน',
                };
                const active = dateFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      active 
                        ? 'bg-[#f06b4b] text-white shadow-xs font-semibold' 
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
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
                  className="px-2 py-1 text-xs rounded-lg border border-stone-300 bg-white font-mono focus:border-[#f06b4b] outline-none"
                />
              )}
            </div>

            {/* กรองเวลา */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5 text-[#f06b4b]" /> เวลา:
              </span>
              {(['all', 'morning', 'afternoon', 'evening', 'custom'] as const).map((key) => {
                const labels: Record<string, string> = {
                  all: 'ทุกเวลา',
                  morning: 'เช้า (06-12)',
                  afternoon: 'บ่าย (12-18)',
                  evening: 'เย็น (18-24)',
                  custom: 'ช่วงเวลา',
                };
                const active = timeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimeFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      active 
                        ? 'bg-slate-900 text-white shadow-xs font-semibold' 
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}

              {timeFilter === 'custom' && (
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-stone-300">
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

            {/* Count & Reset */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-stone-500 font-medium font-mono">
                พบ {filteredRecords.length} / {records.length} รายการ
              </span>
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-medium transition flex items-center gap-1"
                  title="รีเซ็ตตัวกรองทั้งหมด"
                >
                  <RotateCcw className="w-3 h-3" /> ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <History className="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-stone-300" />
              <p className="font-medium text-sm text-stone-600">
                {isFilterActive ? 'ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง' : 'ยังไม่มีประวัติการแพ็คในระบบ'}
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                {isFilterActive 
                  ? 'ลองปรับเปลี่ยนวันที่ เวลา ผู้แพ็ค หรือคำค้นหาเลขพัสดุ' 
                  : 'เมื่อสแกนบาร์โค้ด บันทึกวิดีโอ และกดหยุดบันทึก หลักฐานภาพถ่ายและวิดีโอจะแสดงที่นี่'}
              </p>
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRecords.map((rec) => {
                const recDate = new Date(rec.timestamp);
                const dateTh = recDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                });
                const timeTh = recDate.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div
                    key={rec.id}
                    className="bg-white hover:bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rec.courier.badgeBg}`}>
                            {rec.courier.name}
                          </span>
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono font-medium">
                            {rec.stationId}
                          </span>
                        </div>

                        {/* Tracking Number */}
                        <div className="font-mono font-bold text-slate-900 text-base tracking-tight truncate select-all">
                          {rec.trackingNumber}
                        </div>

                        {/* Packer and duration */}
                        <div className="text-xs text-stone-600 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            ผู้แพ็ค: {rec.operatorName || 'ไม่ระบุ'}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="flex items-center gap-1 text-stone-500 text-[11px]">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {rec.durationSec}s
                          </span>
                        </div>

                        {/* Date & Time display */}
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>📅 {dateTh}</span>
                          <span>⏰ {timeTh}</span>
                        </div>
                      </div>

                      {/* Photo Thumbnail */}
                      {rec.imageBlobUrl && (
                        <div 
                          className="relative group shrink-0 cursor-pointer"
                          onClick={() => setSelectedRecord(rec)}
                          title="คลิกเพื่อดูหลักฐานขนาดเต็ม"
                        >
                          <img
                            src={rec.imageBlobUrl}
                            alt="Proof Thumbnail"
                            className="w-18 h-14 object-cover rounded-xl border border-stone-200 shadow-2xs group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 rounded-xl bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                            ดูรูป
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-[#f06b4b] text-slate-700 hover:text-[#f06b4b] font-medium text-[11px] transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> ดูหลักฐานเต็ม
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {rec.videoBlobUrl && (
                          <a
                            href={rec.videoBlobUrl}
                            download={`${rec.trackingNumber}_video.webm`}
                            className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-[#f06b4b] hover:text-white text-stone-600 transition"
                            title="ดาวน์โหลดคลิปวิดีโอ"
                          >
                            <FileVideo className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {rec.imageBlobUrl && (
                          <a
                            href={rec.imageBlobUrl}
                            download={`${rec.trackingNumber}_photo.jpg`}
                            className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-[#f06b4b] hover:text-white text-stone-600 transition"
                            title="ดาวน์โหลดรูปถ่ายหลักฐาน"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {onDeleteRecord && (
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Record Inspection Lightbox */}
        {selectedRecord && (
          <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 md:p-5">
            <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-mono text-base font-bold text-[#f06b4b]">
                    {selectedRecord.trackingNumber}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {selectedRecord.courier.name} • {selectedRecord.stationId} • ผู้แพ็ค: {selectedRecord.operatorName || 'ไม่ระบุ'} • {new Date(selectedRecord.timestamp).toLocaleDateString('th-TH')} {new Date(selectedRecord.timestamp).toLocaleTimeString('th-TH')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Photo snapshot with watermark */}
                {selectedRecord.imageBlobUrl && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 block">
                      ภาพถ่ายหลักฐานพร้อมลายน้ำ (Canvas Snapshot):
                    </span>
                    <img
                      src={selectedRecord.imageBlobUrl}
                      alt="Full Proof"
                      className="w-full rounded-2xl border border-slate-800 shadow-md"
                    />
                  </div>
                )}

                {/* Video Playback */}
                {selectedRecord.videoBlobUrl && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 block">
                      วิดีโอขณะแพ็คสินค้า (Video Playback):
                    </span>
                    <video
                      src={selectedRecord.videoBlobUrl}
                      controls
                      className="w-full rounded-2xl border border-slate-800 bg-black aspect-video"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono">ความยาว: {selectedRecord.durationSec} วินาที</span>
                <div className="flex items-center gap-2">
                  {selectedRecord.imageBlobUrl && (
                    <a
                      href={selectedRecord.imageBlobUrl}
                      download={`${selectedRecord.trackingNumber}_proof.jpg`}
                      className="px-3.5 py-2 rounded-xl bg-[#f06b4b] hover:bg-[#e05837] text-white font-semibold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> บันทึกภาพ
                    </a>
                  )}
                  {selectedRecord.videoBlobUrl && (
                    <a
                      href={selectedRecord.videoBlobUrl}
                      download={`${selectedRecord.trackingNumber}_video.webm`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> บันทึกวิดีโอ
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
