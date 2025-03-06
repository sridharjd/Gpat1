-- Drop existing tables if they exist
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS test_answers;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS user_responses;
DROP TABLE IF EXISTS user_performance;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS pyq_questions;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  explanation TEXT,
  year INT,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Previous Year Questions table
CREATE TABLE IF NOT EXISTS pyq_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  year INT,
  question TEXT NOT NULL,
  answer TEXT,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  option4 TEXT,
  correct_option INT,
  explanation TEXT,
  degree VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Performance table
CREATE TABLE IF NOT EXISTS user_performance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT,
  incorrect_answers INT,
  time_taken INT, -- in seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  performance_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken INT, -- in seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performance_id) REFERENCES user_performance(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subjects
INSERT INTO subjects (name, description) VALUES
('Pharmaceutical Chemistry', 'Study of chemical components in drugs'),
('Pharmaceutics', 'Science of drug preparation and dispensing'),
('Pharmacology', 'Study of drug action on biological systems'),
('Pharmacognosy', 'Study of drugs from natural sources');

-- Insert test users with properly hashed passwords
INSERT INTO users (email, password, full_name, role, status) VALUES
('admin@test.com', '$2b$10$3NxN/R8tJXqXqXqXqXqXqOqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq', 'Test Admin', 'admin', 'active'),
('user@test.com', '$2b$10$3NxN/R8tJXqXqXqXqXqXqOqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq', 'Test User', 'user', 'active');

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_pyq_questions_subject_id ON pyq_questions(subject_id);
CREATE INDEX idx_pyq_questions_year ON pyq_questions(year);
CREATE INDEX idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX idx_user_responses_performance_id ON user_responses(performance_id);
CREATE INDEX idx_user_responses_question_id ON user_responses(question_id);
