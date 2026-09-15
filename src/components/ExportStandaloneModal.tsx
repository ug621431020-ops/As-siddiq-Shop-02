import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  X, 
  Server, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';
import { generateStandaloneHtml } from '../utils/standaloneHtmlGenerator';

interface ExportStandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

export const ExportStandaloneModal: React.FC<ExportStandaloneModalProps> = ({
  isOpen,
  onClose,
  apiUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const standaloneCode = generateStandaloneHtml(apiUrl || '/api/upload');

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(standaloneCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([standaloneCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'packpro-standalone.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f06b4b] text-white flex items-center justify-center font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                โค้ด Standalone Frontend (HTML5 + Vanilla JS + Tailwind CDN)
              </h3>
              <p className="text-xs text-stone-400">
                ตามข้อกำหนด: สามารถบันทึกไฟล์นี้แล้วนำไปวางรันบน Server ใดก็ได้ทันที
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

        {/* Info Banner */}
        <div className="px-6 py-3 bg-[#fef3ee] border-b border-orange-200/60 flex items-center justify-between gap-4 text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#f06b4b] shrink-0" />
            <span>
              แยกตัวแปร <code>const API_URL = "{apiUrl || '/api/upload'}";</code> ไว้บนสุดของ <code>&lt;script&gt;</code> แก้ไขสะดวก
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-[#f06b4b] text-slate-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#f06b4b]" />}
              {copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ดทั้งหมด'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-[#f06b4b] hover:bg-[#e05837] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลดไฟล์ (.html)
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
          <pre className="overflow-x-auto whitespace-pre">
            <code>{standaloneCode}</code>
          </pre>
        </div>

        {/* Footer Notes */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>ใช้งานได้กับ Nginx, Apache, Node.js หรือเปิดผ่าน Live Server ได้ทันที</span>
          <span className="font-mono text-stone-400">ขนาดไฟล์ ~14 KB (Zero Build Step)</span>
        </div>

      </div>
    </div>
  );
};
