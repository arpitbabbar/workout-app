'use strict';

/* =====================================================================
   Workout Tracker — everything is saved in this browser (localStorage).
   ===================================================================== */

const STORE_KEY = 'workout-tracker-v1';

const DEFAULT_EXERCISES = {
  Chest: ['Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press', 'Incline Dumbbell Press',
    'Dumbbell Fly', 'Cable Crossover', 'Chest Press Machine', 'Pec Deck', 'Push-up', 'Chest Dips'],
  Back: ['Deadlift', 'Pull-up', 'Chin-up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Seated Cable Row',
    'T-Bar Row', 'Face Pull', 'Back Extension'],
  Shoulders: ['Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raise', 'Front Raise',
    'Rear Delt Fly', 'Upright Row', 'Shrug'],
  Legs: ['Squat', 'Front Squat', 'Hack Squat', 'Goblet Squat', 'Leg Press', 'Romanian Deadlift', 'Lunge',
    'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Calf Raise'],
  Biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'Concentration Curl'],
  Triceps: ['Tricep Pushdown', 'Skull Crusher', 'Overhead Tricep Extension', 'Close-Grip Bench Press',
    'Tricep Dips', 'Tricep Kickback'],
  Core: ['Plank', 'Crunch', 'Hanging Leg Raise', 'Cable Crunch', 'Russian Twist', 'Ab Wheel Rollout'],
  'Full body': ['Clean and Press', 'Kettlebell Swing', 'Burpee', "Farmer's Walk"],
};
const MUSCLES = Object.keys(DEFAULT_EXERCISES);
const MUSCLE_ICONS = { Chest: '🏋️', Back: '🧗', Shoulders: '🤸', Legs: '🦵', Biceps: '💪', Triceps: '🦾', Core: '🎯', 'Full body': '🔥' };

// Extra fields an activity can have (on top of duration + intensity + notes)
const FIELD_DEFS = {
  distance: { label: 'Distance (km)', type: 'number' },
  distanceM: { label: 'Distance (m)', type: 'number' },
  steps: { label: 'Steps', type: 'number', placeholder: 'Blank = estimate' },
  laps: { label: 'Laps', type: 'number' },
  stroke: { label: 'Stroke', type: 'select', options: ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'Mixed'] },
  games: { label: 'Games played', type: 'number' },
  format: { label: 'Format', type: 'select', options: ['Singles', 'Doubles'] },
  rounds: { label: 'Rounds', type: 'number' },
  elevation: { label: 'Elevation gain (m)', type: 'number' },
  style: { label: 'Style', type: 'text', placeholder: 'e.g. Hatha, stretching', wide: true },
  label: { label: 'What did you do?', type: 'text', placeholder: 'e.g. Dance class', wide: true },
};

// met = calories burn rate for [Easy, Moderate, Hard]
const ACTIVITY_TYPES = {
  walking: { name: 'Walking', icon: '🚶', met: [2.8, 3.5, 5.0], stepsPerKm: 1300, pace: true, fields: ['distance', 'steps'] },
  running: { name: 'Running', icon: '🏃', met: [7.0, 9.8, 11.5], stepsPerKm: 1000, pace: true, fields: ['distance', 'steps'] },
  cycling: { name: 'Cycling', icon: '🚴', met: [4.0, 6.8, 10.0], fields: ['distance'] },
  swimming: { name: 'Swimming', icon: '🏊', met: [5.0, 7.0, 9.8], fields: ['laps', 'distanceM', 'stroke'] },
  badminton: { name: 'Badminton', icon: '🏸', met: [4.5, 5.5, 7.0], fields: ['games', 'format'] },
  tennis: { name: 'Tennis', icon: '🎾', met: [5.0, 7.3, 8.0], fields: ['games', 'format'] },
  squash: { name: 'Squash', icon: '🥎', met: [7.3, 9.0, 12.0], fields: ['games'] },
  tabletennis: { name: 'Table tennis', icon: '🏓', met: [3.0, 4.0, 5.0], fields: ['games', 'format'] },
  football: { name: 'Football', icon: '⚽', met: [6.0, 7.0, 10.0], fields: [] },
  cricket: { name: 'Cricket', icon: '🏏', met: [4.0, 4.8, 6.0], fields: [] },
  basketball: { name: 'Basketball', icon: '🏀', met: [4.5, 6.5, 8.0], fields: [] },
  yoga: { name: 'Yoga / Stretching', icon: '🧘', met: [2.0, 2.5, 4.0], fields: ['style'] },
  hiit: { name: 'HIIT', icon: '🔥', met: [6.0, 8.0, 10.0], fields: ['rounds'] },
  skipping: { name: 'Skipping rope', icon: '🪢', met: [8.8, 11.0, 12.3], fields: ['rounds'] },
  hiking: { name: 'Hiking', icon: '🥾', met: [5.3, 6.0, 7.8], stepsPerKm: 1400, pace: true, fields: ['distance', 'elevation', 'steps'] },
  other: { name: 'Other', icon: '⭐', met: [3.0, 4.5, 6.0], fields: ['label'] },
};
const INTENSITIES = ['Easy', 'Moderate', 'Hard'];
const STRENGTH_MET = 5.0;

// Plates available in a normal gym, with standard colours
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_STYLE = {
  25: ['#e5383b', 100], 20: ['#2f6fed', 94], 15: ['#f2c014', 82], 10: ['#2fb344', 70],
  5: ['#f1f3f7', 54], 2.5: ['#3a3f4b', 44], 1.25: ['#9aa1ad', 36],
};
const BARS = [20, 15, 10, 0];

/* ---------------------------- Helpers ---------------------------- */

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const todayStr = () => ymd(new Date());
const fmtDate = (s, opts) => parseYmd(s).toLocaleDateString(undefined, opts);
const shortDate = s => fmtDate(s, { day: 'numeric', month: 'short' });
const weekStart = s => { const d = parseYmd(s); return addDays(s, -((d.getDay() + 6) % 7)); };

const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
const fmtNum = n => Math.round(n).toLocaleString();
const fmtKg = n => String(Math.round((n || 0) * 100) / 100);
const fmtSet = s => s.kg ? `${fmtKg(s.kg)}×${s.reps}` : `${s.reps} reps`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtPace(minutes, km) {
  const secs = Math.round(minutes * 60 / km);
  return `${Math.floor(secs / 60)}:${pad(secs % 60)} /km`;
}

/* ----------------------------- State ----------------------------- */

function defaultExercises() {
  return MUSCLES.flatMap(muscle => DEFAULT_EXERCISES[muscle].map(name => ({ id: slug(name), name, muscle })));
}

function defaultState() {
  return { version: 1, settings: { bodyWeight: 70, restSeconds: 90 }, exercises: defaultExercises(), templates: [], days: {} };
}

function normalizeState(s) {
  if (!s || typeof s !== 'object' || !s.days || typeof s.days !== 'object') throw new Error('Invalid data');
  const base = defaultState();
  const exercises = Array.isArray(s.exercises) ? s.exercises : [];
  for (const e of base.exercises) if (!exercises.some(x => x.id === e.id)) exercises.push(e);
  return {
    version: 1,
    settings: { ...base.settings, ...(s.settings || {}) },
    exercises,
    templates: Array.isArray(s.templates) ? s.templates : [],
    days: s.days,
  };
}

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return defaultState();
  try {
    return normalizeState(JSON.parse(raw));
  } catch (e) {
    // Never silently throw away data: keep the broken copy aside.
    localStorage.setItem(`${STORE_KEY}-broken-${Date.now()}`, raw);
    return defaultState();
  }
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('⚠️ Could not save your data'); }
}

