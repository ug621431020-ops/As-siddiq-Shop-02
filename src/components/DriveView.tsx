import React, { useState, useEffect, useCallback } from 'react';
import { 
  HardDrive, 
  CloudUpload, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Check, 
  FileVideo, 
  Image as ImageIcon, 
  FolderCheck,
  AlertCircle,
  Share2,
  Lock,
  Download,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmModal } from './ConfirmModal';
import { 
  DriveFileInfo, 
  DriveStorageQuota, 
  getDriveStorageInfo, 
  getOrCreateProofsFolder, 
  listDriveProofFiles, 
  uploadProofToDrive, 
  deleteDriveFile 
} from '../services/googleDriveService';
import { PackRecord } from '../types';

interface DriveViewProps {
  user: User | null;
  accessToken: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isLoadingAuth?: boolean;
  isAuthLoading?: boolean;
  records: PackRecord[];
  autoUploadToDrive: boolean;
  setAutoUploadToDrive: (enabled: boolean) => void;
}

export const DriveView: React.FC<DriveViewProps> = ({
  user,
  accessToken,
  onSignIn,
  onSignOut,
  isLoadingAuth,
  isAuthLoading,
  records,
  autoUploadToDrive,
  setAutoUploadToDrive,
}) => {
  const loadingAuth = isLoadingAuth ?? isAuthLoading ?? false;
  const [folderId, setFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFileInfo[]>([]);
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Delete confirmation modal state
  const [deletingFile, setDeletingFile] = useState<DriveFileInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load Drive files and quota
  const loadDriveData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get or create folder
      const targetFolderId = await getOrCreateProofsFolder(accessToken);
      setFolderId(targetFolderId);

      // 2. Fetch files in that folder
      const driveFiles = await listDriveProofFiles(accessToken, {
        folderId: targetFolderId,
        search: searchQuery,
      });
      setFiles(driveFiles);

      // 3. Fetch quota
      const quota = await getDriveStorageInfo(accessToken);
      setStorageQuota(quota);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลจาก Google Drive ได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchQuery]);

  useEffect(() => {
    if (accessToken) {
      loadDriveData();
    }
  }, [accessToken, loadDriveData]);

  // Copy shareable link
  const handleCopyLink = (file: DriveFileInfo) => {
    const link = file.webViewLink || file.webContentLink || '';
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Upload local record proof to Google Drive
  const handleUploadRecordProof = async (rec: PackRecord) => {
    if (!accessToken) return;
    setIsUploading(true);
    setUploadProgressText(`กำลังอัปโหลดหลักฐานพัสดุ ${rec.trackingNumber} ไปยัง Google Drive...`);

    try {
      const targetFolder = folderId || (await getOrCreateProofsFolder(accessToken));

      // 1. Upload snapshot photo if available
      if (rec.imageBlobUrl) {
        const response = await fetch(rec.imageBlobUrl);
        const imageBlob = await response.blob();
        await uploadProofToDrive(
          accessToken,
          imageBlob,
          `${rec.trackingNumber}_proof_${rec.stationId}.jpg`,
          targetFolder,
          `หลักฐานภาพถ่ายการแพ็คพัสดุ ${rec.trackingNumber} โดย ${rec.operatorName || 'พนักงาน'}`
        );
      }

      // 2. Upload video if available
      if (rec.videoBlobUrl) {
        const response = await fetch(rec.videoBlobUrl);
        const videoBlob = await response.blob();
        await uploadProofToDrive(
          accessToken,
          videoBlob,
          `${rec.trackingNumber}_video_${rec.stationId}.webm`,
          targetFolder,
          `วิดีโอบันทึกการแพ็คพัสดุ ${rec.trackingNumber} ขนส่ง ${rec.courier.name}`
        );
      }

      await loadDriveData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลด';
      setError(`อัปโหลดไม่สำเร็จ: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // Upload local file from computer
  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!accessToken || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadProgressText(`กำลังอัปโหลด ${file.name} ไปยัง Google Drive...`);

    try {
      const targetFolder = folderId || (await getOrCreateProofsFolder(accessToken));
      await uploadProofToDrive(accessToken, file, file.name, targetFolder);
      await loadDriveData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(`อัปโหลดไม่สำเร็จ: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Delete file with confirmation
  const handleConfirmDelete = async () => {
    if (!accessToken || !deletingFile) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      setDeletingFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถลบไฟล์ได้';
      setError(`เกิดข้อผิดพลาดในการลบไฟล์: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format bytes helper
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 1. Unauthenticated state
  if (!user || !accessToken) {
    return (
      <div className="w-full flex items-center justify-center p-1 sm:p-3">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 border border-stone-200/90 shadow-xs max-w-md sm:max-w-lg w-full text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <HardDrive className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            เชื่อมต่อ Google Drive
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            สำรองภาพถ่ายและคลิปวิดีโอขึ้นคลังจัดเก็บ Google Drive เพื่อส่งลิงก์หลักฐานให้ลูกค้าหรือยื่นข้อพิพาทได้ทันที
          </p>

          <div className="mt-5 sm:mt-6 flex flex-col items-center gap-2.5 w-full">
            <GoogleSignInButton
              onClick={onSignIn}
              isLoading={loadingAuth}
              text="เข้าสู่ระบบด้วย Google"
              size="md"
              className="w-full max-w-xs shadow-xs"
            />
            <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5 mt-1 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>สร้างโฟลเดอร์ PackSpace_Proofs อัตโนมัติ</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated state
  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Top Banner & Account Status */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Google User'} 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-stone-200 shadow-2xs shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f06b4b]/10 text-[#f06b4b] flex items-center justify-center font-bold text-base shrink-0">
              {(user.displayName || user.email || 'G').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">{user.displayName || 'Google Account'}</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono truncate">{user.email}</p>
          </div>
        </div>

        {/* Quota & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {storageQuota?.limit && (
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-stone-400">พื้นที่ Drive:</div>
              <div className="text-xs font-mono font-bold text-slate-700">
                {formatBytes(storageQuota.usage)} / {formatBytes(storageQuota.limit)}
              </div>
            </div>
          )}

          <label className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-stone-100 hover:bg-stone-200/70 text-slate-700 text-xs font-semibold transition">
            <Plus className="w-3.5 h-3.5" />
            <span>อัปโหลด</span>
            <input
              type="file"
              onChange={handleManualFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onSignOut}
            className="h-8 px-2.5 sm:px-3 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50 text-xs font-semibold transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Auto Backup Toggle & Folder Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Dedicated Folder */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FolderCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">โฟลเดอร์</span>
              <span className="text-xs font-mono font-bold text-slate-800 truncate block">PackSpace_Proofs/</span>
            </div>
          </div>
          {folderId && (
            <a
              href={`https://drive.google.com/drive/folders/${folderId}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-stone-400 hover:text-[#f06b4b] rounded-lg"
              title="เปิดใน Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Card 2: Auto Backup Switch */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              autoUploadToDrive ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
            }`}>
              <CloudUpload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">สำรองอัตโนมัติ</span>
              <span className="text-xs font-bold text-slate-800 block">
                {autoUploadToDrive ? 'เปิด (Auto)' : 'ปิด (Manual)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoUploadToDrive(!autoUploadToDrive)}
            className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              autoUploadToDrive ? 'bg-[#f06b4b]' : 'bg-stone-300'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform transform shadow-xs ${
                autoUploadToDrive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Card 3: Files count */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#f06b4b] flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">ไฟล์ในระบบ</span>
              <span className="text-xs font-bold text-slate-800 block">{files.length} รายการ</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadDriveData}
            disabled={loading}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
            title="รีเฟรช"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Progress alert when uploading */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center gap-3 text-xs animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
          <span>{uploadProgressText}</span>
        </div>
      )}

      {/* Quick Sync from local records (if any record isn't on drive yet) */}
      {records.length > 0 && (
        <div className="bg-stone-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200/70">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-600">
              ซิงค์หลักฐานขึ้น Google Drive:
            </span>
            <span className="text-[11px] text-stone-400">เลือกพัสดุเพื่อสำรอง</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1.5">
            {records.slice(0, 6).map((rec) => (
              <div 
                key={rec.id} 
                className="bg-white border border-stone-200 rounded-xl p-2.5 min-w-[190px] shrink-0 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-slate-800">{rec.trackingNumber}</div>
                  <div className="text-[10px] text-stone-400">{rec.courier.name} • {rec.durationSec}s</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUploadRecordProof(rec)}
                  disabled={isUploading}
                  className="px-2 py-1 rounded-lg bg-[#f06b4b] hover:bg-[#e05a3a] text-white text-[11px] font-bold shadow-xs transition shrink-0"
                >
                  ส่งขึ้นคลาวด์
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drive File Browser & Search */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขพัสดุ หรือชื่อไฟล์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f06b4b] focus:border-[#f06b4b]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>แสดง {files.length} รายการ</span>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="m-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Files Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">ชื่อไฟล์</th>
                <th className="px-3 py-2.5">ขนาด</th>
                <th className="px-3 py-2.5">วันที่</th>
                <th className="px-3 py-2.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-stone-400">
                    <CloudUpload className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                    <div>ยังไม่มีไฟล์หลักฐานใน Drive</div>
                    <div className="text-[11px] mt-0.5 text-stone-400">
                      เมื่อบันทึกการแพ็คพัสดุสำเร็จ ไฟล์จะปรากฏที่นี่
                    </div>
                  </td>
                </tr>
              ) : (
                files.map((file) => {
                  const isVideo = file.mimeType.includes('video');
                  const isCopied = copiedId === file.id;

                  return (
                    <tr key={file.id} className="hover:bg-stone-50/80 transition">
                      <td className="px-3.5 py-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isVideo ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isVideo ? <FileVideo className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-slate-900 block truncate max-w-xs md:max-w-md text-xs">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-normal">
                              {isVideo ? 'วิดีโอ' : 'ภาพถ่าย'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-stone-500 text-xs">
                        {file.size ? formatBytes(Number(file.size)) : '-'}
                      </td>

                      <td className="px-3 py-2.5 text-stone-500 text-xs">
                        {file.createdTime
                          ? new Date(file.createdTime).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(file)}
                            className={`h-7 px-2 rounded-md border text-xs font-semibold flex items-center gap-1 transition ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200'
                            }`}
                            title="คัดลอกลิงก์"
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span className="hidden md:inline">{isCopied ? 'คัดลอกแล้ว' : 'แชร์'}</span>
                          </button>

                          {/* Open in Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded-md border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 transition inline-flex items-center justify-center"
                              title="เปิดใน Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete File (Triggers Mandatory Confirmation Dialog) */}
                          <button
                            type="button"
                            onClick={() => setDeletingFile(file)}
                            className="h-7 w-7 rounded-md border border-stone-200 bg-white hover:bg-red-50 text-stone-400 hover:text-red-600 transition inline-flex items-center justify-center"
                            title="ลบไฟล์"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Deleting File (Mandatory by Skill) */}
      <ConfirmModal
        isOpen={Boolean(deletingFile)}
        title="ยืนยันการลบไฟล์จาก Google Drive"
        message={`คุณต้องการลบไฟล์ "${deletingFile?.name}" ออกจาก Google Drive ใช่หรือไม่?\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้ และลิงก์หลักฐานนี้จะใช้งานไม่ได้`}
        confirmLabel="ลบไฟล์ถาวร"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingFile(null)}
      />

    </div>
  );
};
