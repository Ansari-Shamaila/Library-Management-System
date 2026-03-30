const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Setup route to create users
router.get('/setup', async (req, res) => {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Delete existing users
        await db.execute('DELETE FROM users');
        
        // Insert new users
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['John Librarian', 'librarian@library.com', hashedPassword, 'librarian']
        );
        
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Jane Member', 'member@library.com', hashedPassword, 'member']
        );
        
        res.send(`
            <h2>Setup Complete!</h2>
            <p>Users created successfully:</p>
            <ul>
                <li>librarian@library.com / password123</li>
                <li>member@library.com / password123</li>
            </ul>
            <a href="/login">Go to Login Page</a>
        `);
    } catch (error) {
        res.send('Error: ' + error.message);
    }
});

module.exports = router;