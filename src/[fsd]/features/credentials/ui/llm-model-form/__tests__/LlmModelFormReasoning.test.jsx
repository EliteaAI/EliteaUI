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
import { LLM_MODEL_CATALOG_FIXTURE } from './llmModelCatalog.fixture.js';

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

const EMPTY_CATALOG = { prefixes: {}, models: {} };

let catalog = LLM_MODEL_CATALOG_FIXTURE;
let isCatalogPending = false;
let credentialType = 'open_ai';

vi.mock('../../../lib/hooks', () => {
  const idleConnectionTest = {
    result: null,
    isTesting: false,
    runTest: () => {},
    showFailure: () => {},
    reset: () => {},
  };
  return {
    useLlmModelCheckConnection: () => idleConnectionTest,
    useLlmModelCredentialType: () => ({ credentialType, isCredentialTypePending: false }),
    useLlmModelTakenIds: () => [],
    useLlmModelCatalog: () => ({ catalog, isCatalogPending }),
  };
});

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('../../credentials-select/CredentialsSelect', () => ({
  default: () => <div data-testid="credentials-select" />,
}));

const theme = createTheme({ palette: lightPalette });
const CREDS = { elitea_title: 'openai-cred', private: false };

const NEW_MODEL = {
  type: 'llm_model',
  settings: {
    label: 'Model',
    elitea_title: 'model',
    name: '',
    context_window: 200000,
    max_output_tokens: 64000,
    supports_vision: false,
    supports_reasoning: false,
    thinking_type: null,
    supported_efforts: null,
    default_effort: null,
    low_tier: false,
    high_tier: false,
    shared: false,
    openai_compatible: false,
    ai_credentials: CREDS,
  },
};

const storedModel = (name, reasoning) => ({
  id: 7,
  type: 'llm_model',
  settings: { ...NEW_MODEL.settings, name, ...reasoning },
});

const setToolErrors = vi.fn();

