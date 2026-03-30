// LOAN MODEL - Handles borrowing/returning operations
const db = require('../config/database');

const LoanModel = {
    // Create a new loan (borrow book)
    async create(userId, bookId) {
        // Calculate due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);
        const formattedDueDate = dueDate.toISOString().split('T')[0];
        
        const query = 'INSERT INTO loans (user_id, book_id, due_date) VALUES (?, ?, ?)';
        const [result] = await db.execute(query, [userId, bookId, formattedDueDate]);
        
        return result.insertId;
    },

    // Get loan by ID
    async getById(id) {
        const query = 'SELECT * FROM loans WHERE id = ?';
        const [rows] = await db.execute(query, [id]);
        
        return rows[0];
    },

    // Get active loans for a user
    async getUserActiveLoans(userId) {
        const query = `
            SELECT l.*, b.title, b.author, b.id as book_id 
            FROM loans l 
            JOIN books b ON l.book_id = b.id 
            WHERE l.user_id = ? AND l.status = 'borrowed'
            ORDER BY l.due_date ASC
        `;
        const [rows] = await db.execute(query, [userId]);
        
        return rows;
    },

    // Get loan history for a user
    async getUserLoanHistory(userId) {
        const query = `
            SELECT l.*, b.title, b.author 
            FROM loans l 
            JOIN books b ON l.book_id = b.id 
            WHERE l.user_id = ? AND l.status = 'returned'
            ORDER BY l.return_date DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        
        return rows;
    },

    // Return a book
    async returnBook(loanId) {
        const today = new Date().toISOString().split('T')[0];
        
        const query = 'UPDATE loans SET status = "returned", return_date = ? WHERE id = ?';
        const [result] = await db.execute(query, [today, loanId]);
        
        return result.affectedRows > 0;
    },

    // ✅ Check if user already has this book
    async hasActiveLoan(userId, bookId) {
        const query = 'SELECT * FROM loans WHERE user_id = ? AND book_id = ? AND status = "borrowed"';
        const [rows] = await db.execute(query, [userId, bookId]);
        
        return rows.length > 0;
    },

    // Get all active loans (for librarian)
    async getAllActiveLoans() {
        const query = `
            SELECT l.*, u.name as user_name, b.title as book_title, b.author 
            FROM loans l 
            JOIN users u ON l.user_id = u.id 
            JOIN books b ON l.book_id = b.id 
            WHERE l.status = 'borrowed'
            ORDER BY l.due_date ASC
        `;
        const [rows] = await db.execute(query);
        
        return rows;
    },

    // Check for overdue books and update status
    async checkOverdueBooks() {
        const today = new Date().toISOString().split('T')[0];
        
        const query = 'UPDATE loans SET status = "overdue" WHERE status = "borrowed" AND due_date < ?';
        const [result] = await db.execute(query, [today]);
        
        return result.affectedRows;
    },

    // Count user's active loans
    async countUserLoans(userId) {
        const query = 'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = "borrowed"';
        const [rows] = await db.execute(query, [userId]);
        
        return rows[0].count;
    }
};

module.exports = LoanModel;