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
import { LLM_MODEL_PROFILES_FIXTURE } from './llmModelProfiles.fixture.js';

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

let profilesPayload = LLM_MODEL_PROFILES_FIXTURE;

vi.mock('../../../lib/hooks', () => ({
  useLlmModelCredentialType: () => ({ credentialType: 'open_ai', isCredentialTypePending: false }),
  useLlmModelTakenIds: () => [],
  useLlmModelProfiles: () => ({
    profilesPayload,
    effortLevels: profilesPayload.effort_levels || [
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
    ],
    isProfilesPending: false,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
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
    /effort levels users can pick|Turn it off to save/,
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

const typeName = async (user, name) => {
  await user.clear(nameInput());
  await user.type(nameInput(), name);
};

describe('LlmModelForm reasoning profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilesPayload = LLM_MODEL_PROFILES_FIXTURE;
  });

  afterEach(() => cleanup());

  describe('recognition from the model name', () => {
    it('shows nothing for an empty name, green for a recognized name, warning otherwise', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      expect(screen.queryByTestId('llm-model-status-name')).not.toBeInTheDocument();

      await typeName(user, 'global.anthropic.claude-sonnet-5');
      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'success');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent(
        'Recognized: Anthropic Claude Opus 5 / Sonnet 5 / Opus 4.7-4.8. Only the settings it supports are shown.',
      );

      await typeName(user, 'global.xai.grok-4.6');
      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent(
        'Not recognized. All reasoning options are shown; check compatibility with DevOps.',
      );
    });

    it('hides the Reasoning row for a recognized model without reasoning', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-4.1');

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent(
        "Recognized: OpenAI GPT-4 family. Reasoning isn't supported, so its settings are hidden.",
      );
      expect(screen.queryByTestId('llm-model-field-supports_reasoning')).not.toBeInTheDocument();
      expect(reasoningOf()).toEqual({
        supports_reasoning: false,
        thinking_type: null,
        supported_efforts: null,
        default_effort: null,
      });
    });
  });

  it('keeps a stored reasoning switch visible for a no-reasoning family so it can be turned off', async () => {
    const user = userEvent.setup();
    renderForm(storedModel('gpt-4-azure', { supports_reasoning: true }));

    expect(reasoningSwitch()).toBeChecked();
    expect(reasoningDescription()).toHaveTextContent(
      "This model family doesn't support reasoning. Turn it off to save.",
    );

    await user.click(reasoningSwitch());
    expect(screen.queryByTestId('llm-model-field-supports_reasoning')).not.toBeInTheDocument();
    expect(reasoningOf().supports_reasoning).toBe(false);
  });

  describe('Anthropic profiles', () => {
    it('turns reasoning on, locks it as always on in Elitea and preselects the adaptive profile', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'eu.anthropic.claude-opus-4-7');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
      expect(reasoningDescription()).toHaveTextContent('Always on in Elitea.');
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Adaptive · always on');
      expect(screen.queryByTestId('llm-model-thinking-type-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('llm-model-legacy-tag')).not.toBeInTheDocument();
      expect(offeredLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(checkedLevels()).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
      expect(defaultCombobox()).toHaveTextContent('High');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'adaptive',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'high',
      });

      await user.click(reasoningSwitch());
      expect(reasoningSwitch()).toBeChecked();
    });

    it('words the lock as a provider fact for Fable', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-fable-5-1');

      expect(reasoningSwitch()).toHaveAttribute('aria-disabled', 'true');
      expect(reasoningDescription()).toHaveTextContent('Always on for this model.');
      expect(reasoningOf().thinking_type).toBe('always_on');
    });

    it('shows the legacy token budget read-only for Claude 4.5 and older, not locked', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'eu.anthropic.claude-haiku-4-5-20251001-v1:0');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(reasoningDescription()).toHaveTextContent('On by default for this model.');
      expect(screen.getByTestId('llm-model-thinking-type-fixed')).toHaveTextContent('Enabled (token budget)');
      expect(screen.getByTestId('llm-model-legacy-tag')).toHaveTextContent('Legacy');
      expect(offeredLevels()).toEqual(['low', 'medium', 'high']);
      expect(defaultCombobox()).toHaveTextContent('Medium');
    });
  });

  describe('OpenAI profiles', () => {
    it('hides the thinking mode, offers None with its warning and stays unlocked', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'global.openai.gpt-5.6-luna');

      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningSwitch()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByTestId('llm-model-field-thinking_type')).not.toBeInTheDocument();
      expect(offeredLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(checkedLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(screen.getByTestId('llm-model-warning-supported_efforts')).toHaveTextContent(
        'None lets users turn reasoning off.',
      );
      expect(reasoningOf().thinking_type).toBeNull();

      await user.click(screen.getByTestId('llm-model-effort-none'));
      expect(screen.queryByTestId('llm-model-warning-supported_efforts')).not.toBeInTheDocument();
      expect(reasoningOf().supported_efforts).toEqual(['low', 'medium', 'high', 'xhigh']);
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

    it('turning reasoning off clears the stored reasoning fields, turning it back on re-applies the profile', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.2');

      await user.click(reasoningSwitch());
      expect(reasoningOf()).toEqual({
        supports_reasoning: false,
        thinking_type: null,
        supported_efforts: null,
        default_effort: null,
      });
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

  describe('profile changes while typing', () => {
    it('keeps edited values within the same profile and resets them on another profile', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'gpt-5.6');
      await user.click(screen.getByTestId('llm-model-effort-xhigh'));
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high']);

      await user.type(nameInput(), '-luna');
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high']);

      await typeName(user, 'claude-fable-5-1');
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'high',
      });
    });
  });

  describe('unrecognized models', () => {
    it('starts with reasoning off and shows the full set with nothing preselected once it is on', async () => {
      const user = userEvent.setup();
      renderForm(NEW_MODEL, { showValidation: true });
      await typeName(user, 'global.xai.grok-4.6');

      expect(reasoningSwitch()).not.toBeChecked();
      await user.click(reasoningSwitch());

      expect(screen.getByTestId('llm-model-thinking-type-select')).toHaveTextContent('Not set');
      expect(offeredLevels()).toEqual(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);
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

    it('applies the profile once the list arrives after the name was typed', async () => {
      profilesPayload = { profiles: [] };
      const user = userEvent.setup();
      const { rerender } = renderForm(NEW_MODEL);
      await typeName(user, 'global.openai.gpt-5.6-luna');
      expect(reasoningSwitch()).not.toBeChecked();

      profilesPayload = LLM_MODEL_PROFILES_FIXTURE;
      rerender(
        <ThemeProvider theme={theme}>
          <Formik
            initialValues={NEW_MODEL}
            onSubmit={() => {}}
          >
            <EditableLlmModelForm
              initialDetail={NEW_MODEL}
              showValidation={false}
            />
          </Formik>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('llm-model-status-name')).toHaveTextContent('Recognized: OpenAI GPT-5.6');
      expect(reasoningSwitch()).toBeChecked();
      expect(reasoningOf().supported_efforts).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
    });

    it('does not apply a late-arriving list to a stored row', () => {
      profilesPayload = { profiles: [] };
      const stored = storedModel('global.openai.gpt-5.6-luna', { supports_reasoning: true });
      const { rerender } = renderForm(stored);
      profilesPayload = LLM_MODEL_PROFILES_FIXTURE;
      rerender(
        <ThemeProvider theme={theme}>
          <Formik
            initialValues={stored}
            onSubmit={() => {}}
          >
            <EditableLlmModelForm
              initialDetail={stored}
              showValidation={false}
            />
          </Formik>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('llm-model-profile-suggestion')).toBeInTheDocument();
      expect(reasoningOf().supported_efforts).toBeNull();
    });

    it('falls back to the full set when the profile list is unavailable', async () => {
      profilesPayload = { profiles: [] };
      const user = userEvent.setup();
      renderForm(NEW_MODEL);
      await typeName(user, 'claude-fable-5-1');

      expect(screen.getByTestId('llm-model-status-name')).toHaveAttribute('data-tone', 'warning');
      await user.click(reasoningSwitch());
      expect(offeredLevels()).toEqual(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);
    });
  });

  describe('edit mode', () => {
    it('keeps stored values on load instead of re-applying the profile', () => {
      renderForm(
        storedModel('claude-sonnet-5', {
          supports_reasoning: true,
          thinking_type: 'adaptive',
          supported_efforts: ['low', 'high'],
          default_effort: 'low',
        }),
      );

      expect(checkedLevels()).toEqual(['low', 'high']);
      expect(defaultCombobox()).toHaveTextContent('Low');
      expect(screen.queryByTestId('llm-model-profile-suggestion')).not.toBeInTheDocument();
      expect(setToolErrors).toHaveBeenLastCalledWith({});
    });

    it('suggests the profile for a row stored before the fields existed and applies it on request', async () => {
      const user = userEvent.setup();
      renderForm(storedModel('global.openai.gpt-5.6-luna', { supports_reasoning: true }), {
        showValidation: true,
      });

      const suggestion = screen.getByTestId('llm-model-profile-suggestion');
      expect(suggestion).toHaveTextContent('Reasoning levels are not configured for this model yet.');
      expect(suggestion).toHaveTextContent(
        'Suggested for OpenAI GPT-5.6: None, Low, Medium, High, Extra high · default Medium',
      );
      expect(screen.queryByTestId('llm-model-supported-efforts-group')).not.toBeInTheDocument();
      expect(setToolErrors).toHaveBeenLastCalledWith({});

      await user.click(screen.getByTestId('llm-model-apply-profile'));

      expect(screen.queryByTestId('llm-model-profile-suggestion')).not.toBeInTheDocument();
      expect(checkedLevels()).toEqual(['none', 'low', 'medium', 'high', 'xhigh']);
      expect(reasoningOf()).toEqual({
        supports_reasoning: true,
        thinking_type: null,
        supported_efforts: ['none', 'low', 'medium', 'high', 'xhigh'],
        default_effort: 'medium',
      });
    });

    it('shows the full set with a note for an unrecognized row stored before the fields existed', () => {
      renderForm(storedModel('model-router', { supports_reasoning: true }), { showValidation: true });

      expect(screen.getByTestId('llm-model-reasoning-not-configured')).toBeInTheDocument();
      expect(checkedLevels()).toEqual([]);
      expect(screen.queryByTestId('llm-model-error-supported_efforts')).not.toBeInTheDocument();
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
