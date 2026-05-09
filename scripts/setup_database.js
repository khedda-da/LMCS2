import pkg from 'pg';
const { Client } = pkg;

// Allow self-signed certificates for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbUrl = process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('  ERROR: POSTGRES_URL environment variable not set');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('  Connected to database');

    // Enable extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('  Extensions enabled');

    // Note: Using VARCHAR instead of ENUM for better compatibility
    console.log('  Using VARCHAR types for role/status columns');

    // Create tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        department VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        is_approved BOOLEAN DEFAULT FALSE,
        requested_role VARCHAR(50)
      );`,
      
      `CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registration_number VARCHAR(50) UNIQUE,
        academic_year VARCHAR(10),
        program VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      
      `CREATE TABLE IF NOT EXISTS supervisions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE RESTRICT,
        co_advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) DEFAULT 'pfe',
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        academic_year VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      
      `CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        supervision_id UUID REFERENCES supervisions(id) ON DELETE CASCADE,
        session_date TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      
      `CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        supervision_id UUID REFERENCES supervisions(id) ON DELETE CASCADE,
        title VARCHAR(255),
        document_type VARCHAR(100),
        file_url TEXT,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id UUID,
        changes JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
    ];

    for (const tableQuery of tables) {
      await client.query(tableQuery);
    }
    console.log('  All tables created successfully');

    // Drop old policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "users_select_policy" ON users;',
      'DROP POLICY IF EXISTS "users_update_policy" ON users;',
      'DROP POLICY IF EXISTS "students_select_policy" ON students;',
      'DROP POLICY IF EXISTS "supervisions_select_policy" ON supervisions;',
      'DROP POLICY IF EXISTS "supervisions_insert_policy" ON supervisions;',
      'DROP POLICY IF EXISTS "supervisions_update_policy" ON supervisions;',
      'DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;',
      'DROP POLICY IF EXISTS "documents_select_policy" ON documents;',
    ];

    for (const dropQuery of dropPolicies) {
      try {
        await client.query(dropQuery);
      } catch (e) {
        // Policy may not exist, that's okay
      }
    }
    console.log('  Old policies dropped');

    // Enable RLS
    await client.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE students ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE supervisions ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE documents ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;');
    console.log('  RLS enabled on all tables');

    // Create simple non-recursive policies
    const policies = [
      'CREATE POLICY "users_all_select" ON users FOR SELECT USING (TRUE);',
      'CREATE POLICY "students_all_select" ON students FOR SELECT USING (TRUE);',
      'CREATE POLICY "supervisions_all_select" ON supervisions FOR SELECT USING (TRUE);',
      'CREATE POLICY "sessions_all_select" ON sessions FOR SELECT USING (TRUE);',
      'CREATE POLICY "documents_all_select" ON documents FOR SELECT USING (TRUE);',
      'CREATE POLICY "audit_logs_all_select" ON audit_logs FOR SELECT USING (TRUE);',
    ];

    for (const policyQuery of policies) {
      try {
        await client.query(policyQuery);
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log(`  Note: ${e.message.split('\n')[0]}`);
        }
      }
    }
    console.log('  RLS policies created successfully');

    console.log('  Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('  ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
