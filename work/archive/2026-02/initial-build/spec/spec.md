# Employee Training Management System - Full Spec

## Overview
Employee and training management system for a small business (under 20 employees initially, 1-2 admins). Tracks employees, training courses, completion/expiry dates, onboarding checklists, and sends email notifications when training is due for renewal. Future expansion to rotas and scheduling.

## Architecture
- **Backend**: ASP.NET Core 8+ Web API (also serves the frontend as static files)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Frontend**: React with TypeScript (Vite) — built and served by the .NET API
- **Deployment**: Single app, single port. React builds to static files, .NET serves everything.
- **Auth**: Username/password login (POC). Microsoft Entra ID planned for future.
- **Email**: SMTP-based email notifications for training expiry warnings

## Security Requirements
- .NET API is the ONLY way to access Supabase (frontend never talks to Supabase directly)
- Use Supabase SERVICE_ROLE key in backend (never expose to frontend)
- HTTPS only in production
- No CORS needed — frontend and API served from the same origin
- Input validation on all endpoints
- Rate limiting enabled
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Audit logging for all data modifications
- Passwords hashed with bcrypt (never stored in plain text)
- JWT tokens for session management after login

---

## Database Schema (Supabase)

### users
Authentication table. Separate from employees — an admin might not be an employee, and not all employees need login access.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### employees
Business data — the people being tracked.

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'Residential Support Worker',
  start_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Known roles from current data:**
- Responsible Individual
- Registered Manager
- Senior Residential Support Worker
- Residential Support Worker
- Bank

### training_courses
Courses with per-course notification settings and category.

```sql
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Online Mandatory', 'F2F Mandatory', 'Additional')),
  validity_months INTEGER, -- null = never expires
  notification_days_before INTEGER NOT NULL DEFAULT 30, -- warn X days before expiry
  notify_employee BOOLEAN NOT NULL DEFAULT true,
  notify_admin BOOLEAN NOT NULL DEFAULT true,
  mandatory_for_roles TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### training_records
One row per employee per training completion.

```sql
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE RESTRICT,
  completion_date DATE NOT NULL,
  expiry_date DATE, -- auto-calculated from course validity_months
  certificate_url TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id), -- who logged this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > completion_date)
);
```

### onboarding_items
Configurable checklist of onboarding/compliance items. Admins can add, edit, or remove items.

```sql
CREATE TABLE onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Known items from current data:**
- Job Application (gaps explained)
- Interview Questions
- ID Photo
- Contract
- Training Contract
- Employee Handbook
- Job Description & Person Spec
- GDPR Consent
- Emergency Contact Details
- Induction Booklet
- Personal Information
- Observation Day Checklist

### onboarding_records
One row per employee per onboarding item. Tracks whether each item is complete.

```sql
CREATE TABLE onboarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES onboarding_items(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'not_required')),
  completed_date DATE,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, item_id)
);
```

### notification_log
Tracks every notification sent to avoid duplicates and provide an audit trail.

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_record_id UUID NOT NULL REFERENCES training_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  course_id UUID NOT NULL REFERENCES training_courses(id),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('employee', 'admin')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_warning', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  days_until_expiry INTEGER
);
```

### audit_log
Logs all data modifications.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### training_status view
Uses per-course notification_days_before instead of hardcoded 30 days. Includes category.

```sql
CREATE VIEW training_status AS
SELECT
  e.id as employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.department,
  tc.id as course_id,
  tc.name as course_name,
  tc.category,
  tc.validity_months,
  tc.notification_days_before,
  tc.notify_employee,
  tc.notify_admin,
  tc.mandatory_for_roles,
  tr.id as training_record_id,
  tr.completion_date,
  tr.expiry_date,
  CASE
    WHEN tr.completion_date IS NULL THEN 'Not Completed'
    WHEN tr.expiry_date IS NULL THEN 'Completed'
    WHEN tr.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN tr.expiry_date <= CURRENT_DATE + (tc.notification_days_before || ' days')::INTERVAL THEN 'Expiring Soon'
    ELSE 'Valid'
  END as status,
  CASE
    WHEN tr.expiry_date IS NOT NULL THEN tr.expiry_date - CURRENT_DATE
    ELSE NULL
  END as days_until_expiry
