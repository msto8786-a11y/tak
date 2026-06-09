// Export utilities: capture the current workspace as PNG (via Konva)
// or build a simplified SVG schematic from the data model.

import { COMPONENT_DEFS } from './componentDefs';

function escapeXml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getTerminalPos(components, compId, termId) {
  const c = components.find((x) => x.id === compId);
  if (!c) return null;
  const def = COMPONENT_DEFS[c.type];
  if (!def) return null;
  const t = def.terminals.find((x) => x.id === termId);
  if (!t) return null;
  return { x: c.x + t.x, y: c.y + t.y };
}

function computeBounds(components) {
  if (components.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of components) {
    const def = COMPONENT_DEFS[c.type];
    if (!def) continue;
    minX = Math.min(minX, c.x - def.width / 2);
    minY = Math.min(minY, c.y - def.height / 2 - 18);
    maxX = Math.max(maxX, c.x + def.width / 2);
    maxY = Math.max(maxY, c.y + def.height / 2 + 25);
    for (const t of def.terminals) {
      minX = Math.min(minX, c.x + t.x - 12);
      minY = Math.min(minY, c.y + t.y - 12);
      maxX = Math.max(maxX, c.x + t.x + 12);
      maxY = Math.max(maxY, c.y + t.y + 18);
    }
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- PNG export ---
// We temporarily reset the Stage transform, fit to content, and call toDataURL.
// stageNode must be a Konva Stage instance.
export function exportPNG(stageNode, components, energizedWires) {
  if (!stageNode || components.length === 0) {
    return { ok: false, error: 'لا توجد مكونات للتصدير' };
  }
  const b = computeBounds(components);
  const pad = 40;
  const w = (b.maxX - b.minX) + pad * 2;
  const h = (b.maxY - b.minY) + pad * 2;

  // Save current transform
  const oldScaleX = stageNode.scaleX();
  const oldScaleY = stageNode.scaleY();
  const oldX = stageNode.x();
  const oldY = stageNode.y();
  const oldW = stageNode.width();
  const oldH = stageNode.height();

  // Apply temporary transform: identity scale, translate so bounds start at (pad,pad)
  stageNode.scale({ x: 1, y: 1 });
  stageNode.position({ x: -b.minX + pad, y: -b.minY + pad });
  stageNode.size({ width: w, height: h });
  stageNode.draw();

  const dataUrl = stageNode.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });

  // Restore
  stageNode.scale({ x: oldScaleX, y: oldScaleY });
  stageNode.position({ x: oldX, y: oldY });
  stageNode.size({ width: oldW, height: oldH });
  stageNode.draw();

  triggerDownload(dataUrl, `control-lab-schematic-${Date.now()}.png`);
  return { ok: true };
}

// --- SVG export ---
// Build a simplified schematic SVG from the data model.
export function exportSVG(components, wires, energizedWires) {
  if (components.length === 0) {
    return { ok: false, error: 'لا توجد مكونات للتصدير' };
  }
  const b = computeBounds(components);
  const pad = 40;
  const w = (b.maxX - b.minX) + pad * 2;
  const h = (b.maxY - b.minY) + pad * 2;
  const tx = -b.minX + pad;
  const ty = -b.minY + pad;
  const GRID = 20;

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, sans-serif">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#0B132B"/>`);

  // light grid
  parts.push(`<g stroke="#3A506B" stroke-width="0.5" opacity="0.25">`);
  for (let x = (Math.floor((-tx) / GRID) * GRID) + tx; x <= w; x += GRID) {
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  }
  for (let y = (Math.floor((-ty) / GRID) * GRID) + ty; y <= h; y += GRID) {
    parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
  }
  parts.push(`</g>`);

  // wires (orthogonal)
  for (const wire of wires) {
    const from = getTerminalPos(components, wire.from.compId, wire.from.termId);
    const to = getTerminalPos(components, wire.to.compId, wire.to.termId);
    if (!from || !to) continue;
    const isEnergized = energizedWires && energizedWires.has(wire.id);
    const stroke = isEnergized ? '#FDE047' : '#94A3B8';
    const strokeW = isEnergized ? 3 : 2;
    const midX = (from.x + to.x) / 2;
    const fx = from.x + tx, fy = from.y + ty;
    const tx2 = to.x + tx, ty2 = to.y + ty;
    const mx = midX + tx;
    parts.push(
      `<polyline points="${fx},${fy} ${mx},${fy} ${mx},${ty2} ${tx2},${ty2}" fill="none" stroke="${stroke}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  // components
  for (const c of components) {
    const def = COMPONENT_DEFS[c.type];
    const x = c.x + tx;
    const y = c.y + ty;
    parts.push(`<g transform="translate(${x},${y})">`);
    parts.push(
      `<rect x="${-def.width / 2}" y="${-def.height / 2}" width="${def.width}" height="${def.height}" fill="#1C2541" stroke="#3A506B" stroke-width="1.5" rx="6"/>`
    );
    parts.push(
      `<rect x="${-def.width / 2}" y="${-def.height / 2}" width="${def.width}" height="20" fill="#0B132B"/>`
    );
    parts.push(
      `<text x="0" y="${-def.height / 2 + 14}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="500">${escapeXml(def.name)}</text>`
    );

    // Simple state hints
    let badge = '';
    if (c.type === 'power_switch' || c.type === 'breaker') {
      badge = c.state?.closed ? 'ON' : 'OFF';
    } else if (c.type === 'contactor' || c.type === 'relay') {
      badge = c.state?.energized ? 'ON' : 'OFF';
    } else if (c.type === 'timer_relay') {
      const u = c.state?.unit === 'minutes' ? 'm' : 's';
      badge = `T=${c.state?.duration ?? 5}${u}`;
    } else if (c.type === 'ac_supply') {
      badge = '220V~';
    } else if (c.type === 'dc_supply') {
      badge = '12V=';
    }
    if (badge) {
      parts.push(
        `<text x="0" y="4" text-anchor="middle" fill="#00B4D8" font-size="14" font-weight="bold" font-family="monospace">${escapeXml(badge)}</text>`
      );
    }

    // Terminals
    let isSource = def.isSource;
    for (const t of def.terminals) {
      const fill = isSource && t.polarity === 'positive' ? '#FDE047' : '#0B132B';
      parts.push(
        `<circle cx="${t.x}" cy="${t.y}" r="5" fill="${fill}" stroke="#94A3B8" stroke-width="1.8"/>`
      );
      parts.push(
        `<text x="${t.x}" y="${t.y + 17}" text-anchor="middle" fill="#94A3B8" font-size="9" font-family="monospace">${escapeXml(t.label)}</text>`
      );
    }
    parts.push(`</g>`);
  }

  // Title
  parts.push(
    `<text x="${pad / 2}" y="${h - 12}" fill="#8D99AE" font-size="11" font-family="monospace">Industrial Control Lab Schematic — Generated ${new Date().toLocaleString('ar')}</text>`
  );

  parts.push(`</svg>`);

  const svgString = parts.join('\n');
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `control-lab-schematic-${Date.now()}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true };
}
