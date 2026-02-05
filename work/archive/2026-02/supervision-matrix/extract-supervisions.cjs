const xlsx = require('xlsx');
const fs = require('fs');

// Read the Excel file
const wb = xlsx.readFile('Supervision Matrix Updated 08.12.25.xlsx');
const ws = wb.Sheets['Supervisions'];

// Convert to JSON
const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Parse the structure
const supervisions = [];
const reportingRelationships = [];

let currentManager = null;
let currentSupervisee = null;

for (let i = 3; i < data.length; i++) { // Start from row 3 (after headers)
  const row = data[i];

  // Skip completely empty rows
  if (!row || row.every(cell => !cell)) continue;

  const firstCol = row[0] ? String(row[0]).trim() : '';
  const secondCol = row[1] ? String(row[1]).trim() : '';

  // Check if this row has a manager name in first column
  if (firstCol && !['', 'Manager', 'Seniors'].includes(firstCol)) {
    currentManager = firstCol;
    console.log(`Found manager: ${currentManager}`);
  }

  // Check if second column has supervisee info (name + x1 or x2)
  const hasSuperviseeName = secondCol && secondCol.match(/x\d+/i);

  if (hasSuperviseeName) {
    const match = secondCol.match(/^(.+?)\s+[xX](\d+)/);
    if (match) {
      currentSupervisee = match[1].trim();
      const frequency = parseInt(match[2]);

      if (currentManager) {
        reportingRelationships.push({
          manager: currentManager,
          supervisee: currentSupervisee,
          frequency: frequency
        });
        console.log(`  → supervises ${currentSupervisee} (x${frequency})`);
      }

      // Parse dates from THIS ROW ONLY (when we have a supervisee name)
      for (let col = 2; col < row.length; col++) {
        const cellValue = row[col];
        if (cellValue && typeof cellValue === 'string') {
          // Match date pattern dd.MM.yy or dd.MM.yyyy
          const dateMatches = cellValue.match(/(\d{2})\.(\d{2})\.(\d{2,4})/g);
          if (dateMatches) {
            dateMatches.forEach(dateStr => {
              const parts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
              const day = parts[1];
              const month = parts[2];
              let year = parts[3];
              if (year.length === 2) {
                year = '20' + year;
              }

              const date = `${year}-${month}-${day}`;
              const period = `${year}-${month}`;

              // Extract notes from the cell
              let notes = null;
              if (cellValue.includes('- EM')) notes = 'EM';
              else if (cellValue.includes('- CW')) notes = 'CW';
              else if (cellValue.includes('- 3')) notes = '3 month review';
              else if (cellValue.includes('single subject')) notes = 'single subject';
              else if (cellValue.includes('New Starter')) notes = 'New Starter';
              else if (cellValue.includes('A/L')) notes = 'A/L';

              supervisions.push({
                employee: currentSupervisee,
                conductedBy: currentManager,
                date: date,
                period: period,
                notes: notes
              });
            });
          }
        }
      }
    }
  } else if (currentManager && currentSupervisee && secondCol === '') {
    // This is a continuation row - SKIP dates from continuation rows
    // Reset supervisee to prevent picking up dates
    currentSupervisee = null;
  }

}

console.log('\n=== REPORTING RELATIONSHIPS ===');
reportingRelationships.forEach(r => {
  console.log(`${r.supervisee} reports to ${r.manager} (x${r.frequency})`);
});

console.log('\n=== SUPERVISIONS ===');
console.log(`Total supervisions found: ${supervisions.length}`);
supervisions.slice(0, 30).forEach(s => {
  console.log(`${s.date}: ${s.employee} supervised by ${s.conductedBy}${s.notes ? ` (${s.notes})` : ''}`);
});

// Save to JSON
fs.writeFileSync('supervision-data.json', JSON.stringify({ reportingRelationships, supervisions }, null, 2));
console.log('\nData saved to supervision-data.json');
