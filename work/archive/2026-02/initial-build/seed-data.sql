-- ============================================
-- Ilea Palm Employee Hub - Seed Data
-- Generated from S2 & Training Matrix spreadsheet
-- ============================================
BEGIN;

-- ============ SCHEMA FIXES ============
ALTER TABLE training_records ALTER COLUMN recorded_by DROP NOT NULL;
ALTER TABLE onboarding_records ALTER COLUMN recorded_by DROP NOT NULL;

-- ============ CLEAN EXISTING DATA ============
DELETE FROM notification_log;
DELETE FROM onboarding_records;
DELETE FROM onboarding_items;
DELETE FROM employee_references;
DELETE FROM training_records;
DELETE FROM training_courses;
DELETE FROM employees;

-- ============ EMPLOYEES ============
-- First, get status IDs for Maternity Leave and Bank

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('edafced0-e97f-49e5-89d5-b869c4555be2', 'alex.garvin@ileapalm.co.uk', 'Alex', 'Garvin', NULL, 'Director', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('e8daa839-c39d-46b4-8337-343db962ad7c', 'judith.james@ileapalm.co.uk', 'Judith', 'James', NULL, 'Responsible Individual', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'ellen.middleton@ileapalm.co.uk', 'Ellen', 'Middleton', NULL, 'Registered Manager', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'philip.thomas@ileapalm.co.uk', 'Philip', 'Thomas', NULL, 'Senior RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('6f108089-ca79-4593-855c-62969dac8742', 'charlotte.watson@ileapalm.co.uk', 'Charlotte', 'Watson', NULL, 'Senior RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'michelle.mcsporran@ileapalm.co.uk', 'Michelle', 'McSporran', NULL, 'Senior RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'jack.mcmahon@ileapalm.co.uk', 'Jack', 'McMahon', NULL, 'RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('82c1f543-9da6-49a0-8258-4751d22a3131', 'sarah.newson@ileapalm.co.uk', 'Sarah', 'Newson', NULL, 'RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('a8702e42-06be-49fb-84f3-3282d550a77b', 'james.logan@ileapalm.co.uk', 'James', 'Logan', NULL, 'RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('34744458-c0e4-45bc-8412-77db4afd0e80', 'samuel.lawrence@ileapalm.co.uk', 'Samuel', 'Lawrence', NULL, 'RSW', CURRENT_DATE, true, NULL, NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'olivia.machnik@ileapalm.co.uk', 'Olivia', 'Machnik', NULL, 'RSW', CURRENT_DATE, true, (SELECT id FROM employee_statuses WHERE name = 'Maternity Leave' LIMIT 1), NULL);

INSERT INTO employees (id, email, first_name, last_name, department, role, start_date, active, status_id, notes)
VALUES ('7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'rebecca.lunt@ileapalm.co.uk', 'Rebecca', 'Lunt', NULL, 'Bank', CURRENT_DATE, true, (SELECT id FROM employee_statuses WHERE name = 'Bank' LIMIT 1), NULL);

-- ============ TRAINING COURSES ============
INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('e03b219d-449e-4e5c-8be0-b2ce11a477d7', 'Anti-Bullying', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('6bf2502b-3e12-4f16-8a9f-91d4e5230df6', 'CSE', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('c56d6dc9-e1b3-4269-873e-236ade19ba33', 'COSH', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('b9da83f5-c68a-4131-8f37-54b80fd896c2', 'Covid 19', NULL, 'Online Mandatory', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('4d5b875d-c803-4873-8a40-d1b1fedcc30a', 'Equality & Diversity', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('56d96348-ec2d-4ae8-88d6-0d5926920efa', 'FGM', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('550a07b9-da3a-437b-836b-fc48d6a0f72c', 'Fire Safety', NULL, 'Online Mandatory', 12, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('564ea879-7e8e-4b76-89f2-d2dd6705d23b', 'First Aid Paediatric', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('412b2e80-bd5b-4e2b-88ff-a0d33a3da912', 'Emergency First Aid L2', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('0958d382-7870-40d7-8ef5-9cda0804de47', 'Food Safety & Hygiene (Advanced)', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('b02703b3-03b5-4c6f-894a-5713f4825de4', 'GDPR', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('e6f10069-e342-44c9-84e1-335f908b7ce5', 'GDPR - Office', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('077fd09b-4bce-4a1b-8430-f51ff91f894c', 'Health & Nutrition', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('c115f981-6d4a-459c-8a55-ed03f8ae934c', 'Health & Safety (Advanced)', NULL, 'Online Mandatory', 12, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('03c34744-0693-47f8-83dc-a1093728f374', 'Infection Control', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('a250f0ea-2239-48d3-81c2-6599e5c94005', 'Interrnet Safety', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('476b329e-a1b9-49f6-84fb-2ccc5bb8688b', 'Manual Handling', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('9ae0df20-aeec-42c5-8a71-bfff393b4c0f', 'Medication (Advanced)', NULL, 'Online Mandatory', 12, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', 'Pyschological First Aid', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('2e78676d-844e-4066-846d-07b55f377867', 'Radicalisation & Extremism', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('9fb75110-2b0f-4bb1-8096-1a383a735aca', 'Reporting & Recording', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('916f89ce-d5a3-4e46-82f4-c3bcce2c2399', 'Risk Management', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('dfb1c32c-4669-427d-8c7a-f8990e719df7', 'Self-Harm', NULL, 'Online Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('7688eb44-20a1-4e90-8b87-4a9c7b983f51', 'Safeguarding Level 2/3/4', NULL, 'Online Mandatory', 12, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('256a44e0-d0bc-44c6-8be0-328eda3ac7ed', 'PRICE (Physical Intervention)', NULL, 'F2F Mandatory', 12, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', 'Emergency First Aid at Work', NULL, 'F2F Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('bd955166-245d-4bb1-88fe-a9e5f2a149ea', 'Fire Warden', NULL, 'F2F Mandatory', 36, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('00c81501-766f-40a5-81b5-7880641c0c6d', 'Introduction to PACE', NULL, 'F2F Mandatory', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('cd89437d-b478-4599-8497-1b9659c3a0c1', 'IOSHH', NULL, 'F2F Mandatory', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('6bde018b-b07a-496f-8aa4-ebb9cda2f8f2', 'Distressed Behaviours', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('b5104b44-a611-4daa-8d5f-cae9f42a19e2', 'Compassion Fatigue', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('41dfff6e-d5f7-405f-8848-9fb8c923a399', 'Workshops - reporting and recording Occurrences, PI''s, MFC', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('5115fd2d-90e1-48bb-8d40-15cf8cddf872', 'Workshops Behaviour Management', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('f8cae0ee-8932-4d33-801d-710a78b0c49a', 'ADHD Training', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('e7b75d42-ce80-4f0a-897b-ecb5fadc58a0', 'Childhood Development', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('16e2151c-0892-4dbb-8c2f-02a72f705aba', 'Trauma and Attachement', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('8b86c3e0-bd40-4565-894f-39a71a4e98d8', 'Reflective Supervision', NULL, 'Additional', NULL, 30, true, true);

INSERT INTO training_courses (id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin)
VALUES ('78b5b128-a3ff-465d-8adc-4f8edf21cd99', 'Self Harm', NULL, 'Additional', NULL, 30, true, true);

-- ============ TRAINING RECORDS ============
INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('16bc7cd5-585d-41f2-8a0c-e80b4a3174b9', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e47a378b-f129-4fb7-85d4-340d92eac934', 'edafced0-e97f-49e5-89d5-b869c4555be2', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('90cb391e-1b43-4b32-8778-0cbe11f3068b', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('7da3bae0-9d13-4d50-817b-1ca6304f4301', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2023-04-29', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('19b8c505-2018-4d6a-827b-a7f5c922cc08', 'edafced0-e97f-49e5-89d5-b869c4555be2', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-05-10', '2028-01-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0fab562c-2e40-4c17-853f-eaa3eef61452', 'edafced0-e97f-49e5-89d5-b869c4555be2', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('81fd6da2-add6-46e5-8512-af5b1f09964f', 'edafced0-e97f-49e5-89d5-b869c4555be2', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-07-11', '2026-07-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('3da34ccb-19e4-4893-8fa2-1bd6a6854d5d', 'edafced0-e97f-49e5-89d5-b869c4555be2', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('089e4a37-a63d-47c0-8bd9-ea736fe86198', 'edafced0-e97f-49e5-89d5-b869c4555be2', '0958d382-7870-40d7-8ef5-9cda0804de47', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2e4b0175-de47-4324-81a9-0759d5cd3d8e', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('62c50af8-c7ab-4bfd-8e0d-abd2cac726d8', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'e6f10069-e342-44c9-84e1-335f908b7ce5', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('178bd6c3-5010-4bbe-8125-de4b02f75930', 'edafced0-e97f-49e5-89d5-b869c4555be2', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('4b45024a-d943-4ab1-8241-c9f533822bf8', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-07-11', '2026-07-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('952a64dc-7fca-4d62-85a6-052231a0424b', 'edafced0-e97f-49e5-89d5-b869c4555be2', '03c34744-0693-47f8-83dc-a1093728f374', '2025-07-11', '2028-03-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d65b1809-7bf1-4bf0-85c8-0fbad5caaba7', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2023-04-29', '2026-03-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('90078822-f1d6-4605-87d2-05d7946fa5b2', 'edafced0-e97f-49e5-89d5-b869c4555be2', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2023-04-29', '2026-03-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('045ba55b-351e-43ea-89eb-b000df9bd240', 'edafced0-e97f-49e5-89d5-b869c4555be2', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-07-17', '2026-07-17', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ebfd21ae-d295-4544-866e-cdb8ef04a6ec', 'edafced0-e97f-49e5-89d5-b869c4555be2', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2023-04-29', '2026-03-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f43b07b6-b2e3-406c-8a1f-a3d09c45a8de', 'edafced0-e97f-49e5-89d5-b869c4555be2', '2e78676d-844e-4066-846d-07b55f377867', '2023-04-29', '2026-03-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('766903e5-605c-4ed7-8f8e-d80e917ef232', 'edafced0-e97f-49e5-89d5-b869c4555be2', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0632dd7f-d3cc-4825-862a-98c6f71b398f', 'edafced0-e97f-49e5-89d5-b869c4555be2', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2025-10-11', '2028-06-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('07e2e3fc-5664-4550-8792-4591ab6dce70', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2023-04-29', '2026-03-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e397fec0-5062-454b-8623-f4de70cbdbfe', 'edafced0-e97f-49e5-89d5-b869c4555be2', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2024-12-09', '2025-12-09', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c17426ae-b081-43de-8938-69553aac7bd3', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2023-12-10', '2026-08-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('534516bb-6e3e-4053-85ad-9e5e04bd5c7c', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2023-12-06', '2026-08-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8d1f9ecc-678d-4350-8dc5-1553b375f6a6', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2023-12-31', '2026-08-31', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('fc689029-202e-4ab5-87b3-da56084da21a', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2023-12-16', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('aa957ccd-d0f0-43a7-891a-7d8f07c5d0d6', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-05-25', '2028-01-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5f5a661e-266f-4ff2-8d4f-7bee55fcad43', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2023-12-31', '2026-08-31', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('29e1c2a8-164e-44dc-8035-6e726c6ffa81', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-05-23', '2026-05-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0962bdd7-7f6f-442d-816a-504d89dc3332', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2023-12-28', '2026-08-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('4e108ae7-e7f1-4584-87b6-aa28a56c41ce', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '0958d382-7870-40d7-8ef5-9cda0804de47', '2026-01-01', '2028-09-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('3d06931a-c8e1-4e69-84e8-3cdc364afe70', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2023-12-28', '2026-08-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('123c2a3e-9653-42b9-8506-263bacefd925', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'e6f10069-e342-44c9-84e1-335f908b7ce5', '2024-01-23', '2026-09-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d5e2f84b-b795-4103-850f-db15714f2cfc', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2024-02-04', '2026-10-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('68e8a7cc-8a98-4258-80c6-272de2282870', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-05-29', '2026-05-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d2101c4a-4971-435c-8737-aad93c459447', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '03c34744-0693-47f8-83dc-a1093728f374', '2025-05-29', '2028-01-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9fda85c2-ee2a-4b44-8144-1e93597b63a4', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2024-02-05', '2026-10-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9c922d38-b1df-4a4a-847b-ca713eb8ab70', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2024-01-23', '2026-09-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0dd575ca-ebcf-41ee-8ff4-8aacab995537', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-04-18', '2026-04-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d03c0e9f-c4a1-4e53-8905-db07c51853a2', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2024-02-28', '2026-10-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5e9da5e0-b990-4c36-8db4-3efc8e7c93fb', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '2e78676d-844e-4066-846d-07b55f377867', '2024-02-05', '2026-10-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('209ad5ce-97e7-4b42-849b-f85cebf4256a', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2024-02-29', '2026-10-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0307a012-1bcc-46a2-88e8-128802190654', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2024-02-29', '2026-10-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('4176c0f4-5523-48bf-8948-51b1508a3862', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2024-02-28', '2026-10-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('163ece14-48eb-4177-8131-11b7c09d0b42', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-05-21', '2026-05-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8abba3ea-4605-444a-85d6-9e0e2975a9e2', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2024-02-14', '2026-10-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('79e0b3b9-483a-4060-84cc-aed8e1497dea', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2024-02-14', '2026-10-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('28481887-304e-4a89-8d94-c474afb26217', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2024-02-22', '2026-10-22', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c11c3a4d-3601-45f9-8ac5-ccf4121121da', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2024-02-22', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1bca4976-523d-4bc4-8b5e-16fbcd9464dd', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-04-21', '2027-12-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2bb73969-3694-48d1-8dcc-c651d3f9ab42', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2024-02-24', '2026-10-24', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('46fe6866-15b7-4bed-8b3e-9a68f6fd2f2b', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-01-12', '2026-01-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('bcec9d83-234d-4a89-83d4-990db7861a01', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2024-01-23', '2026-09-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('328ba85c-ed74-4774-80ed-882afec0d07e', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '0958d382-7870-40d7-8ef5-9cda0804de47', '2024-02-24', '2027-02-24', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b5fe7663-bb2b-4f5d-8539-83bc735dbaa2', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2024-02-27', '2026-10-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('312e3503-863e-473c-880e-5085204c067e', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'e6f10069-e342-44c9-84e1-335f908b7ce5', '2024-02-27', '2026-10-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a1e808f5-0e30-48af-80bd-33ef89631e9e', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2024-02-26', '2026-10-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0757b201-b81e-4faf-8c32-262e92091c0b', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-06-20', '2026-06-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('14a5c53f-b1f9-479e-844c-53c0e6fa4c7d', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '03c34744-0693-47f8-83dc-a1093728f374', '2025-06-20', '2028-02-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a307e368-2c37-4cb6-8f1f-ff957c3baba2', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2024-02-29', '2026-10-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('174067d1-47a1-42ee-8c8a-2bcfaf302653', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2024-02-20', '2026-10-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f98f3c30-8299-4cbd-8516-ec2b8aae13c2', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2026-01-30', '2027-01-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('43fc6332-0f2b-4950-8668-2b0a05a9106a', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2024-02-28', '2026-10-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ffb21dae-c301-4d5d-8dde-b6672bb52da5', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '2e78676d-844e-4066-846d-07b55f377867', '2024-02-28', '2026-10-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('93e7d080-09b6-40ad-85eb-3fdadc6bc6d1', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2024-02-28', '2026-10-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1a71a9aa-232a-4b6c-81c8-4c4d394fc9b8', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2024-02-29', '2026-10-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f3b23f45-1450-4099-8f03-46b7268bb1a3', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2024-02-26', '2026-10-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('dea263cf-7e16-4cae-8ced-4889407506fc', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-04-09', '2026-04-09', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('598562ca-a021-4340-818c-e8f786b9cfbd', '6f108089-ca79-4593-855c-62969dac8742', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2023-11-29', '2026-07-29', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ed244c39-9401-46a6-8bf1-3e7f2f2ed622', '6f108089-ca79-4593-855c-62969dac8742', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2023-12-05', '2026-08-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c9343cc8-c461-4f3a-8469-d1cdab36a831', '6f108089-ca79-4593-855c-62969dac8742', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2023-12-05', '2026-08-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cbfdac34-dd4f-45bc-8a0a-179e8b5bdcc7', '6f108089-ca79-4593-855c-62969dac8742', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2023-12-12', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9db88796-beda-4748-8dfd-630b1611f242', '6f108089-ca79-4593-855c-62969dac8742', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2024-12-26', '2027-08-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('44234d4c-dd42-4578-8293-c329e7de0239', '6f108089-ca79-4593-855c-62969dac8742', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2023-12-14', '2026-08-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('208abd42-0245-4c03-870c-becb990fd50e', '6f108089-ca79-4593-855c-62969dac8742', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2026-01-24', '2027-01-24', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('74766ea5-3bc4-4d9a-852a-6a085a67a81e', '6f108089-ca79-4593-855c-62969dac8742', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2023-12-12', '2026-08-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('71c3df34-1919-4d3c-8bde-0cd46ed44149', '6f108089-ca79-4593-855c-62969dac8742', '0958d382-7870-40d7-8ef5-9cda0804de47', '2023-12-21', '2026-08-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('3e7102e1-eda8-4e02-81ed-00179b57dabe', '6f108089-ca79-4593-855c-62969dac8742', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2023-12-21', '2026-08-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c5102fbb-0f90-468d-8602-f2f425e47a1e', '6f108089-ca79-4593-855c-62969dac8742', 'e6f10069-e342-44c9-84e1-335f908b7ce5', '2023-12-28', '2026-08-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9ca5f50c-a914-4382-8262-56a6127483f3', '6f108089-ca79-4593-855c-62969dac8742', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2024-01-07', '2026-09-07', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('eb740bc9-051d-42e2-8e8b-b16644dda354', '6f108089-ca79-4593-855c-62969dac8742', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-06-05', '2026-06-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5d47f08e-e428-47f2-89de-09e897686560', '6f108089-ca79-4593-855c-62969dac8742', '03c34744-0693-47f8-83dc-a1093728f374', '2025-01-26', '2027-09-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cc963e55-cbea-4701-87d5-8d045719b21b', '6f108089-ca79-4593-855c-62969dac8742', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2024-01-31', '2026-09-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d2f1b8de-4005-4219-80ac-a1f188016dcc', '6f108089-ca79-4593-855c-62969dac8742', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2024-01-31', '2026-09-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c985a0d3-7e5f-4bd7-888f-2ec6ad09a5ff', '6f108089-ca79-4593-855c-62969dac8742', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2026-01-18', '2027-01-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('dfc8af0d-7fb5-42ea-86e0-713ee336cf91', '6f108089-ca79-4593-855c-62969dac8742', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2024-02-02', '2026-10-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('26dad6f5-98b0-490d-89f1-cab790df5ba4', '6f108089-ca79-4593-855c-62969dac8742', '2e78676d-844e-4066-846d-07b55f377867', '2024-02-02', '2026-10-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('efb7ed15-4214-496d-8818-7a152218946b', '6f108089-ca79-4593-855c-62969dac8742', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2024-01-31', '2026-09-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e365c77b-eff0-487f-8de6-325e253890f9', '6f108089-ca79-4593-855c-62969dac8742', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2024-02-12', '2026-10-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('30d4a7a8-c2f2-483f-8aa5-475cbaa3072f', '6f108089-ca79-4593-855c-62969dac8742', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2024-02-18', '2026-10-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('65189554-eda2-4704-8f8a-d480e1576122', '6f108089-ca79-4593-855c-62969dac8742', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2026-01-20', '2027-01-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0ec46c94-31b8-475f-81c2-94327a6dd513', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2024-07-02', '2027-03-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('49e59e2a-75c4-4635-8baa-bee3f9e7c098', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2024-08-20', '2027-04-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a9d135d6-8d4f-4dae-8cce-6453502137f3', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2024-08-20', '2027-04-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('7d942cc5-7a63-41db-8148-d2e82e34be9c', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2024-07-08', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6e67493c-0875-4b49-809f-60fc593fdcaf', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-01-07', '2027-09-07', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b12df103-b122-4362-800f-d7c6b4d2dbfe', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2024-07-08', '2027-03-08', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d1eafce8-e9b9-47a7-8cbd-a3cee355b31f', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-01-07', '2026-01-07', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9a675864-d74c-4b13-83ef-6094529ae3e6', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2024-11-23', '2027-07-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d5292e62-0e7a-4e8c-8845-72ec999bd4d3', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '0958d382-7870-40d7-8ef5-9cda0804de47', '2025-01-16', '2027-09-16', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6e720560-3cd6-46d6-86b3-a63b85f75ff7', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2024-07-08', '2027-03-08', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('592f87a4-b0ff-4b24-82b3-9c0454dc0c4a', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2024-07-10', '2027-03-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ddb6da61-754e-4d93-8e54-9e6c8ada59b0', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-10-10', '2026-10-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('39e894ff-00ab-4359-895c-d3e9cab11c43', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '03c34744-0693-47f8-83dc-a1093728f374', '2024-08-14', '2027-04-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('01991e54-4d9d-4cfa-8586-79852cc0d99d', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2024-09-25', '2027-05-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('7b940cb7-7946-4a51-8d16-0d1ade84364d', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2024-07-10', '2027-03-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b7c72422-3269-4d07-8f04-357b12fde1be', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-01-07', '2026-01-07', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('55871046-ff55-4958-817b-09cc757db029', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2024-07-10', '2027-03-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('94028bf9-ab4f-4f35-863e-94e3506f2da3', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '2e78676d-844e-4066-846d-07b55f377867', '2024-09-25', '2027-05-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('af39dda0-0ad4-4098-8379-17ef4e104f62', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2024-07-10', '2027-03-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ae653467-333b-4ae9-85d8-56934ab13e37', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2024-10-01', '2027-06-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1476d03d-e788-4044-8e10-0bfe847c2876', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2024-11-23', '2027-07-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cfa02fe6-d964-48dd-8747-163fa8db5286', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-03-30', '2026-03-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('59044b37-084c-4497-82eb-27436f42c96b', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2025-09-17', '2028-05-17', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1ca5386a-57e4-45ac-8178-c8e5b53305dc', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2025-10-08', '2028-06-08', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('305c6d94-533e-4e04-88da-825913930332', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2025-09-22', '2028-05-22', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cef31d78-7ba1-4e0a-8806-c28760c8b5eb', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-10-01', '2028-06-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('61d4e5cd-3ac8-4690-81de-8150cae9bd83', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2025-10-21', '2028-06-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8b4d1af8-74b8-47a5-8705-6778901c689a', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-09-10', '2026-09-10', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('78a5198e-71c5-4c64-8986-035bedacc78f', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2025-09-11', '2028-05-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e26864b5-f6b4-40c6-8413-2073f253adb7', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '0958d382-7870-40d7-8ef5-9cda0804de47', '2025-10-03', '2028-06-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b8c801b9-2057-4d6d-8ace-a4ff0f373ab8', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2025-09-11', '2028-05-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9d9040b7-904d-4f90-87e4-8600f017da0e', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2025-10-01', '2028-06-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e21574dd-beb5-4712-88e0-0c30105676c8', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-09-11', '2026-09-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b7b2a6a3-e112-4d6b-8e86-a3ae92362eab', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '03c34744-0693-47f8-83dc-a1093728f374', '2025-10-02', '2028-06-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d4b6f083-679a-478a-8baa-3871c1d4cf54', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2025-10-21', '2028-06-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1b75e63e-80c7-43d0-89df-d3d9910a6a08', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2025-10-03', '2028-06-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a25d0398-faf7-4ca3-8183-1c07b1765fbb', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-09-11', '2026-09-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ec8e504a-568a-4396-8349-7b5abf9d7af3', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2025-11-03', '2028-07-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('521557e0-76c6-41db-83e0-2dd05450c8f7', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '2e78676d-844e-4066-846d-07b55f377867', '2025-10-22', '2028-06-22', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5fb8ab09-b3a4-4535-8d66-0a1423ad20fd', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2025-09-11', '2028-05-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cdb55d9b-4ecf-4cd7-88e0-5839706a1ff4', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2025-10-04', '2028-06-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6e6abb15-c3d4-4fa0-8d4d-54dcbbfeb777', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2025-10-22', '2028-06-22', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('47023302-618d-493d-8e14-7aeed8459552', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-09-11', '2026-09-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('40156be3-e357-4505-85c3-ec95dfb331a6', '82c1f543-9da6-49a0-8258-4751d22a3131', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2025-06-20', '2028-02-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c675f14a-649b-4a9e-8475-44c4abd6dc8f', '82c1f543-9da6-49a0-8258-4751d22a3131', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2025-06-27', '2028-02-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2f358caf-4cea-4460-85b4-dc79b60b0de7', '82c1f543-9da6-49a0-8258-4751d22a3131', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2025-06-13', '2028-02-13', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9731460e-fb20-4598-8120-f4ccc747bd55', '82c1f543-9da6-49a0-8258-4751d22a3131', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-07-04', '2028-03-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2f051470-8430-41d4-8dff-e5a53c9e9ec3', '82c1f543-9da6-49a0-8258-4751d22a3131', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2025-07-06', '2028-03-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2e8d7846-ba39-4777-846c-7a7952acb19e', '82c1f543-9da6-49a0-8258-4751d22a3131', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-06-28', '2026-06-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('81f1ced5-5aa5-4105-8ae9-2c61585e1be7', '82c1f543-9da6-49a0-8258-4751d22a3131', '564ea879-7e8e-4b76-89f2-d2dd6705d23b', '2025-07-18', '2028-03-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f59d7fb0-9705-4a7b-8438-296e00af9564', '82c1f543-9da6-49a0-8258-4751d22a3131', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2025-06-14', '2028-02-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1f31f8f4-c05d-4362-8086-9cf18c34ea86', '82c1f543-9da6-49a0-8258-4751d22a3131', '0958d382-7870-40d7-8ef5-9cda0804de47', '2025-06-16', '2028-02-16', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c90e4e94-f62e-4ef0-8666-980e8311527d', '82c1f543-9da6-49a0-8258-4751d22a3131', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2025-07-06', '2028-03-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8d484d3e-61af-4d4d-850f-a174ac8c0c6f', '82c1f543-9da6-49a0-8258-4751d22a3131', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2025-07-06', '2028-03-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c8465222-dc65-42e4-8441-3654b4815467', '82c1f543-9da6-49a0-8258-4751d22a3131', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-07-12', '2026-07-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('457ec5aa-0bba-410f-809a-63a5291bc9eb', '82c1f543-9da6-49a0-8258-4751d22a3131', '03c34744-0693-47f8-83dc-a1093728f374', '2025-07-15', '2028-03-15', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('ff06313b-8f91-4211-8d7f-d058918d340e', '82c1f543-9da6-49a0-8258-4751d22a3131', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2025-06-26', '2028-02-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('555c4bae-8d4e-439d-8abd-7147f813805e', '82c1f543-9da6-49a0-8258-4751d22a3131', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2025-07-04', '2028-03-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('479db30d-ff0e-4faf-803a-f09c01c27600', '82c1f543-9da6-49a0-8258-4751d22a3131', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-06-04', '2026-06-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9c26e902-25ac-4344-8cd4-a12e6a3e6993', '82c1f543-9da6-49a0-8258-4751d22a3131', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2025-08-03', '2028-04-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b489c212-53a0-4c88-8566-5c09eecb1402', '82c1f543-9da6-49a0-8258-4751d22a3131', '2e78676d-844e-4066-846d-07b55f377867', '2025-08-11', '2028-04-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cc65bb76-c34b-4dc7-87a6-eb8fca33e091', '82c1f543-9da6-49a0-8258-4751d22a3131', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2025-08-11', '2028-04-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5d4d340a-4e28-4cf6-8c0e-ff96a99cf48a', '82c1f543-9da6-49a0-8258-4751d22a3131', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2025-08-11', '2028-04-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('715a754c-207a-47fe-850a-21cd1dc5f670', '82c1f543-9da6-49a0-8258-4751d22a3131', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2025-08-03', '2028-04-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6a302d90-0195-4212-86fd-947e51ff3972', '82c1f543-9da6-49a0-8258-4751d22a3131', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-06-13', '2026-06-13', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6f0f5539-f1ed-4851-8b94-72566d42bc21', '34744458-c0e4-45bc-8412-77db4afd0e80', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2025-10-03', '2028-06-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('7eaa05d8-8b9f-4acc-847b-6860c4bde46d', '34744458-c0e4-45bc-8412-77db4afd0e80', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2025-11-05', '2028-07-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6209fc86-7ab0-48d2-8858-ef2153cd87fc', '34744458-c0e4-45bc-8412-77db4afd0e80', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2025-11-01', '2028-07-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('526fa4e4-b19f-4a2a-8440-8b0ac6b62b5d', '34744458-c0e4-45bc-8412-77db4afd0e80', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2025-11-05', '2028-07-05', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5f7df62c-7d74-4023-89d9-7db7889c956d', '34744458-c0e4-45bc-8412-77db4afd0e80', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2025-11-12', '2028-07-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f2d2eff6-1285-45a1-856e-076964d5663f', '34744458-c0e4-45bc-8412-77db4afd0e80', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2025-10-06', '2026-10-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0a4a7028-5da9-4640-8509-cd7fee8bdf6e', '34744458-c0e4-45bc-8412-77db4afd0e80', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2025-10-06', '2028-06-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('669c961d-6ec5-413c-8deb-39414fb21a43', '34744458-c0e4-45bc-8412-77db4afd0e80', '0958d382-7870-40d7-8ef5-9cda0804de47', '2025-11-01', '2028-07-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('795202b0-6d7c-4c35-8c0d-b96764853378', '34744458-c0e4-45bc-8412-77db4afd0e80', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2025-10-03', '2028-06-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2fc512d4-6c6e-4571-805c-f78fc535f5c2', '34744458-c0e4-45bc-8412-77db4afd0e80', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2025-11-12', '2028-07-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2c0cfeb6-0c5f-4712-84a4-18763d50e9a3', '34744458-c0e4-45bc-8412-77db4afd0e80', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2025-10-06', '2026-10-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('020ffd42-e5a3-4236-84b2-2f9ed08292fd', '34744458-c0e4-45bc-8412-77db4afd0e80', '03c34744-0693-47f8-83dc-a1093728f374', '2025-10-14', '2028-06-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8ed9561f-19f4-47d5-8bf8-2f6db1684922', '34744458-c0e4-45bc-8412-77db4afd0e80', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2025-11-12', '2028-07-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8b662993-417b-41a7-8857-ee5d504cbbef', '34744458-c0e4-45bc-8412-77db4afd0e80', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2025-10-14', '2028-06-14', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('afb85ec7-a304-403d-8e28-72dc44c7059d', '34744458-c0e4-45bc-8412-77db4afd0e80', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2025-09-25', '2026-09-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9e2a630e-f971-4031-86de-457e73198929', '34744458-c0e4-45bc-8412-77db4afd0e80', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2025-11-13', '2028-07-13', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('89862f6d-4bcc-4241-8cff-94502fa5119c', '34744458-c0e4-45bc-8412-77db4afd0e80', '2e78676d-844e-4066-846d-07b55f377867', '2025-11-12', '2028-07-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b466bea8-77a6-4f4c-8880-acbf02fc4604', '34744458-c0e4-45bc-8412-77db4afd0e80', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2025-10-06', '2028-06-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('65b6b6ae-513b-4fa7-806d-ff56a4c47bbf', '34744458-c0e4-45bc-8412-77db4afd0e80', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2025-11-07', '2028-07-07', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('01e26866-c56f-4415-85c4-e122abd77a47', '34744458-c0e4-45bc-8412-77db4afd0e80', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2025-11-13', '2028-07-13', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('03f846c9-325c-4a08-8ddd-576058f5b2c2', '34744458-c0e4-45bc-8412-77db4afd0e80', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2025-10-03', '2026-10-03', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('bbe7d2ce-a0f4-49c7-8725-8ccc54773512', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'e03b219d-449e-4e5c-8be0-b2ce11a477d7', '2024-06-20', '2027-02-20', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c8e78023-d34a-4050-87e6-4bef1ac8f526', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '6bf2502b-3e12-4f16-8a9f-91d4e5230df6', '2024-06-30', '2027-02-28', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d8dc4c11-68c7-4622-8d53-357ab9521162', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'c56d6dc9-e1b3-4269-873e-236ade19ba33', '2024-06-18', '2027-02-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('afd99ca6-bc26-4ece-8d4c-821e4af65b89', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'b9da83f5-c68a-4131-8f37-54b80fd896c2', '2024-06-25', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f6f38e1e-65bb-41da-823b-7e5626aaef90', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '4d5b875d-c803-4873-8a40-d1b1fedcc30a', '2024-07-12', '2027-03-12', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c82eb84f-8d07-40c5-8c07-e4e743091e90', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '56d96348-ec2d-4ae8-88d6-0d5926920efa', '2024-07-24', '2027-03-24', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('14a78620-436a-4df8-8b21-ab8d481f328f', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '550a07b9-da3a-437b-836b-fc48d6a0f72c', '2026-01-13', '2027-01-13', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e3e09fbe-03cb-4920-855b-e685454d9a89', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '412b2e80-bd5b-4e2b-88ff-a0d33a3da912', '2024-06-19', '2027-02-19', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('95b667ae-bd78-4be9-8eec-299e02913630', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '0958d382-7870-40d7-8ef5-9cda0804de47', '2024-06-18', '2027-02-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('4834e30f-b570-468b-8700-23c562a00912', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'b02703b3-03b5-4c6f-894a-5713f4825de4', '2024-06-25', '2027-02-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a0808555-6c46-409e-82e3-9caaedb6cfb3', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'e6f10069-e342-44c9-84e1-335f908b7ce5', '2024-06-25', '2026-05-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('499684b8-b26b-4c7a-863a-59f16f8bf8d2', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '077fd09b-4bce-4a1b-8430-f51ff91f894c', '2026-01-18', '2028-09-18', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b6417473-94a1-48d0-842c-2ae403122690', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'c115f981-6d4a-459c-8a55-ed03f8ae934c', '2026-01-22', '2027-01-22', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('82b0df70-090a-4300-8d62-5087688e5145', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '03c34744-0693-47f8-83dc-a1093728f374', '2025-06-25', '2028-02-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b515134f-0603-4b35-812d-5c601115c409', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'a250f0ea-2239-48d3-81c2-6599e5c94005', '2025-06-25', '2028-02-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('bdc617af-0028-464f-8241-b5e4170b066f', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '476b329e-a1b9-49f6-84fb-2ccc5bb8688b', '2024-08-11', '2027-04-11', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6504290a-3511-44ba-892e-aaa7376b6d1b', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '9ae0df20-aeec-42c5-8a71-bfff393b4c0f', '2026-01-26', '2027-01-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9b35f8a9-b59a-41bf-8be0-622bacf43b2b', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '9e63bf8e-f1c9-4083-8bc2-858a0f0e5794', '2024-08-02', '2027-04-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('516d18a1-3d0b-47c4-8bc5-1b25f5c506d7', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '2e78676d-844e-4066-846d-07b55f377867', '2024-06-25', '2027-02-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('25c86ffc-cf8c-4b52-87a6-7b3e8f56fa21', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '9fb75110-2b0f-4bb1-8096-1a383a735aca', '2026-01-26', '2028-09-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8bb84e1c-daf5-4364-8e62-4dea1055fade', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '916f89ce-d5a3-4e46-82f4-c3bcce2c2399', '2024-08-02', '2027-04-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('459a435e-4390-43b0-846c-abaf858236aa', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'dfb1c32c-4669-427d-8c7a-f8990e719df7', '2024-07-30', '2027-03-30', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('afc3f2ee-c93a-414d-89f7-1f5c457847c1', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '7688eb44-20a1-4e90-8b87-4a9c7b983f51', '2026-01-26', '2027-01-26', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b92d67ba-dae4-4c59-8860-7551290325c6', 'edafced0-e97f-49e5-89d5-b869c4555be2', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-06-02', '2026-06-02', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cc347676-9965-410a-87bb-ac6d145a8347', 'edafced0-e97f-49e5-89d5-b869c4555be2', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-06', '2027-11-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('06fec6c3-db44-402b-8672-ffdaddd91e52', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'bd955166-245d-4bb1-88fe-a9e5f2a149ea', '2024-03-04', '2027-03-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('1fa74979-e440-4adc-8845-00edaea9b99f', 'edafced0-e97f-49e5-89d5-b869c4555be2', 'cd89437d-b478-4599-8497-1b9659c3a0c1', '2017-11-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('4764395e-26f1-4727-858c-66cd08c10289', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-06-19', '2026-06-19', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0172a90b-f8e4-4cda-8173-fffa3ad889c4', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-27', '2027-11-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2b4a4643-bfad-4187-86dd-7cb4e6ec2d8c', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'bd955166-245d-4bb1-88fe-a9e5f2a149ea', '2024-03-04', '2027-03-04', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c027262d-a467-4a9d-8eca-c4c7404083fd', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '00c81501-766f-40a5-81b5-7880641c0c6d', '2024-05-07', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('3539d803-90ad-441e-830d-41cc2630f0f2', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'cd89437d-b478-4599-8497-1b9659c3a0c1', '2025-04-25', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('67d1f365-9527-4d82-868a-d0589353d922', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-06-19', '2026-06-19', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('731559f4-c163-4409-811c-8aa9c32efec1', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-27', '2027-11-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6553a598-353d-47e0-880e-20fe0fcf69ad', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '00c81501-766f-40a5-81b5-7880641c0c6d', '2024-09-13', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('f3e098cb-53f5-4c77-8f49-ce1cf38dbe0f', '6f108089-ca79-4593-855c-62969dac8742', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-06-19', '2028-06-19', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8988ef41-3a66-4edc-8bf1-504199f3eacf', '6f108089-ca79-4593-855c-62969dac8742', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-27', '2027-11-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('da181325-7ca3-4927-80db-1d6c84eed66e', '6f108089-ca79-4593-855c-62969dac8742', '00c81501-766f-40a5-81b5-7880641c0c6d', '2024-05-07', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('b1e74597-5878-4544-8bd6-00f65028e9e3', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-05-23', '2026-05-23', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('dbe12a59-bfe9-4cea-8422-045beeda95f7', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-27', '2027-11-27', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('220e0dd6-1505-427a-8d1a-e31dfbe6c61f', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '00c81501-766f-40a5-81b5-7880641c0c6d', '2024-09-13', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8743e257-436d-449c-8839-1c3ba28542e7', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-09-09', '2028-09-09', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c593e81c-9359-431f-83a4-d59b6d128a65', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '00c81501-766f-40a5-81b5-7880641c0c6d', '2025-11-24', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('3760fa17-7f73-4eda-8345-b8d21de881d5', '82c1f543-9da6-49a0-8258-4751d22a3131', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-05-21', '2026-05-21', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('528d9607-21c9-4a6b-81e6-465a44e6a17b', '82c1f543-9da6-49a0-8258-4751d22a3131', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2025-07-01', '2028-07-01', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9ad28c31-338c-4d51-8ef9-77726980d16b', '82c1f543-9da6-49a0-8258-4751d22a3131', '00c81501-766f-40a5-81b5-7880641c0c6d', '2025-06-09', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('cbd71bfb-a22a-40b7-844d-934419a88490', '34744458-c0e4-45bc-8412-77db4afd0e80', '256a44e0-d0bc-44c6-8be0-328eda3ac7ed', '2025-09-25', '2026-09-25', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a2d9dd6c-8860-4c55-895e-955685760bb3', '34744458-c0e4-45bc-8412-77db4afd0e80', '00c81501-766f-40a5-81b5-7880641c0c6d', '2025-11-24', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('d0ad949c-1331-4c2b-8f02-57ddca55c388', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '7ad84eb0-bc7f-4ae0-86e9-9549f001beb2', '2024-11-06', '2027-11-06', NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e18ba2ec-1f57-4f24-85c9-497a82057fd3', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '00c81501-766f-40a5-81b5-7880641c0c6d', '2024-09-13', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('a94d086b-65d5-4241-8af7-5962bcf0c6c5', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'f8cae0ee-8932-4d33-801d-710a78b0c49a', '2024-04-30', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('356aa1d9-6ff2-4bb8-8780-023112582ee9', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'e7b75d42-ce80-4f0a-897b-ecb5fadc58a0', '2023-12-11', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('6a8f1449-666b-4463-86d6-28bce45c05a3', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '8b86c3e0-bd40-4565-894f-39a71a4e98d8', '2025-02-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('983f13ea-7f42-4367-810f-3847aabc3454', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '41dfff6e-d5f7-405f-8848-9fb8c923a399', '2025-01-30', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('81a507ee-45b5-4d1a-8b40-ab0514002d00', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '5115fd2d-90e1-48bb-8d40-15cf8cddf872', '2025-09-18', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('7890afa6-8c34-4eae-876a-bc4618c27575', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'f8cae0ee-8932-4d33-801d-710a78b0c49a', '2024-04-30', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('0dfc51a7-7d56-417f-894c-631de55ac33a', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'e7b75d42-ce80-4f0a-897b-ecb5fadc58a0', '2024-09-04', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8bd107b0-1baf-4bae-8024-14112a694b6f', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '8b86c3e0-bd40-4565-894f-39a71a4e98d8', '2025-02-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2b03a334-329d-48b4-88e2-7c9a02c892c9', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '78b5b128-a3ff-465d-8adc-4f8edf21cd99', '2024-06-28', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c13a7da6-fd11-4502-8933-ba10adcbc328', '6f108089-ca79-4593-855c-62969dac8742', '6bde018b-b07a-496f-8aa4-ebb9cda2f8f2', '2025-06-06', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c5ce9d88-b013-4831-823e-19b9d5d38c63', '6f108089-ca79-4593-855c-62969dac8742', 'b5104b44-a611-4daa-8d5f-cae9f42a19e2', '2025-04-24', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('48c69a52-d64e-4e17-811f-4de4306c1c2f', '6f108089-ca79-4593-855c-62969dac8742', '41dfff6e-d5f7-405f-8848-9fb8c923a399', '2025-07-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8d2b4611-acb3-4d38-8565-7a711b98fe92', '6f108089-ca79-4593-855c-62969dac8742', '5115fd2d-90e1-48bb-8d40-15cf8cddf872', '2025-09-18', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('41d15e41-4016-405a-8cff-6b793fe8f9a9', '6f108089-ca79-4593-855c-62969dac8742', 'f8cae0ee-8932-4d33-801d-710a78b0c49a', '2024-09-24', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('9ab19bce-0409-4d61-8302-1f49584a751b', '6f108089-ca79-4593-855c-62969dac8742', '8b86c3e0-bd40-4565-894f-39a71a4e98d8', '2025-07-15', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('e70eec1c-b9ce-4b84-8eb1-25b0e4e66151', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '6bde018b-b07a-496f-8aa4-ebb9cda2f8f2', '2025-04-01', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('5f14354a-5670-4e2f-83be-f91569b825f2', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'b5104b44-a611-4daa-8d5f-cae9f42a19e2', '2025-05-22', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('78c4e89e-62c9-4990-8ab9-1e57117622d6', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '41dfff6e-d5f7-405f-8848-9fb8c923a399', '2025-07-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('8a23aa0d-bcfe-4fc1-8416-77a45c288107', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '5115fd2d-90e1-48bb-8d40-15cf8cddf872', '2025-09-18', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('2c0cdd89-b86f-42f0-896e-f31fcae36f03', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'e7b75d42-ce80-4f0a-897b-ecb5fadc58a0', '2024-09-04', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('41b30676-af24-44f7-8c43-1e488b251ef2', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '8b86c3e0-bd40-4565-894f-39a71a4e98d8', '2025-06-18', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('739c1060-1991-42e6-8cf0-8642eafea8f3', '82c1f543-9da6-49a0-8258-4751d22a3131', '41dfff6e-d5f7-405f-8848-9fb8c923a399', '2025-07-17', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('abbb9b35-81f8-421a-82e6-9e4df67b9d46', '82c1f543-9da6-49a0-8258-4751d22a3131', '5115fd2d-90e1-48bb-8d40-15cf8cddf872', '2025-09-18', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('75c58af6-d80e-42df-85b3-16c6c5a9c165', '82c1f543-9da6-49a0-8258-4751d22a3131', 'f8cae0ee-8932-4d33-801d-710a78b0c49a', '2025-06-23', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('c33073a0-0894-4cbd-8787-0905b5ef678d', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '41dfff6e-d5f7-405f-8848-9fb8c923a399', '2025-01-30', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('041bbbe6-8bfa-4be5-81c7-8ab63c7e23e9', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'f8cae0ee-8932-4d33-801d-710a78b0c49a', '2024-09-24', NULL, NULL, NULL);

INSERT INTO training_records (id, employee_id, course_id, completion_date, expiry_date, certificate_url, notes)
VALUES ('babcbfc9-8306-4768-8791-fc4d396ac175', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '78b5b128-a3ff-465d-8adc-4f8edf21cd99', '2024-06-28', NULL, NULL, NULL);

-- ============ ONBOARDING ITEMS ============
INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'Job Application', 'Gaps Explained', 1, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'Interview Questions', 'Complete', 2, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'I.D Photo', 'Complete', 3, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('d9b40f8c-b711-4bbe-82e9-c090db5171ef', 'Contract', 'Signed', 4, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'Training Contract', 'Signed', 5, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'Employee Handbook', 'Signed', 6, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'JD & PS', 'Signed', 7, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('fce459d5-e57e-4724-8758-9dc424f489ac', 'GDPR Consent', 'Signed', 8, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('36f92e9f-cd8e-408e-86d6-db42697844e3', 'Emergency Contact Details', 'Complete', 9, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('987f4c18-9acb-4b54-8873-76e7264ad4c3', 'Induction Booklet', 'Issued', 10, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('15def333-75dd-42fe-8090-551a6cfba141', 'Personal Information', 'Complete', 11, true);

INSERT INTO onboarding_items (id, name, description, display_order, active)
VALUES ('a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'Observation Day Check List', 'Issued', 12, true);

-- ============ ONBOARDING RECORDS ============
INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('ac08d7dc-a9a0-458f-8628-2c306ff9b8f2', 'e8daa839-c39d-46b4-8337-343db962ad7c', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4c9e35bd-2209-4563-84b4-96d75bfc98fc', 'e8daa839-c39d-46b4-8337-343db962ad7c', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3a1e28a2-b84f-4a63-8a52-9370442b799f', 'e8daa839-c39d-46b4-8337-343db962ad7c', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d3c4ad8b-2c29-4fb3-85a0-b80f86e998a3', 'e8daa839-c39d-46b4-8337-343db962ad7c', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('cbe463c5-2f54-4851-804b-6ecb9de9f0ee', 'e8daa839-c39d-46b4-8337-343db962ad7c', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('90544810-d54f-41a9-846d-de648b51bcae', 'e8daa839-c39d-46b4-8337-343db962ad7c', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('f4302552-6920-4d50-81c3-e99d9a0ffaee', 'e8daa839-c39d-46b4-8337-343db962ad7c', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d32bd707-f8aa-4982-8454-d43cd6cb9f35', 'e8daa839-c39d-46b4-8337-343db962ad7c', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c0667623-60e0-4554-815a-f4c55ec6b022', 'e8daa839-c39d-46b4-8337-343db962ad7c', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('eaa11abb-bc1e-4bec-85e3-b85288299631', 'e8daa839-c39d-46b4-8337-343db962ad7c', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e305e8b2-2d81-4ab6-896b-80b9c0862792', 'e8daa839-c39d-46b4-8337-343db962ad7c', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c8716a71-e610-4c7c-8deb-67e2906b9042', 'e8daa839-c39d-46b4-8337-343db962ad7c', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('ebc1f063-8301-464b-89d1-a944ef59f32b', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('878ce818-a597-45f1-8493-92f7aa1b8804', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6d7d90af-eb2c-46c1-8150-f28c9b4a173a', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('dc9f9f1e-bd47-4b17-84b2-67c1639ca7d5', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('ddee0bfe-5af8-4c1c-89d7-be97d36aab42', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('f3aa6b87-61fb-49d2-8f59-18d2df8eb3af', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('fa88417d-0809-4fa1-87c8-01ff44ca7362', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4ab06c08-0783-4135-8664-c8a23ce799a9', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('69c9e474-51bb-42ad-8235-48567a6cfef0', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('daa4ae4e-3a17-44a2-800a-d52098fdf897', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('53b43e3c-3c54-43ec-88b5-b91228ea1480', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('305c03b6-1835-4c43-819c-df2f4311cd0c', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('8986da51-faaa-4557-89a9-e04b99d06bf4', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('515b2a12-048d-4bd5-8376-888f320934d4', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d2a59d82-bacc-4956-8234-789c82cd9576', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('36ef4c37-6b29-4175-81a4-0ac67d6212de', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('1fa11dce-9ced-4d25-828c-9e7990f4a5d3', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('74e533f5-91cc-4865-895e-291e706f7fb8', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('07bc6e4f-c0ae-487e-8b01-a119844eb1c0', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('876b328b-6444-43a0-857a-53330d57fe87', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c545fb47-a090-407e-8c0c-11be1ad95121', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e7324cc6-4a62-4a18-8c67-f1373a220279', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('92185e91-ffec-4e4e-8853-4e1ee50bbfb7', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('313f32e2-71ad-4b04-8b2d-fae7f870a9ed', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('983d30a8-4f80-408f-8686-6f8b4686c5d1', '6f108089-ca79-4593-855c-62969dac8742', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3b0897c9-929d-4409-84bd-4b7729fe9271', '6f108089-ca79-4593-855c-62969dac8742', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('82feb217-ad89-4f4f-8a5a-99e2ef66b2d7', '6f108089-ca79-4593-855c-62969dac8742', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('8545e169-dff6-4e01-87c9-82ef48795ff9', '6f108089-ca79-4593-855c-62969dac8742', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('1482314d-f69b-4e32-8b0b-fd0656b36b1d', '6f108089-ca79-4593-855c-62969dac8742', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('b6257daa-ca03-4d68-82b4-591276a0a82d', '6f108089-ca79-4593-855c-62969dac8742', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('9a5f129c-93bb-407f-8219-f41b1a3a2691', '6f108089-ca79-4593-855c-62969dac8742', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('2cea437d-de4d-4f06-852c-700df65efc86', '6f108089-ca79-4593-855c-62969dac8742', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('a58aae0a-72a0-4024-8206-f6c243ba13a8', '6f108089-ca79-4593-855c-62969dac8742', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('dc7dbdaa-bebc-46cb-8be7-93bfbec3badf', '6f108089-ca79-4593-855c-62969dac8742', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4532b295-b867-4128-87ca-5a5f52030f84', '6f108089-ca79-4593-855c-62969dac8742', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('77718a22-e375-4bad-8211-28ff3e5f5dfe', '6f108089-ca79-4593-855c-62969dac8742', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d55ff2cf-f634-40db-8c5a-cfabfbe4a1ae', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6ea27688-eb6d-4a42-895e-3a6e241badc5', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('5b8bdcf5-b3b1-4bb0-82b7-fd36a708b302', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('be5b8558-36c8-4332-8e0c-9f46ab4abaa5', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('7811c2f9-588a-4896-8017-048da6555535', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('8a404366-afb4-4f40-8e75-ec0619df23cf', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6cea5402-157c-4351-8c7e-640812ede9d2', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d2c5960a-1bc1-4cfd-8347-4de980534186', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('f86d717c-4566-4d07-8855-d7a310450ea6', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('0eb8df10-842e-4319-8288-61dcb00291f8', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('667bd16f-9f07-4f9c-8fe4-8757518a589f', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('cf287ecc-8392-4224-8312-48fd0e7ed595', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('1320fdde-65e3-4404-8207-b4664d9b8ba8', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('b4127b1e-f957-4635-8460-e3722cc8b7df', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('2ddaf174-f92c-4486-8194-35c842d4ae26', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4ad0edf6-c534-477e-8aa2-b3df86ff71b4', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('bdbe2c6a-3171-4a24-8336-8ff773a9a0b4', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('35370aa1-e95c-46e1-8fde-c0aa09fc59e6', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('5fa38559-46c7-47de-89f0-5abce19d3e0e', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('df89fd23-7446-4e90-87a7-f1a685521c75', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('65bbcb88-f0f1-4973-8d76-ae9754ff10b3', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3f61f2ae-1ccc-4427-8631-53816cc05f6e', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('310cc12d-0f8d-4031-82b8-2325bd434986', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', '15def333-75dd-42fe-8090-551a6cfba141', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3f54106f-e4d3-4b54-8b21-858e0247eff5', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('54bc9734-c562-448d-86e3-dfb0802acb26', '82c1f543-9da6-49a0-8258-4751d22a3131', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('b23345ff-6841-4f85-8ff0-a8f4ef95e7ea', '82c1f543-9da6-49a0-8258-4751d22a3131', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e4910277-4d14-4929-8c7e-f20ab44cdc10', '82c1f543-9da6-49a0-8258-4751d22a3131', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('092239ba-1148-4d00-8612-cc329c0f3f63', '82c1f543-9da6-49a0-8258-4751d22a3131', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d3895657-942a-4358-86a1-bb620755556c', '82c1f543-9da6-49a0-8258-4751d22a3131', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('77ac58c8-95f7-43e4-8b2e-709e9aa67938', '82c1f543-9da6-49a0-8258-4751d22a3131', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('1351be24-632d-4f4e-8faa-60bd761e31f2', '82c1f543-9da6-49a0-8258-4751d22a3131', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('5b323b40-673d-49b9-8295-83aded718f45', '82c1f543-9da6-49a0-8258-4751d22a3131', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('49cb41f4-655d-4a8f-82bd-c80965d604fc', '82c1f543-9da6-49a0-8258-4751d22a3131', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('b5593fe7-c448-4931-873c-3b95f7dab28b', '82c1f543-9da6-49a0-8258-4751d22a3131', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('22a2f424-5ddf-42cc-8e73-41757936c0c2', '82c1f543-9da6-49a0-8258-4751d22a3131', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('9e5f953c-725b-41c2-8bf5-03647e06401e', '82c1f543-9da6-49a0-8258-4751d22a3131', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('b930c827-e013-4839-87c2-57b5db5c10de', 'a8702e42-06be-49fb-84f3-3282d550a77b', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('2bb48093-a42a-41de-8a53-c7f0eb4ef2c7', 'a8702e42-06be-49fb-84f3-3282d550a77b', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c05be359-3bba-4c1b-87b2-c148aaa91de6', 'a8702e42-06be-49fb-84f3-3282d550a77b', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3654dc92-c7ae-4996-8615-51c6a3bd16f3', 'a8702e42-06be-49fb-84f3-3282d550a77b', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e5b70d94-19e2-45fb-809f-ca12fa77e218', 'a8702e42-06be-49fb-84f3-3282d550a77b', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('dd27d0bf-c867-4db7-86aa-2cd4bc197103', 'a8702e42-06be-49fb-84f3-3282d550a77b', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c9f7eba9-6b1e-4c01-8d6e-a3fbd64b9d77', 'a8702e42-06be-49fb-84f3-3282d550a77b', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('462170aa-a6d2-4547-8992-f235e57435ca', 'a8702e42-06be-49fb-84f3-3282d550a77b', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('0024d436-7eda-4958-82b4-7d62b394c00a', 'a8702e42-06be-49fb-84f3-3282d550a77b', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d6dc7eed-0ab4-4962-8bc8-e2a553900194', 'a8702e42-06be-49fb-84f3-3282d550a77b', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('459dc409-d5f9-49a8-8659-10f539817e41', 'a8702e42-06be-49fb-84f3-3282d550a77b', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e5ab624f-6afa-48e5-8cb9-ce9cc5408ea9', 'a8702e42-06be-49fb-84f3-3282d550a77b', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c313831c-5570-4248-8b3d-b45494bc66da', '34744458-c0e4-45bc-8412-77db4afd0e80', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6b54af85-0220-41ed-85f3-0b226e162c31', '34744458-c0e4-45bc-8412-77db4afd0e80', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('74a5bb1d-4094-465d-8e3a-1829efacc292', '34744458-c0e4-45bc-8412-77db4afd0e80', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6464221f-fa5d-4aed-8167-52f463137735', '34744458-c0e4-45bc-8412-77db4afd0e80', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e76b50f9-66cc-45c8-813e-00d81cf093b3', '34744458-c0e4-45bc-8412-77db4afd0e80', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('30af62bb-b199-4d81-80a6-121f192df257', '34744458-c0e4-45bc-8412-77db4afd0e80', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6803d4ef-3942-4125-8764-db625a0a4638', '34744458-c0e4-45bc-8412-77db4afd0e80', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6bf55534-c703-41a8-80fe-82936e469452', '34744458-c0e4-45bc-8412-77db4afd0e80', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('18181d73-ca20-41fa-8594-01d8f8a0a85e', '34744458-c0e4-45bc-8412-77db4afd0e80', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('9b56f684-be14-4604-888e-5f2ba494a614', '34744458-c0e4-45bc-8412-77db4afd0e80', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('cc1bd134-7f39-40a0-8a5b-fce95bdad940', '34744458-c0e4-45bc-8412-77db4afd0e80', '15def333-75dd-42fe-8090-551a6cfba141', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c8436db4-5750-4b57-8325-c9f15c9f1cf3', '34744458-c0e4-45bc-8412-77db4afd0e80', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('9c9fe53c-dcea-4bad-87cd-7cae0f4702da', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e4b7c253-e328-4367-88c8-1f7565b57a92', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('1900e1d7-f9d4-4b6f-8115-cbb0d9c78564', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('cc3db4ba-0466-40fa-8369-2b364b194e4b', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('49da9cb4-abb7-4941-8b28-496e49094535', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e151181b-3d16-44fc-8f0a-45459a44eaa7', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('d9ee0d40-1ce0-4efc-864d-3243591177d6', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('ac04c89d-5cbd-41ac-86ce-1e6f8fee3edc', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('3e706531-5829-4210-829d-2a1e06363e6b', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c6eab45f-fe3d-49b2-849d-89870711c9e7', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('eb564196-7390-4e77-88c9-e4209e13df7a', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('35a95847-1b64-43a0-8eda-7f09a7239811', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('95e9219e-a807-4bbe-8960-6816d13f3c49', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '002a88bd-6dc8-4c9b-8cc0-d80f96a5081b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('da6e2780-59a4-4fda-8426-87df7bb2b099', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '34fa9bf4-2c67-4101-8c2c-2c6ab31f813e', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c10ec2f7-4429-425b-8736-25cffad89e94', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'e4f4b75c-64d4-4407-8512-ec1a59b6a385', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('e2aef06d-79be-499f-867c-3aa2ba1eaab6', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'd9b40f8c-b711-4bbe-82e9-c090db5171ef', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('03ec84ed-b5d2-4d18-844f-4dbeabb592df', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '93fc7aa0-1e03-4711-83b1-4ef20c2b1912', 'not_required', NULL, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4230db4a-5a96-4240-8c40-720dbe94af16', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'a70879fb-93ed-4c9e-8d6d-4d320ec51c60', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('4eb28de2-8f15-4fb5-8118-5c9106028c96', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '3c938d2e-a837-4d9c-82cb-2ca77095fe0b', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('c5ce8687-d5d4-4248-8edd-82b83f647cd8', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'fce459d5-e57e-4724-8758-9dc424f489ac', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('7f5134b2-a80e-43c5-8457-994936f487d2', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '36f92e9f-cd8e-408e-86d6-db42697844e3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('0c49289e-f80e-4e9a-8757-ad00305b887e', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '987f4c18-9acb-4b54-8873-76e7264ad4c3', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('0ccca6ae-1439-4335-84d2-27da63fd5156', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', '15def333-75dd-42fe-8090-551a6cfba141', 'complete', CURRENT_DATE, NULL);

INSERT INTO onboarding_records (id, employee_id, item_id, status, completed_date, notes)
VALUES ('6b54cab3-c606-4eae-811f-24bb4447f4be', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 'a0c44c83-1eb6-4314-8981-bcf73ad307eb', 'complete', CURRENT_DATE, NULL);

-- ============ EMPLOYEE REFERENCES ============
INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('488c0f69-f1e6-4569-8acd-7a881f324d7b', 'edafced0-e97f-49e5-89d5-b869c4555be2', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('f916e928-edbc-4c8b-86cd-29c23bb693e5', 'edafced0-e97f-49e5-89d5-b869c4555be2', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('48d5ce5a-fcb4-4375-89e4-b87beffb0e73', 'edafced0-e97f-49e5-89d5-b869c4555be2', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('190b8e02-1403-4f52-880c-6afbf6b27293', 'edafced0-e97f-49e5-89d5-b869c4555be2', 4, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('6e9835bb-d4d0-4820-886b-843ee963aef3', 'edafced0-e97f-49e5-89d5-b869c4555be2', 5, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('01916f66-0f35-44e9-8bfa-ee986ed78b62', 'edafced0-e97f-49e5-89d5-b869c4555be2', 6, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('9bf4897d-6caa-4413-87c6-55afb0907ad5', 'edafced0-e97f-49e5-89d5-b869c4555be2', 7, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('feeaca10-6201-4f20-8fd1-87e9c4dedd81', 'edafced0-e97f-49e5-89d5-b869c4555be2', 8, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('3f9b896e-3586-495d-84ce-27c36f09d98a', 'e8daa839-c39d-46b4-8337-343db962ad7c', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('97d9fd0c-3cca-4769-870a-27a42ef5e135', 'e8daa839-c39d-46b4-8337-343db962ad7c', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('8efdd9b4-33a6-4bb3-8f49-b0102adfa604', 'e8daa839-c39d-46b4-8337-343db962ad7c', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('b7a0407b-6127-4085-8316-30d1abd1ffb7', 'e8daa839-c39d-46b4-8337-343db962ad7c', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('aff6aa3a-3daa-431a-8e66-8da7cbd38476', 'e8daa839-c39d-46b4-8337-343db962ad7c', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('1c6f7f91-9dde-42b4-8053-29f222c21e41', 'e8daa839-c39d-46b4-8337-343db962ad7c', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('18407ad7-20bc-41e0-85ba-3d5e679662e8', 'e8daa839-c39d-46b4-8337-343db962ad7c', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('bac9348c-7183-47b6-829c-3b4ae6f74ef6', 'e8daa839-c39d-46b4-8337-343db962ad7c', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('975d2482-96c0-438a-81b0-290da870caae', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('a717631f-18b9-4b05-8a5e-ef667ce0272c', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('9e82483c-546c-430c-87e9-435d86553aa1', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('6b971717-c42f-4a34-8fe2-66bf87d4e290', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 4, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('392f9e04-4bc5-4f7c-812f-61e217ee9de9', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 5, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('04a1cd88-7653-45f4-8513-2bb697a8ecf2', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 6, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('c65b0671-3fe2-4b2c-827b-03462b72b14a', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 7, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('dd8c97f0-007b-48b9-8538-422a02d5ed55', 'b5fdee49-0304-4dca-8f4f-5dbc5cbc27e9', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('26c184d8-c3bc-4dcc-88ac-f00b83a8f6dc', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('55f4f3a5-7a43-4a77-8d72-b0c509be707b', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('d4af4101-599c-4d61-8a16-a9c23c0ba56a', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('50dead4d-3ea4-4ae2-8a13-be750aa933de', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('6e4bb48c-ab5f-42fe-8ce6-e7c8e79c5df8', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('7d11ca7a-2947-4251-889f-c0f6b38b439c', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('c2f9d642-6039-4174-8979-b98f6571bc56', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('7dd97b86-2428-46e2-8ec5-91f7f8175180', '09b12c41-2d70-4a58-8ac6-f75d59548ff4', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('9c8b08e3-2dc5-48de-80b1-843641933bfb', '6f108089-ca79-4593-855c-62969dac8742', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('3326544a-2387-4fd1-8da5-c524f67b103d', '6f108089-ca79-4593-855c-62969dac8742', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('7befb1a7-3ba4-4482-81bd-44ce53d5a47f', '6f108089-ca79-4593-855c-62969dac8742', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('964bec7a-9078-4011-88d5-43cf6fa37422', '6f108089-ca79-4593-855c-62969dac8742', 4, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('443de0dc-3590-47bc-8b79-ba8b82c9e1a0', '6f108089-ca79-4593-855c-62969dac8742', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('adc5d34c-3938-4e08-8813-36bed744d2ad', '6f108089-ca79-4593-855c-62969dac8742', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('0719edf6-89ff-41ff-8919-2388a8c30e9f', '6f108089-ca79-4593-855c-62969dac8742', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('0b0d9ccf-3248-4506-8b81-3b608d711879', '6f108089-ca79-4593-855c-62969dac8742', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('a9035ea8-0d75-4371-8012-7887e240482d', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('f4e8c8ab-4127-4a96-8fca-172a4991fd19', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('f8161351-8460-4c26-8d3a-dee9261c416e', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 3, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('51b2fa2d-7b46-4e86-85c7-8b6a3e3a6936', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('dd3a0b2f-06d3-4fef-82a7-460ce953b47a', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('0e1d1713-45de-41e6-8ed7-7802cbe34dd4', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('ca821033-7cad-4f0f-81ee-a3c79c14bff8', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('ab3caf46-701a-43d2-8852-6a4483f06773', '2128ab55-e3e8-4068-8b5f-e0c84d9323fb', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('18cddea7-8dd2-4df3-846e-1b20b0fadedf', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('c1ad29e3-4709-4736-8228-8be9e2a5c11d', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('69707928-2b53-492a-836f-2a1bb61d883b', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('2ef09ce2-5b3c-4392-86dc-4ebc332deaa2', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('b2a3d0d0-aaec-4f8e-85fb-af207f152ac1', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('bb82a849-499c-48ec-82c2-83160f6ad501', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('13f3e7db-db3b-4b00-8b3a-9084a5ceb8ce', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('60b34d01-c182-46b8-8e71-dbabc1ec916a', '9bb6eedd-f03f-4490-8cd9-feef55aa328b', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('70ceb5fd-3728-4a16-8622-ecce6e87f6b4', '82c1f543-9da6-49a0-8258-4751d22a3131', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('a643f770-602a-40f1-81ea-b5447dc803e9', '82c1f543-9da6-49a0-8258-4751d22a3131', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('1b6c4b30-dd3b-44ff-8646-804a288d3805', '82c1f543-9da6-49a0-8258-4751d22a3131', 3, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('6a03b727-af90-4ccf-8d0a-3f7e6692c163', '82c1f543-9da6-49a0-8258-4751d22a3131', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('c42a138a-55dd-4f6e-8014-5210788c75e6', '82c1f543-9da6-49a0-8258-4751d22a3131', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('33e4b9a7-c5bc-44b1-8ea9-53080384a2ab', '82c1f543-9da6-49a0-8258-4751d22a3131', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('0a02a29f-4e23-474a-8222-3a8d49dfaaf7', '82c1f543-9da6-49a0-8258-4751d22a3131', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('73301793-d1d1-4941-8756-ea2283c474c7', '82c1f543-9da6-49a0-8258-4751d22a3131', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('137eb72a-6bf1-49fd-84b5-7f18a40e5dd9', 'a8702e42-06be-49fb-84f3-3282d550a77b', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('fbe5b6b7-7833-4deb-8061-2686030a0906', 'a8702e42-06be-49fb-84f3-3282d550a77b', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('fa4dff10-f70d-41ee-8ecc-41f8656487aa', 'a8702e42-06be-49fb-84f3-3282d550a77b', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('7d23d221-bace-4b5d-89ed-7f660a6f003f', 'a8702e42-06be-49fb-84f3-3282d550a77b', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('d721cf87-322d-4d5c-8db4-f7ee04b1d3e8', 'a8702e42-06be-49fb-84f3-3282d550a77b', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('0ecafd58-c1a0-4c9e-889c-ff8b6f48a152', 'a8702e42-06be-49fb-84f3-3282d550a77b', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('37740553-43af-4f04-837f-e958e4e2dbc2', 'a8702e42-06be-49fb-84f3-3282d550a77b', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('c8c857d9-2dc1-41f6-8d56-b881fcae432c', 'a8702e42-06be-49fb-84f3-3282d550a77b', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('1ee3b529-1eb9-4f7d-8d71-97be998b927f', '34744458-c0e4-45bc-8412-77db4afd0e80', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('b52145f8-94aa-4a0f-8ac4-012c40afc7a4', '34744458-c0e4-45bc-8412-77db4afd0e80', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('3c530bf7-b06b-4f45-8c25-e8bd03fe77bd', '34744458-c0e4-45bc-8412-77db4afd0e80', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('9509a154-c4d9-4aa3-8020-be2322d665a2', '34744458-c0e4-45bc-8412-77db4afd0e80', 4, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('bd381c10-a410-44c5-8551-e28598ab163c', '34744458-c0e4-45bc-8412-77db4afd0e80', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('43ccc708-c4f3-4fdb-8c09-db9ac1e92532', '34744458-c0e4-45bc-8412-77db4afd0e80', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('e40b1071-82a1-46ef-8351-cc85be733bad', '34744458-c0e4-45bc-8412-77db4afd0e80', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('6e0ad9d1-f521-4b8b-83c5-01fcee38eab9', '34744458-c0e4-45bc-8412-77db4afd0e80', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('5c03eff5-6a6b-47ef-897b-22220716f8a1', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 1, true, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('cef596e1-6c16-4f98-8ad6-f44982c2a965', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 2, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('da7a8e8c-df7e-4887-80fa-33a54233e4f2', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 3, true, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('be18615b-0b21-4891-89da-6a375efb2ffb', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('80a40252-1c02-4b66-81de-e3eee262e97e', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('d9e38170-fed1-41b5-8e6d-e253d8f5304d', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('8f95bfa1-af84-4a8c-870c-2651741a725c', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('5fcbacdd-cf97-4343-8e82-9ee2d5ae670a', '689da3b7-d536-4cac-87d6-5a8dd1fde9d6', 8, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('52e06ffa-3d9a-4795-8d95-e11595c1945a', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 1, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('99be8d22-c96b-4e61-8e6d-4fc7022546d1', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 2, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('33838047-0f92-4200-8882-09ab0a9e0435', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 3, true, true);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('40761b3a-0cad-49f5-8643-9a8d5c1a4442', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 4, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('dc096bbf-06da-49bc-87a6-175106e4fa30', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 5, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('946fb61f-6fa7-4712-88a4-f501716a79a7', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 6, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('e0e30c02-62d3-48e1-8443-bf69aba41045', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 7, false, false);

INSERT INTO employee_references (id, employee_id, reference_number, received, verbal_ref)
VALUES ('1f65ff3e-6020-47e4-854b-5512619f9014', '7e1470cd-6ed6-49ba-8d12-028b8e9d304c', 8, false, false);

COMMIT;

-- Summary: 12 employees, 38 courses, 255 training records