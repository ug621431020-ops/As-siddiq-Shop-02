import { PackerStaff, PackingStation } from '../types';

export const DEFAULT_PACKERS: PackerStaff[] = [
  { 
    id: 'OP-01', 
    name: 'อัญชลี รุ่งเรือง', 
    nickname: 'แอน', 
    role: 'พนักงานแพ็คสินค้า (Packer)', 
    avatarColor: 'bg-emerald-600' 
  },
  { 
    id: 'OP-02', 
    name: 'ภานุวัฒน์ มั่งมี', 
    nickname: 'นุ', 
    role: 'พนักงานแพ็คด่วน (Express Order)', 
    avatarColor: 'bg-blue-600' 
  },
  { 
    id: 'OP-03', 
    name: 'วรรณวิสา รักดี', 
    nickname: 'ฟ้า', 
    role: 'พนักงานแพ็คสินค้าทั่วไป (General)', 
    avatarColor: 'bg-indigo-600' 
  },
  { 
    id: 'OP-04', 
    name: 'สุภาพร เพ็ชรดี', 
    nickname: 'พร', 
    role: 'พนักงานตรวจสอบ QC & แพ็คกิ้ง', 
    avatarColor: 'bg-rose-600' 
  },
];

export const DEFAULT_STATIONS: PackingStation[] = [
  { id: 'STATION-01', name: 'โต๊ะแพ็ค 1', description: 'แผนกสินค้าหลัก', active: true },
  { id: 'STATION-02', name: 'โต๊ะแพ็ค 2', description: 'สินค้าแตกง่าย (Fragile)', active: true },
  { id: 'STATION-03', name: 'โต๊ะแพ็ค 3', description: 'ออเดอร์เร่งด่วน (Express)', active: true },
  { id: 'STATION-04', name: 'โต๊ะแพ็ค 4', description: 'พัสดุชิ้นใหญ่ (Oversize)', active: true },
  { id: 'STATION-VIP', name: 'โต๊ะแพ็คพรีเมียม', description: 'VIP / สินค้าพรีเมียม', active: true },
];

export function getPackerById(id: string, staffList: PackerStaff[] = DEFAULT_PACKERS): PackerStaff {
  const found = staffList.find((p) => p.id === id);
  return found || staffList[0] || DEFAULT_PACKERS[0];
}