let state = loadState();
const ui = { tab: 'today', date: todayStr(), calMonth: todayStr().slice(0, 7), progressEx: null, progressCardio: null };

const getDay = date => state.days[date] || null;
function ensureDay(date) {
  if (!state.days[date]) state.days[date] = { workout: null, activities: [], steps: null };
  return state.days[date];
}
function pruneDay(date) {
  const d = state.days[date];
  if (d && !d.workout && !d.activities.length && d.steps == null) delete state.days[date];
}

const sortedDates = () => Object.keys(state.days).sort();
const exById = id => state.exercises.find(e => e.id === id) || { id, name: 'Unknown exercise', muscle: '' };
const filledSets = sets => sets.filter(s => s.reps > 0);
const activityType = a => ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.other;
const activityName = a => (a.type === 'other' && a.label) ? a.label : activityType(a).name;

function isActiveDay(date) {
  const d = getDay(date);
  return !!d && ((d.workout && d.workout.exercises.length > 0) || d.activities.length > 0);
}

/* --------------------------- Calculations --------------------------- */

function lastSession(exId, beforeDate) {
  const dates = sortedDates();
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] >= beforeDate) continue;
    const w = state.days[dates[i]].workout;
    const ex = w && w.exercises.find(e => e.exId === exId && filledSets(e.sets).length);
    if (ex) return { date: dates[i], sets: filledSets(ex.sets) };
  }
  return null;
}

function bestWeightBefore(exId, beforeDate) {
  let best = null;
  for (const d of sortedDates()) {
    if (d >= beforeDate) break;
    const w = state.days[d].workout;
    if (!w) continue;
    for (const ex of w.exercises) {
      if (ex.exId !== exId) continue;
      for (const s of filledSets(ex.sets)) best = Math.max(best ?? 0, s.kg || 0);
    }
  }
  return best;
}

// Index of the set that beats your previous best weight (or -1)
function prSetIndex(ex, date) {
  const prev = bestWeightBefore(ex.exId, date);
  if (prev === null) return -1;
  let idx = -1, max = prev;
  ex.sets.forEach((s, i) => { if (s.reps > 0 && (s.kg || 0) > max) { max = s.kg; idx = i; } });
  return idx;
}

// Per-exercise settings used by suggestions and the plate calculator
const exPrefs = e => ({ repMin: e.repMin ?? 8, repMax: e.repMax ?? 12, step: e.step ?? 2.5, bar: e.bar ?? 20 });

// "Double progression": hit the top of the rep range on every set -> add weight, otherwise add a rep
function suggestion(exId, date) {
  const last = lastSession(exId, date);
  if (!last) return null;
  const p = exPrefs(exById(exId));
  const top = Math.max(...last.sets.map(s => s.kg || 0));
  const plusOne = last.sets.map(s => Math.min(p.repMax, s.reps + 1));
  if (!top) return { kg: null, reps: last.sets.map(s => s.reps + 1), text: 'Aim for one more rep on each set than last time' };
  if (last.sets.filter(s => (s.kg || 0) === top).every(s => s.reps >= p.repMax)) {
    const kg = top + p.step;
    return { kg, reps: last.sets.map(() => p.repMin), up: true, text: `You hit ${p.repMax} reps on every set. Go up to ${fmtKg(kg)} kg × ${p.repMin}` };
  }
  return { kg: top, reps: plusOne, text: `Stay at ${fmtKg(top)} kg and beat last time by one rep` };
}

// The grey hint shown in an empty box (and used when you tick ✓ without typing)
function setHint(sug, si) {
  if (!sug) return null;
  return { kg: sug.kg, reps: sug.reps[Math.min(si, sug.reps.length - 1)] };
}

function platesPerSide(total, bar) {
  let side = (total - bar) / 2;
  if (side < 0) return null;
  const plates = [];
  for (const p of PLATES) while (side >= p - 1e-9) { plates.push(p); side -= p; }
  return { plates, leftover: Math.round(side * 200) / 100 };
}

function warmupSets(work, bar) {
  const list = bar > 0 && work > bar ? [{ kg: bar, reps: 10 }] : [];
  for (const [pct, reps] of [[0.4, 8], [0.6, 5], [0.8, 3]]) {
    const kg = Math.round(work * pct / 2.5) * 2.5;
    const prev = list.length ? list[list.length - 1].kg : 0;
    if (kg > prev && kg > bar && kg < work) list.push({ kg, reps });
  }
  return list;
}

function makeSets(exId, date) {
  const last = lastSession(exId, date);
  return Array.from({ length: last ? last.sets.length : 3 }, () => ({ kg: null, reps: null, done: false }));
}

function workoutVolume(w) {
  let volume = 0, sets = 0;
  for (const ex of w.exercises) for (const s of filledSets(ex.sets)) { volume += (s.kg || 0) * s.reps; sets++; }
  return { volume, sets };
}

function activityCalories(a) {
  const i = INTENSITIES.indexOf(a.intensity);
  return Math.round(activityType(a).met[i < 0 ? 1 : i] * state.settings.bodyWeight * (a.duration || 0) / 60);
}

function activitySteps(a) {
  if (a.steps > 0) return { steps: a.steps, est: false };
  const t = activityType(a);
  if (t.stepsPerKm && a.distance > 0) return { steps: Math.round(a.distance * t.stepsPerKm), est: true };
  return { steps: 0, est: false };
}

function dayStats(date) {
  const r = { volume: 0, sets: 0, minutes: 0, calories: 0, steps: 0, stepsEst: false, activitySteps: 0, distance: 0 };
  const d = getDay(date);
  if (!d) return r;
  if (d.workout) {
    Object.assign(r, workoutVolume(d.workout));
    if (d.workout.duration) {
      r.minutes += d.workout.duration;
      r.calories += Math.round(STRENGTH_MET * state.settings.bodyWeight * d.workout.duration / 60);
    }
  }
  let est = false;
  for (const a of d.activities) {
    r.minutes += a.duration || 0;
    r.calories += activityCalories(a);
    r.distance += a.distance || 0;
    const s = activitySteps(a);
    r.activitySteps += s.steps;
    est = est || s.est;
  }
  if (d.steps > 0) r.steps = d.steps;
  else { r.steps = r.activitySteps; r.stepsEst = est; }
  return r;
}

function exerciseHistory() {
  const map = new Map();
  for (const d of sortedDates()) {
    const w = state.days[d].workout;
    if (!w) continue;
    for (const ex of w.exercises) {
      const sets = filledSets(ex.sets);
      if (!sets.length) continue;
      if (!map.has(ex.exId)) map.set(ex.exId, []);
      map.get(ex.exId).push({ date: d, sets });
    }
  }
  return map;
}

function bestSet(sessions) {
  let best = null;
  for (const s of sessions) for (const x of s.sets) {
    const kg = x.kg || 0, bkg = best ? best.kg || 0 : -1;
    if (kg > bkg || (kg === bkg && x.reps > best.reps)) best = { ...x, date: s.date };
  }
  return best;
}

function currentStreak() {
  let d = todayStr();
  if (!isActiveDay(d)) d = addDays(d, -1);
  let n = 0;
  while (isActiveDay(d)) { n++; d = addDays(d, -1); }
  return n;
}

