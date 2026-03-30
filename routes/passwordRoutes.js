// ============================================
// PASSWORD RESET ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const UserModel = require('../models/UserModel');
const { sendPasswordResetEmail } = require('../utils/email');

// Forgot Password - Show form (web)
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, success: null });
});

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.render('forgot-password', { 
                error: 'Email is required', 
                success: null 
            });
        }
        
        const user = await UserModel.findByEmail(email);
        
        if (!user) {
            return res.render('forgot-password', { 
                error: 'No account found with this email', 
                success: null 
            });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour
        
        // Save token to database
        await UserModel.saveResetToken(email, resetToken, resetExpires);
        
        // Send reset email
        await sendPasswordResetEmail(email, resetToken, user.name);
        
        res.render('forgot-password', { 
            error: null, 
            success: 'Password reset link sent to your email! Check your inbox.' 
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('forgot-password', { 
            error: 'Something went wrong. Please try again.', 
            success: null 
        });
    }
});

// Reset Password - Show form
router.get('/reset-password', async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.redirect('/login');
    }
    
    const user = await UserModel.findByResetToken(token);
    
    if (!user) {
        return res.render('error', { message: 'Invalid or expired reset link' });
    }
    
    res.render('reset-password', { token, error: null });
});

// Reset Password - Set new password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (!newPassword) {
            return res.render('reset-password', { 
                token, 
                error: 'Password is required' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.render('reset-password', { 
                token, 
                error: 'Password must be at least 6 characters' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.render('reset-password', { 
                token, 
                error: 'Passwords do not match' 
            });
        }
        
        const user = await UserModel.findByResetToken(token);
        
        if (!user) {
            return res.render('error', { message: 'Invalid or expired reset link' });
        }
        
        // Update password
        await UserModel.updatePassword(user.id, newPassword);
        
        // Clear reset token
        await UserModel.clearResetToken(user.id);
        
        res.redirect('/login?reset=success');
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.render('reset-password', { 
            token, 
            error: 'Something went wrong. Please try again.' 
        });
    }
});

module.exports = router;