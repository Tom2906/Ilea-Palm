const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'thoma', 'Downloads', 'S2 & Training Matrix Updated on 02.02.26.xlsx');
const outputPath = path.join(__dirname, 'spreadsheet-data.json');

const workbook = XLSX.readFile(filePath, { cellDates: false, cellNF: true, raw: true, cellStyles: true });

// ============================================================
// Helpers
// ============================================================
function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '' || s === 'N/A' || s === '#VALUE!' || s === '#NAME?' || s === 'undefined') return null;
  return s;
}

function cleanDate(v) {
  const c = clean(v);
  if (!c) return null;
  if (c.includes('1902') || c.includes('1900') || c === '12/31/02' || c === '12/31/00') return null;
  return c;
}

// Get cell style (background colour) -- used for onboarding/reference colour-coded cells
function getCellColour(sheet, excelRow, excelCol) {
  const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
  const cell = sheet[cellRef];
  if (!cell || !cell.s) return null;
  const s = cell.s;
  if (s.fgColor) {
    return s.fgColor.rgb || null;
  }
  return null;
}

// Get formatted cell value
function getCellValue(sheet, excelRow, excelCol) {
  const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
  const cell = sheet[cellRef];
  if (!cell) return null;
  if (cell.w) return cell.w;
  if (cell.v !== undefined) return String(cell.v);
  return null;
}

// Map colour to status
function colourToStatus(colour) {
  if (!colour) return 'pending';
  if (colour === '92D050') return 'complete'; // Green
  if (colour === 'FF0000') return 'not_required'; // Red - flagged/issue/not required
  if (colour === 'FFC000') return 'pending'; // Orange/amber - in progress
  return 'pending';
}

const result = {};
const dbsSheet = workbook.Sheets['DBS & S2'];

// The sheet starts at B2, so:
// Grid row 0 = Excel row 2 (B2)
// Grid row 1 = Excel row 3 (B3) = header row
// To convert grid index to Excel row: excelRow = gridRow + 1 (0-indexed)
// Actually B2 means row=1(0-indexed), col=1(0-indexed)
const dbsRange = XLSX.utils.decode_range(dbsSheet['!ref']);
const startRow = dbsRange.s.r; // 1
const startCol = dbsRange.s.c; // 1

// ============================================================
// 1. ONBOARDING (DBS & S2 Sheet, Section 1)
// ============================================================
const onboardingHeaders = [
  'Job Application', 'Interview Questions', 'I.D Photo', 'Contract',
  'Training Contract', 'Employee Handbook', 'JD & PS', 'GDPR Consent',
  'Emergency Contact Details', 'Induction Booklet', 'Personal Information',
  'Observation Day Check List'
];
const onboardingExpected = [
  'Gaps Explained', 'Complete', 'Complete', 'Signed',
  'Signed', 'Signed', 'Signed', 'Signed',
  'Complete', 'Issued', 'Complete', 'Issued'
];

// Employee rows (Excel 0-indexed rows):
// Row indices in the raw dump were based on grid offset. In Excel absolute:
// Judith James = B9 = row 8
// Ellen Middleton = B11 = row 10
// Philip Thomas = B14 = row 13
// Charlotte Watson = B15 = row 14
// etc.
// Using direct cell access for accuracy
const onboardingEmployeeExcelRows = [8, 10, 13, 14, 15, 16, 17, 18, 19, 21, 23];
const onboardingRecords = [];

for (const exRow of onboardingEmployeeExcelRows) {
  const name = clean(getCellValue(dbsSheet, exRow, startCol));
  const role = clean(getCellValue(dbsSheet, exRow, startCol + 1));
  if (!name) continue;

  const emp = { name, role, onboarding: {} };

  for (let i = 0; i < onboardingHeaders.length; i++) {
    const exCol = startCol + 2 + i; // Cols D onwards = startCol + 2, 3, 4...
    const colour = getCellColour(dbsSheet, exRow, exCol);
    emp.onboarding[onboardingHeaders[i]] = {
      status: colourToStatus(colour),
      colour: colour,
      expected: onboardingExpected[i]
    };
  }

  onboardingRecords.push(emp);
}

