import pandas as pd
import math

XLSX = r"C:\Dev\Projects\Web\Ilea Palm\work\rotas\Rota 2026.xlsx"
OUT = r"C:\Dev\Projects\Web\Ilea Palm\work\rotas\import-shifts.sql"

MONTH_SHEETS = [
    ("April", 2026, 4), ("May", 2026, 5), ("June", 2026, 6),
    ("July", 2026, 7), ("August", 2026, 8), ("September", 2026, 9),
    ("October", 2026, 10), ("November", 2026, 11), ("December", 2026, 12),
    ("January", 2027, 1), ("February", 2027, 2), ("March", 2027, 3),
]

CODE_MAP = {"A": "A", "D": "D", "DS": "DS", "S": "S", "E": "E", "L": "L", "*": "RDO"}

def is_valid(val):
    if val is None:
        return False
    if isinstance(val, float) and math.isnan(val):
        return False
    return True

def extract_sheet(df, sheet_name, year, month):
    days_in_month = df.shape[1] - 3  # col 0 = names, last 2 = ASI + Over/Under
    shifts = []
    contracted_hours = None
    employees_parsed = []
    unknown_codes = set()

    row = 2  # employee data starts at row 2
    while row + 2 < len(df):
        first_name = df.iloc[row, 0]
        last_name = df.iloc[row + 1, 0]
        role_code = df.iloc[row + 2, 0]

        # Skip empty separator blocks
        if not is_valid(first_name) or not is_valid(last_name):
            row += 3
            continue

        first_name = str(first_name).strip()
        last_name = str(last_name).strip()

        # Skip if names look like legend/notes text (long strings with spaces)
        if len(first_name) > 20 or len(last_name) > 20:
            row += 3
            continue

        # Skip placeholder rows (James, Logan, Bank with no last name data)
        if not is_valid(last_name) or last_name == "":
            row += 3
            continue

        # Derive contracted hours from Total Hours - Over/Under
        asi_col = days_in_month + 1
        over_under_col = days_in_month + 2
        total_hours = df.iloc[row + 1, asi_col] if asi_col < df.shape[1] else None
        over_under = df.iloc[row + 1, over_under_col] if over_under_col < df.shape[1] else None

        if is_valid(total_hours) and is_valid(over_under):
            derived = float(total_hours) - float(over_under)
            if contracted_hours is None:
                contracted_hours = derived
            # Verify consistency
            elif abs(contracted_hours - derived) > 0.5:
                print(f"  WARNING: {first_name} {last_name} implies contracted={derived}, expected {contracted_hours}")

        employees_parsed.append(f"{first_name} {last_name}")

        # Extract shift codes from row 1 (first name row), cols 1..days_in_month
        for day_idx in range(days_in_month):
            col = day_idx + 1
            val = df.iloc[row, col]
            if not is_valid(val):
                continue
            code = str(val).strip()
            if code in CODE_MAP:
                shift_code = CODE_MAP[code]
                date_str = f"{year}-{month:02d}-{(day_idx + 1):02d}"
                shifts.append((first_name, last_name, date_str, shift_code))
            elif code not in ("", "0"):
                # Check if it's a number (sleep count in wrong row, etc.)
                try:
                    float(code)
                except ValueError:
                    unknown_codes.add(code)

        row += 3

    if unknown_codes:
        print(f"  Unknown codes in {sheet_name}: {unknown_codes}")

    return shifts, contracted_hours, employees_parsed

def main():
    xls = pd.ExcelFile(XLSX)
    all_shifts = []
    monthly_hours = []
    all_employees = set()

    for sheet_name, year, month in MONTH_SHEETS:
        if sheet_name not in xls.sheet_names:
            print(f"Sheet '{sheet_name}' not found, skipping")
            continue

        print(f"Processing {sheet_name} {year}...")
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        shifts, contracted, employees = extract_sheet(df, sheet_name, year, month)

        all_shifts.extend(shifts)
        for e in employees:
            all_employees.add(e)

        if contracted is not None:
            monthly_hours.append((year, month, contracted))
            print(f"  Contracted hours: {contracted}")

        print(f"  Shifts extracted: {len(shifts)}")
        print(f"  Employees: {', '.join(employees)}")

    print(f"\nTotal shifts: {len(all_shifts)}")
    print(f"Total employees: {len(all_employees)}")
    print(f"Employees: {sorted(all_employees)}")

    # Generate SQL
    lines = []
    lines.append("-- Auto-generated from Rota 2026.xlsx")
    lines.append("-- Run after migration.sql (shift_types and shifts tables must exist)")
    lines.append("")

    # Monthly contracted hours
    if monthly_hours:
        lines.append("-- Monthly contracted hours")
        for year, month, hours in monthly_hours:
            lines.append(
                f"INSERT INTO rota_monthly_hours (year, month, contracted_hours) "
                f"VALUES ({year}, {month}, {hours}) "
                f"ON CONFLICT (year, month) DO UPDATE SET contracted_hours = {hours};"
            )
        lines.append("")

    # Group shifts by employee
    from collections import defaultdict
    by_employee = defaultdict(list)
    for first_name, last_name, date_str, shift_code in all_shifts:
        by_employee[(first_name, last_name)].append((date_str, shift_code))

    # Collect unique shift codes
    unique_codes = sorted(set(s[3] for s in all_shifts))

    lines.append("-- Shift assignments")
    lines.append("DO $$")
    lines.append("DECLARE")
    lines.append("  v_emp UUID;")
    for code in unique_codes:
        lines.append(f"  v_st_{code.lower()} UUID;")
    lines.append("BEGIN")
    lines.append("")

    # Look up shift types once
    lines.append("  -- Shift type lookups")
    for code in unique_codes:
        lines.append(f"  SELECT id INTO v_st_{code.lower()} FROM shift_types WHERE code = '{code}';")
    lines.append("")

    # Per-employee blocks
    for (first_name, last_name), shifts in sorted(by_employee.items()):
        fn = first_name.replace("'", "''")
        ln = last_name.replace("'", "''")
        lines.append(f"  -- {first_name} {last_name}")
        lines.append(f"  SELECT id INTO v_emp FROM employees WHERE first_name = '{fn}' AND last_name = '{ln}' LIMIT 1;")
        lines.append(f"  IF v_emp IS NOT NULL THEN")
        for date_str, shift_code in shifts:
            var = f"v_st_{shift_code.lower()}"
            lines.append(f"    INSERT INTO shifts (employee_id, date, shift_type_id) VALUES (v_emp, '{date_str}', {var}) ON CONFLICT (employee_id, date) DO UPDATE SET shift_type_id = {var}, updated_at = NOW();")
        lines.append(f"  END IF;")
        lines.append("")

    lines.append("END $$;")
    lines.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nSQL written to: {OUT}")

if __name__ == "__main__":
    main()