FROM employees e
CROSS JOIN training_courses tc
LEFT JOIN training_records tr ON
  tr.employee_id = e.id AND
  tr.course_id = tc.id AND
  tr.id = (
    SELECT id FROM training_records
    WHERE employee_id = e.id AND course_id = tc.id
    ORDER BY completion_date DESC LIMIT 1
  )
WHERE e.active = true
  AND (tc.mandatory_for_roles IS NULL OR e.role = ANY(tc.mandatory_for_roles));
```

### Row Level Security

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON employees FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON training_courses FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON training_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON onboarding_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON onboarding_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON notification_log FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON audit_log FOR ALL TO service_role USING (true);
```

### Indexes

```sql
CREATE INDEX idx_training_records_employee ON training_records(employee_id);
CREATE INDEX idx_training_records_course ON training_records(course_id);
CREATE INDEX idx_training_records_expiry ON training_records(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_employees_active ON employees(active) WHERE active = true;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_onboarding_records_employee ON onboarding_records(employee_id);
CREATE INDEX idx_notification_log_record ON notification_log(training_record_id);
CREATE INDEX idx_notification_log_sent ON notification_log(sent_at);
```

---

## Seed Data — Training Courses

From the current spreadsheet, these are the courses to seed into the system:

### Online Mandatory
| Course Name | Validity |
|---|---|
| Anti-Bullying | 3 Years |
| CSE | 3 Years |
| COSHH | 3 Years |
| Covid 19 | Never expires |
| Equality & Diversity | 3 Years |
| FGM | 3 Years |
| Fire Safety | 1 Year |
| First Aid Paediatric | 3 Years |
| Emergency First Aid L2 | 3 Years |
| Food Safety & Hygiene (Advanced) | 3 Years |
| GDPR | 3 Years |
| GDPR - Office | 3 Years |
| Health & Nutrition | 3 Years |
| Health & Safety (Advanced) | 1 Year |
| Infection Control | 3 Years |
| Internet Safety | 3 Years |
| Manual Handling | 3 Years |
| Medication (Advanced) | 1 Year |
| Psychological First Aid | 3 Years |
| Radicalisation & Extremism | 3 Years |
| Reporting & Recording | 3 Years |
| Risk Management | 3 Years |
| Self-Harm | 3 Years |
| Safeguarding Level 2/3/4 | 1 Year |

### F2F Mandatory
| Course Name | Validity |
|---|---|
| PRICE (Physical Intervention) | 1 Year |
| Emergency First Aid at Work | 3 Years |
| Fire Warden | 3 Years |
| Introduction to PACE | Never expires |
| IOSH | Never expires |

### Additional
| Course Name | Validity |
|---|---|
| Distressed Behaviours | Never expires |
| Compassion Fatigue | Never expires |
| Workshops - Reporting & Recording (Occurrences, PIs, MFC) | Never expires |
| Workshops - Behaviour Management | Never expires |
| ADHD Training | Never expires |
| Childhood Development | Never expires |
| Trauma and Attachment | Never expires |
| Reflective Supervision | Never expires |
| Self Harm (Additional) | Never expires |

---

## .NET API

### Project Structure
```
EmployeeHub.Api/
├── Controllers/
│   ├── AuthController.cs
│   ├── EmployeesController.cs
│   ├── TrainingCoursesController.cs
│   ├── TrainingRecordsController.cs
│   ├── OnboardingController.cs
│   └── NotificationsController.cs
├── Services/
│   ├── ISupabaseService.cs
│   ├── IAuthService.cs
│   ├── IEmployeeService.cs
│   ├── ITrainingService.cs
│   ├── IOnboardingService.cs
│   ├── INotificationService.cs
│   └── IAuditService.cs
├── Models/
│   ├── User.cs
│   ├── Employee.cs
│   ├── TrainingCourse.cs
│   ├── TrainingRecord.cs
│   ├── OnboardingItem.cs
│   ├── OnboardingRecord.cs
│   └── NotificationLog.cs
├── DTOs/
│   ├── LoginDto.cs
│   ├── EmployeeDto.cs
│   ├── TrainingCourseDto.cs
│   ├── TrainingRecordDto.cs
│   └── OnboardingDto.cs
├── Middleware/
│   ├── JwtAuthMiddleware.cs
│   └── SecurityHeadersMiddleware.cs
├── Jobs/
│   └── ExpiryNotificationJob.cs
└── Program.cs
```

