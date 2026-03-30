# 📚 Library Management System

A complete, production-ready Library Management System built with **Node.js**, **Express.js**, **MySQL**, and **JWT Authentication**. This system provides both web interface and RESTful APIs for complete library automation.

---

## 🚀 **Quick Start**
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
mysql -u root -p library_db < database.sql

# Start the application
npm run dev

✨ Key Features
🔐 Authentication & Security – JWT token-based API authentication, session-based web authentication, bcrypt password hashing, role-based access (Member/Librarian), and email-based password recovery.

📖 Book Management – Add, edit, delete books, multi-field search (title, author, ISBN, category), real-time copy availability tracking, and automatic $10/day overdue fine calculation.

🔄 Borrow/Return System – One-click borrowing with 14-day due date, instant return processing, duplicate borrowing prevention, and borrowing blocked if fines are pending.

📧 Email Notifications – Password reset links (1-hour expiry), due date reminders, and overdue alerts.

📊 Role-Based Dashboards – Members see borrowed books, due dates, history, and fines. Librarians see total books, active loans, overdue tracking, and user management.


🛠️ Technology Stack
Backend: Node.js, Express.js, MySQL, JWT, bcryptjs, Nodemailer
Frontend: EJS, Bootstrap 5, JavaScript
Documentation: Swagger/OpenAPI



📁 Folder Structure
LIBRARY MS/
│
├── 📂 config/                 # Configuration files
│   └── database.js           # MySQL connection pool
│
├── 📂 controllers/           # Business logic layer
│   ├── authController.js     # Login, Register, Logout
│   └── bookController.js     # Book CRUD, Borrow, Return
│
├── 📂 middleware/            # Security layer
│   └── jwt.js               # JWT verification, role check
│
├── 📂 models/                # Database layer
│   ├── UserModel.js         # User queries
│   ├── BookModel.js         # Book queries
│   └── LoanModel.js         # Loan queries
│
├── 📂 routes/                # URL mapping layer
│   ├── apiAuthRoutes.js     # REST APIs (JWT)
│   ├── authRoutes.js        # Web auth (session)
│   └── bookRoutes.js        # Web books (session)
│
├── 📂 utils/                 # Helper utilities
│   └── email.js             # Email notifications
│
├── 📂 views/                 # EJS templates
│   ├── layout.ejs           # Master template
│   ├── login.ejs            # Login page
│   ├── register.ejs         # Registration page
│   ├── dashboard.ejs        # User dashboard
│   ├── books.ejs            # Books listing
│   ├── add-book.ejs         # Add book form
│   ├── edit-book.ejs        # Edit book form
│   ├── forgot-password.ejs  # Password reset request
│   ├── reset-password.ejs   # Set new password
│   └── landing.ejs          # Welcome page
│
├── 📂 public/                # Static files
│   ├── css/
│   │   └── style.css        # Custom styles
│   └── js/
│       └── script.js        # Client-side JavaScript
│
├── .env                      # Environment variables
├── package.json              # Dependencies
├── server.js                 # Application entry point
├── database.sql              # Database schema
└── README.md                 # Documentation





📡 API Endpoints
---Authentication (Public)

POST /api/login – Login & get JWT token

POST /api/register – Register new user

POST /api/forgot-password – Request password reset

POST /api/reset-password – Reset password with token

----Book APIs (JWT Required)

GET /api/books – Get all books

GET /api/books/:id – Get single book

GET /api/books/search?q= – Search books

POST /api/books/borrow/:id – Borrow a book

POST /api/books/return/:id – Return a book

-----Librarian APIs (JWT + Role Required)

POST /api/books – Add new book

PUT /api/books/:id – Update book

DELETE /api/books/:id – Delete book

GET /api/users – Get all users

👤 Default Users
Role	Email	Password
Librarian	librarian@library.com	password123
Member	member@library.com	password123


🧪 Testing
Postman: Login → Get token → Use Authorization: Bearer <token> for protected endpoints


🐛 Common Issues
Issue	Solution
Database connection failed	Start MySQL, verify .env credentials
Port 3000 in use	Change PORT in .env or kill process
JWT token invalid	Token expired, login again
Email not sending	Use Gmail App Password, enable 2FA

🚀 Deployment---IIS

👩‍💻 Developer
Name: Shamaila Ansari

📄 License
MIT License – Free for personal and commercial use.

Built with ❤️ by Shamaila Ansari
Last Updated: 25March 2026