// Electrical simulation logic.
// Uses Union-Find over terminal-nodes to detect circuit closure.
// Iterates until stable to support latching (self-holding) circuits with contactors.

import { COMPONENT_DEFS } from './componentDefs';

class DSU {
  constructor() { this.p = new Map(); }
  find(x) {
    if (!this.p.has(x)) this.p.set(x, x);
    while (this.p.get(x) !== x) {
      this.p.set(x, this.p.get(this.p.get(x)));
      x = this.p.get(x);
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
  same(a, b) { return this.find(a) === this.find(b); }
}

const termKey = (compId, termId) => `${compId}::${termId}`;

// Build adjacency considering current component states + wires.
function buildGroups(components, wires) {
  const dsu = new DSU();
  // Internal links per component
  for (const c of components) {
    const def = COMPONENT_DEFS[c.type];
    if (!def) continue;
    const links = def.internalLinks(c.state || {});
    for (const [a, b] of links) {
      dsu.union(termKey(c.id, a), termKey(c.id, b));
    }
    // Ensure terminals exist as nodes
    for (const t of def.terminals) dsu.find(termKey(c.id, t.id));
  }
  // External wires
  for (const w of wires) {
    dsu.union(termKey(w.from.compId, w.from.termId), termKey(w.to.compId, w.to.termId));
  }
  return dsu;
}

// Returns whether a (compId, termId) is reachable from any positive source through current closures, and similarly for negative.
export function simulate(components, wires) {
  // Iterate up to N times for stable state (contactor self-holding, NC contacts, etc.)
  const updatedComponents = components.map((c) => ({ ...c, state: { ...c.state } }));
  let stable = false;
  let iter = 0;
  let lastEnergized = new Set();
  let dsu = null;

  while (!stable && iter < 8) {
    iter += 1;
    dsu = buildGroups(updatedComponents, wires);

    // Find source positive/negative roots
    const positiveRoots = new Set();
    const negativeRoots = new Set();
    for (const c of updatedComponents) {
      const def = COMPONENT_DEFS[c.type];
      if (!def || !def.isSource) continue;
      for (const t of def.terminals) {
        if (t.polarity === 'positive') positiveRoots.add(dsu.find(termKey(c.id, t.id)));
        if (t.polarity === 'negative') negativeRoots.add(dsu.find(termKey(c.id, t.id)));
      }
    }

    const energizedNow = new Set();

    // For each component with a coil, check if A1 (positive) and A2 (negative) are connected to opposing source roots
    // A coil is energized if its two coil terminals belong to groups that are connected to + and - of any same source.
    // We simplify: any + source group ↔ A1 and any - source group ↔ A2.
    for (const c of updatedComponents) {
      const def = COMPONENT_DEFS[c.type];
      if (!def) continue;
      if (def.hasCoil) {
        const aRoot = dsu.find(termKey(c.id, def.hasCoil.positive));
        const bRoot = dsu.find(termKey(c.id, def.hasCoil.negative));
        const aPos = positiveRoots.has(aRoot);
        const aNeg = negativeRoots.has(aRoot);
        const bPos = positiveRoots.has(bRoot);
        const bNeg = negativeRoots.has(bRoot);
        const isEnergized = (aPos && bNeg) || (aNeg && bPos);
        if (c.type === 'timer_relay') {
          c.state.coilOn = isEnergized;
          energizedNow.add(c.id + '::coil:' + (isEnergized ? '1' : '0'));
          // c.state.energized is managed by timer ticker, not here.
        } else {
          c.state.energized = isEnergized;
          if (isEnergized) energizedNow.add(c.id);
        }
      }
    }

    // Stability check: same set as last iteration?
    const keyset = Array.from(energizedNow).sort().join(',');
    const lastKey = Array.from(lastEnergized).sort().join(',');
    if (keyset === lastKey) stable = true;
    lastEnergized = energizedNow;
  }

  // Compute wire energization: a wire is energized if its two endpoints are in groups that bridge + and - (i.e., one side connected to + AND other to -; OR both connected to both, etc.)
  // Simpler: wire is energized if its endpoint group is connected to BOTH a + and a - root via the network, meaning current can flow through that group's branch. As an approximation we say a wire is energized if one of its endpoint groups touches + and the other touches - (i.e., this wire is on a closed path).
  dsu = buildGroups(updatedComponents, wires);
  const posRoots = new Set();
  const negRoots = new Set();
  for (const c of updatedComponents) {
    const def = COMPONENT_DEFS[c.type];
    if (!def || !def.isSource) continue;
    for (const t of def.terminals) {
      if (t.polarity === 'positive') posRoots.add(dsu.find(termKey(c.id, t.id)));
      if (t.polarity === 'negative') negRoots.add(dsu.find(termKey(c.id, t.id)));
    }
  }

  const energizedWires = new Set();
  for (const w of wires) {
    const ra = dsu.find(termKey(w.from.compId, w.from.termId));
    const rb = dsu.find(termKey(w.to.compId, w.to.termId));
    const isPath = (posRoots.has(ra) && negRoots.has(rb)) || (posRoots.has(rb) && negRoots.has(ra)) || (posRoots.has(ra) && posRoots.has(rb) && ra !== rb) || (negRoots.has(ra) && negRoots.has(rb) && ra !== rb);
    // Simpler approximation: wire is energized if BOTH endpoints' groups together touch + and -.
    const touchesPos = posRoots.has(ra) || posRoots.has(rb);
    const touchesNeg = negRoots.has(ra) || negRoots.has(rb);
    if (touchesPos && touchesNeg) energizedWires.add(w.id);
    if (isPath) energizedWires.add(w.id);
  }

  // Loads (buzzer): energized when their two terminals are in groups bridging + and -.
  const loadEnergized = {};
  for (const c of updatedComponents) {
    const def = COMPONENT_DEFS[c.type];
    if (!def) continue;
    if (def.isLoad) {
      const ra = dsu.find(termKey(c.id, def.terminals[0].id));
      const rb = dsu.find(termKey(c.id, def.terminals[1].id));
      const cond = (posRoots.has(ra) && negRoots.has(rb)) || (posRoots.has(rb) && negRoots.has(ra));
      loadEnergized[c.id] = cond;
    }
  }

  // Voltmeter/Ammeter reading
  const meters = {};
  for (const c of updatedComponents) {
    const def = COMPONENT_DEFS[c.type];
    if (!def) continue;
    if (def.isMeter === 'voltage') {
      const ra = dsu.find(termKey(c.id, 'P'));
      const rb = dsu.find(termKey(c.id, 'M'));
      // find the source voltage between the two endpoints
      let voltage = 0;
      for (const src of updatedComponents) {
        const srcDef = COMPONENT_DEFS[src.type];
        if (!srcDef || !srcDef.isSource) continue;
        const posT = srcDef.terminals.find((t) => t.polarity === 'positive');
        const negT = srcDef.terminals.find((t) => t.polarity === 'negative');
        const sp = dsu.find(termKey(src.id, posT.id));
        const sn = dsu.find(termKey(src.id, negT.id));
        if ((sp === ra && sn === rb) || (sp === rb && sn === ra)) {
          voltage = srcDef.voltage;
          break;
        }
      }
      meters[c.id] = { value: voltage, unit: 'V' };
    } else if (def.isMeter === 'current') {
      // very approximate; show 0.5 A if part of closed circuit, else 0
      const ra = dsu.find(termKey(c.id, 'P'));
      const touchesPos = posRoots.has(ra);
      const touchesNeg = negRoots.has(ra);
      meters[c.id] = { value: (touchesPos || touchesNeg) ? 0.5 : 0, unit: 'A' };
    }
  }

  return { components: updatedComponents, energizedWires, loadEnergized, meters };
}
