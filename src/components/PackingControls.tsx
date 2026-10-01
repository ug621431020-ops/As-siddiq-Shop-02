import React, { useState } from 'react';
import { 
  Scan, 
  Square, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Lock, 
  Truck, 
  User, 
  Users, 
  Building, 
  ChevronDown,
  Settings,
  ShieldCheck,
  Package
} from 'lucide-react';
import { RecordStatus, CourierInfo, PackingStation, PackerStaff, PackagingType } from '../types';
import { DEFAULT_PACKERS, DEFAULT_STATIONS } from '../utils/staffData';
import { 
  PACKAGING_TYPE_LABELS, 
  getSizesByType 
} from '../utils/packagingData';

interface PackingControlsProps {
  stationId: string;
  setStationId: (id: string) => void;
  stations?: PackingStation[];
  operatorId: string;
  setOperatorId: (id: string) => void;
  packers?: PackerStaff[];
  customOperatorName?: string;
  setCustomOperatorName?: (name: string) => void;
  packerAvatarUrl?: string;
  trackingNumber: string;
  setTrackingNumber: (tracking: string) => void;
  trackingInputRef: React.RefObject<HTMLInputElement | null>;
  courier: CourierInfo;
  selectedCourierId: string;
  onSelectCourier: (id: string) => void;
  customCourierName?: string;
  setCustomCourierName?: (name: string) => void;
  courierLogoUrl?: string;
  packagingType?: PackagingType;
  setPackagingType?: (type: PackagingType) => void;
  selectedPackageSizeId?: string;
  setSelectedPackageSizeId?: (id: string) => void;
  customPackageDimension?: string;
  setCustomPackageDimension?: (dim: string) => void;
  recordStatus: RecordStatus;
  onStartRecord: () => void;
  onStopAndCapture: () => void;
  onManualReset: () => void;
  onOpenAdminSettings?: () => void;
  alertInfo: {
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    countdown: number;
    totalSeconds: number;
  };
}

