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
        stroke={isEnergizedCoil ? PALETTE.energized : PALETTE.bodyStroke}
        strokeWidth={isEnergizedCoil ? 2 : 1.5}
        cornerRadius={6}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 2 }}
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
      <>
        <Circle x={-30} y={0} radius={3} fill={c.terminal} />
        <Circle x={30} y={0} radius={3} fill={c.terminal} />
        <Line
          points={closed ? [-30, 0, 30, 0] : [-30, 0, 25, -15]}
          stroke={closed ? c.green : c.textSecondary}
          strokeWidth={3}
          lineCap="round"
        />
        <Text text={closed ? 'ON' : 'OFF'} x={-def.width/2} y={def.height/2 - 14} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fill={closed ? c.green : c.textSecondary} />
      </>
    );
  }
  if (comp.type === 'ac_supply') {
    return (
      <>
        <Text text="220V AC" x={-def.width/2} y={-5} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={c.accent} />
        <Text text="~" x={-def.width/2} y={-26} width={def.width} align="center" fontSize={20} fill={c.accent} />
      </>
    );
  }
  if (comp.type === 'dc_supply') {
    return (
      <>
        <Text text="12V DC" x={-def.width/2} y={-5} width={def.width} align="center" fontSize={18} fontStyle="bold" fontFamily="JetBrains Mono, monospace" fill={c.accent} />
        <Text text="⎓" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={20} fill={c.accent} />
      </>
    );
  }
  if (comp.type === 'voltmeter') {
    const val = meterReading ? meterReading.value.toFixed(1) : '0.0';
    return (
      <>
        <Circle x={0} y={-5} radius={32} fill="#0B132B" stroke={c.bodyStroke} strokeWidth={1.5} />
        <Text text="V" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={14} fontStyle="bold" fill={c.accent} />
        <Text text={val} x={-def.width/2} y={-10} width={def.width} align="center" fontSize={18} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={c.energized} />
        <Text text="فولت" x={-def.width/2} y={12} width={def.width} align="center" fontSize={10} fill={c.textSecondary} />
      </>
    );
  }
  if (comp.type === 'ammeter') {
    const val = meterReading ? meterReading.value.toFixed(2) : '0.00';
    return (
      <>
        <Circle x={0} y={-5} radius={32} fill="#0B132B" stroke={c.bodyStroke} strokeWidth={1.5} />
        <Text text="A" x={-def.width/2} y={-28} width={def.width} align="center" fontSize={14} fontStyle="bold" fill={c.accent} />
        <Text text={val} x={-def.width/2} y={-10} width={def.width} align="center" fontSize={16} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={c.energized} />
        <Text text="أمبير" x={-def.width/2} y={12} width={def.width} align="center" fontSize={10} fill={c.textSecondary} />
      </>
    );
  }
  if (comp.type === 'buzzer') {
    const active = !!loadEnergized;
    return (
      <>
        <Circle x={0} y={0} radius={22} fill={active ? '#7C2D12' : '#0B132B'} stroke={active ? c.energized : c.bodyStroke} strokeWidth={2} />
        <Text text="🔔" x={-def.width/2} y={-10} width={def.width} align="center" fontSize={22} />
        {active && (
          <>
            <Arc x={0} y={0} angle={90} rotation={-135} innerRadius={28} outerRadius={30} fill={c.energized} opacity={0.7} />
            <Arc x={0} y={0} angle={90} rotation={45} innerRadius={28} outerRadius={30} fill={c.energized} opacity={0.7} />
            <Arc x={0} y={0} angle={90} rotation={-135} innerRadius={34} outerRadius={36} fill={c.energized} opacity={0.4} />
            <Arc x={0} y={0} angle={90} rotation={45} innerRadius={34} outerRadius={36} fill={c.energized} opacity={0.4} />
          </>
        )}
      </>
    );
  }
  if (comp.type === 'contactor') {
    const e = !!comp.state?.energized;
    return (
      <>
        {/* Coil box */}
        <Rect x={-50} y={-75} width={100} height={25} fill="#0B132B" stroke={e ? c.energized : c.bodyStroke} strokeWidth={1.5} cornerRadius={3} />
        <Text text="COIL" x={-50} y={-69} width={100} align="center" fontSize={11} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.energized : c.textSecondary} />
        {/* Main contacts */}
        {[-60, 0, 60].map((cx, i) => (
          <React.Fragment key={i}>
            <Line points={[cx, -25, cx, e ? 25 : -5]} stroke={e ? c.green : c.textSecondary} strokeWidth={3} lineCap="round" />
            {!e && <Line points={[cx, -5, cx + 8, 15]} stroke={c.textSecondary} strokeWidth={2} lineCap="round" />}
            <Circle x={cx} y={-25} radius={2} fill={c.terminal} />
            <Circle x={cx} y={25} radius={2} fill={c.terminal} />
          </React.Fragment>
        ))}
        {/* Aux labels */}
        <Text text={e ? 'CLOSED' : 'OPEN'} x={-def.width/2} y={50} width={def.width} align="center" fontSize={10} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={e ? c.green : c.textSecondary} />
        <Text text="NO" x={-50} y={75} width={30} align="center" fontSize={9} fill={c.textSecondary} />
        <Text text="NC" x={20} y={75} width={30} align="center" fontSize={9} fill={c.textSecondary} />
      </>
    );
  }
  if (comp.type === 'timer_relay') {
    const e = !!comp.state?.energized;
    const coilOn = !!isCoilOn;
    const remaining = comp.state?.remainingSec ?? 0;
    return (
      <>
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
      </>
    );
  }
  return null;
};
