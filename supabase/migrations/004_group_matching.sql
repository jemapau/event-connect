-- Migration: 004_group_matching.sql
-- Description: Expand matches table to support groups instead of just pairs

-- Add an array column to store all participant UUIDs for a given match (group)
ALTER TABLE matches ADD COLUMN participant_ids UUID[] DEFAULT '{}';

-- Make participant_a and participant_b optional, since group matching will use participant_ids
ALTER TABLE matches ALTER COLUMN participant_a DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN participant_b DROP NOT NULL;

-- Automatically migrate existing pairs into the new participant_ids array so the frontend can rely solely on the array if it wants
UPDATE matches 
SET participant_ids = ARRAY[participant_a, participant_b] 
WHERE participant_a IS NOT NULL AND participant_b IS NOT NULL;
