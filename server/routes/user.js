const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all emails for current user
router.get('/emails', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, is_primary, created_at FROM user_emails WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC',
            [req.user.id]
        );
        res.json({ emails: result.rows });
    } catch (error) {
        console.error('Get emails error:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// Add new email
router.post('/emails', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        // Check if email already exists for user
        const existing = await db.query(
            'SELECT id FROM user_emails WHERE user_id = $1 AND email = $2',
            [req.user.id, email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if this is the first email (make it primary)
        const count = await db.query(
            'SELECT COUNT(*) as count FROM user_emails WHERE user_id = $1',
            [req.user.id]
        );
        const isPrimary = parseInt(count.rows[0].count) === 0;

        const result = await db.query(
            'INSERT INTO user_emails (user_id, email, is_primary) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, email, isPrimary]
        );

        res.status(201).json({ email: result.rows[0] });
    } catch (error) {
        console.error('Add email error:', error);
        res.status(500).json({ error: 'Failed to add email' });
    }
});

// Delete email
router.delete('/emails/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM user_emails WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        res.json({ message: 'Email deleted' });
    } catch (error) {
        console.error('Delete email error:', error);
        res.status(500).json({ error: 'Failed to delete email' });
    }
});

// Set primary email
router.put('/emails/:id/primary', async (req, res) => {
    try {
        // Remove primary from all user's emails
        await db.query(
            'UPDATE user_emails SET is_primary = false WHERE user_id = $1',
            [req.user.id]
        );

        // Set new primary
        const result = await db.query(
            'UPDATE user_emails SET is_primary = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        res.json({ email: result.rows[0] });
    } catch (error) {
        console.error('Set primary email error:', error);
        res.status(500).json({ error: 'Failed to set primary email' });
    }
});

module.exports = router;