### Required NuGet Packages
- supabase-csharp
- Postgrest
- Swashbuckle.AspNetCore (Swagger)
- BCrypt.Net-Next (password hashing)
- System.IdentityModel.Tokens.Jwt (JWT tokens)
- MailKit (SMTP email sending)

### API Endpoints

**Auth:**
- POST /api/auth/login — authenticate with email/password, returns JWT
- POST /api/auth/change-password — change own password (requires auth)
- GET /api/auth/me — get current user info

**Employees:**
- GET /api/employees — list all active employees
- GET /api/employees/{id} — get single employee
- POST /api/employees — create employee (admin only)
- PUT /api/employees/{id} — update employee (admin only)
- DELETE /api/employees/{id} — soft delete, set active=false (admin only)

**Training Courses:**
- GET /api/training-courses — list all courses (filterable by category)
- GET /api/training-courses/{id} — get single course
- POST /api/training-courses — create course (admin only)
- PUT /api/training-courses/{id} — update course (admin only)
- DELETE /api/training-courses/{id} — delete course (admin only)

**Training Records:**
- GET /api/training-records/employee/{employeeId} — get employee's training history
- POST /api/training-records — record training completion (auto-calculates expiry)
- GET /api/training-records/status — training status for all employees (uses view, filterable by category)
- GET /api/training-records/expiring?days=30 — training expiring within X days

**Onboarding:**
- GET /api/onboarding/items — list all active onboarding items
- POST /api/onboarding/items — create onboarding item (admin only)
- PUT /api/onboarding/items/{id} — update onboarding item (admin only)
- DELETE /api/onboarding/items/{id} — soft delete onboarding item (admin only)
- GET /api/onboarding/employee/{employeeId} — get employee's onboarding status
- PUT /api/onboarding/employee/{employeeId}/{itemId} — update onboarding record status

**Notifications:**
- GET /api/notifications/pending — preview what notifications would be sent
- POST /api/notifications/send — trigger notification check and send emails
- GET /api/notifications/log — view notification history

### Key Implementation Details

1. **Auth Service** — bcrypt for password hashing, JWT for session tokens. Tokens expire after a configurable period (e.g., 8 hours for a workday).
2. **Supabase Service** — singleton, initialized with service role key.
3. **Training Records** — on creation, auto-calculate expiry_date from course validity_months. If validity_months is null, expiry_date is null (never expires).
4. **Onboarding Service** — when a new employee is created, automatically create onboarding_records for all active onboarding_items with status 'pending'. This gives them a complete checklist from day one.
5. **Notification Job** — scheduled job (or manual trigger for POC) that:
   - Queries training_status view for 'Expiring Soon' and 'Expired' records
   - Checks notification_log to avoid sending duplicates
   - Sends emails based on course notify_employee/notify_admin settings
   - Logs every sent notification
6. **Audit Service** — logs all INSERT/UPDATE/DELETE to audit_log with the authenticated user's ID.
7. **Admin vs User** — admin role can create/edit/delete employees, courses, and onboarding items. Regular users can view data and record training completions.

### Configuration (appsettings.json)
```json
{
  "Supabase": {
    "Url": "https://yourproject.supabase.co",
    "ServiceRoleKey": "your-service-role-key-here"
  },
  "Jwt": {
    "Secret": "your-jwt-secret-min-32-chars",
    "ExpiryHours": 8,
    "Issuer": "EmployeeHub"
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "Username": "notifications@example.com",
    "Password": "smtp-password-here",
    "FromAddress": "notifications@example.com",
    "FromName": "Employee Training Hub"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

---

## React Frontend

### Tech Stack
- React 18+ with TypeScript
- Vite
- TanStack Query (React Query) for API calls
- React Router for navigation
- Tailwind CSS for styling
- shadcn/ui component library

### Pages
1. **Login** — email/password form
2. **Dashboard** — training status overview, expiring/expired alerts, notification summary
3. **Employees List** — table with search/filter
4. **Employee Detail** — view/edit employee, training history, onboarding checklist
5. **Training Courses** — list/create/edit courses with category filter and notification settings
6. **Record Training** — form to record training completion for an employee
7. **Onboarding Items** — manage the checklist items (admin only)
8. **Notification Log** — view history of sent notifications (admin only)

### Key Features
- JWT stored in memory (not localStorage for security), with refresh mechanism
- Auth context/provider wrapping the app
- Protected routes (redirect to login if not authenticated)
- Role-based UI (admin sees edit/delete buttons, users see read-only)
- Error handling and loading states on all pages
- Form validation
- Clear visual indicators for training status (colour-coded: green=Valid, amber=Expiring, red=Expired, grey=Not Completed)
- Training course list filterable by category (Online Mandatory / F2F Mandatory / Additional)
- Onboarding checklist on employee detail page with tick/untick functionality
- Responsive design (primarily desktop but usable on tablet)

### API Service
Since the frontend is served from the same origin as the API, requests use relative URLs — no hardcoded base URL needed.

```typescript
class ApiClient {
  private token: string | null = null;

