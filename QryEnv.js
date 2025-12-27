/**
 * QryEnv.js v2.0 - Generic webapp bootstrapper
 * Qry.js + PicoCSS + Lucide
 * @author Jean-Luc Bloechle & Claude.ai | @license MIT
 */

import $ from './Qry.js';

export class QryEnv {
    #init = false;
    #cleanups = [];
    #keys = {};
    #state = {};
    #watch = {};

    config = {};
    toast = {};
    logger = {};
    storage = {};
    format = {};

    constructor(config = {}) {
        this.config = {
            title: 'QryEnv',
            logLevel: 'info',
            toastDuration: 3000,
            primaryColor: '#00205B',
            storagePrefix: 'qry_',
            ...config
        };
        this.#setup();
    }

    // === LIFECYCLE ===

    #setup() {
        if (this.#init) return;
        this.#initLogger();
        this.#initStorage();
        this.#initFormat();
        this.#initStyles();
        this.#initTheme();
        $(document).on('keydown', this.#onKey);
        this.#cleanups.push(() => $(document).off('keydown', this.#onKey));
        $.ready(() => this.icons());
        this.#init = true;
    }

    destroy() {
        this.#cleanups.forEach(fn => fn?.());
        ['#qry-toast', '#qry-loading', '#qry-confirm', '#qry-styles'].forEach(id => $(id).remove());
        this.#init = false;
        this.#cleanups = [];
    }

    // === STATE ===

    get(key, def = null) { return key in this.#state ? this.#state[key] : def; }

    set(key, val) {
        const old = this.#state[key];
        this.#state[key] = val;
        (this.#watch[key] || []).forEach(fn => fn(val, old));
        return this;
    }

    watch(key, fn) {
        (this.#watch[key] ??= []).push(fn);
        return () => { this.#watch[key] = this.#watch[key].filter(f => f !== fn); };
    }

    update(obj) { Object.entries(obj).forEach(([k, v]) => this.set(k, v)); return this; }

    // === ACTIONS ===

    async action(name, fn, { toast = true, loading = false } = {}) {
        this.logger.info(`Action: ${name}`);
        if (loading) this.loading(true);
        try {
            const result = await fn();
            if (toast) this.success(typeof toast === 'string' ? toast : name);
            return result;
        } catch (e) {
            this.error(`${name}: ${e.message}`);
            throw e;
        } finally {
            if (loading) this.loading(false);
        }
    }

    // === EVENTS ===

    bind(sel, evt = 'click', fn) {
        const el = $(sel);
        el.on(evt, fn);
        this.#cleanups.push(() => el.off(evt, fn));
        return this;
    }

    bindAll(map) {
        for (const [sel, fn] of Object.entries(map)) {
            this.bind(sel, 'click', typeof fn === 'function' ? fn : () => this[fn]?.());
        }
        return this;
    }

    keyboard(key, fn, { ctrl, shift, alt, prevent = true } = {}) {
        const id = `${ctrl ? 'c-' : ''}${shift ? 's-' : ''}${alt ? 'a-' : ''}${key.toLowerCase()}`;
        this.#keys[id] = { fn, prevent };
        return this;
    }

    #onKey = e => {
        const id = `${e.ctrlKey ? 'c-' : ''}${e.shiftKey ? 's-' : ''}${e.altKey ? 'a-' : ''}${e.key.toLowerCase()}`;
        const k = this.#keys[id];
        if (k) { if (k.prevent) e.preventDefault(); k.fn(e); }
    };

    // === API ===

    async api(url, { method = 'GET', body, headers = {}, loading = false } = {}) {
        if (loading) this.loading(true);
        try {
            const cfg = { method, headers };
            if (body) {
                cfg.body = typeof body === 'string' ? body : JSON.stringify(body);
                cfg.headers['Content-Type'] ??= 'application/json';
            }
            const res = await fetch(url, cfg);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } finally {
            if (loading) this.loading(false);
        }
    }

    ws(url, h = {}) {
        const ws = new WebSocket(url);
        ws.onopen = e => h.open?.(e, ws);
        ws.onmessage = e => h.message?.(e, ws);
        ws.onclose = e => h.close?.(e, ws);
        ws.onerror = e => h.error?.(e, ws);
        return ws;
    }

    // === TOAST ===

    success(msg, ms) { this.#toast('success', msg, ms); return this; }
    error(msg, ms) { this.#toast('error', msg, ms ?? 5000); return this; }
    warning(msg, ms) { this.#toast('warning', msg, ms ?? 4000); return this; }
    info(msg, ms) { this.#toast('info', msg, ms); return this; }

    #toast(type, msg, ms = this.config.toastDuration) {
        if (!msg) return;
        if (!$('#qry-toast').exists) $('body').append('<div id="qry-toast"></div>');
        const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
        const id = 't' + Date.now();
        $('#qry-toast').append(`<div id="${id}" class="qry-toast ${type}"><i data-lucide="${icons[type]}"></i><span>${msg}</span><button onclick="this.parentElement.remove()">×</button></div>`);
        this.icons();
        const t = $(`#${id}`);
        setTimeout(() => t.cls('+show'), 10);
        setTimeout(() => t.remove(), ms);
    }

    // === THEME ===

    setTheme(t) { $('html').attr('data-theme', t); this.storage.set('theme', t); return this; }
    toggleTheme() { return this.setTheme(this.isDark() ? 'light' : 'dark'); }
    getTheme() { return $('html').attr('data-theme') || 'light'; }
    isDark() { return this.getTheme() === 'dark'; }

    #initTheme() {
        const saved = this.storage.get('theme');
        this.setTheme(saved || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));
    }

    // === DIALOGS ===

    modal(sel) {
        const el = $(sel).el;
        return {
            show: () => { el?.showModal?.(); return this; },
            hide: () => { el?.close?.(); return this; }
        };
    }

    loading(show = true) {
        if (!$('#qry-loading').exists) {
            $('body').append('<dialog id="qry-loading"><div class="spinner"></div></dialog>');
        }
        const el = $('#qry-loading').el;
        show ? el.showModal() : el.close();
        return this;
    }

    confirm(msg, { title = 'Confirm', ok = 'OK', cancel = 'Cancel', danger = false } = {}) {
        return new Promise(resolve => {
            if (!$('#qry-confirm').exists) {
                $('body').append(`
                    <dialog id="qry-confirm">
                        <article>
                            <h3 id="qry-confirm-title"></h3>
                            <p id="qry-confirm-msg"></p>
                            <footer>
                                <button id="qry-confirm-cancel" class="secondary"></button>
                                <button id="qry-confirm-ok"></button>
                            </footer>
                        </article>
                    </dialog>
                `);
            }
            $('#qry-confirm-title').text(title);
            $('#qry-confirm-msg').text(msg);
            $('#qry-confirm-ok').text(ok).attr('class', danger ? 'danger' : '');
            $('#qry-confirm-cancel').text(cancel);
            const d = $('#qry-confirm').el;
            const done = v => { d.close(); resolve(v); };
            $('#qry-confirm-ok').el.onclick = () => done(true);
            $('#qry-confirm-cancel').el.onclick = () => done(false);
            d.showModal();
        });
    }

    // === FORMS ===

    formData(sel) {
        const form = $(sel).el;
        if (!form) return {};
        const obj = {};
        new FormData(form).forEach((v, k) => obj[k] = k in obj ? [].concat(obj[k], v) : v);
        return obj;
    }

    formReset(sel) { $(sel).el?.reset?.(); return this; }

    formValidate(sel, rules = {}) {
        const data = this.formData(sel);
        const errors = {};
        for (const [field, check] of Object.entries(rules)) {
            const val = data[field];
            if (typeof check === 'function') {
                const err = check(val, data);
                if (err) errors[field] = err;
            } else if (check === 'required' && !val?.toString().trim()) {
                errors[field] = 'Required';
            } else if (check === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                errors[field] = 'Invalid email';
            }
        }
        return { valid: !Object.keys(errors).length, errors, data };
    }

    // === DROP ZONE ===

    dropZone(sel, { onDrop, onEnter, onLeave, accept = '*' } = {}) {
        const el = $(sel);
        el.on('dragover', e => e.preventDefault());
        el.on('dragenter', e => { e.preventDefault(); onEnter?.(e); });
        el.on('dragleave', e => { e.preventDefault(); if (!el.el.contains(e.relatedTarget)) onLeave?.(e); });
        el.on('drop', e => {
            e.preventDefault();
            onLeave?.(e);
            let files = Array.from(e.dataTransfer.files);
            if (accept !== '*') files = files.filter(f => accept.split(',').some(x => f.name.toLowerCase().endsWith(x.trim())));
            onDrop?.(files, e);
        });
        return this;
    }

    // === UTILITIES ===

    uid(p = 'id') { return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }
    debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
    throttle(fn, ms = 300) { let last = 0; return (...a) => { if (Date.now() - last >= ms) { last = Date.now(); fn(...a); } }; }
    icons() { try { lucide?.createIcons(); } catch {} return this; }
    sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async copy(text) {
        try { await navigator.clipboard.writeText(text); this.success('Copied!'); return true; }
        catch { this.error('Copy failed'); return false; }
    }

    download(data, filename, type = 'text/plain') {
        const blob = data instanceof Blob ? data : new Blob([data], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        return this;
    }

    print(sel, { title = document.title } = {}) {
        const el = $(sel).el;
        if (!el) return this;
        const w = window.open('', '', 'width=800,height=600');
        w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:system-ui;padding:2rem}</style></head><body>${el.outerHTML}</body></html>`);
        w.document.close();
        w.print();
        w.close();
        return this;
    }

    // === INIT HELPERS ===

    #initLogger() {
        const levels = ['debug', 'info', 'warn', 'error'];
        const min = levels.indexOf(this.config.logLevel);
        this.logger = Object.fromEntries(levels.map(l => [l, (...a) => {
            if (levels.indexOf(l) >= min) console[l](`[${this.config.title}]`, ...a);
        }]));
        this.logger.table = d => console.table(d);
    }

    #initStorage() {
        const p = this.config.storagePrefix;
        this.storage = {
            get: (k, d = null) => { try { const v = localStorage.getItem(p + k); return v ? JSON.parse(v) : d; } catch { return d; } },
            set: (k, v) => { localStorage.setItem(p + k, JSON.stringify(v)); return this; },
            remove: k => { localStorage.removeItem(p + k); return this; },
            clear: () => Object.keys(localStorage).filter(k => k.startsWith(p)).forEach(k => localStorage.removeItem(k)),
            keys: () => Object.keys(localStorage).filter(k => k.startsWith(p)).map(k => k.slice(p.length))
        };
    }

    #initFormat() {
        const d2d = d => d instanceof Date ? d : new Date(d);
        this.format = {
            date: d => d2d(d).toLocaleDateString(),
            time: d => d2d(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            datetime: d => d2d(d).toLocaleString(),
            number: n => n.toLocaleString(),
            currency: (n, c = 'CHF') => n.toLocaleString(undefined, { style: 'currency', currency: c }),
            percent: (n, d = 0) => n.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: d }),
            bytes: b => { const i = b ? Math.floor(Math.log(b) / Math.log(1024)) : 0; return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i]; },
            duration: ms => { const s = ~~(ms / 1000); return s < 60 ? `${s}s` : s < 3600 ? `${~~(s / 60)}m` : `${~~(s / 3600)}h`; },
            relative: d => { const s = ~~((Date.now() - d2d(d)) / 1000); return s < 60 ? 'now' : s < 3600 ? `${~~(s / 60)}m ago` : s < 86400 ? `${~~(s / 3600)}h ago` : `${~~(s / 86400)}d ago`; }
        };
    }

    #initStyles() {
        if ($('#qry-styles').exists) return;
        const c = this.config.primaryColor;
        $('head').append($.create('style', { id: 'qry-styles', html: `
:root{--pico-border-radius:1rem;--qry-primary:${c};--qry-success:#16a34a;--qry-warning:#d97706;--qry-error:#dc2626;--qry-surface:#fff;--qry-border:#e2e8f0;--qry-text:#0f172a;--qry-muted:#64748b;--qry-overlay:rgba(0,0,0,.5)}
[data-theme=dark]{--qry-surface:#1e293b;--qry-border:#334155;--qry-text:#f1f5f9;--qry-muted:#94a3b8;--qry-overlay:rgba(0,0,0,.7)}

#qry-toast{position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem}
.qry-toast{display:flex;align-items:center;gap:.5rem;padding:.75rem 1rem;background:var(--qry-surface);border:1px solid var(--qry-border);border-radius:1rem;box-shadow:0 4px 12px rgba(0,0,0,.1);transform:translateX(110%);transition:transform .3s}
.qry-toast.show{transform:translateX(0)}
.qry-toast i{width:1.25rem;height:1.25rem;flex-shrink:0}
.qry-toast span{flex:1;font-size:.9rem;color:var(--qry-text)}
.qry-toast button{background:0;border:0;font-size:1.25rem;cursor:pointer;opacity:.5;padding:0 0 0 .5rem;color:var(--qry-text)}
.qry-toast button:hover{opacity:1}
.qry-toast.success{border-left:4px solid var(--qry-success)}.qry-toast.success i{color:var(--qry-success)}
.qry-toast.error{border-left:4px solid var(--qry-error)}.qry-toast.error i{color:var(--qry-error)}
.qry-toast.warning{border-left:4px solid var(--qry-warning)}.qry-toast.warning i{color:var(--qry-warning)}
.qry-toast.info{border-left:4px solid var(--qry-primary)}.qry-toast.info i{color:var(--qry-primary)}

#qry-loading{border:0;border-radius:1rem;background:var(--qry-overlay)}
#qry-loading::backdrop{background:transparent}
#qry-loading .spinner{width:2.5rem;height:2.5rem;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

#qry-confirm>article{max-width:24rem;border-radius:1rem}
#qry-confirm h3{margin-bottom:.5rem}
#qry-confirm p{color:var(--qry-muted)}
#qry-confirm footer{margin-top:1rem}
#qry-confirm .danger{--pico-background-color:var(--qry-error);--pico-border-color:var(--qry-error)}

.qry-hide{display:none!important}
`}));
    }
}

export default QryEnv;