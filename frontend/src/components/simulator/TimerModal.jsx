import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export const TimerModal = ({ open, initial, onClose, onSave }) => {
  const [unit, setUnit] = useState(() => initial?.unit || 'seconds');
  const [duration, setDuration] = useState(() => initial?.duration ?? 5);

  if (!open) return null;

  return (
    <div data-testid="timer-modal" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111A31] border border-[#3A506B] rounded-lg shadow-2xl w-[420px] p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00B4D8]/10 border border-[#00B4D8]/30 flex items-center justify-center">
              <Clock size={18} className="text-[#00B4D8]" />
            </div>
            <div>
              <h3 className="text-[#FFFFFF] text-lg font-bold">إعدادات المؤقت الزمني</h3>
              <p className="text-[#8D99AE] text-xs mt-0.5">حدد وحدة الزمن والمدة</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8D99AE] hover:text-[#FFFFFF] transition-colors" data-testid="timer-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#94A3B8] font-medium tracking-wide">وحدة الزمن</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="timer-unit-seconds"
              onClick={() => setUnit('seconds')}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                unit === 'seconds'
                  ? 'bg-[#00B4D8]/15 border-[#00B4D8] text-[#00B4D8]'
                  : 'bg-[#1C2541] border-[#3A506B] text-[#E0E1DD] hover:border-[#00B4D8]/50'
              }`}
            >
              ثوانٍ
            </button>
            <button
              data-testid="timer-unit-minutes"
              onClick={() => setUnit('minutes')}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                unit === 'minutes'
                  ? 'bg-[#00B4D8]/15 border-[#00B4D8] text-[#00B4D8]'
                  : 'bg-[#1C2541] border-[#3A506B] text-[#E0E1DD] hover:border-[#00B4D8]/50'
              }`}
            >
              دقائق
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#94A3B8] font-medium tracking-wide">المدة</label>
          <input
            data-testid="timer-duration-input"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="w-full bg-[#1C2541] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] font-mono"
          />
          <p className="text-[11px] text-[#8D99AE]">
            المؤقت سيقوم بتفعيل ملامس NO بعد {duration} {unit === 'seconds' ? 'ثانية' : 'دقيقة'} من تنشيط الملف.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            data-testid="timer-modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-[#3A506B] text-[#E0E1DD] hover:bg-[#3A506B]/30 transition-colors"
          >
            إلغاء
          </button>
          <button
            data-testid="timer-modal-save-btn"
            onClick={() => onSave({ unit, duration })}
            className="px-4 py-2 text-sm rounded bg-[#00B4D8] text-white font-medium hover:bg-[#0090AD] transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};