  setToken(token: string) { this.token = token; }
  clearToken() { this.token = null; }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  get(endpoint: string) { return this.request(endpoint); }
  post(endpoint: string, data: unknown) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }
  put(endpoint: string, data: unknown) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }
  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

---

## Notification System

### How It Works
1. A scheduled job (or manual trigger in POC) runs periodically (e.g., daily at 9am)
2. It queries the training_status view for records with status 'Expiring Soon' or 'Expired'
3. For each record, it checks the course's notification settings:
   - If notify_employee = true, queue email to the employee
   - If notify_admin = true, queue email to all admin users
4. Before sending, check notification_log to avoid re-sending the same notification type for the same training record within a configurable window (e.g., don't resend the same warning within 7 days)
5. Send emails via SMTP using MailKit
6. Log every sent email to notification_log

### POC Approach
For the proof of concept, the notification check can be triggered manually via the API endpoint (POST /api/notifications/send) or a simple button in the admin dashboard. A proper scheduled job (e.g., Hangfire, or a cron-based approach) can be added later.

### Email Templates
Simple plain-text emails for POC:
- **Expiry Warning**: "[Employee Name]'s [Course Name] training expires in [X] days (on [Date]). Please arrange renewal."
- **Expired**: "[Employee Name]'s [Course Name] training expired on [Date]. Immediate action required."

---

## Implementation Steps

1. Set up Supabase project and run SQL schema
2. Create .NET API project with folder structure
3. Implement models and DTOs
4. Implement Supabase service (connection)
5. Implement auth service (login, JWT, password hashing)
6. Implement employee service and controller
7. Implement training course service and controller (with category and notification settings)
8. Implement training record service and controller (with auto expiry calculation)
9. Implement onboarding service and controller
10. Implement audit service (log all modifications)
11. Implement notification service (query expiring, send emails, log)
12. Add middleware (JWT auth, security headers, rate limiting)
13. Configure .NET to serve React build output as static files
14. Test all endpoints via Swagger
14. Create React project (Vite + TypeScript + Tailwind)
15. Implement auth (login page, JWT handling, protected routes)
16. Build dashboard page
17. Build employees list and detail pages (with onboarding checklist)
18. Build training courses page (with category filter and notification settings)
19. Build record training page
20. Build onboarding items management page
21. Build notification log page
22. Connect everything and test full workflow
23. Seed training courses and onboarding items from spreadsheet data

---

## Testing Checklist
- [ ] Can login with email and password
- [ ] JWT auth blocks unauthenticated requests
- [ ] Admin-only endpoints reject regular users
- [ ] Can create/edit/deactivate employees
- [ ] New employees get full onboarding checklist automatically
- [ ] Can tick off onboarding items per employee
- [ ] Can create/edit/delete training courses (with category and notification settings)
- [ ] Can record training completion (expiry auto-calculated)
- [ ] Training status view shows correct statuses using per-course warning days
- [ ] Training status filterable by category
- [ ] Expiring training endpoint returns correct records
- [ ] Notification send identifies correct recipients based on course settings
- [ ] Emails are sent via SMTP
- [ ] Notification log prevents duplicate sends
- [ ] Audit log captures all modifications with user ID
- [ ] Frontend served from same origin as API (no CORS needed)
- [ ] Input validation catches bad data
- [ ] Error messages are clear and helpful

---

## Future Expansion (Not in POC)
- Microsoft Entra ID (Azure AD) authentication
- Rotas/shift scheduling
- Absence tracking
- Employee status tracking (maternity leave, sick leave, etc.)
- Push/native notifications (long term, when moving to app)
- File upload for certificates
- Reporting/analytics
- Automated scheduled notification job (Hangfire or similar)
- Password reset via email
- Data import from existing spreadsheet
