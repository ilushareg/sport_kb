const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../loop-and-bell.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// A small DOM/timer harness exercises the actual inline application script.
// This is not a browser layout or accessibility test.
function loadApp({ reduced = false, date = '2026-10-05T09:00:00Z', random } = {}) {
  let now = new Date(date).getTime(), id = 0;
  const intervals = new Map(), elements = new Map();
  class Element {
    constructor(name = '') { this.name = name; this.innerHTML = ''; this.textContent = ''; this.listeners = {}; this.attrs = {}; this.isConnected = true; this.children = new Map(); }
    classList = { toggle() {} };
    addEventListener(type, fn) { this.listeners[type] = fn; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    removeAttribute(k) { delete this.attrs[k]; }
    querySelector(selector) {
      if (!this.children.has(selector)) this.children.set(selector, new Element(selector));
      return this.children.get(selector);
    }
    querySelectorAll() { return [this.querySelector('first'), this.querySelector('last')]; }
    focus() { document.activeElement = this; }
    closest() { return this; }
  }
  const document = {
    getElementById(name) { if (!elements.has(name)) elements.set(name, new Element(name)); return elements.get(name); },
    addEventListener() {}, activeElement: new Element('body'), visibilityState: 'visible'
  };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const context = vm.createContext({
    document, window: { matchMedia: () => ({ matches: reduced }) }, navigator: {},
    localStorage: { getItem: () => 'false', setItem() {} }, Date: ClockDate,
    performance: { now: () => now },
    setInterval(fn) { const n = ++id; intervals.set(n, fn); return n; },
    clearInterval(n) { intervals.delete(n); },
    requestAnimationFrame() { return ++id; }, cancelAnimationFrame() {},
    Math: Object.assign(Object.create(Math), random ? { random } : {})
  });
  vm.runInContext(script.replace(/\}\)\(\);\s*$/, `globalThis.api={EX,POSES,PROGRAM,state,els,createWarmup,buildSteps,startSession,beginWorkStep,pauseTimer,exitSession,renderSessionStep,renderDay,renderHome,show,openPreview,closePreview,movementGuide,figureSVG,PREP_SECONDS,get timer(){return activeTimer;}};})();`), context);
  return {
    app: context.api, elements,
    advance(ms) { now += ms; for (const fn of [...intervals.values()]) fn(); },
    now: () => now,
    action(action, attrs = {}) {
      const target = new Element(); target.attrs = { 'data-action': action, ...attrs };
      document.getElementById('app').listeners.click({ target });
    }
  };
}

test('all 31 original exercises and 15 warmup options have complete instructions and phases', () => {
  const { app } = loadApp();
  assert.equal(Object.keys(app.EX).length, 46);
  for (const [id, meta] of Object.entries(app.EX)) {
    for (const field of ['cue', 'setup', 'move', 'breathe', 'avoid', 'easier']) assert.ok(meta[field]?.length > 15, `${id}: ${field}`);
    assert.equal(meta.phases.length, app.POSES[meta.illus].length, id);
    for (const [i, phase] of meta.phases.entries()) {
      const pose = app.POSES[meta.illus][i];
      assert.ok(pose[phase[2]], `${id}: checkpoint exists`);
      for (const joint of ['h', 's', 'e', 'a', 'p', 'k', 'f', 'e2', 'a2', 'k2', 'f2']) {
        assert.ok(pose[joint].every(Number.isFinite), `${id}: finite ${joint}`);
      }
      const svg = app.figureSVG(pose, meta.illus, phase[2], meta.name);
      assert.match(svg, /role="img"/);
      assert.match(svg, /focus-ring/);
      assert.doesNotMatch(svg, /NaN|undefined/);
    }
  }
});

