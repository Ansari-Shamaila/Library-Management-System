//JWT  AUTH CONTROLLER
const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/jwt');

const AuthController = {
    // Login - Returns JWT token
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email and password are required' 
                });
            }
            // Find user
 const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password' 
                });
            }
// Check password
const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password' 
                });
            }
 // Generate JWT token
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
                message: 'Login failed: ' + error.message 
            });
        }
    },
    // Register - Returns JWT token
    async register(req, res) {
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
            // Check if user exists
            const existingUser = await UserModel.findByEmail(email);

            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already registered' 
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
                message: 'Registration failed: ' + error.message 
            });
        }
    },
    // Logout (client just discards token)
    logout(req, res) {
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    },

    // Get current user from token
    async getCurrentUser(req, res) {
        try {
            // User is already attached to req by authenticate middleware
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
    }
};

module.exports = AuthController;