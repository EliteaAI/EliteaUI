// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import IndexScheduleModal from '../IndexScheduleModal';

const PERSONAL_PROJECT_ID = 100;
const TEAM_PROJECT_ID = 7;
const CRON = '0 3 * * 1';

const PROJECT_A = 'project-a';
const PROJECT_B = 'project-b';
const PERSONAL_C = 'personal-c';

const teamRow = title => ({ id: `cfg-${title}`, elitea_title: title, project_id: TEAM_PROJECT_ID, data: {} });
const personalRow = title => ({
  id: `cfg-${title}`,
  elitea_title: title,
  project_id: PERSONAL_PROJECT_ID,
  data: {},
});

const TEAM_CONFIGURATIONS = [teamRow(PROJECT_A), teamRow(PROJECT_B), personalRow(PERSONAL_C)];
const PERSONAL_CONFIGURATIONS = [personalRow(PROJECT_A), personalRow(PERSONAL_C)];

const CREDENTIALS_DATA = { description: 'GitHub credentials', configuration_types: ['github'], options: [] };

const selectedProject = vi.hoisted(() => ({ id: null }));
const credentialsData = vi.hoisted(() => ({ current: null }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: PERSONAL_PROJECT_ID } }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProject: () => ({ id: selectedProject.id }),
  useSelectedProjectId: () => selectedProject.id,
}));

vi.mock('@/[fsd]/features/credentials/lib/hooks', () => ({
  useCredentialsData: () => credentialsData.current,
  useCredentialValidation: () => ({
    validateCredential: vi.fn(),
    batchValidateCredentials: vi.fn(),
    getCredentialStatus: () => undefined,
    getCredentialMessage: () => undefined,
    resetStatus: vi.fn(),
    resetStatuses: vi.fn(),
  }),
}));

vi.mock('@/[fsd]/features/credentials', async () => ({
  CredentialsSelect: (await import('@/[fsd]/features/credentials/ui/credentials-select/CredentialsSelect'))
    .default,
}));

vi.mock('@/[fsd]/features/credentials/ui', () => ({
  CredentialOptionLabel: props => <span>{props.label}</span>,
}));

vi.mock('@/[fsd]/features/credentials/ui/credentials-select/CredentialMismatchFooter', () => ({
  default: () => <div data-testid="credential-mismatch-footer" />,
}));

vi.mock('@/[fsd]/features/credentials/ui/credentials-select/CredentialNotFoundValue', () => ({
  default: props => <span data-testid="credential-not-found-value">{props.eliteaTitle}</span>,
}));

vi.mock('@/[fsd]/shared/lib/hooks', async () => ({
  useContextExecutionEntity: () => ({ contextExecutionEntity: 'toolkit' }),
  useProjectType: (await import('@/[fsd]/shared/lib/hooks/useProjectType.hooks')).useProjectType,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Schedule: {
    ScheduleModal: props =>
      props.open ? (
        <div>
          {props.children}
          <button
            type="button"
            data-testid="schedule-save"
            onClick={() => props.onSubmit(props.cron)}
          />
        </div>
      ) : null,
  },
  Select: {
    SingleSelect: props => {
      const options = (props.optionGroups || []).flatMap(group => group.options || []);
      const selected = options.find(option => option.value === props.value);
      return (
        <div>
          <span data-testid="select-value">
            {props.customRenderValue ? props.customRenderValue(selected) : null}
          </span>
          <span data-testid="select-error">{String(Boolean(props.error))}</span>
          {options
            .filter(option => option.variant !== 'action')
            .map(option => (
              <button
                key={option.value}
                type="button"
                data-testid={`option-${option.meta.elitea_title}`}
                onClick={() => props.onValueChange(option.value)}
              />
            ))}
        </div>
      );
    },
  },
}));

vi.mock('@/hooks/useConfigurations', () => ({
  Manual_Title: 'Manual_Title',
  Create_Personal_Title: 'Create_Personal_Title',
  Create_Project_Title: 'Create_Project_Title',
}));
vi.mock('@/[fsd]/features/mcp', () => ({ McpAuthHelpers: { loadTokens: () => ({}) } }));
vi.mock('@/GA', () => ({ useTrackEvent: () => vi.fn() }));
vi.mock('@/routes', async importOriginal => ({ ...(await importOriginal()), getBasename: () => '' }));
vi.mock('@/[fsd]/shared/ui/button', () => ({ BaseBtn: () => null }));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_VARIANTS: { tertiary: 'tertiary' } }));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));

