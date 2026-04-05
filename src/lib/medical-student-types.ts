// ─── Category ────────────────────────────────────────────────────────────────

export type MedStudentCategory =
  | 'qip_audit'
  | 'research_publication'
  | 'teaching'
  | 'prize_award'
  | 'commitment_specialty';

// ─── Database row ─────────────────────────────────────────────────────────────

export type MedStudentEntry = {
  id: string;
  user_id: string;
  category: MedStudentCategory;
  template_type: string;
  year_of_training: number | null;
  title: string;
  data: Record<string, string>;
  created_at: string;
  updated_at: string;
};

// ─── Template definitions ─────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'select' | 'date';

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type Template = {
  id: string;
  label: string;
  fields: TemplateField[];
};

export type CategoryMeta = {
  id: MedStudentCategory;
  label: string;
  description: string;
};

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'qip_audit',
    label: 'QIPs & Audits',
    description: 'Quality improvement projects and clinical audits',
  },
  {
    id: 'research_publication',
    label: 'Research & Publications',
    description: 'Research projects, papers, posters, and presentations',
  },
  {
    id: 'teaching',
    label: 'Teaching',
    description: 'Teaching sessions, curriculum work, and supervision',
  },
  {
    id: 'prize_award',
    label: 'Prizes & Awards',
    description: 'Prizes, awards, and academic distinctions',
  },
  {
    id: 'commitment_specialty',
    label: 'Commitment to Specialty',
    description: 'Electives, SSCs, taster weeks, and specialty insight',
  },
];

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATES: Record<MedStudentCategory, Template[]> = {
  qip_audit: [
    {
      id: 'qip',
      label: 'Quality Improvement Project',
      fields: [
        {
          key: 'background',
          label: 'Background / Problem',
          type: 'textarea',
          placeholder: 'What problem were you trying to solve?',
        },
        {
          key: 'change_implemented',
          label: 'Change Implemented',
          type: 'textarea',
          placeholder: 'What change did you implement?',
        },
        {
          key: 'results',
          label: 'Results',
          type: 'textarea',
          placeholder: 'What were the outcomes?',
        },
        {
          key: 'pdsa_cycles',
          label: 'PDSA Cycles',
          type: 'text',
          placeholder: 'e.g. 2 cycles completed',
        },
        {
          key: 'reflection',
          label: 'Reflection',
          type: 'textarea',
          placeholder: 'What did you learn?',
        },
      ],
    },
    {
      id: 'audit',
      label: 'Clinical Audit',
      fields: [
        {
          key: 'standard',
          label: 'Standard / Guideline Audited Against',
          type: 'text',
          placeholder: 'e.g. NICE CG161',
        },
        {
          key: 'background',
          label: 'Background',
          type: 'textarea',
          placeholder: 'Why was this audit important?',
        },
        {
          key: 'results',
          label: 'Results',
          type: 'textarea',
          placeholder: 'Summary of findings',
        },
        {
          key: 'recommendations',
          label: 'Recommendations',
          type: 'textarea',
          placeholder: 'What changes did you recommend?',
        },
        {
          key: 're_audit',
          label: 'Re-audit',
          type: 'text',
          placeholder: 'e.g. Re-audit planned for June 2025',
        },
        {
          key: 'reflection',
          label: 'Reflection',
          type: 'textarea',
          placeholder: 'What did you learn?',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other',
      fields: [
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your quality improvement activity...',
        },
      ],
    },
  ],

  research_publication: [
    {
      id: 'publication',
      label: 'Publication',
      fields: [
        {
          key: 'authors',
          label: 'Authors',
          type: 'text',
          placeholder: 'e.g. Smith J, Jones A et al.',
        },
        {
          key: 'journal_or_conference',
          label: 'Journal / Conference',
          type: 'text',
          placeholder: 'e.g. BMJ, ASM 2024',
        },
        {
          key: 'publication_type',
          label: 'Type',
          type: 'select',
          options: [
            'Journal Article',
            'Poster Presentation',
            'Oral Presentation',
            'Abstract',
            'Book Chapter',
            'Case Report',
            'Other',
          ],
        },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
        },
        {
          key: 'doi_or_link',
          label: 'DOI / Link',
          type: 'text',
          placeholder: 'https://doi.org/...',
        },
        {
          key: 'reflection',
          label: 'Reflection',
          type: 'textarea',
          placeholder: 'What did this contribute to your development?',
        },
      ],
    },
    {
      id: 'research_project',
      label: 'Research Project',
      fields: [
        {
          key: 'principal_investigator',
          label: 'Principal Investigator',
          type: 'text',
          placeholder: 'e.g. Prof. A Smith',
        },
        {
          key: 'institution',
          label: 'Institution',
          type: 'text',
          placeholder: 'e.g. University of Edinburgh',
        },
        {
          key: 'role',
          label: 'Your Role',
          type: 'text',
          placeholder: 'e.g. Research Assistant, Co-Investigator',
        },
        {
          key: 'start_date',
          label: 'Start Date',
          type: 'date',
        },
        {
          key: 'end_date',
          label: 'End Date',
          type: 'date',
        },
        {
          key: 'summary',
          label: 'Summary',
          type: 'textarea',
          placeholder: 'What was the project about and what was your contribution?',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other',
      fields: [
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your research or publication activity...',
        },
      ],
    },
  ],

  teaching: [
    {
      id: 'teaching_session',
      label: 'Teaching Session',
      fields: [
        {
          key: 'topic',
          label: 'Topic',
          type: 'text',
          placeholder: 'e.g. ECG Interpretation',
        },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
        },
        {
          key: 'audience',
          label: 'Audience',
          type: 'select',
          options: [
            'Medical Students',
            'Foundation Doctors',
            'Nursing Staff',
            'Allied Health Professionals',
            'Mixed',
            'Other',
          ],
        },
        {
          key: 'format',
          label: 'Format',
          type: 'select',
          options: [
            'Lecture',
            'Tutorial',
            'Small Group Teaching',
            'Bedside Teaching',
            'Simulation',
            'Online / Virtual',
            'Other',
          ],
        },
        {
          key: 'feedback',
          label: 'Feedback Received',
          type: 'textarea',
          placeholder: 'Any feedback from attendees?',
        },
        {
          key: 'reflection',
          label: 'Reflection',
          type: 'textarea',
          placeholder: 'What did you learn from this experience?',
        },
      ],
    },
    {
      id: 'curriculum_development',
      label: 'Curriculum Development',
      fields: [
        {
          key: 'module_or_course',
          label: 'Module / Course',
          type: 'text',
          placeholder: 'e.g. Year 3 Clinical Skills Module',
        },
        {
          key: 'institution',
          label: 'Institution',
          type: 'text',
          placeholder: 'e.g. University of Edinburgh',
        },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your contribution to the curriculum...',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other',
      fields: [
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your teaching activity...',
        },
      ],
    },
  ],

  prize_award: [
    {
      id: 'prize_award',
      label: 'Prize / Award',
      fields: [
        {
          key: 'awarding_body',
          label: 'Awarding Body',
          type: 'text',
          placeholder: 'e.g. Royal College of Physicians',
        },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'What was this award for?',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other',
      fields: [
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your achievement...',
        },
      ],
    },
  ],

  commitment_specialty: [
    {
      id: 'elective',
      label: 'Elective',
      fields: [
        {
          key: 'specialty',
          label: 'Specialty',
          type: 'text',
          placeholder: 'e.g. Cardiology',
        },
        {
          key: 'location',
          label: 'Location / Hospital',
          type: 'text',
          placeholder: 'e.g. Royal Infirmary of Edinburgh',
        },
        {
          key: 'country',
          label: 'Country',
          type: 'text',
          placeholder: 'e.g. United Kingdom',
        },
        {
          key: 'start_date',
          label: 'Start Date',
          type: 'date',
        },
        {
          key: 'end_date',
          label: 'End Date',
          type: 'date',
        },
        {
          key: 'supervisor',
          label: 'Supervisor',
          type: 'text',
          placeholder: 'e.g. Mr J Smith',
        },
        {
          key: 'summary',
          label: 'Summary',
          type: 'textarea',
          placeholder: 'What did you do and observe?',
        },
        {
          key: 'what_you_learned',
          label: 'What You Learned',
          type: 'textarea',
          placeholder: 'How did this strengthen your commitment to this specialty?',
        },
      ],
    },
    {
      id: 'ssc_ssm',
      label: 'SSC / SSM',
      fields: [
        {
          key: 'specialty',
          label: 'Specialty',
          type: 'text',
          placeholder: 'e.g. Ophthalmology',
        },
        {
          key: 'institution',
          label: 'Institution',
          type: 'text',
          placeholder: 'e.g. University of Glasgow',
        },
        {
          key: 'start_date',
          label: 'Start Date',
          type: 'date',
        },
        {
          key: 'end_date',
          label: 'End Date',
          type: 'date',
        },
        {
          key: 'supervisor',
          label: 'Supervisor',
          type: 'text',
          placeholder: 'e.g. Dr A Jones',
        },
        {
          key: 'summary',
          label: 'Summary',
          type: 'textarea',
          placeholder: 'What did you do and achieve?',
        },
      ],
    },
    {
      id: 'taster',
      label: 'Taster Week / Day',
      fields: [
        {
          key: 'specialty',
          label: 'Specialty',
          type: 'text',
          placeholder: 'e.g. Neurosurgery',
        },
        {
          key: 'hospital',
          label: 'Hospital',
          type: 'text',
          placeholder: 'e.g. Western General Hospital',
        },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
        },
        {
          key: 'summary',
          label: 'Summary',
          type: 'textarea',
          placeholder: 'What did you observe and learn?',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other',
      fields: [
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Describe your commitment to specialty activity...',
        },
      ],
    },
  ],
};

export const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
