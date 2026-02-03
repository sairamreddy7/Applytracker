-- Migration V6: Interview Fields and Status Update
-- Run: In Supabase SQL Editor

-- Add interview tracking columns
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_round INTEGER DEFAULT 0;

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Update status check constraint to include 'Assessment'
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check 
    CHECK (status IN ('Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Ghosted'));
