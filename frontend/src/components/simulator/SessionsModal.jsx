import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Save, Cloud, BookOpen, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

async function listSessions() {
  const r = await fetch(`${API}/sessions`);
  if (!r.ok) throw new Error('list failed');
  return r.json();
}
async function loadSession(id) {
  const r = await fetch(`${API}/sessions/${id}`);
  if (!r.ok) throw new Error('load failed');
  return r.json();
}
async function deleteSession(id) {
  const r = await fetch(`${API}/sessions/${id}`, { method: 'DELETE' });
  return r.ok;
}
async function createSession(payload) {
  const r = await fetch(`${API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('create failed');
  return r.json();
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
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [studentName, setStudentName] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (e) {
      toast.error('فشل تحميل قائمة الجلسات');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الجلسة');
      return;
    }
    setSaving(true);
    try {
      await createSession({
        name: name.trim(),
        student_name: studentName.trim(),
        components: currentComponents,
        wires: currentWires,
      });
      toast.success('تم حفظ الجلسة في قاعدة البيانات');
      setName('');
      setStudentName('');
      await refresh();
    } catch (e) {
      toast.error('فشل حفظ الجلسة');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (id) => {
    try {
      const s = await loadSession(id);
      onLoad({ components: s.components || [], wires: s.wires || [] });
      toast.success(`تم تحميل: ${s.name}`);
      onClose();
    } catch {
      toast.error('فشل التحميل');
    }
  };

  const handleDelete = async (id, sessionName) => {
    if (!window.confirm(`حذف الجلسة "${sessionName}"؟`)) return;
    const ok = await deleteSession(id);
    if (ok) {
      toast.success('تم الحذف');
      await refresh();
    } else {
      toast.error('فشل الحذف');
    }
  };

  return (
    <div data-testid="sessions-modal" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111A31] border border-[#3A506B] rounded-lg shadow-2xl w-[640px] max-h-[80vh] p-6 flex flex-col gap-5 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00B4D8]/10 border border-[#00B4D8]/30 flex items-center justify-center">
              <Cloud size={18} className="text-[#00B4D8]" />
            </div>
            <div>
              <h3 className="text-[#FFFFFF] text-lg font-bold">إدارة الجلسات المحفوظة</h3>
              <p className="text-[#8D99AE] text-xs mt-0.5">حفظ، تحميل، وحذف جلسات الطلاب من قاعدة البيانات</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8D99AE] hover:text-[#FFFFFF] transition-colors" data-testid="sessions-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Quick load example */}
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

        {/* Save new */}
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
            disabled={saving}
            onClick={handleSave}
            className="self-start px-4 py-2 text-sm rounded bg-[#00B4D8] text-white font-medium hover:bg-[#0090AD] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            حفظ
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="text-xs text-[#94A3B8] font-medium tracking-wide mb-2 px-1 flex items-center justify-between">
            <span>الجلسات المحفوظة ({sessions.length})</span>
            {loading && <Loader2 size={12} className="animate-spin text-[#00B4D8]" />}
          </div>
          {sessions.length === 0 && !loading && (
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
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-1.5 text-[#8D99AE] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    data-testid={`session-load-${s.id}`}
                    onClick={() => handleLoad(s.id)}
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
      </div>
    </div>
  );
};
