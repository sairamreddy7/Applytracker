-- Migration V4: Experience Level Field
-- Run: psql $DATABASE_URL -f server/config/migration-v4.sql

-- Add experience_level column
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);

-- Set default for existing rows
UPDATE job_applications 
SET experience_level = 'Entry Level' 
WHERE experience_level IS NULL;
