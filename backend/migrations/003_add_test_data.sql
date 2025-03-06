-- Insert test user
INSERT INTO users (
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    is_admin,
    is_verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    'user1',
    'user1@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAiXxZxQ5P6i', -- password: test123
    'Test',
    'User',
    '1234567890',
    false,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert second test user
INSERT INTO users (
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    is_admin,
    is_verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    'user2',
    'user2@example.com',
    '$2a$12$8K1p/a0dL1LXMIZoIqPKUe3Zz3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z', -- password: login@2021
    'Second',
    'User',
    '9876543210',
    false,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert test subjects
INSERT INTO subjects (name, description, created_at, updated_at) VALUES
('Mathematics', 'Basic mathematics concepts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Physics', 'Basic physics concepts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Chemistry', 'Basic chemistry concepts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert test questions
INSERT INTO questions (
    subject_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation,
    difficulty_level,
    created_at,
    updated_at
) VALUES
(1, 'What is 2 + 2?', '3', '4', '5', '6', 'B', 'Basic addition', 'easy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'What is 3 x 3?', '6', '7', '8', '9', 'D', 'Basic multiplication', 'easy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'What is the speed of light?', '299,792 km/s', '199,792 km/s', '399,792 km/s', '499,792 km/s', 'A', 'Speed of light in vacuum', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'What is gravity?', 'A force', 'A color', 'A sound', 'A taste', 'A', 'Basic physics concept', 'easy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'What is H2O?', 'Water', 'Air', 'Fire', 'Earth', 'A', 'Chemical formula for water', 'easy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'What is the atomic number of Hydrogen?', '1', '2', '3', '4', 'A', 'Basic chemistry concept', 'easy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert test results
INSERT INTO test_results (
    user_id,
    subject_id,
    score,
    time_taken,
    total_questions,
    correct_answers,
    created_at,
    updated_at
) VALUES
(1, 1, 85.5, 1200, 10, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 2, 92.0, 1100, 10, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 3, 78.5, 1300, 10, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 90.0, 1000, 10, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 88.5, 1150, 10, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 95.0, 950, 10, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 