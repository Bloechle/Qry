/**
 * Qry.js - Ultra-lightweight DOM manipulation library
 * Optimized for minimal verbosity and maximum performance
 *
 * @version 1.4.0
 * @author Jean-Luc Bloechle with Claude.ai
 * @license MIT
 */

class Qry {
    #element = null;
    #elements = [];
    #isCollection = false;
    #doc = null;

    /**
     * Create a new Qry instance
     * @param {string|HTMLElement|SVGElement|NodeList|HTMLCollection|Array|Qry} [selector=document.documentElement] - CSS selector, element(s), or Qry instance
     * @param {Document} [doc=document] - Document context (for iframe support)
     */
    constructor(selector = document.documentElement, doc = document) {
        this.#doc = doc;

        if (!selector || selector === document.documentElement) {
            this.#element = this.#doc.documentElement;
            return;
        }

        if (selector instanceof HTMLElement || selector instanceof SVGElement) {
            this.#element = selector;
        } else if (selector instanceof NodeList || selector instanceof HTMLCollection || Array.isArray(selector)) {
            const elements = Array.from(selector);
            if (elements.length === 1) {
                this.#element = elements[0];
            } else if (elements.length > 1) {
                this.#elements = elements;
                this.#isCollection = true;
            }
        } else if (selector instanceof Qry) {
            return selector;
        } else if (typeof selector === 'string') {
            if (selector.startsWith('#') && !selector.includes(' ') && !selector.includes(',')) {
                this.#element = this.#doc.getElementById(selector.slice(1));
            } else if (selector.includes(',') || selector.includes(' ') || selector.includes('.') || selector.includes('[')) {
                const elements = Array.from(this.#doc.querySelectorAll(selector));
                if (elements.length === 1) {
                    this.#element = elements[0];
                } else if (elements.length > 1) {
                    this.#elements = elements;
                    this.#isCollection = true;
                }
            } else {
                this.#element = this.#doc.querySelector(selector);
            }
        }
    }

    /**
     * Create a new Qry instance from this context
     * @param {string|HTMLElement|SVGElement} selector - Selector or element
     * @returns {Qry} New Qry instance
     */
    $(selector) {
        return new Qry(selector, this.#doc);
    }

    /**
     * Get the underlying DOM element
     * @returns {HTMLElement|SVGElement|null} The first matched element
     */
    get el() {
        return this.#isCollection ? this.#elements[0] : this.#element;
    }

    /**
     * Get all matched elements as an array
     * @returns {Array<HTMLElement|SVGElement>} Array of matched elements
     */
    get els() {
        return this.#isCollection ? [...this.#elements] : (this.#element ? [this.#element] : []);
    }

    /**
     * Check if any elements were matched
     * @returns {boolean} True if element(s) exist
     */
    get exists() {
        return this.#isCollection ? this.#elements.length > 0 : this.#element !== null;
    }

    /**
     * Get number of matched elements
     * @returns {number} Count of matched elements
     */
    get length() {
        return this.#isCollection ? this.#elements.length : (this.#element ? 1 : 0);
    }

    /**
     * Iterate over matched elements
     * @param {Function} fn - Callback (element, index) => void
     * @returns {Qry} This for chaining
     * @example
     * $('.items').each((el, i) => console.log(i, el.textContent))
     */
    each(fn) {
        if (this.#isCollection) {
            this.#elements.forEach((el, i) => fn(el, i));
        } else if (this.#element) {
            fn(this.#element, 0);
        }
        return this;
    }

    /**
     * Get first element from collection
     * @returns {Qry} New Qry instance with first element
     * @example
     * $('.items').first().cls('+active')
     */
    first() {
        const el = this.#isCollection ? this.#elements[0] : this.#element;
        return new Qry(el || null, this.#doc);
    }

    /**
     * Get last element from collection
     * @returns {Qry} New Qry instance with last element
     * @example
     * $('.items').last().cls('+active')
     */
    last() {
        const el = this.#isCollection ? this.#elements[this.#elements.length - 1] : this.#element;
        return new Qry(el || null, this.#doc);
    }

    /**
     * Get or set text content
     * @param {string} [content] - Text to set (omit to get current text)
     * @returns {string|Qry} Text content when getting, this for chaining when setting
     * @example
     * $('#title').text()              // Get text
     * $('#title').text('New Title')   // Set text
     */
    text(content) {
        if (content === undefined) {
            return this.el?.textContent ?? '';
        }
        return this.each(el => el.textContent = content);
    }

    /**
     * Get or set HTML content
     * @param {string} [content] - HTML to set (omit to get current HTML)
     * @returns {string|Qry} HTML content when getting, this for chaining when setting
     * @example
     * $('#content').html()                    // Get HTML
     * $('#content').html('<b>Bold text</b>')  // Set HTML
     */
    html(content) {
        if (content === undefined) {
            return this.el?.innerHTML ?? '';
        }
        return this.each(el => el.innerHTML = content);
    }

    /**
     * Clear element contents
     * @returns {Qry} This for chaining
     * @example
     * $('#container').empty()
     */
    empty() {
        return this.each(el => el.innerHTML = '');
    }

    /**
     * Manage CSS classes with intuitive prefix syntax
     * @param {string} classes - Space-separated classes with action prefixes:
     *   - `+className` to add
     *   - `-className` to remove
     *   - `~className` to toggle
     *   - `?className` to check (returns boolean)
     *   - `className` (no prefix) to add
     * @returns {boolean|Qry} Boolean when checking (?), otherwise this for chaining
     * @example
     * $('.card').cls('+active')                    // Add class
     * $('.card').cls('-hidden')                    // Remove class
     * $('.card').cls('~selected')                  // Toggle class
     * $('.card').cls('?visible')                   // Check class (returns true/false)
     * $('.card').cls('+show -hidden ~selected')    // Multiple operations
     */
    cls(classes) {
        if (!classes) return this;

        const tokens = classes.split(' ').filter(Boolean);
        let queryResult = undefined;

        this.each(el => {
            tokens.forEach(cls => {
                const action = cls[0];
                const name = cls.slice(1) || cls;

                switch (action) {
                    case '+': el.classList.add(name); break;
                    case '-': el.classList.remove(name); break;
                    case '~': el.classList.toggle(name); break;
                    case '?':
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

    /**
     * Get, set, or remove attributes
     * @param {string|Object} name - Attribute name or object of key-value pairs
     * @param {string|null} [value] - Attribute value (omit to get, null to remove)
     * @returns {string|null|Qry} Attribute value when getting, this for chaining when setting
     * @example
     * $('#link').attr('href')                      // Get attribute
     * $('#link').attr('href', 'https://...')       // Set attribute
     * $('#link').attr('disabled', null)            // Remove attribute
     * $('#img').attr({ src: 'pic.jpg', alt: '' })  // Set multiple
     */
    attr(name, value) {
        if (typeof name === 'object') {
            Object.entries(name).forEach(([k, v]) => this.attr(k, v));
            return this;
        }

        if (value === undefined) {
            return this.el?.getAttribute(name) ?? null;
        }

        return this.each(el => {
            value === null ? el.removeAttribute(name) : el.setAttribute(name, value);
        });
    }

    /**
     * Get or set CSS styles
     * @param {string|Object} prop - Property name or object of key-value pairs
     * @param {string} [value] - Property value (omit to get computed style)
     * @returns {string|Qry} Computed style when getting, this for chaining when setting
     * @example
     * $('.box').css('background')                  // Get computed style
     * $('.box').css('background', 'red')           // Set style
     * $('.box').css({ background: 'red', padding: '20px' })  // Set multiple
     */
    css(prop, value) {
        if (typeof prop === 'object') {
            Object.entries(prop).forEach(([k, v]) => this.css(k, v));
            return this;
        }

        if (value === undefined) {
            return this.el ? getComputedStyle(this.el)[prop] : '';
        }

        return this.each(el => el.style[prop] = value);
    }

    /**
     * Attach event listener
     * @param {string} event - Event name (e.g., 'click', 'submit', 'change')
     * @param {Function} handler - Event handler function
     * @param {Object|boolean} [options] - addEventListener options
     * @returns {Qry} This for chaining
     * @example
     * $('#btn').on('click', e => console.log('Clicked!'))
     * $('#form').on('submit', handleSubmit, { once: true })
     */
    on(event, handler, options) {
        return this.each(el => el.addEventListener(event, handler, options));
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function to remove
     * @returns {Qry} This for chaining
     * @example
     * $('#btn').off('click', myHandler)
     */
    off(event, handler) {
        return this.each(el => el.removeEventListener(event, handler));
    }

    /**
     * Event delegation - attach handler for dynamically added children
     * @param {string} selector - Child selector to match
     * @param {string} event - Event name
     * @param {Function} handler - Event handler (receives event, called with matched element as context)
     * @returns {Qry} This for chaining
     * @example
     * $('#list').delegate('.item', 'click', function(e) {
     *     console.log('Clicked:', this);  // 'this' is the matched .item element
     * });
     */
    delegate(selector, event, handler) {
        return this.on(event, function(e) {
            const target = new Qry(e.target, this.ownerDocument || document).closest(selector);
            if (target.exists) {
                handler.call(target.el, e);
            }
        });
    }

    /**
     * Attach click handler or trigger click
     * @param {Function} [handler] - Click handler (omit to trigger click)
     * @returns {Qry} This for chaining
     * @example
     * $('#btn').click()                        // Trigger click
     * $('#btn').click(e => console.log('!'))   // Add handler
     */
    click(handler) {
        if (!handler) {
            this.el?.click();
            return this;
        }
        return this.on('click', handler);
    }

    /**
     * Trigger event programmatically
     * @param {string} event - Event name (native or custom)
     * @param {*} [detail] - Optional data to pass with custom events
     * @returns {Qry} This for chaining
     * @example
     * $('#file-input').trigger('click')                    // Trigger native
     * $('#form').trigger('submit')                         // Trigger submit
     * $('#cart').trigger('item-added', { id: 123 })        // Custom event with data
     */
    trigger(event, detail) {
        return this.each(el => {
            if (typeof el[event] === 'function' && !detail) {
                el[event]();
            } else {
                el.dispatchEvent(new CustomEvent(event, { bubbles: true, cancelable: true, detail }));
            }
        });
    }

    /**
     * Append content to element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#list').append('<li>Item</li>')
     * $('#list').append($('.item'))
     */
    append(content) {
        return this.each(el => {
            if (content instanceof Qry) {
                content.els.forEach(child => el.appendChild(child));
            } else if (content instanceof HTMLElement) {
                el.appendChild(content);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('beforeend', content);
            }
        });
    }

    /**
     * Prepend content to element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#list').prepend('<li>First</li>')
     */
    prepend(content) {
        return this.each(el => {
            if (content instanceof Qry) {
                content.els.reverse().forEach(child => el.insertBefore(child, el.firstChild));
            } else if (content instanceof HTMLElement) {
                el.insertBefore(content, el.firstChild);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('afterbegin', content);
            }
        });
    }

    /**
     * Insert content before element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#item').before('<li>Before</li>')
     */
    before(content) {
        return this.each(el => {
            if (content instanceof Qry) {
                content.els.forEach(child => el.parentNode?.insertBefore(child, el));
            } else if (content instanceof HTMLElement) {
                el.parentNode?.insertBefore(content, el);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('beforebegin', content);
            }
        });
    }

    /**
     * Insert content after element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#item').after('<li>After</li>')
     */
    after(content) {
        return this.each(el => {
            if (content instanceof Qry) {
                content.els.reverse().forEach(child => el.parentNode?.insertBefore(child, el.nextSibling));
            } else if (content instanceof HTMLElement) {
                el.parentNode?.insertBefore(content, el.nextSibling);
            } else if (typeof content === 'string') {
                el.insertAdjacentHTML('afterend', content);
            }
        });
    }

    /**
     * Mount this element into a target container (append)
     * @param {string|HTMLElement|Qry} target - Target selector, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $.create('div', { text: 'Hello' }).mount('#container')
     */
    mount(target) {
        const t = target instanceof Qry ? target : new Qry(target, this.#doc);
        t.append(this);
        return this;
    }

    /**
     * Append this element to a target (jQuery compatible)
     * @param {string|HTMLElement|Qry} target - Target selector, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $.create('li', { text: 'Item' }).appendTo('#list')
     */
    appendTo(target) {
        return this.mount(target);
    }

    /**
     * Prepend this element to a target (jQuery compatible)
     * @param {string|HTMLElement|Qry} target - Target selector, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $.create('li', { text: 'First' }).prependTo('#list')
     */
    prependTo(target) {
        const t = target instanceof Qry ? target : new Qry(target, this.#doc);
        t.prepend(this);
        return this;
    }

    /**
     * Remove element(s) from DOM
     * @returns {Qry} This for chaining
     * @example
     * $('.old-item').remove()
     */
    remove() {
        return this.each(el => el.remove());
    }

    /**
     * Get or set form element value
     * @param {string|number} [value] - Value to set (omit to get current value)
     * @returns {string|Qry} Current value when getting, this for chaining when setting
     * @example
     * $('#name').val()                 // Get value
     * $('#name').val('John Doe')       // Set value
     */
    val(value) {
        if (value === undefined) {
            return this.el?.value ?? '';
        }
        return this.each(el => el.value = value);
    }

    /**
     * Show element(s) by removing display:none
     * @returns {Qry} This for chaining
     * @example
     * $('.modal').show()
     */
    show() {
        return this.each(el => el.style.display = '');
    }

    /**
     * Hide element(s) by setting display:none
     * @returns {Qry} This for chaining
     * @example
     * $('.modal').hide()
     */
    hide() {
        return this.each(el => el.style.display = 'none');
    }

    /**
     * Find descendant elements
     * @param {string} selector - CSS selector
     * @returns {Qry} New Qry instance with matched descendants
     * @example
     * $('#container').find('.item')
     * $('#form').find('#submit')
     */
    find(selector) {
        if (!this.el) return new Qry(null, this.#doc);
        return new Qry(this.el.querySelectorAll(selector), this.#doc);
    }

    /**
     * Get direct children, optionally filtered by selector
     * @param {string} [selector] - Optional CSS selector to filter children
     * @returns {Qry} New Qry instance with children
     * @example
     * $('#list').children()            // All direct children
     * $('#list').children('.active')   // Filtered children
     */
    children(selector) {
        if (!this.el) return new Qry(null, this.#doc);
        let children = Array.from(this.el.children);
        if (selector) {
            children = children.filter(el => el.matches(selector));
        }
        return new Qry(children.length === 1 ? children[0] : children, this.#doc);
    }

    /**
     * Create a new element with properties
     * @param {string} tag - HTML tag name
     * @param {Object} [props={}] - Properties to set (class, text, html, or attributes)
     * @returns {Qry} New Qry instance wrapping created element
     * @example
     * $.create('div')                              // Empty div
     * $.create('div', { class: 'card' })           // With class
     * $.create('button', { class: 'btn', text: 'Click me', id: 'submit-btn' })
     */
    create(tag, props = {}) {
        const doc = this.#doc || document;
        const element = doc.createElement(tag);
        const qry = new Qry(element, doc);

        Object.entries(props).forEach(([key, value]) => {
            if (key === 'class') qry.cls(value);
            else if (key === 'text') qry.text(value);
            else if (key === 'html') qry.html(value);
            else qry.attr(key, value);
        });

        return qry;
    }

    /**
     * Enable form element(s)
     * @param {boolean} [state=true] - Enable state
     * @returns {Qry} This for chaining
     * @example
     * $('#submit').enable()            // Enable
     * $('#submit').enable(false)       // Disable
     */
    enable(state = true) {
        return this.each(el => el.disabled = !state);
    }

    /**
     * Disable form element(s)
     * @returns {Qry} This for chaining
     * @example
     * $('#submit').disable()
     */
    disable() {
        return this.enable(false);
    }

    /**
     * Focus element
     * @returns {Qry} This for chaining
     * @example
     * $('#email').focus()
     */
    focus() {
        this.el?.focus();
        return this;
    }

    /**
     * Get parent element
     * @returns {Qry} New Qry instance wrapping parent element
     * @example
     * $('#child').parent()
     * $('#child').parent().hide()
     */
    parent() {
        return new Qry(this.el?.parentElement || null, this.#doc);
    }

    /**
     * Find closest ancestor matching selector (including self)
     * @param {string} selector - CSS selector
     * @returns {Qry} New Qry instance with matched ancestor or empty if none found
     * @example
     * $(e.target).closest('.card')
     * $(e.target).closest('button')
     */
    closest(selector) {
        if (!this.el) return new Qry(null, this.#doc);
        return new Qry(this.el.closest(selector), this.#doc);
    }

    /**
     * Get next sibling element
     * @returns {Qry} New Qry instance with next sibling
     * @example
     * $('#item').next()
     */
    next() {
        return new Qry(this.el?.nextElementSibling || null, this.#doc);
    }

    /**
     * Get previous sibling element
     * @returns {Qry} New Qry instance with previous sibling
     * @example
     * $('#item').prev()
     */
    prev() {
        return new Qry(this.el?.previousElementSibling || null, this.#doc);
    }

    /**
     * Get all sibling elements
     * @param {string} [selector] - Optional selector to filter siblings
     * @returns {Qry} New Qry instance with siblings
     * @example
     * $('#item').siblings()
     * $('#item').siblings('.active')
     */
    siblings(selector) {
        if (!this.el?.parentElement) return new Qry(null, this.#doc);
        let sibs = Array.from(this.el.parentElement.children).filter(el => el !== this.el);
        if (selector) sibs = sibs.filter(el => el.matches(selector));
        return new Qry(sibs, this.#doc);
    }

    /**
     * Get element at index from collection
     * @param {number} index - Zero-based index (negative counts from end)
     * @returns {Qry} New Qry instance with element at index
     * @example
     * $('.items').eq(0)    // First
     * $('.items').eq(-1)   // Last
     */
    eq(index) {
        const els = this.els;
        const i = index < 0 ? els.length + index : index;
        return new Qry(els[i] || null, this.#doc);
    }

    /**
     * Clone element(s)
     * @param {boolean} [deep=true] - Clone children too
     * @returns {Qry} New Qry instance with cloned element(s)
     * @example
     * $('#template').clone()
     */
    clone(deep = true) {
        const clones = this.els.map(el => el.cloneNode(deep));
        return new Qry(clones.length === 1 ? clones[0] : clones, this.#doc);
    }

    /**
     * Replace element(s) with new content
     * @param {string|HTMLElement|Qry} content - Replacement content
     * @returns {Qry} New Qry instance with replacement element(s)
     * @example
     * $('#old').replaceWith('<div>new</div>')
     */
    replaceWith(content) {
        const replacements = [];
        this.each(el => {
            if (typeof content === 'string') {
                el.insertAdjacentHTML('beforebegin', content);
                replacements.push(el.previousElementSibling);
                el.remove();
            } else if (content instanceof Qry) {
                el.replaceWith(content.el);
                replacements.push(content.el);
            } else if (content instanceof HTMLElement) {
                el.replaceWith(content);
                replacements.push(content);
            }
        });
        return new Qry(replacements.length === 1 ? replacements[0] : replacements, this.#doc);
    }

    /**
     * Check if element matches selector
     * @param {string} selector - CSS selector
     * @returns {boolean} True if matches
     * @example
     * $('#btn').is('.active')
     * $('#btn').is('button')
     */
    is(selector) {
        return this.el?.matches(selector) ?? false;
    }

    /**
     * Filter collection by selector
     * @param {string} selector - CSS selector
     * @returns {Qry} New Qry instance with filtered elements
     * @example
     * $('.items').filter('.active')
     */
    filter(selector) {
        const filtered = this.els.filter(el => el.matches(selector));
        return new Qry(filtered, this.#doc);
    }

    /**
     * Get index of element among siblings
     * @returns {number} Zero-based index, or -1 if not found
     * @example
     * $('#item').index()
     */
    index() {
        if (!this.el?.parentElement) return -1;
        return Array.from(this.el.parentElement.children).indexOf(this.el);
    }

    /**
     * Wrap element(s) with HTML container
     * @param {string} html - HTML string for wrapper
     * @returns {Qry} This for chaining
     * @example
     * $('.item').wrap('<div class="wrapper"></div>')
     */
    wrap(html) {
        return this.each(el => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            const container = wrapper.firstElementChild;
            el.parentNode?.insertBefore(container, el);
            container.appendChild(el);
        });
    }

    /**
     * Get element position relative to document
     * @returns {{top: number, left: number}} Position object
     * @example
     * const pos = $('#box').offset()
     */
    offset() {
        if (!this.el) return { top: 0, left: 0 };
        const rect = this.el.getBoundingClientRect();
        return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
    }

    /**
     * Get or set data attributes
     * @param {string} key - Data attribute key (without 'data-' prefix)
     * @param {string} [value] - Value to set (omit to get)
     * @returns {string|Qry} Attribute value when getting, this for chaining when setting
     * @example
     * $('#item').data('id')            // Get data-id
     * $('#item').data('id', '123')     // Set data-id
     */
    data(key, value) {
        if (value === undefined) {
            return this.el?.dataset[key] ?? '';
        }
        return this.each(el => el.dataset[key] = value);
    }

    /**
     * Execute callback when DOM is ready
     * @param {Function} fn - Callback function
     * @returns {Qry} This for chaining
     * @example
     * $.ready(() => console.log('DOM ready!'));
     */
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

/**
 * Main selector function - creates new Qry instance
 * @param {string|HTMLElement|SVGElement} selector - CSS selector or element
 * @returns {Qry} New Qry instance
 * @example
 * $('#myId')                   // Select by ID
 * $('.myClass')                // Select by class
 * $('div')                     // Select by tag
 * $('#btn').click(() => {})    // Chain methods
 */
function $(selector) {
    return qry.$(selector);
}

/** Execute callback when DOM is ready */
$.ready = fn => qry.ready(fn);

/** Create new element with properties */
$.create = (tag, props) => qry.create(tag, props);

// Make $ available globally
if (typeof window !== 'undefined' && !window.$) {
    window.$ = $;
}

export { Qry, qry, $ };
export default $;