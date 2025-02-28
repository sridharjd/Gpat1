-- Create test_results table
CREATE TABLE IF NOT EXISTS `test_results` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `subject_id` INT NULL,
  `total_questions` INT NOT NULL DEFAULT 0,
  `score` FLOAT NOT NULL DEFAULT 0,
  `time_taken` INT NOT NULL DEFAULT 0 COMMENT 'Time taken in seconds',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create test_answers table
CREATE TABLE IF NOT EXISTS `test_answers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `test_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_answer` CHAR(1) NOT NULL COMMENT 'a, b, c, or d',
  `is_correct` BOOLEAN NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`test_id`) REFERENCES `test_results`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster querying
CREATE INDEX `idx_test_results_user_id` ON `test_results` (`user_id`);
CREATE INDEX `idx_test_answers_test_id` ON `test_answers` (`test_id`);
CREATE INDEX `idx_test_results_created_at` ON `test_results` (`created_at`);
