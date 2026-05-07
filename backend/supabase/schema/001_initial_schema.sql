-- ==========================================
-- ForgeTrack Schema (Phase 1)
-- ==========================================

-- Drop existing tables to ensure clean slate for demo
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.import_log CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

-- Enable pgcrypto for password hashing in triggers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Sessions Table
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ImportLog Table (Needs to exist before attendance)
CREATE TABLE public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings TEXT,
    column_mapping TEXT,
    status TEXT NOT NULL
);

-- 4. Attendance Table
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
    UNIQUE (student_id, session_id)
);

-- 5. Materials Table
CREATE TABLE public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Users Table (Mapping table for Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Triggers and Constraints
-- ==========================================

-- Trigger to validate attendance date is not in future and >= 2025-08-04
CREATE OR REPLACE FUNCTION validate_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
    session_date DATE;
BEGIN
    SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
    IF session_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Attendance cannot be marked for a future date.';
    END IF;
    IF session_date < '2025-08-04' THEN
        RAISE EXCEPTION 'Attendance dates cannot be before the program start date (2025-08-04).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_attendance_date
    BEFORE INSERT OR UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION validate_attendance_date();

-- Trigger to auto-create auth.users and public.users row when a student is created
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    student_email TEXT := NEW.usn || '@forge.local';
BEGIN
    -- Insert into auth.users (Internal Supabase authentication table)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        student_email, crypt(NEW.usn, gen_salt('bf')), now(), 
        '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('role', 'student', 'student_id', NEW.id, 'display_name', NEW.name), 
        now(), now()
    );

    -- Insert into public.users mapping table
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (new_user_id, student_email, 'student', NEW.id, NEW.name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
    AFTER INSERT ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is mentor
CREATE OR REPLACE FUNCTION is_mentor() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Students Table RLS
CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own_student" ON public.students FOR SELECT USING (
    id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- 2. Sessions Table RLS
CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (is_mentor());
CREATE POLICY "students_read_sessions" ON public.sessions FOR SELECT USING (true); -- Students see all sessions

-- 3. Attendance Table RLS
CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING (
    student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- 4. Materials Table RLS
CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (is_mentor());
CREATE POLICY "students_read_materials" ON public.materials FOR SELECT USING (true); -- Students see all materials

-- 5. Import Log Table RLS
CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (is_mentor());
-- Students have no access to import log.

-- 6. Users Table RLS
CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own_user" ON public.users FOR SELECT USING (id = auth.uid());
