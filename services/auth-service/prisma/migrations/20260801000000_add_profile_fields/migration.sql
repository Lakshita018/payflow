-- AlterTable: add profile + preferences columns to users
ALTER TABLE "users"
  ADD COLUMN "displayName"        TEXT,
  ADD COLUMN "phone"              TEXT,
  ADD COLUMN "avatarUrl"          TEXT,
  ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pushNotifications"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "themePreference"    TEXT    NOT NULL DEFAULT 'system';
