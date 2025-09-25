/**
 * QryApp.js - Ultra-lightweight application framework
 * Built for Qry.js following DRY/KISS principles
 *
 * @version 2.0.0
 * @author QryApp Team
 * @license MIT
 *
 * FEATURES:
 * - Generic API/WebSocket helpers with flexible callbacks
 * - Batch event binding with auto-cleanup and shortcuts
 * - Automatic action tracking and performance timing
 * - Toast notifications with structured logging
 * - Chainable status management
 *
 * PHILOSOPHY:
 * - Provides structure and common patterns
 * - Maximum flexibility through callbacks
 * - No assumptions about specific UI elements
 * - Easy to extend for any use case
 */

import $ from './Qry.js';

export class QryApp {
    config = {};
    toast = {};
    logger = {};

    #initialized = false;
    #cleanups = [];
    #actionCount = 0;
    #startTime = performance.now();

    constructor(config = {}) {
        this.config = {
            title: 'QryApp',
            version: '2.0.0',
            autoInit: true,
            logLevel: 'info',
            toastDuration: 3000,
            enableDevMode: true,
            autoRefreshIcons: true,
            trackActions: true,
            ...config
        };

        if (this.config.autoInit) this.init();
    }

    // === LIFECYCLE MANAGEMENT ===

    init() {
        if (this.#initialized) return this;

        this.#initLucide();
        this.#initToast();
        this.#initLogger();
        this.#initHelpers();

        this.#initialized = true;
        this.success(`${this.config.title} ready`);
        return this;
    }

    destroy() {
        this.#cleanups.forEach(cleanup => cleanup?.());
        $('#toast-container').remove();

        this.#initialized = false;
        this.#cleanups = [];
        this.info('QryApp destroyed');
        return this;
    }

    // === HIGH-LEVEL API FOR EXTENDING CLASSES ===

    /**
     * Execute action with automatic tracking, logging, and toast
     * @param {string} name - Action name
     * @param {Function} fn - Action function
     * @param {Object} options - { toast?, log?, level? }
     */
    async action(name, fn, options = {}) {
        if (this.config.trackActions) this.#actionCount++;

        const opts = { toast: true, log: true, level: 'info', ...options };

        if (opts.log) this.logger[opts.level](`Action: ${name}`);

        try {
            const result = await fn();

            if (opts.toast && typeof opts.toast === 'string') {
                this.success(opts.toast);
            } else if (opts.toast === true) {
                this.success(`${name} completed`);
            }

            this.#updateStats();
            return result;

        } catch (error) {
            this.error(`${name} failed: ${error.message}`);
            this.logger.error(`Action failed: ${name}`, error);
            throw error;
        }
    }

    /**
     * Bind event with auto cleanup and optional action tracking
     * @param {string} selector - Element selector
     * @param {string} event - Event name (default: 'click')
     * @param {Function|string} handler - Handler function or action name
     * @param {Object} options - Action options if handler is string
     */
    bind(selector, event = 'click', handler, options = {}) {
        const element = $(selector);

        if (typeof handler === 'string') {
            const actionName = handler;
            handler = () => this.action(actionName, options.fn || (() => {}), options);
        }

        element.on(event, handler);
        this.#cleanups.push(() => element.off(event, handler));

        if (this.config.autoRefreshIcons) {
            setTimeout(() => this.refreshIcons(), 0);
        }

        return this;
    }

    /**
     * Batch bind multiple events with flexible patterns
     * @param {Object} bindings - { selector: handler } or { selector: { event, handler, options } }
     */
    bindAll(bindings) {
        Object.entries(bindings).forEach(([selector, config]) => {
            if (typeof config === 'function') {
                // Simple function handler
                this.bind(selector, 'click', config);
            } else if (typeof config === 'string') {
                // Method name shortcut: '#btn': 'methodName' or '#btn': '#methodName'
                const methodName = config.startsWith('#') ? config.slice(1) : config;
                this.bind(selector, 'click', () => this[methodName]?.());
            } else {
                // Full configuration object
                const { event = 'click', handler, ...options } = config;
                this.bind(selector, event, handler, options);
            }
        });
        return this;
    }

    /**
     * Generic API call with flexible callback handling
     * @param {string} url - API endpoint
     * @param {Object} options - { method?, body?, headers?, onStart?, onSuccess?, onError?, onFinally? }
     */
    async api(url, options = {}) {
        const {
            method = 'GET',
            body,
            headers = {},
            onStart,
            onSuccess,
            onError,
            onFinally
        } = options;

        const label = `API ${method} ${url}`;
        this.time(label);
        this.logger.info(`API call started: ${method} ${url}`);

        onStart?.(url, { method, body, headers });

        try {
            const config = { method, headers };
            if (body) {
                config.body = typeof body === 'string' ? body : JSON.stringify(body);
                if (!headers['Content-Type']) {
                    config.headers['Content-Type'] = 'application/json';
                }
            }

            const res = await fetch(url, config);
            const data = await res.json();

            this.timeEnd(label);
            this.logger.info(`API call successful: ${method} ${url}`, { status: res.status });

            const result = onSuccess?.(data, res) || data;
            return result;

        } catch (error) {
            this.logger.error(`API call failed: ${method} ${url}`, { error: error.message });
            onError?.(error, url, { method, body, headers });
            throw error;

        } finally {
            onFinally?.(url, { method, body, headers });
        }
    }

    /**
     * Generic WebSocket helper with flexible callback handling
     * @param {string} url - WebSocket URL
     * @param {Object} options - { onOpen?, onMessage?, onClose?, onError?, onStart? }
     */
    websocket(url, options = {}) {
        const { onOpen, onMessage, onClose, onError, onStart } = options;

        this.logger.info('WebSocket connection attempt', { url });
        onStart?.(url);

        const ws = new WebSocket(url);

        ws.onopen = (e) => {
            this.logger.info('WebSocket connected successfully');
            onOpen?.(e, ws);
        };

        ws.onmessage = (e) => {
            this.logger.debug('WebSocket message received', { data: e.data });
            onMessage?.(e, ws);
        };

        ws.onclose = (e) => {
            this.logger.info('WebSocket closed', {
                code: e.code,
                reason: e.reason || 'No reason provided',
                wasClean: e.wasClean
            });
            onClose?.(e, ws);
        };

        ws.onerror = (e) => {
            this.logger.error('WebSocket error occurred', { error: e.type });
            onError?.(e, ws);
        };

        return ws;
    }

    // === UTILITY METHODS ===

    /**
     * Update element status with badge styling
     * @param {string} selector - Element selector
     * @param {string} status - Status text
     * @param {string} type - Badge type: 'wait', 'ok', 'err'
     */
    status(selector, status, type = 'ok') {
        $(selector)
            .text(status)
            .cls('-badge-wait -badge-ok -badge-err +badge-' + type);
        return this;
    }

    /**
     * Create element with auto icon refresh
     */
    create(tag, props = {}) {
        const element = $.create(tag, props);
        if (this.config.autoRefreshIcons) {
            setTimeout(() => this.refreshIcons(), 0);
        }
        return element;
    }

    refreshIcons() {
        if (typeof lucide !== 'undefined' && lucide?.createIcons) {
            try {
                lucide.createIcons();
            } catch (error) {
                // Silently handle icon refresh failures
            }
        }
    }

    // === SHORTCUT METHODS (Combined toast + logging) ===

    success(msg, duration) {
        this.toast.success(msg, duration);
        this.logger.info('SUCCESS: ' + msg);
        return this;
    }

    error(msg, duration) {
        this.toast.error(msg, duration);
        this.logger.error('ERROR: ' + msg);
        return this;
    }

    warning(msg, duration) {
        this.toast.warning(msg, duration);
        this.logger.warn('WARNING: ' + msg);
        return this;
    }

    info(msg, duration) {
        this.toast.info(msg, duration);
        this.logger.info('INFO: ' + msg);
        return this;
    }

    // === PERFORMANCE TRACKING ===

    time(label) {
        this.logger.time(label);
        return this;
    }

    timeEnd(label) {
        this.logger.timeEnd(label);
        return this;
    }

    // === PRIVATE INITIALIZATION METHODS ===

    #updateStats() {
        if (this.config.trackActions && $('#stats').exists) {
            $('#stats').text(`${this.#actionCount} actions performed`);
        }
    }

