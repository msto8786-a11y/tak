import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Save, Database, BookOpen } from 'lucide-react';

const STORE_KEY = 'control-lab-simulator/sessions/v1';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const SessionsModal = ({ open, onClose, currentComponents, currentWires, onLoad, onLoadExample, toast }) => {
  if (!open) return null;
  return (
    <SessionsModalContent
      onClose={onClose}
      currentComponents={currentComponents}
      currentWires={currentWires}
      onLoad={onLoad}
      onLoadExample={onLoadExample}
      toast={toast}
    />
  );
};

const SessionsModalContent = ({ onClose, currentComponents, currentWires, onLoad, onLoadExample, toast }) => {
  const [sessions, setSessions] = useState(() => loadAll());
  const [name, setName] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORE_KEY) setSessions(loadAll());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الجلسة');
      return;
    }
    const nowIso = new Date().toISOString();
    const newSession = {
      id: uid(),
      name: name.trim(),
      student_name: studentName.trim(),
      components: currentComponents,
      wires: currentWires,
      created_at: nowIso,
      updated_at: nowIso,
      component_count: currentComponents.length,
      wire_count: currentWires.length,
    };
    const next = [newSession, ...sessions];
    if (saveAll(next)) {
      setSessions(next);
      setName('');
      setStudentName('');
      toast.success('تم حفظ الجلسة في المتصفح');
    } else {
      toast.error('فشل الحفظ (مساحة المتصفح ممتلئة)');
    }
  };

  const handleLoad = (s) => {
    onLoad({ components: s.components || [], wires: s.wires || [] });
    toast.success(`تم تحميل: ${s.name}`);
    onClose();
  };

  const handleDelete = (s) => {
    if (!window.confirm(`حذف الجلسة "${s.name}"؟`)) return;
    const next = sessions.filter((x) => x.id !== s.id);
    if (saveAll(next)) {
      setSessions(next);
      toast.success('تم الحذف');
    }
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-sessions-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير نسخة احتياطية');
  };

  const handleImportAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!Array.isArray(imported)) throw new Error();
          const next = [...imported, ...sessions];
          if (saveAll(next)) {
            setSessions(next);
            toast.success(`تم استيراد ${imported.length} جلسة`);
          }
        } catch {
          toast.error('ملف غير صالح');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div data-testid="sessions-modal" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111A31] border border-[#3A506B] rounded-lg shadow-2xl w-[640px] max-h-[80vh] p-6 flex flex-col gap-5 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00B4D8]/10 border border-[#00B4D8]/30 flex items-center justify-center">
              <Database size={18} className="text-[#00B4D8]" />
            </div>
            <div>
              <h3 className="text-[#FFFFFF] text-lg font-bold">إدارة الجلسات المحفوظة</h3>
              <p className="text-[#8D99AE] text-xs mt-0.5">حفظ، تحميل، وحذف جلسات الطلاب (محفوظة محلياً في المتصفح)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8D99AE] hover:text-[#FFFFFF] transition-colors" data-testid="sessions-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <button
          data-testid="load-example-circuit-btn"
          onClick={() => { onLoadExample(); onClose(); }}
          className="flex items-center justify-between p-3 rounded border border-dashed border-[#00B4D8]/40 bg-[#00B4D8]/5 hover:bg-[#00B4D8]/10 transition-colors text-right"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#00B4D8]">Example</span>
          <span className="flex items-center gap-2 text-sm text-[#E0E1DD]">
            تحميل دائرة مثال (Self-holding مع زر تشغيل/إيقاف + كونتاكتور + مصباح)
            <BookOpen size={14} className="text-[#00B4D8]" />
          </span>
        </button>

        <div className="p-4 rounded border border-[#3A506B] bg-[#1C2541] flex flex-col gap-3">
          <div className="text-xs text-[#94A3B8] font-medium tracking-wide flex items-center gap-2">
            <Save size={12} />
            حفظ الدائرة الحالية كجلسة جديدة
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              data-testid="session-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الجلسة"
              className="bg-[#0B132B] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] text-sm"
            />
            <input
              data-testid="session-student-input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اسم الطالب (اختياري)"
              className="bg-[#0B132B] border border-[#3A506B] text-[#FFFFFF] px-3 py-2 rounded focus:outline-none focus:border-[#00B4D8] text-sm"
            />
          </div>
          <button
            data-testid="save-session-cloud-btn"
            onClick={handleSave}
            className="self-start px-4 py-2 text-sm rounded bg-[#00B4D8] text-white font-medium hover:bg-[#0090AD] transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            حفظ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="text-xs text-[#94A3B8] font-medium tracking-wide mb-2 px-1 flex items-center justify-between">
            <span>الجلسات المحفوظة ({sessions.length})</span>
            <div className="flex items-center gap-1">
              <button
                data-testid="sessions-import-btn"
                onClick={handleImportAll}
                className="text-[10px] px-2 py-0.5 rounded hover:bg-[#3A506B]/40 text-[#94A3B8] hover:text-[#00B4D8] transition-colors"
                title="استيراد نسخة احتياطية"
              >
                استيراد
              </button>
              <button
                data-testid="sessions-export-btn"
                onClick={handleExportAll}
                disabled={sessions.length === 0}
                className="text-[10px] px-2 py-0.5 rounded hover:bg-[#3A506B]/40 text-[#94A3B8] hover:text-[#00B4D8] disabled:opacity-40 transition-colors"
                title="تصدير نسخة احتياطية"
              >
                تصدير الكل
              </button>
            </div>
          </div>
          {sessions.length === 0 && (
            <div className="text-center text-[#8D99AE] text-sm py-8">لا توجد جلسات محفوظة بعد</div>
          )}
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                data-testid={`session-row-${s.id}`}
                className="flex items-center justify-between p-3 rounded border border-[#3A506B] bg-[#1C2541] hover:border-[#00B4D8]/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <button
                    data-testid={`session-delete-${s.id}`}
                    onClick={() => handleDelete(s)}
                    className="p-1.5 text-[#8D99AE] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    data-testid={`session-load-${s.id}`}
                    onClick={() => handleLoad(s)}
                    className="px-3 py-1.5 text-xs rounded bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/20 transition-colors flex items-center gap-1"
                  >
                    <FolderOpen size={12} />
                    تحميل
                  </button>
                </div>
                <div className="text-right flex-1 mr-3">
                  <div className="text-sm font-medium text-[#E0E1DD]">{s.name}</div>
                  <div className="text-[11px] text-[#8D99AE] font-mono mt-0.5">
                    {s.student_name && <span>{s.student_name} · </span>}
                    {s.component_count} مكون · {s.wire_count} توصيل · {new Date(s.updated_at).toLocaleString('ar')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-[#8D99AE] font-mono text-center">
          💡 الجلسات تُحفظ محلياً في متصفحك فقط. استخدم تصدير/استيراد لمشاركتها بين الأجهزة.
        </div>
      </div>
    </div>
  );
};