const EditableLlmModelForm = props => {
  const { initialDetail, showValidation } = props;
  const { setFieldValue } = useFormikContext();
  const [detail, setDetail] = useState(initialDetail);
  const [serverErrors, setServerErrors] = useState({});

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

const renderForm = (initialDetail, { showValidation = false } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={initialDetail}
        onSubmit={() => {}}
      >
        <EditableLlmModelForm
          initialDetail={initialDetail}
          showValidation={showValidation}
        />
      </Formik>
    </ThemeProvider>,
  );

const readSettings = () => JSON.parse(screen.getByTestId('settings').textContent);
const reasoningOf = () => {
  const { supports_reasoning, thinking_type, supported_efforts, default_effort } = readSettings();
  return { supports_reasoning, thinking_type, supported_efforts, default_effort };
};
const nameInput = () => within(screen.getByTestId('llm-model-field-name')).getByRole('textbox');
const reasoningSwitch = () => screen.getByTestId('llm-model-switch-supports_reasoning');
const reasoningDescription = () =>
  within(screen.getByTestId('llm-model-field-supports_reasoning')).getAllByText(
    /effort levels users can pick|doesn't support reasoning/,
  )[0];
const checkedLevels = () =>
  screen
    .getAllByTestId(/^llm-model-effort-/)
    .filter(box => box.checked)
    .map(box => box.getAttribute('data-testid').replace('llm-model-effort-', ''));
const offeredLevels = () =>
  screen
    .getAllByTestId(/^llm-model-effort-/)
    .map(box => box.getAttribute('data-testid').replace('llm-model-effort-', ''));
const defaultCombobox = () =>
  within(screen.getByTestId('llm-model-field-default_effort')).getByRole('combobox');

const typeNameWithoutLeavingTheField = async (user, name) => {
  await user.clear(nameInput());
  await user.click(nameInput());
  if (name) await user.paste(name);
};

const typeName = async (user, name) => {
  await typeNameWithoutLeavingTheField(user, name);
  await user.tab();
};

const rerenderForm = (rerender, initialDetail) =>
  rerender(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={initialDetail}
        onSubmit={() => {}}
      >
        <EditableLlmModelForm
          initialDetail={initialDetail}
          showValidation={false}
        />
      </Formik>
    </ThemeProvider>,
  );

const REASONING_OFF = {
  supports_reasoning: false,
  thinking_type: null,
  supported_efforts: null,
  default_effort: null,
};
const EVERY_LEVEL = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const GARBAGE_NAME = 'nonexistent  gpt-5.6blablabla';

describe('LlmModelForm reasoning settings from the LiteLLM catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalog = LLM_MODEL_CATALOG_FIXTURE;
    isCatalogPending = false;
    credentialType = 'open_ai';
  });

  afterEach(() => cleanup());

  describe('recognition from the model name', () => {
    it('shows nothing for an empty name, the catalog key for an exact name, a warning otherwise', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      expect(screen.queryByTestId('llm-model-status-name')).not.toBeInTheDocument();

      await typeName(user, 'gpt-5.6-luna');
      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'success');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');

      await typeName(user, 'model-router');
      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Not recognized');
    });

    it('does not recognize a name that only contains a known model name (#7209)', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, GARBAGE_NAME);

      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      expect(screen.getByTestId('llm-model-status-name')).not.toHaveTextContent(/Recognized/);
      expect(reasoningOf()).toEqual(REASONING_OFF);

      await user.click(reasoningSwitch());
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
      expect(checkedLevels()).toEqual([]);
    });

    it('shows recognition once typing pauses, and fills the settings only when the field is left', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await typeNameWithoutLeavingTheField(user, 'gpt-5.6-luna');
      expect(screen.queryByTestId('llm-model-status-name')).not.toBeInTheDocument();

      expect(await screen.findByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(nameInput()).toHaveFocus();
      expect(reasoningOf()).toEqual(REASONING_OFF);

      await user.tab();
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
    });

    it('fills nothing from a shorter catalog name the typing paused on', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await typeNameWithoutLeavingTheField(user, 'gpt-5.2');
      expect(await screen.findByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      await user.keyboard('-custom');
      await user.tab();

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Not recognized');
      expect(reasoningOf()).toEqual(REASONING_OFF);
    });

    it('keeps a stored row when typing pauses on a shorter catalog name and returns to the stored name', async () => {
      const user = userEvent.setup();
      const stored = {
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low'],
        default_effort: 'low',
      };
      renderForm(storedModel('claude-sonnet-5-5', stored));

      await user.click(nameInput());
      await user.keyboard('{Backspace}{Backspace}');
      await screen.findByText('Adaptive · always on');
      await new Promise(resolve => {
        setTimeout(resolve, 600);
      });
      await user.keyboard('-5');
      await user.tab();

      expect(readSettings().name).toBe('claude-sonnet-5-5');
      expect(reasoningOf()).toEqual(stored);
    });

    it('raises no level error for a name still being typed, whose levels are filled when the field is left', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_reasoning: true,
          supported_efforts: ['none', 'low'],
          default_effort: 'low',
        }),
        { showValidation: true },
      );

      await typeNameWithoutLeavingTheField(user, 'claude-sonnet-5-5');
      await waitFor(() => expect(reasoningDescription()).toHaveTextContent('Always on for this model.'));
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(screen.queryByTestId('llm-model-thinking-type-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
      expect(setToolErrors).toHaveBeenLastCalledWith({});

      await user.tab();
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
    });

    it('keeps the thinking mode editable when a stored model has none and its entry names one', () => {
      renderForm(
        storedModel('claude-sonnet-5-5', {
          supports_reasoning: true,
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      expect(screen.queryByTestId('llm-model-thinking-type-fixed')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
      expect(reasoningOf().thinking_type).toBeNull();
    });

    it('keeps the thinking mode editable when a stored model has one and its entry names none', () => {
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_reasoning: true,
          thinking_type: 'enabled',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      expect(screen.queryByTestId('llm-model-thinking-type-fixed')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent(/Enabled/);
    });

    it('keeps the thinking mode field after a stored mode its entry does not name is cleared', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_reasoning: true,
          thinking_type: 'enabled',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      await user.click(within(screen.getByTestId('llm-model-thinking-type-select')).getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: 'Not set' }));

      expect(reasoningOf().thinking_type).toBeNull();
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
    });

    it('offers the always-on mode of the entry to a stored model that has none', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('claude-sonnet-5-5', {
          supports_reasoning: true,
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      await user.click(within(screen.getByTestId('llm-model-thinking-type-select')).getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: 'Adaptive · always on' }));

      expect(reasoningOf().thinking_type).toBe('always_on');
    });

    it('keeps the thinking mode editable while the name of a corrected stored model is being typed', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('claude-sonnet-5', {
          supports_reasoning: true,
          thinking_type: 'enabled',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );
      await user.click(within(screen.getByTestId('llm-model-thinking-type-select')).getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: 'Adaptive' }));

      await user.click(nameInput());
      await user.keyboard('x');

      expect(screen.queryByTestId('llm-model-thinking-type-fixed')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-select')).toBeInTheDocument();
    });

    it('keeps the thinking mode editable for a stored model whose entry names a mode and no levels', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('claude-without-levels', { supports_reasoning: true }));

      await user.click(within(screen.getByTestId('llm-model-thinking-type-select')).getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: 'Adaptive' }));

      expect(reasoningOf().thinking_type).toBe('adaptive');
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Adaptive');
    });

    it('keeps the thinking mode editable when a stored model is renamed to another name of its entry', async () => {
      const user = userEvent.setup();
      credentialType = 'vertex_ai';
      renderForm(
        storedModel('claude-sonnet-5-5', {
          supports_reasoning: true,
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );
      await typeName(user, 'vertex_ai/claude-sonnet-5-5');

      expect(reasoningOf().thinking_type).toBeNull();
      expect(screen.queryByTestId('llm-model-thinking-type-fixed')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
    });

    it('fixes the mode of the entry when reasoning is switched on for a stored model that had it off', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('claude-without-levels', { supports_reasoning: false }));
      await user.click(reasoningSwitch());

      expect(reasoningOf().thinking_type).toBe('adaptive');
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(screen.queryByTestId('llm-model-thinking-type-select')).not.toBeInTheDocument();
    });

    it('names a stored always-on mode that its entry does not', () => {
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_reasoning: true,
          thinking_type: 'always_on',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Adaptive · always on');
    });

    it('recognizes a pasted name with a trailing space while the field is still focused', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeNameWithoutLeavingTheField(user, 'gpt-5.6-luna ');

      await waitFor(() =>
        expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'success'),
      );
    });

    it('looks the name up at once when the field is left before the pause ends', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);

      await typeNameWithoutLeavingTheField(user, 'gpt-5.6-luna');
      await user.tab();
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
    });

    it('trims the name before the lookup', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, '  gpt-5.6-luna ');

      expect(readSettings().name).toBe('gpt-5.6-luna');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
    });

    it('hides the Reasoning row for a model LiteLLM lists without reasoning', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'text-only-model');

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(screen.queryByTestId('llm-model-field-supports_reasoning')).not.toBeInTheDocument();
      expect(reasoningOf()).toEqual(REASONING_OFF);
    });

    it('offers Reasoning, switched off, when LiteLLM does not say whether the model reasons', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-4.1');

      expect(reasoningSwitch()).not.toBeChecked();
      expect(reasoningDescription()).toHaveTextContent('Thinks before answering.');
      await user.click(reasoningSwitch());
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
    });

    it('fills Vision from the entry on a new model', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      expect(readSettings().supports_vision).toBe(false);

      await typeName(user, 'gpt-4.1');
      expect(readSettings().supports_vision).toBe(true);

      await typeName(user, 'text-only-model');
      expect(readSettings().supports_vision).toBe(false);
    });
  });

  it('keeps a stored reasoning switch visible for a model listed without reasoning so it can be turned off', async () => {
    const user = userEvent.setup();
    renderForm(storedModel('text-only-model', { supports_reasoning: true }));

    expect(reasoningSwitch()).toBeChecked();
    expect(reasoningDescription()).toHaveTextContent("This model doesn't support reasoning.");

    await user.click(reasoningSwitch());
    expect(screen.queryByTestId('llm-model-field-supports_reasoning')).not.toBeInTheDocument();
    expect(reasoningOf().supports_reasoning).toBe(false);
  });

  describe('Claude entries', () => {
    it('turns reasoning on, locks it and preselects the levels of an always-on model', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-sonnet-5-5');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
      expect(reasoningDescription()).toHaveTextContent('Always on for this model.');
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(screen.queryByTestId('llm-model-thinking-type-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('llm-model-legacy-tag')).not.toBeInTheDocument();
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(checkedLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(defaultCombobox()).toHaveTextContent('Medium');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'medium',
      });

      await user.click(reasoningSwitch());
      expect(reasoningSwitch()).toBeChecked();
    });

    it('locks an adaptive model too and stores its thinking mode', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-sonnet-5');

      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
      expect(reasoningDescription()).toHaveTextContent('Always on for this model.');
      expect(reasoningOf().thinking_type).toBe('adaptive');
      expect(offeredLevels()).not.toContain('none');
      expect(offeredLevels()).not.toContain('minimal');
    });

    it('shows the legacy token budget read-only for Claude 4.5 and older, not locked', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-haiku-4-5');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(reasoningDescription()).toHaveTextContent('On by default for this model.');
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Enabled (token budget)');
      expect(screen.getByTestId('llm-model-legacy-tag')).toHaveTextContent('Legacy');
      expect(offeredLevels()).toEqual(['low', 'medium', 'high']);
      expect(defaultCombobox()).toHaveTextContent('Medium');
      expect(reasoningOf().thinking_type).toBe('enabled');
    });

    it('offers every level and no thinking mode for a recognized model whose entry reports neither', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'global.xai.grok-4.6');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByTestId('llm-model-field-thinking_type')).not.toBeInTheDocument();
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
      expect(checkedLevels()).toEqual([]);
    });

    it('stops offering None and Minimal once the admin picks the adaptive thinking mode', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL, { showValidation: true });
      await typeName(user, 'model-router');
      await user.click(reasoningSwitch());
      await user.click(screen.getByTestId('llm-model-effort-none'));
      await user.click(screen.getByTestId('llm-model-effort-low'));

      await user.click(within(screen.getByTestId('llm-model-field-thinking_type')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Adaptive' }));

      expect(offeredLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
      expect(screen.getByTestId('llm-model-error-supported_efforts')).toHaveTextContent(
        "None isn't offered for this model. Uncheck to save.",
      );

      await user.click(screen.getByTestId('llm-model-effort-none'));
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
    });
  });

  describe('OpenAI entries', () => {
    it('offers None with its warning and stays unlocked', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6-luna');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(offeredLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(checkedLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(screen.queryByTestId('llm-model-field-thinking_type')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-warning-supported_efforts')).toHaveTextContent(
        'None lets users turn reasoning off.',
      );
      expect(reasoningOf().thinking_type).toBeNull();

      await user.click(screen.getByTestId('llm-model-effort-none'));
      expect(screen.queryByTestId('llm-model-warning-supported_efforts')).not.toBeInTheDocument();
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh']);
    });

    it('locks a model whose levels leave no way to turn reasoning off', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5-pro');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
      expect(offeredLevels()).toEqual(['minimal', 'low', 'medium', 'high']);
    });

    it('never offers None as the default and drops a default that was deselected', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.2');

      await user.click(defaultCombobox());
      expect(screen.queryByRole('option', { name: 'None' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: 'High' }));
      expect(reasoningOf().default_effort).toBe('high');

      await user.click(screen.getByTestId('llm-model-effort-high'));
      expect(reasoningOf().default_effort).toBeNull();
      expect(screen.getByTestId('llm-model-error-default_effort')).toHaveTextContent(
        'Select a default level.',
      );
    });

    it('turning reasoning off clears the stored reasoning fields, turning it back on re-applies the entry', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.2');

      await user.click(reasoningSwitch());
      expect(reasoningOf()).toEqual(REASONING_OFF);
      expect(screen.queryByTestId('llm-model-reasoning-panel')).not.toBeInTheDocument();

      await user.click(reasoningSwitch());
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: null,
        supported_efforts: ['none', 'low', 'medium', 'high'],
        default_effort: 'medium',
      });
    });
  });

  describe('the credential route', () => {
    it('looks an Azure credential up under azure/ first and offers that entry', async () => {
      credentialType = 'azure_open_ai';
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-6-astra');

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh']);
      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
    });

    it("keeps the admin's edits when a credential picked after the name moves the lookup to another entry", async () => {
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'gpt-6-astra');
      await user.click(screen.getByTestId('llm-model-effort-low'));
      await user.click(screen.getByTestId('llm-model-switch-supports_vision'));
      const editedSettings = readSettings();
      expect(editedSettings.supported_efforts).toEqual(['medium', 'high', 'xhigh', 'max']);
      expect(editedSettings.supports_vision).toBe(false);

      credentialType = 'azure_open_ai';
      rerenderForm(rerender, NEW_MODEL);

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(readSettings()).toEqual(editedSettings);
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(screen.getByTestId('llm-model-effort-max')).toBeChecked();
    });

    it('follows the entry of a credential picked after the name while the admin has not edited the prefill', async () => {
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'gpt-6-astra');
      expect(checkedLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);

      credentialType = 'azure_open_ai';
      rerenderForm(rerender, NEW_MODEL);

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh']);
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh']);

      credentialType = 'open_ai';
      rerenderForm(rerender, NEW_MODEL);
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
    });

    it('keeps a Vision choice the first entry said nothing about when the credential changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'gpt-4o-audio-preview');
      await user.click(screen.getByTestId('llm-model-switch-supports_vision'));
      expect(readSettings().supports_vision).toBe(true);

      credentialType = 'azure_open_ai';
      rerenderForm(rerender, NEW_MODEL);

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(readSettings().supports_vision).toBe(true);
    });

    it('keeps the prefilled reasoning when the credential moves to an entry that says nothing about reasoning', async () => {
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'claude-opus-4-1');
      const prefilled = reasoningOf();
      expect(prefilled.thinking_type).toBe('enabled');

      credentialType = 'vertex_ai';
      rerenderForm(rerender, NEW_MODEL);
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(reasoningOf()).toEqual(prefilled);

      credentialType = 'open_ai';
      rerenderForm(rerender, NEW_MODEL);
      expect(reasoningOf()).toEqual(prefilled);
    });

    it('falls back to the bare name when the route has no entry', async () => {
      credentialType = 'azure_open_ai';
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.2');

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
    });
  });

  describe('name changes', () => {
    it('keeps edited values while the entry stays the same and resets them on another entry', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6-luna');
      await user.click(screen.getByTestId('llm-model-effort-xhigh'));
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high']);

      await user.click(nameInput());
      await user.tab();
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high']);

      await typeName(user, 'claude-sonnet-5-5');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'medium',
      });
    });

    it('changes nothing when the name stops matching the catalog', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6-luna');
      const recognizedSettings = reasoningOf();
      expect(recognizedSettings.supports_reasoning).toBe(true);

      await typeName(user, GARBAGE_NAME);
      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      expect(reasoningOf()).toEqual(recognizedSettings);
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
    });

    it('applies the entry again when its name is typed back after a name outside the catalog', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6-luna');
      await typeName(user, GARBAGE_NAME);
      await user.click(screen.getByTestId('llm-model-effort-xhigh'));
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high']);

      await typeName(user, 'gpt-5.6-luna');
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
    });

    it('applies the entry again when a saved model is renamed to it a second time', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_reasoning: true,
          supported_efforts: ['none', 'low', 'medium', 'high', 'xhigh'],
          default_effort: 'medium',
        }),
      );
      await typeName(user, 'claude-sonnet-5-5');
      await typeName(user, 'gpt-5.6-luna');
      await user.click(screen.getByTestId('llm-model-effort-low'));
      expect(reasoningOf().supported_efforts).toEqual(['medium', 'high', 'xhigh', 'max']);

      await typeName(user, 'claude-sonnet-5-5');
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
    });

    it('keeps the stored reasoning settings of a saved model renamed to a name outside the catalog', async () => {
      const user = userEvent.setup();
      const stored = {
        supports_reasoning: true,
        thinking_type: null,
        supported_efforts: ['low', 'medium'],
        default_effort: 'low',
      };
      renderForm(storedModel('gpt-5.6-luna', stored));

      await typeName(user, 'my-private-deployment');
      expect(reasoningOf()).toEqual(stored);
    });

    it('fills the reasoning settings of a saved model from the entry of the name it was renamed to, and keeps its Vision', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.6-luna', {
          supports_vision: false,
          supports_reasoning: true,
          supported_efforts: ['none', 'low'],
          default_effort: 'low',
        }),
      );

      await typeName(user, 'claude-sonnet-5-5');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'medium',
      });
      expect(readSettings().supports_vision).toBe(false);
    });
  });

  describe('models outside the catalog', () => {
    it('flags a ticked level the token budget mode cannot take and offers only its three levels', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL, { showValidation: true });
      await typeName(user, 'model-router');
      await user.click(reasoningSwitch());
      await user.click(screen.getByTestId('llm-model-effort-low'));
      await user.click(screen.getByTestId('llm-model-effort-xhigh'));

      await user.click(within(screen.getByTestId('llm-model-thinking-type-select')).getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: /Enabled \(token budget\)/ }));

      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh']);
      expect(screen.getByTestId('llm-model-error-supported_efforts')).toHaveTextContent(
        "Extra high isn't offered for this model. Uncheck to save.",
      );

      await user.click(screen.getByTestId('llm-model-effort-xhigh'));
      expect(offeredLevels()).toEqual(['low', 'medium', 'high']);
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
    });

    it('flags a stored token budget model that keeps a level above high', () => {
      renderForm(
        storedModel('my-claude-alias', {
          supports_reasoning: true,
          thinking_type: 'enabled',
          supported_efforts: ['low', 'xhigh'],
          default_effort: 'low',
        }),
        { showValidation: true },
      );

      expect(screen.getByTestId('llm-model-error-supported_efforts')).toHaveTextContent(
        "Extra high isn't offered for this model. Uncheck to save.",
      );
    });

    it('starts with reasoning off and shows the full set with nothing preselected once it is on', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL, { showValidation: true });
      await typeName(user, 'model-router');

      expect(reasoningSwitch()).not.toBeChecked();
      await user.click(reasoningSwitch());

      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
      expect(checkedLevels()).toEqual([]);
      expect(defaultCombobox()).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('llm-model-error-supported_efforts')).toHaveTextContent(
        'Select at least one level other than None.',
      );
      expect(screen.getByTestId('llm-model-error-default_effort')).toHaveTextContent(
        'Select a default level.',
      );

      await user.click(screen.getByTestId('llm-model-effort-none'));
      expect(screen.getByTestId('llm-model-error-supported_efforts')).toBeInTheDocument();
      await user.click(screen.getByTestId('llm-model-effort-max'));
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
      await user.click(defaultCombobox());
      await user.click(screen.getByRole('option', { name: 'Max' }));
      expect(screen.queryByTestId('llm-model-error-default_effort')).not.toBeInTheDocument();

      await user.click(within(screen.getByTestId('llm-model-field-thinking_type')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: /Enabled \(token budget\)/ }));
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'enabled',
        supported_efforts: ['none', 'max'],
        default_effort: 'max',
      });
    });

    it('says nothing about recognition until the catalog has loaded, then applies the entry', async () => {
      catalog = undefined;
      isCatalogPending = true;
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6-luna');
      expect(screen.queryByTestId('llm-model-status-name')).not.toBeInTheDocument();
      expect(reasoningSwitch()).not.toBeChecked();

      catalog = LLM_MODEL_CATALOG_FIXTURE;
      isCatalogPending = false;
      rerenderForm(rerender, NEW_MODEL);

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized');
      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
    });

    it('leaves a stored row alone when the catalog arrives while its name is being typed', async () => {
      catalog = undefined;
      isCatalogPending = true;
      const stored = storedModel('claude-haiku-4-5', {
        supports_reasoning: true,
        thinking_type: 'enabled',
        supported_efforts: ['high'],
        default_effort: 'high',
      });
      const user = userEvent.setup();
      const { rerender } = renderForm(stored);
      await user.click(nameInput());
      await user.keyboard('x');

      catalog = LLM_MODEL_CATALOG_FIXTURE;
      isCatalogPending = false;
      rerenderForm(rerender, stored);

      expect(readSettings().name).toBe('claude-haiku-4-5x');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'enabled',
        supported_efforts: ['high'],
        default_effort: 'high',
      });
    });

    it('shows an unconfigured stored row from a late-arriving catalog without editing it', () => {
      catalog = undefined;
      isCatalogPending = true;
      const stored = storedModel('gpt-5.6-luna', { supports_reasoning: true });
      const { rerender } = renderForm(stored);
      catalog = LLM_MODEL_CATALOG_FIXTURE;
      isCatalogPending = false;
      rerenderForm(rerender, stored);

      expect(checkedLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(reasoningOf().supported_efforts).toBeNull();
    });

    it('shows every setting for every name when the catalog is empty', async () => {
      catalog = EMPTY_CATALOG;
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-sonnet-5-5');

      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Not recognized');
      await user.click(reasoningSwitch());
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(offeredLevels()).toEqual(EVERY_LEVEL);
    });
  });

  describe('edit mode', () => {
    it('keeps stored values on load instead of re-applying the entry', () => {
      renderForm(
        storedModel('claude-sonnet-5', {
          supports_vision: false,
          supports_reasoning: true,
          thinking_type: 'adaptive',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      expect(checkedLevels()).toEqual(['low', 'high']);
      expect(defaultCombobox()).toHaveTextContent('Low');
      expect(readSettings().supports_vision).toBe(false);
      expect(setToolErrors).toHaveBeenLastCalledWith({});
    });

    it('shows a row stored before the fields existed from its entry and writes it with the first edit', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('claude-sonnet-5', { supports_reasoning: true }), { showValidation: true });

      expect(screen.queryByTestId('llm-model-reasoning-not-configured')).not.toBeInTheDocument();
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(checkedLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(defaultCombobox()).toHaveTextContent('Medium');
      expect(setToolErrors).toHaveBeenLastCalledWith({});
      // nothing is written until the admin changes something, so opening the row leaves the form clean
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: null,
        supported_efforts: null,
        default_effort: null,
      });

      await user.type(within(screen.getByTestId('llm-model-field-description')).getByRole('textbox'), 'Fast');

      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'adaptive',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'medium',
      });
    });

    it('turns reasoning off on an unconfigured stored row in one click', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('gpt-5.6-luna', { supports_reasoning: true }), { showValidation: true });

      await user.click(reasoningSwitch());

      expect(reasoningOf()).toEqual(REASONING_OFF);
      expect(screen.queryByTestId('llm-model-reasoning-panel')).not.toBeInTheDocument();
      expect(setToolErrors).toHaveBeenLastCalledWith({});
    });

    it('keeps the first level change on an unconfigured stored row', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('gpt-5.6-luna', { supports_reasoning: true }), { showValidation: true });

      await user.click(screen.getByTestId('llm-model-effort-medium'));

      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: null,
        supported_efforts: ['none', 'low', 'high', 'xhigh'],
        default_effort: null,
      });
      expect(checkedLevels()).toEqual(['none', 'low', 'high', 'xhigh']);
      expect(screen.getByTestId('llm-model-error-default_effort')).toHaveTextContent(
        'Select a default level.',
      );

      await user.click(defaultCombobox());
      await user.click(screen.getByRole('option', { name: 'High' }));
      expect(reasoningOf().default_effort).toBe('high');
      expect(setToolErrors).toHaveBeenLastCalledWith({});
    });

    it.each(['model-router', 'global.xai.grok-4.6'])(
      'shows the full set with a note for %s stored before the fields existed',
      name => {
        renderForm(storedModel(name, { supports_reasoning: true }), { showValidation: true });

        expect(screen.getByTestId('llm-model-reasoning-not-configured')).toBeInTheDocument();
        expect(checkedLevels()).toEqual([]);
        expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
      },
    );

    it('shows a stored level the entry does not list and blocks Save until it is unchecked', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.2', {
          supports_reasoning: true,
          supported_efforts: ['low', 'medium', 'high', 'xhigh'],
          default_effort: 'medium',
        }),
        { showValidation: true },
      );

      expect(checkedLevels()).toEqual(['low', 'medium', 'high', 'xhigh']);
      expect(screen.getByTestId('llm-model-effort-xhigh')).toBeChecked();
      expect(screen.getByTestId('llm-model-error-supported_efforts')).toHaveTextContent(
        "Extra high isn't offered for this model. Uncheck to save.",
      );

      await user.click(screen.getByTestId('llm-model-effort-xhigh'));
      expect(screen.queryByTestId('llm-model-effort-xhigh')).not.toBeInTheDocument();
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high']);
      expect(screen.getByTestId('llm-model-warning-supported_efforts')).toHaveTextContent(
        'You removed Extra high.',
      );
    });

    it('warns which stored levels were removed', async () => {
      const user = userEvent.setup();
      renderForm(
        storedModel('gpt-5.2', {
          supports_reasoning: true,
          supported_efforts: ['none', 'low', 'medium', 'high'],
          default_effort: 'medium',
        }),
      );

      await user.click(screen.getByTestId('llm-model-effort-low'));
      await user.click(screen.getByTestId('llm-model-effort-high'));

      expect(screen.getByTestId('llm-model-warning-supported_efforts')).toHaveTextContent(
        'You removed Low, High. Chats and agents already set to these levels keep sending them until their settings are changed.',
      );
    });
  });
});