export const PackingControls: React.FC<PackingControlsProps> = ({
  stationId,
  setStationId,
  stations = DEFAULT_STATIONS,
  operatorId,
  setOperatorId,
  packers = DEFAULT_PACKERS,
  customOperatorName = '',
  setCustomOperatorName,
  packerAvatarUrl,
  trackingNumber,
  setTrackingNumber,
  trackingInputRef,
  courier,
  selectedCourierId,
  onSelectCourier,
  customCourierName = '',
  setCustomCourierName,
  courierLogoUrl,
  packagingType,
  setPackagingType,
  selectedPackageSizeId,
  setSelectedPackageSizeId,
  customPackageDimension = '',
  setCustomPackageDimension,
  recordStatus,
  onStartRecord,
  onStopAndCapture,
  onManualReset,
  onOpenAdminSettings,
  alertInfo,
}) => {
  const isInputsLocked = recordStatus === 'recording' || recordStatus === 'stopping' || recordStatus === 'uploading';

  // Internal state fallback if not controlled
  const [internalPkgType, setInternalPkgType] = useState<PackagingType>('box');
  const [internalPkgSizeId, setInternalPkgSizeId] = useState<string>('box-B');
  const [internalCustomDim, setInternalCustomDim] = useState<string>('');

  const activePackagingType = packagingType ?? internalPkgType;
  const setActivePackagingType = setPackagingType ?? setInternalPkgType;

  const activePkgSizeId = selectedPackageSizeId ?? internalPkgSizeId;
  const setActivePkgSizeId = setSelectedPackageSizeId ?? setInternalPkgSizeId;

  const activeCustomDim = customPackageDimension ?? internalCustomDim;
  const setActiveCustomDim = setCustomPackageDimension ?? setInternalCustomDim;

  const currentTypeSizes = getSizesByType(activePackagingType);
  const currentSelectedSize = currentTypeSizes.find((s) => s.id === activePkgSizeId) || currentTypeSizes[0];

  // Find active packer object from current packers list
  const currentPacker = packers.find((p) => p.id === operatorId) || packers[0] || DEFAULT_PACKERS[0];
  const activeAvatar = packerAvatarUrl || currentPacker?.avatarUrl;

  // Active station
  const currentStation = stations.find((s) => s.id === stationId) || stations[0] || DEFAULT_STATIONS[0];

  // List of courier options for dropdown selection
  const courierOptions = [
    { id: 'auto', name: 'ตรวจจับอัตโนมัติ (Auto-Detect ตามเลขพัสดุ)' },
    { id: 'flash', name: 'Flash Express' },
    { id: 'spx', name: 'SPX Express (Shopee)' },
    { id: 'kerry', name: 'Kerry / KEX Express' },
    { id: 'jnt', name: 'J&T Express' },
    { id: 'thaipost', name: 'ไปรษณีย์ไทย (EMS / ลงทะเบียน)' },
    { id: 'tiktok', name: 'TikTok Shop Express' },
    { id: 'ninjavan', name: 'Ninja Van' },
    { id: 'best', name: 'Best Express' },
    { id: 'dhl', name: 'DHL Express' },
    { id: 'general', name: 'ขนส่งทั่วไป (General)' },
    { id: 'custom', name: 'ขนส่งกำหนดเอง (Custom Courier)' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Auto-Reset Countdown Banner */}
      {alertInfo.show && (
        <div 
          id="auto-reset-banner"
          className={`rounded-2xl p-4 transition-all duration-300 shadow-sm border ${
            alertInfo.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : alertInfo.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {alertInfo.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm leading-tight">{alertInfo.title}</h4>
                <p className="text-xs opacity-80 mt-0.5">{alertInfo.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 border border-current/20">
                {alertInfo.countdown}s
              </span>
              <button
                type="button"
                onClick={onManualReset}
                title="ข้ามเวลารีเซ็ต"
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-stone-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-current transition-all duration-1000 ease-linear"
              style={{
                width: `${(alertInfo.countdown / alertInfo.totalSeconds) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Main Packing Console Panel */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-stone-200 shadow-sm">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              สถานีแพ็คพัสดุ
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              บันทึกวิดีโอและหลักฐาน
            </p>
          </div>

          {recordStatus === 'recording' ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              REC
            </span>
          ) : isInputsLocked ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Lock className="w-3.5 h-3.5" />
              กำลังประมวลผล
            </span>
          ) : null}
        </div>

        {/* SECTION 1: พนักงานผู้แพ็ค */}
        <div className="mb-4 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <label 
              htmlFor="packer-select-dropdown"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[#f06b4b]" />
              <span>ผู้แพ็คพัสดุ</span>
            </label>
            
            {onOpenAdminSettings && (
              <button
                type="button"
                onClick={onOpenAdminSettings}
                className="text-[11px] text-[#f06b4b] hover:text-[#e05837] font-medium flex items-center gap-1 transition"
                title="จัดการพนักงานในการตั้งค่าระบบ"
              >
                <Settings className="w-3 h-3" />
                <span>จัดการพนักงาน</span>
              </button>
            )}
          </div>

          {/* Packer Dropdown Select */}
          <div className="relative mb-2.5">
            <select
              id="packer-select-dropdown"
              disabled={isInputsLocked}
              value={operatorId}
              onChange={(e) => {
                setOperatorId(e.target.value);
                if (e.target.value !== 'CUSTOM' && setCustomOperatorName) {
                  setCustomOperatorName('');
                }
              }}
              className="w-full px-3 py-2 pr-10 text-xs font-medium rounded-xl border border-stone-300 bg-white text-slate-800 focus:border-[#f06b4b] focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[40px] appearance-none disabled:bg-stone-100 disabled:opacity-60 cursor-pointer"
            >
              {packers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.nickname}) - {staff.role}
                </option>
              ))}
              <option value="CUSTOM">ระบุชื่อเอง (Custom)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Custom Name Input if CUSTOM is selected */}
          {operatorId === 'CUSTOM' && setCustomOperatorName && (
            <div className="mb-2.5">
              <input
                type="text"
                value={customOperatorName}
                onChange={(e) => setCustomOperatorName(e.target.value)}
                placeholder="พิมพ์ชื่อ-นามสกุล หรือชื่อเล่นผู้แพ็ค..."
                disabled={isInputsLocked}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[38px] text-slate-800"
              />
            </div>
          )}

          {/* Active Packer Card Preview */}
          <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circular Avatar */}
              <div className="relative shrink-0">
                {activeAvatar ? (
                  <img
                    src={activeAvatar}
                    alt={currentPacker?.name || 'Packer'}
                    className="w-10 h-10 rounded-full aspect-square object-cover border border-[#f06b4b]/30 shadow-2xs"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full aspect-square ${currentPacker?.avatarColor || 'bg-[#f06b4b]'} text-white flex items-center justify-center font-bold text-sm shadow-2xs`}>
                    {operatorId === 'CUSTOM' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      currentPacker?.nickname ? currentPacker.nickname.charAt(0) : 'P'
                    )}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-slate-900 truncate block">
                  {operatorId === 'CUSTOM' ? (customOperatorName || 'ระบุชื่อเอง') : `${currentPacker?.name} (${currentPacker?.nickname})`}
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  {operatorId === 'CUSTOM' ? 'พนักงานชั่วคราว' : currentPacker?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: โต๊ะแพ็ค */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label 
              htmlFor="station-select"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
            >
              <Building className="w-4 h-4 text-stone-500" />
              <span>โต๊ะแพ็ค</span>
            </label>
            {onOpenAdminSettings && (
              <button
                type="button"
                onClick={onOpenAdminSettings}
                className="text-[11px] text-stone-400 hover:text-[#f06b4b] transition flex items-center gap-1"
              >
                <span>+ จัดการโต๊ะ</span>
              </button>
            )}
          </div>

          <div className="relative">
            <select
              id="station-select"
              value={stationId}
              disabled={isInputsLocked}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-3 py-2 pr-10 min-h-[40px] rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] font-medium text-xs text-slate-800 transition disabled:opacity-60 cursor-pointer appearance-none"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.id} ({st.name} {st.description ? `- ${st.description}` : ''})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* SECTION 3: เลขพัสดุ & เลือกขนส่ง */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label 
              htmlFor="tracking-input"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
            >
              <Scan className="w-4 h-4 text-[#f06b4b]" />
              <span>เลขพัสดุ</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrackingNumber(`TH${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                className="text-[11px] text-[#f06b4b] hover:text-[#d95535] font-medium transition cursor-pointer"
                title="สุ่มเลขพัสดุสำหรับทดสอบระบบ"
              >
                + สุ่มเลขทดสอบ
              </button>
              <span className="text-[11px] text-stone-400">
                (Enter)
              </span>
            </div>
          </div>

          <div className="relative">
            <input
              ref={trackingInputRef}
              id="tracking-input"
              type="text"
              value={trackingNumber}
              disabled={isInputsLocked}
              placeholder="สแกนบาร์โค้ด หรือพิมพ์เลขพัสดุ..."
              autoComplete="off"
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onStartRecord();
                }
              }}
              className="w-full px-3.5 py-2.5 pr-10 min-h-[44px] rounded-xl border-2 border-stone-300 focus:border-[#f06b4b] focus:outline-none focus:ring-3 focus:ring-[#f06b4b]/20 font-mono text-sm font-bold text-slate-900 tracking-wide transition placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 placeholder:text-xs disabled:bg-stone-100 disabled:text-stone-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <Scan className="w-4 h-4" />
            </div>
          </div>

          {/* ขนส่งให้เลือก (Courier Dropdown) */}
          <div className="mt-3 p-3 rounded-xl border border-stone-200 bg-stone-50/80">
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="courier-select-dropdown"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-[#f06b4b]" />
                <span>บริษัทขนส่ง:</span>
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${courier.badgeBg} flex items-center gap-1`}>
                {courier.logoUrl ? (
                  <img src={courier.logoUrl} alt={courier.name} className="w-3 h-3 rounded-full object-contain" />
                ) : (
                  <Truck className="w-2.5 h-2.5" />
                )}
                <span>{courier.name}</span>
              </span>
            </div>

            {/* Courier Dropdown Select */}
            <div className="relative">
              <select
                id="courier-select-dropdown"
                disabled={isInputsLocked}
                value={selectedCourierId}
                onChange={(e) => onSelectCourier(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-xs font-medium rounded-xl border border-stone-300 bg-white text-slate-800 focus:border-[#f06b4b] focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[40px] appearance-none disabled:bg-stone-100 disabled:opacity-60 cursor-pointer"
              >
                {courierOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Custom Courier Name Input if 'custom' is selected */}
            {selectedCourierId === 'custom' && setCustomCourierName && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customCourierName}
                  onChange={(e) => setCustomCourierName(e.target.value)}
                  placeholder="ระบุชื่อขนส่ง เช่น Lalamove, Lineman..."
                  disabled={isInputsLocked}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[38px] text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3.5: ขนาดบรรจุภัณฑ์ (กล่อง / ถุง / ซอง) */}
        <div className="mb-4 p-3 rounded-xl border border-stone-200 bg-stone-50/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#f06b4b]" />
              <span>ขนาดบรรจุภัณฑ์:</span>
            </label>
            <span className="text-[10px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
              {PACKAGING_TYPE_LABELS[activePackagingType].icon} {activePkgSizeId === 'custom' ? (activeCustomDim || 'กำหนดเอง') : (currentSelectedSize?.name || 'เลือกขนาด')}
            </span>
          </div>

          {/* 3 Type Switch Buttons: กล่อง, ถุง, ซอง */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-200/60 mb-2.5">
            {(['box', 'bag', 'envelope'] as const).map((type) => {
              const active = activePackagingType === type;
              const info = PACKAGING_TYPE_LABELS[type];
              return (
                <button
                  key={type}
                  type="button"
                  disabled={isInputsLocked}
                  onClick={() => {
                    setActivePackagingType(type);
                    const sizes = getSizesByType(type);
                    const defaultSize = sizes.find(s => s.popular) || sizes[0];
                    if (defaultSize) {
                      setActivePkgSizeId(defaultSize.id);
                    }
                  }}
                  className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    active
                      ? 'bg-[#f06b4b] text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-slate-900 border border-stone-200/80'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.short}</span>
                </button>
              );
            })}
          </div>

          {/* Quick selection chips for the active packaging type */}
          <div className="mb-2">
            <div className="text-[10px] text-stone-400 font-medium mb-1">
              ขนาดยอดนิยม ({PACKAGING_TYPE_LABELS[activePackagingType].label}):
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {currentTypeSizes.slice(0, 8).map((size) => {
                const isSelected = activePkgSizeId === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    disabled={isInputsLocked}
                    onClick={() => setActivePkgSizeId(size.id)}
                    className={`h-6.5 px-2 rounded-md text-[11px] font-medium transition cursor-pointer disabled:opacity-60 ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                    title={`${size.name} (${size.dimensions}) - ${size.description || ''}`}
                  >
                    <span>{size.name.replace('ถุง ', '').replace('ซอง ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Dropdown for all sizes of active type */}
          <div className="relative">
            <select
              value={activePkgSizeId}
              disabled={isInputsLocked}
              onChange={(e) => setActivePkgSizeId(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-xs font-medium rounded-xl border border-stone-300 bg-white text-slate-800 focus:border-[#f06b4b] focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[38px] appearance-none disabled:bg-stone-100 disabled:opacity-60 cursor-pointer"
            >
              {currentTypeSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name} • {size.dimensions} {size.description ? `(${size.description})` : ''}
                </option>
              ))}
              <option value="custom">กำหนดขนาดเอง (Custom Size)...</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Custom Size Input if selected */}
          {activePkgSizeId === 'custom' && (
            <div className="mt-2">
              <input
                type="text"
                value={activeCustomDim}
                disabled={isInputsLocked}
                onChange={(e) => setActiveCustomDim(e.target.value)}
                placeholder="ระบุขนาด เช่น 25 x 30 x 15 cm..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 min-h-[36px] text-slate-800"
              />
            </div>
          )}

          {/* Selected Size Dimension Badge */}
          {currentSelectedSize && activePkgSizeId !== 'custom' && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 bg-white/70 px-2.5 py-1.5 rounded-lg border border-stone-200/60">
              <span>ขนาด: <strong className="font-mono text-slate-800">{currentSelectedSize.dimensions}</strong></span>
              {currentSelectedSize.description && (
                <span className="text-stone-400 truncate max-w-[170px]">{currentSelectedSize.description}</span>
              )}
            </div>
          )}
        </div>

        {/* SECTION 4: Action Buttons (Record / Stop) */}
        <div className="pt-1 flex flex-col gap-2">
          {recordStatus === 'recording' ? (
            <button
              id="btn-stop-record"
              type="button"
              onClick={onStopAndCapture}
              className="w-full h-12 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>หยุดบันทึก (Spacebar)</span>
            </button>
          ) : (
            <button
              id="btn-start-record"
              type="button"
              disabled={isInputsLocked}
              onClick={onStartRecord}
              className="w-full h-12 px-5 rounded-xl bg-[#f06b4b] hover:bg-[#e05837] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none text-white font-bold text-sm shadow-md shadow-[#f06b4b]/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เริ่มบันทึก (Enter)</span>
            </button>
          )}

          {/* Quick Manual Reset button */}
          <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-0.5">
            <span>Enter เริ่ม / Spacebar หยุด</span>
            <button
              type="button"
              onClick={onManualReset}
              className="hover:text-stone-700 transition flex items-center gap-1 py-1"
            >
              <RotateCcw className="w-3 h-3" /> ล้างหน้าจอ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
