-- WARNING: Destructive. Backup your database before running.
-- This script deletes all student-related data and user accounts with role HOC_SINH.
-- Run with appropriate DB user and permissions.

SET FOREIGN_KEY_CHECKS=0;

-- remove parent-student links
DELETE FROM phu_huynh_hoc_sinh WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);

-- remove score audit logs and scores
DELETE FROM diem_audit_log WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);
DELETE FROM diem WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);

-- remove notifications, sms logs, ai suggestions referencing students
DELETE FROM thong_bao WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);
DELETE FROM sms_log WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);
DELETE FROM ai_suggestions WHERE hoc_sinh_id IN (SELECT id FROM hoc_sinh);

-- remove remaining references (if any)
-- Add additional DELETE statements here if your DB has more tables referencing hoc_sinh

-- delete students
DELETE FROM hoc_sinh;

-- delete user accounts that are students (RoleEnum: HOC_SINH)
DELETE FROM users WHERE role = 'HOC_SINH';

SET FOREIGN_KEY_CHECKS=1;

-- Note: This script assumes table names from the project's schema. Review before running.
