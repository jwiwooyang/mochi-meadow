(() => {
'use strict';

// ---------- tiny helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const TZ = 'Asia/Manila';
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hour12: false });
const today = () => dateFmt.format(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return key(d); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FULLDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATS = {
  life:  { i: 'i-heart', n: 'Life' },
  study: { i: 'i-book', n: 'Study' },
  work:  { i: 'i-briefcase', n: 'Work' },
  care:  { i: 'i-leaf', n: 'Self-care' },
  move:  { i: 'i-dumbbell', n: 'Move' },
  money: { i: 'i-coin', n: 'Money' }
};
const PRI = { 1: 'chill', 2: 'soon', 3: 'urgent' };
const FOLDER_COLORS = ['#ffc9d6', '#bfeed3', '#ffd9b8', '#ffeaa3', '#ddd0ff', '#c4e3fa'];
const BAR_COLORS = ['#ff9fb4', '#ffd95e', '#8fdcb4', '#a8d8f8', '#c9b8ff', '#ffbf94', '#ff8fa3'];
const CONFETTI = ['#ff7b8d', '#ffd95e', '#8fdcb4', '#a8d8f8', '#ffc2cf', '#d9c7ff'];
const ic = (id, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
const chipHTML = (cat) => '<span class="cchip" data-cat="' + cat + '">' + ic(CATS[cat].i) + '</span>';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- elements ----------
const el = {
  form: $('#taskForm'), input: $('#taskInput'), due: $('#dueInput'), repeat: $('#repeatInput'),
  catPicker: $('#catPicker'), addLabel: $('#addLabel'), cancelEdit: $('#cancelEdit'), composerTitle: $('#composerTitle'), skyBtn: $('#skyBtn'), skyIcon: $('#skyIcon'), skyText: $('#skyText'),
  list: $('#taskList'), empty: $('#empty'), emptyText: $('#emptyText'),
  tabs: $('#tabs'), pill: $('#pill'), catFilter: $('#catFilter'), sort: $('#sortInput'),
  dayPill: $('#dayPill'), dayPillText: $('#dayPillText'), clearDay: $('#clearDay'),
  clearDone: $('#clearDone'), clearExamples: $('#clearExamples'),
  folders: $('#folders'), yearLabel: $('#yearLabel'),
  monthTitle: $('#monthTitle'), days: $('#days'), prev: $('#prevMonth'), next: $('#nextMonth'), goToday: $('#goToday'),
  week: $('#week'), ups: $('#ups'), upsEmpty: $('#upsEmpty'), mix: $('#mix'),
  progText: $('#progText'), progPct: $('#progPct'), progBar: $('#progBar'),
  saveNote: $('#saveNote'), exportBtn: $('#exportBtn'), importBtn: $('#importBtn'), importFile: $('#importFile'),
  dlg: $('#dayDialog'), dlgKicker: $('#dlgKicker'), dlgTitle: $('#dlgTitle'), dlgSum: $('#dlgSum'), dlgBar: $('#dlgBar'),
  dlgList: $('#dlgList'), dlgEmpty: $('#dlgEmpty'), dlgForm: $('#dlgForm'), dlgInput: $('#dlgInput'), dlgClose: $('#dlgClose'),
  streak: $('#statStreak'), doneToday: $('#statToday'), overdue: $('#statOverdue'), focusMin: $('#statFocus'),
  mochi: $('#mochi'), bubble: $('#bubble'), eyeL: $('#eyeL'), eyeR: $('#eyeR'), mouth: $('#mouth'),
  focusTask: $('#focusTask'), focusLen: $('#focusLen'), focusGo: $('#focusGo'), focusReset: $('#focusReset'),
  ring: $('#ringBar'), ringWrap: $('.ring-wrap'), timeText: $('#timeText'), modeText: $('#modeText')
};

// ---------- storage ----------
const STORE_KEY = 'mochi-meadow-v1';
let storageOk = true;
function readStore() {
  try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function noteSaved(ok) {
  if (!el.saveNote) return;
  if (!ok) { el.saveNote.textContent = 'This browser is blocking saving (private mode?). Use Export backup to keep a copy.'; return; }
  const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  el.saveNote.textContent = 'Saved on this device at ' + t + '.';
}
function writeStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 2, tasks, focus, sort }));
    storageOk = true;
  } catch (e) { storageOk = false; }
  noteSaved(storageOk);
}

function seed() {
  const td = today();
  const mk = (id, text, cat, pri, off, extra = {}) => ({
    id: 'ex-' + id, text, cat, pri, due: off === null ? '' : addDays(td, off),
    done: false, doneAt: '', repeat: 'none', mins: 0, ...extra
  });
  return [
    mk(1, 'Tick me off to see the confetti', 'life', 1, 0),
    mk(2, 'Read chapter 4 and highlight', 'study', 2, 0, { mins: 25 }),
    mk(3, 'Walk around the block', 'move', 1, 0, { repeat: 'daily' }),
    mk(4, 'Send the draft to the team', 'work', 3, 1),
    mk(5, 'Pay the internet bill', 'money', 2, 3),
    mk(6, 'Sunday reset: tidy the desk', 'care', 1, 5, { repeat: 'weekly' }),
    mk(7, 'Submit the scholarship form', 'study', 3, 9),
    mk(8, 'Return the library book', 'life', 2, -2),
    mk(9, 'Pick a cozy playlist', 'care', 1, -1, { done: true, doneAt: addDays(td, -1) }),
    mk(10, 'Plan the week', 'work', 2, -2, { done: true, doneAt: addDays(td, -2) })
  ];
}

