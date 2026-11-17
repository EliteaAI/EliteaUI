// Sample data for the skill page stories: the skill "pdf-forms" with 11 files and "status-report" without files.
import { PERMISSIONS } from '@/common/constants';

export const PROJECT_ID = 42;
export const USER = {
  id: 1,
  name: 'George Smith',
  email: 'george_smith@example.com',
  personal_project_id: 7,
};

const flatten = value => (typeof value === 'string' ? [value] : Object.values(value).flatMap(flatten));
export const ALL_PERMISSIONS = flatten(PERMISSIONS);

const PDF_FORMS_MD = `# PDF forms

1. Read the field list: references/FORMS.md.
2. Fill the values with scripts/fill_fields.py.
3. Check the result with scripts/check_fields.py.
4. XFA forms: see references/REFERENCE.md.

Never fill a signature field.`;

const STATUS_REPORT_MD = `# Weekly status report

1. Ask for the week if it is not given.
2. Group the work into Done, In progress and Blocked.
3. One line per item, the ticket number first.
4. End with the risks for next week, at most three.

Keep it under 200 words.`;

// Long instructions: the counter near and over the limit
const filler = n =>
  Array.from({ length: n }, (_, i) => `- Rule ${i + 1}: keep the field names as the form has them.`).join(
    '\n',
  );
export const NEAR_LIMIT_MD = `${PDF_FORMS_MD}\n\n## Rules\n\n${filler(800)}`;
export const OVER_LIMIT_MD = `${PDF_FORMS_MD}\n\n## Rules\n\n${filler(880)}`;

export const PDF_FORMS_FILES = [
  {
    path: 'references/FORMS.md',
    size: 742,
    content: `# PDF form fields

Every fillable PDF exposes its fields through the
AcroForm dictionary. Read the field list before
writing values: names are case-sensitive.

## Field types

| Type      | Value to pass     |
|-----------|-------------------|
| text      | string            |
| checkbox  | "/Yes" or "/Off"  |
| radio     | one export value  |
| choice    | one of /Opt       |
| signature | never fill        |

## Edge cases

- Flattened forms have no fields: say so.
- XFA forms: see references/REFERENCE.md.
- Dates: keep the format the field expects.

## After filling

Run scripts/check_fields.py again.`,
  },
  {
    path: 'references/REFERENCE.md',
    size: 236,
    content: `# XFA forms

XFA forms keep their fields in an XML stream,
not in AcroForm. Most tools cannot write them.

1. Tell the user the form is XFA.
2. Offer to export the data as a table instead.`,
  },
  {
    path: 'scripts/fill_fields.py',
    size: 421,
    content: `import sys
from pypdf import PdfReader, PdfWriter

# Fill AcroForm fields from a JSON file.
def fill(src, values, out):
    reader = PdfReader(src)
    writer = PdfWriter()
    writer.append(reader)
    for page in writer.pages:
        writer.update_page_form_field_values(page, values)
    with open(out, 'wb') as f:
        writer.write(f)

if __name__ == '__main__':
    fill(*sys.argv[1:4])`,
  },
  {
    path: 'scripts/check_fields.py',
    size: 268,
    content: `from pypdf import PdfReader

# Print every field and its value; empty ones first.
def check(path):
    fields = PdfReader(path).get_fields() or {}
    empty = [k for k, v in fields.items() if not v.get('/V')]
    for name in empty:
        print('EMPTY', name)
    return len(empty)`,
  },
  { path: 'scripts/extract_text.py', size: 190, content: '# Extract the text of every page.\n' },
  { path: 'scripts/merge_pdfs.py', size: 204, content: '# Merge several PDFs into one.\n' },
  { path: 'scripts/split_pages.py', size: 188, content: '# Split a PDF into single pages.\n' },
  { path: 'scripts/rotate.py', size: 140, content: '# Rotate the pages of a PDF.\n' },
  { path: 'scripts/utils.py', size: 96, content: '# Shared helpers.\n' },
  { path: 'assets/template.pdf', size: 48 * 1024, binary: true },
  { path: 'assets/logo.png', size: 12 * 1024, binary: true },
  {
    path: 'LICENSE.txt',
    size: 180,
    content: `MIT License

Copyright (c) 2026 ELITEA

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software…`,
  },
];

const skill = (id, name, description, instructions, tags) => ({
  id,
  name,
  description,
  owner_id: USER.id,
  is_pinned: false,
  meta: { default_version_id: id * 10 },
  versions: [{ id: id * 10, name: 'base', status: 'draft', created_at: '2026-11-12T10:00:00Z' }],
  version_details: {
    id: id * 10,
    name: 'base',
    status: 'draft',
    instructions,
    tags: tags.map((tag, i) => ({ id: i + 1, name: tag, data: { color: '#6AE8FA' } })),
    meta: {},
    run_settings: null,
    created_at: '2026-11-12T10:00:00Z',
  },
});

export const SKILLS = {
  pdfForms: skill(
    77,
    'pdf-forms',
    "Fill PDF forms from the user's data and check the result. Use when asked to fill, read or check a PDF form.",
    PDF_FORMS_MD,
    ['documents'],
  ),
  statusReport: skill(
    78,
    'status-report',
    'Write the weekly status report from recent work. Use when asked for a status or a progress summary.',
    STATUS_REPORT_MD,
    ['reports'],
  ),
};

const list = rows => ({ rows, total: rows.length });

export const buildRoutes = ({ skillDetails, files = [], maxLength = 50000 }) => [
  ['/permissions/prompt_lib/', ALL_PERMISSIONS],
  ['/author/', USER],
  [
    '/projects/project/',
    [
      { id: 7, name: 'Personal' },
      { id: PROJECT_ID, name: 'Product Team' },
    ],
  ],
  ['/secrets/secrets/', []],
  ['/folder/prompt_lib/', { date_groups: [], folders: [], pinned: { conversations: [] } }],
  // The file list of a skill version, as a backend could answer it (none exists yet: the prototype's own shape)
  ['/skill_files/', { files }],
  [`/skill/prompt_lib/${PROJECT_ID}/`, skillDetails],
  ['/skills/prompt_lib/', list([SKILLS.pdfForms, SKILLS.statusReport])],
  ['/platform_settings', { skill_instructions_max_length: maxLength }],
  [
    '/configurations/models/',
    {
      items: [
        {
          name: 'gpt-4o-mini',
          display_name: 'gpt-4o-mini',
          project_id: PROJECT_ID,
          default: true,
          shared: false,
        },
      ],
      total: 1,
    },
  ],
  ['/tags/', list([])],
  ['/skill_categories/', []],
  ['/chat_templates/', []],
  ['/applications/prompt_lib/', list([])],
  ['/public_applications/prompt_lib', list([])],
  ['/tools/prompt_lib/', list([])],
];

export const storyState = {
  settings: { project: { id: PROJECT_ID, name: 'Product Team' }, sideBarCollapsed: true },
  user: { ...USER, permissions: ALL_PERMISSIONS, publicPermissions: ALL_PERMISSIONS },
};
