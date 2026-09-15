import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'ยืนยันการลบ',
  cancelLabel = 'ยกเลิก',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        id="confirm-modal-box"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden"
      >
        <div className="p-5 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/70 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition flex items-center gap-1.5 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#f06b4b] hover:bg-[#e05a3a]'
            }`}
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
