-- Add new columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
MODIFY COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Add new columns to user_performance table if they don't exist
ALTER TABLE user_performance
ADD COLUMN IF NOT EXISTS duration INT DEFAULT 30,
MODIFY COLUMN username VARCHAR(255) NOT NULL,
ADD FOREIGN KEY IF NOT EXISTS (username) REFERENCES users(username) ON DELETE CASCADE;
