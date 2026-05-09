#!/usr/bin/env python3
import os
import psycopg2
from psycopg2 import sql

# Get database connection string from environment
db_url = os.getenv('POSTGRES_URL')
if not db_url:
    print("ERROR: POSTGRES_URL environment variable not set")
    exit(1)

try:
    # Connect to database
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    print("  Connected to database")
    
    # Enable extensions
    cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    cursor.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
    print("  Extensions enabled")
    
    # Create ENUM types (ignore if already exist)
    try:
        cursor.execute("CREATE TYPE user_role AS ENUM ('director', 'teacher', 'admin', 'student');")
    except:
        pass
    
    try:
        cursor.execute("CREATE TYPE supervision_type AS ENUM ('pfe', 'master', 'doctorate', 'internship', 'research');")
    except:
        pass
    
    try:
        cursor.execute("CREATE TYPE supervision_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');")
    except:
        pass
    
    try:
        cursor.execute("CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'postponed');")
    except:
        pass
    
    print("  Enum types created/verified")
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            full_name VARCHAR(255),
            role user_role DEFAULT 'student',
            department VARCHAR(100),
            phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            is_approved BOOLEAN DEFAULT FALSE,
            requested_role VARCHAR(50)
        );
    """)
    
    # Create students table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            registration_number VARCHAR(50) UNIQUE,
            academic_year VARCHAR(10),
            program VARCHAR(100),
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create supervisions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supervisions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            student_id UUID REFERENCES students(id) ON DELETE CASCADE,
            teacher_id UUID REFERENCES users(id) ON DELETE RESTRICT,
            co_advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
            type supervision_type DEFAULT 'pfe',
            status supervision_status DEFAULT 'active',
            start_date DATE NOT NULL,
            end_date DATE,
            academic_year VARCHAR(10),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            supervision_id UUID REFERENCES supervisions(id) ON DELETE CASCADE,
            session_date TIMESTAMP WITH TIME ZONE,
            duration_minutes INTEGER,
            status session_status DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            supervision_id UUID REFERENCES supervisions(id) ON DELETE CASCADE,
            title VARCHAR(255),
            document_type VARCHAR(100),
            file_url TEXT,
            uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create audit_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100),
            entity_type VARCHAR(50),
            entity_id UUID,
            changes JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    print("  All tables created successfully")
    
    # Drop and recreate RLS policies to fix infinite recursion
    cursor.execute("DROP POLICY IF EXISTS \"users_select_policy\" ON users;")
    cursor.execute("DROP POLICY IF EXISTS \"students_select_policy\" ON students;")
    cursor.execute("DROP POLICY IF EXISTS \"supervisions_select_policy\" ON supervisions;")
    cursor.execute("DROP POLICY IF EXISTS \"sessions_select_policy\" ON sessions;")
    cursor.execute("DROP POLICY IF EXISTS \"documents_select_policy\" ON documents;")
    
    # Enable RLS
    cursor.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY;")
    cursor.execute("ALTER TABLE students ENABLE ROW LEVEL SECURITY;")
    cursor.execute("ALTER TABLE supervisions ENABLE ROW LEVEL SECURITY;")
    cursor.execute("ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;")
    cursor.execute("ALTER TABLE documents ENABLE ROW LEVEL SECURITY;")
    cursor.execute("ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;")
    
    print("  RLS enabled on all tables")
    
    # Create simple, non-recursive RLS policies
    cursor.execute("""
        CREATE POLICY "users_select_simple" ON users
        FOR SELECT USING (TRUE);
    """)
    
    cursor.execute("""
        CREATE POLICY "students_select_simple" ON students
        FOR SELECT USING (TRUE);
    """)
    
    cursor.execute("""
        CREATE POLICY "supervisions_select_simple" ON supervisions
        FOR SELECT USING (TRUE);
    """)
    
    cursor.execute("""
        CREATE POLICY "sessions_select_simple" ON sessions
        FOR SELECT USING (TRUE);
    """)
    
    cursor.execute("""
        CREATE POLICY "documents_select_simple" ON documents
        FOR SELECT USING (TRUE);
    """)
    
    print("  RLS policies created successfully")
    
    # Commit changes
    conn.commit()
    cursor.close()
    conn.close()
    
    print("  Database setup completed successfully!")
    
except Exception as e:
    print(f"  ERROR: {str(e)}")
    if conn:
        conn.rollback()
    exit(1)