const saved = readStore();
let tasks = saved && Array.isArray(saved.tasks) ? saved.tasks : seed();
let focus = saved && saved.focus ? saved.focus : { [addDays(today(), -1)]: 25 };
let sort = saved && saved.sort ? saved.sort : 'date';

// ---------- view state ----------
let tab = 'today';
let catFilter = 'all';
let sel = null;
let picked = null;
let dlgState = null;
let viewY = parse(today()).getFullYear();
let viewM = parse(today()).getMonth();
let editId = null;
let freshId = null;
let talkTimer = null;

// ---------- Mochi ----------
const MOUTHS = {
  sleepy: 'M56 80h8',
  idle: 'M54 78q6 6 12 0',
  focus: 'M55 80h10',
  happy: 'M52 76q8 12 16 0z',
  cheer: 'M50 74q10 18 20 0z'
};
const LINES = {
  add: ['ooh, noted!', 'tucked in!', 'on the list it goes!'],
  save: ['updated!', 'all fixed up.'],
  done: ['yay, one down!', 'look at you go!', 'tiny win, big sparkle!', 'crossed off!'],
  allDone: ['the whole day is done?! treat time!', 'everything for today? wow!'],
  undo: ['back on the list it goes.', 'oops, un-done!'],
  remove: ['poof! gone.', 'swept away!'],
  poke: ['hehe, that tickles!', 'boop!', 'hi hi!'],
  focusDone: ['session complete! stretch time.', 'that was a good one!']
};

function setMood(mood) {
  el.mochi.dataset.mood = mood;
  el.mouth.setAttribute('d', MOUTHS[mood]);
}
function setBubble(text, animateIt) {
  el.bubble.textContent = text;
  if (animateIt && !reduceMotion.matches) {
    el.bubble.classList.remove('talk');
    void el.bubble.offsetWidth;
    el.bubble.classList.add('talk');
  }
}
function say(text, mood, hold = 2800) {
  setBubble(text, true);
  setMood(mood);
  clearTimeout(talkTimer);
  talkTimer = setTimeout(restMood, hold);
}
function restMood() {
  if (timer.running) { setMood('focus'); setBubble('shh… studying with you.'); return; }
  const td = today();
  const open = tasks.filter(t => !t.done);
  const late = open.filter(t => t.due && t.due < td).length;
  const dueToday = open.filter(t => t.due === td).length;
  if (!tasks.length) { setMood('sleepy'); setBubble('zzz… tuck something in?'); }
  else if (late) { setMood('idle'); setBubble(late === 1 ? 'psst, 1 thing is overdue.' : 'psst, ' + late + ' things are overdue.'); }
  else if (dueToday) { setMood('idle'); setBubble(dueToday + (dueToday === 1 ? ' thing' : ' things') + ' for today. you got this!'); }
  else if (!open.length) { setMood('happy'); setBubble('all clear! snack time?'); }
  else { setMood('idle'); setBubble('nothing due today. peek at the calendar?'); }
}
function animate(node, cls) {
  if (reduceMotion.matches) return;
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
  node.addEventListener('animationend', () => node.classList.remove(cls), { once: true });
}
el.mochi.addEventListener('click', () => { animate(el.mochi, 'wiggle'); say(pick(LINES.poke), 'happy', 1800); });

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    if (el.mochi.dataset.mood === 'sleepy' || reduceMotion.matches) return;
    const r = el.mochi.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const x = (dx / d) * Math.min(3, d / 60);
    const y = (dy / d) * Math.min(2, d / 80);
    el.eyeL.style.translate = el.eyeR.style.translate = x + 'px ' + y + 'px';
  }, { passive: true });
}

