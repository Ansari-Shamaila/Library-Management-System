
// USER MODEL - Complete with all functions
const db = require('../config/database');

const UserModel = {
    // Create a new user (registration)
    async create(userData) {
        const { name, email, password, phone, role = 'member' } = userData;
        
        const query = 'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [name, email, password, phone, role]);
        
        return result.insertId;
    },

    // Find user by email (for login)
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);
        
        return rows[0];
    },
    // Add these functions to your existing UserModel object

// Update user's password
async updatePassword(userId, newPassword) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await db.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
},

// Save reset token for user
async saveResetToken(email, token, expiresAt) {
    const query = 'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?';
    const [result] = await db.execute(query, [token, expiresAt, email]);
    return result.affectedRows > 0;
},

// Find user by reset token
async findByResetToken(token) {
    const query = 'SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()';
    const [rows] = await db.execute(query, [token]);
    return rows[0];
},

// Clear reset token after password change
async clearResetToken(userId) {
    const query = 'UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ?';
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows > 0;
},

    // Find user by ID
    async findById(id) {
        const query = 'SELECT id, name, email, phone, role FROM users WHERE id = ?';
        const [rows] = await db.execute(query, [id]);
        
        return rows[0];
    },

    // Update user profile
    async update(id, userData) {
        const { name, phone } = userData;
        
        const query = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
        const [result] = await db.execute(query, [name, phone, id]);
        
        return result.affectedRows > 0;
    },

    //GET ALL USERS 
    async getAllUsers() {
        const query = 'SELECT id, name, email, phone, role, created_at FROM users ORDER BY name ASC';
        const [rows] = await db.execute(query);
        return rows;
    },

    // Delete user by ID
    async deleteUser(id) {
        const query = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    },

    // Update user role
    async updateRole(id, role) {
        const query = 'UPDATE users SET role = ? WHERE id = ?';
        const [result] = await db.execute(query, [role, id]);
        return result.affectedRows > 0;
    },

    // Check if user has active loans
    async hasActiveLoans(userId) {
        const query = 'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = "borrowed"';
        const [rows] = await db.execute(query, [userId]);
        return rows[0].count > 0;
    },

    // Get user statistics
    async getUserStats(userId) {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM loans WHERE user_id = ?) as total_loans,
                (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = 'borrowed') as active_loans,
                (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = 'overdue') as overdue_loans
        `;
        const [rows] = await db.execute(query, [userId, userId, userId]);
        return rows[0];
    }
};

module.exports = UserModel;