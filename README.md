# Qry.js

Ultra-lightweight DOM manipulation library optimized for minimal verbosity and maximum performance.

## Why Qry?

- **Ultra-lightweight** - ~3KB minified, zero dependencies
- **High performance** - Direct DOM operations, no virtual DOM overhead
- **Minimal syntax** - Less typing, more doing
- **Method chaining** - Fluent, readable code
- **Modern browsers** - ES6+ with broad compatibility
- **Unified API** - Single class handles elements and collections

## Quick Start

```html
<script src="qry.js"></script>
<script>
    // Selection and manipulation
    $('#button').text('Click me!').click(() => {
        alert('Hello from Qry!');
    });
</script>
```

## Installation

### Direct Download
```html
<script src="qry.js"></script>
```

### CDN (jsDelivr)
```html
<script src="https://cdn.jsdelivr.net/gh/youruser/qry/qry.js"></script>
```

### ES Modules
```javascript
import { $, Qry } from './qry.js';
```

## API Reference

### Selection

```javascript
// ID selection (fastest)
$('#myId')

// Class selection  
$('.myClass')

// Tag selection
$('div')

// Complex selectors
$('div.active[data-id="123"]')

// Multiple documents (iframe support)
$('#btn', iframeDocument)
```

### Text & HTML

```javascript
// Get/set text content
$('#title').text()              // Get text
$('#title').text('New title')   // Set text

// Get/set HTML content
$('#content').html()                    // Get HTML
$('#content').html('<b>Bold text</b>')  // Set HTML
```

### Classes (Prefix Syntax)

```javascript
// Add classes
$('.card').cls('+active +highlight')

// Remove classes
$('.card').cls('-hidden -disabled') 

// Toggle classes
$('.card').cls('~selected')

// Check classes (returns boolean)
const isActive = $('.card').cls('?active')

// Mixed operations
$('.card').cls('+show -hidden ~selected ?visible')
```

### Attributes & Properties

```javascript
// Attributes
$('#link').attr('href', 'https://example.com')
$('#input').attr('disabled', null)  // Remove attribute

// Multiple attributes
$('#img').attr({
    src: 'image.jpg',
    alt: 'Description',
    width: '300'
})
```

### CSS Styles

```javascript
// Single style
$('.box').css('background', 'red')
$('.box').css('fontSize', '16px')

// Multiple styles
$('.box').css({
    background: 'linear-gradient(45deg, red, blue)',
    padding: '20px',
    borderRadius: '8px'
})

// Get computed style
const color = $('.box').css('backgroundColor')
```

### Events

```javascript
// Click handler (shorthand)
$('#btn').click(event => {
    console.log('Clicked!');
})

// Generic event handler
$('#form').on('submit', event => {
    event.preventDefault();
    console.log('Form submitted');
})

// Remove event listeners
$('#btn').off('click', handler)
```

### DOM Manipulation

```javascript
// Append elements
$('#container').append('<div>New content</div>')
$('#container').append($('#other-element'))

// Prepend elements  
$('#list').prepend('<li>First item</li>')

// Remove elements
$('.old-items').remove()
```

### Element Creation

```javascript
// Create elements with properties
const card = $.create('div', {
    class: 'card highlight',
    text: 'Card content',
    'data-id': '123'
});

// Append to parent
$('#container').append(card);

// Method chaining on created elements
$.create('button', { text: 'Click me' })
  .click(handler)
  .append($('#toolbar'));
```

### Form Elements

```javascript
// Get/set input values
$('#name').val()              // Get value
$('#name').val('John Doe')    // Set value

// Enable/disable elements
$('#submit').enable()         // Enable
$('#submit').disable()        // Disable
$('#submit').enable(false)    // Disable (explicit)
```

### Visibility & State

```javascript
// Show/hide elements
$('.modal').show()
$('.modal').hide()

// Focus elements
$('#input').focus()

// Check if element exists
if ($('#optional').exists) {
    // Element found in DOM
}
```

### Traversal

```javascript
// Parent element
$('#child').parent()

// Find child elements
$('#container').find('.items')
$('#container').find('#specific-item')
```

### Utility Methods

```javascript
// Wait for DOM ready
$.ready(() => {
    console.log('DOM loaded!')
});

// Create elements (static method)  
const div = $.create('div', { class: 'box' });
```

## Method Chaining

All methods return the Qry instance, enabling fluent chaining:

```javascript
$('#dialog')
    .cls('+modal +active -hidden')
    .css({ opacity: 0 })
    .show()
    .css({ opacity: 1 })
    .click(() => closeDialog());
```

## Collections vs Single Elements

Qry automatically handles both single elements and collections with the same API:

```javascript
// Single element
$('#unique-id').text('Hello')      // Sets text on one element

// Collection
$('.cards').text('Hello')          // Sets text on all matching elements
$('.cards').cls('+highlight')      // Adds class to all elements

// Access underlying elements
const element = $('#btn').el       // Get single element
const elements = $('.cards').els   // Get array of elements
```

## Browser Support

- Chrome 60+
- Firefox 55+ 
- Safari 12+
- Edge 79+

Modern browsers with ES6 support. For older browsers, consider using a transpiler like Babel.

## Performance

Qry uses native DOM methods optimized for speed:

- `getElementById()` for ID selectors (2-10x faster than `querySelector()`)
- Direct property access where possible
- Minimal abstraction layers
- No virtual DOM overhead

## Size Comparison

| Library | Size (minified) | Features |
|---------|-----------------|----------|
| **Qry.js** | **~3KB** | Essential DOM manipulation |
| jQuery | ~30KB | Full-featured, legacy support |
| Zepto.js | ~10KB | Mobile-focused subset |
| Cash.js | ~6KB | jQuery alternative |

## Examples

Check out `index.html` for interactive examples and demos.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Core DOM manipulation features
- Unified element/collection handling
- Method chaining support
- Class prefix syntax (+, -, ~, ?)
- ES6 modules and CDN distribution