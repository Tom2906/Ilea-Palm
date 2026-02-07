"""
Parse appraisal data from 'Supervision Matrix Updated 08.12.25.xlsx' (Apprasials tab)
and generate SQL INSERT statements for appraisal_milestones table.

Data interpretation rules (from cell type analysis):
- String "Completed DD.MM.YY" → completed review
- String DD.MM.YY → completed review
- datetime first-of-month → scheduled due date (pending)
- datetime non-first-of-month → completed review (e.g., Watson review 7 = 2025-10-20)
- NaN or whitespace → skip
"""

import pandas as pd
import re
from datetime import datetime

SPREADSHEET = r"C:\Users\thoma\Downloads\Supervision Matrix Updated 08.12.25.xlsx"
FREQUENCY_MONTHS = 3

df = pd.read_excel(SPREADSHEET, sheet_name="Apprasials", header=None)


def calc_due_date(start_date, review_number):
    m = start_date.month + review_number * FREQUENCY_MONTHS
    y = start_date.year + (m - 1) // 12
    m = (m - 1) % 12 + 1
    d = min(start_date.day, 28)
    return datetime(y, m, d)


employees = []
for i in range(2, 10):
    row = df.iloc[i]
    name = str(row[1]).strip()
    start_date = datetime.strptime(str(row[2]).strip(), "%d.%m.%y")

    reviews = []
    for col_idx in range(3, 15):
        review_number = col_idx - 2
        cell = row[col_idx]

        if pd.isna(cell) or (isinstance(cell, str) and cell.strip() == ""):
            continue

        cell_str = str(cell).strip()
        completed_date = None
        due_date = calc_due_date(start_date, review_number)

        # "Due X - Completed DD.MM.YY"
        match = re.search(r"[Cc]ompleted\s+(\d{2}\.\d{2}\.\d{2})", cell_str)
        if match:
            completed_date = datetime.strptime(match.group(1), "%d.%m.%y")
        elif isinstance(cell, datetime):
            if cell.day == 1:
                # First-of-month datetime = scheduled due date
                due_date = cell
                completed_date = None
            else:
                # Specific date = completed
                completed_date = cell
        elif re.match(r"^\d{2}\.\d{2}\.\d{2}$", cell_str):
            completed_date = datetime.strptime(cell_str, "%d.%m.%y")
        else:
            print(f"  WARNING: Unrecognized format for {name} review {review_number}: '{cell_str}'")
            continue

        reviews.append({
            "review_number": review_number,
            "due_date": due_date,
            "completed_date": completed_date,
        })

    employees.append({"name": name, "start_date": start_date, "reviews": reviews})

# Generate SQL
print("-- Appraisal data import from spreadsheet")
print("-- Source: Supervision Matrix Updated 08.12.25.xlsx (Apprasials tab)")
print(f"-- Generated: {datetime.now().strftime('%Y-%m-%d')}")
print()
print("-- Ensure all employees have appraisal_frequency_months = 3")
print("UPDATE employees SET appraisal_frequency_months = 3 WHERE appraisal_frequency_months IS NULL;")
print()

for emp in employees:
    parts = emp["name"].split()
    first_name = parts[0]
    last_name = " ".join(parts[1:])

    if not emp["reviews"]:
        print(f"-- {emp['name']}: No review records to import")
        continue

    print(f"-- {emp['name']} (started {emp['start_date'].strftime('%d.%m.%Y')})")
    for r in emp["reviews"]:
        due_str = r["due_date"].strftime("%Y-%m-%d")
        if r["completed_date"]:
            comp_str = f"'{r['completed_date'].strftime('%Y-%m-%d')}'"
            status = "completed"
        else:
            comp_str = "NULL"
            status = "pending"

        print(f"""INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, {r['review_number']}, '{due_str}', {comp_str}
FROM employees e
WHERE e.first_name = '{first_name}' AND e.last_name = '{last_name}'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #{r['review_number']} ({status})""")
        print()

print("-- Verify: SELECT e.first_name, e.last_name, am.review_number, am.due_date, am.completed_date")
print("-- FROM appraisal_milestones am JOIN employees e ON e.id = am.employee_id ORDER BY e.last_name, am.review_number;")