// ============================================================
// 2. REFERENCES (DBS & S2 Sheet, Section 2)
// ============================================================
// Reference section header at row 28 (0-indexed). Data starts around row 33.
// Each reference uses 2 columns: Received, Verbal Ref
// The cells also use colour coding (no text values)
const refEmployeeExcelRows = [33, 34, 36, 39, 40, 41, 42, 43, 44, 45, 47, 49];
const referenceRecords = [];

for (const exRow of refEmployeeExcelRows) {
  const name = clean(getCellValue(dbsSheet, exRow, startCol));
  const role = clean(getCellValue(dbsSheet, exRow, startCol + 1));
  if (!name) continue;

  const emp = { name, role, references: [] };

  for (let refNum = 1; refNum <= 8; refNum++) {
    const receivedCol = startCol + 2 + (refNum - 1) * 2;
    const verbalCol = receivedCol + 1;
    const receivedColour = getCellColour(dbsSheet, exRow, receivedCol);
    const verbalColour = getCellColour(dbsSheet, exRow, verbalCol);

    emp.references.push({
      referenceNumber: refNum,
      received: colourToStatus(receivedColour),
      receivedColour: receivedColour,
      verbalRef: colourToStatus(verbalColour),
      verbalRefColour: verbalColour
    });
  }

  referenceRecords.push(emp);
}

// ============================================================
// 3. DBS RECORDS (DBS & S2 Sheet, Section 3)
// ============================================================
// DBS header at row 54 (0-indexed). Data starts at row 59.
const dbsEmployeeExcelRows = [59, 60, 62, 65, 66, 67, 68, 69, 70, 71, 73, 75];
const dbsRecords = [];

for (const exRow of dbsEmployeeExcelRows) {
  const name = clean(getCellValue(dbsSheet, exRow, startCol));
  const role = clean(getCellValue(dbsSheet, exRow, startCol + 1));
  if (!name) continue;

  dbsRecords.push({
    name,
    role,
    dbs: {
      dbsNumber: clean(getCellValue(dbsSheet, exRow, startCol + 2)),
      dateOriginalCertificate: cleanDate(getCellValue(dbsSheet, exRow, startCol + 3)),
      checkedBy: clean(getCellValue(dbsSheet, exRow, startCol + 4)),
      updateServiceCheck: cleanDate(getCellValue(dbsSheet, exRow, startCol + 6)),
      updateServiceExpiry: cleanDate(getCellValue(dbsSheet, exRow, startCol + 7)),
      proofOfId1: clean(getCellValue(dbsSheet, exRow, startCol + 8)),
      proofOfId2: clean(getCellValue(dbsSheet, exRow, startCol + 9)),
      proofOfAddress1: clean(getCellValue(dbsSheet, exRow, startCol + 10)),
      proofOfAddress2: clean(getCellValue(dbsSheet, exRow, startCol + 11))
    }
  });
}

result['DBS & S2'] = {
  onboarding: {
    items: onboardingHeaders.map((name, i) => ({
      name,
      expectedValue: onboardingExpected[i]
    })),
    colourKey: {
      '92D050': 'complete (green)',
      'FF0000': 'not_required / issue (red)',
      'D1D1D1': 'spacer row (grey)',
      '000000': 'divider row (black)'
    },
    employees: onboardingRecords
  },
  references: {
    colourKey: {
      '92D050': 'received/complete (green)',
      'FF0000': 'not received / issue (red)'
    },
    employees: referenceRecords
  },
  dbs: {
    employees: dbsRecords
  }
};