function burst(origin, big) {
  if (reduceMotion.matches) return;
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const n = big ? 36 : 14;
  for (let i = 0; i < n; i++) {
    const bit = document.createElement('span');
    bit.className = 'bit';
    bit.style.background = CONFETTI[i % CONFETTI.length];
    bit.style.left = cx + 'px';
    bit.style.top = cy + 'px';
    if (i % 3 === 0) bit.style.borderRadius = '50%';
    document.body.appendChild(bit);
    const a = Math.random() * Math.PI * 2;
    const dist = (big ? 90 : 46) + Math.random() * (big ? 130 : 50);
    const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - (big ? 40 : 16);
    bit.animate([
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + (dy + 36) + 'px)) scale(0.4) rotate(' + Math.random() * 360 + 'deg)', opacity: 0 }
    ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = () => bit.remove();
  }
}

// ---------- derived data ----------
const isOpen = (t) => !t.done;
function streakDays() {
  const set = new Set(tasks.filter(t => t.done && t.doneAt).map(t => t.doneAt));
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function dueInfo(t) {
  if (!t.due) return null;
  const diff = daysBetween(today(), t.due);
  const d = parse(t.due);
  const short = MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
  if (t.done) return { label: short, cls: '' };
  if (diff === 0) return { label: 'today', cls: 'today' };
  if (diff === 1) return { label: 'tomorrow', cls: '' };
  if (diff === -1) return { label: 'yesterday', cls: 'late' };
  if (diff < 0) return { label: -diff + 'd overdue', cls: 'late' };
  if (diff < 7) return { label: WEEKDAYS[d.getDay()], cls: '' };
  return { label: short, cls: '' };
}
function inView(t) {
  const td = today();
  if (sel) return t.due === sel;
  if (tab === 'today') return !t.done && (!t.due || t.due <= td);
  if (tab === 'upcoming') return !t.done && t.due && t.due > td;
  if (tab === 'done') return t.done;
  return true;
}
function visibleTasks() {
  const list = tasks.filter(t => inView(t) && (catFilter === 'all' || t.cat === catFilter));
  const byDate = (a, b) => (a.due || '9999').localeCompare(b.due || '9999');
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!sel && tab === 'done') return (b.doneAt || '').localeCompare(a.doneAt || '');
    if (sort === 'priority') return (b.pri - a.pri) || byDate(a, b);
    return byDate(a, b) || (b.pri - a.pri);
  });
  return list;
}

// ---------- renderers ----------
function renderStats() {
  const td = today();
  el.streak.textContent = streakDays();
  el.doneToday.textContent = tasks.filter(t => t.done && t.doneAt === td).length;
  el.overdue.textContent = tasks.filter(t => !t.done && t.due && t.due < td).length;
  el.focusMin.textContent = focus[td] || 0;
}

function renderFolders() {
  el.yearLabel.textContent = viewY;
  const nowY = parse(today()).getFullYear(), nowM = parse(today()).getMonth();
  el.folders.replaceChildren(...MONTHS.map((name, m) => {
    const prefix = viewY + '-' + pad(m + 1);
    const inMonth = tasks.filter(t => t.due && t.due.startsWith(prefix));
    const open = inMonth.filter(isOpen);
    const cats = [];
    (open.length ? open : inMonth).forEach(t => { if (!cats.includes(t.cat) && cats.length < 3) cats.push(t.cat); });
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'folder' + (m === viewM ? ' here' : '') + (viewY === nowY && m === nowM ? ' now' : '');
    b.style.setProperty('--fc', FOLDER_COLORS[m % FOLDER_COLORS.length]);
    b.dataset.month = m;
    b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', name + ' ' + viewY + ', ' + open.length + ' to do');
    b.innerHTML = '<span class="peek"></span><span class="body"><b></b><small></small></span>';
    $('.peek', b).innerHTML = cats.map(chipHTML).join('');
    $('b', b).textContent = name.slice(0, 3);
    $('small', b).textContent = open.length ? open.length + ' to do' : inMonth.length ? 'all done' : 'empty';
    return b;
  }));
}
function scrollFolderIntoView() {
  const f = $('.folder.here', el.folders);
  if (f) el.folders.scrollLeft = f.offsetLeft - (el.folders.clientWidth - f.offsetWidth) / 2;
}

function renderCalendar() {
  el.monthTitle.textContent = MONTHS[viewM] + ' ' + viewY;
  const td = today();
  const first = new Date(viewY, viewM, 1).getDay();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(viewY, viewM, 1 - first + i);
    const k = key(d);
    const here = tasks.filter(t => t.due === k);
    const open = here.filter(isOpen);
    const shown = (open.length ? open : here).slice(0, 3);
    const extra = here.length - shown.length;
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.date = k;
    b.className = 'day' + (d.getMonth() !== viewM ? ' dim' : '') + (k === td ? ' today' : '') + (k === picked ? ' sel' : '')
      + (open.length && k < td ? ' late' : '') + (here.length && !open.length ? ' clear' : '');
    b.setAttribute('aria-label', WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + here.length + (here.length === 1 ? ' task' : ' tasks'));
    b.setAttribute('aria-pressed', k === picked ? 'true' : 'false');
    b.innerHTML = '<span class="n">' + d.getDate() + '</span><span class="st">' + shown.map(t => chipHTML(t.cat)).join('') + (extra > 0 ? '<em>+' + extra + '</em>' : '') + '</span>';
    cells.push(b);
  }
  el.days.replaceChildren(...cells);
}

function renderWeek() {
  const td = today();
  const cols = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(td, -i);
    cols.push({ k, n: tasks.filter(t => t.done && t.doneAt === k).length, label: WEEKDAYS[parse(k).getDay()] });
  }
  const max = Math.max(2, ...cols.map(c => c.n));
  el.week.replaceChildren(...cols.map((c, i) => {
    const d = document.createElement('div');
    d.className = 'wcol' + (c.k === td ? ' is-today' : '');
    d.title = c.n + ' done on ' + c.label;
    d.innerHTML = '<b>' + c.n + '</b><div class="wbar"></div><span>' + c.label.slice(0, 3) + '</span>';
    const bar = $('.wbar', d);
    bar.style.setProperty('--h', Math.max(6, Math.round((c.n / max) * 62)) + 'px');
    bar.style.setProperty('--c', BAR_COLORS[i % BAR_COLORS.length]);
    return d;
  }));
}

