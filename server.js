// SERVER.JS 
const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
// At the top with other imports
const flash = require('connect-flash');
dotenv.config();
// Add this import at the top
const cors = require('cors');
// Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const apiAuthRoutes = require('./routes/apiAuthRoutes');
// Add these imports at the top with other routes
const emailRoutes = require('./routes/emailRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/jwt-debug', (req, res) => {
    res.render('jwt-debug', { layout: false });
});
// MIDDLEWARE
// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add these routes after your existing app.use statements
app.use('/', emailRoutes);
app.use('/', passwordRoutes);
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session setup for WEB UI
app.use(session({
    secret: process.env.SESSION_SECRET || 'myfallbacksecret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// After session setup, add flash middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'myfallbacksecret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ✅ ADD THIS - Flash middleware (must be after session)
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    next();
});
// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.req = req;
    next();
});
// Add this after creating app, before other middleware
app.use(cors({
    origin: '*',  // Allow all origins (for development)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// VIEW ENGINE SETUP
// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// IMPORTANT: Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// LANDING PAGE ROUTE 
// Landing page - accessible to everyone
app.get('/', (req, res) => {
    // Agar user logged in hai to dashboard par bhejo
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        // Nahi to landing page dikhao - layout use nahi karna (landing ka apna alag design hai)
        res.render('landing', { 
            user: null,
            layout: false  // ✅ IMPORTANT: Landing page ke liye layout false karo
        });
    }
});

app.use('/api', apiAuthRoutes);  // /api/login, /api/books → JSON return karega
// Ye line add karo API routes ke baad

// WEB ROUTES (HTML)

app.use('/', authRoutes);     // /login, /register → HTML return karega
app.use('/', bookRoutes);     // /books, /dashboard → HTML return karega


// API ROUTES (JSON) 

console.log('📋 Registered API Routes:');
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods)} -> /api${r.route.path}`);
    }
});
// ERROR HANDLING

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ success: false, message: 'API endpoint not found' });
    } else {
        res.status(404).render('error', { message: 'Page not found' });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', err);
    console.error('Stack:', err.stack);
    
    if (req.path.startsWith('/api')) {
        res.status(500).json({ success: false, message: err.message });
    } else {
        res.status(500).render('error', { 
            message: err.message || 'Something went wrong!'
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔐 API: http://localhost:${PORT}/api`);
});