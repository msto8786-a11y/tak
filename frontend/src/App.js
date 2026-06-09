import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Sidebar } from '@/components/simulator/Sidebar';
import { Topbar } from '@/components/simulator/Topbar';
import { Workspace } from '@/components/simulator/Workspace';
import { TimerModal } from '@/components/simulator/TimerModal';
import { WifiModal } from '@/components/simulator/WifiModal';
import { COMPONENT_DEFS } from '@/lib/componentDefs';
import { simulate } from '@/lib/simulation';
import '@/App.css';

const STORAGE_KEY = 'control-lab-simulator/v1';
const WIFI_STORAGE_KEY = 'control-lab-simulator/wifi/v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadWifiConfig() {
  try {
    const raw = localStorage.getItem(WIFI_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return {
    baseUrl: 'http://192.168.1.100',
    onPath: '/relay/on/{channel}',
    offPath: '/relay/off/{channel}',
    enabled: true,
  };
}

function App() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [, setSelectedComp] = useState(null);
  const [running, setRunning] = useState(false);
  const [timerModalCompId, setTimerModalCompId] = useState(null);
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [wifiConfig, setWifiConfig] = useState(loadWifiConfig);
  const [wifiStatus, setWifiStatus] = useState('idle');

  const [simResult, setSimResult] = useState({
    energizedWires: new Set(),
    loadEnergized: {},
    meters: {},
  });

  // Refs for tick loop (avoid stale closures)
  const componentsRef = useRef(components);
  const wiresRef = useRef(wires);
  const wifiConfigRef = useRef(wifiConfig);
  const prevContactorStatesRef = useRef({});

  useEffect(() => { componentsRef.current = components; }, [components]);
  useEffect(() => { wiresRef.current = wires; }, [wires]);
  useEffect(() => { wifiConfigRef.current = wifiConfig; }, [wifiConfig]);

  const componentCounts = useMemo(() => {
    const out = {};
    for (const c of components) out[c.type] = (out[c.type] || 0) + 1;
    return out;
  }, [components]);

  const contactorChannels = useMemo(() => {
    const map = {};
    let ch = 1;
    for (const c of components) {
      if (c.type === 'contactor' && ch <= 3) { map[c.id] = ch++; }
    }
    return map;
  }, [components]);
  const contactorChannelsRef = useRef(contactorChannels);
  useEffect(() => { contactorChannelsRef.current = contactorChannels; }, [contactorChannels]);

  // ===== Component ops =====
  const handleDropComponent = useCallback((type, x, y) => {
    const def = COMPONENT_DEFS[type];
    if (!def) return;
    setComponents((prev) => {
      const count = prev.filter((c) => c.type === type).length;
      if (def.max !== null && def.max !== undefined && count >= def.max) {
        toast.error(`الحد الأقصى لـ ${def.name} هو ${def.max}`);
        return prev;
      }
      const newComp = {
        id: uid(),
        type,
        x,
        y,
        state: JSON.parse(JSON.stringify(def.defaultState || {})),
      };
      toast.success(`تمت إضافة ${def.name}`);
      return [...prev, newComp];
    });
  }, []);

  const handleMoveComponent = useCallback((id, x, y) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const handleTerminalClick = useCallback((compId, termId) => {
    if (running) {
      toast.error('أوقف المحاكاة لتعديل التوصيلات');
      return;
    }
    setSelectedTerminal((prevSel) => {
      if (!prevSel) return { compId, termId };
      if (prevSel.compId === compId && prevSel.termId === termId) return null;
      // Avoid duplicate
      const exists = wiresRef.current.some((w) =>
        (w.from.compId === prevSel.compId && w.from.termId === prevSel.termId && w.to.compId === compId && w.to.termId === termId) ||
        (w.to.compId === prevSel.compId && w.to.termId === prevSel.termId && w.from.compId === compId && w.from.termId === termId)
      );
      if (exists) {
        toast.error('هذا التوصيل موجود مسبقًا');
        return null;
      }
      const newWire = { id: uid(), from: prevSel, to: { compId, termId } };
      setWires((prev) => [...prev, newWire]);
      toast.success('تم التوصيل');
      return null;
    });
  }, [running]);

  const handleDoubleClick = useCallback((comp) => {
    if (comp.type === 'power_switch' || comp.type === 'breaker') {
      setComponents((prev) => prev.map((c) => (c.id === comp.id ? { ...c, state: { ...c.state, closed: !c.state.closed } } : c)));
      return;
    }
    if (comp.type === 'push_button_start' || comp.type === 'push_button_stop' || comp.type === 'emergency_stop') {
      setComponents((prev) => prev.map((c) => (c.id === comp.id ? { ...c, state: { ...c.state, pressed: !c.state.pressed } } : c)));
      return;
    }
    if (comp.type === 'fuse') {
      setComponents((prev) => prev.map((c) => (c.id === comp.id ? { ...c, state: { ...c.state, blown: !c.state.blown } } : c)));
      return;
    }
    if (comp.type === 'timer_relay') {
      setTimerModalCompId(comp.id);
    }
  }, []);

  const handleSaveTimer = useCallback((values) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === timerModalCompId
          ? { ...c, state: { ...c.state, unit: values.unit, duration: values.duration, energized: false, coilOn: false, startedAt: null, remainingSec: 0 } }
          : c
      )
    );
    setTimerModalCompId(null);
    toast.success('تم حفظ إعدادات المؤقت');
  }, [timerModalCompId]);

  const handleClear = useCallback(() => {
    if (!window.confirm('هل أنت متأكد من مسح مساحة العمل بالكامل؟')) return;
    setComponents([]);
    setWires([]);
    setSelectedTerminal(null);
    setRunning(false);
    toast('تم مسح مساحة العمل');
  }, []);

  const handleSaveSession = useCallback(() => {
    const payload = { components, wires, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control-lab-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) { /* ignore */ }
    toast.success('تم حفظ الجلسة');
  }, [components, wires]);

  const handleLoadSession = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const p = JSON.parse(data);
        if (p.components && p.wires) {
          setComponents(p.components);
          setWires(p.wires);
          toast.success('تم تحميل الجلسة المحفوظة');
          return;
        }
      }
    } catch (e) { /* ignore */ }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const p = JSON.parse(ev.target.result);
          setComponents(p.components || []);
          setWires(p.wires || []);
          toast.success('تم تحميل الجلسة');
        } catch (err) {
          toast.error('ملف غير صالح');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleSaveWifi = useCallback((cfg) => {
    setWifiConfig(cfg);
    try { localStorage.setItem(WIFI_STORAGE_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    setWifiModalOpen(false);
    toast.success('تم حفظ إعدادات الواي فاي');
  }, []);

  // ---- Wi-Fi relay HTTP call ----
  // Triggers HTTP GET to the standalone Wi-Fi relay module (no Arduino).
  // baseUrl & paths are configurable from the إعدادات الواي فاي modal.
  // Replace {channel} with the relay channel number (1..3).
  const sendRelayCommand = useCallback((channel, on) => {
    const cfg = wifiConfigRef.current;
    if (!cfg.enabled) return;
    const path = (on ? cfg.onPath : cfg.offPath).replace('{channel}', String(channel));
    const url = `${cfg.baseUrl}${path}`;
    // The standalone Wi-Fi relay module is expected to expose HTTP endpoints
    // such as /relay/on/1 and /relay/off/1. mode 'no-cors' avoids CORS errors
    // when communicating directly with the module on the local network.
    fetch(url, { method: 'GET', mode: 'no-cors' })
      .then(() => setWifiStatus('connected'))
      .catch(() => setWifiStatus('error'));
  }, []);

  // ===== Run / Stop =====
  const handleRun = useCallback(() => {
    if (componentsRef.current.length === 0) {
      toast.error('أضف مكونات إلى مساحة العمل أولاً');
      return;
    }
    setComponents((prev) => prev.map((c) => (
      c.type === 'timer_relay'
        ? { ...c, state: { ...c.state, energized: false, coilOn: false, startedAt: null, remainingSec: 0 } }
        : c
    )));
    prevContactorStatesRef.current = {};
    setRunning(true);
    toast.success('بدأت المحاكاة');
  }, []);

  const handleStop = useCallback(() => {
    setRunning(false);
    setComponents((prev) => prev.map((c) => {
      if (c.type === 'contactor' || c.type === 'relay') return { ...c, state: { ...c.state, energized: false } };
      if (c.type === 'timer_relay') return { ...c, state: { ...c.state, energized: false, coilOn: false, startedAt: null, remainingSec: 0 } };
      if (c.type === 'push_button_start' || c.type === 'push_button_stop') return { ...c, state: { ...c.state, pressed: false } };
      return c;
    }));
    setSimResult({ energizedWires: new Set(), loadEnergized: {}, meters: {} });
    if (wifiConfigRef.current.enabled) {
      for (let ch = 1; ch <= 3; ch++) sendRelayCommand(ch, false);
    }
    prevContactorStatesRef.current = {};
    toast('تم إيقاف المحاكاة');
  }, [sendRelayCommand]);

  // ===== Simulation tick =====
  useEffect(() => {
    if (!running) return undefined;

    const tick = () => {
      const comps = componentsRef.current;
      const ws = wiresRef.current;

      // First simulation pass
      const sim1 = simulate(comps, ws);
      const now = Date.now();

      // Update timer relay states based on coilOn
      let updated = sim1.components.map((c) => {
        if (c.type === 'timer_relay') {
          const coilOn = !!c.state.coilOn;
          let { startedAt, energized, duration, unit } = c.state;
          const totalMs = (duration || 5) * (unit === 'minutes' ? 60000 : 1000);
          let remainingSec = 0;
          if (coilOn) {
            if (!startedAt) startedAt = now;
            const elapsedMs = now - startedAt;
            remainingSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
            if (!energized && elapsedMs >= totalMs) energized = true;
          } else {
            startedAt = null;
            energized = false;
            remainingSec = 0;
          }
          return { ...c, state: { ...c.state, startedAt, energized, remainingSec } };
        }
        return c;
      });

      // Second pass to reflect the new timer NO/NC states on the network
      const sim2 = simulate(updated, ws);
      // Merge back coilOn/startedAt from `updated` (sim2 may have re-set them via simulate)
      const updatedMap = new Map(updated.map((u) => [u.id, u]));
      const finalComps = sim2.components.map((c) => {
        if (c.type === 'timer_relay') {
          const prev = updatedMap.get(c.id);
          return { ...c, state: { ...prev.state, coilOn: c.state.coilOn } };
        }
        return c;
      });

      // Wi-Fi diffing
      const prevS = prevContactorStatesRef.current;
      const nextS = {};
      const channels = contactorChannelsRef.current;
      for (const c of finalComps) {
        if (c.type === 'contactor') {
          const ch = channels[c.id];
          if (!ch) continue;
          nextS[ch] = !!c.state.energized;
        }
      }
      for (const chStr of Object.keys(nextS)) {
        const ch = Number(chStr);
        if (prevS[ch] !== nextS[ch]) sendRelayCommand(ch, nextS[ch]);
      }
      prevContactorStatesRef.current = nextS;

      setComponents(finalComps);
      setSimResult({
        energizedWires: sim2.energizedWires,
        loadEnergized: sim2.loadEnergized,
        meters: sim2.meters,
      });
    };

    const id = setInterval(tick, 200);
    tick();
    return () => clearInterval(id);
  }, [running, sendRelayCommand]);

  const timerModalComp = components.find((c) => c.id === timerModalCompId);

  return (
    <div dir="rtl" className="flex flex-col h-screen w-full bg-[#0B132B] text-[#E0E1DD]">
      <Topbar
        running={running}
        onRun={handleRun}
        onStop={handleStop}
        onWifi={() => setWifiModalOpen(true)}
        onSave={handleSaveSession}
        onLoad={handleLoadSession}
        onClear={handleClear}
        wifiStatus={wifiStatus}
      />
      <div className="flex flex-1 overflow-hidden flex-row-reverse">
        <Sidebar componentCounts={componentCounts} />
        <Workspace
          components={components}
          wires={wires}
          energizedWires={simResult.energizedWires}
          loadEnergized={simResult.loadEnergized}
          meters={simResult.meters}
          selectedTerminal={selectedTerminal}
          onDropComponent={handleDropComponent}
          onMoveComponent={handleMoveComponent}
          onTerminalClick={handleTerminalClick}
          onDoubleClickComponent={handleDoubleClick}
          onSelectComponent={setSelectedComp}
          onCancelWire={() => setSelectedTerminal(null)}
          running={running}
        />
      </div>

      <TimerModal
        key={`timer-${timerModalCompId || 'none'}`}
        open={!!timerModalComp}
        initial={timerModalComp ? { unit: timerModalComp.state.unit, duration: timerModalComp.state.duration } : null}
        onClose={() => setTimerModalCompId(null)}
        onSave={handleSaveTimer}
      />
      <WifiModal
        key={`wifi-${wifiModalOpen}`}
        open={wifiModalOpen}
        initial={wifiConfig}
        onClose={() => setWifiModalOpen(false)}
        onSave={handleSaveWifi}
      />

      <Toaster
        position="bottom-left"
        dir="rtl"
        toastOptions={{
          style: {
            background: '#111A31',
            border: '1px solid #3A506B',
            color: '#E0E1DD',
            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default App;