/* ------------------------------ Charts ------------------------------ */

function lineChart(points, unit) {
  if (points.length < 2) return `<p class="muted small">Log it at least twice to see a chart.</p>`;
  const W = 320, H = 170, L = 38, R = 12, T = 22, B = 24;
  const ys = points.map(p => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const padY = (hi - lo) * 0.15;
  lo = Math.max(0, lo - padY); hi += padY;
  const x = i => L + i * (W - L - R) / (points.length - 1);
  const y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const r1 = v => Math.round(v * 10) / 10;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    <text x="${L - 6}" y="10" text-anchor="end">${esc(unit)}</text>
    ${[lo, (lo + hi) / 2, hi].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>
      <text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${r1(v)}</text>`).join('')}
    <path class="line" d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('')}"/>
    ${points.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.y)}" r="3.5"><title>${esc(p.label)}: ${r1(p.y)} ${esc(unit)}</title></circle>`).join('')}
    <text x="${L}" y="${H - 6}">${esc(points[0].label)}</text>
    <text x="${W - R}" y="${H - 6}" text-anchor="end">${esc(points[points.length - 1].label)}</text>
  </svg>`;
}

function barChart(points, maxY) {
  const W = 320, H = 150, L = 4, R = 4, T = 16, B = 22;
  const bw = (W - L - R) / points.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly chart">
    <line class="grid" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
    ${points.map((p, i) => {
      const h = maxY ? p.y / maxY * (H - T - B) : 0;
      const cx = L + i * bw + bw / 2;
      return `<rect class="bar${p.current ? ' current' : ''}" x="${cx - bw * 0.32}" y="${H - B - h}" width="${bw * 0.64}" height="${h}" rx="4"/>
        ${p.y ? `<text class="val" x="${cx}" y="${H - B - h - 4}" text-anchor="middle">${p.y}</text>` : ''}
        <text x="${cx}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>`;
    }).join('')}
  </svg>`;
}

/* ------------------------------ Views ------------------------------ */

const app = document.getElementById('app');
const tile = (value, label) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;

function render() {
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === ui.tab));
  const views = { today: renderToday, history: renderHistory, progress: renderProgress, more: renderSettings };
  app.innerHTML = views[ui.tab]();
}

/* ---------- Log (one day) ---------- */

function renderToday() {
  const date = ui.date, day = getDay(date), today = todayStr();
  let title = fmtDate(date, { weekday: 'long' });
  if (date === today) title = 'Today';
  else if (date === addDays(today, -1)) title = 'Yesterday';
  return `
    <header class="date-bar">
      <button class="icon-btn" data-action="prev-day" aria-label="Previous day">‹</button>
      <div class="date-center">
        <h1>${title}</h1>
        <div class="muted small">${fmtDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}${
          date !== today ? ` · <a href="#" data-action="go-today">Back to today</a>` : ''}</div>
      </div>
      <button class="icon-btn" data-action="next-day" aria-label="Next day">›</button>
    </header>
    ${renderSummary(date)}
    ${renderWorkout(date, day)}
    ${renderActivities(day)}
    ${renderSteps(date, day)}`;
}

function renderSummary(date) {
  const s = dayStats(date);
  return `<section class="stats" id="day-summary">
    ${tile(fmtNum(s.volume), 'kg lifted')}
    ${tile(s.sets, 'sets')}
    ${tile(s.minutes, 'active min')}
    ${tile(fmtNum(s.calories), 'kcal (est.)')}
    ${tile(fmtNum(s.steps), s.stepsEst ? 'steps (est.)' : 'steps')}
  </section>`;
}

function updateSummary() {
  const el = document.getElementById('day-summary');
  if (el) el.outerHTML = renderSummary(ui.date);
}

function renderWorkout(date, day) {
  const w = day && day.workout;
  if (!w) {
    return `<section class="card">
      <h2>💪 Weight training</h2>
      <p class="muted">No workout logged ${date === todayStr() ? 'yet today' : 'on this day'}.</p>
      <div class="btn-row">
        <button class="btn primary" data-action="start-workout">Start workout</button>
        ${state.templates.length ? `<button class="btn" data-action="choose-template">Start a routine</button>` : ''}
      </div>
    </section>`;
  }
  return `<section class="card">
    <div class="workout-head">
      <span class="emoji">💪</span>
      <input class="title-input" data-field="workout-name" value="${esc(w.name)}" placeholder="Workout name (e.g. Push day)">
    </div>
    ${w.exercises.map((ex, ei) => renderExercise(ex, ei, date)).join('')}
    <button class="btn primary" data-action="add-exercise">+ Add exercise</button>
    <div class="grid-2">
      <label class="field"><span>Duration (min)</span>
        <input type="number" inputmode="numeric" min="0" data-field="workout-duration" value="${w.duration ?? ''}" placeholder="e.g. 60"></label>
    </div>
    <label class="field"><span>Notes</span>
      <textarea rows="2" data-field="workout-notes" placeholder="How did it feel?">${esc(w.notes)}</textarea></label>
    <div class="btn-row">
      ${w.exercises.length ? `<button class="btn" data-action="save-template">Save as routine</button>` : ''}
      <button class="btn danger-ghost" data-action="delete-workout">Delete workout</button>
    </div>
  </section>`;
}

function renderExercise(ex, ei, date) {
  const info = exById(ex.exId);
  const prefs = exPrefs(info);
  const last = lastSession(ex.exId, date);
  const sug = suggestion(ex.exId, date);
  const pr = prSetIndex(ex, date);
  const rows = ex.sets.map((s, si) => {
    const hint = setHint(sug, si);
    const at = `data-ei="${ei}" data-si="${si}"`;
    return `<div class="set-row${s.done ? ' done' : ''}">
      <span class="set-no">${si === pr ? '🏆' : si + 1}</span>
      <input type="number" inputmode="decimal" step="any" min="0" data-field="set-kg" ${at} value="${s.kg ?? ''}" placeholder="${hint && hint.kg ? fmtKg(hint.kg) : 'kg'}" aria-label="Weight in kg">
      <input type="number" inputmode="numeric" step="1" min="0" data-field="set-reps" ${at} value="${s.reps ?? ''}" placeholder="${hint ? hint.reps : 'reps'}" aria-label="Reps">
      <button class="check" data-action="toggle-done" ${at} aria-label="Mark set done">✓</button>
      <button class="icon-btn small" data-action="remove-set" ${at} aria-label="Remove set">✕</button>
    </div>`;
  }).join('');
  const canFill = sug && ex.sets.some(s => !s.done && (s.kg == null || s.reps == null));
  return `<div class="exercise">
    <div class="ex-head">
      <div>
        <div class="ex-name">${esc(info.name)}</div>
        <div class="muted small">${last ? `Last time (${shortDate(last.date)}): ${last.sets.map(fmtSet).join(', ')}` : 'First time logging this one'}</div>
      </div>
      <div class="ex-tools">
        <button class="icon-btn small" data-action="exercise-settings" data-id="${esc(ex.exId)}" aria-label="Exercise settings">⚙️</button>
        <button class="icon-btn small" data-action="remove-exercise" data-ei="${ei}" aria-label="Remove exercise">🗑</button>
      </div>
    </div>
    ${sug ? `<div class="suggest${sug.up ? ' up' : ''}">
      <div><strong>${sug.up ? '⬆️' : '💡'} ${esc(sug.text)}</strong>
        <div class="muted small">Target ${prefs.repMin}–${prefs.repMax} reps ·
          <a href="#" data-action="exercise-settings" data-id="${esc(ex.exId)}">change</a></div></div>
      ${canFill ? `<button class="btn small" data-action="use-suggestion" data-ei="${ei}">Fill</button>` : ''}
    </div>` : ''}
    <div class="set-row set-head"><span>Set</span><span>kg</span><span>Reps</span><span>Done</span><span></span></div>
    ${rows}
    <div class="ex-foot">
      <button class="btn ghost small" data-action="add-set" data-ei="${ei}">+ Add set</button>
      <button class="btn ghost small" data-action="open-plates" data-ei="${ei}">🧮 Plates & warm-up</button>
    </div>
  </div>`;
}

function activityDetails(a) {
  const t = activityType(a), parts = [];
  if (a.duration) parts.push(`${a.duration} min`);
  if (a.distance) {
    parts.push(`${fmtKg(a.distance)} km`);
    if (a.duration && t.pace) parts.push(fmtPace(a.duration, a.distance));
    if (a.duration && a.type === 'cycling') parts.push(`${(a.distance / (a.duration / 60)).toFixed(1)} km/h`);
  }
  if (a.distanceM) parts.push(`${a.distanceM} m`);
  if (a.laps) parts.push(`${a.laps} laps`);
  if (a.stroke) parts.push(a.stroke.toLowerCase());
  if (a.games) parts.push(`${a.games} games`);
  if (a.format) parts.push(a.format.toLowerCase());
  if (a.rounds) parts.push(`${a.rounds} rounds`);
  if (a.elevation) parts.push(`${a.elevation} m climb`);
  if (a.style) parts.push(a.style);
  const st = activitySteps(a);
  if (st.steps) parts.push(`${fmtNum(st.steps)} steps${st.est ? ' (est.)' : ''}`);
  if (a.intensity) parts.push(a.intensity.toLowerCase());
  return parts.join(' · ');
}

function renderActivities(day) {
  const acts = day ? day.activities : [];
  return `<section class="card">
    <h2>🏃 Activities & sports</h2>
    ${acts.length ? `<div class="list">${acts.map(a => `
      <button class="activity" data-action="edit-activity" data-id="${a.id}">
        <span class="act-icon">${activityType(a).icon}</span>
        <span class="act-body">
          <span class="act-name">${esc(activityName(a))}</span>
          <span class="muted small">${esc(activityDetails(a))}</span>
        </span>
        <span class="act-cal">~${activityCalories(a)} kcal</span>
      </button>`).join('')}</div>`
      : `<p class="muted">Walks, runs, badminton, swimming, yoga…</p>`}
    <div class="btn-row"><button class="btn primary" data-action="add-activity">+ Add activity</button></div>
  </section>`;
}

function renderSteps(date, day) {
  const est = dayStats(date).activitySteps;
  return `<section class="card">
    <h2>👣 Steps</h2>
    <label class="field"><span>Total steps for the day — copy it from your phone's Health / Fit app</span>
      <input type="number" inputmode="numeric" min="0" data-field="day-steps" value="${day && day.steps != null ? day.steps : ''}"
        placeholder="${est ? `${fmtNum(est)} estimated from activities` : 'e.g. 8000'}"></label>
  </section>`;
}

/* ---------- History ---------- */

function renderHistory() {
  const [y, m] = ui.calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = todayStr();
  let cells = '<span></span>'.repeat(offset), activeDays = 0, workouts = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const ds = `${y}-${pad(m)}-${pad(i)}`, d = getDay(ds);
    const hasW = !!(d && d.workout && d.workout.exercises.length), hasA = !!(d && d.activities.length);
    if (hasW || hasA) activeDays++;
    if (hasW) workouts++;
    cells += `<button class="cal-day${ds === today ? ' today' : ''}${hasW || hasA ? ' active' : ''}" data-action="open-day" data-date="${ds}">
      <span>${i}</span><span class="dots">${hasW ? '<i class="dot dot-w"></i>' : ''}${hasA ? '<i class="dot dot-a"></i>' : ''}</span></button>`;
  }
  const monthShort = first.toLocaleDateString(undefined, { month: 'short' });
  const recent = sortedDates().filter(isActiveDay).reverse().slice(0, 20);

  return `<header class="page-head"><h1>History</h1></header>
    <section class="stats">
      ${tile(`${currentStreak()} 🔥`, 'day streak')}
      ${tile(activeDays, `active days in ${monthShort}`)}
      ${tile(workouts, `workouts in ${monthShort}`)}
    </section>
    <section class="card">
      <div class="cal-head">
        <button class="icon-btn" data-action="cal-move" data-delta="-1" aria-label="Previous month">‹</button>
        <h2>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button class="icon-btn" data-action="cal-move" data-delta="1" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid">
        ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="cal-dow">${d}</span>`).join('')}
        ${cells}
      </div>
      <div class="legend"><span><i class="dot dot-w"></i>Weights</span><span><i class="dot dot-a"></i>Activity / sport</span></div>
    </section>
    <section class="card">
      <h2>Recent</h2>
      ${recent.length ? `<div class="list">${recent.map(renderRecentDay).join('')}</div>`
        : `<p class="muted">Nothing logged yet. Your workouts will show up here.</p>`}
    </section>`;
}