// ============================================================
// 4. TRAINING SHEETS
// ============================================================
function parseTrainingSheet(sheetName, category) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const sR = range.s.r;
  const sC = range.s.c;

  // Row offsets from start:
  // +0: spacer (all null)
  // +1: course names line 1
  // +2: course names line 2
  // +3: Renew Timescale
  // +4: sub-headers (Date of Training, Action on/Expired)
  // +5 onwards: employee data

  function parseCourseHeaders(headerStartRow) {
    const row1 = headerStartRow;
    const row2 = headerStartRow + 1;
    const renewRowIdx = headerStartRow + 2;

    const courses = [];
    for (let c = sC + 1; c <= range.e.c; c += 2) {
      let name = '';
      const v1 = clean(getCellValue(sheet, row1, c));
      const v2 = clean(getCellValue(sheet, row2, c));
      if (v1) name += v1;
      if (v2) name += (name ? ' ' : '') + v2;
      name = name.trim();

      if (!name || name === 'Compliant' || name.includes('Expring') || name === 'Expired' || name === 'Action on' || name.includes('Compliant')) continue;

      const renewStr = clean(getCellValue(sheet, renewRowIdx, c));
      let validityMonths = null;
      if (renewStr) {
        if (renewStr.includes('1 Year')) validityMonths = 12;
        else if (renewStr.includes('3 Year')) validityMonths = 36;
      }

      courses.push({
        name,
        category,
        renewTimescaleRaw: renewStr,
        validityMonths,
        dateCol: c,
        expiryCol: c + 1
      });
    }
    return courses;
  }

  // Section 1: starts at sR
  const section1Courses = parseCourseHeaders(sR + 1);
  const section1DataStart = sR + 5;

  // Find section 2 start
  let section2StartRow = null;
  for (let r = sR + 20; r <= range.e.r; r++) {
    const firstCell = clean(getCellValue(sheet, r, sC));
    if (firstCell === 'Training Hub' || firstCell === 'Training' || firstCell === 'Additional') {
      section2StartRow = r;
      break;
    }
  }

  const section2Courses = section2StartRow ? parseCourseHeaders(section2StartRow) : [];
  const section2DataStart = section2StartRow ? section2StartRow + 5 : null;

  // Combine unique courses
  const allCourses = [...section1Courses];
  for (const sc of section2Courses) {
    if (!allCourses.find(c => c.name === sc.name)) {
      allCourses.push(sc);
    }
  }

  // Parse employee rows
  const employees = {};
  const section1End = section2StartRow || range.e.r + 1;

  // Section 1
  for (let r = section1DataStart; r < section1End; r++) {
    const name = clean(getCellValue(sheet, r, sC));
    if (!name) continue;
    if (['Training Hub', 'Training', 'Additional', 'Renew Timescale', 'Name'].includes(name)) continue;

    if (!employees[name]) employees[name] = { name, training: {} };

    for (const course of section1Courses) {
      const dateVal = cleanDate(getCellValue(sheet, r, course.dateCol));
      const expiryVal = cleanDate(getCellValue(sheet, r, course.expiryCol));
      if (dateVal || expiryVal) {
        employees[name].training[course.name] = {
          completionDate: dateVal,
          expiryDate: expiryVal
        };
      }
    }
  }

  // Section 2
  if (section2DataStart) {
    for (let r = section2DataStart; r <= range.e.r; r++) {
      const name = clean(getCellValue(sheet, r, sC));
      if (!name) continue;
      if (['Training Hub', 'Training', 'Additional', 'Renew Timescale', 'Name'].includes(name)) continue;

      if (!employees[name]) employees[name] = { name, training: {} };

      for (const course of section2Courses) {
        const dateVal = cleanDate(getCellValue(sheet, r, course.dateCol));
        const expiryVal = cleanDate(getCellValue(sheet, r, course.expiryCol));
        if (dateVal || expiryVal) {
          employees[name].training[course.name] = {
            completionDate: dateVal,
            expiryDate: expiryVal
          };
        }
      }
    }
  }

  return {
    courses: allCourses.map(c => ({
      name: c.name,
      category: c.category,
      renewTimescaleRaw: c.renewTimescaleRaw,
      validityMonths: c.validityMonths
    })),
    employees: Object.values(employees)
  };
}

