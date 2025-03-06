-- Delete existing users
DELETE FROM users;

-- Insert new test users with properly hashed passwords
INSERT INTO users (
    username,
    email,
    password,
    first_name,
    last_name,
    is_admin,
    is_verified,
    is_active,
    login_attempts,
    created_at,
    updated_at
) VALUES
(
    'testadmin',
    'admin@test.com',
    '$2a$10$BA/O4lvGlrf1mfJftyd.BuF33l/MhepEJ90qa2ZK7xRGIbsfJMvga',
    'Test',
    'Admin',
    1,
    1,
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'testuser',
    'user@test.com',
    '$2a$10$RGd2KFBhVDVmcW/M2hOqWufdVHfftmkIVkcOgcww74IDTe/o9NFk6',
    'Test',
    'User',
    0,
    1,
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 