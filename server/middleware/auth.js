const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

const authenticateToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.token ||
            (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const result = await db.query(
            'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token ||
            (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const result = await db.query(
                'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1',
                [decoded.userId]
            );
            if (result.rows.length > 0) {
                req.user = result.rows[0];
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = { authenticateToken, optionalAuth };