result['Online Mandatory Training'] = parseTrainingSheet('Online Mandatory Training', 'Online Mandatory');
result['F2F Mandatory Training'] = parseTrainingSheet('F2F Mandatory Training', 'F2F Mandatory');
result['Additional Training'] = parseTrainingSheet('Additional Training', 'Additional');

// ============================================================
// SUMMARY OUTPUT
// ============================================================
console.log('========== EXTRACTION COMPLETE ==========\n');

console.log('DBS & S2 Sheet:');
console.log(`  Onboarding items: ${result['DBS & S2'].onboarding.items.length}`);
console.log(`  Onboarding employee records: ${result['DBS & S2'].onboarding.employees.length}`);
for (const emp of result['DBS & S2'].onboarding.employees) {
  const items = Object.entries(emp.onboarding);
  const complete = items.filter(([, v]) => v.status === 'complete').length;
  const issues = items.filter(([, v]) => v.status === 'not_required').length;
  console.log(`    ${emp.name} (${emp.role}): ${complete}/${items.length} complete, ${issues} flagged`);
  items.forEach(([name, v]) => {
    if (v.status !== 'complete') console.log(`      [${v.status}] ${name}`);
  });
}

console.log(`\n  Reference employee records: ${result['DBS & S2'].references.employees.length}`);
for (const emp of result['DBS & S2'].references.employees) {
  const refSummary = emp.references
    .map(r => `R${r.referenceNumber}:${r.received}/${r.verbalRef}`)
    .join(', ');
  console.log(`    ${emp.name}: ${refSummary}`);
}

console.log(`\n  DBS employee records: ${result['DBS & S2'].dbs.employees.length}`);
for (const emp of result['DBS & S2'].dbs.employees) {
  console.log(`    ${emp.name}: DBS#${emp.dbs.dbsNumber} | OrigCert=${emp.dbs.dateOriginalCertificate} | CheckedBy=${emp.dbs.checkedBy} | LastCheck=${emp.dbs.updateServiceCheck} | Expiry=${emp.dbs.updateServiceExpiry}`);
  console.log(`      ID: ${emp.dbs.proofOfId1}, ${emp.dbs.proofOfId2} | Address: ${emp.dbs.proofOfAddress1}, ${emp.dbs.proofOfAddress2}`);
}

for (const sheetKey of ['Online Mandatory Training', 'F2F Mandatory Training', 'Additional Training']) {
  const data = result[sheetKey];
  console.log(`\n${sheetKey}:`);
  console.log(`  Courses (${data.courses.length}):`);
  data.courses.forEach(c =>
    console.log(`    - ${c.name} | ${c.renewTimescaleRaw || 'N/A'} | ${c.validityMonths ? c.validityMonths + 'mo' : 'no expiry'}`)
  );
  console.log(`  Employees with records: ${data.employees.length}`);
  for (const emp of data.employees) {
    const records = Object.entries(emp.training);
    if (records.length === 0) continue;
    console.log(`    ${emp.name}: ${records.length} courses`);
    records.forEach(([course, r]) => {
      console.log(`      ${course}: completed=${r.completionDate || '-'}, expires=${r.expiryDate || '-'}`);
    });
  }
}

// Unique employees
const allNames = new Set();
result['DBS & S2'].onboarding.employees.forEach(e => allNames.add(e.name));
result['DBS & S2'].dbs.employees.forEach(e => allNames.add(e.name));
for (const sheet of ['Online Mandatory Training', 'F2F Mandatory Training', 'Additional Training']) {
  result[sheet].employees.forEach(e => allNames.add(e.name));
}
console.log(`\nUnique employees across all sheets (${allNames.size}):`);
[...allNames].sort().forEach(n => console.log(`  - ${n}`));

// Write
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nJSON written to: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
