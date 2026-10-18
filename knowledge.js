// Event and experience design knowledge. General production practice, written for review by a working TD.
// Claude reads all of it when it plans; the page shows it as the design notes. Code limits come from the
// local AHJ (authority having jurisdiction), so rules here never replace the fire marshal or a rigger.
export const KNOWLEDGE = {
  'Cable paths': [
    'Run cable along walls and the room perimeter, never across an exit path or aisle.',
    'Where a cable must cross a walkway, use rated cable ramps, never bare tape.',
    'Keep power apart from audio and data runs, and cross them at right angles to limit hum.',
    'Protect the main run from FOH to stage: a ramped trench, a perimeter route, or flown over the crowd on rated rigging.',
    'Leave a service loop at each end, label both ends, and dress runs with gaff tape.',
    'Keep runs away from doors, bars, catering and anywhere wet. Use GFCI protection outdoors.',
  ],
  'Ingress and egress': [
    'Keep every exit, exit sign and exit path clear of gear, cable and queues for the whole event.',
    'Size exits to the occupant load. The local fire marshal sets the real number and the exit widths.',
    'Separate the entry flow from the exit flow where the room allows, so the two streams never collide.',
    'Plan a full-room evacuation route that works with the house lights out and the show running.',
    'Keep an accessible route to the viewing area and the bar, with a step-free path and space for wheelchairs.',
    'Load-in and load-out use a separate path from guests: check elevator size and weight limit, door widths and dock hours.',
  ],
  'Audience and queues': [
    'Hold the entry queue outside the show room, in a serpentine with stanchions, so the room fills at a steady rate.',
    'Match check-in staff and scanners to the arrival peak, which is usually the first 30 to 45 minutes.',
    'Place bars, restrooms and merch so their queues never cross the main path or block sightlines.',
    'Mark an overflow zone and a re-entry policy before doors.',
    'For a standing crowd, keep a clear barricade line or a buffer in front of the stage and the scrim.',
  ],
  'Tech booth (FOH)': [
    'Put FOH on the center line of the room, about two thirds of the way back, so the mix matches what most of the crowd hears.',
    'FOH needs a clear view of the stage, the scrim and the screens. Raise it on a riser if the crowd stands.',
    'Never put FOH under a balcony overhang, in front of an exit, or in an egress aisle.',
    'In a small room, a side or rear corner position works if the operator monitors on near-fields and walks the room.',
    'FOH needs its own clean power circuit and a protected cable path to the stage.',
    'With front projection, place the projector at or above FOH so heads never cut the beam.',
  ],
  'Projection and scrim': [
    'The scrim effect needs a dark field: black velour upstage, house lights out, content on pure black.',
    'Light performers from the sides, top and back. Keep front light off the gauze.',
    'If a standing crowd sits between the projector and the scrim, rear project with a short-throw lens or fly the projector above head height.',
    'Rear projection puts the lens hotspot in the audience eye line. Aim the lens so the hotspot clears it, and keep performers out of the beam.',
    'Tension the gauze flat with a top batten and a weighted bottom pipe, hung from a goalpost or rated points.',
  ],
  'Power and rigging': [
    'Load each 20 A circuit to 80 percent or less, and keep audio on its own circuit from lighting and video.',
    'Ask the venue for rigging points, their working load limits and a rigging plot before choosing to fly anything.',
    'Ground-supported truss needs base plates and ballast. A qualified rigger signs off every hang.',
    'Upper floors need a floor load rating before staging, lifts or heavy cases go on them.',
  ],
  'Venue questions': [
    'Room plans and dimensions, ceiling and trim height, and floor load rating.',
    'Rigging points, working load limits and the house rigging plot.',
    'Power: circuits, amps, distro location and a company switch.',
    'Blackout: windows, emergency lighting and house light control.',
    'Load-in path: elevator size and limit, doors, dock and hours.',
    'Fire rules: drape flame certificates (NFPA 701), haze policy and occupant load.',
    'Labor rules, curfew, noise limits, house AV inventory and internet.',
  ],
};

export function knowledgeText() {
  return Object.entries(KNOWLEDGE).map(([k, v]) => `${k}:\n- ${v.join('\n- ')}`).join('\n\n');
}
