import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { CanvasComponent } from './CanvasComponent';
import { COMPONENT_DEFS } from '../../lib/componentDefs';
import { Plus, Minus, Maximize2, Move } from 'lucide-react';

const GRID_SIZE = 20;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 1.15;

function getTerminalAbsPos(components, compId, termId) {
  const c = components.find((x) => x.id === compId);
  if (!c) return null;
  const def = COMPONENT_DEFS[c.type];
  const t = def.terminals.find((x) => x.id === termId);
  if (!t) return null;
  return { x: c.x + t.x, y: c.y + t.y };
}

// Build grid lines that span the currently visible world area.
function buildVisibleGrid(scale, stagePos, viewW, viewH) {
  const worldLeft = -stagePos.x / scale - GRID_SIZE;
  const worldTop = -stagePos.y / scale - GRID_SIZE;
  const worldRight = (viewW - stagePos.x) / scale + GRID_SIZE;
  const worldBottom = (viewH - stagePos.y) / scale + GRID_SIZE;

  const x0 = Math.floor(worldLeft / GRID_SIZE) * GRID_SIZE;
  const x1 = Math.ceil(worldRight / GRID_SIZE) * GRID_SIZE;
  const y0 = Math.floor(worldTop / GRID_SIZE) * GRID_SIZE;
  const y1 = Math.ceil(worldBottom / GRID_SIZE) * GRID_SIZE;

  const lines = [];
  for (let x = x0; x <= x1; x += GRID_SIZE) {
    const major = x % (GRID_SIZE * 5) === 0;
    lines.push({ points: [x, y0, x, y1], opacity: major ? 0.4 : 0.15 });
  }
  for (let y = y0; y <= y1; y += GRID_SIZE) {
    const major = y % (GRID_SIZE * 5) === 0;
    lines.push({ points: [x0, y, x1, y], opacity: major ? 0.4 : 0.15 });
  }
  return lines;
}