const tick = '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 5"/></svg>';

function buildTask(t) {
  const li = document.createElement('li');
  li.className = 'task' + (t.done ? ' done' : '') + (t.id === freshId ? ' enter' : '');
  li.dataset.id = t.id;
  li.dataset.cat = t.cat;
  const info = dueInfo(t);
  li.innerHTML =
    chipHTML(t.cat) +
    '<label class="check"><input type="checkbox"><span class="box">' + tick + '</span></label>' +
    '<div class="tbody"><span class="label"></span><div class="meta"></div></div>' +
    '<div class="acts">' +
      (t.done ? '' : '<button type="button" class="act" data-act="focus">' + ic('i-clock') + '</button>') +
      '<button type="button" class="act" data-act="edit">' + ic('i-pencil') + '</button>' +
      '<button type="button" class="act del" data-act="del">' + ic('i-trash') + '</button>' +
    '</div>';
  const box = $('input', li);
  box.checked = t.done;
  box.setAttribute('aria-label', 'Mark "' + t.text + '" as done');
  $('.label', li).textContent = t.text;
  const meta = $('.meta', li);
  const addTag = (html, cls, title) => {
    const sp = document.createElement('span');
    sp.className = 'tag ' + (cls || '');
    sp.innerHTML = html;
    if (title) sp.title = title;
    meta.appendChild(sp);
  };
  const esc = (x) => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  if (info) addTag(ic('i-calendar') + esc(info.label), info.cls, 'Due date');
  else addTag('no date', '');
  addTag('<b class="meter" data-n="' + t.pri + '"><i></i><i></i><i></i></b>' + PRI[t.pri], 'p' + t.pri, 'Priority');
  if (t.repeat !== 'none') addTag(ic('i-repeat') + t.repeat, '', 'Repeats ' + t.repeat);
  if (t.mins) addTag(ic('i-hourglass') + t.mins + 'm', '', 'Focus time logged');
  $('[data-act="focus"]', li)?.setAttribute('aria-label', 'Focus on "' + t.text + '"');
  $('[data-act="edit"]', li).setAttribute('aria-label', 'Edit "' + t.text + '"');
  $('[data-act="del"]', li).setAttribute('aria-label', 'Delete "' + t.text + '"');
  return li;
}

function renderList() {
  const shown = visibleTasks();
  el.list.replaceChildren(...shown.map(buildTask));
  freshId = null;
  el.empty.hidden = shown.length > 0;
  if (!shown.length) {
    el.emptyText.textContent =
      sel ? 'Nothing tucked into this day yet.' :
      !tasks.length ? 'A clean meadow. Add your first task!' :
      catFilter !== 'all' ? 'No ' + CATS[catFilter].n.toLowerCase() + ' tasks here.' :
      tab === 'today' ? 'All clear for today. Go have a snack.' :
      tab === 'upcoming' ? 'Nothing coming up. Enjoy the quiet.' :
      tab === 'done' ? 'Nothing finished yet. You got this!' : 'Nothing here yet.';
  }
  el.clearDone.hidden = !tasks.some(t => t.done);
  el.clearExamples.hidden = !tasks.some(t => t.id.startsWith('ex-'));
}

