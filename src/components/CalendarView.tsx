import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Truck, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CalendarCheck2, 
  ShieldCheck,
  CalendarDays,
  Sparkles,
  Zap,
  Package,
  ShoppingCart
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmModal } from './ConfirmModal';
import { 
  CalendarEventItem, 
  listUpcomingEvents, 
  createCalendarEvent, 
  deleteCalendarEvent,
  NewEventPayload 
} from '../services/googleCalendarService';
import { COURIERS } from '../utils/courierDetector';

interface CalendarViewProps {
  user: User | null;
  accessToken: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isLoadingAuth?: boolean;
  isAuthLoading?: boolean;
  stationId: string;
  todayPackCount?: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  user,
  accessToken,
  onSignIn,
  onSignOut,
  isLoadingAuth,
  isAuthLoading,
  stationId,
  todayPackCount = 0,
}) => {
  const loadingAuth = isLoadingAuth ?? isAuthLoading ?? false;
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New Event Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('Flash Express เข้ารับพัสดุ');
  const [courierName, setCourierName] = useState<string>('Flash Express');
  const [pickupDate, setPickupDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('15:00');
  const [location, setLocation] = useState<string>(`คลังสินค้า PackSpace (จุด ${stationId})`);
  const [description, setDescription] = useState<string>('นัดรถขนส่งเข้ารับพัสดุประจำวัน คาดการณ์ประมาณ 50-80 กล่อง');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete modal state (Mandatory confirmation before deleting)
  const [deletingEvent, setDeletingEvent] = useState<CalendarEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load upcoming events
  const loadEvents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const items = await listUpcomingEvents(accessToken);
      setEvents(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดปฏิทินได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadEvents();
    }
  }, [accessToken, loadEvents]);

  // Handle Quick Presets
  const applyPreset = (presetCourier: string, startH: string, endH: string, defaultTitle: string) => {
    setCourierName(presetCourier);
    setSummary(defaultTitle);
    setStartTime(startH);
    setEndTime(endH);
    setShowAddForm(true);
  };

  // Submit new calendar event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${pickupDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${pickupDate}T${endTime}:00`).toISOString();

      const payload: NewEventPayload = {
        summary: `[นัดรับพัสดุ] ${summary}`,
        description: `${description}\n\nบันทึกจาก PackSpace Logistics (${stationId})`,
        location,
        startDateTime,
        endDateTime,
      };

      await createCalendarEvent(accessToken, payload);
      setShowAddForm(false);
      await loadEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถสร้างนัดหมายได้';
      alert(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event with user confirmation dialog
  const handleConfirmDelete = async () => {
    if (!accessToken || !deletingEvent) return;
    setIsDeleting(true);

    try {
      await deleteCalendarEvent(accessToken, deletingEvent.id);
      setEvents((prev) => prev.filter((ev) => ev.id !== deletingEvent.id));
      setDeletingEvent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถลบนัดหมายได้';
      alert(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Unauthenticated state
  if (!user || !accessToken) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-stone-200/90 shadow-sm max-w-2xl mx-auto my-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">เชื่อมต่อ Google Calendar</h2>
        <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
          เชื่อมโยงปฏิทินงานของคุณเพื่อติดตามตารางนัดรับพัสดุของบริษัทขนส่ง (Courier Pickup Schedule) กำหนดเวลาตัดรอบแพ็ค และแจ้งเตือนทีมงานก่อนรถขนส่งมาถึง
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <GoogleSignInButton
            onClick={onSignIn}
            isLoading={loadingAuth}
            text="เข้าสู่ระบบด้วย Google เพื่อเปิดใช้งาน Calendar"
            size="lg"
          />
          <span className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            เชื่อมต่อกับ Google Calendar ส่วนตัวหรืออีเมลองค์กรของคุณอย่างปลอดภัย
          </span>
        </div>
      </div>
    );
  }

  // 2. Authenticated state
  return (
    <div className="space-y-6">
      
      {/* Top Banner & Account Status */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Google User'} 
              className="w-12 h-12 rounded-2xl border border-stone-200 shadow-xs shrink-0" 
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              {(user.displayName || user.email || 'G').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 truncate">Google Calendar ของคุณ</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-[#f06b4b] hover:bg-[#e05a3a] text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มนัดรับพัสดุ'}</span>
          </button>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เปิด Google Calendar</span>
          </a>

          <button
            onClick={onSignOut}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50 text-xs font-semibold transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Quick Courier Presets Banner */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f06b4b]" />
            ปุ่มด่วนสร้างนัดหมายขนส่ง (Quick Presets):
          </span>
          <span className="text-[11px] text-stone-400">คลิกเพื่อกรอกอัตโนมัติ</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyPreset('Flash Express', '14:00', '15:00', 'Flash Express เข้ารับพัสดุ')}
            className="p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left transition shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 group-hover:text-amber-800">
              <Zap className="w-3.5 h-3.5" />
              <span>Flash Express</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">14:00 - 15:00 น.</div>
          </button>

          <button
            onClick={() => applyPreset('Shopee Xpress (SPX)', '15:30', '16:30', 'SPX Express เข้ารับพัสดุ')}
            className="p-2.5 rounded-xl bg-white border border-orange-200 hover:border-orange-400 text-left transition shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 group-hover:text-orange-700">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>SPX Express</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">15:30 - 16:30 น.</div>
          </button>

          <button
            onClick={() => applyPreset('Kerry Express (KEX)', '16:30', '17:30', 'Kerry Express เข้ารับพัสดุ')}
            className="p-2.5 rounded-xl bg-white border border-orange-300 hover:border-orange-500 text-left transition shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#f06b4b] group-hover:text-[#e05a3a]">
              <Truck className="w-3.5 h-3.5" />
              <span>Kerry Express</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">16:30 - 17:30 น.</div>
          </button>

          <button
            onClick={() => applyPreset('ทีมแพ็คสินค้า', '17:00', '17:30', 'เวลาตัดรอบแพ็คประจำวัน (Cutoff)')}
            className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-left transition shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 group-hover:text-purple-800">
              <Clock className="w-3.5 h-3.5" />
              <span>ตัดรอบแพ็คสินค้า</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono mt-0.5">17:00 น. ประจำวัน</div>
          </button>
        </div>
      </div>

      {/* New Event Form (Collapsible) */}
      {showAddForm && (
        <form 
          onSubmit={handleCreateEvent}
          className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm animate-in fade-in duration-200 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-[#f06b4b]" />
              <h3 className="text-base font-bold text-slate-900">กำหนดเวลานัดหมายลง Google Calendar</h3>
            </div>
            <span className="text-xs text-stone-400">จะส่งการแจ้งเตือนเตือนล่วงหน้า 30 และ 10 นาที</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                หัวข้อนัดหมาย
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="เช่น Flash Express เข้ารับพัสดุรอบบ่าย"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                เลือกขนส่ง
              </label>
              <select
                value={courierName}
                onChange={(e) => {
                  setCourierName(e.target.value);
                  if (!summary || summary.includes('เข้ารับ')) {
                    setSummary(`${e.target.value} เข้ารับพัสดุ`);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              >
                {Object.values(COURIERS).map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.nameTh})</option>
                ))}
                <option value="ทีมแพ็คสินค้า">ทีมแพ็คสินค้า / สรุปยอดตัดรอบ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                วันที่นัดหมาย
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                เวลาเริ่ม (Start)
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                เวลาสิ้นสุด (End)
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                สถานที่รับพัสดุ (Location)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                หมายเหตุเพิ่มเติม (Notes)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#f06b4b] hover:bg-[#e05a3a] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกลง Calendar...' : 'บันทึกลง Google Calendar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Events List View */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-bold text-slate-800">ตารางนัดหมายบน Google Calendar</span>
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
              {events.length}
            </span>
          </div>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
            title="รีเฟรชปฏิทิน"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="divide-y divide-stone-100">
          {events.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div>ยังไม่มีรายการนัดหมายในปฏิทินเร็วๆ นี้</div>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-xs font-bold text-[#f06b4b] hover:underline"
              >
                + เพิ่มนัดรับพัสดุแรกของคุณ
              </button>
            </div>
          ) : (
            events.map((ev) => {
              const startDate = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date) : null);
              const endDate = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;
              const isToday = startDate && new Date().toDateString() === startDate.toDateString();

              return (
                <div key={ev.id} className="p-4 md:p-5 hover:bg-stone-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isToday ? 'bg-orange-100 text-[#f06b4b]' : 'bg-stone-100 text-stone-600'
                    }`}>
                      <Truck className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{ev.summary}</h4>
                        {isToday && (
                          <span className="text-[10px] bg-orange-100 text-[#f06b4b] font-bold px-2 py-0.5 rounded-full">
                            วันนี้
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-stone-600">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {startDate
                            ? startDate.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
                              startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) +
                              (endDate ? ' - ' + endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '')
                            : 'ตลอดวัน'}
                        </span>

                        {ev.location && (
                          <span className="flex items-center gap-1 text-stone-400">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิด Calendar</span>
                      </a>
                    )}

                    {/* Delete Event (Triggers Mandatory Confirmation Dialog) */}
                    <button
                      onClick={() => setDeletingEvent(ev)}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 transition"
                      title="ลบนัดหมายออกจาก Google Calendar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Deleting Calendar Event (Mandatory by Skill) */}
      <ConfirmModal
        isOpen={Boolean(deletingEvent)}
        title="ยืนยันการลบนัดหมายจาก Google Calendar"
        message={`คุณต้องการลบนัดหมาย "${deletingEvent?.summary}" ออกจาก Google Calendar ของคุณใช่หรือไม่?\n\nการแจ้งเตือนและการนัดหมายนี้จะถูกลบออกจากปฏิทินทันที`}
        confirmLabel="ลบนัดหมายถาวร"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEvent(null)}
      />

    </div>
  );
};