export const Workspace = ({
  components,
  wires,
  energizedWires,
  loadEnergized,
  meters,
  selectedTerminal,
  selectedItem,
  onDropComponent,
  onMoveComponent,
  onTerminalClick,
  onDoubleClickComponent,
  onSelectComponent,
  onSelectWire,
  onCancelWire,
  running,
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [pointer, setPointer] = useState(null); // world coords for pending wire
  const [hovered, setHovered] = useState({ compId: null, termId: null });

  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);

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

  // ----- Zoom helpers -----
  const zoomAt = useCallback((pointerScreen, newScale) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale((curScale) => {
      const worldX = (pointerScreen.x - stagePos.x) / curScale;
      const worldY = (pointerScreen.y - stagePos.y) / curScale;
      const newPos = {
        x: pointerScreen.x - worldX * clamped,
        y: pointerScreen.y - worldY * clamped,
      };
      setStagePos(newPos);
      return clamped;
    });
  }, [stagePos]);

  const zoomIn = useCallback(() => {
    const center = { x: size.width / 2, y: size.height / 2 };
    zoomAt(center, scale * ZOOM_STEP);
  }, [scale, size, zoomAt]);

  const zoomOut = useCallback(() => {
    const center = { x: size.width / 2, y: size.height / 2 };
    zoomAt(center, scale / ZOOM_STEP);
  }, [scale, size, zoomAt]);

  const zoomReset = useCallback(() => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const zoomToFit = useCallback(() => {
    if (components.length === 0) { zoomReset(); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of components) {
      const def = COMPONENT_DEFS[c.type];
      minX = Math.min(minX, c.x - def.width / 2);
      minY = Math.min(minY, c.y - def.height / 2);
      maxX = Math.max(maxX, c.x + def.width / 2);
      maxY = Math.max(maxY, c.y + def.height / 2);
    }
    const pad = 80;
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;
    const s = Math.min(size.width / w, size.height / h, MAX_SCALE);
    const finalScale = Math.max(MIN_SCALE, s);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setScale(finalScale);
    setStagePos({
      x: size.width / 2 - cx * finalScale,
      y: size.height / 2 - cy * finalScale,
    });
  }, [components, size, zoomReset]);

  const onWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    zoomAt(pos, scale * factor);
  };

  // ----- Drag/drop into world coordinates -----
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-comp-type');
    if (!type) return;
    const r = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - r.left;
    const screenY = e.clientY - r.top;
    const worldX = (screenX - stagePos.x) / scale;
    const worldY = (screenY - stagePos.y) / scale;
    const x = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(worldY / GRID_SIZE) * GRID_SIZE;
    onDropComponent(type, x, y);
  };

  // ----- Pan with middle mouse / Space+drag -----
  const onStageMouseDown = (e) => {
    const evt = e.evt;
    // Middle click or right click → pan
    if (evt.button === 1 || evt.button === 2) {
      evt.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: evt.clientX - stagePos.x, y: evt.clientY - stagePos.y };
    }
  };

  const onStageMouseMove = (e) => {
    const stage = e.target.getStage();
    // World coords for pending wire (uses Konva's getRelativePointerPosition which accounts for x/y/scale)
    const wp = stage.getRelativePointerPosition();
    setPointer(wp);
    if (isPanning && panStartRef.current) {
      const evt = e.evt;
      setStagePos({ x: evt.clientX - panStartRef.current.x, y: evt.clientY - panStartRef.current.y });
    }
  };

  const onStageMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  const onStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      onCancelWire();
      onSelectComponent(null);
    }
  };

  const grid = buildVisibleGrid(scale, stagePos, size.width, size.height);

  const pendingFrom = selectedTerminal ? getTerminalAbsPos(components, selectedTerminal.compId, selectedTerminal.termId) : null;

  return (
    <div
      ref={containerRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="workspace"
      className="relative flex-1 bg-[#0B132B] overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.04), transparent 50%)', cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={onStageMouseUp}
        onMouseLeave={onStageMouseUp}
        onWheel={onWheel}
        onClick={onStageClick}
        onTap={onStageClick}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          {grid.map((g, i) => (
            <Line key={i} points={g.points} stroke="#3A506B" strokeWidth={0.8 / scale} opacity={g.opacity} />
          ))}
        </Layer>

        {/* Wires layer */}
        <Layer>
          {wires.map((w) => {
            const from = getTerminalAbsPos(components, w.from.compId, w.from.termId);
            const to = getTerminalAbsPos(components, w.to.compId, w.to.termId);
            if (!from || !to) return null;
            const isEnergized = energizedWires.has(w.id);
            const isSelected = selectedItem && selectedItem.kind === 'wire' && selectedItem.id === w.id;
            const midX = (from.x + to.x) / 2;
            const points = [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
            return (
              <Line
                key={w.id}
                points={points}
                stroke={isSelected ? '#00B4D8' : (isEnergized ? '#FDE047' : '#475569')}
                strokeWidth={isSelected ? 5 : (isEnergized ? 3.5 : 2.5)}
                hitStrokeWidth={14}
                lineCap="round"
                lineJoin="round"
                shadowColor={isSelected ? '#00B4D8' : (isEnergized ? '#FDE047' : undefined)}
                shadowBlur={isSelected ? 14 : (isEnergized ? 10 : 0)}
                shadowOpacity={isSelected ? 0.9 : (isEnergized ? 0.7 : 0)}
                onClick={(e) => { e.cancelBubble = true; onSelectWire(w.id); }}
                onTap={(e) => { e.cancelBubble = true; onSelectWire(w.id); }}
                onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'pointer'; }}
                onMouseLeave={(e) => { e.target.getStage().container().style.cursor = isPanning ? 'grabbing' : 'default'; }}
              />
            );
          })}

          {/* Pending wire */}
          {pendingFrom && pointer && (
            <Line
              points={[pendingFrom.x, pendingFrom.y, pointer.x, pointer.y]}
              stroke="#00B4D8"
              strokeWidth={2 / scale}
              dash={[6 / scale, 6 / scale]}
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
              selected={selectedItem && selectedItem.kind === 'component' && selectedItem.id === c.id}
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

      {/* Zoom controls overlay */}
      <div
        data-testid="zoom-controls"
        className="absolute bottom-4 left-4 flex flex-col gap-1 bg-[#111A31]/95 backdrop-blur-md border border-[#3A506B] rounded-lg p-1.5 shadow-2xl z-10"
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          data-testid="zoom-in-btn"
          onClick={zoomIn}
          className="w-9 h-9 flex items-center justify-center text-[#E0E1DD] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="تكبير (Ctrl + عجلة الفأرة)"
        >
          <Plus size={16} />
        </button>
        <button
          data-testid="zoom-reset-btn"
          onClick={zoomReset}
          className="w-9 h-7 text-[10px] font-mono text-[#94A3B8] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="استعادة الحجم الافتراضي 100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          data-testid="zoom-out-btn"
          onClick={zoomOut}
          className="w-9 h-9 flex items-center justify-center text-[#E0E1DD] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="تصغير"
        >
          <Minus size={16} />
        </button>
        <div className="my-1 h-px bg-[#3A506B]" />
        <button
          data-testid="zoom-fit-btn"
          onClick={zoomToFit}
          className="w-9 h-9 flex items-center justify-center text-[#E0E1DD] hover:text-[#00B4D8] hover:bg-[#3A506B]/30 rounded transition-colors"
          title="ضبط على المكونات"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Pan hint */}
      <div className="absolute bottom-4 left-20 flex items-center gap-1.5 text-[10px] font-mono text-[#8D99AE] bg-[#111A31]/80 backdrop-blur-md border border-[#3A506B] rounded px-2 py-1 z-10 pointer-events-none">
        <Move size={11} />
        <span>زر أوسط / يمين للسحب · العجلة للتكبير</span>
      </div>

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
