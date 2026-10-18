// Film mode: a step-by-step shot guide for a sub-one-minute demo video, shown on the phone.
const STEPS = [
  { t: '0:00', go: null, say: 'Start screen recording with the mic on. iPhone: Control Center, Screen Recording, hold for Microphone. Android: Quick Settings, Screen record.' },
  { t: '0:03', go: 'voice', say: 'Tap "Start a call" (bottom right) and say: "A small festival stage with a scrim hologram, two speakers, four washes, two days."' },
  { t: '0:12', go: 'total', say: 'Let the A2 answer. Scroll slowly past the budget and the checks.' },
  { t: '0:20', go: 'mv', say: 'Tap Specs. Drag the 3D stage around once so the labels show.' },
  { t: '0:28', go: 'mv', say: 'Tap the AR icon. Put the back edge of the red disc on your tape, twist to the arrow, walk to the scrim.' },
  { t: '0:45', go: 'map', say: 'Back on the page: show the 3D map at floor 2, then the cable schedule.' },
  { t: '0:52', go: 'honesty', say: 'Say: "AR is aligned by hand to the tape, not GPS. Prices are public listings, show gear is quote only." Stop recording.' },
];
let i = 0;
const card = document.createElement('div');
card.id = 'film';
card.hidden = true;
card.innerHTML = '<div class="film-head"><b>Film mode</b> <span id="filmStep"></span><button id="filmClose" class="secondary">Close</button></div><div id="filmSay"></div><div class="btns"><button id="filmBack" class="secondary">Back</button><button id="filmNext">Next</button></div>';
document.body.appendChild(card);
const $ = (id) => document.getElementById(id);
function show() {
  const s = STEPS[i];
  $('filmStep').textContent = `Step ${i + 1} of ${STEPS.length} · ${s.t}`;
  $('filmSay').textContent = s.say;
  $('filmNext').textContent = i === STEPS.length - 1 ? 'Done' : 'Next';
  if (s.go) $(s.go)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
$('filmBtn').onclick = () => { i = 0; card.hidden = false; show(); };
$('filmClose').onclick = () => { card.hidden = true; };
$('filmBack').onclick = () => { i = Math.max(0, i - 1); show(); };
$('filmNext').onclick = () => { if (i === STEPS.length - 1) { card.hidden = true; return; } i += 1; show(); };
