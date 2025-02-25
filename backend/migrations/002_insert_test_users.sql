-- Insert test users
INSERT INTO users (username, email, password, first_name, last_name, is_admin, is_verified)
VALUES 
('testuser1', 'testuser1@example.com', '$2b$10$6jXRITJ0wgcc9MqHJVYyL.Kr8y4HUX4oBpRBOqsJsUYGGqF9AkOey', 'Test', 'User', FALSE, TRUE),
('testadmin', 'testadmin@example.com', '$2b$10$6jXRITJ0wgcc9MqHJVYyL.Kr8y4HUX4oBpRBOqsJsUYGGqF9AkOey', 'Test', 'Admin', TRUE, TRUE);
