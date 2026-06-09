import React from 'react';
import { Play, Square, Wifi, Save, FolderOpen, Trash2 } from 'lucide-react';

export const Topbar = ({ running, onRun, onStop, onWifi, onSave, onLoad, onClear, wifiStatus }) => {
  return (
    <div
      data-testid="topbar"
      className="h-16 flex items-center justify-between px-6 bg-[#111A31] border-b border-[#3A506B] z-20 flex-shrink-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center text-white font-bold">
          ⚡
        </div>
        <div className="leading-tight">
          <div className="text-[#FFFFFF] text-base font-bold tracking-wide">محاكي مختبر التحكم الصناعي</div>
          <div className="text-[#8D99AE] text-xs">Industrial Control Lab Simulator</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          data-testid="wifi-status"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded border border-[#3A506B] bg-[#0B132B] text-xs font-mono"
        >
          <span className={`w-2 h-2 rounded-full ${wifiStatus === 'connected' ? 'bg-[#10B981]' : wifiStatus === 'error' ? 'bg-[#EF4444]' : 'bg-[#8D99AE]'}`} />
          <span className="text-[#E0E1DD]">Wi-Fi Relay</span>
        </div>

        <button
          data-testid="open-wifi-settings-btn"
          onClick={onWifi}
          className="p-2 text-[#8D99AE] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="إعدادات وحدة الواي فاي"
        >
          <Wifi size={18} />
        </button>
        <button
          data-testid="save-session-btn"
          onClick={onSave}
          className="p-2 text-[#8D99AE] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="حفظ الجلسة"
        >
          <Save size={18} />
        </button>
        <button
          data-testid="load-session-btn"
          onClick={onLoad}
          className="p-2 text-[#8D99AE] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="تحميل جلسة"
        >
          <FolderOpen size={18} />
        </button>
        <button
          data-testid="clear-workspace-btn"
          onClick={onClear}
          className="p-2 text-[#8D99AE] hover:text-[#EF4444] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="مسح المساحة"
        >
          <Trash2 size={18} />
        </button>

        <div className="mx-2 w-px h-7 bg-[#3A506B]" />

        {!running ? (
          <button
            data-testid="run-simulation-btn"
            onClick={onRun}
            className="px-4 py-2 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/40 rounded hover:bg-[#10B981]/20 hover:border-[#10B981] transition-all font-bold flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            تشغيل المحاكاة
          </button>
        ) : (
          <button
            data-testid="stop-simulation-btn"
            onClick={onStop}
            className="px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/40 rounded hover:bg-[#EF4444]/20 hover:border-[#EF4444] transition-all font-bold flex items-center gap-2"
          >
            <Square size={16} fill="currentColor" />
            إيقاف المحاكاة
          </button>
        )}
      </div>
    </div>
  );
};
