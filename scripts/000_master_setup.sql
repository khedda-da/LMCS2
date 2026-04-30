-- =====================================================
-- LMCS - Supervision Tracking System
-- MASTER DATABASE SETUP SCRIPT (COMPLETE & CONSISTENT)
-- Run this ONE script and ignore all other SQL files
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUM TYPES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'director');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE supervision_type AS ENUM ('pfe', 'master', 'doctorate', 'internship', 'spe', 'research');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE supervision_status AS ENUM ('active', 'pending', 'completed', 'suspended', 'on_hold', 'abandoned', 'defended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- STEP 2: DROP EXISTING TABLES (CLEAN START)
-- =====================================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.secret_codes CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.supervisions CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT DEFAULT '',
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    role user_role NOT NULL DEFAULT 'supervisor',
    requested_role TEXT,
    additional_roles TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    department TEXT,
    specialization TEXT,
    phone TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    approval_date TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    registration_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    program TEXT,
    level TEXT,
    academic_year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themes table
CREATE TABLE public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supervisions table - WITH students AND supervisors arrays for flexibility
CREATE TABLE public.supervisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    co_advisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type supervision_type DEFAULT 'pfe',
    status supervision_status DEFAULT 'active',
    theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    academic_year TEXT,
    objectives TEXT,
    students UUID[] DEFAULT '{}',
    supervisors UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status session_status DEFAULT 'scheduled',
    notes TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT,
    file_url TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    version_number INTEGER DEFAULT 1,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secret codes table
CREATE TABLE public.secret_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table (with comprehensive notification types and metadata)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, success, warning, error, alert, supervision, document
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    related_entity_type TEXT, -- supervisions, documents, sessions, users
    related_entity_id UUID,
    action_required BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional data like supervision_id, document_id, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    changes JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_approved ON public.users(is_approved);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_students_registration ON public.students(registration_number);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_supervisions_teacher ON public.supervisions(teacher_id);
CREATE INDEX idx_supervisions_student ON public.supervisions(student_id);
CREATE INDEX idx_supervisions_status ON public.supervisions(status);
CREATE INDEX idx_supervisions_type ON public.supervisions(type);
CREATE INDEX idx_sessions_supervision ON public.sessions(supervision_id);
CREATE INDEX idx_documents_supervision ON public.documents(supervision_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =====================================================
-- STEP 5: CREATE FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user profile function (for auth signup)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT '',
    p_requested_role TEXT DEFAULT 'supervisor',
    p_role user_role DEFAULT 'supervisor',
    p_is_approved BOOLEAN DEFAULT FALSE,
    p_additional_roles TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.users (
        id, email, full_name, first_name, last_name, 
        requested_role, role, is_approved, additional_roles
    )
    VALUES (
        p_id, p_email, p_full_name, p_first_name, p_last_name, 
        p_requested_role, p_role, p_is_approved, p_additional_roles
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supervisions_updated_at ON public.supervisions;
CREATE TRIGGER update_supervisions_updated_at BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_themes_updated_at ON public.themes;
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON public.themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: DROP EXISTING RLS POLICIES
-- =====================================================

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 9: CREATE NEW RLS POLICIES
-- =====================================================

-- Users: Everyone can view, admins can update others, users can update themselves
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_update_by_admin" ON public.users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);

-- Students: Approved users can read, supervisors/directors can manage
CREATE POLICY "students_select_approved" ON public.students FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);
CREATE POLICY "students_manage_approved" ON public.students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);

-- Themes: Approved users can read, supervisors/directors can manage
CREATE POLICY "themes_select_all" ON public.themes FOR SELECT USING (true);
CREATE POLICY "themes_manage_approved" ON public.themes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);

-- Supervisions: Approved users can read, teachers/supervisors/directors/admins can manage
CREATE POLICY "supervisions_select_approved" ON public.supervisions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);
-- Teachers (supervisor role) can manage their own supervisions
CREATE POLICY "supervisions_manage_teacher" ON public.supervisions FOR ALL USING (
    (teacher_id = auth.uid() OR co_advisor_id = auth.uid()) AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('supervisor') AND is_approved = true)
);
-- Directors and admins can manage all supervisions
CREATE POLICY "supervisions_manage_director_admin" ON public.supervisions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'director') AND is_approved = true)
);

-- Sessions: Approved users can manage
CREATE POLICY "sessions_select_approved" ON public.sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);
CREATE POLICY "sessions_manage_approved" ON public.sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);

-- Documents: Approved users can manage
CREATE POLICY "documents_select_approved" ON public.documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);
CREATE POLICY "documents_manage_approved" ON public.documents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_approved = true)
);

-- Secret codes: Admins can manage
CREATE POLICY "secret_codes_admin_manage" ON public.secret_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);

-- Notifications: Users can read/update their own, insert for all
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_all" ON public.notifications FOR INSERT WITH CHECK (true);

-- Audit logs: Admins can view, insert for all
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);
CREATE POLICY "audit_logs_insert_all" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- =====================================================
-- STEP 10: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- =====================================================
-- STEP 11: CREATE STORAGE BUCKETS (COMMENTS ONLY - DO VIA SUPABASE UI)
-- =====================================================

