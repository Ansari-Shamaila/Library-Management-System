// BOOK MODEL - Handles all book database operations
const db = require('../config/database');

const BookModel = {
    // Get all books
    async getAll() {
        const query = 'SELECT * FROM books ORDER BY title ASC';
        const [rows] = await db.execute(query);
        
        return rows;
    },
    // Get single book by ID
    async getById(id) {
        const query = 'SELECT * FROM books WHERE id = ?';
        const [rows] = await db.execute(query, [id]);
        
        return rows[0];
    },
    // Create a new book
    async create(bookData) {
        const { title, author, isbn, category, total_copies } = bookData;
        
        const query = 'INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [title, author, isbn, category, total_copies, total_copies]);
        
        return result.insertId;
    },

    // Update a book
    async update(id, bookData) {
        const { title, author, isbn, category, total_copies } = bookData;
        
        const query = 'UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, total_copies = ? WHERE id = ?';
        const [result] = await db.execute(query, [title, author, isbn, category, total_copies, id]);
        
        return result.affectedRows > 0;
    },

    // Delete a book
    async delete(id) {
        const query = 'DELETE FROM books WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        
        return result.affectedRows > 0;
    },

    // Search books
    async search(searchTerm) {
        const query = 'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?';
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await db.execute(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
        
        return rows;
    },

    // Update available copies when book is borrowed
    async decreaseAvailableCopies(bookId) {
        const query = 'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0';
        const [result] = await db.execute(query, [bookId]);
        
        return result.affectedRows > 0;
    },

    // Update available copies when book is returned
    async increaseAvailableCopies(bookId) {
        const query = 'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?';
        const [result] = await db.execute(query, [bookId]);
        
        return result.affectedRows > 0;
    }
};

module.exports = BookModel;