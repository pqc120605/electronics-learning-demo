CREATE TABLE machmo_community.classrooms (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  join_code text NOT NULL UNIQUE CHECK (join_code ~ '^[A-Za-z0-9_-]{12}$'),
  kit jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX classrooms_by_owner ON machmo_community.classrooms (owner_id);
CREATE TABLE machmo_community.classroom_members (
  class_id uuid NOT NULL REFERENCES machmo_community.classrooms(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES machmo_community.accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, account_id)
);
CREATE INDEX classroom_members_by_account ON machmo_community.classroom_members (account_id);
CREATE TABLE machmo_community.classroom_assignments (
  id uuid PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES machmo_community.classrooms(id) ON DELETE CASCADE,
  lesson_id text NOT NULL CHECK (lesson_id ~ '^[a-z0-9-]{1,64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, lesson_id),
  UNIQUE (id,class_id)
);
CREATE TABLE machmo_community.classroom_submissions (
  assignment_id uuid NOT NULL,
  class_id uuid NOT NULL,
  account_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES machmo_community.saved_projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (assignment_id,class_id) REFERENCES machmo_community.classroom_assignments(id,class_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id,account_id) REFERENCES machmo_community.classroom_members(class_id,account_id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id,account_id,project_id)
);
CREATE INDEX classroom_submissions_by_project ON machmo_community.classroom_submissions (project_id);
GRANT SELECT, INSERT ON machmo_community.classrooms, machmo_community.classroom_members,
  machmo_community.classroom_assignments, machmo_community.classroom_submissions TO machmo_api_stg_app;
