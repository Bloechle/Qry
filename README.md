# Qry.js ⚡

> Ultra-lightweight DOM manipulation library optimized for minimal verbosity and maximum performance

## 🚀 Why Choose Qry?

**Less code, more results.** Qry delivers the power of jQuery in a fraction of the size.

- **🪶 Ultra-lightweight** - Only ~3KB minified, zero dependencies
- **⚡ Blazing fast** - Direct DOM operations, no virtual DOM overhead
- **✨ Minimal syntax** - Less typing, cleaner code
- **🔗 Method chaining** - Fluent, readable API
- **🌐 Modern browsers** - ES6+ with broad compatibility
- **🎯 Unified API** - Single class handles elements and collections seamlessly

## ⭐ At a Glance

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

## 📦 Installation

### CDN (Recommended)
```html
<script src="https://cdn.jsdelivr.net/gh/Bloechle/qry@latest/qry.js"></script>
```

### ES Modules
```javascript
import $ from './qry.js';
// or
import { $, Qry } from './qry.js';
```

### Direct Download
Download `qry.js` and include it in your project:
```html
<script src="qry.js"></script>
```

## 🎯 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/gh/Bloechle/qry@latest/qry.js"></script>
</head>
<body>
    <button id="demo">Click me!</button>
    
    <script>
        $('#demo').click(() => {
            $('body').append('<p>Hello Qry! 🎉</p>');
        });
    </script>
</body>
</html>
```

## 📚 API Reference

### 🔍 Element Selection

```javascript
$('#myId')                        // ID selection (fastest)
$('.myClass')                     // Class selection
$('div')                          // Tag selection
$('div.active[data-id="123"]')    // Complex selectors
$('#btn', iframeDoc)              // Custom document context
```

### 📝 Content Manipulation

```javascript
// Text content
$('#title').text()                // Get text
$('#title').text('New title')     // Set text

// HTML content
$('#content').html()              // Get HTML
$('#content').html('<b>Bold</b>') // Set HTML
```

### 🎨 CSS Classes (Intuitive Prefix Syntax)

```javascript
$('.card').cls('+active')         // Add class
$('.card').cls('-hidden')         // Remove class
$('.card').cls('~selected')       // Toggle class
$('.card').cls('?visible')        // Check class (returns boolean)

// Multiple operations
$('.card').cls('+show -hidden ~selected')
```

### 🎭 Attributes & Properties

```javascript
// Single attribute
$('#link').attr('href', 'https://example.com')
$('#input').attr('disabled', null)  // Remove attribute

// Multiple attributes
$('#img').attr({
    src: 'image.jpg',
    alt: 'Description',
    width: '300'
})
```

### 🎨 CSS Styles

```javascript
// Single style
$('.box').css('background', 'red')

// Multiple styles
$('.box').css({
    background: 'linear-gradient(45deg, red, blue)',
    padding: '20px',
    borderRadius: '8px'
})

// Get computed style
const color = $('.box').css('backgroundColor')
```

### ⚡ Event Handling

```javascript
// Click shorthand
$('#btn').click(e => console.log('Clicked!'))

// Generic events
$('#form').on('submit', e => {
    e.preventDefault();
    console.log('Form submitted');
})

// Remove listeners
$('#btn').off('click', handler)
```

### 🏗️ DOM Manipulation

```javascript
// Add content
$('#container').append('<div>New content</div>')
$('#list').prepend('<li>First item</li>')

// Remove elements
$('.old-items').remove()
```

### ⚙️ Element Creation

```javascript
// Create with properties
const card = $.create('div', {
    class: 'card highlight',
    text: 'Card content',
    'data-id': '123'
});

// Chain methods on creation
$.create('button', { text: 'Click me' })
  .click(handler)
  .append($('#toolbar'));
```

### 📋 Form Elements

```javascript
$('#name').val()              // Get value
$('#name').val('John Doe')    // Set value

$('#submit').enable()         // Enable element
$('#submit').disable()        // Disable element
```

### 👁️ Visibility & State

```javascript
$('.modal').show()            // Show element
$('.modal').hide()            // Hide element
$('#input').focus()           // Focus element

