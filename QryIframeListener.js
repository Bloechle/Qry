/**
 * Qry Iframe Height Listener
 *
 * Add this script to your GRAV page to automatically adjust iframe heights
 * when embedding Qry apps.
 *
 * Usage in GRAV markdown:
 *
 * <iframe src="/user/data/apps/qry-topboxled.html"
 *         class="qry-app"
 *         style="width:100%; border:none; min-height:600px;">
 * </iframe>
 * <script src="/user/themes/YOUR_THEME/js/qry-iframe-listener.js"></script>
 */

(function() {
    'use strict';

    // Listen for height update messages from Qry apps
    window.addEventListener('message', function(event) {
        // Optional: Add origin validation for security
        // if (event.origin !== 'https://yourdomain.com') return;

        // Check if it's a Qry resize message
        if (event.data && event.data.type === 'qry-resize') {
            const newHeight = event.data.height;

            // Find the iframe that sent this message
            const iframes = document.querySelectorAll('iframe.qry-app, iframe[src*="qry-"]');

            iframes.forEach(function(iframe) {
                // Check if this iframe's contentWindow matches the message source
                if (iframe.contentWindow === event.source) {
                    iframe.style.height = newHeight + 'px';

                    // Optional: Log for debugging
                    if (window.console && console.log) {
                        console.log('[Qry Iframe] Height updated:', newHeight + 'px');
                    }
                }
            });
        }
    });

    console.log('[Qry Iframe Listener] Ready');
})();