function renderTabs() {
  const td = today();
  $('#cToday').textContent = tasks.filter(t => !t.done && (!t.due || t.due <= td)).length;
  $('#cUp').textContent = tasks.filter(t => !t.done && t.due && t.due > td).length;
  $('#cAll').textContent = tasks.length;
  $('#cDone').textContent = tasks.filter(t => t.done).length;
  $$('.tabbtn').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
  el.pill.style.transform = 'translateX(' + (['today', 'upcoming', 'all', 'done'].indexOf(tab) * 100) + '%)';
  el.pill.style.opacity = sel ? 0.3 : 1;
  el.dayPill.hidden = !sel;
  if (sel) { const d = parse(sel); el.dayPillText.textContent = 'Showing ' + WEEKDAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
}

function renderCatFilter() {
  const btns = [['all', 'All', 'Show every task']].concat(Object.keys(CATS).map(k => [k, chipHTML(k), CATS[k].n]));
  el.catFilter.replaceChildren(...btns.map(([k, label, title]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.cat = k;
    b.innerHTML = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.setAttribute('aria-pressed', k === catFilter ? 'true' : 'false');
    b.className = k === catFilter ? 'on' : '';
    return b;
  }));
}

function renderFocusSelect() {
  const prev = el.focusTask.value;
  const open = tasks.filter(isOpen);
  el.focusTask.replaceChildren(...[{ id: '', text: 'Anything (free focus)' }].concat(open).map(t => {
    const o = document.createElement('option');
    o.value = t.id;
    o.textContent = t.id ? CATS[t.cat].n + ' · ' + t.text : t.text;
    return o;
  }));
  el.focusTask.value = open.some(t => t.id === prev) ? prev : '';
}

function renderPanels() {
  const td = today();
  const open = tasks.filter(isOpen);
  const ahead = open.filter(t => t.due && t.due >= td)
    .sort((a, b) => a.due.localeCompare(b.due) || (b.pri - a.pri)).slice(0, 5);
  el.upsEmpty.hidden = ahead.length > 0;
  el.ups.replaceChildren(...ahead.map(t => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'up'; b.dataset.date = t.due;
    const info = dueInfo(t);
    b.innerHTML = chipHTML(t.cat) + '<span class="up-text"></span><span class="tag ' + info.cls + '"></span>';
    $('.up-text', b).textContent = t.text;
    $('.tag', b).textContent = info.label;
    b.setAttribute('aria-label', t.text + ', due ' + info.label + '. Open that day.');
    li.appendChild(b);
    return li;
  }));
  const done = tasks.length - open.length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  el.progText.textContent = done + ' of ' + tasks.length + ' done';
  el.progPct.textContent = pct + '%';
  el.progBar.style.width = pct + '%';
  const counts = Object.keys(CATS).map(k => [k, open.filter(t => t.cat === k).length]);
  const max = Math.max(1, ...counts.map(c => c[1]));
  el.mix.replaceChildren(...counts.map(([k, n]) => {
    const row = document.createElement('div');
    row.className = 'mix-row';
    row.dataset.cat = k;
    row.innerHTML = chipHTML(k) + '<div class="mix-mid"><span>' + CATS[k].n + '</span><div class="mix-bar"><i></i></div></div><b>' + n + '</b>';
    $('.mix-bar i', row).style.setProperty('--w', Math.round(n / max * 100) + '%');
    return row;
  }));
}

// ---------- day / month pop-up ----------
function dlgTasks() {
  if (!dlgState) return [];
  const { type, key: k } = dlgState;
  const match = (d) => d && (type === 'day' ? d === k : d.startsWith(k));
  const list = tasks.filter(t => match(t.due) || (t.done && match(t.doneAt)));
  list.sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || '') || (b.pri - a.pri));
  return list;
}
function renderDialog() {
  if (!dlgState || !el.dlg.open) return;
  const { type, key: k } = dlgState;
  const td = today();
  const list = dlgTasks();
  const done = list.filter(t => t.done).length;
  if (type === 'day') {
    const d = parse(k), diff = daysBetween(td, k);
    el.dlgKicker.textContent = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : FULLDAYS[d.getDay()];
    el.dlgTitle.textContent = MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  } else {
    const [y, m] = k.split('-').map(Number);
    el.dlgKicker.textContent = 'Month folder';
    el.dlgTitle.textContent = MONTHS[m - 1] + ' ' + y;
  }
  el.dlgSum.textContent = list.length ? done + ' done · ' + (list.length - done) + ' to do' : 'No tasks yet';
  el.dlgBar.style.width = (list.length ? Math.round(done / list.length * 100) : 0) + '%';
  el.dlgList.replaceChildren(...list.map(buildTask));
  el.dlgEmpty.hidden = list.length > 0;
  el.dlgEmpty.textContent = type === 'day'
    ? (k < td ? 'Nothing was logged for this day.' : 'Nothing planned yet. Add something below!')
    : 'This folder is empty. Pick a day in the calendar to fill it.';
  el.dlgForm.hidden = type !== 'day';
}
function openDialog(type, k) {
  dlgState = { type, key: k };
  if (!el.dlg.open && el.dlg.showModal) el.dlg.showModal();
  renderDialog();
}
function closeDialog() { if (el.dlg.open) el.dlg.close(); dlgState = null; }
el.dlgClose.addEventListener('click', closeDialog);
el.dlg.addEventListener('click', (e) => { if (e.target === el.dlg) closeDialog(); });
el.dlg.addEventListener('close', () => { dlgState = null; });
el.dlgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = el.dlgInput.value.trim();
  if (!text || !dlgState || dlgState.type !== 'day') { el.dlgInput.focus(); return; }
  const t = { id: newId(), text, cat: 'life', pri: 2, due: dlgState.key, done: false, doneAt: '', repeat: 'none', mins: 0 };
  tasks.unshift(t);
  freshId = t.id;
  el.dlgInput.value = '';
  persistAndRender();
  animate(el.mochi, 'boing');
  say(pick(LINES.add), 'happy');
  el.dlgInput.focus();
});
el.ups.addEventListener('click', (e) => {
  const b = e.target.closest('.up');
  if (!b) return;
  const d = parse(b.dataset.date);
  viewY = d.getFullYear(); viewM = d.getMonth(); picked = b.dataset.date;
  renderFolders(); renderCalendar(); scrollFolderIntoView();
  openDialog('day', b.dataset.date);
});

