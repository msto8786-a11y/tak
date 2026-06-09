import React from 'react';
import { Group, Rect, Circle, Line, Text, Arc } from 'react-konva';
import { COMPONENT_DEFS } from '../../lib/componentDefs';

const PALETTE = {
  body: '#1C2541',
  bodyStroke: '#3A506B',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  terminal: '#94A3B8',
  terminalFill: '#0B132B',
  terminalHover: '#38BDF8',
  energized: '#FDE047',
  energizedGlow: '#FBBF24',
  accent: '#00B4D8',
  green: '#10B981',
  red: '#EF4444',
};

// Renders a single placed component (Konva Group) including its terminals.
export const CanvasComponent = ({
  comp,
  meterReading,
  loadEnergized,
  selectedTerminal,
  selected,
  hoveredTerminal,
  onDragMove,
  onDragEnd,
  onTerminalClick,
  onTerminalHover,
  onDoubleClick,
  onClickComponent,
  running,
}) => {
  const def = COMPONENT_DEFS[comp.type];
  if (!def) return null;
  const isEnergizedCoil = !!comp.state?.energized;
  const isCoilOn = !!comp.state?.coilOn; // timer coil receiving power but not yet elapsed
  const buzzerActive = def.isLoad && comp.type === 'buzzer' && loadEnergized;

  return (
    <Group
      x={comp.x}
      y={comp.y}
      draggable={!running}
      onDragMove={(e) => onDragMove(comp.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(comp.id, e.target.x(), e.target.y())}
      onDblClick={() => onDoubleClick(comp)}
      onDblTap={() => onDoubleClick(comp)}
      onClick={() => onClickComponent(comp)}
      onTap={() => onClickComponent(comp)}
    >
      {/* Body */}
      <Rect
        x={-def.width / 2}
        y={-def.height / 2}
        width={def.width}
        height={def.height}
        fill={PALETTE.body}
        stroke={selected ? PALETTE.accent : (isEnergizedCoil ? PALETTE.energized : PALETTE.bodyStroke)}
        strokeWidth={selected ? 2.5 : (isEnergizedCoil ? 2 : 1.5)}
        cornerRadius={6}
        shadowColor={selected ? PALETTE.accent : 'rgba(0,0,0,0.4)'}
        shadowBlur={selected ? 14 : 8}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={selected ? 0.7 : 1}
      />

      {/* Title bar */}
      <Rect
        x={-def.width / 2}
        y={-def.height / 2}
        width={def.width}
        height={20}
        fill="#0B132B"
        cornerRadius={[6, 6, 0, 0]}
      />
      <Text
        text={def.name}
        x={-def.width / 2}
        y={-def.height / 2 + 3}
        width={def.width}
        align="center"
        fontSize={11}
        fontFamily="IBM Plex Sans Arabic, sans-serif"
        fontStyle="500"
        fill={PALETTE.textPrimary}
      />

      {/* Body content by type */}
      <ComponentVisual comp={comp} def={def} meterReading={meterReading} loadEnergized={loadEnergized} isCoilOn={isCoilOn} />

      {/* Terminals */}
      {def.terminals.map((t) => {
        const sel = selectedTerminal && selectedTerminal.compId === comp.id && selectedTerminal.termId === t.id;
        const hov = hoveredTerminal && hoveredTerminal.compId === comp.id && hoveredTerminal.termId === t.id;
        return (
          <Group key={t.id} x={t.x} y={t.y}>
            <Circle
              radius={7}
              fill={sel ? PALETTE.accent : hov ? PALETTE.terminalHover : PALETTE.terminalFill}
              stroke={sel || hov ? '#FFFFFF' : PALETTE.terminal}
              strokeWidth={2}
              onClick={(e) => { e.cancelBubble = true; onTerminalClick(comp.id, t.id); }}
              onTap={(e) => { e.cancelBubble = true; onTerminalClick(comp.id, t.id); }}
              onMouseEnter={(e) => {
                e.target.getStage().container().style.cursor = 'crosshair';
                onTerminalHover(comp.id, t.id);
              }}
              onMouseLeave={(e) => {
                e.target.getStage().container().style.cursor = 'default';
                onTerminalHover(null, null);
              }}
            />
            <Text
              text={t.label}
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fill={PALETTE.textSecondary}
              x={-15}
              y={9}
              width={30}
              align="center"
            />
          </Group>
        );
      })}
    </Group>
  );
};

// Visual symbols inside each component body
const ComponentVisual = ({ comp, def, meterReading, loadEnergized, isCoilOn }) => {
  const c = PALETTE;
  if (comp.type === 'power_switch') {
    const closed = !!comp.state?.closed;
    return (
      <Group>
        <Circle x={-30} y={0} radius={3} fill={c.terminal} />
        <Circle x={30} y={0} radius={3} fill={c.terminal} />
        <Line
          points={closed ? [-30, 0, 30, 0] : [-30, 0, 25, -15]}
          stroke={closed ? c.green : c.textSecondary}
          strokeWidth={3}
          lineCap="round"
        />
        <Text text={closed ? 'ON' : 'OFF'} x={-def.width/2} y={def.height/2 - 14} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fill={closed ? c.green : c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'ac_supply') {
    return (
      <Group>
        <Text text="220V AC" x={-def.width/2} y={-5} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={c.accent} />
        <Text text="~" x={-def.width/2} y={-26} width={def.width} align="center" fontSize={20} fill={c.accent} />
      </Group>
    );
  }
  if (comp.type === 'dc_supply') {
    return (
      <Group>
        <Text text="12V DC" x={-def.width/2} y={-5} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={c.accent} />
        <Text text="⎓" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={20} fill={c.accent} />
      </Group>
    );
  }
  if (comp.type === 'voltmeter') {
    const val = meterReading ? meterReading.value.toFixed(1) : '0.0';
    return (
      <Group>
        <Circle x={0} y={-5} radius={32} fill="#0B132B" stroke={c.bodyStroke} strokeWidth={1.5} />
        <Text text="V" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={14} fontStyle="bold" fill={c.accent} />
        <Text text={val} x={-def.width/2} y={-10} width={def.width} align="center" fontSize={18} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={c.energized} />
        <Text text="فولت" x={-def.width/2} y={12} width={def.width} align="center" fontSize={10} fill={c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'ammeter') {
    const val = meterReading ? meterReading.value.toFixed(2) : '0.00';
    return (
      <Group>
        <Circle x={0} y={-5} radius={32} fill="#0B132B" stroke={c.bodyStroke} strokeWidth={1.5} />
        <Text text="A" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={14} fontStyle="bold" fill={c.accent} />
        <Text text={val} x={-def.width/2} y={-10} width={def.width} align="center" fontSize={16} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={c.energized} />
        <Text text="أمبير" x={-def.width/2} y={12} width={def.width} align="center" fontSize={10} fill={c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'buzzer') {
    const active = !!loadEnergized;
    return (
      <Group>
        <Circle x={0} y={0} radius={22} fill={active ? '#7C2D12' : '#0B132B'} stroke={active ? c.energized : c.bodyStroke} strokeWidth={2} />
        <Text text="🔔" x={-def.width/2} y={-10} width={def.width} align="center" fontSize={22} />
        {active && (
          <Group>
            <Arc x={0} y={0} angle={90} rotation={-135} innerRadius={28} outerRadius={30} fill={c.energized} opacity={0.7} />
            <Arc x={0} y={0} angle={90} rotation={45} innerRadius={28} outerRadius={30} fill={c.energized} opacity={0.7} />
            <Arc x={0} y={0} angle={90} rotation={-135} innerRadius={34} outerRadius={36} fill={c.energized} opacity={0.4} />
            <Arc x={0} y={0} angle={90} rotation={45} innerRadius={34} outerRadius={36} fill={c.energized} opacity={0.4} />
          </Group>
        )}
      </Group>
    );
  }
  if (comp.type === 'contactor') {
    const e = !!comp.state?.energized;
    return (
      <Group>
        {/* Coil box */}
        <Rect x={-50} y={-75} width={100} height={25} fill="#0B132B" stroke={e ? c.energized : c.bodyStroke} strokeWidth={1.5} cornerRadius={3} />
        <Text text="COIL" x={-50} y={-69} width={100} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.energized : c.textSecondary} />
        {/* Main contacts */}
        {[-60, 0, 60].map((cx, i) => (
          <Group key={i}>
            <Line points={[cx, -25, cx, e ? 25 : -5]} stroke={e ? c.green : c.textSecondary} strokeWidth={3} lineCap="round" />
            {!e && <Line points={[cx, -5, cx + 8, 15]} stroke={c.textSecondary} strokeWidth={2} lineCap="round" />}
            <Circle x={cx} y={-25} radius={2} fill={c.terminal} />
            <Circle x={cx} y={25} radius={2} fill={c.terminal} />
          </Group>
        ))}
        {/* Aux labels */}
        <Text text={e ? 'CLOSED' : 'OPEN'} x={-def.width/2} y={50} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.green : c.textSecondary} />
        <Text text="NO" x={-50} y={75} width={30} align="center" fontSize={9} fill={c.textSecondary} />
        <Text text="NC" x={20} y={75} width={30} align="center" fontSize={9} fill={c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'timer_relay') {
    const e = !!comp.state?.energized;
    const coilOn = !!isCoilOn;
    const remaining = comp.state?.remainingSec ?? 0;
    return (
      <Group>
        <Rect x={-45} y={-55} width={90} height={22} fill="#0B132B" stroke={coilOn ? c.energized : c.bodyStroke} strokeWidth={1.5} cornerRadius={3} />
        <Text text="TIMER" x={-45} y={-50} width={90} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={coilOn ? c.energized : c.textSecondary} />
        <Text text={`${comp.state?.duration ?? 5} ${comp.state?.unit === 'minutes' ? 'د' : 'ث'}`} x={-def.width/2} y={-22} width={def.width} align="center" fontSize={20} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.green : c.accent} />
        {coilOn && !e && (
          <Text text={`متبقي ${remaining}s`} x={-def.width/2} y={10} width={def.width} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fill={c.energized} />
        )}
        {e && (
          <Text text="● تم" x={-def.width/2} y={10} width={def.width} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fill={c.green} />
        )}
        <Text text="NO" x={-45} y={45} width={30} align="center" fontSize={9} fill={c.textSecondary} />
        <Text text="NC" x={15} y={45} width={30} align="center" fontSize={9} fill={c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'relay') {
    const e = !!comp.state?.energized;
    return (
      <Group>
        <Rect x={-50} y={-55} width={100} height={22} fill="#0B132B" stroke={e ? c.energized : c.bodyStroke} strokeWidth={1.5} cornerRadius={3} />
        <Text text="COIL" x={-50} y={-50} width={100} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.energized : c.textSecondary} />
        <Text text={e ? '⚡ مُغذّى' : '○ مفصول'} x={-def.width/2} y={-15} width={def.width} align="center" fontSize={13} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.green : c.textSecondary} />
        <Rect x={-50} y={15} width={100} height={25} fill="#0B132B" stroke={c.bodyStroke} strokeWidth={1} cornerRadius={3} />
        <Text text={e ? 'NO ●  NC ○' : 'NO ○  NC ●'} x={-50} y={22} width={100} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fill={e ? c.green : c.textSecondary} />
        <Text text="NO" x={-45} y={45} width={30} align="center" fontSize={9} fill={c.textSecondary} />
        <Text text="NC" x={15} y={45} width={30} align="center" fontSize={9} fill={c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'lamp_green' || comp.type === 'lamp_yellow' || comp.type === 'lamp_red') {
    const on = !!loadEnergized;
    const lampColor = def.lampColor || '#FACC15';
    return (
      <Group>
        <Circle x={0} y={-5} radius={26} fill={on ? lampColor : '#0B132B'} stroke={on ? lampColor : c.bodyStroke} strokeWidth={2} shadowColor={on ? lampColor : undefined} shadowBlur={on ? 18 : 0} shadowOpacity={on ? 0.9 : 0} />
        <Circle x={-7} y={-12} radius={6} fill="rgba(255,255,255,0.35)" opacity={on ? 0.6 : 0} />
        <Text text={on ? 'ON' : 'OFF'} x={-def.width/2} y={20} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={on ? lampColor : c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'push_button_start') {
    const pressed = !!comp.state?.pressed;
    return (
      <Group>
        <Circle x={0} y={-5} radius={18} fill={pressed ? c.green : '#0B132B'} stroke={c.green} strokeWidth={2} shadowColor={pressed ? c.green : undefined} shadowBlur={pressed ? 12 : 0} shadowOpacity={pressed ? 0.8 : 0} />
        <Text text="I" x={-def.width/2} y={-13} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={pressed ? '#FFFFFF' : c.green} />
        <Text text={pressed ? 'مضغوط' : 'تشغيل'} x={-def.width/2} y={5} width={def.width} align="center" fontSize={10} fontFamily="IBM Plex Sans Arabic" fill={pressed ? c.green : c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'push_button_stop') {
    const pressed = !!comp.state?.pressed;
    return (
      <Group>
        <Circle x={0} y={-5} radius={18} fill={pressed ? c.red : '#0B132B'} stroke={c.red} strokeWidth={2} shadowColor={pressed ? c.red : undefined} shadowBlur={pressed ? 12 : 0} shadowOpacity={pressed ? 0.8 : 0} />
        <Text text="O" x={-def.width/2} y={-13} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={pressed ? '#FFFFFF' : c.red} />
        <Text text={pressed ? 'مضغوط' : 'إيقاف'} x={-def.width/2} y={5} width={def.width} align="center" fontSize={10} fontFamily="IBM Plex Sans Arabic" fill={pressed ? c.red : c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'emergency_stop') {
    const pressed = !!comp.state?.pressed;
    return (
      <Group>
        {/* Outer yellow octagon ring */}
        <Circle x={0} y={-3} radius={36} fill="#FACC15" opacity={0.15} />
        <Circle x={0} y={-3} radius={32} fill={pressed ? '#7F1D1D' : '#DC2626'} stroke="#FACC15" strokeWidth={3} shadowColor={pressed ? c.red : undefined} shadowBlur={pressed ? 14 : 0} shadowOpacity={0.7} />
        <Text text="STOP" x={-def.width/2} y={-12} width={def.width} align="center" fontSize={11} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill="#FFFFFF" />
        <Text text="طوارئ" x={-def.width/2} y={2} width={def.width} align="center" fontSize={10} fontFamily="IBM Plex Sans Arabic" fill="#FFFFFF" />
        {pressed && <Text text="● مفعّل" x={-def.width/2} y={20} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={c.red} />}
      </Group>
    );
  }
  if (comp.type === 'fuse') {
    const blown = !!comp.state?.blown;
    return (
      <Group>
        <Rect x={-30} y={-10} width={60} height={20} fill="#0B132B" stroke={blown ? c.red : c.bodyStroke} strokeWidth={1.5} cornerRadius={10} />
        <Line points={[-30, 0, 30, 0]} stroke={blown ? c.red : c.green} strokeWidth={2.5} dash={blown ? [4, 4] : undefined} lineCap="round" />
        <Text text={blown ? 'BLOWN' : 'FUSE'} x={-def.width/2} y={-22} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={blown ? c.red : c.textSecondary} />
      </Group>
    );
  }
  if (comp.type === 'breaker') {
    const closed = !!comp.state?.closed;
    return (
      <Group>
        <Rect x={-35} y={-15} width={70} height={28} fill="#0B132B" stroke={closed ? c.green : c.textSecondary} strokeWidth={1.5} cornerRadius={4} />
        <Line points={closed ? [-25, 0, 25, 0] : [-25, 0, 20, -10]} stroke={closed ? c.green : c.textSecondary} strokeWidth={3} lineCap="round" />
        <Text text={closed ? 'ON' : 'OFF'} x={-def.width/2} y={-25} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={closed ? c.green : c.textSecondary} />
      </Group>
    );
  }
  return null;
};
