-- Add is_edited column to clips table
ALTER TABLE clips ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

-- Create index on is_edited for faster queries
CREATE INDEX idx_clips_is_edited ON clips(is_edited);
