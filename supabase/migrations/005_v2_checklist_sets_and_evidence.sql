-- ============================================================
-- Migration 005: V2 Checklist Sets + Evidence System
--
-- Adds:
--   1. checklist_sets        – parent grouping (training | application)
--   2. user_checklist_sets   – user activation of sets
--   3. evidence_items        – reusable user-owned evidence
--   4. evidence_files        – files attached to evidence items
--   5. evidence_links        – many-to-many evidence ↔ portfolio_items
--   6. checklist_set_id FK on checklist_templates
--   7. Backfill existing training specialties
--   8. Seed IMT Application checklist
-- ============================================================

-- 1. checklist_sets
CREATE TABLE IF NOT EXISTS checklist_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('training', 'application')),
  specialty   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, specialty)
);

ALTER TABLE checklist_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read checklist_sets"
  ON checklist_sets FOR SELECT
  TO authenticated
  USING (true);

-- 2. Add checklist_set_id to checklist_templates (nullable for backward compat)
ALTER TABLE checklist_templates
  ADD COLUMN IF NOT EXISTS checklist_set_id UUID REFERENCES checklist_sets(id);

-- 3. user_checklist_sets
CREATE TABLE IF NOT EXISTS user_checklist_sets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checklist_set_id UUID NOT NULL REFERENCES checklist_sets(id) ON DELETE CASCADE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at      TIMESTAMPTZ,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, checklist_set_id)
);

ALTER TABLE user_checklist_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user_checklist_sets"
  ON user_checklist_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_checklist_sets"
  ON user_checklist_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_checklist_sets"
  ON user_checklist_sets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_checklist_sets"
  ON user_checklist_sets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. evidence_items
CREATE TABLE IF NOT EXISTS evidence_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  evidence_date DATE,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own evidence_items"
  ON evidence_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence_items"
  ON evidence_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evidence_items"
  ON evidence_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence_items"
  ON evidence_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. evidence_files
CREATE TABLE IF NOT EXISTS evidence_files (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  file_path        TEXT NOT NULL,
  file_size        INTEGER NOT NULL DEFAULT 0,
  mime_type        TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own evidence_files"
  ON evidence_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence_files"
  ON evidence_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence_files"
  ON evidence_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. evidence_links (many-to-many: evidence_item ↔ portfolio_item)
CREATE TABLE IF NOT EXISTS evidence_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evidence_item_id, portfolio_item_id)
);

ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;

-- RLS: user must own the portfolio_item
CREATE POLICY "Users can read own evidence_links"
  ON evidence_links FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = evidence_links.portfolio_item_id
        AND pi.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own evidence_links"
  ON evidence_links FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = evidence_links.portfolio_item_id
        AND pi.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own evidence_links"
  ON evidence_links FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_items pi
      WHERE pi.id = evidence_links.portfolio_item_id
        AND pi.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Backfill existing training specialties into checklist_sets
-- ============================================================

INSERT INTO checklist_sets (kind, specialty, name, sort_order) VALUES
  ('training', 'Foundation',    'Foundation Training',    1),
  ('training', 'IMT',           'IMT Training',           2),
  ('training', 'Ophthalmology', 'Ophthalmology Training', 3)
ON CONFLICT (kind, specialty) DO NOTHING;

-- Link existing templates to their training sets
UPDATE checklist_templates ct
SET checklist_set_id = cs.id
FROM checklist_sets cs
WHERE cs.kind = 'training'
  AND cs.specialty = ct.specialty
  AND ct.checklist_set_id IS NULL;

-- ============================================================
-- 8. Seed IMT Application checklist
-- ============================================================

INSERT INTO checklist_sets (kind, specialty, name, description, sort_order) VALUES
  ('application', 'IMT', 'IMT Application',
   'Track your readiness for Internal Medicine Training applications. Covers all key domains assessed in the IMT recruitment process.',
   10)
ON CONFLICT (kind, specialty) DO NOTHING;

-- Seed application checklist templates
-- Using a DO block to reference the checklist_set_id
DO $$
DECLARE
  v_set_id UUID;
