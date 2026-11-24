// @vitest-environment jsdom
import { useState } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { files, texts } = vi.hoisted(() => ({ files: {}, texts: {} }));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillVersionFilesQuery: ({ versionId }) => ({ data: files[versionId] }),
  useSkillVersionFileTextQuery: ({ versionId, path }, { skip }) =>
    skip ? {} : { currentData: texts[`${versionId}:${path}`], isFetching: false },
}));
vi.mock('@/[fsd]/features/skill/lib/hooks/useSkillVersionFileTexts.hooks', () => ({
  useSkillVersionFileTexts: ({ versionId }, paths) =>
    Object.fromEntries(paths.map(path => [path, texts[`${versionId}:${path}`]])),
}));
vi.mock('@/[fsd]/features/skill/lib/hooks/useSkillFileActions.hooks', () => ({
  useSkillFileActions: () => ({ downloadPath: vi.fn() }),
}));
vi.mock('@/[fsd]/entities/compare-versions', () => ({
  CompareVersionHeader: props => (
    <div data-testid={`header-${props.version.name}`}>{props.save ? 'with-save' : 'no-save'}</div>
  ),
}));
vi.mock('../SkillCompareFileText', () => ({
  default: props => (
    <textarea
      data-testid="diff-field"
      data-original={props.otherValue ?? props.value}
      data-tone={props.tone}
      readOnly={!props.editable}
      value={props.value}
      onChange={event => props.onChange(event.target.value)}
    />
  ),
}));
vi.mock('@/[fsd]/shared/ui/button', () => ({ CopyIconButton: () => null }));
vi.mock('../SkillCompareFileCard', () => ({
  default: props => (
    <div
      data-testid="file-card"
      data-changed={String(props.isChanged)}
    >
      {props.file.path}
    </div>
  ),
}));

const { default: SkillCompareFilesStep } = await import('../SkillCompareFilesStep');

const theme = createTheme({ palette: darkPalette });
const text = (path, sha256) => ({ path, sha256, size: 10, isText: true });
const binary = (path, sha256) => ({ path, sha256, size: 10, isText: false });
const headerSave = { isDirty: false, isSaving: false, onSave: vi.fn() };

const renderStep = extraProps =>
  render(
    <ThemeProvider theme={theme}>
      <SkillCompareFilesStep
        projectId={2}
        skillId={7}
        leftVersion={{ id: 70, name: 'base', status: 'draft' }}
        rightVersion={{ id: 71, name: 'test', status: 'draft' }}
        leftData={{ files: files[70] }}
        rightData={{ files: files[71] }}
        leftEdits={{}}
        rightEdits={{}}
        onLeftEdit={vi.fn()}
        onRightEdit={vi.fn()}
        leftHeaderSave={headerSave}
        rightHeaderSave={headerSave}
        {...extraProps}
      />
    </ThemeProvider>,
  );

const EditableStep = () => {
  const [rightEdits, setRightEdits] = useState({});
  return (
    <ThemeProvider theme={theme}>
      <SkillCompareFilesStep
        projectId={2}
        skillId={7}
        leftVersion={{ id: 70, name: 'base', status: 'draft' }}
        rightVersion={{ id: 71, name: 'test', status: 'draft' }}
        leftData={{ files: files[70] }}
        rightData={{ files: files[71] }}
        leftEdits={{}}
        rightEdits={rightEdits}
        onLeftEdit={vi.fn()}
        onRightEdit={(key, value) => setRightEdits({ [key]: value })}
        leftHeaderSave={headerSave}
        rightHeaderSave={headerSave}
      />
    </ThemeProvider>
  );
};
const renderEditableStep = () => render(<EditableStep />);

const rowPaths = () =>
  screen
    .getAllByTestId(/^skill-compare-file-row-/)
    .filter(row => !row.hasAttribute('aria-expanded'))
    .map(row => row.getAttribute('data-testid').replace('skill-compare-file-row-', ''));

