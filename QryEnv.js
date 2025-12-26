/**
 * QryEnv.js v1.2 - Lightweight app environment for Qry.js + PicoCSS + Shoelace + Lucide
 * @author Jean-Luc Bloechle | @license MIT
 */

import $ from './Qry.js';

export class QryEnv {
    #initialized = false;
    #cleanups = [];
    #keys = {};

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
            toastPosition: 'top-right',
            primaryColor: '#005395',
            fontSize: '93.75%',
            storagePrefix: 'qry_',
            ...config
        };
        this.init();
    }

    // Lifecycle
    init() {
        if (this.#initialized) return this;
        this.#initLogger();
        this.#initStorage();
        this.#initFormat();
        this.#initStyles();
        this.#initToast();
        this.#initLoading();
        this.#initConfirm();
        $(document).on('keydown', this.#onKey);
        this.#cleanups.push(() => $(document).off('keydown', this.#onKey));
        $.ready(() => this.refreshIcons());
        this.#initialized = true;
        return this;
    }

    destroy() {
        this.#cleanups.forEach(fn => fn?.());
        ['#qry-toast-container', '#qry-loading', '#qry-confirm', '#qry-styles'].forEach(id => $(id).remove());
        this.#initialized = false;
        this.#cleanups = [];
        return this;
    }

    // Actions
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

    // Events
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

    // API
    async api(url, { method = 'GET', body, headers = {}, loading = false } = {}) {
        this.logger.info(`API ${method} ${url}`);
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
        } catch (e) {
            this.logger.error(`API failed: ${e.message}`);
            throw e;
        } finally {
            if (loading) this.loading(false);
        }
    }

    // WebSocket
    ws(url, handlers = {}) {
        const ws = new WebSocket(url);
        ws.onopen = e => { this.logger.info('WS connected'); handlers.open?.(e, ws); };
        ws.onmessage = e => handlers.message?.(e, ws);
        ws.onclose = e => { this.logger.info(`WS closed: ${e.code}`); handlers.close?.(e, ws); };
        ws.onerror = e => { this.logger.error('WS error'); handlers.error?.(e, ws); };
        return ws;
    }

    // Toast
    success(msg, ms) { this.toast.show('success', msg, ms); return this; }
    error(msg, ms)   { this.toast.show('error', msg, ms ?? 5000); return this; }
    warning(msg, ms) { this.toast.show('warning', msg, ms ?? 4000); return this; }
    info(msg, ms)    { this.toast.show('info', msg, ms); return this; }

    // Theme
    setTheme(t) {
        $('html').attr('data-theme', t).cls(t === 'dark' ? '+sl-theme-dark' : '-sl-theme-dark');
        this.storage.set('theme', t);
        return this;
    }
    toggleTheme() { return this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark'); }
    getTheme() { return $('html').attr('data-theme') || this.storage.get('theme') || 'light'; }

    // Modal
    modal(sel) {
        const el = $(sel).el;
        const m = {
            show: () => { if (el?.showModal) el.showModal(); else el?.show?.(); return m; },
            hide: () => { el?.close?.(); return m; },
            toggle: () => { el?.open ? el.close() : el?.showModal?.(); return m; }
        };
        return m;
    }

    // Loading
    loading(show = true) { $('#qry-loading').cls(show ? '-hide' : '+hide'); return this; }

    // Confirm
    confirm(msg, { title = 'Confirm', ok = 'OK', cancel = 'Cancel', danger = false } = {}) {
        return new Promise(resolve => {
            $('#qry-confirm-title').text(title);
            $('#qry-confirm-msg').text(msg);
            $('#qry-confirm-ok').text(ok).cls(danger ? '+danger' : '-danger');
            $('#qry-confirm-cancel').text(cancel);

            const done = val => { $('#qry-confirm').el.close(); resolve(val); };
            $('#qry-confirm-ok').el.onclick = () => done(true);
            $('#qry-confirm-cancel').el.onclick = () => done(false);
            $('#qry-confirm').el.showModal();
        });
    }

    // Clipboard
    async copy(text) {
        try { await navigator.clipboard.writeText(text); this.success('Copied!'); return true; }
        catch { this.error('Copy failed'); return false; }
    }

    // Download
    download(data, filename) {
        const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return this;
    }

    // Keyboard
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

    // Utils
    debounce(fn, ms = 300) {
        let t;
        return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
    }

    throttle(fn, ms = 300) {
        let last = 0;
        return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn.apply(this, a); } };
    }

    refreshIcons() { try { lucide?.createIcons(); } catch {} }

    // Private: Colors
    #hex2rgba(hex, a) {
        const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
        return `rgba(${r},${g},${b},${a})`;
    }

    #darken(hex, p) {
        const n = parseInt(hex.slice(1), 16), amt = Math.round(2.55 * p);
        const R = Math.max((n >> 16) - amt, 0);
        const G = Math.max((n >> 8 & 0xFF) - amt, 0);
        const B = Math.max((n & 0xFF) - amt, 0);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    // Private: Init
    #initLogger() {
        const levels = ['debug', 'info', 'warn', 'error'];
        const min = levels.indexOf(this.config.logLevel);
        const log = (lvl, args) => {
            if (levels.indexOf(lvl) >= min) {
                const t = new Date().toLocaleTimeString('en-US', { hour12: false });
                console[lvl](`[${this.config.title}] ${t}`, ...args);
            }
        };
        this.logger = {
            debug: (...a) => log('debug', a),
            info:  (...a) => log('info', a),
            warn:  (...a) => log('warn', a),
            error: (...a) => log('error', a),
            table: d => console.table(d)
        };
    }

    #initStorage() {
        const p = this.config.storagePrefix;
        const parse = (v, d) => { try { return v ? JSON.parse(v) : d; } catch { return d; } };
        this.storage = {
            get: (k, d = null) => parse(localStorage.getItem(p + k), d),
            set: (k, v) => { try { localStorage.setItem(p + k, JSON.stringify(v)); return true; } catch { return false; } },
            remove: k => { localStorage.removeItem(p + k); return true; },
            clear: () => { Object.keys(localStorage).filter(k => k.startsWith(p)).forEach(k => localStorage.removeItem(k)); }
        };
    }

    #initFormat() {
        const toDate = d => d instanceof Date ? d : new Date(d);
        const intl = (d, o) => new Intl.DateTimeFormat(undefined, o).format(toDate(d));
        const num = (n, o) => new Intl.NumberFormat(undefined, o).format(n);

        this.format = {
            date: (d, o = {}) => intl(d, { dateStyle: 'medium', ...o }),
            time: (d, o = {}) => intl(d, { timeStyle: 'short', ...o }),
            datetime: (d, o = {}) => intl(d, { dateStyle: 'medium', timeStyle: 'short', ...o }),
            number: (n, o = {}) => num(n, o),
            currency: (n, c = 'CHF', o = {}) => num(n, { style: 'currency', currency: c, ...o }),
            percent: (n, d = 0) => num(n, { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d }),
            bytes: (b, d = 1) => {
                if (!b) return '0 B';
                const i = Math.floor(Math.log(b) / Math.log(1024));
                return +(b / Math.pow(1024, i)).toFixed(d) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
            },
            duration: (ms, short = false) => {
                const abs = Math.abs(ms), s = abs / 1000, m = s / 60, h = m / 60, d = h / 24;
                if (short) {
                    if (s < 60) return `${~~s}s`;
                    if (m < 60) return `${~~m}m ${~~(s % 60)}s`;
                    if (h < 24) return `${~~h}h ${~~(m % 60)}m`;
                    return `${~~d}d ${~~(h % 24)}h`;
                }
                if (s < 60) return `${~~s} sec`;
                if (m < 60) return `${~~m} min ${~~(s % 60)} sec`;
                if (h < 24) return `${~~h}h ${~~(m % 60)}m`;
                return `${~~d}d ${~~(h % 24)}h`;
            },
            relative: d => {
                const diff = Date.now() - toDate(d), abs = Math.abs(diff), s = abs / 1000;
                const future = diff < 0;
                if (s < 60) return future ? 'in a moment' : 'just now';
                if (s < 3600) return future ? `in ${~~(s / 60)}m` : `${~~(s / 60)}m ago`;
                if (s < 86400) return future ? `in ${~~(s / 3600)}h` : `${~~(s / 3600)}h ago`;
                if (s < 604800) return future ? `in ${~~(s / 86400)}d` : `${~~(s / 86400)}d ago`;
                return intl(d, { dateStyle: 'medium' });
            }
        };
    }

    #initStyles() {
        if ($('#qry-styles').exists) return;
        const c = this.config.primaryColor;
        const ch = this.#darken(c, 15);
        const cf = this.#hex2rgba(c, 0.25);
        const pos = { 'top-right': 'top:1rem;right:1rem', 'top-left': 'top:1rem;left:1rem', 'bottom-right': 'bottom:1rem;right:1rem', 'bottom-left': 'bottom:1rem;left:1rem' };

        $('head').append($.create('style', { id: 'qry-styles', html: `
:root{
--pico-border-radius:1rem;
--pico-font-size:${this.config.fontSize};
--pico-primary:${c};--pico-primary-hover:${ch};--pico-primary-focus:${cf};
--pico-primary-background:${c};--pico-primary-hover-background:${ch};
--pico-primary-border:${c};--pico-primary-hover-border:${ch};
--pico-primary-inverse:#fff;
--qry-error:#dc2626;--qry-error-hover:#b91c1c;
--qry-warning:#d97706;--qry-warning-hover:#b45309;
--qry-success:#16a34a;--qry-success-hover:#15803d
}
[data-theme=dark]{--qry-error:#ef4444;--qry-error-hover:#dc2626;--qry-warning:#f59e0b;--qry-warning-hover:#d97706;--qry-success:#22c55e;--qry-success-hover:#16a34a}
header.qry-header{background:linear-gradient(to right,#1e3a8a,${c},#1e3a8a)}
header.qry-header,header.qry-header a,header.qry-header strong{color:#fff}
header.qry-header a:hover{color:#bfdbfe}
header.qry-header [role=button]{--pico-background-color:#fff;--pico-color:${c}}
button.secondary,input[type=button].secondary{--pico-background-color:#64748b;--pico-border-color:#64748b;--pico-color:#fff}
button.secondary:hover,input[type=button].secondary:hover{--pico-background-color:#475569;--pico-border-color:#475569}
button.danger,input[type=button].danger{--pico-background-color:var(--qry-error);--pico-border-color:var(--qry-error);--pico-color:#fff}
button.danger:hover,input[type=button].danger:hover{--pico-background-color:var(--qry-error-hover);--pico-border-color:var(--qry-error-hover)}
button.warning,input[type=button].warning{--pico-background-color:var(--qry-warning);--pico-border-color:var(--qry-warning);--pico-color:#fff}
button.warning:hover,input[type=button].warning:hover{--pico-background-color:var(--qry-warning-hover);--pico-border-color:var(--qry-warning-hover)}
button.success,input[type=button].success{--pico-background-color:var(--qry-success);--pico-border-color:var(--qry-success);--pico-color:#fff}
button.success:hover,input[type=button].success:hover{--pico-background-color:var(--qry-success-hover);--pico-border-color:var(--qry-success-hover)}
#qry-toast-container{position:fixed;${pos[this.config.toastPosition]};z-index:9999;display:flex;flex-direction:column;gap:.5rem;max-width:22rem}
.qry-toast{display:flex;align-items:center;gap:.75rem;padding:.875rem 1rem;border-radius:1rem;background:var(--pico-card-background-color);border:1px solid var(--pico-muted-border-color);box-shadow:0 10px 15px -3px rgb(0 0 0/.1);transform:translateX(100%);opacity:0;transition:all .3s}
.qry-toast.show{transform:translateX(0);opacity:1}
.qry-toast.hide{transform:translateX(100%);opacity:0}
.qry-toast-icon{flex-shrink:0;width:1.25rem;height:1.25rem}
.qry-toast-msg{flex:1;font-size:.875rem}
.qry-toast-close{background:0;border:0;padding:.25rem;cursor:pointer;opacity:.5;color:inherit}
.qry-toast-close:hover{opacity:1}
.qry-toast.success{border-left:4px solid var(--qry-success)}.qry-toast.success .qry-toast-icon{color:var(--qry-success)}
.qry-toast.error{border-left:4px solid var(--qry-error)}.qry-toast.error .qry-toast-icon{color:var(--qry-error)}
.qry-toast.warning{border-left:4px solid var(--qry-warning)}.qry-toast.warning .qry-toast-icon{color:var(--qry-warning)}
.qry-toast.info{border-left:4px solid var(--pico-primary)}.qry-toast.info .qry-toast-icon{color:var(--pico-primary)}
#qry-loading{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10000;transition:opacity .2s}
#qry-loading.hide{opacity:0;pointer-events:none}
#qry-loading .spinner{width:3rem;height:3rem;border:3px solid var(--pico-muted-border-color);border-top-color:var(--pico-primary);border-radius:50%;animation:qry-spin .8s linear infinite}
@keyframes qry-spin{to{transform:rotate(360deg)}}
#qry-confirm{border:0;border-radius:1rem;padding:0;max-width:24rem;box-shadow:0 25px 50px -12px rgb(0 0 0/.25)}
#qry-confirm::backdrop{background:rgba(0,0,0,.5);backdrop-filter:blur(2px)}
#qry-confirm article{margin:0}
#qry-confirm footer{display:flex;gap:.5rem;justify-content:flex-end}
#qry-confirm-ok.danger{--pico-background-color:var(--qry-error);--pico-border-color:var(--qry-error)}
#qry-confirm-ok.danger:hover{--pico-background-color:var(--qry-error-hover);--pico-border-color:var(--qry-error-hover)}
`}));
    }

    #initToast() {
        if (!$('#qry-toast-container').exists) $('body').append('<div id="qry-toast-container"></div>');
        const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };

        this.toast.show = (type, msg, ms = this.config.toastDuration) => {
            if (!msg) return;
            const id = `toast-${Date.now()}`;
            $('#qry-toast-container').append(`
                <div id="${id}" class="qry-toast ${type}">
                    <i data-lucide="${icons[type]}" class="qry-toast-icon"></i>
                    <span class="qry-toast-msg">${msg}</span>
                    <button class="qry-toast-close"><i data-lucide="x" style="width:1rem;height:1rem"></i></button>
                </div>`);
            this.refreshIcons();
            const t = $(`#${id}`);
            const close = () => { if (t.exists) { t.cls('-show +hide'); setTimeout(() => t.remove(), 300); } };
            t.find('.qry-toast-close').on('click', close);
            setTimeout(() => t.cls('+show'), 10);
            setTimeout(close, ms);
        };
    }

    #initLoading() {
        if (!$('#qry-loading').exists) $('body').append('<div id="qry-loading" class="hide"><div class="spinner"></div></div>');
    }

    #initConfirm() {
        if (!$('#qry-confirm').exists) $('body').append(`
            <dialog id="qry-confirm"><article>
                <header><h3 id="qry-confirm-title">Confirm</h3></header>
                <p id="qry-confirm-msg"></p>
                <footer><button id="qry-confirm-cancel" class="secondary">Cancel</button><button id="qry-confirm-ok">OK</button></footer>
            </article></dialog>`);
    }
}

export default QryEnv;