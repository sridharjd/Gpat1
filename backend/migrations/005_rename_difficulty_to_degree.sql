-- Rename difficulty column to degree in questions table
ALTER TABLE questions CHANGE COLUMN difficulty degree VARCHAR(20);

-- Update any existing indexes if they exist
DROP INDEX IF EXISTS idx_questions_difficulty ON questions;
CREATE INDEX idx_questions_degree ON questions(degree); 