# LMCS - UML Diagrams

## 1. CLASS DIAGRAM

```mermaid
classDiagram
    class User {
        id: UUID
        email: string
        full_name: string
        role: UserRole
        is_approved: boolean
        is_active: boolean
        department: string
        phone: string
        profile_picture_url: string
        created_at: timestamp
        updated_at: timestamp
        +getUserRole()
        +updateProfile()
        +deactivateAccount()
    }

    class Student {
        id: UUID
        user_id: UUID
        registration_number: string
        full_name: string
        email: string
        program: string
        level: string
        academic_year: string
        phone: string
        +getStudentInfo()
        +updateProgram()
    }

    class Supervision {
        id: UUID
        title: string
        description: string
        student_id: UUID
        students: UUID[]
        teacher_id: UUID
        co_advisor_id: UUID
        type: SupervisionType
        status: SupervisionStatus
        theme_id: UUID
        start_date: date
        end_date: date
        academic_year: string
        objectives: string
        +updateStatus()
        +assignStudents()
        +addSession()
        +getStudents()
    }

    class Theme {
        id: UUID
        name: string
        description: string
        created_at: timestamp
        +getThemeInfo()
    }

    class Session {
        id: UUID
        supervision_id: UUID
        session_date: timestamp
        duration_minutes: integer
        status: SessionStatus
        notes: string
        location: string
        +updateSession()
        +completeSession()
    }

    class Document {
        id: UUID
        supervision_id: UUID
        title: string
        document_type: string
        file_url: string
        file_size: bigint
        uploaded_by: UUID
        version_number: integer
        feedback: string
        +uploadDocument()
        +updateFeedback()
    }

    class Notification {
        id: UUID
        user_id: UUID
        title: string
        message: string
        type: string
        read: boolean
        created_at: timestamp
        +markAsRead()
        +delete()
    }

    class AuditLog {
        id: UUID
        user_id: UUID
        action: string
        entity_type: string
        entity_id: UUID
        old_values: JSON
        new_values: JSON
        ip_address: string
        timestamp: timestamp
        +logAction()
    }

    User "1" --> "*" Student : supervises
    User "1" --> "*" Supervision : teaches
    User "1" --> "*" Notification : receives
    Student "1" --> "*" Supervision : participates
    Supervision "1" --> "0..1" Theme : has
    Supervision "1" --> "*" Session : contains
    Supervision "1" --> "*" Document : has
    User "1" --> "*" Document : uploads
    User "1" --> "*" AuditLog : performs
```

---

## 2. SEQUENCE DIAGRAM - Student Supervision Assignment

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant UI as Web Interface
    participant API as Backend API
    participant DB as Database
    participant Supabase as Supabase Auth

    Admin->>UI: Select students to assign
    Admin->>UI: Click "Update Supervision"
    UI->>API: PATCH /supervisions/{id}<br/>(students: [uuid1, uuid2])
    API->>Supabase: Verify user auth
    Supabase-->>API: Auth confirmed
    API->>DB: Fetch supervision record
    DB-->>API: Return supervision
    API->>DB: Update students array<br/>students = [uuid1, uuid2]
    DB-->>API: Update successful
    API->>DB: Log audit event
    DB-->>API: Audit logged
    API-->>UI: Return success response
    UI->>DB: Fetch updated students data
    DB-->>UI: Return student records
    UI->>Admin: Display all assigned students<br/>with names and details
    Admin-->>Admin: Confirm students appear correctly
```

---

## 3. SEQUENCE DIAGRAM - Notification Lifecycle

```mermaid
sequenceDiagram
    participant System as System/Backend
    participant DB as Database
    participant User as User Browser
    participant API as Notifications API
    participant Realtime as Realtime Subscription

    System->>DB: Create notification record<br/>read = false
    DB-->>System: Notification created
    System->>Realtime: Broadcast INSERT event
    Realtime->>User: Push notification update
    User->>API: Load notifications
    API->>DB: SELECT * WHERE user_id = ?
    DB-->>API: Return unread notifications
    API-->>User: Display badge with count
    User->>API: PATCH /notifications<br/>(deleteNotification: id)
    API->>DB: DELETE notification WHERE id = ?
    DB-->>API: Deletion confirmed
    Realtime->>User: Push DELETE event
    User->>User: Remove from local state<br/>Update unread count
    User-->>User: Badge disappears or updates
    Note over User,DB: On page refresh:<br/>Notification stays deleted<br/>because it's gone from DB
```

---

## 4. USE CASE DIAGRAM

```mermaid
graph TB
    subgraph Admin["Admin Functions"]
        UC1["Create/Edit Users"]
        UC2["Manage Supervisions"]
        UC3["Generate Secret Codes"]
        UC4["View Audit Logs"]
        UC5["Approve User Requests"]
    end

    subgraph Director["Director Functions"]
        UC6["View All Supervisions"]
        UC7["Export Reports PDF"]
        UC8["View Statistics"]
        UC9["Monitor Assignments"]
    end

    subgraph Supervisor["Supervisor Functions"]
        UC10["View My Supervisions"]
        UC11["Update Supervision Status"]
        UC12["View Assigned Students"]
        UC13["Upload Documents"]
        UC14["Schedule Sessions"]
    end

    subgraph Student["Student Functions"]
        UC15["View My Supervisions"]
        UC16["Submit Documents"]
        UC17["View Feedback"]
        UC18["Track Progress"]
    end

    subgraph Common["Common Functions"]
        UC19["View Profile"]
        UC20["Change Password"]
        UC21["Receive Notifications"]
        UC22["Download/Export Data"]
    end

    Admin -.->|uses| UC2
    Director -.->|uses| UC6
    Supervisor -.->|uses| UC10
    Student -.->|uses| UC15
    
    UC2 -->|includes| UC22
    UC6 -->|includes| UC7
    UC10 -->|includes| UC13
    UC15 -->|includes| UC16
    
    Admin -.->|has| UC19
    Director -.->|has| UC19
    Supervisor -.->|has| UC19
    Student -.->|has| UC19
    
    UC19 -->|includes| UC20
    UC19 -->|includes| UC21

    style Admin fill:#ff9999
    style Director fill:#99ccff
    style Supervisor fill:#99ff99
    style Student fill:#ffcc99
    style Common fill:#e6e6e6
```

---

## Entity Relationships

### Users
- **Admin**: Full system control, manage users, approve requests
- **Supervisor**: Manage their supervisions, assign students
- **Director**: View all supervisions, generate reports

### Core Entities
- **Supervisions**: Link students with supervisors, track progress
- **Students**: Enrolled in supervisions, submit documents
- **Sessions**: Track supervision meetings and progress
- **Documents**: Store student work and feedback
- **Themes**: Research themes for supervisions
- **Notifications**: Keep users informed of updates

### Audit & Security
- **Audit Logs**: Track all system changes
- **Authentication**: Supabase Auth integration

---

## Data Flow Summary

1. **Supervision Creation**: Admin/Director creates supervision → assigns students → system creates notifications
2. **Student Assignment**: Admin selects multiple students → saves to `students` array → triggers notifications
3. **Status Updates**: Supervisor updates status → audit log created → notifications sent
4. **Document Upload**: User uploads → linked to supervision → notifications sent
5. **Notifications**: Created → stored in DB → displayed in bell → deleted when read
6. **Reporting**: Director exports → fetches all supervisions → generates PDF with student names
