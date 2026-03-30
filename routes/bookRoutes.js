// WEB BOOK ROUTES 
const express = require('express');
const router = express.Router();
const BookModel = require('../models/BookModel');
const LoanModel = require('../models/LoanModel');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// All web book routes require authentication
router.use(isAuthenticated);

// Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const user = req.session.user;
        
        if (user.role === 'librarian') {
            const loans = await LoanModel.getAllActiveLoans() || [];
            const books = await BookModel.getAll() || [];
            
            res.render('dashboard', { 
                user,
                loans,
                books,
                userRole: 'librarian',
                stats: {
                    totalBooks: books.length,
                    activeLoans: loans.length
                },
                activeLoans: [],
                loanHistory: []
            });
        } else {
            const activeLoans = await LoanModel.getUserActiveLoans(user.id) || [];
            const loanHistory = await LoanModel.getUserLoanHistory(user.id) || [];
            
            res.render('dashboard', { 
                user,
                activeLoans,
                loanHistory,
                userRole: 'member',
                loans: [],
                books: [],
                stats: { totalBooks: 0, activeLoans: 0 }
            });
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('error', { 
            message: 'Error loading dashboard: ' + error.message 
        });
    }
});

// ✅ UPDATED: List all books with userBorrowedBooks
router.get('/books', async (req, res) => {
    try {
        const books = await BookModel.getAll() || [];
        
        // Get user's borrowed book IDs
        let userBorrowedBooks = [];
        if (req.session.user) {
            const activeLoans = await LoanModel.getUserActiveLoans(req.session.user.id);
            userBorrowedBooks = activeLoans.map(loan => loan.book_id);
        }
        
        res.render('books', { 
            books,
            userBorrowedBooks,  // 👈 Pass to template
            message: null,
            searchTerm: '',
            user: req.session.user
        });
    } catch (error) {
        console.error('Books error:', error);
        res.render('error', { message: error.message });
    }
});

// ✅ UPDATED: Search books with userBorrowedBooks
router.get('/books/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const books = await BookModel.search(searchTerm) || [];
        
        // Get user's borrowed book IDs
        let userBorrowedBooks = [];
        if (req.session.user) {
            const activeLoans = await LoanModel.getUserActiveLoans(req.session.user.id);
            userBorrowedBooks = activeLoans.map(loan => loan.book_id);
        }
        
        res.render('books', { 
            books,
            userBorrowedBooks,  // 👈 Pass to template
            searchTerm,
            message: books.length === 0 ? 'No books found' : null,
            user: req.session.user
        });
    } catch (error) {
        console.error('Search error:', error);
        res.render('error', { message: error.message });
    }
});

// Add book page
router.get('/books/add', (req, res) => {
    if (req.session.user.role !== 'librarian') {
        return res.status(403).send('Access denied');
    }
    res.render('add-book', { error: null, user: req.session.user });
});

// Add book
router.post('/books/add', async (req, res) => {
    if (req.session.user.role !== 'librarian') {
        return res.status(403).send('Access denied');
    }
    
    try {
        const { title, author, isbn, category, total_copies } = req.body;
        
        if (!title || !author || !isbn || !category || !total_copies) {
            return res.render('add-book', { error: 'All fields are required', user: req.session.user });
        }
        
        await BookModel.create({
            title,
            author,
            isbn,
            category,
            total_copies: parseInt(total_copies)
        });
        
        res.redirect('/books');
    } catch (error) {
        console.error('Add book error:', error);
        res.render('add-book', { error: error.message, user: req.session.user });
    }
});

// Edit book page
router.get('/books/edit/:id', async (req, res) => {
    if (req.session.user.role !== 'librarian') {
        return res.status(403).send('Access denied');
    }
    
    try {
        const book = await BookModel.getById(req.params.id);
        if (!book) {
            return res.render('error', { message: 'Book not found' });
        }
        res.render('edit-book', { book, error: null, user: req.session.user });
    } catch (error) {
        console.error('Edit book error:', error);
        res.render('error', { message: error.message });
    }
});

// Update book
router.post('/books/edit/:id', async (req, res) => {
    if (req.session.user.role !== 'librarian') {
        return res.status(403).send('Access denied');
    }
    
    try {
        await BookModel.update(req.params.id, req.body);
        res.redirect('/books');
    } catch (error) {
        console.error('Update book error:', error);
        const book = await BookModel.getById(req.params.id);
        res.render('edit-book', { book, error: error.message, user: req.session.user });
    }
});

// Delete book
router.post('/books/delete/:id', async (req, res) => {
    if (req.session.user.role !== 'librarian') {
        return res.status(403).send('Access denied');
    }
    
    try {
        await BookModel.delete(req.params.id);
        res.redirect('/books');
    } catch (error) {
        console.error('Delete book error:', error);
        res.render('error', { message: error.message });
    }
});

// ✅ UPDATED: Borrow book with duplicate check
router.post('/books/borrow/:id', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const bookId = req.params.id;
        
        // Check if book exists
        const book = await BookModel.getById(bookId);
        if (!book) {
            req.flash('error', 'Book not found');
            return res.redirect('/books');
        }
        
        // ✅ CHECK IF USER ALREADY HAS THIS BOOK
        const hasLoan = await LoanModel.hasActiveLoan(userId, bookId);
        
        if (hasLoan) {
            req.flash('error', `You already have "${book.title}"! Please return it first.`);
            return res.redirect('/books');
        }
        
        // Check availability
        if (book.available_copies <= 0) {
            req.flash('error', `"${book.title}" is not available.`);
            return res.redirect('/books');
        }
        
        await LoanModel.create(userId, bookId);
        await BookModel.decreaseAvailableCopies(bookId);
        
        req.flash('success', `"${book.title}" borrowed successfully!`);
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Borrow error:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/books');
    }
});

// Return book
router.post('/books/return/:id', async (req, res) => {
    try {
        const loanId = req.params.id;
        const loan = await LoanModel.getById(loanId);
        
        if (!loan) {
            return res.render('error', { message: 'Loan not found' });
        }
        
        if (loan.user_id != req.session.user.id && req.session.user.role !== 'librarian') {
            return res.status(403).render('error', { message: 'Unauthorized' });
        }
        
        await LoanModel.returnBook(loanId);
        await BookModel.increaseAvailableCopies(loan.book_id);
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Return error:', error);
        res.render('error', { message: error.message });
    }
});

module.exports = router;