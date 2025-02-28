-- Insert test users
INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_verified)
VALUES 
('testuser1', 'testuser1@example.com', '$2b$10$6jXRITJ0wgcc9MqHJVYyL.Kr8y4HUX4oBpRBOqsJsUYGGqF9AkOey', 'Test', 'User', FALSE, TRUE),
('testadmin', 'testadmin@example.com', '$2b$10$6jXRITJ0wgcc9MqHJVYyL.Kr8y4HUX4oBpRBOqsJsUYGGqF9AkOey', 'Test', 'Admin', TRUE, TRUE),
('testadmin', 'testadmin@example.com', 'login@2021', 'Test', 'Admin', TRUE, TRUE);

-- Insert or update user performance metrics
INSERT INTO user_performance (user_id, performance_metric) VALUES
(1, 'metric_value_1'),
(2, 'metric_value_2'),
(3, 'metric_value_3')
ON DUPLICATE KEY UPDATE performance_metric = VALUES(performance_metric);
