-- seed.sql

-- Insert users
INSERT INTO users (username, password, email, is_staff) VALUES
    ('admin', 'admin123', 'admin@example.com', 1),
    ('user1', 'password1', 'user1@example.com', 0),
    ('user2', 'password2', 'user2@example.com', 0);

-- Insert events
INSERT INTO events (name, description, date, location, created_by) VALUES
    ('Event 1', 'Description of Event 1', '2024-07-01 10:00:00', 'Location 1', 1),
    ('Event 2', 'Description of Event 2', '2024-07-05 15:00:00', 'Location 2', 1);
