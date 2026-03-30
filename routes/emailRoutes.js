// ============================================
// EMAIL ROUTES - Due date reminders
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendDueDateReminder, sendOverdueNotification } = require('../utils/email');

// Send due date reminders (can be called by cron job)
router.post('/send-reminders', async (req, res) => {
    try {
        // Get all active loans with due date in next 3 days
        const [loans] = await db.execute(`
            SELECT l.*, u.name as user_name, u.email, b.title as book_title
            FROM loans l
            JOIN users u ON l.user_id = u.id
            JOIN books b ON l.book_id = b.id
            WHERE l.status = 'borrowed'
            AND l.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        `);
        
        let sentCount = 0;
        
        for (let loan of loans) {
            await sendDueDateReminder(
                loan.email,
                loan.user_name,
                loan.book_title,
                loan.due_date
            );
            sentCount++;
        }
        
        res.json({
            success: true,
            message: `Sent ${sentCount} reminder emails`
        });
        
    } catch (error) {
        console.error('Reminder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send overdue notifications
router.post('/send-overdue', async (req, res) => {
    try {
        const [loans] = await db.execute(`
            SELECT l.*, u.name as user_name, u.email, b.title as book_title,
                   DATEDIFF(CURDATE(), l.due_date) as days_overdue
            FROM loans l
            JOIN users u ON l.user_id = u.id
            JOIN books b ON l.book_id = b.id
            WHERE l.status = 'borrowed'
            AND l.due_date < CURDATE()
        `);
        
        let sentCount = 0;
        
        for (let loan of loans) {
            const fine = loan.days_overdue * 10;
            await sendOverdueNotification(
                loan.email,
                loan.user_name,
                loan.book_title,
                loan.due_date,
                fine
            );
            sentCount++;
        }
        
        res.json({
            success: true,
            message: `Sent ${sentCount} overdue notifications`
        });
        
    } catch (error) {
        console.error('Overdue error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;