// Self-holding starter circuit used as a teaching example.
// Wiring (simple LATCH):
//   AC L → Emergency Stop NC → Stop NC → [Start NO || Contactor NO_AUX] → Contactor A1
//   Contactor A2 → AC N
//   Power lamp:  AC L → Contactor L1 (main contact) → Lamp_green X1 ; Lamp X2 → AC N
//   Status lamp (red): Contactor NC_AUX in series with red lamp when contactor not energized
// Press start to latch ON; press stop or emergency to release.

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function buildExampleCircuit() {
  // Coordinates aligned to 20px grid
  const components = [
    { id: uid(), type: 'ac_supply',         x: 200,  y: 200, state: {} },
    { id: uid(), type: 'emergency_stop',    x: 380,  y: 200, state: { pressed: false } },
    { id: uid(), type: 'push_button_stop',  x: 560,  y: 200, state: { pressed: false } },
    { id: uid(), type: 'push_button_start', x: 740,  y: 200, state: { pressed: false } },
    { id: uid(), type: 'contactor',         x: 1000, y: 320, state: {} },
    { id: uid(), type: 'lamp_green',        x: 1240, y: 540, state: {} },
    { id: uid(), type: 'lamp_red',          x: 1240, y: 700, state: {} },
  ];

  const [ac, eStop, btnStop, btnStart, cont, lampG, lampR] = components;

  const wires = [
    // L → E-Stop T1
    { id: uid(), from: { compId: ac.id,   termId: 'L'    }, to: { compId: eStop.id,   termId: 'T1' } },
    // E-Stop T2 → Stop button T1
    { id: uid(), from: { compId: eStop.id,termId: 'T2'   }, to: { compId: btnStop.id, termId: 'T1' } },
    // Stop T2 → Start T1
    { id: uid(), from: { compId: btnStop.id, termId: 'T2'}, to: { compId: btnStart.id,termId: 'T1' } },
    // Start T2 → Contactor A1
    { id: uid(), from: { compId: btnStart.id, termId: 'T2'}, to: { compId: cont.id,   termId: 'A1' } },
    // Self-hold: Contactor NO_A → Stop T2 (parallel with start)
    { id: uid(), from: { compId: cont.id, termId: 'NO_A' }, to: { compId: btnStop.id, termId: 'T2' } },
    // Contactor NO_B → Contactor A1
    { id: uid(), from: { compId: cont.id, termId: 'NO_B' }, to: { compId: cont.id,    termId: 'A1' } },
    // Contactor A2 → N
    { id: uid(), from: { compId: cont.id, termId: 'A2'   }, to: { compId: ac.id,      termId: 'N'  } },
    // Main contact: L → Contactor L1
    { id: uid(), from: { compId: ac.id,   termId: 'L'    }, to: { compId: cont.id,    termId: 'L1' } },
    // Contactor T1 → green lamp X1
    { id: uid(), from: { compId: cont.id, termId: 'T1'   }, to: { compId: lampG.id,   termId: 'A'  } },
    // green lamp X2 → N
    { id: uid(), from: { compId: lampG.id,termId: 'B'    }, to: { compId: ac.id,      termId: 'N'  } },
    // Red lamp on NC aux: L → NC_A
    { id: uid(), from: { compId: ac.id,   termId: 'L'    }, to: { compId: cont.id,    termId: 'NC_A'}},
    // NC_B → red lamp X1
    { id: uid(), from: { compId: cont.id, termId: 'NC_B' }, to: { compId: lampR.id,   termId: 'A'  } },
    // red lamp X2 → N
    { id: uid(), from: { compId: lampR.id,termId: 'B'    }, to: { compId: ac.id,      termId: 'N'  } },
  ];

  return { components, wires };
}
