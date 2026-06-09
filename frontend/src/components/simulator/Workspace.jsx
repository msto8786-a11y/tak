import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Group, Circle } from 'react-konva';
import { CanvasComponent } from './CanvasComponent';
import { COMPONENT_DEFS } from '../../lib/componentDefs';

const GRID_SIZE = 20;

function buildGrid(width, height) {
  const lines = [];
  for (let x = 0; x <= width; x += GRID_SIZE) {
    const major = x % (GRID_SIZE * 5) === 0;
    lines.push({ points: [x, 0, x, height], opacity: major ? 0.4 : 0.15 });
  }
  for (let y = 0; y <= height; y += GRID_SIZE) {
    const major = y % (GRID_SIZE * 5) === 0;
    lines.push({ points: [0, y, width, y], opacity: major ? 0.4 : 0.15 });
  }
  return lines;
}

function getTerminalAbsPos(components, compId, termId) {
  const c = components.find((x) => x.id === compId);
  if (!c) return null;
  const def = COMPONENT_DEFS[c.type];
  const t = def.terminals.find((x) => x.id === termId);
  if (!t) return null;
  return { x: c.x + t.x, y: c.y + t.y };
}

export const Workspace = ({
  components,
  wires,
  energizedWires,
  loadEnergized,
  meters,
  selectedTerminal,
  onDropComponent,
  onMoveComponent,
  onTerminalClick,
  onDoubleClickComponent,
  onSelectComponent,
  onCancelWire,
  running,
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [pointer, setPointer] = useState(null);
  const [hovered, setHovered] = useState({ compId: null, termId: null });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ width: r.width, height: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // HTML drop handler
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-comp-type');
    if (!type) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - r.top) / GRID_SIZE) * GRID_SIZE;
    onDropComponent(type, x, y);
  };

  const onStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const p = stage.getPointerPosition();
    setPointer(p);
  };

  const onStageClick = (e) => {
    // Click on empty stage cancels wiring
    if (e.target === e.target.getStage()) {
      onCancelWire();
      onSelectComponent(null);
    }
  };

  const grid = buildGrid(size.width, size.height);

  const pendingFrom = selectedTerminal ? getTerminalAbsPos(components, selectedTerminal.compId, selectedTerminal.termId) : null;

  return (
    <div
      ref={containerRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-testid="workspace"
      className="relative flex-1 bg-[#0B132B] overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.04), transparent 50%)' }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseMove={onStageMouseMove}
        onClick={onStageClick}
        onTap={onStageClick}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {grid.map((g, i) => (
            <Line key={i} points={g.points} stroke="#3A506B" strokeWidth={0.8} opacity={g.opacity} />
          ))}
        </Layer>

        {/* Wires layer */}
        <Layer>
          {wires.map((w) => {
            const from = getTerminalAbsPos(components, w.from.compId, w.from.termId);
            const to = getTerminalAbsPos(components, w.to.compId, w.to.termId);
            if (!from || !to) return null;
            const isEnergized = energizedWires.has(w.id);
            // simple orthogonal routing: H then V at midpoint
            const midX = (from.x + to.x) / 2;
            const points = [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
            return (
              <Line
                key={w.id}
                points={points}
                stroke={isEnergized ? '#FDE047' : '#475569'}
                strokeWidth={isEnergized ? 3.5 : 2.5}
                lineCap="round"
                lineJoin="round"
                shadowColor={isEnergized ? '#FDE047' : undefined}
                shadowBlur={isEnergized ? 10 : 0}
                shadowOpacity={isEnergized ? 0.7 : 0}
              />
            );
          })}

          {/* Pending wire */}
          {pendingFrom && pointer && (
            <Line
              points={[pendingFrom.x, pendingFrom.y, pointer.x, pointer.y]}
              stroke="#00B4D8"
              strokeWidth={2}
              dash={[6, 6]}
              opacity={0.8}
            />
          )}
        </Layer>

        {/* Components layer */}
        <Layer>
          {components.map((c) => (
            <CanvasComponent
              key={c.id}
              comp={c}
              meterReading={meters[c.id]}
              loadEnergized={loadEnergized[c.id]}
              selectedTerminal={selectedTerminal}
              hoveredTerminal={hovered}
              onDragMove={(id, x, y) => onMoveComponent(id, x, y, false)}
              onDragEnd={(id, x, y) => {
                const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE;
                const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE;
                onMoveComponent(id, snapX, snapY, true);
              }}
              onTerminalClick={onTerminalClick}
              onTerminalHover={(compId, termId) => setHovered({ compId, termId })}
              onDoubleClick={onDoubleClickComponent}
              onClickComponent={onSelectComponent}
              running={running}
            />
          ))}
        </Layer>
      </Stage>

      {components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md px-6">
            <div className="text-[#3A506B] text-7xl mb-4 font-mono">⌁</div>
            <div className="text-[#E0E1DD] text-lg font-bold mb-2">مساحة العمل فارغة</div>
            <div className="text-[#8D99AE] text-sm leading-relaxed">
              اسحب المكونات من الشريط الجانبي إلى هنا لبناء دائرة التحكم الصناعي
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
