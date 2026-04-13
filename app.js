/**
 * lkl001_site — Dashboard App
 * ═══════════════════════════════════════════════════════════
 * Project : lkl001_site
 * Author  : lkl001
 * Version : 0.3.1
 *
 * Structure
 * ─────────
 * 01. Config & State
 * 02. Module: Clock & Date
 * 03. Module: Uptime Counter
 * 04. Module: Resource Simulator
 * 05. Module: Mini CPU Chart
 * 06. Module: Card Hover & Highlight
 * 07. Module: Tooltip
 * 08. Module: Goal Toggle
 * 09. Module: Quick Note Save
 * 10. Module: Activity Feed
 * 11. Module: Quick Links
 * 12. Module: Navigation
 * 13. Init
 *
 * Vue Compatibility Notes
 * ─────────────────────────────────────────────────────────
 * All DOM manipulation is wrapped in discrete module objects.
 * Each module exposes init(), and optionally destroy().
 * State is held in a plain reactive-friendly object (AppState).
 * When migrating to Vue 3:
 *   - Replace AppState with reactive() / ref()
 *   - Replace DOM queries with template refs
 *   - Replace interval-driven updates with watchEffect / computed
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────
   01. Config & State
───────────────────────────────────────── */

/** Central application state — Vue-migration ready */
const AppState = {
  startTime:    Date.now(),
  activeModule: null,
  notes:        '',
  goals: [
    { id: 1, done: true,  text: 'Complete dashboard HTML structure' },
    { id: 2, done: true,  text: 'Write CSS design system' },
    { id: 3, done: false, text: 'Implement JS interactions' },
    { id: 4, done: false, text: 'Review API Gateway module' },
    { id: 5, done: false, text: 'Write end-of-day log' },
  ],
  resources: {
    cpu:  34,
    mem:  61,
    disk: 48,
    net:  22,
  },
  cpuHistory: Array.from({ length: 30 }, () => Math.floor(20 + Math.random() * 40)),
  activityLog: [],
};

/** Quick-access DOM refs */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


