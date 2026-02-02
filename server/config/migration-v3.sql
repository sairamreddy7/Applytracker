-- ApplyTrack Pro - Migration to v3
-- Run this to add interview tracking fields

-- Add interview fields to job_applications
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_round INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Add index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_job_applications_follow_up_date ON job_applications(follow_up_date);

-- Add index for text search
CREATE INDEX IF NOT EXISTS idx_job_applications_company_name ON job_applications(company_name);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_title ON job_applications(job_title);
