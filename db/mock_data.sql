-- Insert mock users into auth.users (Supabase-managed)
-- Note: Run these in Authentication -> Users -> Add User manually, or use signup API later
-- For now, we'll assume users are added and insert into auth_users

-- Insert into auth_users
INSERT INTO auth_users (id, email, role, is_active, failed_attempts)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@company.com', 'employee', TRUE, 0),
  ('22222222-2222-2222-2222-222222222222', 'bob@company.com', 'employee', TRUE, 0),
  ('33333333-3333-3333-3333-333333333333', 'admin@company.com', 'admin,manager', TRUE, 0);

-- Insert into user_details
INSERT INTO user_details (id, join_date, gender, nationality, department)
VALUES
  ('11111111-1111-1111-1111-111111111111', '2020-01-01', 'female', 'USA', 'TeamA'),
  ('22222222-2222-2222-2222-222222222222', '2024-01-01', 'male', 'Taiwan', 'TeamA'),
  ('33333333-3333-3333-3333-333333333333', '2019-01-01', 'male', 'USA', 'TeamA');

-- Insert into leave_types
INSERT INTO leave_types (id, name, default_total)
VALUES
  (gen_random_uuid(), 'Sick', 30),
  (gen_random_uuid(), 'Half-Day Sick', 5),
  (gen_random_uuid(), 'Annual', 0),
  (gen_random_uuid(), 'Maternity', 30);

-- Get leave_type_ids
SELECT id, name FROM leave_types;

-- Insert into employee_leave_types (using actual leave_type_ids)
INSERT INTO employee_leave_types (employee_id, leave_type_id, is_eligible)
VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Sick'), TRUE),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Half-Day Sick'), TRUE),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Annual'), TRUE),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Maternity'), TRUE),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Sick'), TRUE),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Annual'), TRUE);

-- Insert into leaves
INSERT INTO leaves (user_id, leave_type_id, total, taken, remaining)
VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Sick'), 30, 2, 28),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Half-Day Sick'), 5, 0, 5),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Annual'), 10, 0, 10),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Maternity'), 30, 0, 30),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Sick'), 30, 0, 30),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Annual'), 3, 0, 3);

-- Insert into requests
INSERT INTO requests (user_id, leave_type_id, start_date, end_date, status, manager_feedback)
VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM leave_types WHERE name = 'Sick'), '2025-01-10', '2025-01-11', 'approved', 'Looks good'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Annual'), '2025-02-01', '2025-02-03', 'rejected', 'Not enough notice');

-- Insert into leave_type_requests
INSERT INTO leave_type_requests (employee_id, leave_type_id, status, admin_feedback)
VALUES
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM leave_types WHERE name = 'Maternity'), 'pending', 'Under review');

-- Insert into holidays
INSERT INTO holidays (date, name)
VALUES ('2025-12-25', 'Christmas');

-- Insert into notifications
INSERT INTO notifications (user_id, message, type)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Your Sick leave request was approved', 'leave_approval'),
  ('22222222-2222-2222-2222-222222222222', 'Your Annual leave request was rejected', 'leave_rejection');