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
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm shadow-red-500/20">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            บันทึก REC
          </span>
        );
      case 'stopping':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-spin"></span>
            ถ่ายภาพ...
          </span>
        );
      case 'uploading':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-spin"></span>
            กำลังส่ง...
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
            <Check className="w-3.5 h-3.5" />
            สำเร็จ
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
            <X className="w-3.5 h-3.5" />
            ล้มเหลว
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left section: Hamburger & Active Status */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Right section: Status, Clock, Today Counter, Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile status badge */}
        <div className="lg:hidden">
          {getStatusBadge()}
        </div>

        {/* Packing Counter / Dashboard link */}
        <button
          onClick={onOpenDashboard}
          title="คลิกเพื่อเปิดแดชบอร์ดสรุปสถิติ"
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 text-xs transition text-left"
        >
          <PackageCheck className="w-4 h-4 text-[#f06b4b]" />
          <div>
            <span className="text-stone-400 block text-[10px] uppercase font-bold leading-none">แพ็คแล้ววันนี้</span>
            <div className="font-bold text-slate-800 font-mono text-sm leading-tight mt-0.5">
              {todayCount} <span className="text-[11px] font-normal text-stone-500">กล่อง</span>
            </div>
          </div>
        </button>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 text-right">
          <Clock className="w-4 h-4 text-stone-400" />
          <div>
            <div className="font-mono text-sm font-bold text-slate-800 leading-tight">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-[10px] text-stone-400 leading-tight">
              {currentDate || 'กำลังโหลด...'}
            </div>
          </div>
        </div>

        {/* Audio Beep Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
          className={`p-2 rounded-xl border transition ${
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
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition text-left cursor-pointer"
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
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1.5 ring-white" />
              </div>
              <div className="hidden lg:block text-left pr-0.5">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                  {googleUser.displayName || 'ผู้ใช้งาน'}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium leading-none mt-0.5">
                  เข้าสู่ระบบแล้ว
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          ) : (
            <button
              id="btn-login-top-right"
              onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
              title="เข้าสู่ระบบ"
              aria-label="เข้าสู่ระบบ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f06b4b] hover:bg-[#df5e3f] text-white font-medium text-xs transition shadow-sm shadow-[#f06b4b]/20 cursor-pointer active:scale-95"
            >
              {isAuthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogIn className="w-4 h-4 text-white" />
              )}
              <span className="font-bold">เข้าสู่ระบบ</span>
            </button>
          )}

          {/* Login / Profile Dropdown Menu */}
          {isAuthMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {googleUser ? (
                /* Authenticated User Menu */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="User"
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/80"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
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
                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        เชื่อมต่อ Cloud สำเร็จ
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {onOpenGoogleDrive && (
                      <button
                        onClick={() => {
                          setIsAuthMenuOpen(false);
                          onOpenGoogleDrive();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-stone-100 rounded-xl transition text-left"
                      >
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        คลังหลักฐาน Google Drive
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsAuthMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-stone-100 rounded-xl transition text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#f06b4b]" />
                      การตั้งค่าระบบและแอดมิน
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setIsAuthMenuOpen(false);
                        if (onGoogleSignOut) onGoogleSignOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      ออกจากระบบ (Sign Out)
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
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">เข้าสู่ระบบ (Sign In)</h4>
                        <p className="text-[10px] text-stone-500">เลือกวิธีการเข้าใช้งานระบบ</p>
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:border-orange-300 bg-stone-50 hover:bg-orange-50/40 transition text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">เข้าสู่ระบบด้วย Google</div>
                      <div className="text-[10px] text-stone-500">ซิงค์หลักฐานกับ Google Drive</div>
                    </div>
                  </button>

                  {/* Admin Settings Login */}
                  <button
                    onClick={() => {
                      setIsAuthMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-slate-700 shadow-xs group-hover:scale-105 transition shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#f06b4b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">ผู้ดูแลระบบ (Admin Settings)</div>
                      <div className="text-[10px] text-stone-500">จัดการโต๊ะแพ็ค & พนักงาน (รหัส 1234)</div>
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
