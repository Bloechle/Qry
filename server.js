const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware for static files with development optimizations
app.use(express.static(__dirname, {
    maxAge: NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
        // CORS for development
        if (NODE_ENV === 'development') {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        // Proper MIME types
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for testing
app.get('/api/qry/info', (req, res) => {
    res.json({
        name: 'Qry.js',
        version: '1.1.0',
        description: 'Ultra-lightweight DOM manipulation library',
        endpoints: ['/api/qry/info', '/api/qry/test'],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/qry/test', (req, res) => {
    res.json({
        success: true,
        message: 'Qry.js API is working!',
        testData: {
            elements: ['#test', '.example', 'div'],
            methods: ['text', 'html', 'cls', 'css', 'click']
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        environment: NODE_ENV
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: ['/', '/demo', '/api/qry/info', '/api/qry/test', '/health']
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('\n🚀 Qry.js Development Server Started');
    console.log('=====================================');
    console.log(`📍 Local:      http://localhost:${PORT}`);
    console.log(`📍 Network:    http://127.0.0.1:${PORT}`);
    console.log(`📂 Directory:  ${__dirname}`);
    console.log(`⚡ Environment: ${NODE_ENV}`);
    console.log(`🕐 Started:    ${new Date().toLocaleString()}`);
    console.log('\n📋 Available Routes:');
    console.log('   GET  /           - Main demo page');
    console.log('   GET  /demo       - Demo page');
    console.log('   GET  /api/qry/info - API information');
    console.log('   GET  /api/qry/test - API test endpoint');
    console.log('   GET  /health     - Health check');
    console.log('\nPress Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});