-- ============================================================
-- Migration 006: Medical Student Portfolio
--
-- Adds:
--   1. medical_student_entries – free-form activity log for
--      medical students (QIPs/audits, research/publications,
--      teaching, prizes/awards, commitment to specialty)
-- ============================================================

CREATE TABLE IF NOT EXISTS medical_student_entries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category          TEXT        NOT NULL CHECK (category IN (
                                  'qip_audit',
                                  'research_publication',
                                  'teaching',
                                  'prize_award',
                                  'commitment_specialty'
                                )),
  template_type     TEXT        NOT NULL,
  year_of_training  INTEGER     CHECK (year_of_training BETWEEN 1 AND 7),
  title             TEXT        NOT NULL,
  data              JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE medical_student_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medical_student_entries"
  ON medical_student_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical_student_entries"
  ON medical_student_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical_student_entries"
  ON medical_student_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical_student_entries"
  ON medical_student_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS medical_student_entries_user_category_idx
  ON medical_student_entries (user_id, category);
