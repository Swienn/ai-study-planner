-- Add estimated study time (minutes) to topics
-- Existing topics default to 30 minutes
ALTER TABLE topics ADD COLUMN minutes integer NOT NULL DEFAULT 30;
