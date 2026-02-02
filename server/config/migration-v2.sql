-- ApplyTrack Pro - Migration to v2
-- Run this if you have existing data from Phase 1

-- Add new columns to job_applications
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS job_requirements TEXT,
ADD COLUMN IF NOT EXISTS application_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Rename columns if they exist with old names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'company') THEN
        ALTER TABLE job_applications RENAME COLUMN company TO company_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'position') THEN
        ALTER TABLE job_applications RENAME COLUMN position TO job_title;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'applied_date') THEN
        ALTER TABLE job_applications RENAME COLUMN applied_date TO application_date;
    END IF;
END $$;

-- Update status constraint
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check 
    CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'));

-- Update resumes table columns
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS original_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Migrate old resume column names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resumes' AND column_name = 'name') THEN
        UPDATE resumes SET original_name = name WHERE original_name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resumes' AND column_name = 'filename') THEN
        ALTER TABLE resumes RENAME COLUMN filename TO file_name;
    END IF;
END $$;

-- Drop old columns
ALTER TABLE resumes DROP COLUMN IF EXISTS name;
ALTER TABLE resumes DROP COLUMN IF EXISTS is_default;
ALTER TABLE resumes DROP COLUMN IF EXISTS created_at;
ALTER TABLE resumes DROP COLUMN IF EXISTS updated_at;