const onSubmit = vi.fn();
const onClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  selectedProject.id = TEAM_PROJECT_ID;
});

afterEach(() => cleanup());

const stubConfigurations = (configurations, { hasFetchedData = true } = {}) => {
  credentialsData.current = {
    configurations,
    hasFetchedData,
    isFetching: false,
    onRefresh: vi.fn(),
    hasAutoSelectedRef: { current: false },
    projectDefaultVectorStorageModel: '',
  };
};

const modalElement = ({
  open = true,
  credentials,
  toolkitCredentials,
  schemaCredentials = CREDENTIALS_DATA,
  isEdit = false,
}) => (
  <IndexScheduleModal
    open={open}
    onClose={onClose}
    onSubmit={onSubmit}
    cron={CRON}
    credentials={credentials}
    toolkitCredentials={toolkitCredentials}
    credentialsData={schemaCredentials}
    isEdit={isEdit}
    toolkitName="GitHub"
  />
);

const renderModal = ({ configurations = TEAM_CONFIGURATIONS, hasFetchedData, ...props } = {}) => {
  stubConfigurations(configurations, { hasFetchedData });
  return render(modalElement(props));
};

const shownValue = () => screen.getByTestId('select-value');
const save = () => fireEvent.click(screen.getByTestId('schedule-save'));
const pick = title => fireEvent.click(screen.getByTestId(`option-${title}`));
const personalHint = () => screen.queryByTestId('index-schedule-personal-credential-hint');

