import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Check, 
  X, 
  Volume2, 
  ShieldCheck, 
  Send,
  Lock,
  Unlock,
  Building,
  User,
  Plus,
  Trash2,
  Edit2,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { AppConfig, PackingStation, PackerStaff } from '../types';
import { processUploadedImage } from '../utils/imageUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  stations: PackingStation[];
  onUpdateStations: (stations: PackingStation[]) => void;
  packers: PackerStaff[];
  onUpdatePackers: (packers: PackerStaff[]) => void;
  customLogos?: Record<string, string>;
  onUpdateCustomLogos?: (logos: Record<string, string>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  stations,
  onUpdateStations,
  packers,
  onUpdatePackers,
  customLogos = {},
  onUpdateCustomLogos,
}) => {
  // Main Tab
  const [activeMainTab, setActiveMainTab] = useState<'general' | 'admin'>('general');

  // Admin Auth State (Username: admin, Password: 1234)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Admin Sub-Tab
  const [adminSubTab, setAdminSubTab] = useState<'stations' | 'packers' | 'logos'>('stations');

  // General Form Data
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // New Station Form State
  const [newStationId, setNewStationId] = useState('');
  const [newStationName, setNewStationName] = useState('');
  const [newStationDesc, setNewStationDesc] = useState('');
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editStationName, setEditStationName] = useState('');
  const [editStationDesc, setEditStationDesc] = useState('');

  // New Packer Form State
  const [newPackerId, setNewPackerId] = useState('');
  const [newPackerName, setNewPackerName] = useState('');
  const [newPackerNickname, setNewPackerNickname] = useState('');
  const [newPackerRole, setNewPackerRole] = useState('พนักงานแพ็คสินค้า');
  const [editingPackerId, setEditingPackerId] = useState<string | null>(null);
  const [editPackerName, setEditPackerName] = useState('');
  const [editPackerNickname, setEditPackerNickname] = useState('');
  const [editPackerRole, setEditPackerRole] = useState('');
  const [imageProcessingLoading, setImageProcessingLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    if (adminUsername.trim() === 'admin' && adminPassword === '1234') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      setAdminLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (รหัสคือ admin / 1234)');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminUnlocked(false);
    setAdminPassword('');
    setAdminLoginError(null);
  };

  // Test REST API ping
  const handleTestApi = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(formData.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, ping: 'PackSpace Connection Test' }),
      });
      if (res.ok) {
        setTestResult('[OK] เชื่อมต่อสำเร็จ (HTTP 200 OK)');
      } else {
        setTestResult(`[WARN] เซิร์ฟเวอร์ตอบกลับสถานะ HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เชื่อมต่อไม่สำเร็จ';
      setTestResult(`[ERROR] ข้อผิดพลาด: ${msg} (หากทดสอบผ่านเบราว์เซอร์ โปรดตรวจสอบ CORS)`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  // Station Management Handlers
  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationId.trim() || !newStationName.trim()) return;

    const formattedId = newStationId.trim().toUpperCase();
    if (stations.some((s) => s.id === formattedId)) {
      alert(`รหัสโต๊ะ ${formattedId} มีอยู่ในระบบแล้ว`);
      return;
    }

    const updated: PackingStation[] = [
      ...stations,
      {
        id: formattedId,
        name: newStationName.trim(),
        description: newStationDesc.trim() || 'แผนกทั่วไป',
        active: true,
      },
    ];
    onUpdateStations(updated);
    setNewStationId('');
    setNewStationName('');
    setNewStationDesc('');
  };

  const handleDeleteStation = (id: string) => {
    if (stations.length <= 1) {
      alert('ระบบต้องมีโต๊ะแพ็คอย่างน้อย 1 โต๊ะ');
      return;
    }
    if (window.confirm(`ยืนยันการลบโต๊ะแพ็ค ${id} ออกจากระบบ?`)) {
      const updated = stations.filter((s) => s.id !== id);
      onUpdateStations(updated);
      if (formData.stationId === id) {
        setFormData({ ...formData, stationId: updated[0].id });
      }
    }
  };

  const handleStartEditStation = (st: PackingStation) => {
    setEditingStationId(st.id);
    setEditStationName(st.name);
    setEditStationDesc(st.description || '');
  };

  const handleSaveEditStation = (id: string) => {
    const updated = stations.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          name: editStationName.trim() || s.name,
          description: editStationDesc.trim() || s.description,
        };
      }
      return s;
    });
    onUpdateStations(updated);
    setEditingStationId(null);
  };

  const handleToggleStationActive = (id: string) => {
    const updated = stations.map((s) => {
      if (s.id === id) {
        return { ...s, active: !s.active };
      }
      return s;
    });
    onUpdateStations(updated);
  };

  // Packer Management Handlers
  const handleAddPacker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackerName.trim()) return;

    const id = newPackerId.trim() || `OP-${String(packers.length + 1).padStart(2, '0')}`;
    if (packers.some((p) => p.id === id)) {
      alert(`รหัสพนักงาน ${id} มีอยู่ในระบบแล้ว`);
      return;
    }

    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-purple-600'];
    const randomColor = colors[packers.length % colors.length];

    const updated: PackerStaff[] = [
      ...packers,
      {
        id,
        name: newPackerName.trim(),
        nickname: newPackerNickname.trim() || newPackerName.trim().slice(0, 3),
        role: newPackerRole.trim() || 'พนักงานแพ็คสินค้า',
        avatarColor: randomColor,
      },
    ];
    onUpdatePackers(updated);
    setNewPackerId('');
    setNewPackerName('');
    setNewPackerNickname('');
    setNewPackerRole('พนักงานแพ็คสินค้า');
  };

  const handleDeletePacker = (id: string) => {
    if (packers.length <= 1) {
      alert('ระบบต้องมีพนักงานผู้แพ็คอย่างน้อย 1 คน');
      return;
    }
    if (window.confirm(`ยืนยันการลบพนักงาน ${id} ออกจากระบบ?`)) {
      const updated = packers.filter((p) => p.id !== id);
      onUpdatePackers(updated);
    }
  };

  const handleUploadPackerPhoto = async (packerId: string, file: File) => {
    try {
      setImageProcessingLoading(true);
      // Auto-crop into a 1:1 circle (aspect ratio 1:1) from any image size/format
      const circleDataUrl = await processUploadedImage(file, 400, true);
      const updated = packers.map((p) => {
        if (p.id === packerId) {
          return { ...p, avatarUrl: circleDataUrl };
        }
        return p;
      });
      onUpdatePackers(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลรูป';
      alert(msg);
    } finally {
      setImageProcessingLoading(false);
    }
  };

  const handleRemovePackerPhoto = (packerId: string) => {
    const updated = packers.map((p) => {
      if (p.id === packerId) {
        const { avatarUrl, ...rest } = p;
        return rest;
      }
      return p;
    });
    onUpdatePackers(updated);
  };

  const handleStartEditPacker = (p: PackerStaff) => {
    setEditingPackerId(p.id);
    setEditPackerName(p.name);
    setEditPackerNickname(p.nickname);
    setEditPackerRole(p.role);
  };

  const handleSaveEditPacker = (id: string) => {
    const updated = packers.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: editPackerName.trim() || p.name,
          nickname: editPackerNickname.trim() || p.nickname,
          role: editPackerRole.trim() || p.role,
        };
      }
      return p;
    });
    onUpdatePackers(updated);
    setEditingPackerId(null);
  };

  // Logo upload handler
  const handleUploadLogo = async (logoKey: string, file: File) => {
    if (!onUpdateCustomLogos) return;
    try {
      setImageProcessingLoading(true);
      const circleDataUrl = await processUploadedImage(file, 400, true);
      onUpdateCustomLogos({
        ...customLogos,
        [logoKey]: circleDataUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูป';
      alert(msg);
    } finally {
      setImageProcessingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">การตั้งค่าระบบ</h3>
              <p className="text-xs text-stone-500">
                ตั้งค่าเซิร์ฟเวอร์ และการจัดการระบบแอดมิน (admin/1234)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tab Navigation */}
        <div className="px-6 pt-3 border-b border-stone-200 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('general')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeMainTab === 'general'
                ? 'border-[#f06b4b] text-[#f06b4b] bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>ทั่วไป & REST API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('admin')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeMainTab === 'admin'
                ? 'border-[#f06b4b] text-[#f06b4b] bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-slate-800'
            }`}
          >
            {isAdminUnlocked ? (
              <Unlock className="w-4 h-4 text-emerald-600" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600" />
            )}
            <span>การตั้งค่าระบบ แอดมิน {isAdminUnlocked ? '(ปลดล็อกแล้ว)' : '(admin/1234)'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm bg-stone-50/30">
          
          {/* ================= TAB 1: GENERAL & API ================= */}
          {activeMainTab === 'general' && (
            <div className="space-y-5">
              {/* 1. API_URL */}
              <div>
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-[#f06b4b]" />
                  REST API Endpoint (API_URL)
                </label>
                <p className="text-xs text-stone-500 mb-2">
                  URL ปลายทางที่ฟังก์ชัน <code>uploadData(payload)</code> จะทำการยิง <code>fetch()</code> ไปเก็บไฟล์
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    placeholder="เช่น /api/upload หรือ https://api.yourdomain.com/v1/pack-proof"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-[#f06b4b]/30 focus:border-[#f06b4b] outline-none bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleTestApi}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    {testing ? 'กำลังทดสอบ...' : 'ทดสอบ Ping'}
                  </button>
                </div>
                {testResult && (
                  <div className="mt-2 text-xs font-mono p-2 rounded-lg bg-white border border-stone-200">
                    {testResult}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-stone-400">ปุ่มลัดค่าเริ่มต้น:</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, apiUrl: '/api/upload' })}
                    className="text-[11px] text-[#f06b4b] hover:underline font-mono"
                  >
                    /api/upload (Vite Internal Handler)
                  </button>
                </div>
              </div>

              {/* 2. Payload Format */}
              <div>
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                  รูปแบบการส่งข้อมูล (Payload Format)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${
                    formData.uploadFormat === 'multipart' 
                      ? 'border-[#f06b4b] bg-[#fef3ee] text-slate-900' 
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">multipart/form-data</span>
                      <input
                        type="radio"
                        name="uploadFormat"
                        checked={formData.uploadFormat === 'multipart'}
                        onChange={() => setFormData({ ...formData, uploadFormat: 'multipart' })}
                        className="accent-[#f06b4b]"
                      />
                    </div>
                    <span className="text-[11px] opacity-75">แนะนำสำหรับไฟล์ขนาดใหญ่ (Blob Files)</span>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${
                    formData.uploadFormat === 'json_base64' 
                      ? 'border-[#f06b4b] bg-[#fef3ee] text-slate-900' 
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">JSON Base64</span>
                      <input
                        type="radio"
                        name="uploadFormat"
                        checked={formData.uploadFormat === 'json_base64'}
                        onChange={() => setFormData({ ...formData, uploadFormat: 'json_base64' })}
                        className="accent-[#f06b4b]"
                      />
                    </div>
                    <span className="text-[11px] opacity-75">application/json พร้อม Base64 String</span>
                  </label>
                </div>
              </div>

              {/* 3. Auto Reset Timeout */}
              <div>
                <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                  ระยะเวลา Auto-Reset (วินาที)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.autoResetSeconds}
                    onChange={(e) => setFormData({ ...formData, autoResetSeconds: Number(e.target.value) })}
                    className="flex-1 accent-[#f06b4b]"
                  />
                  <span className="font-mono font-bold text-base text-[#f06b4b] w-12 text-right">
                    {formData.autoResetSeconds}s
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  ค่าเริ่มต้นที่แนะนำ: 3 วินาที (ให้พนักงานเห็นผลลัพธ์แล้วรีเซ็ตรับกล่องใหม่ทันที)
                </p>
              </div>

              {/* 4. Toggles */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <label className="flex items-center justify-between cursor-pointer p-3 bg-white rounded-xl border border-stone-200">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <Volume2 className="w-4 h-4 text-stone-400" />
                    เปิดเสียงบี๊บจำลองเครื่องสแกนบาร์โค้ด (Web Audio API)
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.soundEnabled}
                    onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#f06b4b] rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 bg-white rounded-xl border border-stone-200">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-stone-400" />
                    ประทับลายน้ำความละเอียดสูงลงในภาพถ่ายหลักฐาน (Timestamp & Station)
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.watermarkEnabled}
                    onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#f06b4b] rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ADMIN MANAGEMENT ================= */}
          {activeMainTab === 'admin' && (
            <div>
              {!isAdminUnlocked ? (
                /* Admin Login Screen */
                <div className="max-w-md mx-auto py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">
                    เข้าสู่ระบบแอดมิน (Admin Access)
                  </h4>
                  <p className="text-xs text-stone-500 mb-6">
                    การเพิ่มหรือแก้ไขโต๊ะแพ็ค และการอัปโหลดรูปภาพประจำตัวพนักงาน สงวนสิทธิ์สำหรับแอดมินเท่านั้น
                  </p>

                  <form onSubmit={handleAdminLogin} className="space-y-3.5 text-left bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อผู้ใช้ (Username)
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        รหัสผ่าน (Password)
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน (เช่น 1234)"
                        autoFocus
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20 focus:border-[#f06b4b] font-mono"
                      />
                    </div>

                    {adminLoginError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{adminLoginError}</span>
                      </div>
                    )}

                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>รหัสผ่านแอดมินระบบ: <strong>admin</strong> / <strong>1234</strong></span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#f06b4b] hover:bg-[#e05837] text-white font-bold text-xs shadow-md shadow-[#f06b4b]/20 transition flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      เข้าสู่ระบบแอดมิน
                    </button>
                  </form>
                </div>
              ) : (
                /* Admin Unlocked Workspace */
                <div className="space-y-6">
                  {/* Admin Top Status Bar */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>แอดมินล็อกอินอยู่ (Admin: admin)</span>
                      <span className="text-[11px] font-normal text-emerald-600 hidden sm:inline">
                        — มีสิทธิ์เต็มในการเพิ่ม/แก้ไขโต๊ะแพ็คและรูปภาพ
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      ออกจากระบบ
                    </button>
                  </div>

                  {/* Admin Sub-Tabs */}
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setAdminSubTab('stations')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        adminSubTab === 'stations'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>จัดการโต๊ะแพ็ค ({stations.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminSubTab('packers')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        adminSubTab === 'packers'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>ผู้แพ็ค & อัปโหลดรูป 1:1 ({packers.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminSubTab('logos')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        adminSubTab === 'logos'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>โลโก้ & รูปภาพระบบ</span>
                    </button>
                  </div>

                  {/* ================= SUB-TAB 1: STATIONS ================= */}
                  {adminSubTab === 'stations' && (
                    <div className="space-y-4">
                      {/* Add Station Form */}
                      <form onSubmit={handleAddStation} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Plus className="w-4 h-4 text-[#f06b4b]" />
                          <span>เพิ่มโต๊ะแพ็คใหม่ (Add Station)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            value={newStationId}
                            onChange={(e) => setNewStationId(e.target.value)}
                            placeholder="รหัสโต๊ะ เช่น STATION-05"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:border-[#f06b4b] outline-none"
                            required
                          />
                          <input
                            type="text"
                            value={newStationName}
                            onChange={(e) => setNewStationName(e.target.value)}
                            placeholder="ชื่อโต๊ะ เช่น โต๊ะแพ็ค 5"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#f06b4b] outline-none"
                            required
                          />
                          <input
                            type="text"
                            value={newStationDesc}
                            onChange={(e) => setNewStationDesc(e.target.value)}
                            placeholder="แผนก / คำอธิบาย (ไม่บังคับ)"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#f06b4b] outline-none"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#f06b4b] hover:bg-[#e05837] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            เพิ่มโต๊ะแพ็ค
                          </button>
                        </div>
                      </form>

                      {/* Station List */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                          รายการโต๊ะแพ็คปัจจุบัน ({stations.length})
                        </span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {stations.map((st) => (
                            <div
                              key={st.id}
                              className="p-3.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs"
                            >
                              {editingStationId === st.id ? (
                                <div className="flex-1 flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-stone-500">{st.id}</span>
                                  <input
                                    type="text"
                                    value={editStationName}
                                    onChange={(e) => setEditStationName(e.target.value)}
                                    placeholder="ชื่อโต๊ะ"
                                    className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={editStationDesc}
                                    onChange={(e) => setEditStationDesc(e.target.value)}
                                    placeholder="รายละเอียด"
                                    className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 outline-none flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditStation(st.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                  >
                                    บันทึก
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStationId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 font-mono font-bold text-xs">
                                      {st.id.slice(-2)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-xs text-slate-900">{st.id}</span>
                                        <span className="font-semibold text-xs text-stone-700">{st.name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                          st.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'
                                        }`}>
                                          {st.active ? 'เปิดใช้งาน' : 'ปิดชั่วคราว'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-stone-400 mt-0.5">
                                        {st.description || 'ไม่มีคำอธิบาย'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStationActive(st.id)}
                                      className="p-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg transition"
                                      title={st.active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                                    >
                                      {st.active ? 'ปิด' : 'เปิด'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditStation(st)}
                                      className="p-1.5 text-stone-500 hover:text-slate-800 hover:bg-stone-100 rounded-lg transition"
                                      title="แก้ไข"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStation(st.id)}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="ลบโต๊ะแพ็ค"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= SUB-TAB 2: PACKERS & 1:1 CIRCLE PHOTO ================= */}
                  {adminSubTab === 'packers' && (
                    <div className="space-y-4">
                      {/* Notice about 1:1 Circle Photos */}
                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>ระบบปรับขนาดรูปเป็นวงกลม 1:1 อัตโนมัติ:</strong>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            สามารถอัปโหลดรูปภาพขนาดใดก็ได้ (แนวนอน, แนวตั้ง, ไฟล์จากมือถือ) ระบบจะทำการ Center-Crop และบีบอัดเป็นรูปทรงวงกลม 1:1 อัตโนมัติ เพื่อแสดงเป็นรูปประจำตัวและตราประทับในลายน้ำ
                          </p>
                        </div>
                      </div>

                      {/* Add Packer Form */}
                      <form onSubmit={handleAddPacker} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Plus className="w-4 h-4 text-[#f06b4b]" />
                          <span>เพิ่มพนักงานผู้แพ็คใหม่ (Add Packer)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <input
                            type="text"
                            value={newPackerId}
                            onChange={(e) => setNewPackerId(e.target.value)}
                            placeholder={`รหัส เช่น OP-0${packers.length + 1}`}
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:border-[#f06b4b] outline-none"
                          />
                          <input
                            type="text"
                            value={newPackerName}
                            onChange={(e) => setNewPackerName(e.target.value)}
                            placeholder="ชื่อ-นามสกุล เช่น สมชาย ใจดี"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#f06b4b] outline-none"
                            required
                          />
                          <input
                            type="text"
                            value={newPackerNickname}
                            onChange={(e) => setNewPackerNickname(e.target.value)}
                            placeholder="ชื่อเล่น เช่น ชาย"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#f06b4b] outline-none"
                          />
                          <input
                            type="text"
                            value={newPackerRole}
                            onChange={(e) => setNewPackerRole(e.target.value)}
                            placeholder="ตำแหน่ง เช่น พนักงานแพ็คกิ้ง"
                            className="px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#f06b4b] outline-none"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#f06b4b] hover:bg-[#e05837] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            เพิ่มพนักงาน
                          </button>
                        </div>
                      </form>

                      {/* Packers List */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                          รายชื่อพนักงานและรูปประจำตัววงกลม 1:1 ({packers.length})
                        </span>
                        <div className="grid grid-cols-1 gap-3">
                          {packers.map((p) => (
                            <div
                              key={p.id}
                              className="p-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-4 shadow-2xs"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {/* 1:1 Circle Avatar */}
                                <div className="relative shrink-0">
                                  {p.avatarUrl ? (
                                    <img
                                      src={p.avatarUrl}
                                      alt={p.name}
                                      className="w-13 h-13 rounded-full aspect-square object-cover border-2 border-stone-200 shadow-xs"
                                    />
                                  ) : (
                                    <div className={`w-13 h-13 rounded-full aspect-square ${p.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-xs`}>
                                      {p.nickname ? p.nickname.charAt(0) : p.name.charAt(0)}
                                    </div>
                                  )}
                                  {p.avatarUrl && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="มีรูปประจำตัวแล้ว" />
                                  )}
                                </div>

                                {/* Info or Edit Mode */}
                                {editingPackerId === p.id ? (
                                  <div className="flex-1 flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={editPackerName}
                                      onChange={(e) => setEditPackerName(e.target.value)}
                                      placeholder="ชื่อ-นามสกุล"
                                      className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 outline-none"
                                    />
                                    <input
                                      type="text"
                                      value={editPackerNickname}
                                      onChange={(e) => setEditPackerNickname(e.target.value)}
                                      placeholder="ชื่อเล่น"
                                      className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 outline-none w-20"
                                    />
                                    <input
                                      type="text"
                                      value={editPackerRole}
                                      onChange={(e) => setEditPackerRole(e.target.value)}
                                      placeholder="ตำแหน่ง"
                                      className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditPacker(p.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPackerId(null)}
                                      className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-stone-400 font-bold">{p.id}</span>
                                      <span className="font-bold text-sm text-slate-900 truncate">
                                        {p.name} ({p.nickname})
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                                      {p.role}
                                    </p>
                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                      {p.avatarUrl ? '✓ รูปภาพวงกลม 1:1 พร้อมใช้งาน' : 'ยังไม่มีรูปประจำตัว (ใช้ตัวย่อ)'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Upload / Edit / Delete Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Upload Button - accepts any size, auto 1:1 circle */}
                                <label
                                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                                  title="เลือกรูปขนาดใดก็ได้ ระบบจะปรับเป็นวงกลม 1:1 ให้อัตโนมัติ"
                                >
                                  <Camera className="w-3.5 h-3.5 text-[#f06b4b]" />
                                  <span className="hidden sm:inline">
                                    {p.avatarUrl ? 'เปลี่ยนรูป 1:1' : 'อัปโหลดรูป 1:1'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={imageProcessingLoading}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadPackerPhoto(p.id, file);
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>

                                {p.avatarUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePackerPhoto(p.id)}
                                    className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                    title="ลบรูปประจำตัว"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartEditPacker(p)}
                                  className="p-1.5 rounded-xl text-stone-500 hover:text-slate-800 hover:bg-stone-100 transition"
                                  title="แก้ไขข้อมูลพนักงาน"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePacker(p.id)}
                                  className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="ลบพนักงาน"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= SUB-TAB 3: LOGOS ================= */}
                  {adminSubTab === 'logos' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          รูปภาพโลโก้ขนส่งและสัญลักษณ์ร้าน (Custom Logos)
                        </h5>
                        <p className="text-xs text-stone-500">
                          อัปโหลดไฟล์รูปภาพสำหรับประทับลายน้ำหรือแสดงเป็นไอคอนขนส่ง ระบบปรับขนาดให้อัตโนมัติ
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full aspect-square bg-white border border-stone-300 flex items-center justify-center overflow-hidden">
                                {customLogos['shop_logo'] ? (
                                  <img src={customLogos['shop_logo']} alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <Building className="w-5 h-5 text-stone-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">โลโก้ร้านค้า/คลังสินค้า</span>
                                <span className="text-[11px] text-stone-400">ขนาดวงกลม 1:1</span>
                              </div>
                            </div>

                            <label className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-[#f06b4b] text-slate-700 font-semibold text-xs cursor-pointer transition flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-[#f06b4b]" />
                              <span>อัปโหลด</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadLogo('shop_logo', f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full aspect-square bg-white border border-stone-300 flex items-center justify-center overflow-hidden">
                                {customLogos['watermark_logo'] ? (
                                  <img src={customLogos['watermark_logo']} alt="Watermark Logo" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <ShieldCheck className="w-5 h-5 text-stone-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">ตราประทับลายน้ำวิดีโอ</span>
                                <span className="text-[11px] text-stone-400">ขนาดวงกลม 1:1</span>
                              </div>
                            </div>

                            <label className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-[#f06b4b] text-slate-700 font-semibold text-xs cursor-pointer transition flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-[#f06b4b]" />
                              <span>อัปโหลด</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadLogo('watermark_logo', f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {activeMainTab === 'admin' && isAdminUnlocked && (
              <span className="text-emerald-700 font-medium">✓ บันทึกโต๊ะและผู้แพ็คอัตโนมัติ</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200/70 font-semibold text-xs transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#f06b4b] hover:bg-[#e05837] text-white font-bold text-xs shadow-md shadow-[#f06b4b]/20 transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
