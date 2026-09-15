/**
 * PackSpace - Packing Proof & Verification System
 * Inspired by PRISM Design Language • WebRTC & Barcode Scanning
 * Includes Real-time Packing Console, Analytics Dashboard (Today, Week, Month), and Packer Staff Tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { PackingControls } from './components/PackingControls';
import { DashboardView } from './components/DashboardView';
import { DriveView } from './components/DriveView';
import { CalendarView } from './components/CalendarView';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportStandaloneModal } from './components/ExportStandaloneModal';
import { detectCourier, UNKNOWN_COURIER, COURIERS } from './utils/courierDetector';
import { captureVideoFrameWithWatermark } from './utils/watermark';
import { playSound } from './utils/audioBeep';
import { DEFAULT_PACKERS, DEFAULT_STATIONS } from './utils/staffData';
import { getInitialPackRecords } from './utils/sampleRecords';
import { RecordStatus, PackRecord, AppConfig, PackingStation, PackerStaff } from './types';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, googleSignOut } from './services/googleAuth';
import { uploadProofToDrive, getOrCreateProofsFolder } from './services/googleDriveService';
import { X, ExternalLink, FileVideo, Image as ImageIcon } from 'lucide-react';

// Default system configuration
const DEFAULT_CONFIG: AppConfig = {
  apiUrl: '/api/upload',
  uploadFormat: 'multipart',
  autoResetSeconds: 3,
  stationId: 'STATION-01',
  currentOperatorId: 'OP-01',
  preferCodec: 'video/webm;codecs=vp9',
  soundEnabled: true,
  watermarkEnabled: true,
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'console' | 'dashboard' | 'drive' | 'calendar' | 'history' | 'settings' | 'export'>('console');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Google Workspace Auth State (In-Memory Token Cache)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [autoUploadToDrive, setAutoUploadToDrive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('packspace_auto_drive') === 'true';
    } catch {
      return false;
    }
  });

  // Toggle and persist auto upload preference
  const handleSetAutoUploadToDrive = (val: boolean) => {
    setAutoUploadToDrive(val);
    try {
      localStorage.setItem('packspace_auto_drive', val ? 'true' : 'false');
    } catch {
      // Ignore
    }
  };

  // Google Sign-In & Sign-Out handlers
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleAccessToken(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        // If not signed in or token needs refresh
        setGoogleAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Configuration
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('packspace_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Stations State (Managed by Admin in SettingsModal)
  const [stations, setStations] = useState<PackingStation[]>(() => {
    try {
      const saved = localStorage.getItem('packspace_stations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_STATIONS;
  });

  const handleUpdateStations = (newStations: PackingStation[]) => {
    setStations(newStations);
    try {
      localStorage.setItem('packspace_stations', JSON.stringify(newStations));
    } catch {
      // ignore
    }
  };

  // Packers State (Managed by Admin in SettingsModal, with 1:1 circular photo upload)
  const [packers, setPackers] = useState<PackerStaff[]>(() => {
    try {
      const saved = localStorage.getItem('packspace_packers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PACKERS;
  });

  const handleUpdatePackers = (newPackers: PackerStaff[]) => {
    setPackers(newPackers);
    try {
      localStorage.setItem('packspace_packers', JSON.stringify(newPackers));
    } catch {
      // ignore
    }
  };

  // Custom Logos State (Admin uploadable)
  const [customLogos, setCustomLogos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('packspace_custom_logos');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  const handleUpdateCustomLogos = (logos: Record<string, string>) => {
    setCustomLogos(logos);
    try {
      localStorage.setItem('packspace_custom_logos', JSON.stringify(logos));
    } catch {
      // ignore
    }
  };

  // Packer Staff Selection
  const [operatorId, setOperatorId] = useState<string>(config.currentOperatorId || 'OP-01');
  const [customOperatorName, setCustomOperatorName] = useState<string>('');

  // Active packer object & display name
  const currentPacker = packers.find((p) => p.id === operatorId) || packers[0] || DEFAULT_PACKERS[0];
  const activeOperatorDisplayName = operatorId === 'CUSTOM'
    ? (customOperatorName.trim() || 'พนักงานชั่วคราว')
    : `${currentPacker.name} (${currentPacker.nickname})`;

  // Packing Station & Barcode State
  const [stationId, setStationId] = useState<string>(config.stationId || 'STATION-01');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [recordStatus, setRecordStatus] = useState<RecordStatus>('idle');
  const [recordedSeconds, setRecordedSeconds] = useState<number>(0);

  // Records History (Initializes with sample records if empty so dashboard displays immediately)
  const [records, setRecords] = useState<PackRecord[]>(() => {
    try {
      const saved = localStorage.getItem('packspace_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return getInitialPackRecords();
    } catch {
      return getInitialPackRecords();
    }
  });

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('packspace_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Lightbox for inspecting proof from Dashboard or Table
  const [inspectedRecord, setInspectedRecord] = useState<PackRecord | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraResolution, setCameraResolution] = useState<string>('720p HD');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // Auto Reset & Alert State
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    countdown: number;
    totalSeconds: number;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success',
    countdown: 3,
    totalSeconds: 3,
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Courier Selection & Auto-Detection
  const [selectedCourierId, setSelectedCourierId] = useState<string>('auto');
  const detectedCourier = detectCourier(trackingNumber);
  const courier = (selectedCourierId !== 'auto' && COURIERS[selectedCourierId])
    ? COURIERS[selectedCourierId]
    : detectedCourier;

  // Today count calculation
  const todayCount = records.filter((r) => {
    const d = new Date(r.timestamp);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;

  // Persist history records
  useEffect(() => {
    try {
      localStorage.setItem('packspace_history', JSON.stringify(records.slice(0, 100)));
    } catch {
      // Ignore quota error
    }
  }, [records]);

  // Persist config
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    setStationId(newConfig.stationId);
    try {
      localStorage.setItem('packspace_config', JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
  };

  // Auto-focus tracking input when idle and on console tab
  useEffect(() => {
    if (recordStatus === 'idle' && activeTab === 'console') {
      const timer = setTimeout(() => {
        trackingInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [recordStatus, activeTab]);

  // Reset function to prepare for next package
  const resetToReady = useCallback(() => {
    if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);

    setAlertInfo((prev) => ({ ...prev, show: false }));
    setRecordStatus('idle');
    setTrackingNumber('');
    setRecordedSeconds(0);

    // Re-focus input for immediate next scan
    setTimeout(() => {
      trackingInputRef.current?.focus();
    }, 100);
  }, []);

  // Start 3-second auto reset countdown
  const triggerAutoReset = useCallback((title: string, message: string, type: 'success' | 'error') => {
    const totalSec = config.autoResetSeconds || 3;
    let remaining = totalSec;

    setAlertInfo({
      show: true,
      title,
      message,
      type,
      countdown: remaining,
      totalSeconds: totalSec,
    });

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setAlertInfo((prev) => ({ ...prev, countdown: Math.max(0, remaining) }));
      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    autoResetTimerRef.current = setTimeout(() => {
      resetToReady();
    }, totalSec * 1000);
  }, [config.autoResetSeconds, resetToReady]);

  // Upload Data to REST API
  const uploadData = async (payload: {
    station: string;
    operatorId: string;
    operatorName: string;
    tracking: string;
    courierName: string;
    videoBlob: Blob;
    imageBlob: Blob;
    durationSec: number;
    timestamp: string;
    imageDataUrl: string;
  }) => {
    setRecordStatus('uploading');

    const videoBlobUrl = URL.createObjectURL(payload.videoBlob);
    const imageBlobUrl = payload.imageDataUrl;
    const videoSizeFormatted = `${(payload.videoBlob.size / (1024 * 1024)).toFixed(2)} MB`;

    try {
      let response: Response;

      if (config.uploadFormat === 'multipart') {
        const formData = new FormData();
        formData.append('station', payload.station);
        formData.append('operatorId', payload.operatorId);
        formData.append('operatorName', payload.operatorName);
        formData.append('tracking', payload.tracking);
        formData.append('courier', payload.courierName);
        formData.append('durationSec', payload.durationSec.toString());
        formData.append('timestamp', payload.timestamp);
        formData.append('video', payload.videoBlob, `${payload.tracking}_pack.webm`);
        formData.append('image', payload.imageBlob, `${payload.tracking}_proof.jpg`);

        response = await fetch(config.apiUrl, {
          method: 'POST',
          body: formData,
        });
      } else {
        // JSON Base64 Mode
        const reader = new FileReader();
        const videoBase64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(payload.videoBlob);
        });
        const videoBase64 = await videoBase64Promise;

        response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station: payload.station,
            operatorId: payload.operatorId,
            operatorName: payload.operatorName,
            tracking: payload.tracking,
            courier: payload.courierName,
            durationSec: payload.durationSec,
            timestamp: payload.timestamp,
            videoBase64: videoBase64,
            imageBase64: payload.imageDataUrl,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resJson = await response.json().catch(() => ({}));
      playSound('success', config.soundEnabled);

      // Save to Record History
      const newRecord: PackRecord = {
        id: resJson.id || `PK-${Date.now().toString().slice(-6)}`,
        stationId: payload.station,
        operatorId: payload.operatorId,
        operatorName: payload.operatorName,
        trackingNumber: payload.tracking,
        courier: courier,
        timestamp: payload.timestamp,
        durationSec: payload.durationSec,
        videoBlobUrl,
        imageBlobUrl,
        videoSize: videoSizeFormatted,
        uploadStatus: 'success',
        uploadResponse: resJson.message || 'บันทึกสำเร็จ',
        apiEndpointUsed: config.apiUrl,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setRecordStatus('success');

      // Auto Upload to Google Drive if enabled and authenticated
      if (autoUploadToDrive && googleAccessToken) {
        (async () => {
          try {
            const folder = await getOrCreateProofsFolder(googleAccessToken);
            await uploadProofToDrive(
              googleAccessToken,
              payload.imageBlob,
              `${payload.tracking}_proof_${payload.station}.jpg`,
              folder,
              `หลักฐานภาพถ่ายพัสดุ ${payload.tracking} (${courier.name}) โดย ${payload.operatorName}`
            );
          } catch (driveErr) {
            console.warn('Auto Drive upload error:', driveErr);
          }
        })();
      }

      triggerAutoReset(
        'บันทึกและส่งข้อมูลสำเร็จ!',
        `พัสดุ: ${payload.tracking} (${courier.name}) • ผู้แพ็ค: ${payload.operatorName}${autoUploadToDrive && googleAccessToken ? ' • ส่งขึ้น Drive แล้ว' : ''}`,
        'success'
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Upload failed';
      console.warn('REST API Upload Warning:', errMsg);
      playSound('error', config.soundEnabled);

      // Save local record anyway so proof is not lost!
      const fallbackRecord: PackRecord = {
        id: `PK-${Date.now().toString().slice(-6)}`,
        stationId: payload.station,
        operatorId: payload.operatorId,
        operatorName: payload.operatorName,
        trackingNumber: payload.tracking,
        courier: courier,
        timestamp: payload.timestamp,
        durationSec: payload.durationSec,
        videoBlobUrl,
        imageBlobUrl,
        videoSize: videoSizeFormatted,
        uploadStatus: 'failed',
        uploadResponse: errMsg,
        apiEndpointUsed: config.apiUrl,
      };

      setRecords((prev) => [fallbackRecord, ...prev]);
      setRecordStatus('error');
      triggerAutoReset(
        'เกิดข้อผิดพลาดในการเชื่อมต่อ API',
        `ไม่สามารถส่งไปยัง ${config.apiUrl} (${errMsg}) • บันทึกหลักฐานในเครื่องแล้ว`,
        'error'
      );
    }
  };

  // 1. Handle Start Recording (Barcode Scan / Enter Key)
  const handleStartRecord = () => {
    const cleanTracking = trackingNumber.trim();
    if (!cleanTracking) {
      triggerAutoReset('ไม่พบเลขแทรคกิ้ง', 'กรุณาสแกนบาร์โค้ดหรือพิมพ์เลขพัสดุก่อนเริ่ม', 'error');
      trackingInputRef.current?.focus();
      return;
    }

    if (recordStatus === 'recording') return;

    // Check video stream
    const videoStream = videoRef.current?.srcObject as MediaStream | undefined;
    if (!videoStream || !videoStream.active) {
      triggerAutoReset('กล้องยังไม่พร้อมใช้งาน', 'กรุณาตรวจสอบการอนุญาตใช้งานกล้อง WebRTC', 'error');
      return;
    }

    playSound('scan', config.soundEnabled);
    setTimeout(() => playSound('start', config.soundEnabled), 120);

    setRecordStatus('recording');
    setRecordedSeconds(0);
    recordedChunksRef.current = [];

    // MediaRecorder with VP9 / WebM / MP4 codec
    let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      } else {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      const recorder = new MediaRecorder(videoStream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(400); // 400ms time slice
      mediaRecorderRef.current = recorder;
    } catch {
      // Fallback without explicit mimeType
      const recorder = new MediaRecorder(videoStream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(400);
      mediaRecorderRef.current = recorder;
    }

    // Start timer counter
    const startTime = Date.now();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      setRecordedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  // 2. Handle Stop & Capture (Button Trigger)
  const handleStopAndCapture = async () => {
    if (recordStatus !== 'recording') return;

    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecordStatus('stopping');
    playSound('stop', config.soundEnabled);

    const durationSec = Math.max(1, recordedSeconds);
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Capture still snapshot with watermark via Canvas
    let snapshotResult: { blob: Blob; dataUrl: string; width: number; height: number };
    try {
      snapshotResult = await captureVideoFrameWithWatermark(
        videoEl,
        {
          station: stationId,
          tracking: trackingNumber.trim(),
          courierName: courier.name,
          durationSec,
          operatorName: activeOperatorDisplayName,
          operatorId: currentPacker.id,
        },
        config.watermarkEnabled
      );
    } catch {
      // Fallback blank blob
      const blank = new Blob([], { type: 'image/jpeg' });
      snapshotResult = { blob: blank, dataUrl: '', width: 1280, height: 720 };
    }

    // Stop recorder and collect final video Blob
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = async () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'video/webm',
        });

        // Trigger REST API uploadData(payload)
        await uploadData({
          station: stationId,
          operatorId: currentPacker.id,
          operatorName: activeOperatorDisplayName,
          tracking: trackingNumber.trim(),
          courierName: courier.name,
          videoBlob,
          imageBlob: snapshotResult.blob,
          durationSec,
          timestamp: new Date().toISOString(),
          imageDataUrl: snapshotResult.dataUrl,
        });
      };

      recorder.stop();
    } else {
      resetToReady();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f6f4] text-slate-800 antialiased selection:bg-[#f06b4b] selection:text-white">
      
      {/* Left Sidebar Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'history') {
            setActiveTab('history');
          } else if (tab === 'settings') {
            setActiveTab('settings');
          } else if (tab === 'export') {
            setShowExportModal(true);
          } else if (tab === 'dashboard') {
            setActiveTab('dashboard');
          } else if (tab === 'drive') {
            setActiveTab('drive');
          } else if (tab === 'calendar') {
            setActiveTab('calendar');
          } else {
            setActiveTab('console');
          }
        }}
        recordCount={records.length}
        currentStation={stationId}
        currentOperatorName={activeOperatorDisplayName}
        recordStatus={recordStatus}
        isCameraActive={isCameraActive}
        resolutionText={cameraResolution}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isGoogleConnected={!!googleUser}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <Header
          stationId={stationId}
          operatorName={activeOperatorDisplayName}
          recordStatus={recordStatus}
          todayCount={todayCount}
          soundEnabled={config.soundEnabled}
          setSoundEnabled={(enabled) => setConfig({ ...config, soundEnabled: enabled })}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenExportModal={() => setShowExportModal(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenDashboard={() => setActiveTab('dashboard')}
          googleUser={googleUser}
          onOpenGoogleDrive={() => setActiveTab('drive')}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          isAuthLoading={isAuthLoading}
        />

        {/* View Switcher: Packing Console vs. Dashboard vs. Drive vs. Calendar */}
        <main className="p-4 md:p-6 lg:p-8 max-w-[1680px] w-full mx-auto flex-1 flex flex-col gap-6">
          
          {activeTab === 'dashboard' ? (
            /* ================= VIEW 1: ANALYTICS DASHBOARD ================= */
            <DashboardView
              records={records}
              onViewRecordDetail={(rec) => setInspectedRecord(rec)}
              onSwitchToConsole={() => setActiveTab('console')}
              packers={packers}
            />
          ) : activeTab === 'drive' ? (
            /* ================= VIEW 2: GOOGLE DRIVE CLOUD ================= */
            <DriveView
              user={googleUser}
              accessToken={googleAccessToken}
              isLoadingAuth={isAuthLoading}
              onSignIn={handleGoogleSignIn}
              onSignOut={handleGoogleSignOut}
              records={records}
              autoUploadToDrive={autoUploadToDrive}
              setAutoUploadToDrive={handleSetAutoUploadToDrive}
            />
          ) : activeTab === 'calendar' ? (
            /* ================= VIEW 3: GOOGLE CALENDAR SCHEDULE ================= */
            <CalendarView
              user={googleUser}
              accessToken={googleAccessToken}
              isLoadingAuth={isAuthLoading}
              onSignIn={handleGoogleSignIn}
              onSignOut={handleGoogleSignOut}
              todayPackCount={todayCount}
              stationId={stationId}
            />
          ) : (
            /* ================= VIEW 4: PACKING CONSOLE ================= */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* 1. Camera Live Feed & Watermark Display */}
              <div className="xl:col-span-7 flex flex-col gap-4">
                <CameraView
                  videoRef={videoRef}
                  recordStatus={recordStatus}
                  recordedSeconds={recordedSeconds}
                  stationId={stationId}
                  operatorName={activeOperatorDisplayName}
                  trackingNumber={trackingNumber}
                  courier={courier}
                  onCameraReady={(active, res) => {
                    setIsCameraActive(active);
                    setCameraResolution(res);
                  }}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDeviceId={setSelectedDeviceId}
                />
              </div>

              {/* 2. Packing Controls & Barcode Scanner Area */}
              <div className="xl:col-span-5">
                <PackingControls
                  stationId={stationId}
                  setStationId={setStationId}
                  stations={stations}
                  operatorId={operatorId}
                  setOperatorId={setOperatorId}
                  packers={packers}
                  customOperatorName={customOperatorName}
                  setCustomOperatorName={setCustomOperatorName}
                  trackingNumber={trackingNumber}
                  setTrackingNumber={setTrackingNumber}
                  trackingInputRef={trackingInputRef}
                  courier={courier}
                  selectedCourierId={selectedCourierId}
                  onSelectCourier={setSelectedCourierId}
                  recordStatus={recordStatus}
                  onStartRecord={handleStartRecord}
                  onStopAndCapture={handleStopAndCapture}
                  onManualReset={resetToReady}
                  onOpenAdminSettings={() => setActiveTab('settings')}
                  alertInfo={alertInfo}
                />
              </div>

            </div>
          )}

        </main>

        {/* Global Footer info */}
        <footer className="px-6 py-2.5 border-t border-stone-200/80 bg-white text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ระบบบันทึกหลักฐานการแพ็คสินค้า</span>
            <span>•</span>
            <span>PRISM Verification Engine</span>
          </div>
        </footer>

      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={activeTab === 'history'}
        onClose={() => setActiveTab('console')}
        records={records}
        onClearHistory={() => setRecords([])}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={activeTab === 'settings'}
        onClose={() => setActiveTab('console')}
        config={config}
        onSaveConfig={handleSaveConfig}
        stations={stations}
        onUpdateStations={handleUpdateStations}
        packers={packers}
        onUpdatePackers={handleUpdatePackers}
        customLogos={customLogos}
        onUpdateCustomLogos={handleUpdateCustomLogos}
      />

      {/* Standalone Code Export Modal */}
      <ExportStandaloneModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        apiUrl={config.apiUrl}
      />

      {/* Inspection Lightbox (from Dashboard) */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-mono text-base font-bold text-[#f06b4b]">
                  {inspectedRecord.trackingNumber}
                </div>
                <div className="text-xs text-stone-400">
                  {inspectedRecord.courier.name} • {inspectedRecord.stationId} • ผู้แพ็ค: {inspectedRecord.operatorName || 'ไม่ระบุ'} • เวลา {new Date(inspectedRecord.timestamp).toLocaleTimeString('th-TH')}
                </div>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="p-2 text-stone-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {inspectedRecord.imageBlobUrl && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 block">
                    ภาพถ่ายหลักฐานพร้อมลายน้ำและชื่อพนักงาน (Canvas Snapshot):
                  </span>
                  <img
                    src={inspectedRecord.imageBlobUrl}
                    alt="Proof Detail"
                    className="w-full rounded-xl border border-slate-800 shadow-md"
                  />
                </div>
              )}

              {inspectedRecord.videoBlobUrl && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 block">
                    วิดีโอขณะแพ็คสินค้า (Video Playback):
                  </span>
                  <video
                    src={inspectedRecord.videoBlobUrl}
                    controls
                    className="w-full rounded-xl border border-slate-800 bg-black max-h-72"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1.5 font-mono text-stone-300">
                <div>รหัสพัสดุ: <span className="text-white">{inspectedRecord.id}</span></div>
                <div>ผู้แพ็คเกอร์: <span className="text-[#f06b4b]">{inspectedRecord.operatorName}</span></div>
                <div>เวลาที่บันทึก: <span>{inspectedRecord.durationSec} วินาที</span></div>
                <div>สถานะ API: <span className="text-emerald-400">{inspectedRecord.uploadResponse}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
