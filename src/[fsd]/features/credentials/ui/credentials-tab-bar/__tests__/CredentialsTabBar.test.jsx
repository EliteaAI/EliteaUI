// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CredentialsTabBar from '../CredentialsTabBar';

let isFormDirty = false;
const create = vi.fn();

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('formik', () => ({ useFormikContext: () => ({ resetForm: vi.fn(), values: {} }) }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ credentialType: 'llm_model' }),
  useSearchParams: () => [new URLSearchParams()],
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: props => props.children }));
vi.mock('@/GA', () => ({ useTrackEvent: () => vi.fn() }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useFormDirtyExcluding: () => isFormDirty,
  useProjectType: () => ({ projectType: 'team' }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({ Button: { DiscardButton: () => null } }));
vi.mock('@/api/configurations', async importOriginal => ({
  ...(await importOriginal()),
  useDeleteConfigurationMutation: () => [{ isLoading: false }],
}));
vi.mock('@/components/Chat/StyledComponents', () => ({ StyledCircleProgress: () => null }));
vi.mock('@/hooks/credentials/useCreateCredential', () => ({
  useCreateCredential: () => ({ create, isLoading: false }),
}));
vi.mock('@/hooks/credentials/useUpdateCredential.jsx', () => ({
  useUpdateCredential: () => ({ update: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useToast.jsx', () => ({ default: () => ({ toastSuccess: vi.fn() }) }));
vi.mock('@/pages/Common/Components', () => ({ TabBarItems: props => props.children }));

const setShowValidation = vi.fn();
const setValidationErrorMessages = vi.fn();
const setApiError = vi.fn();

const renderTabBar = ({ type, hasErrors = false }) =>
  render(
    <CredentialsTabBar
      credentialDetails={{ type, settings: {} }}
      onClearCredentialDetails={vi.fn()}
      configurationsAsSchema={[]}
      hasErrors={hasErrors}
      setShowValidation={setShowValidation}
      setApiError={setApiError}
      setValidationErrorMessages={setValidationErrorMessages}
    />,
  );

const saveButton = () => screen.getByTestId('credential-form-save-button');

describe('CredentialsTabBar save button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFormDirty = false;
    create.mockResolvedValue({ data: {} });
  });

  afterEach(() => cleanup());

  describe('other credential types keep their behaviour', () => {
    it('stays disabled until the form changes', () => {
      renderTabBar({ type: 'jira' });
      expect(saveButton()).toBeDisabled();
    });

    it('stays disabled while the form has errors', () => {
      isFormDirty = true;
      renderTabBar({ type: 'jira', hasErrors: true });
      expect(saveButton()).toBeDisabled();
    });

    it('is enabled for a changed form without errors', () => {
      isFormDirty = true;
      renderTabBar({ type: 'jira' });
      expect(saveButton()).toBeEnabled();
    });
  });

  describe('LLM models', () => {
    it('is enabled on an untouched form with errors', () => {
      renderTabBar({ type: 'llm_model', hasErrors: true });
      expect(saveButton()).toBeEnabled();
    });

    it('shows the errors instead of saving an invalid form', async () => {
      const user = userEvent.setup();
      renderTabBar({ type: 'llm_model', hasErrors: true });

      await user.click(saveButton());

      expect(setShowValidation).toHaveBeenCalledWith(true);
      expect(create).not.toHaveBeenCalled();
    });

    it('puts a rejected ID on the ID field', async () => {
      const message = "Credential with ID 'gpt-test' already exists";
      create.mockResolvedValue({ error: { status: 400, data: { field: 'elitea_title', error: message } } });
      const user = userEvent.setup();
      renderTabBar({ type: 'llm_model' });

      await user.click(saveButton());

      await waitFor(() => expect(setValidationErrorMessages).toHaveBeenCalledWith({ elitea_title: message }));
      expect(setApiError).toHaveBeenCalledWith('');
    });

    it('puts the DIAL reasoning rejection on the Reasoning field', async () => {
      create.mockResolvedValue({
        error: {
          status: 400,
          data: { field: 'data', error: "Value error, api_protocol='azure' does not support reasoning" },
        },
      });
      const user = userEvent.setup();
      renderTabBar({ type: 'llm_model' });

      await user.click(saveButton());

      await waitFor(() =>
        expect(setValidationErrorMessages).toHaveBeenCalledWith({
          supports_reasoning:
            "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
        }),
      );
    });
  });
});
