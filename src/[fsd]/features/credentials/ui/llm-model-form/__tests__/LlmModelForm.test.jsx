// @vitest-environment jsdom
import { useCallback, useState } from 'react';

import { Formik, useFormikContext } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LlmModelForm from '../LlmModelForm';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const CREDENTIAL_TYPES = {
  'openai-cred': 'open_ai',
  'dial-cred': 'ai_dial',
  'dial-cred-2': 'ai_dial',
};

let takenIds = [];
let isCredentialTypePending = false;

vi.mock('../../../lib/hooks', () => ({
  useLlmModelCredentialType: credential => ({
    credentialType: CREDENTIAL_TYPES[credential?.elitea_title] || '',
    isCredentialTypePending,
  }),
  useLlmModelTakenIds: () => takenIds,
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('../../credentials-select/CredentialsSelect', () => ({
  default: props => (
    <div data-testid="credentials-select">
      {Object.entries(CREDENTIAL_TYPES).map(([title, type]) => (
        <button
          key={title}
          type="button"
          onClick={() => props.onSelectConfiguration({ elitea_title: title, private: false })}
        >
          {title} {props.getOptionTypeTag({ type })}
        </button>
      ))}
    </div>
  ),
}));

const theme = createTheme({ palette: lightPalette });

const NEW_MODEL = {
  type: 'llm_model',
  settings: {
    label: '',
    elitea_title: '',
    name: '',
    context_window: '',
    max_output_tokens: '',
    supports_vision: false,
    supports_reasoning: false,
    low_tier: false,
    high_tier: false,
    shared: false,
    openai_compatible: false,
  },
};

const EXISTING_DIAL_MODEL = {
  id: 7,
  type: 'llm_model',
  settings: {
    label: 'Claude Sonnet 5',
    elitea_title: 'claude-sonnet-5',
    name: 'anthropic.claude-sonnet-5',
    context_window: 200000,
    max_output_tokens: 64000,
    supports_vision: true,
    supports_reasoning: false,
    low_tier: false,
    high_tier: false,
    shared: false,
    openai_compatible: false,
    ai_credentials: { elitea_title: 'dial-cred', private: false },
  },
};

const setToolErrors = vi.fn();

const EditableLlmModelForm = props => {
  const { initialDetail, showValidation, validationErrorMessages } = props;
  const { setFieldValue } = useFormikContext();
  const [detail, setDetail] = useState(initialDetail);

  const editField = useCallback(
    (field, value) => {
      const key = field.replace('settings.', '');
      setDetail(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } }));
      setFieldValue(field, value);
    },
    [setFieldValue],
  );

  return (
    <>
      <LlmModelForm
        editToolDetail={detail}
        editField={editField}
        setToolErrors={setToolErrors}
        showValidation={showValidation}
        validationErrorMessages={validationErrorMessages}
      />
      <output data-testid="settings">{JSON.stringify(detail.settings)}</output>
    </>
  );
};

const renderForm = (initialDetail, { showValidation = false, validationErrorMessages = {} } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={initialDetail}
        onSubmit={() => {}}
      >
        <EditableLlmModelForm
          initialDetail={initialDetail}
          showValidation={showValidation}
          validationErrorMessages={validationErrorMessages}
        />
      </Formik>
    </ThemeProvider>,
  );

const readSettings = () => JSON.parse(screen.getByTestId('settings').textContent);

const inputOf = field => within(screen.getByTestId(`llm-model-field-${field}`)).getByRole('textbox');

const comboboxOf = field => within(screen.getByTestId(`llm-model-field-${field}`)).getByRole('combobox');

const lastReportedErrors = () => setToolErrors.mock.calls.at(-1)[0];

const pickOption = async (user, field, optionName) => {
  await user.click(comboboxOf(field));
  await user.click(await screen.findByRole('option', { name: optionName }));
};

