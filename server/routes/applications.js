const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation helper
const validateApplication = (data) => {
    const errors = [];

    if (!data.company_name || data.company_name.trim().length === 0) {
        errors.push('Company name is required');
    }
    if (!data.job_title || data.job_title.trim().length === 0) {
        errors.push('Job title is required');
    }
    if (data.status && !['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'].includes(data.status)) {
        errors.push('Invalid status');
    }

    return errors;
};

// Get all applications for current user with advanced filtering
router.get('/', async (req, res) => {
    try {
        const {
            status,
            statuses,  // comma-separated for multi-select
            sort = 'updated_at',
            order = 'desc',
            search,
            date_from,
            date_to,
            resume_id,
            needs_attention
        } = req.query;

        let query = `
      SELECT ja.*, 
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'file_name', r.file_name, 'original_name', r.original_name)
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) as resumes,
        CASE 
          WHEN ja.follow_up_date < CURRENT_DATE AND ja.status NOT IN ('Offer', 'Rejected') THEN true 
          ELSE false 
        END as is_overdue
      FROM job_applications ja
      LEFT JOIN application_resumes ar ON ja.id = ar.application_id
      LEFT JOIN resumes r ON ar.resume_id = r.id
      WHERE ja.user_id = $1
    `;

        const params = [req.user.id];

        // Single status filter
        if (status) {
            params.push(status);
            query += ` AND ja.status = $${params.length}`;
        }

        // Multi-status filter
        if (statuses) {
            const statusList = statuses.split(',').map(s => s.trim());
            const placeholders = statusList.map((_, i) => `$${params.length + i + 1}`).join(',');
            params.push(...statusList);
            query += ` AND ja.status IN (${placeholders})`;
        }

        // Search filter (company, job title, notes)
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (
                ja.company_name ILIKE $${params.length} OR 
                ja.job_title ILIKE $${params.length} OR 
                ja.notes ILIKE $${params.length}
            )`;
        }

        // Date range filter
        if (date_from) {
            params.push(date_from);
            query += ` AND ja.application_date >= $${params.length}`;
        }
        if (date_to) {
            params.push(date_to);
            query += ` AND ja.application_date <= $${params.length}`;
        }

        // Resume filter
        if (resume_id) {
            params.push(resume_id);
            query += ` AND EXISTS (
                SELECT 1 FROM application_resumes ar2 
                WHERE ar2.application_id = ja.id AND ar2.resume_id = $${params.length}
            )`;
        }

        // Needs attention filter (overdue follow-ups)
        if (needs_attention === 'true') {
            query += ` AND ja.follow_up_date < CURRENT_DATE AND ja.status NOT IN ('Offer', 'Rejected')`;
        }

        const validSortColumns = ['updated_at', 'created_at', 'application_date', 'company_name', 'status', 'follow_up_date'];
        let sortColumn = validSortColumns.includes(sort) ? sort : 'updated_at';
        const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Special sort for urgency
        if (sort === 'urgency') {
            query += ` GROUP BY ja.id ORDER BY 
                CASE WHEN ja.follow_up_date < CURRENT_DATE THEN 0 
                     WHEN ja.follow_up_date = CURRENT_DATE THEN 1 
                     WHEN ja.follow_up_date IS NOT NULL THEN 2 
                     ELSE 3 END,
                ja.follow_up_date ASC NULLS LAST`;
        } else {
            query += ` GROUP BY ja.id ORDER BY ja.${sortColumn} ${sortOrder} NULLS LAST`;
        }

        const result = await db.query(query, params);
        res.json({ applications: result.rows });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Get single application
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ja.*, 
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'file_name', r.file_name, 'original_name', r.original_name)
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) as resumes
      FROM job_applications ja
      LEFT JOIN application_resumes ar ON ja.id = ar.application_id
      LEFT JOIN resumes r ON ar.resume_id = r.id
      WHERE ja.id = $1 AND ja.user_id = $2
      GROUP BY ja.id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ application: result.rows[0] });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// Create new application
router.post('/', async (req, res) => {
    try {
        const {
            company_name,
            job_title,
            experience_level,
            job_description,
            job_requirements,
            location,
            job_url,
            salary_min,
            salary_max,
            application_date,
            application_source,
            status,
            notes,
            follow_up_date,
            interview_round,
            interview_notes,
            resume_ids
        } = req.body;

        // Validate
        const errors = validateApplication(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        // Create application
        const result = await db.query(
            `INSERT INTO job_applications 
       (user_id, company_name, job_title, experience_level, job_description, job_requirements, location, 
        job_url, salary_min, salary_max, application_date, application_source, status, 
        notes, follow_up_date, interview_round, interview_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
            [
                req.user.id, company_name, job_title, experience_level || 'Entry Level / New Grad',
                job_description || null, job_requirements || null, location || null, job_url || null,
                salary_min || null, salary_max || null, application_date || null, application_source || null,
                status || 'Applied', notes || null, follow_up_date || null, interview_round || 0, interview_notes || null
            ]
        );

        const application = result.rows[0];

        // Link resumes if provided
        if (resume_ids && Array.isArray(resume_ids) && resume_ids.length > 0) {
            const linkPromises = resume_ids.map(resumeId =>
                db.query(
                    `INSERT INTO application_resumes (application_id, resume_id) 
           SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM resumes WHERE id = $2 AND user_id = $3)`,
                    [application.id, resumeId, req.user.id]
                )
            );
            await Promise.all(linkPromises);
        }

        res.status(201).json({ application });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// Update application
router.put('/:id', async (req, res) => {
    try {
        // Check ownership
        const checkResult = await db.query(
            'SELECT id FROM job_applications WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const {
            company_name,
            job_title,
            experience_level,
            job_description,
            job_requirements,
            location,
            job_url,
            salary_min,
            salary_max,
            application_date,
            application_source,
            status,
            notes,
            follow_up_date,
            interview_round,
            interview_notes,
            resume_ids
        } = req.body;

        // Validate
        const errors = validateApplication(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        // Update application
        const result = await db.query(
            `UPDATE job_applications SET
        company_name = $1, job_title = $2, experience_level = $3, job_description = $4, job_requirements = $5,
        location = $6, job_url = $7, salary_min = $8, salary_max = $9, application_date = $10,
        application_source = $11, status = $12, notes = $13, follow_up_date = $14,
        interview_round = $15, interview_notes = $16
       WHERE id = $17 AND user_id = $18
       RETURNING *`,
            [
                company_name, job_title, experience_level || 'Entry Level / New Grad',
                job_description || null, job_requirements || null, location || null, job_url || null,
                salary_min || null, salary_max || null, application_date || null, application_source || null,
                status || 'Applied', notes || null, follow_up_date || null, interview_round || 0, interview_notes || null,
                req.params.id, req.user.id
            ]
        );

        // Update resume links if provided
        if (resume_ids !== undefined && Array.isArray(resume_ids)) {
            // Remove existing links
            await db.query('DELETE FROM application_resumes WHERE application_id = $1', [req.params.id]);

            // Add new links
            if (resume_ids.length > 0) {
                const linkPromises = resume_ids.map(resumeId =>
                    db.query(
                        `INSERT INTO application_resumes (application_id, resume_id) 
             SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM resumes WHERE id = $2 AND user_id = $3)`,
                        [req.params.id, resumeId, req.user.id]
                    )
                );
                await Promise.all(linkPromises);
            }
        }

        res.json({ application: result.rows[0] });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Delete application
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

// Get application stats for dashboard
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
        COUNT(*) FILTER (WHERE status = 'Applied') as applied,
        COUNT(*) FILTER (WHERE status = 'Interview') as interview,
        COUNT(*) FILTER (WHERE status = 'Offer') as offer,
        COUNT(*) FILTER (WHERE status = 'Rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'Ghosted') as ghosted,
        COUNT(*) as total
       FROM job_applications WHERE user_id = $1`,
            [req.user.id]
        );
        res.json({ stats: result.rows[0] });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
