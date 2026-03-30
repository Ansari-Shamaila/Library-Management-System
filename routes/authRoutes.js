
// WEB AUTH ROUTES (for browser - uses sessions)
const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');

// Show login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login form submission
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findByEmail(email);

        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Set session (NOT JWT)
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        req.session.userId = user.id;
        req.session.userRole = user.role;

        res.redirect('/dashboard');

    } catch (error) {
        res.render('login', { error: 'Login failed' });
    }
});

// Show register page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Handle register form submission
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.render('register', { error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.create({
            name,
            email,
            password: hashedPassword,
            phone
        });

        res.redirect('/login?registered=true');

    } catch (error) {
        res.render('register', { error: 'Registration failed' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;