describe('SkillCompareFilesStep', () => {
  beforeEach(() => {
    files[70] = [
      text('references/FORMS.md', 'a'),
      text('scripts/rotate.py', 'b'),
      text('scripts/same.py', 'c'),
      binary('assets/template.pdf', 'd'),
    ];
    files[71] = [
      text('references/FORMS.md', 'a2'),
      text('scripts/validate.py', 'e'),
      text('scripts/same.py', 'c'),
      binary('assets/template.pdf', 'd2'),
    ];
    Object.assign(texts, {
      '70:references/FORMS.md': 'old form',
      '71:references/FORMS.md': 'new form',
      '70:scripts/rotate.py': 'rotate()',
      '71:scripts/validate.py': 'validate()',
      '70:scripts/same.py': 'same()',
      '71:scripts/same.py': 'same()',
    });
  });
  afterEach(() => cleanup());

  it('lists only the files that differ by default, with a summary and a chip each', () => {
    renderStep();
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent(
      '1 changed · 1 new · 1 removed · 1 replaced',
    );
    expect(rowPaths()).toEqual([
      'assets/template.pdf',
      'references/FORMS.md',
      'scripts/rotate.py',
      'scripts/validate.py',
    ]);
    expect(screen.getByTestId('skill-compare-file-row-scripts/rotate.py')).toHaveTextContent('Removed');
    expect(screen.getByTestId('skill-compare-file-row-scripts/validate.py')).toHaveTextContent('New');
  });

  it('lists every file once Only changed is off', () => {
    renderStep();
    fireEvent.click(screen.getByLabelText('Only changed'));
    expect(rowPaths()).toContain('scripts/same.py');
  });

  it('folds a folder', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-scripts'));
    expect(rowPaths()).toEqual(['assets/template.pdf', 'references/FORMS.md']);
  });

  it('shows a changed text file of both versions, each diffed against the other, with Save in the headers', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    const [left, right] = screen.getAllByTestId('diff-field');
    expect(left).toHaveValue('old form');
    expect(left).toHaveAttribute('data-original', 'new form');
    expect(right).toHaveValue('new form');
    expect(right).toHaveAttribute('data-original', 'old form');
    expect(left).toHaveAttribute('data-tone', 'removed');
    expect(right).toHaveAttribute('data-tone', 'added');
    expect(screen.getByTestId('header-base')).toHaveTextContent('with-save');
    expect(screen.getByTestId('header-test')).toHaveTextContent('with-save');
  });

  it('says a new file is not in the base version and shows it without highlights', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-scripts/validate.py'));
    expect(screen.getByTestId('skill-compare-file-absent-left')).toHaveTextContent('Not in base');
    const [field] = screen.getAllByTestId('diff-field');
    expect(field).toHaveValue('validate()');
    expect(field).toHaveAttribute('data-original', 'validate()');
  });

  it('says a removed file is not in the compared version', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-scripts/rotate.py'));
    expect(screen.getByTestId('skill-compare-file-absent-right')).toHaveTextContent('Not in test');
    expect(screen.getAllByTestId('diff-field')).toHaveLength(1);
  });

  it('shows a binary file as a card per version, with no Save', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-assets/template.pdf'));
    const cards = screen.getAllByTestId('file-card');
    expect(cards).toHaveLength(2);
    cards.forEach(card => expect(card).toHaveAttribute('data-changed', 'true'));
    expect(screen.queryByTestId('diff-field')).not.toBeInTheDocument();
    expect(screen.getByTestId('header-base')).toHaveTextContent('no-save');
  });

  it('keeps an edit under the path of its file', () => {
    const onRightEdit = vi.fn();
    renderStep({ onRightEdit });
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    fireEvent.change(screen.getAllByTestId('diff-field')[1], {
      target: { value: 'newer form' },
    });
    expect(onRightEdit).toHaveBeenCalledWith('file:references/FORMS.md', 'newer form');
  });

  it('shows a file with Windows line endings one break per line and keeps them in the edit', () => {
    texts['71:references/FORMS.md'] = 'new\r\nform\r\n';
    const onRightEdit = vi.fn();
    renderStep({ onRightEdit });
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    const field = screen.getAllByTestId('diff-field')[1];
    expect(field).toHaveValue('new\nform\n');
    fireEvent.change(field, { target: { value: 'new\nform 2\n' } });
    expect(onRightEdit).toHaveBeenCalledWith('file:references/FORMS.md', 'new\r\nform 2\r\n');
  });

  it('says so when the two versions differ only in line endings or the byte order mark', () => {
    texts['70:references/FORMS.md'] = '\uFEFFform\r\n';
    texts['71:references/FORMS.md'] = 'form\n';
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    expect(screen.getAllByText('Only line endings or the byte order mark differ.')).toHaveLength(2);
    expect(screen.queryByText('No differences in this file.')).not.toBeInTheDocument();
  });

  it('does not call the two sides the same while neither text has loaded', () => {
    delete texts['70:references/FORMS.md'];
    delete texts['71:references/FORMS.md'];
    renderStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    expect(screen.queryByText('No differences in this file.')).not.toBeInTheDocument();
  });

  it('shows the unsaved edit, then the saved text, over the stored file', () => {
    renderStep({ rightEdits: { 'file:references/FORMS.md': 'draft' } });
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    expect(screen.getAllByTestId('diff-field')[1]).toHaveValue('draft');
    cleanup();
    renderStep({
      rightData: { files: files[71], 'file:references/FORMS.md': 'saved' },
    });
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    expect(screen.getAllByTestId('diff-field')[1]).toHaveValue('saved');
  });

  it('does not let a published version or a public comparison be edited', () => {
    renderStep({ rightVersion: { id: 71, name: 'test', status: 'published' } });
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    const [left, right] = screen.getAllByTestId('diff-field');
    expect(left).not.toHaveAttribute('readonly');
    expect(right).toHaveAttribute('readonly');
  });

  it('keeps a file listed after its save made both versions the same', () => {
    files[71][0] = text('references/FORMS.md', 'a');
    renderStep({
      rightData: { files: files[71], 'file:references/FORMS.md': 'old form' },
    });
    expect(rowPaths()).toContain('references/FORMS.md');
  });

  it('marks a file Changed once an unsaved edit makes the two versions differ, and not once it is typed back', () => {
    files[71] = files[70];
    const Harness = () => {
      const [rightEdits, setRightEdits] = useState({});
      return (
        <ThemeProvider theme={theme}>
          <SkillCompareFilesStep
            projectId={2}
            skillId={7}
            leftVersion={{ id: 70, name: 'base', status: 'draft' }}
            rightVersion={{ id: 71, name: 'test', status: 'draft' }}
            leftData={{ files: files[70] }}
            rightData={{ files: files[71] }}
            leftEdits={{}}
            rightEdits={rightEdits}
            onLeftEdit={vi.fn()}
            onRightEdit={(key, value) => setRightEdits({ [key]: value })}
            leftHeaderSave={headerSave}
            rightHeaderSave={headerSave}
          />
        </ThemeProvider>
      );
    };
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Only changed'));
    fireEvent.click(screen.getByTestId('skill-compare-file-row-scripts/same.py'));
    const summary = screen.getByTestId('skill-compare-files-summary');
    const row = () => screen.getByTestId('skill-compare-file-row-scripts/same.py');
    expect(summary).toHaveTextContent('No differences in files');

    fireEvent.change(screen.getAllByTestId('diff-field')[1], {
      target: { value: 'same() # edited' },
    });
    expect(summary).toHaveTextContent('1 changed');
    expect(row()).toHaveTextContent('Changed');

    fireEvent.change(screen.getAllByTestId('diff-field')[1], {
      target: { value: 'same()' },
    });
    expect(summary).toHaveTextContent('No differences in files');
    expect(row()).not.toHaveTextContent('Changed');
  });

  it('keeps a file Changed by an unsaved edit when the step is shown again', () => {
    files[71] = files[70];
    renderStep({ rightEdits: { 'file:scripts/same.py': 'same() # edited' } });
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent('1 changed');
    expect(screen.getByTestId('skill-compare-file-row-scripts/same.py')).toHaveTextContent('Changed');
  });

  it('keeps a changed file not Changed once its unsaved edit matches the other version, also when shown again', () => {
    renderStep({ rightEdits: { 'file:references/FORMS.md': 'old form' } });
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent(
      '1 new · 1 removed · 1 replaced',
    );
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).not.toHaveTextContent('Changed');
  });

  it('marks a changed file not Changed once it is typed to match the other version', () => {
    renderEditableStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    fireEvent.change(screen.getAllByTestId('diff-field')[1], {
      target: { value: 'old form' },
    });
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent(
      '1 new · 1 removed · 1 replaced',
    );
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).not.toHaveTextContent('Changed');
  });

  it('takes the status from the text of the other version once it arrives', () => {
    delete texts['70:references/FORMS.md'];
    const { rerender } = renderEditableStep();
    fireEvent.click(screen.getByTestId('skill-compare-file-row-references/FORMS.md'));
    fireEvent.change(screen.getAllByTestId('diff-field').at(-1), { target: { value: 'old form' } });
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).toHaveTextContent('Changed');
    texts['70:references/FORMS.md'] = 'old form';
    rerender(<EditableStep />);
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent(
      '1 new · 1 removed · 1 replaced',
    );
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).not.toHaveTextContent('Changed');
  });

  it('keeps the status of a just saved file while the file list still describes it as before the save', () => {
    renderStep({ rightData: { files: files[71], 'file:references/FORMS.md': 'old form' } });
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).not.toHaveTextContent('Changed');
    cleanup();
    files[71][0] = text('references/FORMS.md', 'a');
    renderStep({ rightData: { files: files[71], 'file:references/FORMS.md': 'new form' } });
    expect(screen.getByTestId('skill-compare-file-row-references/FORMS.md')).toHaveTextContent('Changed');
  });

  it('says so when no file differs', () => {
    files[71] = files[70];
    renderStep();
    expect(screen.getByTestId('skill-compare-files-summary')).toHaveTextContent('No differences in files');
    expect(screen.queryAllByTestId(/^skill-compare-file-row-/)).toHaveLength(0);
  });
});
