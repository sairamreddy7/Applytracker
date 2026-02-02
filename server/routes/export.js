const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Export as JSON
router.get('/json', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        ja.id, ja.company_name, ja.job_title, ja.job_description, ja.job_requirements,
        ja.location, ja.job_url, ja.salary_min, ja.salary_max, ja.application_date,
        ja.application_source, ja.status, ja.notes, ja.follow_up_date,
        ja.interview_round, ja.interview_notes, ja.created_at, ja.updated_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.original_name)
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) as resumes
       FROM job_applications ja
       LEFT JOIN application_resumes ar ON ja.id = ar.application_id
       LEFT JOIN resumes r ON ar.resume_id = r.id
       WHERE ja.user_id = $1
       GROUP BY ja.id
       ORDER BY ja.updated_at DESC`,
            [req.user.id]
        );

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="applytrack-export-${new Date().toISOString().split('T')[0]}.json"`);

        res.json({
            exportDate: new Date().toISOString(),
            totalApplications: result.rows.length,
            applications: result.rows
        });
    } catch (error) {
        console.error('Export JSON error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Export as CSV
router.get('/csv', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        ja.company_name, ja.job_title, ja.location, ja.job_url,
        ja.salary_min, ja.salary_max, ja.application_date, ja.application_source,
        ja.status, ja.notes, ja.follow_up_date, ja.interview_round,
        ja.interview_notes, ja.created_at
       FROM job_applications ja
       WHERE ja.user_id = $1
       ORDER BY ja.application_date DESC NULLS LAST`,
            [req.user.id]
        );

        // CSV header
        const headers = [
            'Company', 'Job Title', 'Location', 'URL', 'Salary Min', 'Salary Max',
            'Applied Date', 'Source', 'Status', 'Notes', 'Follow-up Date',
            'Interview Round', 'Interview Notes', 'Created At'
        ];

        // Build CSV rows
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = result.rows.map(row => [
            escapeCSV(row.company_name),
            escapeCSV(row.job_title),
            escapeCSV(row.location),
            escapeCSV(row.job_url),
            escapeCSV(row.salary_min),
            escapeCSV(row.salary_max),
            escapeCSV(row.application_date),
            escapeCSV(row.application_source),
            escapeCSV(row.status),
            escapeCSV(row.notes),
            escapeCSV(row.follow_up_date),
            escapeCSV(row.interview_round),
            escapeCSV(row.interview_notes),
            escapeCSV(row.created_at)
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="applytrack-export-${new Date().toISOString().split('T')[0]}.csv"`);

        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

module.exports = router;
