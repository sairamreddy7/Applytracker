const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `resume-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

// File filter for PDFs and DOC/DOCX
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// All routes require authentication
router.use(authenticateToken);

// Get all resumes for current user
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, file_name, original_name, file_size, mime_type, uploaded_at 
       FROM resumes 
       WHERE user_id = $1 
       ORDER BY uploaded_at DESC`,
            [req.user.id]
        );
        res.json({ resumes: result.rows });
    } catch (error) {
        console.error('Get resumes error:', error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// Upload resume
router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { filename, originalname, path: filePath, size, mimetype } = req.file;

        const result = await db.query(
            `INSERT INTO resumes (user_id, file_name, original_name, file_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, file_name, original_name, file_size, mime_type, uploaded_at`,
            [req.user.id, filename, originalname, filePath, size, mimetype]
        );

        res.status(201).json({ resume: result.rows[0] });
    } catch (error) {
        console.error('Upload resume error:', error);
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ error: 'Failed to upload resume' });
    }
});

// Delete resume
router.delete('/:id', async (req, res) => {
    try {
        // Get file path before deleting
        const getResult = await db.query(
            'SELECT file_path FROM resumes WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (getResult.rows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const filePath = getResult.rows[0].file_path;

        // Delete from database
        await db.query(
            'DELETE FROM resumes WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        // Delete file from disk
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
        }

        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Delete resume error:', error);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
});

// Download resume
router.get('/:id/download', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT file_path, original_name FROM resumes WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const { file_path, original_name } = result.rows[0];

        if (!fs.existsSync(file_path)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(file_path, original_name);
    } catch (error) {
        console.error('Download resume error:', error);
        res.status(500).json({ error: 'Failed to download resume' });
    }
});

// Error handler for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

module.exports = router;
