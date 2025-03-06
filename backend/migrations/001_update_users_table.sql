-- Add missing columns for user authentication and verification
ALTER TABLE users
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login DATETIME,
ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(512),
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(512),
ADD COLUMN IF NOT EXISTS verification_token_expires DATETIME,
ADD COLUMN IF NOT EXISTS password_changed_at DATETIME,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing users to have verified status (optional, remove if not needed)
UPDATE users SET is_verified = true WHERE is_verified IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token); 