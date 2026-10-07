// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SkillRunPane from '../SkillRunPane';

const fixture = vi.hoisted(() => ({ values: {}, initialValues: {}, runPanel: vi.fn(() => null) }));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: fixture.values, initialValues: fixture.initialValues }),
}));
vi.mock('../SkillRunPanel', () => ({
  default: props => {
    fixture.runPanel(props);
    return <div data-testid="run-panel" />;
  },
}));
vi.mock('../../skill-test-panel/SkillTestPanel', () => ({
  default: props => <div data-testid="test-panel">{props.banner}</div>,
}));
vi.mock('../UnsavedChangesTestBanner', () => ({ default: () => <div data-testid="unsaved-banner" /> }));

const saved = {
  id: 10,
  name: 'Reviewer',
  description: 'Reviews',
  version_details: {
    id: 100,
    instructions: 'Review it.',
    tags: [],
    run_settings: { llm_settings: { model_name: 'gpt-4.1' }, ignore_project_context: false },
  },
};

const renderPane = values => {
  fixture.initialValues = saved;
  fixture.values = values;
  return render(
    <SkillRunPane
      runConversationId="42"
      onRunConversationChange={vi.fn()}
    />,
  );
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('SkillRunPane mode', () => {
  it('runs the saved version in the persistent panel when nothing runnable changed', () => {
    renderPane({ ...saved, name: 'Renamed', description: 'Other' });
    expect(screen.getByTestId('run-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('unsaved-banner')).not.toBeInTheDocument();
    expect(fixture.runPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 10,
        versionDetails: saved.version_details,
        runConversationId: '42',
      }),
    );
  });

  it('tests unsaved instructions statelessly behind the banner', () => {
    renderPane({ ...saved, version_details: { ...saved.version_details, instructions: 'Changed.' } });
    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
    expect(screen.getByTestId('unsaved-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('run-panel')).not.toBeInTheDocument();
  });

  it('tests unsaved run settings statelessly behind the banner', () => {
    renderPane({
      ...saved,
      version_details: { ...saved.version_details, run_settings: { llm_settings: { model_name: 'other' } } },
    });
    expect(screen.getByTestId('unsaved-banner')).toBeInTheDocument();
  });
});