    #initHelpers() {
        if ($('#load-time').exists) {
            const loadTime = (performance.now() - this.#startTime).toFixed(2);
            $('#load-time').text(`${loadTime}ms`);
        }
    }

    #initLucide() {
        $.ready(() => this.refreshIcons());
    }

    #initToast() {
        if (!$('#toast-container').exists) {
            $('body').append($.create('div', {
                id: 'toast-container',
                class: 'fixed top-4 right-4 z-50 space-y-2'
            }));
        }

        const show = (type, message, duration = this.config.toastDuration) => {
            if (!message) return;

            const toastId = `toast-${Date.now()}`;
            const config = {
                success: {
                    icon: 'check-circle',
                    iconColor: 'text-green-500',
                    iconBg: 'bg-green-100',
                    toastBg: 'bg-green-50',
                    textColor: 'text-green-800',
                    border: 'border-green-200'
                },
                error: {
                    icon: 'x-circle',
                    iconColor: 'text-red-500',
                    iconBg: 'bg-red-100',
                    toastBg: 'bg-red-50',
                    textColor: 'text-red-800',
                    border: 'border-red-200'
                },
                warning: {
                    icon: 'alert-triangle',
                    iconColor: 'text-orange-500',
                    iconBg: 'bg-orange-100',
                    toastBg: 'bg-orange-50',
                    textColor: 'text-orange-800',
                    border: 'border-orange-200'
                },
                info: {
                    icon: 'info',
                    iconColor: 'text-blue-500',
                    iconBg: 'bg-blue-100',
                    toastBg: 'bg-blue-50',
                    textColor: 'text-blue-800',
                    border: 'border-blue-200'
                }
            }[type];

            $('#toast-container').append(`
                <div id="${toastId}" class="flex items-center w-full max-w-xs p-4 ${config.toastBg} ${config.border} border rounded-lg shadow-lg transform translate-x-full opacity-0 transition-all duration-300" role="alert">
                    <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${config.iconColor} ${config.iconBg} rounded-lg">
                        <i data-lucide="${config.icon}" class="w-4 h-4"></i>
                    </div>
                    <div class="ms-3 text-sm font-medium ${config.textColor}">${message}</div>
                    <button type="button" class="ms-auto -mx-1.5 -my-1.5 ${config.toastBg} ${config.textColor} hover:${config.iconBg} rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 opacity-70 hover:opacity-100 transition-opacity" data-dismiss="${toastId}">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </div>
            `);

            const toast = $(`#${toastId}`);
            this.refreshIcons();

            toast.find(`[data-dismiss="${toastId}"]`).click(() => this.#removeToast(toastId));

            setTimeout(() => toast.cls('-translate-x-full -opacity-0 +translate-x-0 +opacity-100'), 50);
            setTimeout(() => this.#removeToast(toastId), duration);
        };

        this.toast = {
            success: (msg, dur) => show('success', msg, dur),
            error: (msg, dur) => show('error', msg, dur || 5000),
            warning: (msg, dur) => show('warning', msg, dur || 4000),
            info: (msg, dur) => show('info', msg, dur)
        };
    }

    #removeToast(toastId) {
        const toast = $(`#${toastId}`);
        if (toast.exists) {
            toast.cls('+translate-x-full +opacity-0');
            setTimeout(() => toast.remove(), 300);
        }
    }

    #initLogger() {
        const levels = ['debug', 'info', 'warn', 'error'];
        const configLevelIndex = levels.indexOf(this.config.logLevel);

        const shouldLog = (level) => {
            const logLevelIndex = levels.indexOf(level);
            return logLevelIndex >= configLevelIndex;
        };

        const log = (level, args) => {
            if (!shouldLog(level)) return;

            const timestamp = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                fractionalSecondDigits: 3
            });

            const prefix = `[${this.config.title}] ${timestamp}`;

            if (args.length > 1 && args.some(arg => typeof arg === 'object' && arg !== null)) {
                console.group(`${prefix} ${args[0]}`);
                args.slice(1).forEach(arg => console[level](arg));
                console.groupEnd();
            } else {
                console[level](prefix, ...args);
            }
        };

        this.logger = {
            debug: (...args) => log('debug', args),
            info: (...args) => log('info', args),
            warn: (...args) => log('warn', args),
            error: (...args) => log('error', args),
            group: (name) => console.group(`[${this.config.title}] ${name}`),
            groupEnd: () => console.groupEnd(),
            table: (data) => shouldLog('info') && console.table(data),
            time: (label) => console.time(`[${this.config.title}] ${label}`),
            timeEnd: (label) => console.timeEnd(`[${this.config.title}] ${label}`)
        };
    }
}