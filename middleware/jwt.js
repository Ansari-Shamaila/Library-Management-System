
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
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
        { expiresIn: process.env.JWT_EXPIRE || '15d' }
    );
};

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided. Please login.' 
            });
        }

        // Token format: "Bearer [token]"
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Attach user to request
        req.user = user;
        req.token = token;
        
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please login again.' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token. Please login again.' 
            });
        }
        
        console.error('JWT Error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
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

module.exports = {
    generateToken,
    authenticate,
    isLibrarian
};