test('exercise variants have their own keyframes and every scheduled exercise resolves', () => {
  const { app } = loadApp();
  for (const [variant, base] of [['shouldertap', 'plank'], ['reachunder', 'sideplank'], ['glutemarch', 'hipthrust'], ['clamshell', 'sideraise'], ['calfraisesl', 'calfraise']]) {
    assert.notEqual(app.EX[variant].illus, app.EX[base].illus);
    assert.notDeepEqual(app.POSES[app.EX[variant].illus], app.POSES[app.EX[base].illus]);
  }
  for (const week of ['A', 'B']) for (const day of app.PROGRAM[week]) for (const item of day.ex) assert.ok(app.EX[item.id]);
});

test('random sessions are balanced, unique, varied, and exactly 15 minutes', () => {
  const { app } = loadApp();
  const sets = new Set();
  let previous;
  const groups = [['shoulderroll', 'armreach', 'wallslide'], ['sidereach', 'chestopener', 'trunkturn'], ['anklerock', 'hiphinge', 'heeltoe']];
  for (let n = 0; n < 200; n++) {
    const d = app.createWarmup(), ids = Array.from(d.ex, x => x.id), dynamic = ids.slice(3, 9);
    assert.equal(ids.length, 12);
    assert.equal(new Set(ids).size, 12);
    assert.deepEqual(ids.slice(0, 3).sort(), ['heeldig', 'march', 'steptouch']);
    assert.deepEqual(ids.slice(9).sort(), ['calfstretch', 'hamstring', 'hipflexor']);
    for (const group of groups) assert.equal(dynamic.filter(id => group.includes(id)).length, 2);
    assert.equal(d.ex.reduce((sum, item) => sum + item.dur, 0) + 11 * 15 + app.PREP_SECONDS, 900);
    const sequence = ids.join(','); assert.notEqual(sequence, previous); previous = sequence;
    sets.add([...dynamic].sort().join(','));
  }
  assert.ok(sets.size > 1, 'exercise selection varies, not just order');
});

test('reshuffle changes the sequence even with a repeating random source', () => {
  const { app } = loadApp({ random: () => 0 });
  const first = app.createWarmup().ex.map(x => x.id).join(',');
  assert.notEqual(app.createWarmup().ex.map(x => x.id).join(','), first);
});

test('warmup runs automatically to completion in 900 seconds', () => {
  const env = loadApp(), { app } = env;
  app.createWarmup(); app.startSession('R', 0);
  assert.equal(app.timer.phase, 'prep');
  const started = env.now(); env.advance(5000);
  for (let i = 0; i < 12; i++) {
    assert.equal(app.state.stepPos, i);
    assert.equal(app.timer.phase, 'work');
    env.advance((i === 0 ? 70 : 60) * 1000);
    if (i < 11) { assert.equal(app.timer.phase, 'rest'); env.advance(15000); }
  }
  assert.equal(env.now() - started, 900000);
  assert.equal(app.state.view, 'done'); assert.equal(app.timer, null);
});

test('pause and resume preserve remaining time in preparation, work, and transitions', () => {
  const env = loadApp(), { app } = env;
  app.createWarmup(); app.startSession('R', 0);
  env.advance(2000); app.pauseTimer(); env.advance(60000);
  assert.equal(app.timer.phase, 'prep'); assert.equal(app.timer.pausedMs, 3000);
  app.pauseTimer(); env.advance(3000); assert.equal(app.timer.phase, 'work');
  env.advance(20000); app.pauseTimer(); env.advance(100000);
  assert.equal(app.timer.pausedMs, 50000); assert.equal(app.state.stepPos, 0);
  app.pauseTimer(); env.advance(50000); assert.equal(app.timer.phase, 'rest');
  env.advance(5000); app.pauseTimer(); env.advance(100000);
  assert.equal(app.timer.pausedMs, 10000);
  app.pauseTimer(); env.advance(10000); assert.equal(app.state.stepPos, 1); assert.equal(app.timer.phase, 'work');
});

test('stretch intervals display a halfway side-switch cue', () => {
  const env = loadApp(), { app } = env;
  app.createWarmup(); app.startSession('R', 0); app.state.stepPos = 9;
  app.renderSessionStep(); app.beginWorkStep();
  env.advance(29000); assert.doesNotMatch(env.elements.get('phaseStatus').textContent, /Switch sides/);
  env.advance(1000); assert.match(env.elements.get('phaseStatus').textContent, /Switch sides/);
  env.advance(30000); assert.equal(app.timer.phase, 'rest');
});