function renderAll() {
  renderStats(); renderFolders(); renderCalendar(); renderWeek(); renderPanels(); renderTabs(); renderCatFilter(); renderDialog(); renderList(); renderFocusSelect();
}
function renderSides() {
  renderStats(); renderFolders(); renderCalendar(); renderWeek(); renderPanels(); renderTabs(); renderFocusSelect();
}
function persistAndRender() { writeStore(); renderAll(); }

// ---------- composer ----------
el.catPicker.innerHTML = Object.keys(CATS).map((k, i) =>
  '<label title="' + CATS[k].n + '" data-cat="' + k + '"><input type="radio" name="cat" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + chipHTML(k) + CATS[k].n + '</span></label>').join('');
$$('#catPicker label').forEach(l => l.querySelector('input').setAttribute('aria-label', l.title));
const radio = (name) => (el.form.elements[name] || {}).value;

function syncQuickChips() {
  $$('[data-quick]').forEach(b => {
    const q = b.dataset.quick;
    const want = q === 'none' ? '' : addDays(today(), Number(q));
    b.classList.toggle('on', el.due.value === want);
  });
}
$$('[data-quick]').forEach(b => b.addEventListener('click', () => {
  el.due.value = b.dataset.quick === 'none' ? '' : addDays(today(), Number(b.dataset.quick));
  syncQuickChips();
}));
el.due.addEventListener('input', syncQuickChips);

function jumpToMonthOf(dateStr) {
  if (!dateStr) return;
  const d = parse(dateStr);
  viewY = d.getFullYear(); viewM = d.getMonth();
}

function leaveEditMode() {
  editId = null;
  el.addLabel.textContent = 'Add';
  el.composerTitle.textContent = 'New task';
  el.cancelEdit.hidden = true;
  el.input.value = '';
  el.repeat.value = 'none';
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = el.input.value.trim();
  if (!text) { animate(el.form, 'shake'); el.input.focus(); return; }
  const data = { text, cat: radio('cat') || 'life', pri: Number(radio('pri')) || 2, due: el.due.value || '', repeat: el.repeat.value };

  if (editId) {
    const t = tasks.find(x => x.id === editId);
    if (t) Object.assign(t, data);
    leaveEditMode();
    jumpToMonthOf(data.due);
    persistAndRender();
    animate(el.mochi, 'boing');
    say(pick(LINES.save), 'happy');
    return;
  }

  const t = { id: newId(), done: false, doneAt: '', mins: 0, ...data };
  tasks.unshift(t);
  freshId = t.id;
  if (sel && t.due !== sel) sel = null;
  if (catFilter !== 'all' && catFilter !== t.cat) catFilter = 'all';
  if (!inView(t)) tab = 'all';
  jumpToMonthOf(t.due);
  el.input.value = '';
  el.repeat.value = 'none';
  persistAndRender();
  scrollFolderIntoView();
  el.input.focus();
  animate(el.mochi, 'boing');
  say(pick(LINES.add), 'happy');
});

el.cancelEdit.addEventListener('click', () => { leaveEditMode(); });
el.input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editId) leaveEditMode(); });

function startEdit(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editId = id;
  el.input.value = t.text;
  el.due.value = t.due;
  el.repeat.value = t.repeat;
  const c = el.form.querySelector('input[name="cat"][value="' + t.cat + '"]'); if (c) c.checked = true;
  const p = el.form.querySelector('input[name="pri"][value="' + t.pri + '"]'); if (p) p.checked = true;
  el.addLabel.textContent = 'Save';
  el.composerTitle.textContent = 'Editing task';
  el.cancelEdit.hidden = false;
  syncQuickChips();
  el.form.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  el.input.focus();
}

// ---------- list actions ----------
function onListChange(e) {
  if (!e.target.matches('input[type="checkbox"]')) return;
  const li = e.target.closest('.task');
  const t = tasks.find(x => x.id === li.dataset.id);
  if (!t) return;
  const td = today();
  t.done = e.target.checked;
  t.doneAt = t.done ? td : '';
  let spawned = false;
  if (t.done && t.repeat !== 'none') {
    const step = t.repeat === 'daily' ? 1 : 7;
    let next = addDays(t.due || td, step);
    while (next <= td) next = addDays(next, step);
    tasks.unshift({ ...t, id: newId(), done: false, doneAt: '', due: next, mins: 0 });
    spawned = true;
  }
  writeStore();
  li.classList.toggle('done', t.done);
  animate($('.check', li), 'pop');
  renderSides();

  if (t.done) {
    burst($('.box', li), false);
    animate(el.mochi, 'boing');
    const leftToday = tasks.filter(x => !x.done && x.due && x.due <= td).length;
    const hadToday = tasks.some(x => x.done && x.doneAt === td);
    if (leftToday === 0 && hadToday) { burst(el.mochi, true); say(pick(LINES.allDone), 'cheer', 4200); }
    else if (spawned) say('done! next one is set for ' + dueInfo(tasks[0]).label + '.', 'cheer');
    else say(pick(LINES.done), 'cheer');
  } else {
    say(pick(LINES.undo), 'idle');
  }
  if (!inView(t) || spawned) setTimeout(renderList, 380);
  else { el.clearDone.hidden = !tasks.some(x => x.done); }
  if (dlgState) setTimeout(renderDialog, 420);
}

