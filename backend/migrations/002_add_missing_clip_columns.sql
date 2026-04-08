-- Migration 002: Add missing clip columns (subtitle outline, is_edited)
-- These were added during the subtitle outline and edit-tracking features.

ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS subtitle_outline_color VARCHAR(7) DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS subtitle_outline_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
