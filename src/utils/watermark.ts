export interface WatermarkData {
  station: string;
  tracking: string;
  courierName: string;
  durationSec: number;
  operatorName?: string;
  operatorId?: string;
}

/**
 * Capture frame from video element and overlay packing verification watermark
 */
export async function captureVideoFrameWithWatermark(
  videoEl: HTMLVideoElement,
  data: WatermarkData,
  applyWatermark = true
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    try {
      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // 1. Draw live video frame
      ctx.drawImage(videoEl, 0, 0, width, height);

      if (applyWatermark) {
        // Overlay styling
        const barHeight = Math.max(68, Math.round(height * 0.11));

        // Bottom dark bar with gradient
        const gradient = ctx.createLinearGradient(0, height - barHeight - 20, 0, height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
        gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.85)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - barHeight - 20, width, barHeight + 20);

        // Top accent line in PRISM Orange (#f06b4b)
        ctx.fillStyle = '#f06b4b';
        ctx.fillRect(0, height - barHeight, width, 4);

        // Watermark text styling
        ctx.textBaseline = 'middle';

        // Left section: App Brand & Station
        const padX = Math.max(20, Math.round(width * 0.02));
        const centerY = height - barHeight / 2;

        // Brand Pill
        ctx.fillStyle = '#f06b4b';
        ctx.font = `bold ${Math.max(14, Math.round(height * 0.024))}px 'Prompt', sans-serif`;
        ctx.fillText('PACKING EVIDENCE', padX, centerY - 12);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = `500 ${Math.max(12, Math.round(height * 0.02))}px 'Prompt', sans-serif`;
        const operatorText = data.operatorName ? ` | ผู้แพ็ค: ${data.operatorName}` : '';
        ctx.fillText(`จุด: ${data.station || 'N/A'}${operatorText}`, padX, centerY + 12);

        // Center section: Tracking & Courier
        const centerX = width * 0.42;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(16, Math.round(height * 0.03))}px 'JetBrains Mono', monospace`;
        ctx.fillText(`${data.tracking || 'NO-TRACKING'}`, centerX, centerY - 10);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = `400 ${Math.max(12, Math.round(height * 0.019))}px 'Prompt', sans-serif`;
        ctx.fillText(`ขนส่ง: ${data.courierName} | บันทึก: ${data.durationSec}s`, centerX, centerY + 12);

        // Right section: Timestamp
        const now = new Date();
        const dateStr = now.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = now.toLocaleTimeString('th-TH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const isoStr = now.toISOString();

        ctx.textAlign = 'right';
        ctx.fillStyle = '#f8fafc';
        ctx.font = `600 ${Math.max(14, Math.round(height * 0.024))}px 'JetBrains Mono', monospace`;
        ctx.fillText(`${timeStr}`, width - padX, centerY - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `400 ${Math.max(11, Math.round(height * 0.017))}px 'Prompt', sans-serif`;
        ctx.fillText(`${dateStr} (ICT)`, width - padX, centerY + 12);

        // Top-right camera timestamp badge
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.roundRect?.(width - 240, 16, 224, 30, 6);
        ctx.fill();

        ctx.fillStyle = '#10b981'; // Green dot
        ctx.beginPath();
        ctx.arc(width - 224, 31, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `11px 'JetBrains Mono', monospace`;
        ctx.fillText(`PACKED: ${isoStr.substring(0, 19).replace('T', ' ')}`, width - 212, 31);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl, width, height });
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      reject(err);
    }
  });
}
