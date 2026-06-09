import React, { useState } from 'react';
import { X, Wifi } from 'lucide-react';

export const WifiModal = ({ open, initial, onClose, onSave }) => {
  const [baseUrl, setBaseUrl] = useState(() => initial?.baseUrl || 'http://192.168.1.100');
  const [onPath, setOnPath] = useState(() => initial?.onPath || '/relay/on/{channel}');
  const [offPath, setOffPath] = useState(() => initial?.offPath || '/relay/off/{channel}');
  const [enabled, setEnabled] = useState(() => initial?.enabled !== false);

  if (!open) return null;

  return (
    <div data-testid="wifi-modal" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111A31] border border-[#3A506B] rounded-lg shadow-2xl w-[480px] p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00B4D8]/10 border border-[#00B4D8]/30 flex items-center justify-center">
              <Wifi size={18} className="text-[#00B4D8]" />
            </div>
            <div>
              <h3 className="text-[#FFFFFF] text-lg font-bold">إعدادات وحدة الواي فاي</h3>
              <p className="text-[#8D99AE] text-xs mt-0.5">عنوان IP لوحدة الريليه ذات 3 قنوات</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8D99AE] hover:text-[#FFFFFF] transition-colors" data-testid="wifi-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#94A3B8] font-medium tracking-wide">عنوان وحدة الواي فاي (Base URL)</label>
          <input
            data-testid="wifi-base-url-input"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://192.168.1.100"
            className="w-full bg-[#1C2541] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#94A3B8] font-medium tracking-wide">مسار التشغيل</label>
            <input
              data-testid="wifi-on-path-input"
              value={onPath}
              onChange={(e) => setOnPath(e.target.value)}
              className="w-full bg-[#1C2541] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#94A3B8] font-medium tracking-wide">مسار الإيقاف</label>
            <input
              data-testid="wifi-off-path-input"
              value={offPath}
              onChange={(e) => setOffPath(e.target.value)}
              className="w-full bg-[#1C2541] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded bg-[#1C2541] border border-[#3A506B]">
          <div>
            <div className="text-sm text-[#E0E1DD] font-medium">تفعيل الاتصال الفعلي</div>
            <div className="text-[11px] text-[#8D99AE] mt-0.5">إرسال طلبات HTTP فعلية إلى وحدة الواي فاي</div>
          </div>
          <button
            data-testid="wifi-enabled-toggle"
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#10B981]' : 'bg-[#3A506B]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${enabled ? 'right-0.5' : 'right-6'}`} />
          </button>
        </div>

        <div className="text-[11px] text-[#8D99AE] font-mono leading-relaxed bg-[#0B132B] border border-[#3A506B] rounded p-3">
          مثال على الطلب: <span className="text-[#00B4D8]">{baseUrl}{onPath.replace('{channel}', '1')}</span>
          <br />
          {'{channel}'} = رقم القناة (1, 2, أو 3)
        </div>

        <div className="flex justify-end gap-2 mt-1">
          <button
            data-testid="wifi-modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-[#3A506B] text-[#E0E1DD] hover:bg-[#3A506B]/30 transition-colors"
          >
            إلغاء
          </button>
          <button
            data-testid="wifi-modal-save-btn"
            onClick={() => onSave({ baseUrl, onPath, offPath, enabled })}
            className="px-4 py-2 text-sm rounded bg-[#00B4D8] text-white font-medium hover:bg-[#0090AD] transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};
