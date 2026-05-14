-- ==========================================
-- ForgeTrack Seed Data (Phase 1)
-- ==========================================

-- 1. Create the Mentor and Co-facilitator accounts
-- We insert into auth.users first, then public.users
DO $$
DECLARE
    nischay_id UUID := gen_random_uuid();
    varun_id UUID := gen_random_uuid();
BEGIN
    -- Mentor (Nischay)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        nischay_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'nischay@theboringpeople.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('role', 'mentor', 'display_name', 'Nischay B K'), now(), now()
    );
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (nischay_id, 'nischay@theboringpeople.in', 'mentor', NULL, 'Nischay B K');

    -- Co-facilitator (Varun)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        varun_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'varun@theboringpeople.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('role', 'mentor', 'display_name', 'Varun'), now(), now()
    );
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (varun_id, 'varun@theboringpeople.in', 'mentor', NULL, 'Varun');
END $$;
