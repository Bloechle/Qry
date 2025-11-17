/**
 * Qry.js - Ultra-lightweight DOM manipulation library
 * Optimized for minimal verbosity and maximum performance
 *
 * @version 1.2.0
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
     * @param {string|HTMLElement|SVGElement|Qry} [selector=document.documentElement] - CSS selector, element, or Qry instance
     * @param {Document} [doc=document] - Document context (for iframe support)
     */
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
        return this.#element;
    }

    /**
     * Get all matched elements as an array
     * @returns {Array<HTMLElement|SVGElement>} Array of matched elements
     */
    get els() {
        return this.#isCollection ? this.#elements : (this.#element ? [this.#element] : []);
    }

    /**
     * Check if any elements were matched
     * @returns {boolean} True if element(s) exist
     */
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
            return this.#element ? this.#element.textContent : '';
        }
        this.#each(el => el.textContent = content);
        return this;
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
            return this.#element ? this.#element.innerHTML : '';
        }
        this.#each(el => el.innerHTML = content);
        return this;
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

    /**
     * Get or set CSS styles
     * @param {string|Object} prop - Property name or object of key-value pairs
     * @param {string} [value] - Property value (omit to get computed style)
     * @returns {string|Qry} Computed style when getting, this for chaining when setting
     * @example
     * $('.box').css('background')                  // Get computed style
     * $('.box').css('background', 'red')           // Set style
     * $('.box').css({                              // Set multiple
     *     background: 'red',
     *     padding: '20px'
     * })
     */
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
        this.#each(el => el.addEventListener(event, handler, options));
        return this;
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
        this.#each(el => el.removeEventListener(event, handler));
        return this;
    }

    /**
     * Event delegation - attach handler for dynamically added children
     * @param {string} selector - Child selector to match
     * @param {string} event - Event name
     * @param {Function} handler - Event handler (receives event, called with matched element as context)
     * @returns {Qry} This for chaining
     * @example
     * // Handle clicks on items, even ones added later
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
            this.#element?.click();
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
        this.#each(el => {
            // Handle native events (click, submit, focus, etc.)
            if (typeof el[event] === 'function' && !detail) {
                el[event]();
            } else {
                // Custom events or events with data
                const evt = new CustomEvent(event, {
                    bubbles: true,
                    cancelable: true,
                    detail: detail
                });
                el.dispatchEvent(evt);
            }
        });
        return this;
    }

    /**
     * Append content to element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#list').append('<li>Item</li>')           // HTML string
     * $('#list').append(document.createElement('li'))  // Element
     * $('#list').append($('.item'))                // Qry instance
     */
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

    /**
     * Prepend content to element(s)
     * @param {string|HTMLElement|Qry} content - HTML string, element, or Qry instance
     * @returns {Qry} This for chaining
     * @example
     * $('#list').prepend('<li>First</li>')         // HTML string
     */
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

    /**
     * Remove element(s) from DOM
     * @returns {Qry} This for chaining
     * @example
     * $('.old-item').remove()
     */
    remove() {
        this.#each(el => el.remove());
        return this;
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
            return this.#element ? this.#element.value : '';
        }
        this.#each(el => el.value = value);
        return this;
    }

    /**
     * Show element(s) by removing display:none
     * @returns {Qry} This for chaining
     * @example
     * $('.modal').show()
     */
    show() {
        this.#each(el => el.style.display = '');
        return this;
    }

    /**
     * Hide element(s) by setting display:none
     * @returns {Qry} This for chaining
     * @example
     * $('.modal').hide()
     */
    hide() {
        this.#each(el => el.style.display = 'none');
        return this;
    }

    /**
     * Find descendant elements
     * @param {string} selector - CSS selector
     * @returns {Qry} New Qry instance with matched descendants
     * @example
     * $('#container').find('.item')            // Find all items
     * $('#form').find('#submit')               // Find by ID
     */
    find(selector) {
        if (!this.#element) return new Qry(null, this.#doc);
        return new Qry(selector.startsWith('#') ?
            this.#element.querySelector(selector) :
            this.#element.querySelectorAll(selector), this.#doc
        );
    }

    /**
     * Create a new element with properties
     * @param {string} tag - HTML tag name
     * @param {Object} [props={}] - Properties to set (class, text, html, or attributes)
     * @returns {Qry} New Qry instance wrapping created element
     * @example
     * $.create('div')                              // Empty div
     * $.create('div', { class: 'card' })           // With class
     * $.create('button', {                         // With multiple props
     *     class: 'btn primary',
     *     text: 'Click me',
     *     id: 'submit-btn'
     * })
     */
    create(tag, props = {}) {
        const doc = this.#doc || document;
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

    /**
     * Enable form element(s)
     * @param {boolean} [state=true] - Enable state
     * @returns {Qry} This for chaining
     * @example
     * $('#submit').enable()            // Enable
     * $('#submit').enable(false)       // Disable
     */
    enable(state = true) {
        this.#each(el => el.disabled = !state);
        return this;
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
        this.#element?.focus();
        return this;
    }

    /**
     * Get parent element
     * @returns {Qry} New Qry instance wrapping parent element
     * @example
     * $('#child').parent()             // Get parent
     * $('#child').parent().hide()      // Hide parent
     */
    parent() {
        return this.#element?.parentElement ?
            new Qry(this.#element.parentElement, this.#doc) :
            new Qry(null, this.#doc);
    }

    /**
     * Find closest ancestor matching selector (including self)
     * @param {string} selector - CSS selector
     * @returns {Qry} New Qry instance with matched ancestor or empty if none found
     * @example
     * $(e.target).closest('.card')                 // Find parent card
     * $(e.target).closest('button')                // Find button (or self if button)
     *
     * // Useful for event delegation:
     * $('#container').on('click', (e) => {
     *     const card = $(e.target).closest('.card');
     *     if (card.exists) {
     *         card.cls('~selected');
     *     }
     * });
     */
    closest(selector) {
        if (!this.#element) return new Qry(null, this.#doc);
        const el = this.#element.closest(selector);
        return new Qry(el, this.#doc);
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
            return this.#element ? this.#element.dataset[key] : '';
        }
        this.#each(el => el.dataset[key] = value);
        return this;
    }

    /**
     * Execute callback when DOM is ready
     * @param {Function} fn - Callback function
     * @returns {Qry} This for chaining
     * @example
     * $.ready(() => {
     *     console.log('DOM ready!');
     * });
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

/**
 * Execute callback when DOM is ready
 * @param {Function} fn - Callback function
 * @example
 * $.ready(() => console.log('DOM ready!'));
 */
$.ready = (fn) => qry.ready(fn);

/**
 * Create new element with properties
 * @param {string} tag - HTML tag name
 * @param {Object} [props] - Element properties
 * @returns {Qry} New Qry instance
 * @example
 * $.create('div', { class: 'card', text: 'Hello' })
 */
$.create = (tag, props) => qry.create(tag, props);

// Make $ available globally (avoid conflicts by checking first)
if (typeof window !== 'undefined' && !window.$) {
    window.$ = $;
}

// Export both the class, instance, and $ function
export { Qry, qry, $ };
export default $;