-- Add password reset token columns to users table
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN reset_token_expires_at TIMESTAMP DEFAULT NULL;

-- Create index for reset token
CREATE INDEX idx_users_reset_token ON users(reset_token); 