describe('IndexScheduleModal credentials', () => {
  it('opens a new schedule on the credential the toolkit uses, not the first listed one', async () => {
    renderModal({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } });

    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_B));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_B, private: false });
  });

  it('keeps the credential an existing schedule stored, even when the toolkit uses another', async () => {
    renderModal({
      isEdit: true,
      credentials: { elitea_title: PROJECT_A, private: false },
      toolkitCredentials: { elitea_title: PROJECT_B, private: false },
    });

    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_A));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_A, private: false });
  });

  it('never falls back to the first listed credential when there is nothing to seed', async () => {
    renderModal({ toolkitCredentials: null });

    await waitFor(() => expect(screen.getByTestId(`option-${PROJECT_A}`)).toBeInTheDocument());
    expect(shownValue()).toBeEmptyDOMElement();
    save();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('select-error')).toHaveTextContent('true');
  });

  it('does not let a toolkit refetch overwrite a credential the user picked while the dialog is open', async () => {
    const { rerender } = renderModal({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } });
    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_B));

    pick(PROJECT_A);
    rerender(modalElement({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_A, private: false });
  });

  it('refuses an empty field while the credential list is still loading', () => {
    renderModal({ toolkitCredentials: null, hasFetchedData: false });

    save();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('select-error')).toHaveTextContent('true');
  });

  it('refuses a seeded credential while the credential list is still loading', () => {
    renderModal({
      toolkitCredentials: { elitea_title: 'deleted-credential', private: false },
      hasFetchedData: false,
    });

    save();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('select-error')).toHaveTextContent('true');
  });

  it('takes the toolkit credential that changed while the dialog was closed, as the panel mounts it', async () => {
    const { rerender } = renderModal({
      open: false,
      toolkitCredentials: { elitea_title: PROJECT_A, private: false },
    });

    rerender(modalElement({ open: false, toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));
    rerender(modalElement({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));

    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_B));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_B, private: false });
  });

  it('takes the toolkit credential that changed between a close and a reopen', async () => {
    const { rerender } = renderModal({ toolkitCredentials: { elitea_title: PROJECT_A, private: false } });
    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_A));

    rerender(modalElement({ open: false, toolkitCredentials: { elitea_title: PROJECT_A, private: false } }));
    rerender(modalElement({ open: false, toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));
    rerender(modalElement({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));

    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_B));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_B, private: false });
  });

  it('seeds the toolkit credential once the toolkit schemas load after the dialog opened', async () => {
    const { rerender } = renderModal({ toolkitCredentials: null, schemaCredentials: null });

    rerender(modalElement({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));

    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_B));
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_B, private: false });
  });

  it('does not seed a late toolkit credential into a field the user has cleared', async () => {
    const { rerender } = renderModal({ toolkitCredentials: null });
    await waitFor(() => expect(screen.getByTestId(`option-${PROJECT_A}`)).toBeInTheDocument());

    pick(PROJECT_A);
    await waitFor(() => expect(shownValue()).toHaveTextContent(PROJECT_A));
    pick(PROJECT_A);
    rerender(modalElement({ toolkitCredentials: { elitea_title: PROJECT_B, private: false } }));

    await waitFor(() => expect(shownValue()).toBeEmptyDOMElement());
    save();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a seeded credential that is no longer in the list', async () => {
    renderModal({ toolkitCredentials: { elitea_title: 'deleted-credential', private: false } });

    await waitFor(() => expect(shownValue()).toHaveTextContent('deleted-credential'));
    save();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps refusing an unlisted stored credential that is replaced while the dialog is open', async () => {
    const { rerender } = renderModal({
      credentials: { elitea_title: 'deleted-credential', private: false },
      isEdit: true,
    });
    await waitFor(() => expect(shownValue()).toHaveTextContent('deleted-credential'));

    rerender(modalElement({ credentials: { elitea_title: 'also-deleted', private: false }, isEdit: true }));
    await waitFor(() => expect(shownValue()).toHaveTextContent('also-deleted'));
    save();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('a toolkit on a personal credential in a team project', () => {
    const toolkitCredentials = { elitea_title: PERSONAL_C, private: true };

    it('leaves the field empty and explains why', async () => {
      renderModal({ toolkitCredentials });

      await waitFor(() => expect(screen.getByTestId(`option-${PROJECT_A}`)).toBeInTheDocument());
      expect(shownValue()).toBeEmptyDOMElement();
      expect(screen.queryByTestId(`option-${PERSONAL_C}`)).not.toBeInTheDocument();
      expect(personalHint()).toHaveTextContent(
        'This toolkit uses a personal credential; schedules in a team project need a project credential.',
      );
    });

    it('blocks Save until a listed project credential is picked', async () => {
      renderModal({ toolkitCredentials });
      await waitFor(() => expect(screen.getByTestId(`option-${PROJECT_A}`)).toBeInTheDocument());

      save();
      expect(onSubmit).not.toHaveBeenCalled();

      pick(PROJECT_A);
      expect(personalHint()).not.toBeInTheDocument();
      save();

      expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_A, private: false });
    });

    it('still shows a personal credential an existing schedule stored, but will not save it', async () => {
      renderModal({ isEdit: true, credentials: toolkitCredentials, toolkitCredentials });

      await waitFor(() =>
        expect(screen.getByTestId('credential-not-found-value')).toHaveTextContent(PERSONAL_C),
      );
      save();
      expect(onSubmit).not.toHaveBeenCalled();

      pick(PROJECT_B);
      save();

      expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PROJECT_B, private: false });
    });
  });

  it('refuses a stored personal credential shown as the same-titled shared row until that row is clicked', async () => {
    const sharedRow = { id: 'cfg-shared', elitea_title: PERSONAL_C, project_id: 1, shared: true, data: {} };
    renderModal({
      configurations: [teamRow(PROJECT_A), sharedRow],
      isEdit: true,
      credentials: { elitea_title: PERSONAL_C, private: true },
    });

    await waitFor(() => expect(shownValue()).toHaveTextContent(PERSONAL_C));
    save();
    expect(onSubmit).not.toHaveBeenCalled();

    pick(PERSONAL_C);
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PERSONAL_C, private: false });
  });

  it('pre-selects a personal toolkit credential in the personal project and saves it as private', async () => {
    selectedProject.id = PERSONAL_PROJECT_ID;
    renderModal({
      configurations: PERSONAL_CONFIGURATIONS,
      toolkitCredentials: { elitea_title: PERSONAL_C, private: true },
    });

    await waitFor(() => expect(shownValue()).toHaveTextContent(PERSONAL_C));
    expect(personalHint()).not.toBeInTheDocument();
    save();

    expect(onSubmit).toHaveBeenCalledWith(CRON, { elitea_title: PERSONAL_C, private: true });
  });
});