function onListClick(e) {
  const btn = e.target.closest('.act');
  if (!btn) return;
  const li = btn.closest('.task');
  const id = li.dataset.id;
  const act = btn.dataset.act;
  if (act === 'edit') { closeDialog(); startEdit(id); return; }
  if (act === 'focus') {
    closeDialog();
    el.focusTask.value = id;
    const t = tasks.find(x => x.id === id);
    say('ready to study "' + t.text.slice(0, 28) + '"? hit start!', 'idle', 3600);
    $('.focus-sheet').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    return;
  }
  if (act === 'del') {
    tasks = tasks.filter(t => t.id !== id);
    if (editId === id) leaveEditMode();
    writeStore();
    say(pick(LINES.remove), 'idle');
    const finish = () => { renderAll(); };
    if (reduceMotion.matches) { finish(); return; }
    li.classList.add('leave');
    li.addEventListener('animationend', finish, { once: true });
  }
}
[el.list, el.dlgList].forEach(l => { l.addEventListener('change', onListChange); l.addEventListener('click', onListClick); });

el.clearDone.addEventListener('click', () => { tasks = tasks.filter(t => !t.done); persistAndRender(); say(pick(LINES.remove), 'idle'); });
el.clearExamples.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.id.startsWith('ex-'));
  focus = {};
  persistAndRender();
  say('fresh start! the meadow is yours.', 'happy');
});

// ---------- tabs, filters, sort ----------
el.tabs.addEventListener('click', (e) => {
  const b = e.target.closest('.tabbtn');
  if (!b) return;
  tab = b.dataset.tab;
  sel = null;
  renderCalendar(); renderTabs(); renderList();
});
el.catFilter.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  catFilter = b.dataset.cat;
  renderCatFilter(); renderList();
});
el.sort.value = sort;
el.sort.addEventListener('change', () => { sort = el.sort.value; writeStore(); renderList(); });
el.clearDay.addEventListener('click', () => { sel = null; renderCalendar(); renderTabs(); renderList(); });

// ---------- calendar + folders ----------
function shiftMonth(n) {
  const d = new Date(viewY, viewM + n, 1);
  viewY = d.getFullYear(); viewM = d.getMonth();
  renderFolders(); renderCalendar(); scrollFolderIntoView();
}
el.prev.addEventListener('click', () => shiftMonth(-1));
el.next.addEventListener('click', () => shiftMonth(1));
el.goToday.addEventListener('click', () => {
  const n = parse(today());
  viewY = n.getFullYear(); viewM = n.getMonth();
  picked = today();
  el.due.value = picked; syncQuickChips();
  renderFolders(); renderCalendar(); renderTabs(); renderList(); scrollFolderIntoView();
});
el.folders.addEventListener('click', (e) => {
  const b = e.target.closest('.folder');
  if (!b) return;
  viewM = Number(b.dataset.month);
  renderFolders(); renderCalendar(); scrollFolderIntoView();
  openDialog('month', viewY + '-' + pad(viewM + 1));
});
el.days.addEventListener('click', (e) => {
  const b = e.target.closest('.day');
  if (!b) return;
  const k = b.dataset.date;
  picked = k;
  const d = parse(k);
  if (d.getMonth() !== viewM || d.getFullYear() !== viewY) { viewY = d.getFullYear(); viewM = d.getMonth(); renderFolders(); }
  if (!editId) { el.due.value = k; syncQuickChips(); }
  renderCalendar();
  openDialog('day', k);
});

// ---------- focus timer ----------
const CIRC = 2 * Math.PI * 52;
const timer = { mode: 'focus', total: 25 * 60, left: 25 * 60, running: false, endAt: 0, id: null };
el.ring.style.strokeDasharray = CIRC;

