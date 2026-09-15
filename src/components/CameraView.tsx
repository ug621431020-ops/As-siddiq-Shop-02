import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Grid3X3, 
  Maximize2, 
  AlertCircle, 
  Sparkles, 
  VideoOff, 
  Check, 
  SwitchCamera
} from 'lucide-react';
import { RecordStatus, CourierInfo } from '../types';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  recordStatus: RecordStatus;
  recordedSeconds: number;
  stationId: string;
  operatorName?: string;
  operatorAvatarUrl?: string;
  trackingNumber: string;
  courier: CourierInfo;
  onCameraReady?: (active: boolean, resolution: string) => void;
  selectedDeviceId?: string;
  onSelectDeviceId?: (id: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  recordStatus,
  recordedSeconds,
  stationId,
  operatorName,
  operatorAvatarUrl,
  trackingNumber,
  courier,
  onCameraReady,
  selectedDeviceId,
  onSelectDeviceId,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resolution, setResolution] = useState<string>('1280x720 (720p HD)');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isUsingDemoStream, setIsUsingDemoStream] = useState<boolean>(false);
  
  const demoAnimationRef = useRef<number | null>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clock in overlay
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('th-TH', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Enumerate video devices
  const enumerateDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
      }
    } catch {
      // Ignore device list error
    }
  };

  // Start Camera Stream
  const startCamera = async (deviceId?: string, mode?: 'environment' | 'user') => {
    setErrorMessage('');
    if (demoAnimationRef.current) {
      cancelAnimationFrame(demoAnimationRef.current);
      demoAnimationRef.current = null;
    }
    setIsUsingDemoStream(false);

    const activeMode = mode || facingMode;

    try {
      // Stop old tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      // Constraints optimized for both mobile phones and desktop webcams
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: deviceId ? undefined : { ideal: activeMode },
          deviceId: deviceId ? { exact: deviceId } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setHasPermission(true);

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings?.() || {};
      const res = `${settings.width || 1280}x${settings.height || 720} (720p HD)`;
      setResolution(res);
      onCameraReady?.(true, res);

      await enumerateDevices();
    } catch (err: unknown) {
      console.warn('WebRTC getUserMedia error or permission denied:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเปิดกล้องได้';
      setErrorMessage(msg);
      setHasPermission(false);
      onCameraReady?.(false, 'N/A');

      // Start animated simulation canvas so user can still test recording & evidence creation seamlessly!
      startSimulationFeed();
    }
  };

  // Toggle between Front and Back camera (especially on mobile phones)
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (onSelectDeviceId) {
      onSelectDeviceId('');
    }
    startCamera(undefined, nextMode);
  };

  // Fallback Canvas simulation generator (e.g. inside sandboxed environments without real webcams)
  const startSimulationFeed = () => {
    setIsUsingDemoStream(true);
    setHasPermission(true);
    const canvas = demoCanvasRef.current || document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    demoCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      frame++;
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      // Simulated Packing Table & Box
      ctx.fillStyle = '#334155';
      ctx.fillRect(200, 480, 880, 240);

      // Packing Box
      const boxW = 380;
      const boxH = 260;
      const boxX = (1280 - boxW) / 2;
      const boxY = 320 + Math.sin(frame * 0.04) * 4;

      ctx.fillStyle = '#d97706'; // Cardboard brown
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();

      // Tape stripe
      ctx.fillStyle = '#b45309';
      ctx.fillRect(boxX + 20, boxY + boxH / 2 - 20, boxW - 40, 40);

      // Barcode sticker on box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(boxX + 40, boxY + 40, 180, 90, 6);
      ctx.fill();

      // Barcode bars
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 28; i++) {
        const barX = boxX + 55 + i * 5.2;
        const w = (i % 3 === 0) ? 3 : 1.5;
        ctx.fillRect(barX, boxY + 52, w, 45);
      }
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(trackingNumber || 'TH0123456789A', boxX + 55, boxY + 115);

      // Scanning Laser Line (Animated)
      const laserY = boxY + 20 + ((frame * 3) % (boxH - 40));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(boxX + 20, laserY);
      ctx.lineTo(boxX + boxW - 20, laserY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Notice text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '16px "Noto Sans Thai", sans-serif';
      ctx.fillText('กล้องจำลองโต๊ะแพ็คพัสดุ (Simulated 720p HD)', 40, 60);

      demoAnimationRef.current = requestAnimationFrame(draw);
    };

    draw();

    try {
      const stream = canvas.captureStream(30);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      const res = '1280x720 (Demo 720p)';
      setResolution(res);
      onCameraReady?.(true, res);
    } catch {
      // Capture stream fallback
    }
  };

  useEffect(() => {
    startCamera(selectedDeviceId, facingMode);
    return () => {
      if (demoAnimationRef.current) {
        cancelAnimationFrame(demoAnimationRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
      {/* Camera Header Bar */}
      <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-slate-900">
            {isUsingDemoStream ? 'กล้องจำลอง' : 'กล้องจุดแพ็ค'}
          </span>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
            {resolution}
          </span>
        </div>

        {/* Live Recording Badge */}
        {recordStatus === 'recording' && (
          <div className="flex items-center gap-2 bg-red-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase animate-record-pulse shadow-md shadow-red-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            REC <span className="font-mono text-xs">{formatTime(recordedSeconds)}</span>
          </div>
        )}

        {/* Camera Tools & Mobile Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mobile Front/Back Camera Switcher */}
          <button
            type="button"
            onClick={handleToggleFacingMode}
            title="สลับกล้องหน้า / กล้องหลัง (สำหรับมือถือและแท็บเล็ต)"
            className="flex items-center gap-1 px-2.5 py-1.5 min-h-[38px] rounded-xl border bg-white border-stone-200 hover:border-[#f06b4b] text-slate-700 hover:text-[#f06b4b] text-xs font-semibold shadow-2xs transition"
          >
            <SwitchCamera className="w-4 h-4 text-[#f06b4b]" />
            <span>{facingMode === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'}</span>
          </button>

          {/* Device Selector for multi-lens phones/webcams */}
          {devices.length > 1 && (
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => onSelectDeviceId?.(e.target.value)}
              className="text-xs font-medium bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 min-h-[38px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f06b4b]/20"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `กล้อง ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="เส้นตารางจัดตำแหน่ง"
            className={`p-2 min-h-[38px] min-w-[38px] rounded-xl border text-xs flex items-center justify-center transition ${
              showGrid ? 'bg-[#fef3ee] border-[#f06b4b]/40 text-[#f06b4b]' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Mirror Flip */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            title="กลับกระจก (Mirror)"
            className={`p-2 min-h-[38px] min-w-[38px] rounded-xl border text-xs flex items-center justify-center transition ${
              isMirrored ? 'bg-[#fef3ee] border-[#f06b4b]/40 text-[#f06b4b]' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isMirrored ? 'text-[#f06b4b]' : ''}`} />
          </button>

          {/* Refresh / Restart Camera */}
          <button
            type="button"
            onClick={() => startCamera(selectedDeviceId, facingMode)}
            title="รีสตาร์ทกล้อง"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl border bg-white border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center transition"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="เต็มจอ"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl border bg-white border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Stream Stage */}
      <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden select-none">
        {/* HTML5 Video Tag */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? '-scale-x-100' : ''
          }`}
        />

        {/* Alignment Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20 flex items-center justify-center">
              <div className="w-24 h-24 border border-dashed border-[#f06b4b]/70 rounded-lg"></div>
            </div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20 flex items-center justify-center">
              <span className="text-[10px] text-white/50 bg-black/40 px-2 py-0.5 rounded">จัดกล่องให้อยู่ในกรอบ</span>
            </div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div></div>
          </div>
        )}

        {/* Live Watermark Overlay (Real-time HUD) */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-3.5 md:p-4 text-white pointer-events-none flex items-end justify-between text-xs z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f06b4b] text-xs md:text-sm tracking-wide">
                PACKING EVIDENCE
              </span>
              <span className="bg-emerald-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                720p HD
              </span>
            </div>
            <div className="font-mono text-[11px] text-stone-300 mt-0.5 flex items-center gap-2">
              <span>STATION: <span className="font-bold text-white">{stationId}</span></span>
              {operatorName && (
                <>
                  <span className="text-stone-500">|</span>
                  <span className="text-orange-300 inline-flex items-center gap-1.5">
                    {operatorAvatarUrl && (
                      <img src={operatorAvatarUrl} alt={operatorName} className="w-4 h-4 rounded-full object-cover inline-block" />
                    )}
                    <span>ผู้แพ็ค: <span className="font-bold text-white">{operatorName}</span></span>
                  </span>
                </>
              )}
            </div>
            <div className="font-mono text-sm md:text-base font-bold text-white tracking-wider mt-0.5">
              {trackingNumber || 'READY TO SCAN...'}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold mb-1 bg-white/20 backdrop-blur-xs text-white">
              {courier.logoUrl && (
                <img src={courier.logoUrl} alt={courier.name} className="w-3.5 h-3.5 rounded object-contain bg-white/80 p-0.5" />
              )}
              <span>{courier.name}</span>
            </div>
            <div className="font-mono text-[11px] text-stone-200">
              {currentTimeStr} (ICT)
            </div>
          </div>
        </div>

        {/* Camera Permission Denied / Error Overlay */}
        {hasPermission === false && !isUsingDemoStream && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-1">ยังไม่สามารถเปิดกล้องได้</h3>
            <p className="text-xs text-stone-300 max-w-sm mb-4">
              {errorMessage || 'โปรดอนุญาตให้เบราว์เซอร์เข้าถึงกล้อง เพื่อใช้กล้องมือถือหรือเว็บแคม'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId, facingMode)}
                className="px-4 py-2.5 bg-[#f06b4b] text-white rounded-xl text-xs font-bold hover:bg-[#e05837] transition flex items-center gap-1.5 shadow-md shadow-[#f06b4b]/20 min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เปิดกล้องใหม่
              </button>
              <button
                type="button"
                onClick={startSimulationFeed}
                className="px-3.5 py-2.5 bg-stone-800 text-stone-300 rounded-xl text-xs font-medium hover:bg-stone-700 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                โหมดจำลอง (Demo)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Camera Sub-info */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>WebRTC • 720p HD</span>
        </div>
        <div className="flex items-center gap-3">
          {isUsingDemoStream && (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-semibold">
              โหมดจำลอง
            </span>
          )}
          <span className="text-[11px] text-stone-400 font-mono">Camera Ready</span>
        </div>
      </div>
    </div>
  );
};
