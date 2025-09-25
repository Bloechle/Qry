/**
 * Qry.js - Ultra-lightweight DOM manipulation library
 * Optimized for minimal verbosity and maximum performance
 *
 * @version 1.1.0
 * @author JavaWeb Project
 * @license MIT
 */

class Qry {
    #element = null;
    #elements = [];
    #isCollection = false;
    #doc = null;

    constructor(selector = document.documentElement, doc = document) {
        this.#doc = doc;

        if (!selector || selector === document.documentElement) {
            this.#element = this.#doc.documentElement;
            return;
        }

        // Handle different input types
        if (selector instanceof HTMLElement || selector instanceof SVGElement) {
            this.#element = selector;
        } else if (selector instanceof Qry) {
            return selector;
        } else if (typeof selector === 'string') {
            // ID selector (fastest)
            if (selector.startsWith('#')) {
                this.#element = this.#doc.getElementById(selector.slice(1));
            } else if (selector.includes(',') || selector.includes(' ') || selector.includes('.') || selector.includes('[')) {
                // Complex selector - could return multiple elements
                const elements = Array.from(this.#doc.querySelectorAll(selector));
                if (elements.length === 1) {
                    this.#element = elements[0];
                } else if (elements.length > 1) {
                    this.#elements = elements;
                    this.#isCollection = true;
                } else {
                    this.#element = null;
                }
            } else {
                // Simple tag name
                const element = this.#doc.querySelector(selector);
                this.#element = element;
            }
        }
    }

    // Main selector method (like jex.$)
    $(selector) {
        return new Qry(selector, this.#doc);
    }

    // Core element access
    get el() {
        return this.#element;
    }

    get els() {
        return this.#isCollection ? this.#elements : (this.#element ? [this.#element] : []);
    }

    get exists() {
        return this.#isCollection ? this.#elements.length > 0 : this.#element !== null;
    }

    // Private helper for collection operations
    #each(fn) {
        if (this.#isCollection) {
            this.#elements.forEach(fn);
        } else if (this.#element) {
            fn(this.#element);
        }
        return this;
    }

    // Text content
    text(content) {
        if (content === undefined) {
            return this.#element ? this.#element.textContent : '';
        }
        this.#each(el => el.textContent = content);
        return this;
    }

    // HTML content
    html(content) {
        if (content === undefined) {
            return this.#element ? this.#element.innerHTML : '';
        }
        this.#each(el => el.innerHTML = content);
        return this;
    }

    // Classes - ultra-concise syntax
    cls(classes) {
        if (!classes) return this;

        const tokens = classes.split(' ').filter(Boolean);
        let queryResult = undefined;

        this.#each(el => {
            tokens.forEach(cls => {
                const action = cls[0];
                const name = cls.slice(1) || cls;

                switch (action) {
                    case '+': el.classList.add(name); break;
                    case '-': el.classList.remove(name); break;
                    case '~': el.classList.toggle(name); break;
                    case '?':
                        // Return boolean for first element only
                        if (queryResult === undefined) {
                            queryResult = el.classList.contains(name);
                        }
                        break;
                    default: el.classList.add(cls); break;
                }
            });
        });

        return queryResult !== undefined ? queryResult : this;
    }

    // Attributes
    attr(name, value) {
        if (typeof name === 'object') {
            Object.entries(name).forEach(([k, v]) => this.attr(k, v));
            return this;
        }

        if (value === undefined) {
            return this.#element ? this.#element.getAttribute(name) : null;
        }

        this.#each(el => {
            if (value === null) {
                el.removeAttribute(name);
            } else {
                el.setAttribute(name, value);
            }
        });
        return this;
    }

    // Styles
    css(prop, value) {
        if (typeof prop === 'object') {
            Object.entries(prop).forEach(([k, v]) => this.css(k, v));
            return this;
        }

        if (value === undefined) {
            return this.#element ? getComputedStyle(this.#element)[prop] : '';
        }

        this.#each(el => el.style[prop] = value);
        return this;
    }

    // Events - minimal syntax
    on(event, handler, options) {
        this.#each(el => el.addEventListener(event, handler, options));
        return this;
    }

    off(event, handler) {
        this.#each(el => el.removeEventListener(event, handler));
        return this;
    }

    // Click shorthand
    click(handler) {
        if (!handler) {
            this.#element?.click();
            return this;
        }
        return this.on('click', handler);
    }

    // DOM manipulation
    append(content) {
        this.#each(el => {
            if (content instanceof Qry) {
                if (content.#isCollection) {
                    content.#elements.forEach(child => el.appendChild(child));
                } else if (content.#element) {
                    el.appendChild(content.#element);
                }
            } else if (content instanceof HTMLElement) {
                el.appendChild(content);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('beforeend', content);
            }
        });
        return this;
    }

    prepend(content) {
        this.#each(el => {
            if (content instanceof Qry) {
                if (content.#isCollection) {
                    content.#elements.reverse().forEach(child => el.insertBefore(child, el.firstChild));
                } else if (content.#element) {
                    el.insertBefore(content.#element, el.firstChild);
                }
            } else if (content instanceof HTMLElement) {
                el.insertBefore(content, el.firstChild);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('afterbegin', content);
            }
        });
        return this;
    }

    remove() {
        this.#each(el => el.remove());
        return this;
    }

    // Value for form elements
    val(value) {
        if (value === undefined) {
            return this.#element ? this.#element.value : '';
        }
        this.#each(el => el.value = value);
        return this;
    }

    // Visibility
    show() {
        this.#each(el => el.style.display = '');
        return this;
    }

    hide() {
        this.#each(el => el.style.display = 'none');
        return this;
    }

    // Find children
    find(selector) {
        if (!this.#element) return new Qry(null, this.#doc);
        return new Qry(selector.startsWith('#') ?
            this.#element.querySelector(selector) :
            this.#element.querySelectorAll(selector), this.#doc
        );
    }

    // Create new element
    create(tag, props = {}) {
        const doc = this.#doc || document; // Use document as fallback
        const element = doc.createElement(tag);
        const qry = new Qry(element, doc);

        // Apply properties
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'class') {
                qry.cls(value);
            } else if (key === 'text') {
                qry.text(value);
            } else if (key === 'html') {
                qry.html(value);
            } else {
                qry.attr(key, value);
            }
        });

        return qry;
    }


    // Enable/disable
    enable(state = true) {
        this.#each(el => el.disabled = !state);
        return this;
    }

    disable() {
        return this.enable(false);
    }

    // Focus
    focus() {
        this.#element?.focus();
        return this;
    }

    // Parent element
    parent() {
        return this.#element?.parentElement ? new Qry(this.#element.parentElement, this.#doc) : new Qry(null, this.#doc);
    }

    // Data attributes (simplified)
    data(key, value) {
        if (value === undefined) {
            return this.#element ? this.#element.dataset[key] : '';
        }
        this.#each(el => el.dataset[key] = value);
        return this;
    }

    // Ready method (like jex.ready)
    ready(fn) {
        if (this.#doc.readyState === 'loading') {
            this.#doc.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
        return this;
    }
}

// Create global instance
const qry = new Qry();

// Create global $ function that delegates to qry.$
function $(selector) {
    return qry.$(selector);
}

// Add static methods to $ function for advanced usage
$.ready = (fn) => qry.ready(fn);
$.create = (tag, props) => qry.create(tag, props);

// Make $ available globally (avoid conflicts by checking first)
if (typeof window !== 'undefined' && !window.$) {
    window.$ = $;
}

// Export both the class, instance, and $ function
export { Qry, qry, $ };
export default $;