function sessionSeconds() { return timer.mode === 'focus' ? Number(el.focusLen.value) * 60 : 5 * 60; }
function showTimer() {
  const m = Math.floor(timer.left / 60), s = timer.left % 60;
  el.timeText.textContent = pad(m) + ':' + pad(s);
  el.ring.style.strokeDashoffset = CIRC * (1 - timer.left / timer.total);
  el.modeText.textContent = timer.mode === 'focus' ? 'focus' : 'break';
  el.ringWrap.classList.toggle('break', timer.mode === 'break');
  el.focusGo.textContent = timer.running ? 'Pause' : (timer.left < timer.total ? 'Resume' : 'Start');
}
function tickTimer() {
  const left = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
  if (left !== timer.left) { timer.left = left; showTimer(); }
  if (left <= 0) finishTimer();
}
function startTimer() {
  timer.running = true;
  timer.endAt = Date.now() + timer.left * 1000;
  timer.id = setInterval(tickTimer, 250);
  clearTimeout(talkTimer);
  showTimer(); restMood();
}
function pauseTimer() {
  clearInterval(timer.id);
  timer.running = false;
  showTimer(); restMood();
}
function finishTimer() {
  clearInterval(timer.id);
  timer.running = false;
  if (timer.mode === 'focus') {
    const mins = Math.round(timer.total / 60);
    focus[today()] = (focus[today()] || 0) + mins;
    const t = tasks.find(x => x.id === el.focusTask.value);
    if (t) t.mins = (t.mins || 0) + mins;
    writeStore();
    burst(el.ringWrap, true);
    animate(el.mochi, 'boing');
    say(pick(LINES.focusDone) + ' (+' + mins + ' min)', 'cheer', 4200);
    timer.mode = 'break';
    renderList();
  } else {
    timer.mode = 'focus';
    say('break over. ready when you are!', 'happy', 3200);
  }
  timer.total = timer.left = sessionSeconds();
  showTimer(); renderStats();
}
el.focusGo.addEventListener('click', () => (timer.running ? pauseTimer() : startTimer()));
el.focusReset.addEventListener('click', () => {
  clearInterval(timer.id);
  timer.running = false; timer.mode = 'focus';
  timer.total = timer.left = sessionSeconds();
  showTimer(); restMood();
});
el.focusLen.addEventListener('change', () => {
  if (!timer.running && timer.mode === 'focus') { timer.total = timer.left = sessionSeconds(); showTimer(); }
});

// ---------- sky (follows Philippine time) ----------
const SKY = {
  dawn:  { icon: 'i-sunrise', name: 'Dawn' },
  day:   { icon: 'i-sun', name: 'Day' },
  dusk:  { icon: 'i-sunrise', name: 'Dusk' },
  night: { icon: 'i-moon', name: 'Night' }
};
const SKY_ORDER = ['auto', 'dawn', 'day', 'dusk', 'night'];
let skyMode = 'auto';
function manilaNow() {
  const p = {};
  timeFmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  return { h: Number(p.hour) % 24, m: Number(p.minute) };
}
function phaseFor(h, m) {
  const t = h + m / 60;
  if (t >= 3 && t < 7) return 'dawn';
  if (t >= 7 && t < 16.5) return 'day';
  if (t >= 16.5 && t < 19.5) return 'dusk';
  return 'night';
}
function clockLabel(h, m) {
  return ((h % 12) || 12) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM');
}
function applySky() {
  const { h, m } = manilaNow();
  const real = phaseFor(h, m);
  const phase = skyMode === 'auto' ? real : skyMode;
  document.documentElement.dataset.time = phase;
  el.skyIcon.setAttribute('href', '#' + SKY[phase].icon);
  el.skyText.textContent = skyMode === 'auto'
    ? SKY[phase].name + ' · ' + clockLabel(h, m) + ' PH'
    : 'Previewing ' + SKY[phase].name.toLowerCase();
}
el.skyBtn.addEventListener('click', () => {
  skyMode = SKY_ORDER[(SKY_ORDER.indexOf(skyMode) + 1) % SKY_ORDER.length];
  applySky();
});
let lastDay = today();
setInterval(() => {
  applySky();
  const td = today();
  if (td !== lastDay) { lastDay = td; renderAll(); restMood(); }
}, 30000);

// ---------- saving: backup + safety nets ----------
window.addEventListener('pagehide', writeStore);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') writeStore(); });
window.addEventListener('storage', (e) => {
  if (e.key !== STORE_KEY || !e.newValue) return;
  try {
    const d = JSON.parse(e.newValue);
    if (Array.isArray(d.tasks)) { tasks = d.tasks; focus = d.focus || {}; renderAll(); restMood(); }
  } catch (err) { /* ignore */ }
});
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* optional */ }

el.exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'mochi-meadow', v: 2, tasks, focus }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mochi-meadow-backup-' + today() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say('backup saved to your downloads!', 'happy');
});
el.importBtn.addEventListener('click', () => el.importFile.click());
el.importFile.addEventListener('change', () => {
  const f = el.importFile.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.tasks)) throw new Error('bad file');
      const clean = d.tasks.filter(t => t && typeof t.text === 'string' && t.text.trim()).map(t => ({
        id: String(t.id || newId()), text: t.text.slice(0, 80), cat: CATS[t.cat] ? t.cat : 'life',
        pri: [1, 2, 3].includes(Number(t.pri)) ? Number(t.pri) : 2,
        due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '', done: !!t.done,
        doneAt: /^\d{4}-\d{2}-\d{2}$/.test(t.doneAt || '') ? t.doneAt : '',
        repeat: ['daily', 'weekly'].includes(t.repeat) ? t.repeat : 'none', mins: Number(t.mins) || 0
      }));
      tasks = clean; focus = d.focus && typeof d.focus === 'object' ? d.focus : {};
      persistAndRender();
      say('imported ' + clean.length + ' tasks!', 'happy');
    } catch (err) { say("hmm, that file didn't look right.", 'idle'); }
    el.importFile.value = '';
  };
  r.readAsText(f);
});

// ---------- go ----------
applySky();
el.due.value = today();
syncQuickChips();
renderAll();
showTimer();
restMood();
scrollFolderIntoView();
writeStore();
})();
