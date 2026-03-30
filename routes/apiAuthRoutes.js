
// API AUTH ROUTES 
const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const BookModel = require('../models/BookModel');
const LoanModel = require('../models/LoanModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15d' }
    );
};

// Verify token middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        //IMPORTANT: Poora user object database se lao
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        //req.user mein poori user details store karo
        req.user = user;
        req.token = token;
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Check if user is librarian
const isLibrarian = (req, res, next) => {
    if (req.user && req.user.role === 'librarian') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: 'Access denied. Librarian only.' 
        });
    }
};

// ========== AUTHENTICATION APIS (PUBLIC) ==========

/**
 * @route   POST /api/login
 * @desc    User login - returns JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await UserModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

/**
 * @route   POST /api/register
 * @desc    Register new user - returns JWT token
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            phone
        });

        // Get created user
        const newUser = await UserModel.findById(userId);
        
        // Generate token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

/**
 * @route   GET /api/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   POST /api/logout
 * @desc    Logout user (client discards token)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logged out successfully' 
    });
});

// ========== BOOK APIS (NEED TOKEN) ==========

/**
 * @route   GET /api/books
 * @desc    Get all books
 * @access  Private
 */
router.get('/books', authenticate, async (req, res) => {
    try {
        const books = await BookModel.getAll() || [];
        res.json({ 
            success: true, 
            count: books.length,
            books 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/books/:id
 * @desc    Get single book by ID
 * @access  Private
 */
router.get('/books/:id', authenticate, async (req, res) => {
    try {
        const book = await BookModel.getById(req.params.id);
        
        if (!book) {
            return res.status(404).json({ 
                success: false, 
                message: 'Book not found' 
            });
        }
        
        res.json({ 
            success: true, 
            book 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/books/search/:query
 * @desc    Search books by query parameter
 * @access  Private
 */
router.get('/books/search/:query', authenticate, async (req, res) => {
    try {
        const books = await BookModel.search(req.params.query) || [];
        res.json({ 
            success: true, 
            count: books.length,
            books 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/books/search
 * @desc    Search books by query string
 * @access  Private
 */
router.get('/books/search', authenticate, async (req, res) => {
    try {
        const query = req.query.q || '';
        const books = await BookModel.search(query) || [];
        res.json({ 
            success: true, 
            count: books.length,
            books 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ========== BORROW/RETURN APIS ==========

/**
 * @route   POST /api/books/borrow/:id
 * @desc    Borrow a book
 * @access  Private
 */
router.post('/books/borrow/:id', authenticate, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;

        // Check if book exists
        const book = await BookModel.getById(bookId);

        if (!book) {
            return res.status(404).json({ 
                success: false, 
                message: 'Book not found' 
            });
        }

        // Check availability
        if (book.available_copies <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Book is not available' 
            });
        }

        // Check if already borrowed
        const hasLoan = await LoanModel.hasActiveLoan(userId, bookId);

        if (hasLoan) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have this book' 
            });
        }

        // Create loan
        const loanId = await LoanModel.create(userId, bookId);

        // Update available copies
        await BookModel.decreaseAvailableCopies(bookId);

        // Get loan details
        const loan = await LoanModel.getById(loanId);

        res.status(201).json({
            success: true,
            message: 'Book borrowed successfully',
            loan: {
                id: loan.id,
                bookId: book.id,
                bookTitle: book.title,
                dueDate: loan.due_date
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   POST /api/books/return/:id
 * @desc    Return a book
 * @access  Private
 */
router.post('/books/return/:id', authenticate, async (req, res) => {
    try {
        const loanId = req.params.id;

        // Get loan details
        const loan = await LoanModel.getById(loanId);

        if (!loan) {
            return res.status(404).json({ 
                success: false, 
                message: 'Loan not found' 
            });
        }

        // Check if book belongs to user (unless librarian)
        if (loan.user_id != req.user.id && req.user.role !== 'librarian') {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only return your own books' 
            });
        }

        // Return the book
        await LoanModel.returnBook(loanId);

        // Increase available copies
        await BookModel.increaseAvailableCopies(loan.book_id);

        res.json({
            success: true,
            message: 'Book returned successfully'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/user/loans
 * @desc    Get user's active loans and history
 * @access  Private
 */
router.get('/user/loans', authenticate, async (req, res) => {
    try {
        const activeLoans = await LoanModel.getUserActiveLoans(req.user.id) || [];
        const history = await LoanModel.getUserLoanHistory(req.user.id) || [];

        res.json({
            success: true,
            activeLoans,
            history
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ========== LIBRARIAN ONLY APIS ==========

/**
 * @route   POST /api/books
 * @desc    Add new book (librarian only)
 * @access  Private/Librarian
 */
router.post('/books', authenticate, isLibrarian, async (req, res) => {
    try {
        const { title, author, isbn, category, total_copies } = req.body;

        if (!title || !author || !isbn || !category || !total_copies) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const bookId = await BookModel.create({
            title,
            author,
            isbn,
            category,
            total_copies: parseInt(total_copies)
        });

        const newBook = await BookModel.getById(bookId);

        res.status(201).json({
            success: true,
            message: 'Book added successfully',
            book: newBook
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   PUT /api/books/:id
 * @desc    Update book (librarian only)
 * @access  Private/Librarian
 */
router.put('/books/:id', authenticate, isLibrarian, async (req, res) => {
    try {
        const bookId = req.params.id;
        
        // Check if book exists
        const book = await BookModel.getById(bookId);
        
        if (!book) {
            return res.status(404).json({ 
                success: false, 
                message: 'Book not found' 
            });
        }

        await BookModel.update(bookId, req.body);
        const updatedBook = await BookModel.getById(bookId);

        res.json({
            success: true,
            message: 'Book updated successfully',
            book: updatedBook
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book (librarian only)
 * @access  Private/Librarian
 */
router.delete('/books/:id', authenticate, isLibrarian, async (req, res) => {
    try {
        const bookId = req.params.id;
        
        // Check if book has active loans
        const db = require('../config/database');
        const [loans] = await db.execute(
            'SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = "borrowed"',
            [bookId]
        );

        if (loans[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete book with active loans' 
            });
        }

        const deleted = await BookModel.delete(bookId);

        if (deleted) {
            res.json({
                success: true,
                message: 'Book deleted successfully'
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Book not found' 
            });
        }

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/admin/loans
 * @desc    Get all loans (librarian view)
 * @access  Private/Librarian
 */
router.get('/admin/loans', authenticate, isLibrarian, async (req, res) => {
    try {
        const loans = await LoanModel.getAllActiveLoans() || [];
        res.json({
            success: true,
            count: loans.length,
            loans
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ========== USER MANAGEMENT APIS (Librarian only) ==========

/**
 * @route   GET /api/users
 * @desc    Get all users (librarian only)
 * @access  Private/Librarian
 */
router.get('/users', authenticate, isLibrarian, async (req, res) => {
    try {
        const users = await UserModel.getAllUsers() || [];
        res.json({ 
            success: true, 
            count: users.length,
            users 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID (librarian only)
 * @access  Private/Librarian
 */
router.get('/users/:id', authenticate, isLibrarian, async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get user stats
        const stats = await UserModel.getUserStats(req.params.id);
        
        res.json({ 
            success: true, 
            user,
            stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   POST /api/users
 * @desc    Add new user (librarian only)
 * @access  Private/Librarian
 */
router.post('/users', authenticate, isLibrarian, async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email and password are required' 
            });
        }
        
        // Check if user exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userId = await UserModel.create({
            name, 
            email, 
            password: hashedPassword, 
            phone, 
            role: role || 'member'
        });
        
        const newUser = await UserModel.findById(userId);
        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            user: newUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (librarian only)
 * @access  Private/Librarian
 */
router.put('/users/:id', authenticate, isLibrarian, async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, phone, role } = req.body;
        
        const db = require('../config/database');
        await db.execute(
            'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
            [name, email, phone, role, userId]
        );
        
        const updatedUser = await UserModel.findById(userId);
        res.json({ 
            success: true, 
            message: 'User updated successfully',
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (librarian only)
 * @access  Private/Librarian
 */
router.delete('/users/:id', authenticate, isLibrarian, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if user has active loans
        const hasActiveLoans = await UserModel.hasActiveLoans(userId);
        
        if (hasActiveLoans) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete user with active loans' 
            });
        }
        
        await UserModel.deleteUser(userId);
        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (librarian only)
 * @access  Private/Librarian
 */
router.post('/users/:id/reset-password', authenticate, isLibrarian, async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const db = require('../config/database');
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
        
        res.json({ 
            success: true, 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ========== PROFILE APIS (Self Service) ==========

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        res.json({ 
            success: true, 
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   PUT /api/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        await UserModel.update(req.user.id, { name, phone });
        const updatedUser = await UserModel.findById(req.user.id);
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

/**
 * @route   PUT /api/change-password
 * @desc    Change current user password
 * @access  Private
 */
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current and new password are required' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters' 
            });
        }
        
        // Verify current password
        const user = await UserModel.findById(req.user.id);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const db = require('../config/database');
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;