describe('LlmModelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    takenIds = [];
    isCredentialTypePending = false;
  });

  afterEach(() => cleanup());

  it('shows the five sections in order, expanded', () => {
    renderForm(NEW_MODEL);
    const summaries = screen.getAllByTestId(/^llm-model-section-/);
    expect(summaries.map(summary => summary.textContent)).toEqual([
      'Model',
      'Limits',
      'Capabilities',
      'Availability',
      'Connection',
    ]);
    summaries.forEach(summary => expect(summary).toHaveAttribute('aria-expanded', 'true'));
  });

  it('collapses a section, but keeps a section with errors open', async () => {
    const user = userEvent.setup();
    renderForm(NEW_MODEL);
    const limitsSummary = screen.getByTestId('llm-model-section-limits');

    await user.click(limitsSummary);
    expect(limitsSummary).toHaveAttribute('aria-expanded', 'false');

    await user.type(inputOf('label'), '!!!');
    expect(screen.getByTestId('llm-model-error-elitea_title')).toHaveTextContent('ID is required.');

    await user.click(screen.getByTestId('llm-model-section-model'));
    expect(screen.getByTestId('llm-model-section-model')).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens every collapsed section that has an error after a save attempt', async () => {
    const user = userEvent.setup();
    const { rerender } = renderForm(NEW_MODEL);

    await user.click(screen.getByTestId('llm-model-section-limits'));
    expect(screen.getByTestId('llm-model-section-limits')).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <ThemeProvider theme={theme}>
        <Formik
          initialValues={NEW_MODEL}
          onSubmit={() => {}}
        >
          <EditableLlmModelForm
            initialDetail={NEW_MODEL}
            showValidation
            validationErrorMessages={{}}
          />
        </Formik>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('llm-model-section-limits')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('llm-model-error-context_window')).toBeVisible();
  });

  it('starts a new model empty, with every switch off and no protocol field', () => {
    renderForm(NEW_MODEL);

    expect(inputOf('context_window')).toHaveValue('');
    expect(inputOf('max_output_tokens')).toHaveValue('');
    screen.getAllByRole('switch').forEach(control => expect(control).not.toBeChecked());
    expect(comboboxOf('model_tier')).toHaveTextContent('Not set');
    expect(screen.queryByTestId('llm-model-field-api_protocol')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('labels the model name field and explains it with an example', () => {
    renderForm(NEW_MODEL);
    const modelNameField = screen.getByTestId('llm-model-field-name');
    expect(within(modelNameField).getByText('Model name *')).toBeInTheDocument();
    expect(
      within(modelNameField).getByText(
        'The model ID from the provider, for example global.openai.gpt-5.6-luna',
      ),
    ).toBeInTheDocument();
  });

  it('shows every credential with its type tag', () => {
    renderForm(NEW_MODEL);
    expect(screen.getByRole('button', { name: 'openai-cred OpenAI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dial-cred DIAL' })).toBeInTheDocument();
  });

  describe('ID', () => {
    it('fills in from the display name until edited by hand', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.type(inputOf('label'), 'Claude Sonnet 5 (Bedrock)');
      expect(inputOf('elitea_title')).toHaveValue('claude-sonnet-5-bedrock');

      await user.clear(inputOf('elitea_title'));
      await user.type(inputOf('elitea_title'), 'my-claude');
      await user.type(inputOf('label'), ' v2');

      expect(inputOf('elitea_title')).toHaveValue('my-claude');
      expect(readSettings().label).toBe('Claude Sonnet 5 (Bedrock) v2');
    });

    it('shows an inline error for an ID that already exists', async () => {
      takenIds = ['gpt-test'];
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.type(inputOf('label'), 'GPT Test');

      expect(screen.getByTestId('llm-model-error-elitea_title')).toHaveTextContent(
        'This ID is already used by another configuration.',
      );
    });

    it('is read-only with a lock icon in edit mode and ignores display name changes', async () => {
      const user = userEvent.setup();
      renderForm(EXISTING_DIAL_MODEL);

      expect(inputOf('elitea_title')).toHaveAttribute('readonly');
      expect(screen.getByTestId('llm-model-id-lock')).toBeInTheDocument();

      await user.type(inputOf('label'), ' renamed');

      expect(readSettings()).toMatchObject({
        label: 'Claude Sonnet 5 renamed',
        elitea_title: 'claude-sonnet-5',
      });
    });
  });

  it('trims spaces around the model name when the field loses focus', async () => {
    const user = userEvent.setup();
    renderForm(NEW_MODEL);

    await user.type(inputOf('name'), '  gpt-5.4  ');
    await user.tab();

    expect(readSettings().name).toBe('gpt-5.4');
  });

  describe('limits', () => {
    it('flags max output tokens above the context window while typing', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.type(inputOf('context_window'), '1000');
      await user.type(inputOf('max_output_tokens'), '2000');

      expect(readSettings()).toMatchObject({ context_window: 1000, max_output_tokens: 2000 });
      expect(screen.getByTestId('llm-model-error-max_output_tokens')).toHaveTextContent(
        "Max output tokens can't be larger than the context window.",
      );
    });

    it('shows the error of a stored zero limit as soon as the model opens', () => {
      renderForm({
        ...EXISTING_DIAL_MODEL,
        settings: { ...EXISTING_DIAL_MODEL.settings, context_window: 0 },
      });

      expect(screen.getByTestId('llm-model-error-context_window')).toHaveTextContent(
        'Enter a whole number of 1 or more.',
      );
    });
  });

  it('shows every error of an empty form after a save attempt', () => {
    renderForm(NEW_MODEL, { showValidation: true });

    expect(screen.getAllByRole('alert').map(alert => alert.dataset.testid)).toEqual([
      'llm-model-error-label',
      'llm-model-error-elitea_title',
      'llm-model-error-name',
      'llm-model-error-context_window',
      'llm-model-error-max_output_tokens',
      'llm-model-error-ai_credentials',
    ]);
    expect(Object.keys(lastReportedErrors())).toHaveLength(6);
  });

  describe('model tier', () => {
    it('stores only the chosen tier', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await pickOption(user, 'model_tier', 'High tier');

      expect(readSettings()).toMatchObject({ low_tier: false, high_tier: true });
    });

    it('asks to choose one tier for a model stored with both', async () => {
      const user = userEvent.setup();
      const bothTiers = { ...EXISTING_DIAL_MODEL.settings, low_tier: true, high_tier: true };
      const { rerender } = renderForm({ ...EXISTING_DIAL_MODEL, settings: bothTiers });

      expect(screen.getByTestId('llm-model-warning-model_tier')).toHaveTextContent(
        'This model was set as both low and high tier. Choose one.',
      );
      expect(comboboxOf('model_tier')).not.toHaveTextContent(/tier|Not set/);
      expect(screen.queryByTestId('llm-model-error-model_tier')).not.toBeInTheDocument();
      expect(lastReportedErrors()).toHaveProperty('model_tier');

      rerender(
        <ThemeProvider theme={theme}>
          <Formik
            initialValues={{ ...EXISTING_DIAL_MODEL, settings: bothTiers }}
            onSubmit={() => {}}
          >
            <EditableLlmModelForm
              initialDetail={{ ...EXISTING_DIAL_MODEL, settings: bothTiers }}
              showValidation
              validationErrorMessages={{}}
            />
          </Formik>
        </ThemeProvider>,
      );
      expect(screen.getByTestId('llm-model-error-model_tier')).toHaveTextContent('Choose a model tier.');

      await pickOption(user, 'model_tier', 'Not set');

      expect(readSettings()).toMatchObject({ low_tier: false, high_tier: false });
      expect(lastReportedErrors()).not.toHaveProperty('model_tier');
    });
  });

  describe('connection', () => {
    it('does not show Azure OpenAI for a stored protocol cleared by a credential round-trip', async () => {
      const user = userEvent.setup();
      const storedAnthropic = { ...EXISTING_DIAL_MODEL.settings, api_protocol: 'anthropic' };
      renderForm({ ...EXISTING_DIAL_MODEL, settings: storedAnthropic }, { showValidation: true });
      expect(comboboxOf('api_protocol')).toHaveTextContent('Anthropic');

      await user.click(screen.getByRole('button', { name: /dial-cred-2/ }));
      await user.click(screen.getByRole('button', { name: /^dial-cred DIAL/ }));

      expect(readSettings().api_protocol).toBeUndefined();
      expect(comboboxOf('api_protocol')).not.toHaveTextContent('Azure OpenAI');
      expect(screen.getByTestId('llm-model-error-api_protocol')).toHaveTextContent(
        'API protocol is required.',
      );
    });

    it('holds Save back while the selected credential type is still loading', () => {
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL);

      expect(lastReportedErrors()).toEqual({
        ai_credentials_check: 'Checking the selected AI credentials. Try saving again in a moment.',
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('explains a held-back Save under the credentials field', () => {
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL, { showValidation: true });

      expect(screen.getByTestId('llm-model-error-ai_credentials')).toHaveTextContent(
        'Checking the selected AI credentials. Try saving again in a moment.',
      );
    });

    it('shows a required API protocol only for DIAL credentials', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.click(screen.getByRole('button', { name: /openai-cred/ }));
      expect(screen.queryByTestId('llm-model-field-api_protocol')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /^dial-cred DIAL/ }));
      expect(screen.getByTestId('llm-model-field-api_protocol')).toBeInTheDocument();
      expect(lastReportedErrors().api_protocol).toBe('API protocol is required.');

      await user.click(comboboxOf('api_protocol'));
      expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
        'OpenAI',
        'Azure OpenAI',
        'Anthropic',
      ]);
    });

    it('clears the API protocol when the credential changes', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.click(screen.getByRole('button', { name: /^dial-cred DIAL/ }));
      await pickOption(user, 'api_protocol', 'Anthropic');
      expect(readSettings().api_protocol).toBe('anthropic');

      await user.click(screen.getByRole('button', { name: /dial-cred-2/ }));

      expect(readSettings().api_protocol).toBeUndefined();
      expect(comboboxOf('api_protocol')).not.toHaveTextContent('Anthropic');
    });

    it('never picks a protocol from the model name', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.click(screen.getByRole('button', { name: /^dial-cred DIAL/ }));
      await user.type(inputOf('name'), 'anthropic.claude-sonnet-5');

      expect(readSettings().api_protocol).toBeUndefined();
    });

    it('shows Azure OpenAI for a stored DIAL model without a protocol, without changing it', () => {
      renderForm(EXISTING_DIAL_MODEL);

      expect(comboboxOf('api_protocol')).toHaveTextContent('Azure OpenAI');
      expect(readSettings()).not.toHaveProperty('api_protocol');
    });

    it('rejects reasoning with the Azure OpenAI protocol on the Reasoning field', async () => {
      const user = userEvent.setup();
      renderForm(EXISTING_DIAL_MODEL, { showValidation: true });

      await user.click(within(screen.getByTestId('llm-model-field-supports_reasoning')).getByRole('switch'));

      expect(screen.getByTestId('llm-model-error-supports_reasoning')).toHaveTextContent(
        "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
      );

      await pickOption(user, 'api_protocol', 'OpenAI');

      expect(screen.queryByTestId('llm-model-error-supports_reasoning')).not.toBeInTheDocument();
      expect(lastReportedErrors()).toEqual({});
    });
  });

  it('shows errors returned by the server on their fields', () => {
    renderForm(EXISTING_DIAL_MODEL, {
      validationErrorMessages: { supports_reasoning: 'Reasoning rejected by the server' },
    });

    expect(screen.getByTestId('llm-model-error-supports_reasoning')).toHaveTextContent(
      'Reasoning rejected by the server',
    );
  });

  describe('info popovers', () => {
    const infoButtonOf = field => screen.getByTestId(`llm-model-info-button-${field}`);

    it('gives every field an info text', () => {
      renderForm(EXISTING_DIAL_MODEL);
      expect(screen.getAllByRole('button', { name: /^About / })).toHaveLength(12);
    });

    it('opens one popover at a time and closes it on Esc', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.click(infoButtonOf('context_window'));
      expect(screen.getByRole('dialog', { name: 'About Context window' })).toHaveTextContent(
        'Total tokens the model can handle in one request, input and output combined.',
      );
      expect(infoButtonOf('context_window')).toHaveAttribute('aria-expanded', 'true');

      await user.click(infoButtonOf('supports_vision'));
      expect(screen.queryByRole('dialog', { name: 'About Context window' })).not.toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'About Vision' })).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on the close button and on a click outside', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.click(infoButtonOf('label'));
      const popover = screen.getByRole('dialog', { name: 'About Display name' });
      expect(within(popover).getByText('Claude Sonnet 5 (Bedrock)').tagName).toBe('B');
      await user.click(within(popover).getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(infoButtonOf('label'));
      await user.click(screen.getByText('Model name *'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens from the keyboard', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      infoButtonOf('shared').focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog', { name: 'About Shared' })).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(infoButtonOf('shared')).toHaveFocus();
      await user.keyboard(' ');
      expect(screen.getByRole('dialog', { name: 'About Shared' })).toBeInTheDocument();
    });
  });
});
