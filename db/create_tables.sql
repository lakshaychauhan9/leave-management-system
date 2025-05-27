-- Create auth_users table
CREATE TABLE auth_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin', 'admin,manager')),
  is_active BOOLEAN DEFAULT TRUE,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_details table
CREATE TABLE user_details (
  id UUID PRIMARY KEY REFERENCES auth_users(id),
  join_date DATE NOT NULL,
  gender TEXT,
  nationality TEXT,
  department TEXT DEFAULT 'TeamA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_types table
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_total INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_leave_types table
CREATE TABLE employee_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth_users(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  is_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, leave_type_id)
);

-- Create leaves table
CREATE TABLE leaves (
  user_id UUID NOT NULL REFERENCES auth_users(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  total FLOAT NOT NULL,
  taken FLOAT DEFAULT 0,
  remaining FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, leave_type_id)
);

-- Create requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  file_url TEXT,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_feedback TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

-- Create leave_type_requests table
CREATE TABLE leave_type_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth_users(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_feedback TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create holidays table
CREATE TABLE holidays (
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave_request', 'leave_approval', 'leave_rejection', 'leave_cancellation', 'holiday')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_type_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_users
CREATE POLICY auth_users_authenticated ON auth_users
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for user_details
CREATE POLICY user_details_own_data ON user_details
  FOR ALL TO authenticated
  USING (auth.uid() = id);
CREATE POLICY user_details_manager_admin ON user_details
  FOR SELECT TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'));

-- RLS Policies for leave_types
CREATE POLICY leave_types_read ON leave_types
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY leave_types_admin ON leave_types
  FOR ALL TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('admin', 'admin,manager'))
  WITH CHECK ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('admin', 'admin,manager'));

-- RLS Policies for employee_leave_types
CREATE POLICY employee_leave_types_own ON employee_leave_types
  FOR SELECT TO authenticated
  USING (auth.uid() = employee_id);
CREATE POLICY employee_leave_types_admin ON employee_leave_types
  FOR ALL TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('admin', 'admin,manager'))
  WITH CHECK ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('admin', 'admin,manager'));

-- RLS Policies for leaves
CREATE POLICY leaves_own_data ON leaves
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY leaves_manager_admin ON leaves
  FOR SELECT TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'));

-- RLS Policies for requests
CREATE POLICY requests_own_data ON requests
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY requests_manager_admin ON requests
  FOR ALL TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'));

-- RLS Policies for leave_type_requests
CREATE POLICY leave_type_requests_own ON leave_type_requests
  FOR ALL TO authenticated
  USING (auth.uid() = employee_id);
CREATE POLICY leave_type_requests_admin_manager ON leave_type_requests
  FOR ALL TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'))
  WITH CHECK ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'));

-- RLS Policies for holidays
CREATE POLICY holidays_read ON holidays
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY holidays_manager_admin ON holidays
  FOR ALL TO authenticated
  USING ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'))
  WITH CHECK ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('manager', 'admin', 'admin,manager'));

-- RLS Policies for notifications
CREATE POLICY notifications_own ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY notifications_insert ON notifications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM auth_users WHERE id = auth.uid()) IN ('admin', 'admin,manager'));