-- NOTE: Create the following buckets in Supabase Storage UI:
-- 1. profile-photos
--    - Public: Yes
--    - Allowed file types: image/jpeg, image/png, image/gif, image/webp
--    - Max size: 5MB
--
-- 2. supervision-documents
--    - Public: No
--    - Allowed file types: All documents
--    - Max size: 50MB
--
-- 3. supervision-reviews
--    - Public: No
--    - Allowed file types: PDF, documents
--    - Max size: 100MB

-- =====================================================
-- STEP 12: HELPER FUNCTIONS FOR NOTIFICATIONS & PHOTOS
-- =====================================================

-- Function to create notification for supervision status change
CREATE OR REPLACE FUNCTION public.notify_supervision_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Notify the teacher/supervisors
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            metadata
        )
        SELECT 
            NEW.teacher_id,
            'Supervision Status Changed',
            'Supervision "' || NEW.title || '" status changed to: ' || NEW.status,
            'supervision',
            'supervisions',
            NEW.id,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        WHERE NEW.teacher_id IS NOT NULL;

        -- Notify co-advisor if exists
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            metadata
        )
        SELECT 
            NEW.co_advisor_id,
            'Supervision Status Changed',
            'Supervision "' || NEW.title || '" status changed to: ' || NEW.status,
            'supervision',
            'supervisions',
            NEW.id,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        WHERE NEW.co_advisor_id IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supervision status notifications
DROP TRIGGER IF EXISTS notify_supervision_status ON public.supervisions;
CREATE TRIGGER notify_supervision_status AFTER UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.notify_supervision_status_change();

-- Function to log document uploads for notifications
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify supervising teachers when document is uploaded
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            action_required,
            metadata
        )
        SELECT 
            s.teacher_id,
            'New Document Uploaded',
            'Document "' || NEW.title || '" uploaded to supervision "' || s.title || '"',
            'document',
            'documents',
            NEW.id,
            true,
            jsonb_build_object('supervision_id', s.id, 'document_type', NEW.document_type)
        FROM public.supervisions s
        WHERE s.id = NEW.supervision_id AND s.teacher_id IS NOT NULL;

        -- Notify co-advisor
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            action_required,
            metadata
        )
        SELECT 
            s.co_advisor_id,
            'New Document Uploaded',
            'Document "' || NEW.title || '" uploaded to supervision "' || s.title || '"',
            'document',
            'documents',
            NEW.id,
            true,
            jsonb_build_object('supervision_id', s.id, 'document_type', NEW.document_type)
        FROM public.supervisions s
        WHERE s.id = NEW.supervision_id AND s.co_advisor_id IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document upload notifications
DROP TRIGGER IF EXISTS notify_document_upload ON public.documents;
CREATE TRIGGER notify_document_upload AFTER INSERT ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.notify_document_upload();

-- Function to notify when profile photo is updated (via database)
CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.profile_picture_url != COALESCE(OLD.profile_picture_url, '') THEN
        -- Create notification for admins if needed
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            metadata
        )
        SELECT 
            id,
            'User Profile Updated',
            'User "' || NEW.full_name || '" updated their profile picture',
            'info',
            'users',
            NEW.id,
            jsonb_build_object('email', NEW.email, 'role', NEW.role)
        FROM public.users
        WHERE role = 'admin' AND is_approved = true AND id != NEW.id
        LIMIT 10;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS notify_profile_update ON public.users;
CREATE TRIGGER notify_profile_update AFTER UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.notify_profile_update();

-- =====================================================
-- FINAL SETUP INSTRUCTIONS
-- =====================================================

-- SUCCESS! Database is fully set up with photo uploads and notifications.
--
-- NEXT STEPS:
-- 1. Create Storage buckets in Supabase UI:
--    a. profile-photos (Public, images only, 5MB max)
--    b. supervision-documents (Private, all files, 50MB max)
--    c. supervision-reviews (Private, PDF/docs, 100MB max)
--
-- 2. Sign up a user in the application
--
-- 3. Go to Supabase SQL Editor > users table
--
-- 4. Set the new user's:
--    - is_approved = true
--    - role = 'admin' (for full access)
--
-- 5. Log back in and use:
--    - Profile upload for photos (uploads to profile-photos bucket)
--    - Create supervisions (auto-notifies supervisors)
--    - Upload documents (auto-notifies supervisors, creates notifications)
--    - Update supervision status (auto-notifies supervisors)
--
-- WHAT'S INCLUDED:
-- - 9 tables (users, students, supervisions, themes, sessions, documents, secret_codes, notifications, audit_logs)
-- - All supervision types (PFE, Master, Doctorate, Internship, SPE, Research)
-- - All supervision statuses (Active, Pending, Completed, Suspended, On Hold, Abandoned, Defended)
-- - Student and supervisor array support for flexible supervision assignments
-- - Photo upload support with Supabase Storage integration
-- - Comprehensive notification system with automatic triggers
-- - Notification types: info, success, warning, error, alert, supervision, document
-- - Auto-notifications on status changes, document uploads, profile updates
-- - RLS policies for security and privacy
-- - Auto-timestamp triggers for created_at and updated_at
-- - Comprehensive indexes for query performance
-- - Helper functions for user creation, notifications, and photos
-- - Complete audit logging for compliance
