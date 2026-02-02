const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get status counts
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        status,
        COUNT(*) as count
       FROM job_applications 
       WHERE user_id = $1
       GROUP BY status
       ORDER BY count DESC`,
            [req.user.id]
        );

        // Also get total
        const totalResult = await db.query(
            'SELECT COUNT(*) as total FROM job_applications WHERE user_id = $1',
            [req.user.id]
        );

        res.json({
            statusCounts: result.rows,
            total: parseInt(totalResult.rows[0].total)
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get applications over time
router.get('/over-time', async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        let dateFormat, interval;
        if (period === 'month') {
            dateFormat = 'YYYY-MM';
            interval = '6 months';
        } else {
            dateFormat = 'IYYY-IW'; // ISO week
            interval = '12 weeks';
        }

        const result = await db.query(
            `SELECT 
        TO_CHAR(COALESCE(application_date, created_at::date), $2) as period,
        COUNT(*) as count
       FROM job_applications 
       WHERE user_id = $1 
         AND COALESCE(application_date, created_at::date) >= CURRENT_DATE - INTERVAL '${interval}'
       GROUP BY period
       ORDER BY period ASC`,
            [req.user.id, dateFormat]
        );

        res.json({ data: result.rows, period });
    } catch (error) {
        console.error('Get over-time error:', error);
        res.status(500).json({ error: 'Failed to fetch over-time data' });
    }
});

// Get resume usage frequency
router.get('/resumes', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        r.id, 
        r.original_name as name,
        COUNT(ar.application_id) as usage_count
       FROM resumes r
       LEFT JOIN application_resumes ar ON r.id = ar.resume_id
       WHERE r.user_id = $1
       GROUP BY r.id, r.original_name
       ORDER BY usage_count DESC`,
            [req.user.id]
        );

        res.json({ resumes: result.rows });
    } catch (error) {
        console.error('Get resume usage error:', error);
        res.status(500).json({ error: 'Failed to fetch resume usage' });
    }
});

// Get top companies by application count
router.get('/companies', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        company_name,
        COUNT(*) as count,
        array_agg(DISTINCT status) as statuses
       FROM job_applications 
       WHERE user_id = $1
       GROUP BY company_name
       ORDER BY count DESC
       LIMIT 10`,
            [req.user.id]
        );

        res.json({ companies: result.rows });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Get follow-up summary
router.get('/follow-ups', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        COUNT(*) FILTER (WHERE follow_up_date < CURRENT_DATE) as overdue,
        COUNT(*) FILTER (WHERE follow_up_date = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE follow_up_date > CURRENT_DATE AND follow_up_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming,
        COUNT(*) FILTER (WHERE follow_up_date IS NOT NULL) as total_with_followup
       FROM job_applications 
       WHERE user_id = $1 AND status NOT IN ('Offer', 'Rejected')`,
            [req.user.id]
        );

        res.json({ followUps: result.rows[0] });
    } catch (error) {
        console.error('Get follow-ups error:', error);
        res.status(500).json({ error: 'Failed to fetch follow-ups' });
    }
});

module.exports = router;