BEGIN
  SELECT id INTO v_set_id FROM checklist_sets WHERE kind = 'application' AND specialty = 'IMT';

  IF v_set_id IS NULL THEN
    RAISE EXCEPTION 'IMT Application checklist_set not found';
  END IF;

  -- Commitment to Specialty
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Commitment to Specialty', 'Taster days or specialty experience', 'Evidence of attending taster days, specialty clinics, or shadowing in internal medicine or related specialties.', 1, false, 100, '{"evidence_hint": "Certificate of attendance, reflective log, or supervisor confirmation"}'),
    (v_set_id, 'IMT', 'Application', 'Commitment to Specialty', 'Medical society or specialty group membership', 'Active membership of relevant medical societies (e.g. RCP, BMA, specialty associations).', 1, false, 101, '{"evidence_hint": "Membership confirmation or certificate"}'),
    (v_set_id, 'IMT', 'Application', 'Commitment to Specialty', 'Attendance at specialty conferences or courses', 'Attendance at conferences, study days, or courses relevant to internal medicine.', 1, false, 102, '{"evidence_hint": "Certificate of attendance, programme, or CPD log"}'),
    (v_set_id, 'IMT', 'Application', 'Commitment to Specialty', 'Reflective practice on career choice', 'Written reflection on why you are pursuing internal medicine and how your experiences have confirmed this choice.', 1, false, 103, '{"evidence_hint": "Written reflection or portfolio entry"}');

  -- Teaching Experience
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Teaching Experience', 'Formal teaching sessions delivered', 'Evidence of planning and delivering teaching sessions to peers, medical students, or other healthcare professionals.', 3, false, 200, '{"evidence_hint": "Teaching evaluation forms, feedback, or attendance records"}'),
    (v_set_id, 'IMT', 'Application', 'Teaching Experience', 'Teaching feedback collected and reflected upon', 'Collected feedback from teaching sessions with evidence of reflection and improvement.', 1, false, 201, '{"evidence_hint": "Feedback forms, summary of feedback, reflective entry"}'),
    (v_set_id, 'IMT', 'Application', 'Teaching Experience', 'Teaching qualification or course', 'Completion of a teaching course or qualification (e.g. Teaching the Teachers, PGCert in Medical Education).', 1, false, 202, '{"evidence_hint": "Course certificate or transcript"}');

  -- Quality Improvement & Audit
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Quality Improvement & Audit', 'Completed audit cycle (with re-audit)', 'Full audit cycle including data collection, analysis, intervention, and re-audit demonstrating improvement.', 1, true, 300, '{"evidence_hint": "Audit report, presentation slides, or poster"}'),
    (v_set_id, 'IMT', 'Application', 'Quality Improvement & Audit', 'Quality improvement project', 'Involvement in a QI project with measurable outcomes and evidence of impact.', 1, false, 301, '{"evidence_hint": "QI project report, poster, or presentation"}'),
    (v_set_id, 'IMT', 'Application', 'Quality Improvement & Audit', 'Audit or QI presentation', 'Presentation of audit or QI findings at a local, regional, or national meeting.', 1, false, 302, '{"evidence_hint": "Presentation slides, abstract, or programme listing"}');

  -- Leadership & Management
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Leadership & Management', 'Leadership role held', 'Evidence of holding a leadership or management role (e.g. mess president, committee member, rota coordinator, departmental representative).', 1, false, 400, '{"evidence_hint": "Letter confirming role, minutes of meetings, or reflective account"}'),
    (v_set_id, 'IMT', 'Application', 'Leadership & Management', 'Management or leadership course', 'Completion of a leadership or management course or programme.', 1, false, 401, '{"evidence_hint": "Course certificate or completion evidence"}'),
    (v_set_id, 'IMT', 'Application', 'Leadership & Management', 'Evidence of team working and collaboration', 'Demonstrated effective teamwork in a clinical or non-clinical setting with reflection.', 1, false, 402, '{"evidence_hint": "Reflective account, MSF feedback, or supervisor comments"}');

  -- Research & Publications
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Research & Publications', 'PubMed-indexed publication', 'First author or co-author on a PubMed-indexed publication.', 1, false, 500, '{"evidence_hint": "Publication citation, DOI, or PubMed link"}'),
    (v_set_id, 'IMT', 'Application', 'Research & Publications', 'Research project involvement', 'Active involvement in a research project (not necessarily published) with evidence of your contribution.', 1, false, 501, '{"evidence_hint": "Research protocol, ethics approval, PI confirmation letter"}'),
    (v_set_id, 'IMT', 'Application', 'Research & Publications', 'Poster or oral presentation at conference', 'Presentation of research findings as a poster or oral presentation at a conference.', 1, false, 502, '{"evidence_hint": "Abstract acceptance, conference programme, or presentation certificate"}');

  -- Presentations
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Presentations', 'Local or departmental presentation', 'Presentation at a local, departmental, or trust-level meeting.', 1, false, 600, '{"evidence_hint": "Presentation slides, meeting minutes, or attendance confirmation"}'),
    (v_set_id, 'IMT', 'Application', 'Presentations', 'Regional or national presentation', 'Presentation at a regional or national meeting or conference.', 1, false, 601, '{"evidence_hint": "Conference programme, abstract, or presentation certificate"}'),
    (v_set_id, 'IMT', 'Application', 'Presentations', 'Grand round or case presentation', 'Delivery of a grand round, interesting case presentation, or journal club.', 1, false, 602, '{"evidence_hint": "Meeting agenda, presentation slides, or confirmation from organiser"}');

  -- Courses & Qualifications
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Courses & Qualifications', 'ALS or equivalent life support course', 'Valid Advanced Life Support (ALS) certification or equivalent.', 1, true, 700, '{"evidence_hint": "ALS certificate (must be in date)"}'),
    (v_set_id, 'IMT', 'Application', 'Courses & Qualifications', 'MRCP Part 1 passed', 'Evidence of passing MRCP Part 1 examination.', 1, false, 701, '{"evidence_hint": "Exam result letter or MRCP online account screenshot"}'),
    (v_set_id, 'IMT', 'Application', 'Courses & Qualifications', 'MRCP Part 2 written passed', 'Evidence of passing MRCP Part 2 Written examination.', 1, false, 702, '{"evidence_hint": "Exam result letter or MRCP online account screenshot"}'),
    (v_set_id, 'IMT', 'Application', 'Courses & Qualifications', 'PACES passed', 'Evidence of passing MRCP PACES examination.', 1, false, 703, '{"evidence_hint": "Exam result letter or MRCP online account screenshot"}'),
    (v_set_id, 'IMT', 'Application', 'Courses & Qualifications', 'Additional relevant courses', 'Other courses relevant to IMT (e.g. ultrasound, simulation, communication skills).', 1, false, 704, '{"evidence_hint": "Course certificates"}');

  -- Supporting Documents
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Supporting Documents', 'Updated CV', 'Current, well-formatted medical CV.', 1, true, 800, '{"evidence_hint": "PDF of your latest CV"}'),
    (v_set_id, 'IMT', 'Application', 'Supporting Documents', 'GMC registration confirmed', 'Full GMC registration (or evidence of application).', 1, true, 801, '{"evidence_hint": "GMC certificate or online registration screenshot"}'),
    (v_set_id, 'IMT', 'Application', 'Supporting Documents', 'Right to work documentation', 'Evidence of right to work in the UK (passport, visa, settled status).', 1, true, 802, '{"evidence_hint": "Passport scan, visa, or share code"}'),
    (v_set_id, 'IMT', 'Application', 'Supporting Documents', 'References arranged', 'At least two clinical referees confirmed and briefed.', 1, true, 803, '{"evidence_hint": "Names and contact details of confirmed referees"}');

  -- Additional Achievements
  INSERT INTO checklist_templates (checklist_set_id, specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order, metadata) VALUES
    (v_set_id, 'IMT', 'Application', 'Additional Achievements', 'Prize or award', 'Evidence of receiving a prize, award, or distinction during training.', 1, false, 900, '{"evidence_hint": "Award certificate or letter of confirmation"}'),
    (v_set_id, 'IMT', 'Application', 'Additional Achievements', 'Voluntary or extracurricular contribution', 'Involvement in voluntary work, charity work, or extracurricular activities relevant to medicine.', 1, false, 901, '{"evidence_hint": "Confirmation letter, certificate, or reflective account"}'),
    (v_set_id, 'IMT', 'Application', 'Additional Achievements', 'Additional degree, diploma, or certification', 'Evidence of additional qualifications beyond primary medical degree (e.g. intercalated BSc, MSc, PGDip).', 1, false, 902, '{"evidence_hint": "Degree certificate or transcript"}');

END $$;
