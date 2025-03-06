-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  subject_id INT NULL,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  incorrect_answers INT NOT NULL DEFAULT 0,
  score FLOAT NOT NULL DEFAULT 0,
  completion_time INT NOT NULL DEFAULT 0 COMMENT 'Time taken in seconds',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create test_answers table
CREATE TABLE IF NOT EXISTS test_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer CHAR(1) NOT NULL COMMENT 'A, B, C, or D',
  is_correct BOOLEAN NOT NULL,
  time_taken INT NOT NULL DEFAULT 0 COMMENT 'Time taken in seconds',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES test_results(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for faster querying
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_subject_id ON test_results(subject_id);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);
CREATE INDEX idx_test_answers_test_id ON test_answers(test_id);
CREATE INDEX idx_test_answers_question_id ON test_answers(question_id); 