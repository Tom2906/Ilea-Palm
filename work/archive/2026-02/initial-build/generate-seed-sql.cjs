const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'spreadsheet-data.json'), 'utf8'));

// Deterministic UUID from a string seed (namespace + name)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace UUID
function deterministicUuid(name) {
  const hash = crypto.createHash('sha256').update(NAMESPACE + ':' + name).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

// Parse dates - the spreadsheet uses two formats:
// DD/MM/YYYY (4-digit year, British format)
// M/D/YY (2-digit year, American short format)
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  let year, month, day;

  if (parts[2].length === 4) {
    // DD/MM/YYYY format
    day = parseInt(parts[0]);
    month = parseInt(parts[1]);
    year = parseInt(parts[2]);
  } else {
    // M/D/YY format
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
    year = 2000 + parseInt(parts[2]);
  }

  // Validate
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) {
    console.error(`WARNING: Could not parse date: ${dateStr} -> ${year}-${month}-${day}`);
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

// ============ GENERATE SQL ============

const sql = [];
sql.push('-- ============================================');
sql.push('-- Ilea Palm Employee Hub - Seed Data');
sql.push('-- Generated from S2 & Training Matrix spreadsheet');
sql.push('-- ============================================');
sql.push('BEGIN;');
sql.push('');

// ============ SCHEMA FIXES ============
sql.push('-- ============ SCHEMA FIXES ============');
sql.push('ALTER TABLE training_records ALTER COLUMN recorded_by DROP NOT NULL;');
sql.push('ALTER TABLE onboarding_records ALTER COLUMN recorded_by DROP NOT NULL;');
sql.push('');

// ============ CLEAN EXISTING DATA ============
// Delete in dependency order (children first)
sql.push('-- ============ CLEAN EXISTING DATA ============');
sql.push('DELETE FROM notification_log;');
sql.push('DELETE FROM onboarding_records;');
sql.push('DELETE FROM onboarding_items;');
sql.push('DELETE FROM employee_references;');
sql.push('DELETE FROM training_records;');
sql.push('DELETE FROM training_courses;');
sql.push('DELETE FROM employees;');
sql.push('');

// ============ EMPLOYEES ============
const employeeMap = {};
const employees = [
  { first: 'Alex', last: 'Garvin', role: 'Director', email: 'alex.garvin@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Judith', last: 'James', role: 'Responsible Individual', email: 'judith.james@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Ellen', last: 'Middleton', role: 'Registered Manager', email: 'ellen.middleton@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Philip', last: 'Thomas', role: 'Senior RSW', email: 'philip.thomas@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Charlotte', last: 'Watson', role: 'Senior RSW', email: 'charlotte.watson@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Michelle', last: 'McSporran', role: 'Senior RSW', email: 'michelle.mcsporran@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Jack', last: 'McMahon', role: 'RSW', email: 'jack.mcmahon@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Sarah', last: 'Newson', role: 'RSW', email: 'sarah.newson@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'James', last: 'Logan', role: 'RSW', email: 'james.logan@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Samuel', last: 'Lawrence', role: 'RSW', email: 'samuel.lawrence@ileapalm.co.uk', active: true, status: null, notes: null },
  { first: 'Olivia', last: 'Machnik', role: 'RSW', email: 'olivia.machnik@ileapalm.co.uk', active: true, status: 'Maternity Leave', notes: null },
  { first: 'Rebecca', last: 'Lunt', role: 'Bank', email: 'rebecca.lunt@ileapalm.co.uk', active: true, status: 'Bank', notes: null },
];

// Map spreadsheet names to employee keys
const nameToKey = {
  'Alex Garvin': 'Alex Garvin',
  'Judith James': 'Judith James',
  'Ellen Middleton': 'Ellen Middleton',
  'Philip Thomas': 'Philip Thomas',
  'Charlotte Watson': 'Charlotte Watson',
  'Michelle McSporran': 'Michelle McSporran',
  'Jack McMahon': 'Jack McMahon',
  'Jack McHaon': 'Jack McMahon',
  'Sarah Newson': 'Sarah Newson',
  'James Logan': 'James Logan',
  'Samuel Lawrence': 'Samuel Lawrence',
  'Olivia Machnik (Maternity Leave)': 'Olivia Machnik',
  'Olivia Machnik': 'Olivia Machnik',
  'Rebecca Lunt': 'Rebecca Lunt',
};

sql.push('-- ============ EMPLOYEES ============');
sql.push('-- First, get status IDs for Maternity Leave and Bank');
sql.push('');

for (const emp of employees) {
  const key = emp.first + ' ' + emp.last;
  const id = deterministicUuid('employee:' + key);
  employeeMap[key] = id;

  let statusClause = 'NULL';
  if (emp.status) {
    statusClause = `(SELECT id FROM employee_statuses WHERE name = ${esc(emp.status)} LIMIT 1)`;
  }

  sql.push(`INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)`);
  sql.push(`VALUES (${esc(id)}, ${esc(emp.email)}, ${esc(emp.first)}, ${esc(emp.last)}, NULL, ${esc(emp.role)}, CURRENT_DATE, ${emp.active}, ${statusClause}, ${esc(emp.notes)});`);
  sql.push('');
}

// ============ TRAINING COURSES ============
const courseMap = {};

sql.push('-- ============ TRAINING COURSES ============');

function insertCourses(sheetData) {
  for (const course of sheetData.courses) {
    const id = deterministicUuid('course:' + course.name);
    courseMap[course.name] = id;

    sql.push(`INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)`);
    sql.push(`VALUES (${esc(id)}, ${esc(course.name)}, NULL, ${esc(course.category)}, ${course.validityMonths !== null ? course.validityMonths : 'NULL'}, 30, true, true);`);
    sql.push('');
  }
}

insertCourses(data['Online Mandatory Training']);
insertCourses(data['F2F Mandatory Training']);
insertCourses(data['Additional Training']);

// ============ TRAINING RECORDS ============
sql.push('-- ============ TRAINING RECORDS ============');

let recordCount = 0;

function insertTrainingRecords(sheetData) {
  for (const empData of sheetData.employees) {
    const empName = nameToKey[empData.name] || empData.name;
    const empId = employeeMap[empName];
    if (!empId) {
      console.error(`WARNING: No employee ID for: ${empData.name} (mapped to: ${empName})`);
      continue;
    }

    for (const [courseName, record] of Object.entries(empData.training)) {
      const courseId = courseMap[courseName];
      if (!courseId) {
        console.error(`WARNING: No course ID for: ${courseName}`);
        continue;
      }

      const completionDate = parseDate(record.completionDate);
      const expiryDate = parseDate(record.expiryDate);

      if (!completionDate) {
        console.error(`WARNING: Could not parse completion date for ${empName} / ${courseName}: ${record.completionDate}`);
        continue;
      }

      const recordId = deterministicUuid(`record:${empName}:${courseName}`);
      recordCount++;

      sql.push(`INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)`);
      sql.push(`VALUES (${esc(recordId)}, ${esc(empId)}, ${esc(courseId)}, ${esc(completionDate)}, ${expiryDate ? esc(expiryDate) : 'NULL'}, NULL, NULL);`);
      sql.push('');
    }
  }
}

insertTrainingRecords(data['Online Mandatory Training']);
insertTrainingRecords(data['F2F Mandatory Training']);
insertTrainingRecords(data['Additional Training']);

// ============ ONBOARDING ITEMS ============
sql.push('-- ============ ONBOARDING ITEMS ============');

const onboardingItemMap = {};
const onboardingData = data['DBS & S2'].onboarding;

onboardingData.items.forEach((item, idx) => {
  const id = deterministicUuid('onboarding-item:' + item.name);
  onboardingItemMap[item.name] = id;

  sql.push(`INSERT INTO onboarding_items (id, name, description, display_order, active)`);
  sql.push(`VALUES (${esc(id)}, ${esc(item.name)}, ${esc(item.expectedValue)}, ${idx + 1}, true);`);
  sql.push('');
});

// ============ ONBOARDING RECORDS ============
sql.push('-- ============ ONBOARDING RECORDS ============');

for (const empData of onboardingData.employees) {
  const empName = nameToKey[empData.name] || empData.name;
  const empId = employeeMap[empName];
  if (!empId) {
    console.error(`WARNING: No employee ID for onboarding: ${empData.name}`);
    continue;
  }

  for (const [itemName, itemData] of Object.entries(empData.onboarding)) {
    const itemId = onboardingItemMap[itemName];
    if (!itemId) {
      console.error(`WARNING: No onboarding item ID for: ${itemName}`);
      continue;
    }

    const status = itemData.status === 'complete' ? 'complete' : 'not_required';
    const recordId = deterministicUuid(`onboarding-record:${empName}:${itemName}`);

    sql.push(`INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)`);
    sql.push(`VALUES (${esc(recordId)}, ${esc(empId)}, ${esc(itemId)}, ${esc(status)}, ${status === 'complete' ? 'CURRENT_DATE' : 'NULL'}, NULL);`);
    sql.push('');
  }
}

// ============ REFERENCES ============
sql.push('-- ============ EMPLOYEE REFERENCES ============');

const refsData = data['DBS & S2'].references;
for (const empData of refsData.employees) {
  const empName = nameToKey[empData.name] || empData.name;
  const empId = employeeMap[empName];
  if (!empId) {
    console.error(`WARNING: No employee ID for references: ${empData.name}`);
    continue;
  }

  for (const ref of empData.references) {
    const received = ref.received === 'complete';
    const verbalRef = ref.verbalRef === 'complete';
    const refId = deterministicUuid(`reference:${empName}:${ref.referenceNumber}`);

    sql.push(`INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)`);
    sql.push(`VALUES (${esc(refId)}, ${esc(empId)}, ${ref.referenceNumber}, ${received}, ${verbalRef});`);
    sql.push('');
  }
}

sql.push('COMMIT;');
sql.push('');
sql.push(`-- Summary: ${employees.length} employees, ${Object.keys(courseMap).length} courses, ${recordCount} training records`);

const output = sql.join('\n');
fs.writeFileSync(path.join(__dirname, 'seed-data.sql'), output, 'utf8');
console.log(`Generated seed-data.sql (${output.length} bytes)`);
console.log(`Employees: ${employees.length}`);
console.log(`Courses: ${Object.keys(courseMap).length}`);
console.log(`Training records: ${recordCount}`);
console.log(`Onboarding items: ${onboardingData.items.length}`);
console.log(`Onboarding records: ${onboardingData.employees.length * onboardingData.items.length}`);
console.log(`References: ${refsData.employees.length * 8}`);
