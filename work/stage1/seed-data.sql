-- ============================================================
-- Seed Data: Training Courses & Onboarding Items
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- Online Mandatory Courses
INSERT INTO training_courses (name, category, validity_months, notification_days_before) VALUES
('Anti-Bullying', 'Online Mandatory', 36, 30),
('CSE', 'Online Mandatory', 36, 30),
('COSHH', 'Online Mandatory', 36, 30),
('Covid 19', 'Online Mandatory', NULL, 30),
('Equality & Diversity', 'Online Mandatory', 36, 30),
('FGM', 'Online Mandatory', 36, 30),
('Fire Safety', 'Online Mandatory', 12, 30),
('First Aid Paediatric', 'Online Mandatory', 36, 30),
('Emergency First Aid L2', 'Online Mandatory', 36, 30),
('Food Safety & Hygiene (Advanced)', 'Online Mandatory', 36, 30),
('GDPR', 'Online Mandatory', 36, 30),
('GDPR - Office', 'Online Mandatory', 36, 30),
('Health & Nutrition', 'Online Mandatory', 36, 30),
('Health & Safety (Advanced)', 'Online Mandatory', 12, 30),
('Infection Control', 'Online Mandatory', 36, 30),
('Internet Safety', 'Online Mandatory', 36, 30),
('Manual Handling', 'Online Mandatory', 36, 30),
('Medication (Advanced)', 'Online Mandatory', 12, 30),
('Psychological First Aid', 'Online Mandatory', 36, 30),
('Radicalisation & Extremism', 'Online Mandatory', 36, 30),
('Reporting & Recording', 'Online Mandatory', 36, 30),
('Risk Management', 'Online Mandatory', 36, 30),
('Self-Harm', 'Online Mandatory', 36, 30),
('Safeguarding Level 2/3/4', 'Online Mandatory', 12, 30);

-- F2F Mandatory Courses
INSERT INTO training_courses (name, category, validity_months, notification_days_before) VALUES
('PRICE (Physical Intervention)', 'F2F Mandatory', 12, 30),
('Emergency First Aid at Work', 'F2F Mandatory', 36, 30),
('Fire Warden', 'F2F Mandatory', 36, 30),
('Introduction to PACE', 'F2F Mandatory', NULL, 30),
('IOSH', 'F2F Mandatory', NULL, 30);

-- Additional Courses
INSERT INTO training_courses (name, category, validity_months, notification_days_before) VALUES
('Distressed Behaviours', 'Additional', NULL, 30),
('Compassion Fatigue', 'Additional', NULL, 30),
('Workshops - Reporting & Recording (Occurrences, PIs, MFC)', 'Additional', NULL, 30),
('Workshops - Behaviour Management', 'Additional', NULL, 30),
('ADHD Training', 'Additional', NULL, 30),
('Childhood Development', 'Additional', NULL, 30),
('Trauma and Attachment', 'Additional', NULL, 30),
('Reflective Supervision', 'Additional', NULL, 30),
('Self Harm (Additional)', 'Additional', NULL, 30);

-- Onboarding Items (from DBS & S2 sheet)
INSERT INTO onboarding_items (name, display_order) VALUES
('Job Application (gaps explained)', 1),
('Interview Questions', 2),
('ID Photo', 3),
('Contract', 4),
('Training Contract', 5),
('Employee Handbook', 6),
('Job Description & Person Spec', 7),
('GDPR Consent', 8),
('Emergency Contact Details', 9),
('Induction Booklet', 10),
('Personal Information', 11),
('Observation Day Checklist', 12);
