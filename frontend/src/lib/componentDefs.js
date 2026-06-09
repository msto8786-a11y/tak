// Component type definitions for the industrial control simulator.
// Each component declares: arabic name, dimensions, terminal positions (relative to center),
// internal-connection logic (which terminals are conductively bonded internally given state).

export const COMPONENT_DEFS = {
  power_switch: {
    type: 'power_switch',
    name: 'مفتاح تشغيل رئيسي',
    icon: 'ToggleLeft',
    width: 120,
    height: 70,
    max: null,
    defaultState: { closed: false },
    terminals: [
      { id: 'T1', x: -50, y: 0, label: '1' },
      { id: 'T2', x: 50, y: 0, label: '2' },
    ],
    internalLinks: (s) => (s.closed ? [['T1', 'T2']] : []),
  },
  ac_supply: {
    type: 'ac_supply',
    name: 'وحدة تغذية 220 فولت',
    icon: 'Zap',
    width: 130,
    height: 80,
    max: null,
    defaultState: {},
    isSource: true,
    voltage: 220,
    sourceKind: 'AC',
    terminals: [
      { id: 'L', x: -45, y: 20, label: 'L', polarity: 'positive' },
      { id: 'N', x: 45, y: 20, label: 'N', polarity: 'negative' },
    ],
    internalLinks: () => [],
  },
  dc_supply: {
    type: 'dc_supply',
    name: 'وحدة تغذية 12 فولت',
    icon: 'BatteryFull',
    width: 130,
    height: 80,
    max: null,
    defaultState: {},
    isSource: true,
    voltage: 12,
    sourceKind: 'DC',
    terminals: [
      { id: 'POS', x: -45, y: 20, label: '+', polarity: 'positive' },
      { id: 'NEG', x: 45, y: 20, label: '-', polarity: 'negative' },
    ],
    internalLinks: () => [],
  },
  voltmeter: {
    type: 'voltmeter',
    name: 'مقياس الجهد',
    icon: 'Gauge',
    width: 110,
    height: 110,
    max: null,
    defaultState: {},
    isMeter: 'voltage',
    terminals: [
      { id: 'P', x: -30, y: 45, label: '+' },
      { id: 'M', x: 30, y: 45, label: '-' },
    ],
    internalLinks: () => [], // voltmeter is ideally open circuit
  },
  ammeter: {
    type: 'ammeter',
    name: 'مقياس التيار',
    icon: 'Activity',
    width: 110,
    height: 110,
    max: null,
    defaultState: {},
    isMeter: 'current',
    terminals: [
      { id: 'P', x: -30, y: 45, label: '+' },
      { id: 'M', x: 30, y: 45, label: '-' },
    ],
    internalLinks: () => [['P', 'M']], // ammeter ideally short circuit (in series)
  },
  buzzer: {
    type: 'buzzer',
    name: 'زمور',
    icon: 'Bell',
    width: 100,
    height: 100,
    max: 3,
    defaultState: {},
    isLoad: true,
    terminals: [
      { id: 'A', x: -25, y: 40, label: 'A' },
      { id: 'B', x: 25, y: 40, label: 'B' },
    ],
    internalLinks: () => [], // load (no internal short)
  },
  contactor: {
    type: 'contactor',
    name: 'كونتاكتور',
    icon: 'Box',
    width: 200,
    height: 220,
    max: 3,
    defaultState: {},
    hasCoil: { positive: 'A1', negative: 'A2' },
    terminals: [
      // Coil
      { id: 'A1', x: -75, y: -90, label: 'A1' },
      { id: 'A2', x: 75, y: -90, label: 'A2' },
      // Main contacts (3 poles)
      { id: 'L1', x: -60, y: -30, label: 'L1' },
      { id: 'T1', x: -60, y: 30, label: 'T1' },
      { id: 'L2', x: 0, y: -30, label: 'L2' },
      { id: 'T2', x: 0, y: 30, label: 'T2' },
      { id: 'L3', x: 60, y: -30, label: 'L3' },
      { id: 'T3', x: 60, y: 30, label: 'T3' },
      // Auxiliaries
      { id: 'NO_A', x: -50, y: 90, label: '13' },
      { id: 'NO_B', x: -20, y: 90, label: '14' },
      { id: 'NC_A', x: 20, y: 90, label: '21' },
      { id: 'NC_B', x: 50, y: 90, label: '22' },
    ],
    // Internal connections depend on whether coil A1-A2 is energized (set on energized state)
    internalLinks: (s) => {
      const e = !!s.energized;
      const links = [];
      if (e) {
        links.push(['L1', 'T1'], ['L2', 'T2'], ['L3', 'T3'], ['NO_A', 'NO_B']);
      } else {
        links.push(['NC_A', 'NC_B']);
      }
      return links;
    },
  },
  timer_relay: {
    type: 'timer_relay',
    name: 'مؤقت زمني',
    icon: 'Clock',
    width: 160,
    height: 180,
    max: null,
    defaultState: { unit: 'seconds', duration: 5, elapsed: 0, coilOn: false, energized: false, startedAt: null },
    hasCoil: { positive: 'A1', negative: 'A2' },
    terminals: [
      { id: 'A1', x: -55, y: -70, label: 'A1' },
      { id: 'A2', x: 55, y: -70, label: 'A2' },
      { id: 'NO_A', x: -45, y: 70, label: '15' },
      { id: 'NO_B', x: -15, y: 70, label: '18' },
      { id: 'NC_A', x: 15, y: 70, label: '25' },
      { id: 'NC_B', x: 45, y: 70, label: '28' },
    ],
    internalLinks: (s) => {
      const e = !!s.energized; // becomes true after timer elapses
      return e ? [['NO_A', 'NO_B']] : [['NC_A', 'NC_B']];
    },
  },
};

export const SIDEBAR_ITEMS = [
  'power_switch',
  'ac_supply',
  'dc_supply',
  'voltmeter',
  'ammeter',
  'buzzer',
  'contactor',
  'timer_relay',
];