function renderRecentDay(date) {
  const d = getDay(date), w = d.workout;
  const lines = [];
  if (w && w.exercises.length) {
    lines.push(`<div>💪 <strong>${esc(w.name || 'Workout')}</strong> · ${fmtNum(workoutVolume(w).volume)} kg</div>
      <div class="muted small">${esc(w.exercises.map(e => exById(e.exId).name).join(', '))}</div>`);
  }
  for (const a of d.activities) lines.push(`<div>${activityType(a).icon} ${esc(activityName(a))} · ${a.duration || 0} min</div>`);
  return `<button class="recent-item" data-action="open-day" data-date="${date}">
    <span class="recent-date"><strong>${parseYmd(date).getDate()}</strong><span>${fmtDate(date, { month: 'short' })}</span></span>
    <span class="recent-body">${lines.join('')}</span>
  </button>`;
}

/* ---------- Progress ---------- */

function renderProgress() {
  return `<header class="page-head"><h1>Progress</h1></header>
    ${renderWeekly()}
    ${renderExerciseProgress()}
    ${renderCardioProgress()}
    ${renderBests()}`;
}

function renderWeekly() {
  const thisWeek = weekStart(todayStr());
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i);
    let days = 0;
    for (let j = 0; j < 7; j++) if (isActiveDay(addDays(start, j))) days++;
    weeks.push({ label: shortDate(start), y: days, current: i === 0 });
  }
  const t = { workouts: 0, activities: 0, minutes: 0, calories: 0, distance: 0, volume: 0 };
  for (let j = 0; j < 7; j++) {
    const date = addDays(thisWeek, j), d = getDay(date);
    if (!d) continue;
    const s = dayStats(date);
    if (d.workout && d.workout.exercises.length) t.workouts++;
    t.activities += d.activities.length;
    t.minutes += s.minutes; t.calories += s.calories; t.distance += s.distance; t.volume += s.volume;
  }
  return `<section class="card">
    <h2>📊 This week</h2>
    <div class="stats">
      ${tile(t.workouts, 'workouts')}
      ${tile(t.activities, 'activities')}
      ${tile(t.minutes, 'active min')}
      ${tile(fmtNum(t.volume), 'kg lifted')}
      ${tile(fmtKg(Math.round(t.distance * 10) / 10), 'km covered')}
      ${tile(fmtNum(t.calories), 'kcal (est.)')}
    </div>
    <h3>Active days per week</h3>
    ${barChart(weeks, 7)}
  </section>`;
}

