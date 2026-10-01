import React from 'react';
import { 
  Package, 
  Video, 
  History, 
  Settings, 
  Code2, 
  BarChart3,
  User,
  Users,
  HardDrive,
  X
} from 'lucide-react';
import { RecordStatus } from '../types';

interface SidebarProps {
  activeTab: 'console' | 'dashboard' | 'drive' | 'history' | 'settings' | 'export';
  setActiveTab: (tab: 'console' | 'dashboard' | 'drive' | 'history' | 'settings' | 'export') => void;
  recordCount: number;
  currentStation: string;
  currentOperatorName: string;
  recordStatus: RecordStatus;
  isCameraActive?: boolean;
  resolutionText?: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isGoogleConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
  currentStation,
  currentOperatorName,
  recordStatus,
  isCameraActive,
  resolutionText,
  isMobileOpen,
  setIsMobileOpen,
  isGoogleConnected = false,
}) => {
  const navItems = [
    {
      id: 'console' as const,
      label: 'แพ็คพัสดุ',
      icon: Video,
      badge: recordStatus === 'recording' ? 'REC' : null,
      badgeColor: 'bg-red-500 text-white font-bold animate-pulse',
    },
    {
      id: 'dashboard' as const,
      label: 'แดชบอร์ด',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'drive' as const,
      label: 'ข้อมูล',
      icon: HardDrive,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'history' as const,
      label: 'ประวัติการแพ็ค',
      icon: History,
      badge: recordCount > 0 ? recordCount.toString() : null,
      badgeColor: 'bg-stone-200 text-stone-700 font-bold',
    },
    {
      id: 'settings' as const,
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'export' as const,
      label: 'ส่งออกโค้ด',
      icon: Code2,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-lg md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f06b4b] flex items-center justify-center text-white shadow-md shadow-[#f06b4b]/20">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">ระบบบันทึกการแพ็ค</h1>
                <p className="text-[11px] text-stone-400 font-medium tracking-wide">LOGISTICS & PROOF</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Operator & Station Card */}
          <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
            {/* Operator info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#f06b4b]/15 text-[#f06b4b] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block leading-none">ผู้แพ็คปัจจุบัน</span>
                  <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">{currentOperatorName}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            </div>

            {/* Station info */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-stone-400 text-[11px]">จุดแพ็ค:</span>
              <span className="font-mono font-bold text-slate-700">{currentStation}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 mb-2">เมนูการทำงาน</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isActive 
                      ? 'bg-[#fef3ee] text-[#f06b4b] font-semibold shadow-xs' 
                      : 'text-stone-600 hover:bg-stone-100/80 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#f06b4b]' : 'text-stone-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
