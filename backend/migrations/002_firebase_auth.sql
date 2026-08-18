-- Firebase owns user credentials. The local record keeps only SyncSpace data
-- such as role, profile fields, and relationships to tasks/workspaces.
ALTER TABLE app_users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_firebase_uid
  ON app_users(firebase_uid)
  WHERE firebase_uid IS NOT NULL;