function renderExerciseProgress() {
  const hist = exerciseHistory();
  if (!hist.size) {
    return `<section class="card"><h2>🏋️ Exercise progress</h2>
      <p class="muted">Log a few workouts and your strength charts will appear here.</p></section>`;
  }
  const lastDate = id => hist.get(id)[hist.get(id).length - 1].date;
  const ids = [...hist.keys()].sort((a, b) => lastDate(b).localeCompare(lastDate(a)));
  if (!hist.has(ui.progressEx)) ui.progressEx = ids[0];
  const sessions = hist.get(ui.progressEx);
  const bodyweight = sessions.every(s => s.sets.every(x => !x.kg));
  const points = sessions.slice(-20).map(s => ({
    label: shortDate(s.date),
    y: Math.max(...s.sets.map(x => bodyweight ? x.reps : x.kg || 0)),
  }));
  const best = bestSet(sessions);
  let oneRm = 0;
  for (const s of sessions) for (const x of s.sets) if (x.kg) oneRm = Math.max(oneRm, x.kg * (1 + x.reps / 30));

  return `<section class="card">
    <h2>🏋️ Exercise progress</h2>
    <select class="full" data-field="progress-ex">
      ${ids.map(id => `<option value="${esc(id)}"${id === ui.progressEx ? ' selected' : ''}>${esc(exById(id).name)}</option>`).join('')}
    </select>
    <h3>${bodyweight ? 'Most reps in a set' : 'Heaviest set'} each session</h3>
    ${lineChart(points, bodyweight ? 'reps' : 'kg')}
    <div class="stats">
      ${tile(fmtSet(best), 'best set')}
      ${oneRm ? tile(`${fmtKg(Math.round(oneRm * 2) / 2)} kg`, 'est. 1-rep max') : ''}
      ${tile(sessions.length, 'sessions')}
    </div>
    <h3>Recent sessions</h3>
    <ul class="session-list">
      ${sessions.slice(-5).reverse().map(s => `<li><span>${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <span>${s.sets.map(fmtSet).join(', ')}</span></li>`).join('')}
    </ul>
  </section>`;
}

function renderCardioProgress() {
  const byType = {};
  for (const date of sortedDates()) for (const a of state.days[date].activities) (byType[a.type] ||= []).push({ date, a });
  const types = Object.keys(byType).sort((x, y) => byType[y].length - byType[x].length);
  if (!types.length) return '';
  if (!byType[ui.progressCardio]) ui.progressCardio = types[0];
  const list = byType[ui.progressCardio];
  const useDistance = list.filter(x => x.a.distance > 0).length >= 2;
  const points = list.filter(x => useDistance ? x.a.distance > 0 : x.a.duration > 0).slice(-20)
    .map(x => ({ label: shortDate(x.date), y: useDistance ? x.a.distance : x.a.duration }));
  const minutes = list.reduce((n, x) => n + (x.a.duration || 0), 0);
  const km = list.reduce((n, x) => n + (x.a.distance || 0), 0);
  const kcal = list.reduce((n, x) => n + activityCalories(x.a), 0);

  return `<section class="card">
    <h2>🏃 Activity progress</h2>
    <select class="full" data-field="progress-cardio">
      ${types.map(t => `<option value="${t}"${t === ui.progressCardio ? ' selected' : ''}>${ACTIVITY_TYPES[t]?.icon || ''} ${esc(ACTIVITY_TYPES[t]?.name || t)}</option>`).join('')}
    </select>
    <h3>${useDistance ? 'Distance' : 'Duration'} each session</h3>
    ${lineChart(points, useDistance ? 'km' : 'min')}
    <div class="stats">
      ${tile(list.length, 'sessions')}
      ${tile(fmtNum(minutes), 'total min')}
      ${km ? tile(fmtKg(Math.round(km * 10) / 10), 'total km') : ''}
      ${tile(fmtNum(kcal), 'kcal (est.)')}
    </div>
  </section>`;
}

function renderBests() {
  const hist = exerciseHistory();
  if (!hist.size) return '';
  const rows = [...hist].map(([id, sessions]) => ({ name: exById(id).name, best: bestSet(sessions) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return `<section class="card">
    <h2>🏆 Personal bests</h2>
    <ul class="session-list">
      ${rows.map(r => `<li><span>${esc(r.name)}</span>
        <span><strong>${fmtSet(r.best)}</strong> <span class="muted small">${shortDate(r.best.date)}</span></span></li>`).join('')}
    </ul>
  </section>`;
}

/* ---------- Settings ---------- */

function renderSettings() {
  const custom = state.exercises.filter(e => e.custom);
  return `<header class="page-head"><h1>Settings</h1></header>
    <section class="card">
      <h2>⚙️ Preferences</h2>
      <div class="grid-2">
        <label class="field"><span>Your body weight (kg)</span>
          <input type="number" inputmode="decimal" step="any" min="1" data-field="setting-bw" value="${state.settings.bodyWeight}"></label>
        <label class="field"><span>Rest timer (seconds)</span>
          <input type="number" inputmode="numeric" min="5" data-field="setting-rest" value="${state.settings.restSeconds}"></label>
      </div>
      <p class="muted small">Body weight is used to estimate calories. The rest timer starts when you tick a set as done.</p>
    </section>

    <section class="card">
      <h2>📋 Routines</h2>
      ${state.templates.length ? `<ul class="session-list">${state.templates.map(t => `<li>
        <span><strong>${esc(t.name)}</strong><br><span class="muted small">${esc(t.exIds.map(id => exById(id).name).join(', '))}</span></span>
        <button class="icon-btn small" data-action="delete-template" data-id="${t.id}" aria-label="Delete routine">✕</button></li>`).join('')}</ul>`
        : `<p class="muted small">No routines yet. Log a workout, then tap “Save as routine” to reuse it next time.</p>`}
    </section>

    <section class="card">
      <h2>✏️ Your custom exercises</h2>
      ${custom.length ? `<ul class="session-list">${custom.map(e => `<li>
        <span>${esc(e.name)} <span class="muted small">${esc(e.muscle)}</span></span>
        <button class="icon-btn small" data-action="delete-exercise" data-id="${e.id}" aria-label="Delete exercise">✕</button></li>`).join('')}</ul>`
        : `<p class="muted small">None yet. You can create one from the “Add exercise” screen.</p>`}
    </section>

    <section class="card">
      <h2>💾 Backup</h2>
      <p class="muted small">Your data is stored only in this browser on this device. Download a backup now and then — you can also use it to move your data to another device.</p>
      <div class="btn-row">
        <button class="btn primary" data-action="export">Download backup</button>
        <label class="btn" for="import-file">Restore backup</label>
        <input type="file" id="import-file" accept=".json,application/json" hidden>
      </div>
    </section>

    <section class="card">
      <h2>ℹ️ How estimates work</h2>
      <p class="muted small"><strong>Steps:</strong> websites can't read your phone's step counter, so type the day's total from your phone's Health / Fit app. If you leave it blank, steps are estimated from walks (~1,300/km), runs (~1,000/km) and hikes (~1,400/km).</p>
      <p class="muted small"><strong>Calories:</strong> estimated from the activity, its intensity, its duration and your body weight (standard MET formula). Treat them as a rough guide.</p>
    </section>

    <section class="card">
      <h2>Danger zone</h2>
      <button class="btn danger" data-action="reset">Erase all data</button>
    </section>`;
}

/* ------------------------------ Modals ------------------------------ */

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');

function openModal(html) {
  modalBody.innerHTML = html;
  modal.classList.remove('hidden');
  modal.querySelector('.modal-sheet').scrollTop = 0;
  document.body.classList.add('no-scroll');
}

function closeModal() {
  modal.classList.add('hidden');
  modalBody.innerHTML = '';
  document.body.classList.remove('no-scroll');
}

function recentExerciseIds(limit) {
  const ids = [];
  for (const d of sortedDates().reverse()) {
    const w = state.days[d].workout;
    if (!w) continue;
    for (const ex of w.exercises) if (!ids.includes(ex.exId)) ids.push(ex.exId);
    if (ids.length >= limit) break;
  }
  return ids.slice(0, limit);
}

const pickItem = (e, sub) => `<button class="pick-item" data-action="pick-exercise" data-id="${esc(e.id)}" data-name="${esc(e.name.toLowerCase())}">
  <span>${esc(e.name)}</span><span class="muted small">${esc(sub)}</span></button>`;

// Step 1: search, recent shortcuts, and muscle group cards
function openExercisePicker() {
  const recent = recentExerciseIds(6);
  openModal(`
    <h2>Add exercise</h2>
    <input type="search" class="search" placeholder="Search all exercises…" data-field="ex-search" autocomplete="off">
    <div id="picker-browse">
      ${recent.length ? `<h3>Recent</h3><div class="chips">${recent.map(id =>
        `<button class="chip" data-action="pick-exercise" data-id="${esc(id)}">${esc(exById(id).name)}</button>`).join('')}</div>` : ''}
      <h3>Pick a muscle group</h3>
      <div class="muscle-grid">
        ${MUSCLES.map(m => `<button class="type-btn" data-action="pick-muscle" data-muscle="${esc(m)}">
          <span class="type-icon">${MUSCLE_ICONS[m]}</span><span>${esc(m)}</span></button>`).join('')}
      </div>
    </div>
    <div id="picker-results" class="pick-list" hidden>
      ${state.exercises.map(e => pickItem(e, e.muscle)).join('')}
      <p id="picker-empty" class="muted small" hidden>No match. Open a muscle group and tap “+ New exercise” to create it.</p>
    </div>`);
}

// Step 2: the exercises for one muscle group
function openMuscleList(muscle) {
  const list = state.exercises.filter(e => e.muscle === muscle);
  const lastText = e => { const l = lastSession(e.id, ui.date); return l ? `last: ${fmtSet(l.sets[0])}` : ''; };
  openModal(`
    <div class="sheet-head">
      <button class="icon-btn" data-action="add-exercise" aria-label="Back to muscle groups">‹</button>
      <h2>${MUSCLE_ICONS[muscle]} ${esc(muscle)}</h2>
    </div>
    <details class="custom-ex">
      <summary>+ New ${esc(muscle.toLowerCase())} exercise</summary>
      <form id="exercise-form" class="new-ex-form">
        <input type="hidden" name="muscle" value="${esc(muscle)}">
        <input name="name" class="search" required placeholder="Exercise name" autocomplete="off">
        <button class="btn primary" type="submit">Add</button>
      </form>
    </details>
    <div class="pick-list">${list.map(e => pickItem(e, lastText(e))).join('')}</div>`);
}

function filterExercises(q) {
  q = q.trim().toLowerCase();
  const results = document.getElementById('picker-results');
  document.getElementById('picker-browse').hidden = !!q;
  results.hidden = !q;
  let any = false;
  results.querySelectorAll('.pick-item').forEach(it => {
    it.hidden = !it.dataset.name.includes(q);
    any = any || !it.hidden;
  });
  document.getElementById('picker-empty').hidden = any;
}

function formField(f, value) {
  const v = value ?? '';
  let input;
  if (f.type === 'select') {
    input = `<select name="${f.key}">${f.required ? '' : '<option value="">—</option>'}
      ${f.options.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'text') {
    input = `<input type="text" name="${f.key}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}">`;
  } else {
    input = `<input type="number" name="${f.key}" inputmode="decimal" step="any" min="0" value="${esc(v)}"
      placeholder="${esc(f.placeholder || '')}"${f.required ? ' required' : ''}>`;
  }
  return `<label class="field${f.wide ? ' wide' : ''}"><span>${esc(f.label)}</span>${input}</label>`;
}

function openActivityPicker() {
  openModal(`<h2>Add activity</h2>
    <div class="type-grid">
      ${Object.entries(ACTIVITY_TYPES).map(([key, t]) => `<button class="type-btn" data-action="pick-activity-type" data-type="${key}">
        <span class="type-icon">${t.icon}</span><span>${t.name}</span></button>`).join('')}
    </div>`);
}

function openActivityForm(type, existing) {
  const t = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.other;
  const v = existing || { intensity: 'Moderate' };
  openModal(`<h2>${t.icon} ${existing ? 'Edit' : 'Add'} ${t.name}</h2>
    <form id="activity-form" data-type="${type}" data-id="${existing ? existing.id : ''}">
      <div class="grid-2">
        ${t.fields.includes('label') ? formField({ key: 'label', ...FIELD_DEFS.label }, v.label) : ''}
        ${formField({ key: 'duration', label: 'Duration (min)', type: 'number', required: true, placeholder: 'e.g. 45' }, v.duration)}
        ${formField({ key: 'intensity', label: 'Intensity', type: 'select', options: INTENSITIES, required: true }, v.intensity)}
        ${t.fields.filter(k => k !== 'label').map(k => formField({ key: k, ...FIELD_DEFS[k] }, v[k])).join('')}
      </div>
      <label class="field"><span>Notes</span><textarea name="notes" rows="2">${esc(v.notes)}</textarea></label>
      <div class="btn-row">
        <button type="submit" class="btn primary">Save</button>
        ${existing ? `<button type="button" class="btn danger-ghost" data-action="delete-activity" data-id="${existing.id}">Delete</button>` : ''}
      </div>
    </form>`);
}

function saveActivityForm(form) {
  const type = form.dataset.type, t = ACTIVITY_TYPES[type];
  const fd = new FormData(form);
  const a = { id: form.dataset.id || uid(), type, duration: num(fd.get('duration')), intensity: fd.get('intensity') };
  for (const k of t.fields) {
    const raw = fd.get(k);
    a[k] = FIELD_DEFS[k].type === 'number' ? num(raw) : (String(raw || '').trim() || null);
  }
  a.notes = String(fd.get('notes') || '').trim();
  const day = ensureDay(ui.date);
  const i = day.activities.findIndex(x => x.id === a.id);
  if (i >= 0) day.activities[i] = a; else day.activities.push(a);
  save(); closeModal(); render();
  toast(`${t.icon} ${activityName(a)} saved`);
}

function createExercise(form) {
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  let ex = state.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (!ex) {
    ex = { id: `c-${uid()}`, name, muscle: fd.get('muscle'), custom: true };
    state.exercises.push(ex);
  }
  addExerciseToWorkout(ex.id);
}

function addExerciseToWorkout(exId) {
  const w = ensureDay(ui.date).workout;
  w.exercises.push({ exId, sets: makeSets(exId, ui.date) });
  save(); closeModal(); render();
  const cards = app.querySelectorAll('.exercise');
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function newWorkout(name, exIds) {
  ensureDay(ui.date).workout = {
    name, duration: null, notes: '',
    exercises: exIds.map(exId => ({ exId, sets: makeSets(exId, ui.date) })),
  };
  save();
}

function openExerciseSettings(exId) {
  const p = exPrefs(exById(exId));
  openModal(`<h2>⚙️ ${esc(exById(exId).name)}</h2>
    <p class="muted small">Used for suggestions: once you reach the top of the rep range on every set, the app tells you to add weight.</p>
    <form id="ex-settings-form" data-id="${esc(exId)}" class="grid-2">
      ${formField({ key: 'repMin', label: 'Reps from', type: 'number', required: true }, p.repMin)}
      ${formField({ key: 'repMax', label: 'Reps up to', type: 'number', required: true }, p.repMax)}
      ${formField({ key: 'step', label: 'Add weight in steps of (kg)', type: 'number', required: true, wide: true }, p.step)}
      <div class="btn-row wide"><button class="btn primary" type="submit">Save</button></div>
    </form>`);
}

function saveExerciseSettings(form) {
  const fd = new FormData(form);
  const repMin = Math.round(num(fd.get('repMin'))), repMax = Math.round(num(fd.get('repMax'))), step = num(fd.get('step'));
  if (!(repMin > 0 && repMax >= repMin && step > 0)) { toast('Check the numbers: “from” must be ≤ “up to”'); return; }
  const ex = state.exercises.find(e => e.id === form.dataset.id);
  if (ex) Object.assign(ex, { repMin, repMax, step });
  save(); closeModal(); render();
}

let plateExId = null;

function openPlateCalc(ei) {
  const ex = currentWorkout().exercises[ei];
  const sug = suggestion(ex.exId, ui.date);
  const weight = Math.max(0, ...ex.sets.map(s => s.kg || 0)) || (sug && sug.kg) || '';
  plateExId = ex.exId;
  openModal(`<h2>🧮 ${esc(exById(ex.exId).name)}</h2>
    <label class="field"><span>Working weight (kg)</span>
      <input type="number" inputmode="decimal" step="any" min="0" data-field="plate-weight" value="${weight}" placeholder="e.g. 80"></label>
    <div class="field"><span>Bar</span><div class="chips" id="bar-chips">${renderBarChips()}</div></div>
    <div id="plate-result">${renderPlateResult(num(weight))}</div>`);
}

function renderBarChips() {
  const bar = exPrefs(exById(plateExId)).bar;
  return BARS.map(b => `<button class="chip${b === bar ? ' active' : ''}" data-action="plate-bar" data-bar="${b}">${b ? `${b} kg bar` : 'No bar'}</button>`).join('');
}

const plateText = (kg, bar) => {
  const r = platesPerSide(kg, bar);
  if (!r || !r.plates.length) return bar ? 'empty bar' : '';
  return `${r.plates.map(fmtKg).join(' + ')} per side`;
};

function renderPlateResult(weight) {
  if (!(weight > 0)) return `<p class="muted">Enter a weight to see which plates to load.</p>`;
  const bar = exPrefs(exById(plateExId)).bar;
  const r = platesPerSide(weight, bar);
  if (!r) return `<p class="muted">That's lighter than the bar (${bar} kg).</p>`;
  const warm = warmupSets(weight, bar);
  return `<h3>Load on each side</h3>
    ${r.plates.length ? `<div class="barbell"><span class="sleeve"></span>${r.plates.map(p =>
      `<span class="plate" style="background:${PLATE_STYLE[p][0]};height:${PLATE_STYLE[p][1]}px" title="${p} kg"></span>`).join('')}</div>
      <p class="plate-text"><strong>${r.plates.map(fmtKg).join(' + ')} kg</strong> on each side</p>`
      : `<p>${bar ? 'Just the empty bar.' : 'No plates needed.'}</p>`}
    ${r.leftover ? `<p class="muted small">Can't make exactly ${fmtKg(weight)} kg with standard plates. This loads ${fmtKg(weight - r.leftover)} kg.</p>` : ''}
    <h3>Warm-up sets</h3>
    ${warm.length ? `<ul class="session-list">${warm.map(s => `<li><span><strong>${fmtKg(s.kg)} kg</strong> × ${s.reps}</span>
      <span class="muted small">${plateText(s.kg, bar)}</span></li>`).join('')}</ul>`
      : `<p class="muted small">This weight is light enough to skip warm-ups.</p>`}`;
}

/* ------------------------------ Rest timer ------------------------------ */

const timerEl = document.getElementById('timer');
const timerText = document.getElementById('timer-text');
let timer = null, audioCtx = null;

function startTimer(seconds) {
  stopTimer();
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) { /* no sound */ }
  timer = { end: Date.now() + seconds * 1000, interval: setInterval(tickTimer, 250), hide: null };
  timerEl.classList.remove('hidden', 'finished');
  tickTimer();
}

function tickTimer() {
  if (!timer || !timer.interval) return;
  const left = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
  timerText.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
  if (left > 0) return;
  clearInterval(timer.interval);
  timer.interval = null;
  timerEl.classList.add('finished');
  timerText.textContent = 'Go! 💪';
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  beep();
  timer.hide = setTimeout(stopTimer, 4000);
}

function stopTimer() {
  if (timer) { clearInterval(timer.interval); clearTimeout(timer.hide); }
  timer = null;
  timerEl.classList.add('hidden');
}

function beep() {
  try {
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) { /* no sound */ }
}

/* ------------------------------ Toast ------------------------------ */

let toastTimeout;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ------------------------------ Backup ------------------------------ */

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = normalizeState(JSON.parse(reader.result)); }
    catch (e) { alert("That file isn't a valid backup."); return; }
    const n = Object.keys(data.days).length;
    if (!confirm(`Restore this backup (${n} days of data)? It will replace everything currently on this device.`)) return;
    state = data;
    save(); render();
    toast('✅ Backup restored');
  };
  reader.readAsText(file);
}

/* ------------------------------ Actions ------------------------------ */

const currentWorkout = () => getDay(ui.date).workout;

const actions = {
  'nav'({ tab }) {
    ui.tab = tab;
    if (tab === 'history') ui.calMonth = ui.date.slice(0, 7);
    render(); window.scrollTo(0, 0);
  },
  'prev-day'() { ui.date = addDays(ui.date, -1); render(); },
  'next-day'() { ui.date = addDays(ui.date, 1); render(); },
  'go-today'() { ui.date = todayStr(); render(); },
  'open-day'({ date }) { ui.date = date; ui.tab = 'today'; render(); window.scrollTo(0, 0); },
  'cal-move'({ delta }) {
    const [y, m] = ui.calMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + Number(delta), 1);
    ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    render();
  },

  'start-workout'() { newWorkout('', []); render(); openExercisePicker(); },
  'choose-template'() {
    openModal(`<h2>Start a routine</h2><div class="list">
      ${state.templates.map(t => `<button class="activity" data-action="start-template" data-id="${t.id}">
        <span class="act-icon">📋</span>
        <span class="act-body"><span class="act-name">${esc(t.name)}</span>
          <span class="muted small">${esc(t.exIds.map(id => exById(id).name).join(', '))}</span></span>
      </button>`).join('')}</div>`);
  },
  'start-template'({ id }) {
    const t = state.templates.find(x => x.id === id);
    if (!t) return;
    newWorkout(t.name, t.exIds);
    closeModal(); render();
  },
  'save-template'() {
    const w = currentWorkout();
    const name = (prompt('Name this routine (e.g. Push day, Leg day):', w.name || '') || '').trim();
    if (!name) return;
    const exIds = w.exercises.map(e => e.exId);
    const existing = state.templates.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!confirm(`A routine called "${existing.name}" already exists. Replace it?`)) return;
      existing.exIds = exIds;
    } else {
      state.templates.push({ id: uid(), name, exIds });
    }
    if (!w.name) w.name = name;
    save(); render();
    toast('📋 Routine saved');
  },
  'delete-workout'() {
    if (!confirm('Delete this whole workout?')) return;
    getDay(ui.date).workout = null;
    pruneDay(ui.date); save(); render();
  },

  'add-exercise'() { openExercisePicker(); },
  'pick-muscle'({ muscle }) { openMuscleList(muscle); },
  'pick-exercise'({ id }) { addExerciseToWorkout(id); },
  'remove-exercise'({ ei }) {
    const w = currentWorkout();
    if (!confirm(`Remove ${exById(w.exercises[ei].exId).name} from this workout?`)) return;
    w.exercises.splice(ei, 1);
    save(); render();
  },
  'add-set'({ ei }) {
    const sets = currentWorkout().exercises[ei].sets;
    const prev = sets[sets.length - 1];
    sets.push({ kg: prev ? prev.kg : null, reps: prev ? prev.reps : null, done: false });
    save(); render();
  },
  'remove-set'({ ei, si }) {
    currentWorkout().exercises[ei].sets.splice(si, 1);
    save(); render();
  },
  'toggle-done'({ ei, si }) {
    const ex = currentWorkout().exercises[ei], s = ex.sets[si];
    if (s.done) { s.done = false; save(); render(); return; }
    // Empty boxes? Use the grey hint (today's suggestion).
    const hint = setHint(suggestion(ex.exId, ui.date), Number(si));
    if (hint) {
      if (s.kg == null) s.kg = hint.kg;
      if (s.reps == null) s.reps = hint.reps;
    }
    if (!(s.reps > 0)) { toast('Enter your reps first'); return; }
    s.done = true;
    const isPR = prSetIndex(ex, ui.date) === Number(si);
    save(); render();
    startTimer(state.settings.restSeconds);
    if (isPR) toast('🏆 New personal record!');
  },

  'use-suggestion'({ ei }) {
    const ex = currentWorkout().exercises[ei], sug = suggestion(ex.exId, ui.date);
    ex.sets.forEach((s, si) => {
      if (s.done) return;
      const hint = setHint(sug, si);
      if (s.kg == null) s.kg = hint.kg;
      if (s.reps == null) s.reps = hint.reps;
    });
    save(); render();
  },
  'exercise-settings'({ id }) { openExerciseSettings(id); },
  'open-plates'({ ei }) { openPlateCalc(ei); },
  'plate-bar'({ bar }) {
    const ex = state.exercises.find(e => e.id === plateExId);
    if (ex) { ex.bar = Number(bar); save(); }
    document.getElementById('bar-chips').innerHTML = renderBarChips();
    document.getElementById('plate-result').innerHTML = renderPlateResult(num(modalBody.querySelector('[data-field="plate-weight"]').value));
  },

  'add-activity'() { openActivityPicker(); },
  'pick-activity-type'({ type }) { openActivityForm(type, null); },
  'edit-activity'({ id }) {
    const a = getDay(ui.date).activities.find(x => x.id === id);
    if (a) openActivityForm(a.type, a);
  },
  'delete-activity'({ id }) {
    if (!confirm('Delete this activity?')) return;
    const day = getDay(ui.date);
    day.activities = day.activities.filter(x => x.id !== id);
    pruneDay(ui.date); save(); closeModal(); render();
  },

  'delete-template'({ id }) {
    const t = state.templates.find(x => x.id === id);
    if (!t || !confirm(`Delete routine "${t.name}"?`)) return;
    state.templates = state.templates.filter(x => x.id !== id);
    save(); render();
  },
  'delete-exercise'({ id }) {
    const used = Object.values(state.days).some(d => d.workout && d.workout.exercises.some(e => e.exId === id));
    if (used) { alert("This exercise is used in your workout history, so it can't be deleted."); return; }
    if (!confirm(`Delete "${exById(id).name}"?`)) return;
    state.exercises = state.exercises.filter(e => e.id !== id);
    state.templates.forEach(t => { t.exIds = t.exIds.filter(x => x !== id); });
    save(); render();
  },
  'export'() { exportData(); },
  'reset'() {
    if (!confirm('Erase ALL your workouts, activities and settings? This cannot be undone.\n\nTip: download a backup first.')) return;
    state = defaultState();
    save(); render();
    toast('All data erased');
  },

  'modal-close'() { closeModal(); },
  'timer-add'() { if (timer && timer.interval) { timer.end += 30000; tickTimer(); } },
  'timer-skip'() { stopTimer(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.tagName === 'A') e.preventDefault();
  const fn = actions[el.dataset.action];
  if (fn) fn({ ...el.dataset });
});

// Typing in boxes: save straight away, without redrawing (so the keyboard stays open)
document.addEventListener('input', e => {
  const t = e.target, f = t.dataset.field;
  if (!f) return;
  const w = getDay(ui.date) && getDay(ui.date).workout;
  switch (f) {
    case 'set-kg':
    case 'set-reps':
      w.exercises[t.dataset.ei].sets[t.dataset.si][f === 'set-kg' ? 'kg' : 'reps'] = num(t.value);
      break;
    case 'workout-name': w.name = t.value; break;
    case 'workout-duration': w.duration = num(t.value); break;
    case 'workout-notes': w.notes = t.value; break;
    case 'day-steps': ensureDay(ui.date).steps = num(t.value); pruneDay(ui.date); break;
    case 'setting-bw': if (num(t.value) > 0) state.settings.bodyWeight = num(t.value); break;
    case 'setting-rest': if (num(t.value) > 0) state.settings.restSeconds = num(t.value); break;
    case 'ex-search': filterExercises(t.value); return;
    case 'plate-weight': document.getElementById('plate-result').innerHTML = renderPlateResult(num(t.value)); return;
    default: return;
  }
  save();
  if (ui.tab === 'today') updateSummary();
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.field === 'progress-ex') { ui.progressEx = t.value; render(); }
  if (t.dataset.field === 'progress-cardio') { ui.progressCardio = t.value; render(); }
  if (t.id === 'import-file' && t.files[0]) { importData(t.files[0]); t.value = ''; }
});

document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'activity-form') saveActivityForm(e.target);
  if (e.target.id === 'exercise-form') createExercise(e.target);
  if (e.target.id === 'ex-settings-form') saveExerciseSettings(e.target);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

/* ------------------------------ Start ------------------------------ */

render();

// Ask the browser not to clear our data when storage is low
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Offline support (works on https or localhost)
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