/* ─────────────────────────────────────────
   02. Module: Clock & Date
───────────────────────────────────────── */
const ClockModule = {
  el:    null,
  dateEl: null,
  timer: null,

  init() {
    this.el     = $('#js-clock');
    this.dateEl = $('#js-date');
    this.tick();
    this.timer  = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const now  = new Date();
    const time = now.toTimeString().slice(0, 8);
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}` +
                 `/${String(now.getDate()).padStart(2, '0')}`;

    if (this.el)     this.el.textContent     = time;
    if (this.dateEl) this.dateEl.textContent = date;
  },

  destroy() {
    clearInterval(this.timer);
  },
};


/* ─────────────────────────────────────────
   03. Module: Uptime Counter
───────────────────────────────────────── */
const UptimeModule = {
  el:    null,
  timer: null,

  init() {
    this.el    = $('#js-uptime');
    this.timer = setInterval(() => this.update(), 1000);
    this.update();
  },

  update() {
    if (!this.el) return;
    const elapsed = Math.floor((Date.now() - AppState.startTime) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    this.el.textContent = `${h}:${m}:${s}`;
  },

  destroy() {
    clearInterval(this.timer);
  },
};


/* ─────────────────────────────────────────
   04. Module: Resource Simulator
   Simulates gentle random drift on resource values
───────────────────────────────────────── */
const ResourceModule = {
  timer: null,
  elements: {},

  init() {
    this.elements = {
      cpuVal:  $('#js-cpu'),
      cpuBar:  $('#js-cpu-bar'),
      memVal:  $('#js-mem'),
      memBar:  $('#js-mem-bar'),
      diskVal: $('#js-disk'),
      diskBar: $('#js-disk-bar'),
      netVal:  $('#js-net'),
      netBar:  $('#js-net-bar'),
    };

    this.render();
    this.timer = setInterval(() => {
      this.drift();
      this.render();
    }, 2800);
  },

  /**
   * Gently drift a value within bounds
   * @param {number} val   - current value
   * @param {number} min   - minimum
   * @param {number} max   - maximum
   * @param {number} delta - max change per tick
   */
  driftVal(val, min, max, delta = 5) {
    const change = (Math.random() - 0.5) * 2 * delta;
    return Math.min(max, Math.max(min, Math.round(val + change)));
  },

  drift() {
    const r = AppState.resources;
    r.cpu  = this.driftVal(r.cpu,  5,  92, 4);
    r.mem  = this.driftVal(r.mem,  40, 85, 2);
    r.disk = this.driftVal(r.disk, 45, 55, 1);
    r.net  = this.driftVal(r.net,  5,  80, 8);

    // Push CPU to history for chart
    AppState.cpuHistory.push(r.cpu);
    if (AppState.cpuHistory.length > 30) AppState.cpuHistory.shift();
    ChartModule.draw();
  },

  render() {
    const r  = AppState.resources;
    const el = this.elements;

    this._setResource(el.cpuVal,  el.cpuBar,  r.cpu,  `${r.cpu}%`);
    this._setResource(el.memVal,  el.memBar,  r.mem,  `${r.mem}%`);
    this._setResource(el.diskVal, el.diskBar, r.disk, `${r.disk}%`);

    // Network — show as MB/s
    const mbps = (r.net / 100 * 10).toFixed(1);
    this._setResource(el.netVal, el.netBar, r.net, `${mbps} MB/s`);
  },

  _setResource(valEl, barEl, pct, label) {
    if (valEl) valEl.textContent = label;
    if (barEl) barEl.style.setProperty('--val', `${pct}%`);
  },

  destroy() {
    clearInterval(this.timer);
  },
};


/* ─────────────────────────────────────────
   05. Module: Mini CPU Chart
───────────────────────────────────────── */
const ChartModule = {
  canvas: null,
  ctx:    null,

  init() {
    this.canvas = $('#js-cpu-chart');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Scale for retina
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = rect.width  * dpr || 220 * dpr;
    this.canvas.height = 48 * dpr;
    this.ctx.scale(dpr, dpr);

    this.draw();
  },

  draw() {
    if (!this.ctx) return;

    const data   = AppState.cpuHistory;
    const w      = this.canvas.width  / (window.devicePixelRatio || 1);
    const h      = this.canvas.height / (window.devicePixelRatio || 1);
    const ctx    = this.ctx;
    const len    = data.length;
    const stepX  = w / (len - 1);
    const minVal = 0;
    const maxVal = 100;

    ctx.clearRect(0, 0, w, h);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   'rgba(61,153,112,0.30)');
    grad.addColorStop(1,   'rgba(61,153,112,0.00)');

    // Build path
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minVal) / (maxVal - minVal)) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    // Stroke
    ctx.strokeStyle = 'rgba(61,153,112,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Fill
    const lastX = (len - 1) * stepX;
    const lastY = h - ((data[len - 1] - minVal) / (maxVal - minVal)) * h;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Baseline
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  },
};


/* ─────────────────────────────────────────
   06. Module: Card Hover & Highlight
   Single-module highlight, dim others
───────────────────────────────────────── */
const CardModule = {
  cards:      [],
  dimTimeout: null,

  init() {
    this.cards = $$('.card[data-module]');

    this.cards.forEach(card => {
      card.addEventListener('mouseenter', () => this.highlight(card));
      card.addEventListener('mouseleave', () => this.clearHighlight());
    });
  },

  highlight(activeCard) {
    clearTimeout(this.dimTimeout);
    AppState.activeModule = activeCard.dataset.module;

    this.cards.forEach(card => {
      card.classList.remove('card--highlighted');
      card.style.opacity = '1';
    });

    activeCard.classList.add('card--highlighted');
  },

  clearHighlight() {
    // Small delay so adjacent cards don't flash
    this.dimTimeout = setTimeout(() => {
      AppState.activeModule = null;
      this.cards.forEach(card => {
        card.classList.remove('card--highlighted');
        card.style.opacity = '1';
      });
    }, 120);
  },
};


/* ─────────────────────────────────────────
   07. Module: Tooltip
───────────────────────────────────────── */
const TooltipModule = {
  el:    null,
  timer: null,

  init() {
    this.el = $('#js-tooltip');
    if (!this.el) return;

    const targets = $$('[data-tooltip]');
    targets.forEach(target => {
      target.addEventListener('mouseenter', e => this.show(e, target.dataset.tooltip));
      target.addEventListener('mouseleave', ()  => this.hide());
    });

    document.addEventListener('mousemove', e => this.move(e));
  },

  show(e, text) {
    if (!this.el) return;
    this.el.textContent = text;
    this.el.classList.add('tooltip--visible');
    this.el.setAttribute('aria-hidden', 'false');
    this.move(e);
  },

  hide() {
    if (!this.el) return;
    this.el.classList.remove('tooltip--visible');
    this.el.setAttribute('aria-hidden', 'true');
  },

  move(e) {
    if (!this.el || !this.el.classList.contains('tooltip--visible')) return;
    const gap = 14;
    let x = e.clientX + gap;
    let y = e.clientY - this.el.offsetHeight - gap;

    // Viewport boundary check
    const vw = window.innerWidth;
    const tw = this.el.offsetWidth;
    if (x + tw > vw - 8) x = e.clientX - tw - gap;
    if (y < 8) y = e.clientY + gap;

    this.el.style.left = `${x}px`;
    this.el.style.top  = `${y}px`;
  },
};


/* ─────────────────────────────────────────
   08. Module: Goal Toggle
   Click a goal item to toggle done/undone
───────────────────────────────────────── */
const GoalModule = {
  init() {
    const list = $('#js-goal-list');
    if (!list) return;

    list.addEventListener('click', e => {
      const item = e.target.closest('.goal-item');
      if (!item) return;

      const id   = parseInt(item.dataset.goal, 10);
      const goal = AppState.goals.find(g => g.id === id);
      if (!goal) return;

      goal.done = !goal.done;
      item.classList.toggle('goal-item--done', goal.done);

      // Log to activity feed
      const action = goal.done ? 'completed' : 'reopened';
      ActivityModule.push('system', `Goal ${action}: "${goal.text.slice(0, 30)}"`);
    });
  },
};


/* ─────────────────────────────────────────
   09. Module: Quick Note Save
───────────────────────────────────────── */
const NoteModule = {
  textarea: null,
  saveBtn:  null,

  init() {
    this.textarea = $('#js-note-area');
    this.saveBtn  = $('#js-save-note');
    if (!this.textarea || !this.saveBtn) return;

    // Restore from sessionStorage (Vue: use reactive store)
    const saved = sessionStorage.getItem('lkl001_note');
    if (saved) this.textarea.value = saved;

    this.textarea.addEventListener('input', () => {
      AppState.notes = this.textarea.value;
    });

    this.saveBtn.addEventListener('click', () => this.save());

    // Ctrl/Cmd + S to save
    this.textarea.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
    });
  },

  save() {
    const text = this.textarea.value.trim();
    if (!text) return;

    sessionStorage.setItem('lkl001_note', text);
    AppState.notes = text;

    // Visual feedback: briefly flash the save button
    this.saveBtn.textContent = 'Saved ✓';
    this.saveBtn.style.color = 'var(--accent)';
    setTimeout(() => {
      this.saveBtn.textContent = 'Save';
      this.saveBtn.style.color = '';
    }, 1600);

    ActivityModule.push('note', `Note saved · ${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`);
  },
};


/* ─────────────────────────────────────────
   10. Module: Activity Feed
───────────────────────────────────────── */
const ActivityModule = {
  list:      null,
  clearBtn:  null,
  maxItems:  20,

  /** Dot type → class mapping */
  typeMap: {
    commit: 'activity-item__dot--commit',
    build:  'activity-item__dot--build',
    note:   'activity-item__dot--note',
    system: 'activity-item__dot--system',
  },

  init() {
    this.list     = $('#js-activity-list');
    this.clearBtn = $('#js-clear-log');

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  },

  /**
   * Push a new entry to the feed
   * @param {string} type - 'commit' | 'build' | 'note' | 'system'
   * @param {string} text - display text
   */
  push(type, text) {
    if (!this.list) return;

    const now  = new Date();
    const time = now.toTimeString().slice(0, 5);
    const dotClass = this.typeMap[type] || 'activity-item__dot--system';

    const li = document.createElement('li');
    li.className = 'activity-item activity-item--new';
    li.dataset.type = type;
    li.innerHTML = `
      <span class="activity-item__dot ${dotClass}"></span>
      <div class="activity-item__body">
        <p class="activity-item__text">${this._escapeHtml(text)}</p>
        <time class="activity-item__time">${time}</time>
      </div>
    `;

    // Prepend (newest first)
    this.list.prepend(li);

    // Enforce max items
    const items = this.list.querySelectorAll('.activity-item');
    if (items.length > this.maxItems) {
      items[items.length - 1].remove();
    }

    // Track in state
    AppState.activityLog.unshift({ type, text, time });
    if (AppState.activityLog.length > this.maxItems) {
      AppState.activityLog.pop();
    }

    // Remove animation class after it completes
    li.addEventListener('animationend', () => li.classList.remove('activity-item--new'));
  },

  clear() {
    if (!this.list) return;
    // Fade-then-remove
    const items = $$('.activity-item', this.list);
    items.forEach((item, i) => {
      setTimeout(() => {
        item.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(6px)';
        setTimeout(() => item.remove(), 260);
      }, i * 35);
    });
    AppState.activityLog = [];
  },

  _escapeHtml(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  },
};


/* ─────────────────────────────────────────
   11. Module: Quick Links
───────────────────────────────────────── */
const QuickLinkModule = {
  init() {
    const grid = $('.quicklink-grid');
    if (!grid) return;

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.ql-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      this.handleAction(action, btn);
    });
  },

  handleAction(action, btn) {
    // Ripple-like feedback
    btn.style.transform = 'scale(0.94)';
    setTimeout(() => { btn.style.transform = ''; }, 200);

    // Log to activity feed
    const labels = {
      terminal: 'Terminal opened',
      editor:   'Editor opened',
      files:    'File manager opened',
      git:      'Git panel opened',
      docs:     'Docs viewer opened',
      monitor:  'Monitor opened',
    };

    const label = labels[action] || `Launched: ${action}`;
    ActivityModule.push('system', label);

    // TODO: wire to actual app integrations (e.g. IPC, Tauri, Electron)
    console.log(`[lkl001] QuickLink action: ${action}`);
  },
};


/* ─────────────────────────────────────────
   12. Module: Navigation
───────────────────────────────────────── */
const NavModule = {
  init() {
    const navItems = $$('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('nav-item--active'));
        item.classList.add('nav-item--active');

        const page = item.dataset.page;
        console.log(`[lkl001] Navigate to: ${page}`);
        // TODO: Vue Router integration → this.$router.push({ name: page })
      });
    });
  },
};


/* ─────────────────────────────────────────
   13. Init — Bootstrap all modules
───────────────────────────────────────── */

/**
 * DashboardApp
 *
 * Entry point. Initialises all modules in dependency order.
 * When migrating to Vue 3:
 *   - Wrap in createApp() + defineComponent()
 *   - Move module logic to composables (useResource, useClock, etc.)
 *   - Use onMounted / onUnmounted lifecycle hooks
 */
const DashboardApp = {
  modules: [
    ClockModule,
    UptimeModule,
    ResourceModule,
    ChartModule,
    CardModule,
    TooltipModule,
    GoalModule,
    NoteModule,
    ActivityModule,
    QuickLinkModule,
    NavModule,
  ],

  init() {
    console.log(
      '%c lkl001_site · Dashboard v0.3.1 ',
      'background:#161c1a;color:#3d9970;font-family:monospace;padding:4px 8px;border-radius:4px'
    );

    this.modules.forEach(mod => {
      try {
        mod.init();
      } catch (err) {
        console.warn(`[lkl001] Module init failed: ${mod.constructor?.name}`, err);
      }
    });

    console.log('[lkl001] All modules initialised.');
  },

  destroy() {
    this.modules.forEach(mod => {
      if (typeof mod.destroy === 'function') mod.destroy();
    });
  },
};

/* Boot */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
} else {
  DashboardApp.init();
}

/* Expose for debugging / Vue integration */
window.__lkl001__ = { DashboardApp, AppState };