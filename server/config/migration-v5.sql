-- Migration V5: Email Field and Simplified Salary
-- Run: psql $DATABASE_URL -f server/config/migration-v5.sql

-- Add email field for application tracking
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS application_email VARCHAR(255);

-- Add salary field (single combined field)
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS salary VARCHAR(100);

-- Migrate old salary data if exists
UPDATE job_applications 
SET salary = CASE 
    WHEN salary_min IS NOT NULL AND salary_max IS NOT NULL 
        THEN '$' || salary_min || 'k - $' || salary_max || 'k'
    WHEN salary_min IS NOT NULL 
        THEN '$' || salary_min || 'k+'
    WHEN salary_max IS NOT NULL 
        THEN 'Up to $' || salary_max || 'k'
    ELSE NULL
END
WHERE salary IS NULL AND (salary_min IS NOT NULL OR salary_max IS NOT NULL);

-- Create user_emails table for email settings
CREATE TABLE IF NOT EXISTS user_emails (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_emails_user_id ON user_emails(user_id);

-- Update status check constraint if exists (or just handle in validation)
-- Note: We're handling status validation in the backend
