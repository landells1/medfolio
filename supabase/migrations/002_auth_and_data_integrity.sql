ALTER TYPE training_stage ADD VALUE IF NOT EXISTS 'Medical Student';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  training_stage_text TEXT;
BEGIN
  training_stage_text := COALESCE(NEW.raw_user_meta_data->>'training_stage', 'FY1');

  INSERT INTO public.profiles (id, email, full_name, training_stage)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN training_stage_text = 'GP Trainee' THEN 'GP_Trainee'::training_stage
      WHEN training_stage_text IN (
        'Medical Student', 'FY1', 'FY2', 'F3', 'CT1', 'CT2', 'IMT1', 'IMT2', 'IMT3',
        'ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST8',
        'SAS', 'Consultant', 'GP_Trainee', 'Other'
      ) THEN training_stage_text::training_stage
      ELSE 'FY1'::training_stage
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

WITH ranked_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, template_id
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM portfolio_items
  WHERE template_id IS NOT NULL
)
DELETE FROM portfolio_items
WHERE id IN (
  SELECT id
  FROM ranked_items
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_user_template_unique
  ON portfolio_items(user_id, template_id)
  WHERE template_id IS NOT NULL;
