# Industrial Control Lab Simulator — PRD

## Original Problem Statement
A web-based 2D simulator for a Classic Industrial Control Lab (Arabic UI), graduation project for an academic engineering lab. Drag-and-drop CAD-like workspace, node-to-node wiring, electrical simulation logic, and bridge to a standalone Wi-Fi relay module (3 channels, no Arduino) that mirrors virtual contactor states via HTTP requests.

## Architecture
- **Frontend**: React 19 + Konva.js (react-konva) for canvas/CAD workspace + Tailwind + shadcn-style components.
- **Backend**: FastAPI (default `/api/` endpoints kept for future session persistence).
- **Persistence**: LocalStorage + JSON Export/Import (no DB yet).
- **Hardware bridge**: HTTP GET to a standalone Wi-Fi relay module. URL configurable from UI.

## User Personas
- Engineering students learning industrial control circuits.
- Lab instructor reviewing student work.

## Core Requirements (static)
- Arabic localization (RTL).
- Sidebar (left) with draggable components.
- CAD-like grid workspace.
- Run / Stop simulation buttons in topbar.
- Components: Main Power Switch, 220V AC Supply, 12V DC Supply, Voltmeter, Ammeter, Buzzer (max 3), Contactor (max 3 with A1/A2/L1-L3/T1-T3/NO/NC), Timer Relay with Arabic settings modal (Seconds/Minutes + duration).
- Click-to-wire between terminal nodes.
- Visual feedback: energized wires glow yellow, contactors show closed state, buzzers ring with sound waves.
- HTTP fetch to Wi-Fi relay module when a virtual contactor energizes (channel 1..3 mapping).

## What's been implemented (2026-02-09)
- Full Arabic RTL UI with IBM Plex Sans Arabic font.
- Dark "blueprint" technical theme based on design_guidelines.json.
- Left sidebar with **17 component types**, draggable HTML5 DnD, with max-count enforcement.
- Konva grid workspace with snap-to-grid (20px).
- All 17 components rendered: power_switch, breaker (max 2), fuse (max 3), emergency_stop (max 1), push_button_start/stop (max 3 each), ac_supply, dc_supply, voltmeter, ammeter, buzzer (max 3), lamp_green/yellow/red (max 3 each), contactor (max 3), relay (max 3), timer_relay (max 3).
- Click-to-wire (terminal → terminal) with pending dashed preview, duplicate prevention.
- Double-click toggles: power_switch/breaker (closed), push buttons & emergency_stop (pressed), fuse (blown), timer_relay (opens settings modal).
- Wi-Fi settings modal (base URL, on/off paths, enable toggle).
- Sessions Manager modal (cloud icon): save/load/delete sessions in MongoDB. Includes an "Example self-holding circuit" loader.
- JSON file Export/Import + LocalStorage quick-save.
- Clear workspace + Delete-selected (component or wire) via topbar button or Delete/Backspace keys.
- Selection state: click component or wire shows accent border / cyan stroke. Click empty stage deselects.
- Electrical simulation: Union-Find over terminals, iterative stable-state evaluation, supports self-holding circuits and NC/NO contactor logic.
- Live energized-wire glow, buzzer sound-wave animation, voltmeter/ammeter readings, lamp glow with color.
- Timer countdown with live "متبقي Xs" display.
- **Wi-Fi relay HTTP** GET on contactor+relay state change — first 3 devices (contactor or relay, in placement order) map to channels 1-3.
- Backend Mongo `lab_sessions` collection with full CRUD endpoints: POST/GET/PUT/DELETE /api/sessions.
- Optional `POST /api/wifi-relay/forward` backend proxy to avoid mixed-content warnings.

## Prioritized Backlog
- **P1**: Backend MongoDB persistence for student sessions (login).
- **P1**: Multi-select & delete components/wires on canvas.
- **P2**: Realistic AC current simulation (RMS calculations) + per-component current measurement.
- **P2**: Latching pushbutton (NO + NC momentary buttons).
- **P2**: Overload relay, signal lamps.
- **P3**: Export schematic to PNG/SVG.

## Next Tasks
- Connect testing agent feedback fixes.
- Optionally: integrate Emergent Auth for student/instructor accounts.
