-- V4: Add must_change_password column to users table
-- This flag indicates that the user must change their password on next login

ALTER TABLE `users`
  ADD COLUMN `must_change_password` BIT(1) NOT NULL DEFAULT 0
  AFTER `is_active`;
