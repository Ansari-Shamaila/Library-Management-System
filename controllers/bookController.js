// BOOK CONTROLLER 
const BookModel = require('../models/BookModel');
const LoanModel = require('../models/LoanModel');

const BookController = {
    // Get all books
    async getAllBooks(req, res) {
        try {
            const books = await BookModel.getAll();
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
    },

    // Get single book
    async getBookById(req, res) {
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
    },
    // Search books
    async searchBooks(req, res) {
        try {
            const query = req.params.query || req.query.q || '';
            const books = await BookModel.search(query);
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
    },

    // Add book (librarian only)
    async addBook(req, res) {
        try {
            const { title, author, isbn, category, total_copies } = req.body;
            // Validation
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
    },
    // Update book (librarian only)
    async updateBook(req, res) {
        try {
            const bookId = req.params.id;
            const { title, author, isbn, category, total_copies } = req.body;

            // Check if book exists
            const book = await BookModel.getById(bookId);
            
            if (!book) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Book not found' 
                });
            }
            await BookModel.update(bookId, {
                title,
                author,
                isbn,
                category,
                total_copies: parseInt(total_copies)
            });

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
    },
// bookController.js - deleteBook function
async deleteBook(req, res) {
    try {
        const bookId = req.params.id;

        // ✅ CHECK IF BOOK HAS ACTIVE LOANS
        const [loans] = await db.execute(
            'SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = "borrowed"',
            [bookId]
        );

        // ❌ PREVENT DELETION IF ACTIVE LOANS EXIST
        if (loans[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete book with active loans' 
            });
        }

        // ✅ Only delete if no active loans
        const deleted = await BookModel.delete(bookId);
        // ...
        
    } catch (error) {
        // ...
    }
 },
//     // Delete book (librarian only)
//     async deleteBook(req, res) {
//         try {
//             const bookId = req.params.id;

//             // Check if book has active loans
//             const db = require('../config/database');
//             const [loans] = await db.execute(
//                 'SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = "borrowed"',
//                 [bookId]
//             );

//             if (loans[0].count > 0) {
//                 return res.status(400).json({ 
//                     success: false, 
//                     message: 'Cannot delete book with active loans' 
//                 });
//             }

//             const deleted = await BookModel.delete(bookId);

//             if (deleted) {
//                 res.json({
//                     success: true,
//                     message: 'Book deleted successfully'
//                 });
//             } else {
//                 res.status(404).json({ 
//                     success: false, 
//                     message: 'Book not found' 
//                 });
//             }

//         } catch (error) {
//             res.status(500).json({ 
//                 success: false, 
//                 message: error.message 
//             });
//         }
//     },

    // Borrow a book
    async borrowBook(req, res) {
        try {
            const bookId = req.params.id;
            const userId = req.user.id; // From JWT token

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
    },

    // Return a book
    async returnBook(req, res) {
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
    },

    // Get user's active loans
    async getUserLoans(req, res) {
        try {
            const activeLoans = await LoanModel.getUserActiveLoans(req.user.id);
            const history = await LoanModel.getUserLoanHistory(req.user.id);

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
    },

    // Get all loans (librarian only)
    async getAllLoans(req, res) {
        try {
            const loans = await LoanModel.getAllActiveLoans();
            
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
    }
    
};

module.exports = BookController;