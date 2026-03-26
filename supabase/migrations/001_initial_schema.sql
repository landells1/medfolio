-- MedFolio Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE training_stage AS ENUM (
  'FY1', 'FY2', 'F3',
  'CT1', 'CT2',
  'IMT1', 'IMT2', 'IMT3',
  'ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST8',
  'SAS', 'Consultant', 'GP_Trainee', 'Other'
);

CREATE TYPE item_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE case_complexity AS ENUM ('routine', 'moderate', 'complex', 'rare');

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  training_stage training_stage DEFAULT 'FY1',
  primary_specialty TEXT DEFAULT '',
  secondary_specialties TEXT[] DEFAULT '{}',
  region TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- CHECKLIST TEMPLATES (specialty requirements)
-- ============================================

CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty TEXT NOT NULL,
  training_year TEXT NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_count INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PORTFOLIO ITEMS (user's tracked items)
-- ============================================

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES checklist_templates(id),
  specialty TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status item_status NOT NULL DEFAULT 'not_started',
  current_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 1,
  date_completed DATE,
  notes TEXT DEFAULT '',
  evidence_urls TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_specialty ON portfolio_items(user_id, specialty);

-- ============================================
-- CASES (interesting cases journal)
-- ============================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  specialty_tags TEXT[] DEFAULT '{}',
  presenting_complaint TEXT DEFAULT '',
  key_findings TEXT DEFAULT '',
  diagnosis TEXT DEFAULT '',
  management TEXT DEFAULT '',
  outcome TEXT DEFAULT '',
  learning_points TEXT DEFAULT '',
  reflection TEXT DEFAULT '',
  complexity case_complexity DEFAULT 'routine',
  custom_tags TEXT[] DEFAULT '{}',
  is_anonymised_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_user ON cases(user_id);
CREATE INDEX idx_cases_date ON cases(user_id, date_seen DESC);

-- ============================================
-- FILE UPLOADS
-- ============================================

CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_item_id UUID REFERENCES portfolio_items(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_user ON uploads(user_id);

-- ============================================
-- REMINDERS
-- ============================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_user ON reminders(user_id, due_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Portfolio items: users can only CRUD their own
CREATE POLICY "Users can view own portfolio items"
  ON portfolio_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio items"
  ON portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio items"
  ON portfolio_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolio items"
  ON portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- Cases: users can only CRUD their own
CREATE POLICY "Users can view own cases"
  ON cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cases"
  ON cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases"
  ON cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases"
  ON cases FOR DELETE USING (auth.uid() = user_id);

-- Uploads: users can only CRUD their own
CREATE POLICY "Users can view own uploads"
  ON uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads"
  ON uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own uploads"
  ON uploads FOR DELETE USING (auth.uid() = user_id);

-- Reminders: users can only CRUD their own
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE USING (auth.uid() = user_id);

-- Checklist templates: readable by all authenticated users
CREATE POLICY "Authenticated users can view templates"
  ON checklist_templates FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('evidence', 'evidence', false, 10485760); -- 10MB limit

-- Storage policies: users can only access their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED: CHECKLIST TEMPLATES
-- ============================================

-- FOUNDATION FY1
INSERT INTO checklist_templates (specialty, training_year, category, item_name, description, target_count, is_mandatory, sort_order) VALUES
('Foundation', 'FY1', 'Workplace Based Assessments', 'Mini-CEX', 'Mini Clinical Evaluation Exercise — observed clinical encounters', 6, true, 1),
('Foundation', 'FY1', 'Workplace Based Assessments', 'CBD', 'Case-Based Discussion — structured discussion of clinical cases', 6, true, 2),
('Foundation', 'FY1', 'Workplace Based Assessments', 'DOPS', 'Direct Observation of Procedural Skills', 4, true, 3),
('Foundation', 'FY1', 'Workplace Based Assessments', 'LEARN Form', 'Learning from Events for Advancement and Reflection Notes', 2, true, 4),
('Foundation', 'FY1', 'Multi-Source Feedback', 'TAB', 'Team Assessment of Behaviour — 360° feedback from colleagues', 1, true, 5),
('Foundation', 'FY1', 'Supervisor Reports', 'Clinical Supervisor Report', 'End-of-placement report from clinical supervisor', 3, true, 6),
('Foundation', 'FY1', 'Supervisor Reports', 'Educational Supervisor Report', 'End-of-year report from educational supervisor', 1, true, 7),
('Foundation', 'FY1', 'Mandatory Training', 'PSA', 'Prescribing Safety Assessment — must pass in FY1', 1, true, 8),
('Foundation', 'FY1', 'Mandatory Training', 'ALS/ILS Certification', 'Advanced or Intermediate Life Support', 1, false, 9),
('Foundation', 'FY1', 'Professional Development', 'Personal Development Plan', 'Learning objectives for each placement', 3, true, 10),
('Foundation', 'FY1', 'Professional Development', 'Reflections', 'Reflective entries on clinical experiences', 6, true, 11),
('Foundation', 'FY1', 'Quality Improvement', 'Audit / QI Project', 'Quality improvement or audit project participation', 1, true, 12),
('Foundation', 'FY1', 'Teaching', 'Teaching Evidence', 'Evidence of teaching activity (formal or informal)', 2, false, 13),

-- FOUNDATION FY2
('Foundation', 'FY2', 'Workplace Based Assessments', 'Mini-CEX', 'Mini Clinical Evaluation Exercise — observed clinical encounters', 6, true, 1),
('Foundation', 'FY2', 'Workplace Based Assessments', 'CBD', 'Case-Based Discussion — structured discussion of clinical cases', 6, true, 2),
('Foundation', 'FY2', 'Workplace Based Assessments', 'DOPS', 'Direct Observation of Procedural Skills', 4, true, 3),
('Foundation', 'FY2', 'Workplace Based Assessments', 'LEARN Form', 'Learning from Events for Advancement and Reflection Notes', 2, true, 4),
('Foundation', 'FY2', 'Multi-Source Feedback', 'TAB', 'Team Assessment of Behaviour — 360° feedback', 1, true, 5),
('Foundation', 'FY2', 'Supervisor Reports', 'Clinical Supervisor Report', 'End-of-placement report from clinical supervisor', 3, true, 6),
('Foundation', 'FY2', 'Supervisor Reports', 'Educational Supervisor Report', 'End-of-year report from educational supervisor', 1, true, 7),
('Foundation', 'FY2', 'Professional Development', 'Personal Development Plan', 'Learning objectives for each placement', 3, true, 8),
('Foundation', 'FY2', 'Professional Development', 'Reflections', 'Reflective entries on clinical experiences', 6, true, 9),
('Foundation', 'FY2', 'Quality Improvement', 'Audit / QI Project', 'Quality improvement or audit project', 1, true, 10),
('Foundation', 'FY2', 'Teaching', 'Teaching Evidence', 'Evidence of teaching activity', 2, false, 11),
('Foundation', 'FY2', 'Career Planning', 'Form R', 'Annual self-declaration form', 1, true, 12),

-- IMT (Internal Medicine Training) — Year 1
('IMT', 'IMT1', 'Workplace Based Assessments', 'Mini-CEX', 'Mini Clinical Evaluation Exercise', 8, true, 1),
('IMT', 'IMT1', 'Workplace Based Assessments', 'CBD', 'Case-Based Discussion', 4, true, 2),
('IMT', 'IMT1', 'Workplace Based Assessments', 'ACAT', 'Acute Care Assessment Tool — consultant-led acute take', 4, true, 3),
('IMT', 'IMT1', 'Workplace Based Assessments', 'DOPS', 'Direct Observation of Procedural Skills', 4, true, 4),
('IMT', 'IMT1', 'Multi-Source Feedback', 'MSF', 'Multi-Source Feedback — minimum 12 respondents', 1, true, 5),
('IMT', 'IMT1', 'Supervisor Reports', 'Multiple Consultant Report', 'Report from supervising consultants (need 4 different)', 4, true, 6),
('IMT', 'IMT1', 'Supervisor Reports', 'Educational Supervisor Report', 'Annual educational supervisor report', 1, true, 7),
('IMT', 'IMT1', 'Examinations', 'MRCP Part 1', 'Membership of Royal College of Physicians Part 1', 1, true, 8),
('IMT', 'IMT1', 'Quality Improvement', 'QIP with QIPAT', 'Quality Improvement Project with QI assessment tool', 1, true, 9),
('IMT', 'IMT1', 'Professional Development', 'Reflections', 'Reflective practice entries', 6, true, 10),
('IMT', 'IMT1', 'Teaching', 'Teaching Evidence', 'Evidence of teaching with feedback', 2, true, 11),
('IMT', 'IMT1', 'Procedures', 'Lumbar Puncture', 'Competence in lumbar puncture', 1, false, 12),
('IMT', 'IMT1', 'Procedures', 'Ascitic Tap / Drain', 'Competence in ascitic drainage', 1, false, 13),
('IMT', 'IMT1', 'Procedures', 'Pleural Tap / Drain', 'Competence in pleural aspiration/drainage', 1, false, 14),
('IMT', 'IMT1', 'Procedures', 'NG Tube Insertion', 'Competence in nasogastric tube insertion', 1, false, 15),
('IMT', 'IMT1', 'Career Planning', 'Form R', 'Annual self-declaration form', 1, true, 16),

-- IMT Year 2
('IMT', 'IMT2', 'Workplace Based Assessments', 'Mini-CEX', 'Mini Clinical Evaluation Exercise', 8, true, 1),
('IMT', 'IMT2', 'Workplace Based Assessments', 'CBD', 'Case-Based Discussion', 4, true, 2),
('IMT', 'IMT2', 'Workplace Based Assessments', 'ACAT', 'Acute Care Assessment Tool', 4, true, 3),
('IMT', 'IMT2', 'Workplace Based Assessments', 'DOPS', 'Direct Observation of Procedural Skills', 4, true, 4),
('IMT', 'IMT2', 'Multi-Source Feedback', 'MSF', 'Multi-Source Feedback — minimum 12 respondents', 1, true, 5),
('IMT', 'IMT2', 'Supervisor Reports', 'Multiple Consultant Report', 'Reports from supervising consultants', 4, true, 6),
('IMT', 'IMT2', 'Examinations', 'MRCP Part 2 Written', 'MRCP Part 2 written examination', 1, true, 7),
('IMT', 'IMT2', 'Examinations', 'MRCP PACES', 'Practical Assessment of Clinical Examination Skills', 1, true, 8),
('IMT', 'IMT2', 'Quality Improvement', 'QIP with QIPAT', 'Quality Improvement Project — may continue from IMT1', 1, true, 9),
('IMT', 'IMT2', 'Professional Development', 'Reflections', 'Reflective practice entries', 6, true, 10),
('IMT', 'IMT2', 'Teaching', 'Teaching Evidence', 'Evidence of teaching with feedback', 2, true, 11),
('IMT', 'IMT2', 'Career Planning', 'Form R', 'Annual self-declaration form', 1, true, 12),

-- OPHTHALMOLOGY ST1 (placeholder — user to verify exact scoring)
('Ophthalmology', 'ST1', 'Workplace Based Assessments', 'Mini-CEX', 'Mini Clinical Evaluation Exercise', 6, true, 1),
('Ophthalmology', 'ST1', 'Workplace Based Assessments', 'CBD', 'Case-Based Discussion', 4, true, 2),
('Ophthalmology', 'ST1', 'Workplace Based Assessments', 'DOPS', 'Direct Observation of Procedural Skills', 4, true, 3),
('Ophthalmology', 'ST1', 'Workplace Based Assessments', 'OSATS', 'Objective Structured Assessment of Technical Skills', 4, true, 4),
('Ophthalmology', 'ST1', 'Multi-Source Feedback', 'MSF', 'Multi-Source Feedback', 1, true, 5),
('Ophthalmology', 'ST1', 'Supervisor Reports', 'Educational Supervisor Report', 'Annual ES report', 1, true, 6),
('Ophthalmology', 'ST1', 'Examinations', 'FRCOphth Part 1', 'Fellowship exam Part 1', 1, false, 7),
('Ophthalmology', 'ST1', 'Surgical Logbook', 'Cataract Surgery (Observed)', 'Cataract procedures observed', 20, true, 8),
('Ophthalmology', 'ST1', 'Surgical Logbook', 'Cataract Surgery (Assisted)', 'Cataract procedures assisted', 10, true, 9),
('Ophthalmology', 'ST1', 'Surgical Logbook', 'Minor Ops (Performed)', 'Minor ophthalmic procedures performed', 10, true, 10),
('Ophthalmology', 'ST1', 'Clinical Experience', 'Outpatient Clinics', 'Number of outpatient clinic sessions attended', 40, true, 11),
('Ophthalmology', 'ST1', 'Clinical Experience', 'Emergency Eye Clinics', 'Emergency clinic sessions', 20, true, 12),
('Ophthalmology', 'ST1', 'Quality Improvement', 'Audit / QI Project', 'Quality improvement or audit participation', 1, true, 13),
('Ophthalmology', 'ST1', 'Professional Development', 'Reflections', 'Reflective entries', 6, true, 14),
('Ophthalmology', 'ST1', 'Teaching', 'Teaching Evidence', 'Evidence of teaching', 2, false, 15),
('Ophthalmology', 'ST1', 'Research', 'Research Activity', 'Research or publication activity', 1, false, 16);
