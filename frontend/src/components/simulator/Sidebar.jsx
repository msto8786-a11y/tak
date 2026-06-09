import React from 'react';
import { COMPONENT_DEFS, SIDEBAR_ITEMS } from '../../lib/componentDefs';
import {
  ToggleLeft, Zap, BatteryFull, Gauge, Activity, Bell, Box, Clock,
  Cpu, Lightbulb, Power, PowerOff, OctagonAlert, Cable, Settings2,
} from 'lucide-react';

const ICONS = {
  ToggleLeft, Zap, BatteryFull, Gauge, Activity, Bell, Box, Clock,
  Cpu, Lightbulb, Power, PowerOff, OctagonAlert, Cable, Settings2,
};

export const Sidebar = ({ componentCounts }) => {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/x-comp-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      data-testid="sidebar"
      className="w-72 flex-shrink-0 bg-[#111A31] border-r border-[#3A506B] flex flex-col"
    >
      <div className="p-4 border-b border-[#3A506B]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D99AE] font-mono mb-1">Components</div>
        <h2 className="text-[#FFFFFF] text-lg font-bold">المكونات الكهربائية</h2>
        <p className="text-[#8D99AE] text-xs mt-1">اسحب المكون إلى مساحة العمل</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {SIDEBAR_ITEMS.map((type) => {
          const def = COMPONENT_DEFS[type];
          const Icon = ICONS[def.icon] || Box;
          const count = componentCounts[type] || 0;
          const limitReached = def.max !== null && def.max !== undefined && count >= def.max;

          return (
            <div
              key={type}
              data-testid={`drag-item-${type}`}
              draggable={!limitReached}
              onDragStart={(e) => !limitReached && onDragStart(e, type)}
              className={`group flex items-center gap-3 p-3 rounded-md border transition-all select-none ${
                limitReached
                  ? 'bg-[#1C2541]/30 border-[#3A506B]/40 cursor-not-allowed opacity-50'
                  : 'bg-[#1C2541] border-[#3A506B] hover:border-[#00B4D8] hover:bg-[#1C2541]/90 cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="w-9 h-9 rounded bg-[#0B132B] border border-[#3A506B] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#00B4D8]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#E0E1DD] truncate">{def.name}</div>
                <div className="text-[10px] text-[#8D99AE] font-mono uppercase tracking-wider">{def.type.replace('_', ' ')}</div>
              </div>
              {def.max !== null && def.max !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  limitReached ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#3A506B]/40 text-[#94A3B8]'
                }`}>
                  {count}/{def.max}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#3A506B] text-[10px] text-[#8D99AE] font-mono leading-relaxed">
        <div className="mb-1 text-[#94A3B8]">TIPS · إرشادات</div>
        <div>• اسحب المكون لمساحة العمل</div>
        <div>• اضغط على طرف للبدء، ثم طرف آخر للتوصيل</div>
        <div>• نقرة مزدوجة لإعدادات المكون</div>
      </div>
    </aside>
  );
};
