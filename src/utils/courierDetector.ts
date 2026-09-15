import { CourierInfo } from '../types';

export const UNKNOWN_COURIER: CourierInfo = {
  id: 'general',
  name: 'General Courier',
  nameTh: 'ขนส่งทั่วไป / ไม่ระบุ',
  badgeBg: 'bg-stone-100 text-stone-700',
  badgeText: 'text-stone-700',
  borderCol: 'border-stone-300',
  iconText: '',
};

export const COURIERS: Record<string, CourierInfo> = {
  flash: {
    id: 'flash',
    name: 'Flash Express',
    nameTh: 'แฟลช เอ็กซ์เพรส (Flash)',
    badgeBg: 'bg-yellow-400 text-slate-900',
    badgeText: 'text-amber-900',
    borderCol: 'border-yellow-400',
    iconText: '',
  },
  jnt: {
    id: 'jnt',
    name: 'J&T Express',
    nameTh: 'เจแอนด์ที เอ็กซ์เพรส (J&T)',
    badgeBg: 'bg-red-600 text-white',
    badgeText: 'text-red-700',
    borderCol: 'border-red-500',
    iconText: '',
  },
  kerry: {
    id: 'kerry',
    name: 'KEX (Kerry Express)',
    nameTh: 'เคอรี่ เอ็กซ์เพรส (KEX)',
    badgeBg: 'bg-orange-500 text-white',
    badgeText: 'text-orange-700',
    borderCol: 'border-orange-500',
    iconText: '',
  },
  spx: {
    id: 'spx',
    name: 'SPX Express',
    nameTh: 'ช้อปปี้ เอ็กซ์เพรส (SPX)',
    badgeBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-800',
    borderCol: 'border-amber-600',
    iconText: '',
  },
  thaipost: {
    id: 'thaipost',
    name: 'Thailand Post',
    nameTh: 'ไปรษณีย์ไทย (EMS / ลงทะเบียน)',
    badgeBg: 'bg-rose-700 text-white',
    badgeText: 'text-rose-800',
    borderCol: 'border-rose-600',
    iconText: '',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop Express',
    nameTh: 'ติ๊กต็อก ช็อป (TikTok)',
    badgeBg: 'bg-slate-900 text-white',
    badgeText: 'text-slate-900',
    borderCol: 'border-slate-800',
    iconText: '',
  },
  ninjavan: {
    id: 'ninjavan',
    name: 'Ninja Van',
    nameTh: 'นินจา แวน (Ninja Van)',
    badgeBg: 'bg-red-800 text-white',
    badgeText: 'text-red-900',
    borderCol: 'border-red-800',
    iconText: '',
  },
  best: {
    id: 'best',
    name: 'Best Express',
    nameTh: 'เบสท์ เอ็กซ์เพรส (BEST)',
    badgeBg: 'bg-sky-600 text-white',
    badgeText: 'text-sky-800',
    borderCol: 'border-sky-500',
    iconText: '',
  },
  dhl: {
    id: 'dhl',
    name: 'DHL eCommerce',
    nameTh: 'ดีเอชแอล (DHL)',
    badgeBg: 'bg-yellow-500 text-red-900',
    badgeText: 'text-yellow-800',
    borderCol: 'border-yellow-600',
    iconText: '',
  },
};

/**
 * Detect courier from tracking number pattern using regular expressions
 * @param tracking Raw tracking string from barcode scanner or input
 */
export function detectCourier(tracking: string): CourierInfo {
  if (!tracking) return UNKNOWN_COURIER;
  const clean = tracking.trim().toUpperCase();

  // SPX Express: starts with SPXTH or SPX
  if (/^SPX[0-9A-Z]+/i.test(clean)) {
    return COURIERS.spx;
  }

  // Thailand Post: Standard UPU S10 format: 2 letters + 9 digits + 2 letters (e.g., ED123456789TH)
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i.test(clean)) {
    return COURIERS.thaipost;
  }

  // Kerry Express (KEX): KER..., KEX..., SHP..., SND..., SMP...
  if (/^(KER|KEX|SHP|SND|SMP|KLN)[0-9A-Z]+/i.test(clean)) {
    return COURIERS.kerry;
  }

  // TikTok Shop: TT..., TTSP..., TKT...
  if (/^(TT|TTSP|TKT)[0-9A-Z]+/i.test(clean)) {
    return COURIERS.tiktok;
  }

  // Ninja Van: NVTH..., NINJA...
  if (/^(NVTH|NINJA)[0-9A-Z]+/i.test(clean)) {
    return COURIERS.ninjavan;
  }

  // Best Express: 22 followed by 10 digits or BEST...
  if (/^22[0-9]{10}$/.test(clean) || /^BEST[0-9A-Z]+/i.test(clean)) {
    return COURIERS.best;
  }

  // DHL: DHL... or starts with 0035...
  if (/^(DHL|0035)[0-9A-Z]+/i.test(clean)) {
    return COURIERS.dhl;
  }

  // Flash Express: Starts with TH followed by alphanumeric (e.g. TH01234567890A)
  if (/^TH[0-9A-Z]{8,}$/i.test(clean) || /^TH[0-9]{10,14}$/i.test(clean)) {
    return COURIERS.flash;
  }

  // J&T Express: 12 pure digits (most common in TH), or starts with 82/83/84 with 12 digits, or JNT
  if (/^[0-9]{12}$/.test(clean) || /^JNT[0-9A-Z]+/i.test(clean) || /^8[2-9][0-9]{10}$/.test(clean)) {
    return COURIERS.jnt;
  }

  // Generic fallback if starting with TH without extra length check
  if (/^TH/i.test(clean)) {
    return COURIERS.flash;
  }

  return UNKNOWN_COURIER;
}