// Check existence
if ($('#optional').exists) {
    // Element exists in DOM
}
```

### 🧭 DOM Traversal

```javascript
$('#child').parent()          // Get parent element
$('#container').find('.item') // Find children
```

### 🛠️ Utility Methods

```javascript
// DOM ready
$.ready(() => {
    console.log('DOM loaded!');
});

// Static element creation
const div = $.create('div', { class: 'box' });
```

## 🔗 Method Chaining Power

Build complex interactions with readable, fluent syntax:

```javascript
$('#dialog')
    .cls('+modal +active -hidden')
    .css({ opacity: 0 })
    .show()
    .css({ opacity: 1 })
    .click(() => closeDialog())
    .find('.close-btn')
    .click(() => $('#dialog').hide());
```

## 🎯 Single Elements vs Collections

Qry automatically handles both scenarios with the same clean API:

```javascript
// Works on single elements
$('#unique-btn').text('Hello')

// Works on collections too
$('.all-buttons').text('Hello')    // Updates ALL matching elements
$('.cards').cls('+highlight')      // Adds class to ALL cards

// Access underlying elements when needed
const element = $('#btn').el       // Single HTMLElement
const elements = $('.btns').els    // Array of HTMLElements
```

## 📊 Performance Comparison

| Library | Size (min) | Speed | Features |
|---------|------------|-------|----------|
| **Qry.js** | **~3KB** | **⚡⚡⚡** | Essential DOM manipulation |
| jQuery | ~30KB | ⚡ | Full-featured, legacy support |
| Zepto.js | ~10KB | ⚡⚡ | Mobile-focused |
| Cash.js | ~6KB | ⚡⚡ | jQuery alternative |

**Speed optimizations:**
- Uses `getElementById()` for ID selectors (2-10x faster)
- Direct property access where possible
- Minimal abstraction layers
- Zero virtual DOM overhead

## 🌍 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

Modern browsers with ES6+ support. For legacy browsers, use Babel transpilation.

## 💡 Real-World Examples

### Interactive Card Component
```javascript
$.create('div', { class: 'card' })
    .append('<h3>Product Card</h3>')
    .append('<p>$29.99</p>')
    .click(function() {
        $(this).cls('~selected')
               .css('transform', 'scale(1.05)');
    })
    .append($('#products'));
```

### Form Validation
```javascript
$('#signup-form').on('submit', e => {
    e.preventDefault();
    
    const email = $('#email').val();
    if (!email.includes('@')) {
        $('#email').cls('+error')
                   .focus();
        return;
    }
    
    $('#email').cls('-error +success');
    // Submit form...
});
```

### Dynamic Content Loading
```javascript
$('#load-more').click(async () => {
    $('#load-more').text('Loading...').disable();
    
    try {
        const data = await fetch('/api/posts').then(r => r.json());
        data.forEach(post => {
            $.create('article', { 
                class: 'post',
                html: `<h2>${post.title}</h2><p>${post.excerpt}</p>` 
            }).append($('#posts'));
        });
    } finally {
        $('#load-more').text('Load More').enable();
    }
});
```

## 🧪 Try It Live

Check out the interactive demo in `index.html` or visit our [CodePen examples](https://codepen.io/collection/qryjs).

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/awesome-feature`
3. **Commit** your changes: `git commit -m 'Add awesome feature'`
4. **Push** to the branch: `git push origin feature/awesome-feature`
5. **Open** a Pull Request

### Development Setup
```bash
git clone https://github.com/Bloechle/qry.git
cd qry
# Open index.html in your browser to test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🚀 Changelog

### v1.1.0 (Latest)
- ✨ Enhanced element creation with property support
- 🐛 Improved collection handling
- 📚 Better documentation and examples

### v1.0.0
- 🎉 Initial release
- ⚡ Core DOM manipulation features
- 🔗 Method chaining support
- 🎨 Class prefix syntax (+, -, ~, ?)
- 📦 ES6 modules and CDN distribution

---

<div align="center">

**Made with ❤️ for developers who value simplicity and performance**

[⭐ Star on GitHub](https://github.com/Bloechle/qry) • [🐛 Report Bug](https://github.com/Bloechle/qry/issues) • [💡 Request Feature](https://github.com/Bloechle/qry/issues)

</div>