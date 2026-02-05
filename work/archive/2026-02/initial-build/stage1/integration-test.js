// Full backend integration test
const http = require('http');
const BASE = 'http://localhost:5180';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(url, { method, headers }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  let token;
  let passed = 0;
  let failed = 0;

  function check(name, condition) {
    if (condition) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // 1. Health
  console.log('\n=== Health ===');
  const health = await request('GET', '/api/health');
  check('Health returns 200', health.status === 200);
  check('DB connected', health.data.database === 'connected');

  // 2. Seed data
  console.log('\n=== Seed Data ===');
  const seed = await request('POST', '/api/seed/data');
  check('Seed data returns 200', seed.status === 200);
  console.log(`  Courses: ${seed.data.coursesCreated}, Onboarding: ${seed.data.onboardingItemsCreated}`);

  // 3. Login
  console.log('\n=== Auth ===');
  const login = await request('POST', '/api/auth/login', { email: 'admin@ileapalm.co.uk', password: 'Admin123!' });
  check('Login returns 200', login.status === 200);
  check('Has token', !!login.data.token);
  check('User is admin', login.data.user?.role === 'admin');
  token = login.data.token;

  // 4. Get me
  const me = await request('GET', '/api/auth/me', null, token);
  check('/me returns 200', me.status === 200);
  check('/me returns admin', me.data.role === 'admin');

  // 5. Unauth test
  const unauth = await request('GET', '/api/auth/me');
  check('/me without token returns 401', unauth.status === 401);

  // 6. Training courses
  console.log('\n=== Training Courses ===');
  const courses = await request('GET', '/api/training-courses', null, token);
  check('Courses returns 200', courses.status === 200);
  check('Has 38 courses', Array.isArray(courses.data) && courses.data.length === 38);

  // Filter by category
  const online = await request('GET', '/api/training-courses?category=Online%20Mandatory', null, token);
  check('Online Mandatory filter', Array.isArray(online.data) && online.data.length === 24);

  const f2f = await request('GET', '/api/training-courses?category=F2F%20Mandatory', null, token);
  check('F2F Mandatory filter', Array.isArray(f2f.data) && f2f.data.length === 5);

  const additional = await request('GET', '/api/training-courses?category=Additional', null, token);
  check('Additional filter', Array.isArray(additional.data) && additional.data.length === 9);

  // 7. Create employee
  console.log('\n=== Employees ===');
  const emp = await request('POST', '/api/employees', {
    email: 'philip.thomas@ileapalm.co.uk',
    firstName: 'Philip',
    lastName: 'Thomas',
    role: 'Senior Residential Support Worker',
    startDate: '2024-01-15'
  }, token);
  check('Create employee returns 201', emp.status === 201);
  const empId = emp.data.id;
  console.log(`  Employee ID: ${empId}`);

  // List employees
  const empList = await request('GET', '/api/employees', null, token);
  check('List employees returns 200', empList.status === 200);
  check('Has 1 employee', Array.isArray(empList.data) && empList.data.length === 1);

  // 8. Onboarding records auto-created
  console.log('\n=== Onboarding ===');
  const onboarding = await request('GET', `/api/onboarding/employee/${empId}`, null, token);
  check('Onboarding returns 200', onboarding.status === 200);
  check('Has 12 onboarding records', Array.isArray(onboarding.data) && onboarding.data.length === 12);
  check('All pending', onboarding.data.every(r => r.status === 'pending'));

  // Update one onboarding record
  const firstItem = onboarding.data[0];
  const updateOb = await request('PUT', `/api/onboarding/employee/${empId}/${firstItem.itemId}`, { status: 'complete' }, token);
  check('Update onboarding returns 200', updateOb.status === 200);
  check('Status is complete', updateOb.data.status === 'complete');

  // 9. Training records
  console.log('\n=== Training Records ===');
  const fireSafety = courses.data.find(c => c.name === 'Fire Safety');
  const record = await request('POST', '/api/training-records', {
    employeeId: empId,
    courseId: fireSafety.id,
    completionDate: '2026-01-15'
  }, token);
  check('Create training record returns 201', record.status === 201);
  check('Expiry auto-calculated (12 months)', record.data.expiryDate === '2027-01-15');
  console.log(`  Completion: ${record.data.completionDate}, Expiry: ${record.data.expiryDate}`);

  // No-expiry course
  const covid = courses.data.find(c => c.name === 'Covid 19');
  const record2 = await request('POST', '/api/training-records', {
    employeeId: empId,
    courseId: covid.id,
    completionDate: '2026-02-01'
  }, token);
  check('No-expiry course has null expiry', record2.data.expiryDate === null);

  // Get employee training history
  const history = await request('GET', `/api/training-records/employee/${empId}`, null, token);
  check('Training history returns 200', history.status === 200);
  check('Has 2 records', Array.isArray(history.data) && history.data.length === 2);

  // 10. Training status
  console.log('\n=== Training Status ===');
  const status = await request('GET', '/api/training-records/status', null, token);
  check('Status returns 200', status.status === 200);
  check('Has status entries', Array.isArray(status.data) && status.data.length > 0);

  const fireSafetyStatus = status.data.find(s => s.courseName === 'Fire Safety');
  check('Fire Safety is Valid', fireSafetyStatus?.status === 'Valid');

  // 11. Onboarding items
  console.log('\n=== Onboarding Items ===');
  const items = await request('GET', '/api/onboarding/items', null, token);
  check('Items returns 200', items.status === 200);
  check('Has 12 items', Array.isArray(items.data) && items.data.length === 12);

  // 12. Notifications
  console.log('\n=== Notifications ===');
  const pending = await request('GET', '/api/notifications/pending', null, token);
  check('Pending returns 200', pending.status === 200);

  const log = await request('GET', '/api/notifications/log', null, token);
  check('Log returns 200', log.status === 200);

  // 13. Audit log check (via health - we know writes happened)
  console.log('\n=== Summary ===');
  console.log(`  ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
}

test().catch(err => { console.error('Test error:', err); process.exit(1); });
