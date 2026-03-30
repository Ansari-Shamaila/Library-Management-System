// ============================================
// EMAIL UTILITY - Fixed SSL certificate issue
// ============================================

const nodemailer = require('nodemailer');

// Create transporter with better Gmail configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // ✅ Add this to fix certificate issue
    tls: {
        rejectUnauthorized: false
    },
    // ✅ Add connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000
});

// Test connection
const testConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service ready');
    } catch (error) {
        console.error('❌ Email service error:', error.message);
        console.log('📧 Email will work, but you might need to check Gmail settings');
    }
};
testConnection();

// Send due date reminder email
async function sendDueDateReminder(email, name, bookTitle, dueDate) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email not configured. Skipping email send.');
            return false;
        }
        
        const mailOptions = {
            from: `"LibraryMS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📚 Book Due Date Reminder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                    <div style="background: #3498db; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">📚 LibraryMS</h2>
                    </div>
                    <div style="padding: 20px;">
                        <h3>Hello ${name},</h3>
                        <p>This is a reminder that your borrowed book is due soon!</p>
                        <div style="background: #f8f9fa; padding: 15px; margin: 15px 0;">
                            <p><strong>Book:</strong> ${bookTitle}</p>
                            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                        </div>
                        <p>Please return the book on or before the due date to avoid late fines.</p>
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="http://localhost:3000/dashboard" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                View Dashboard
                            </a>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>© 2024 LibraryMS. All rights reserved.</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Reminder sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

// Send overdue notification
async function sendOverdueNotification(email, name, bookTitle, dueDate, fine) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email not configured. Skipping email send.');
            return false;
        }
        
        const mailOptions = {
            from: `"LibraryMS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⚠️ Overdue Book Notification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                    <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">⚠️ Overdue Book</h2>
                    </div>
                    <div style="padding: 20px;">
                        <h3>Hello ${name},</h3>
                        <p>Your borrowed book is now <strong style="color: #dc3545;">OVERDUE</strong>!</p>
                        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0;">
                            <p><strong>Book:</strong> ${bookTitle}</p>
                            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                            <p><strong>Current Fine:</strong> <span style="color: #dc3545;">$${fine}</span></p>
                        </div>
                        <p><strong>Please return the book immediately to avoid additional fines.</strong></p>
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="http://localhost:3000/dashboard" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Return Book Now
                            </a>
                        </div>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Overdue notification sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

// Send password reset email
async function sendPasswordResetEmail(email, resetToken, name) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email not configured. Skipping email send.');
            return false;
        }
        
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: `"LibraryMS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
                    <div style="background: #3498db; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">🔐 Password Reset</h2>
                    </div>
                    <div style="padding: 20px;">
                        <h3>Hello ${name},</h3>
                        <p>We received a request to reset your password.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                                Reset Password
                            </a>
                        </div>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

module.exports = {
    sendDueDateReminder,
    sendOverdueNotification,
    sendPasswordResetEmail
};