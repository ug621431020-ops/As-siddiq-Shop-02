import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Clock, 
  PackageCheck, 
  Volume2, 
  VolumeX, 
  Layers,
  Check,
  X,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  HardDrive,
  ChevronDown,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { RecordStatus } from '../types';

interface HeaderProps {
  stationId: string;
  operatorName?: string;
  recordStatus: RecordStatus;
  todayCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenMobileMenu: () => void;
  onOpenExportModal: () => void;
  onOpenSettings: () => void;
  onOpenDashboard?: () => void;
  googleUser?: FirebaseUser | null;
  onOpenGoogleDrive?: () => void;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  isAuthLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stationId,
  operatorName,
  recordStatus,
  todayCount,
  soundEnabled,
  setSoundEnabled,
  onOpenMobileMenu,
  onOpenExportModal,
  onOpenSettings,
  onOpenDashboard,
  googleUser,
  onOpenGoogleDrive,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthLoading = false,
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const authMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = () => {
    switch (recordStatus) {
      case 'recording':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            REC
          </span>
        );
      case 'stopping':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-spin"></span>
            <span className="hidden sm:inline">ถ่ายภาพ...</span>
          </span>
        );
      case 'uploading':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-spin"></span>
            <span className="hidden sm:inline">กำลังส่ง...</span>
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">สำเร็จ</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-600 text-white">
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้มเหลว</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Left section: Hamburger (mobile/tablet) & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="เมนู"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Station name for mobile/tablet where sidebar is closed */}
        <div className="md:hidden flex items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-800">{stationId}</span>
        </div>

        {/* Status Badge (single instance, non-redundant) */}
        <div className="flex items-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* Right section: Counter, Clock, Sound, User Login */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Packing Counter */}
        <button
          onClick={onOpenDashboard}
          title="ดูแดชบอร์ดสรุปสถิติ"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs transition text-left min-h-[38px]"
        >
          <PackageCheck className="w-4 h-4 text-[#f06b4b] shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="hidden md:inline text-stone-400 text-[11px]">วันนี้</span>
            <span className="font-bold text-slate-800 font-mono text-xs sm:text-sm">
              {todayCount}
            </span>
            <span className="text-[10px] text-stone-400">กล่อง</span>
          </div>
        </button>

        {/* Live Clock (tablet and PC) */}
        <div className="hidden lg:flex items-center gap-1.5 text-right px-2 py-1 text-xs text-stone-600">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-mono font-semibold text-slate-800">{currentTime || '--:--:--'}</span>
        </div>

        {/* Audio Beep Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
          aria-label="สลับเสียงเตือน"
          className={`w-9 h-9 rounded-lg border transition flex items-center justify-center ${
            soundEnabled 
              ? 'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100' 
              : 'bg-stone-100 border-stone-300 text-stone-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#f06b4b]" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Top-Right Login / User Profile Icon */}
        <div className="relative" ref={authMenuRef}>
          {googleUser ? (
            <button
              id="btn-user-profile-top-right"
              onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
              title={`เข้าสู่ระบบแล้ว: ${googleUser.displayName || googleUser.email}`}
              aria-label="เมนูผู้ใช้งาน"
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition cursor-pointer min-h-[38px]"
            >
              <div className="relative flex items-center justify-center">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/80"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                {googleUser.displayName || 'ผู้ใช้งาน'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          ) : (
            <button
              id="btn-login-top-right"
              onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
              title="เข้าสู่ระบบ"
              aria-label="เข้าสู่ระบบ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f06b4b] hover:bg-[#df5e3f] text-white font-medium text-xs transition shadow-xs cursor-pointer min-h-[38px]"
            >
              {isAuthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogIn className="w-4 h-4 text-white" />
              )}
              <span className="font-semibold text-xs hidden sm:inline">เข้าสู่ระบบ</span>
            </button>
          )}

          {/* Login / Profile Dropdown Menu */}
          {isAuthMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {googleUser ? (
                /* Authenticated User Menu */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="User"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/80"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {googleUser.displayName || 'ผู้ใช้งาน'}
                      </div>
                      <div className="text-xs text-stone-500 truncate">
                        {googleUser.email}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium px-1.5 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        เชื่อมต่อแล้ว
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    {onOpenGoogleDrive && (
                      <button
                        onClick={() => {
                          setIsAuthMenuOpen(false);
                          onOpenGoogleDrive();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-stone-100 rounded-lg transition text-left min-h-[38px]"
                      >
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        Google Drive
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsAuthMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-stone-100 rounded-lg transition text-left min-h-[38px]"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#f06b4b]" />
                      ตั้งค่าระบบ
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setIsAuthMenuOpen(false);
                        if (onGoogleSignOut) onGoogleSignOut();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[38px]"
                    >
                      <LogOut className="w-4 h-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated Login Options */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[#f06b4b]">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">เข้าสู่ระบบ</h4>
                        <p className="text-[10px] text-stone-500">เลือกวิธีการเข้าใช้งาน</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAuthMenuOpen(false)}
                      className="text-stone-400 hover:text-stone-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Google Sign-in */}
                  <button
                    onClick={async () => {
                      if (onGoogleSignIn) {
                        await onGoogleSignIn();
                        setIsAuthMenuOpen(false);
                      }
                    }}
                    disabled={isAuthLoading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 hover:border-orange-300 bg-stone-50 hover:bg-orange-50/40 transition text-left group cursor-pointer min-h-[44px]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">เข้าสู่ระบบด้วย Google</div>
                      <div className="text-[10px] text-stone-500">ซิงค์กับ Google Drive</div>
                    </div>
                  </button>

                  {/* Admin Settings Login */}
                  <button
                    onClick={() => {
                      setIsAuthMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition text-left group cursor-pointer min-h-[44px]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-slate-700 shadow-2xs group-hover:scale-105 transition shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#f06b4b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">ตั้งค่าแอดมิน</div>
                      <div className="text-[10px] text-stone-500">จัดการโต๊ะและพนักงาน</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
