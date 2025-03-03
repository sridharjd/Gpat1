-- Add pyq_questions table if it doesn't exist
DROP TABLE IF EXISTS pyq_questions;

CREATE TABLE pyq_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  year INT,
  subject_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  option4 TEXT,
  degree VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
); 