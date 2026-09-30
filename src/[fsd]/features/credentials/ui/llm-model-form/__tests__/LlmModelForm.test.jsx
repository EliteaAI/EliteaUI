// @vitest-environment jsdom
import { useCallback, useState } from 'react';

import { Formik, useFormikContext } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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

vi.mock('../../../lib/hooks', async () => {
  const { LLM_MODEL_PROFILES_FIXTURE } = await import('./llmModelProfiles.fixture.js');
  return {
    useLlmModelCredentialType: credential => ({
      credentialType: CREDENTIAL_TYPES[credential?.elitea_title] || '',
      isCredentialTypePending,
    }),
    useLlmModelTakenIds: () => takenIds,
    useLlmModelProfiles: () => ({
      profilesPayload: LLM_MODEL_PROFILES_FIXTURE,
      effortLevels: LLM_MODEL_PROFILES_FIXTURE.effort_levels,
    }),
  };
});

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('../../credentials-select/CredentialsSelect', () => ({
  default: props => (
    <div data-testid="credentials-select">
      <span>{props.label}</span>
      <span data-testid={props.infoTooltipTestId} />
      {props.error && props.helperText && (
        <div data-testid="credential-warning-banner">{props.helperText}</div>
      )}
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
  const [serverErrors, setServerErrors] = useState(validationErrorMessages);

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
        validationErrorMessages={serverErrors}
        setValidationErrorMessages={setServerErrors}
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

    await user.type(inputOf('context_window'), '1000');
    await user.type(inputOf('max_output_tokens'), '100');

    expect(screen.queryByTestId('llm-model-error-context_window')).not.toBeInTheDocument();
    expect(screen.getByTestId('llm-model-section-limits')).toHaveAttribute('aria-expanded', 'true');
  });

  it('clears its errors from the page when it unmounts', () => {
    const { unmount } = renderForm(NEW_MODEL);
    expect(Object.keys(lastReportedErrors())).not.toHaveLength(0);

    unmount();

    expect(lastReportedErrors()).toEqual({});
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
    expect(within(modelNameField).getByText('Model Name *')).toBeInTheDocument();
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

  describe('description', () => {
    const FORTY = 'Best for coding and agents, fast and fun';

    it('sits between ID and model name, empty for a new model', () => {
      renderForm(NEW_MODEL);
      const fieldOrder = screen
        .getAllByTestId(/^llm-model-field-(elitea_title|description|name)$/)
        .map(field => field.dataset.testid);

      expect(fieldOrder).toEqual([
        'llm-model-field-elitea_title',
        'llm-model-field-description',
        'llm-model-field-name',
      ]);
      expect(inputOf('description')).toHaveValue('');
    });

    it('shows the counter only while the field is focused', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      expect(screen.queryByTestId('llm-model-description-counter')).not.toBeInTheDocument();

      await user.click(inputOf('description'));
      expect(screen.getByTestId('llm-model-description-counter')).toHaveTextContent('40 characters left');

      await user.tab();
      expect(screen.queryByTestId('llm-model-description-counter')).not.toBeInTheDocument();
    });

    it('is optional', async () => {
      renderForm(NEW_MODEL, { showValidation: true });
      await waitFor(() => expect(lastReportedErrors()).not.toHaveProperty('description'));
      expect(screen.queryByTestId('llm-model-error-description')).not.toBeInTheDocument();
    });

    it('counts the characters left while typing', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.type(inputOf('description'), 'Fast for everyday tasks');

      expect(readSettings().description).toBe('Fast for everyday tasks');
      expect(screen.getByTestId('llm-model-description-counter')).toHaveTextContent('17 characters left');
    });

    it('accepts exactly 40 characters and refuses a 41st, typed or pasted', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      expect(FORTY).toHaveLength(40);

      await user.type(inputOf('description'), `${FORTY}x`);
      expect(readSettings().description).toBe(FORTY);
      expect(screen.getByTestId('llm-model-description-counter')).toHaveTextContent('0 characters left');

      await user.clear(inputOf('description'));
      await user.click(inputOf('description'));
      await user.paste(`${FORTY}xyz`);
      expect(readSettings().description).toBe(FORTY);
    });

    it('trims surrounding spaces when the field loses focus', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.type(inputOf('description'), '  Fast for everyday tasks  ');
      await user.tab();

      expect(readSettings().description).toBe('Fast for everyday tasks');
    });

    it('shows the stored description of an existing model and lets it be cleared', async () => {
      const user = userEvent.setup();
      renderForm({
        ...EXISTING_DIAL_MODEL,
        settings: { ...EXISTING_DIAL_MODEL.settings, description: 'Smart and fast for most tasks' },
      });
      expect(inputOf('description')).toHaveValue('Smart and fast for most tasks');

      await user.clear(inputOf('description'));

      expect(readSettings().description).toBe('');
    });

    it('shows a server rejection under the field', () => {
      renderForm(EXISTING_DIAL_MODEL, {
        validationErrorMessages: { description: 'String should have at most 40 characters' },
      });

      expect(screen.getByTestId('llm-model-error-description')).toHaveTextContent(
        'String should have at most 40 characters',
      );
    });

    it('explains the field in its info text', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.hover(screen.getByTestId('llm-model-info-description'));
      const tooltip = await screen.findByTestId('llm-model-info-text-description');
      expect(tooltip).toHaveTextContent(
        'A few words on what the model is best for, shown under its name when people pick a model, for example Fast for everyday tasks or Best for coding and agents.',
      );
      expect(within(tooltip).getByText('Fast for everyday tasks').tagName).toBe('STRONG');
    });
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
    ]);
    expect(
      within(screen.getByTestId('llm-model-field-ai_credentials')).getByTestId('credential-warning-banner'),
    ).toHaveTextContent('AI credentials are required.');
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

    it('holds Save back while a newly picked credential type is still loading', async () => {
      const user = userEvent.setup();
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL);
      await user.click(screen.getByRole('button', { name: /openai-cred/ }));

      expect(lastReportedErrors()).toEqual({
        ai_credentials_check: 'Checking the selected AI credentials. Try saving again in a moment.',
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('explains a held-back Save under the credentials field', async () => {
      const user = userEvent.setup();
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL, { showValidation: true });
      await user.click(screen.getByRole('button', { name: /dial-cred-2/ }));

      expect(
        within(screen.getByTestId('llm-model-field-ai_credentials')).getByTestId('credential-warning-banner'),
      ).toHaveTextContent('Checking the selected AI credentials. Try saving again in a moment.');
    });

    it('holds Save while the list loads once a setting the credential type gates is changed', async () => {
      const user = userEvent.setup();
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL, { showValidation: true });
      expect(lastReportedErrors()).toEqual({});

      await user.click(within(screen.getByTestId('llm-model-field-supports_reasoning')).getByRole('switch'));

      expect(lastReportedErrors()).toMatchObject({
        ai_credentials_check: 'Checking the selected AI credentials. Try saving again in a moment.',
      });
    });

    it('does not hold a stored model back while the credentials list is still loading', () => {
      // A slow credentials listing used to block re-saving an untouched model with
      // "Checking the selected AI credentials"; the stored credential already carries its protocol
      isCredentialTypePending = true;
      renderForm(EXISTING_DIAL_MODEL, { showValidation: true });

      expect(lastReportedErrors()).toEqual({});
      expect(screen.queryByTestId('credential-warning-banner')).not.toBeInTheDocument();
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

  describe('errors returned by the server', () => {
    const SERVER_REASONING_ERROR = { supports_reasoning: 'Reasoning rejected by the server' };

    it('clears the reasoning error once the protocol it depends on changes', async () => {
      const user = userEvent.setup();
      renderForm(EXISTING_DIAL_MODEL, { validationErrorMessages: SERVER_REASONING_ERROR });
      expect(screen.getByTestId('llm-model-error-supports_reasoning')).toBeInTheDocument();

      await pickOption(user, 'api_protocol', 'OpenAI');

      expect(screen.queryByTestId('llm-model-error-supports_reasoning')).not.toBeInTheDocument();
    });

    it('clears the reasoning error once the credential it depends on changes', async () => {
      const user = userEvent.setup();
      renderForm(EXISTING_DIAL_MODEL, { validationErrorMessages: SERVER_REASONING_ERROR });

      await user.click(screen.getByRole('button', { name: /dial-cred-2/ }));

      expect(screen.queryByTestId('llm-model-error-supports_reasoning')).not.toBeInTheDocument();
    });

    it('keeps the reasoning error while an unrelated field is edited', async () => {
      const user = userEvent.setup();
      renderForm(EXISTING_DIAL_MODEL, { validationErrorMessages: SERVER_REASONING_ERROR });

      await user.type(inputOf('description'), 'Fast');

      expect(screen.getByTestId('llm-model-error-supports_reasoning')).toHaveTextContent(
        'Reasoning rejected by the server',
      );
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

  describe('info tooltips', () => {
    const INFO_FIELDS = [
      'label',
      'elitea_title',
      'description',
      'name',
      'context_window',
      'max_output_tokens',
      'supports_vision',
      'supports_reasoning',
      'model_tier',
      'shared',
      'ai_credentials',
      'api_protocol',
      'openai_compatible',
    ];

    it('gives every field an info icon', () => {
      renderForm(EXISTING_DIAL_MODEL);
      INFO_FIELDS.forEach(field => expect(screen.getByTestId(`llm-model-info-${field}`)).toBeInTheDocument());
    });

    it('shows the info text on hover and hides it when the pointer leaves', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.hover(screen.getByTestId('llm-model-info-context_window'));
      expect(await screen.findByTestId('llm-model-info-text-context_window')).toHaveTextContent(
        'Total tokens the model can handle in one request, input and output combined.',
      );

      await user.unhover(screen.getByTestId('llm-model-info-context_window'));
      await waitFor(() =>
        expect(screen.queryByTestId('llm-model-info-text-context_window')).not.toBeInTheDocument(),
      );
    });

    it('renders the bold parts of an info text in bold', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.hover(screen.getByTestId('llm-model-info-label'));
      const tooltip = await screen.findByTestId('llm-model-info-text-label');
      expect(within(tooltip).getByText('Claude Sonnet 5 (Bedrock)').tagName).toBe('STRONG');
    });

    it('shows the info text on hover for switch fields', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await user.hover(screen.getByTestId('llm-model-info-supports_vision'));
      expect(await screen.findByTestId('llm-model-info-text-supports_vision')).toHaveTextContent(
        "The model accepts images as input. When off, image attachments aren't sent to this model.",
      );
    });
  });
});