test('exit cancels the running session and preserves the warmup preview', () => {
  const env = loadApp(), { app } = env;
  app.createWarmup(); app.startSession('R', 0); app.exitSession(); env.advance(900000);
  assert.equal(app.state.view, 'day'); assert.equal(app.timer, null);
  assert.match(app.els.day.innerHTML, /Shuffle again/);
});

test('timed side planks schedule both sides for every set', () => {
  const { app } = loadApp();
  for (const week of ['A', 'B']) {
    const holds = app.buildSteps(week, 2).filter(x => x.id === 'sideplank');
    assert.deepEqual(Array.from(holds, x => `${x.setNum}:${x.side}`), ['1:Left', '1:Right', '2:Left', '2:Right']);
  }
});

test('regular workouts keep manual starts after rests', () => {
  const env = loadApp(), { app } = env;
  app.startSession('A', 2); assert.equal(app.timer, null);
  app.beginWorkStep(); env.advance(5000); env.advance(1200000);
  assert.equal(app.timer.phase, 'rest'); env.advance(60000);
  assert.equal(app.state.stepPos, 1); assert.equal(app.timer, null);
});

test('rest adjustments, rest skip, and skip during prep do not leave stale timers', () => {
  const env = loadApp(), { app } = env;
  app.createWarmup(); app.startSession('R', 0); env.action('skipwork');
  assert.equal(app.timer.phase, 'rest');
  app.pauseTimer(); app.els.session._restAdjust(-15); assert.equal(app.timer.pausedMs, 0);
  app.pauseTimer(); assert.equal(app.state.stepPos, 1); assert.equal(app.timer.phase, 'work');
  env.action('skipwork'); app.els.session._restSkip();
  assert.equal(app.state.stepPos, 2); assert.equal(app.timer.phase, 'work');
});

test('every exercise preview contains coaching, labeled checkpoints, and working markup', () => {
  const { app } = loadApp();
  app.createWarmup();
  app.PROGRAM.R[0].ex = Object.keys(app.EX).map(id => ({ id, sets: 1, type: 'time', target: '60s', dur: 60, rest: 15 }));
  app.renderDay('R', 0);
  for (let i = 0; i < 46; i++) {
    app.openPreview(i);
    const markup = app.els.modalRoot.innerHTML;
    for (const label of ['Setup', 'Move', 'Breathe', 'Avoid', 'Make it easier', 'Movement phases']) assert.ok(markup.includes(label));
    assert.match(markup, /role="dialog"/); assert.doesNotMatch(markup, /NaN|undefined/);
    app.closePreview(); assert.equal(app.els.modalRoot.innerHTML, '');
  }
});

test('reduced-motion users retain all phase diagrams without animated controls', () => {
  const { app } = loadApp({ reduced: true });
  const guide = app.movementGuide(app.EX.halo);
  assert.equal((guide.match(/<figure /g) || []).length, 4);
  assert.doesNotMatch(guide, /togglemotion/);
});

test('starting from home selects today instead of a previously viewed warmup', () => {
  const env = loadApp(), { app } = env;
  env.action('randomwarmup'); assert.equal(app.state.dayWeek, 'R');
  env.action('home'); env.action('startsession');
  assert.ok(['A', 'B'].includes(app.state.dayWeek)); assert.equal(app.state.dayIdx, 0);
});

test('warmup remains available on weekends', () => {
  const env = loadApp({ date: '2026-10-04T09:00:00Z' });
  assert.match(env.app.els.home.innerHTML, /randomwarmup/);
  assert.doesNotMatch(env.app.els.home.innerHTML, /Start Workout/);
  env.action('randomwarmup'); env.action('startsession'); assert.equal(env.app.state.view, 'session');
});

module.exports = { loadApp };
