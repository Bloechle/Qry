# Qry.js

> Ultra-lightweight DOM manipulation library optimized for minimal verbosity and maximum performance

## Why Choose Qry?

**Less code, more results.** Qry delivers the power of jQuery in a fraction of the size.

- **Ultra-lightweight** - Only ~3KB minified, zero dependencies
- **Blazing fast** - Direct DOM operations, no virtual DOM overhead
- **Minimal syntax** - Less typing, cleaner code
- **Method chaining** - Fluent, readable API
- **Modern browsers** - ES6+ with broad compatibility
- **Unified API** - Single class handles elements and collections seamlessly
- **Full JSDoc** - Complete IDE autocomplete and type hints

## At a Glance
```javascript
// Before (Vanilla JS)
document.getElementById('button').addEventListener('click', function() {
    this.textContent = 'Clicked!';
    this.classList.add('active');
    this.style.background = 'green';
});

// After (Qry.js)
$('#button').click(() => {
    $('#button').text('Clicked!').cls('+active').css('background', 'green');
});
```

## Installation

### CDN (Recommended)
```html
<script src="https://cdn.jsdelivr.net/gh/Bloechle/qry@latest/Qry.js"></script>
```

### ES Modules
```javascript
import $ from './Qry.js';
// or
import { $, Qry } from './Qry.js';
```

## API Reference

### Element Selection
```javascript
$('#myId')                        // ID selection (fastest)
$('.myClass')                     // Class selection
$('div')                          // Tag selection
$('div.active[data-id="123"]')    // Complex selectors
```

### Properties
```javascript
$('#el').el                       // Get underlying HTMLElement
$('.items').els                   // Get array of all matched elements
$('#el').exists                   // Check if element exists (boolean)
$('.items').length                // Number of matched elements
```

### Content
```javascript
$('#title').text()                // Get text
$('#title').text('New title')     // Set text
$('#content').html()              // Get HTML
$('#content').html('<b>Bold</b>') // Set HTML
$('#container').empty()           // Clear contents
```

### CSS Classes
```javascript
$('.card').cls('+active')         // Add class
$('.card').cls('-hidden')         // Remove class
$('.card').cls('~selected')       // Toggle class
$('.card').cls('?visible')        // Check class (returns boolean)
$('.card').cls('+show -hidden')   // Multiple operations
```

### Attributes
```javascript
$('#link').attr('href')                      // Get
$('#link').attr('href', 'https://...')       // Set
$('#input').attr('disabled', null)           // Remove
$('#img').attr({ src: 'a.jpg', alt: 'A' })   // Multiple

$('#el').data('id')               // Get data-id
$('#el').data('id', '123')        // Set data-id
```

### CSS Styles
```javascript
$('.box').css('background')                  // Get computed style
$('.box').css('background', 'red')           // Set style
$('.box').css({ background: 'red', padding: '20px' })
```

### Events
```javascript
$('#btn').click(e => {})          // Click handler
$('#btn').click()                 // Trigger click
$('#form').on('submit', handler)  // Add listener
$('#btn').off('click', handler)   // Remove listener
$('#input').trigger('focus')      // Trigger event
$('#el').trigger('custom', data)  // Custom event with data

// Event delegation
$('#list').delegate('.item', 'click', function(e) {
    $(this).cls('~selected');
});
```

### DOM Manipulation
```javascript
$('#container').append('<div>End</div>')
$('#list').prepend('<li>Start</li>')
$('#item').before('<li>Before</li>')
$('#item').after('<li>After</li>')
$('.old').remove()
$('#old').replaceWith('<div>New</div>')
$('.item').wrap('<div class="wrapper"></div>')

// Mount created elements (chainable)
$.create('div').mount('#container')       // Append to target
$.create('li').appendTo('#list')          // jQuery: append to target
$.create('li').prependTo('#list')         // jQuery: prepend to target
```

### Element Creation
```javascript
$.create('div', { class: 'card', text: 'Hello', 'data-id': '1' })

// Mount into container (chainable)
$.create('button', { text: 'Click' }).click(handler).mount('#toolbar')
$.create('li', { text: 'Item' }).appendTo('#list')    // jQuery style
$.create('li', { text: 'First' }).prependTo('#list')  // jQuery style
```

### DOM Traversal
```javascript
$('#child').parent()
$('#container').find('.item')
$('#list').children()
$('#list').children('.active')
$(el).closest('.card')
$('#item').next()
$('#item').prev()
$('#item').siblings()
$('#item').siblings('.active')
```

### Collection
```javascript
$('.items').each((el, i) => {})   // Iterate
$('.items').first()               // First element
$('.items').last()                // Last element
$('.items').eq(2)                 // Element at index
$('.items').eq(-1)                // Last (negative index)
$('.items').filter('.active')     // Filter by selector
```

### Form
```javascript
$('#name').val()                  // Get value
$('#name').val('John')            // Set value
$('#submit').enable()             // Enable
$('#submit').disable()            // Disable
$('#input').focus()               // Focus
```

### Visibility
```javascript
$('.modal').show()
$('.modal').hide()
```

### Utilities
```javascript
$('#btn').is('.active')           // Check selector match
$('#item').index()                // Index among siblings
$('#template').clone()            // Clone element
$('#box').offset()                // { top, left }
$.ready(() => {})                 // DOM ready
```

## Method Chaining

```javascript
$('#dialog')
    .cls('+modal +active -hidden')
    .css({ opacity: 1 })
    .show()
    .find('.close-btn')
    .click(() => $('#dialog').hide());
```

## Single Elements vs Collections

```javascript
$('#btn').text('Hello')           // Single element
$('.btns').text('Hello')          // All matched elements

const el = $('#btn').el           // HTMLElement
const els = $('.btns').els        // Array<HTMLElement>
```

## Performance

| Library | Size (min) | Speed |
|---------|------------|-------|
| **Qry.js** | **~3KB** | **⚡⚡⚡** |
| jQuery | ~30KB | ⚡ |
| Zepto.js | ~10KB | ⚡⚡ |

## Browser Support

Chrome 60+ • Firefox 55+ • Safari 12+ • Edge 79+

## License

MIT License

---

<div align="center">

**Made with ❤️ for developers who value simplicity and performance**

[GitHub](https://github.com/Bloechle/qry) • [Issues](https://github.com/Bloechle/qry/issues)

</div>