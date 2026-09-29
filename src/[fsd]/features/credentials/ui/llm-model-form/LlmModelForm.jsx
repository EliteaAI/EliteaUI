import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { Input, Select, Text } from '@/[fsd]/shared/ui';
import LockSimple from '@/components/Icons/LockSimple';

import { LlmModelFormConstants } from '../../lib/constants';
import { credentialKeyOf, isApiProtocolCredentialType } from '../../lib/helpers/apiProtocol.helpers.js';
import {
  convertDisplayNameToLlmModelId,
  getLlmModelCredentialTypeTag,
  getLlmModelTier,
  getLlmModelTierFlags,
  hasConflictingLlmModelTiers,
  omitLlmModelErrorsDependingOn,
  parseLlmModelTokenLimitInput,
  pickVisibleLlmModelErrors,
} from '../../lib/helpers/llmModelForm.helpers.js';
import {
  buildReasoningSettingsFromProfile,
  getLlmModelReasoningDescription,
  getLlmModelRecognition,
  isLlmModelReasoningConfigured,
  recognizeLlmModelProfile,
} from '../../lib/helpers/llmModelProfiles.helpers.js';
import { useLlmModelCredentialType, useLlmModelProfiles, useLlmModelTakenIds } from '../../lib/hooks';
import { validateLlmModelSettings } from '../../lib/validation';
import CredentialsSelect from '../credentials-select/CredentialsSelect';
import LlmModelField from './LlmModelField';
import LlmModelFormSection from './LlmModelFormSection';
import LlmModelReasoningPanel from './LlmModelReasoningPanel';
import LlmModelSwitchField from './LlmModelSwitchField';

const {
  LLM_MODEL_API_PROTOCOL_OPTIONS,
  LLM_MODEL_CREDENTIALS_SECTION,
  LLM_MODEL_DESCRIPTION_MAX_LENGTH,
  LLM_MODEL_FIELDS: FIELDS,
  LLM_MODEL_MODEL_NAME_HELPER_TEXT,
  LLM_MODEL_REASONING_FIELDS,
  LLM_MODEL_SECTIONS: SECTIONS,
  LLM_MODEL_STORED_DIAL_PROTOCOL_FALLBACK,
  LLM_MODEL_TIER_CONFLICT_WARNING,
  LLM_MODEL_TIER_OPTIONS,
} = LlmModelFormConstants;

const READ_ONLY_INPUT_PROPS = { readOnly: true };
const NUMERIC_INPUT_PROPS = { inputMode: 'numeric' };
const DESCRIPTION_INPUT_PROPS = { maxLength: LLM_MODEL_DESCRIPTION_MAX_LENGTH };
const CREDENTIALS_SELECT_SX = { marginTop: 0 };

const getCredentialOptionTypeTag = configuration => getLlmModelCredentialTypeTag(configuration?.type);

const LlmModelForm = memo(props => {
  const {
    editToolDetail,
    editField,
    setToolErrors,
    showValidation,
    validationErrorMessages,
    setValidationErrorMessages,
  } = props;
  const settings = useMemo(() => editToolDetail?.settings || {}, [editToolDetail?.settings]);
  const isEditing = Boolean(editToolDetail?.id);
  const { initialValues } = useFormikContext();
  const initialSettings = initialValues?.settings;
  const styles = llmModelFormStyles();

  const { credentialType, isCredentialTypePending } = useLlmModelCredentialType(settings.ai_credentials);
  const takenIds = useLlmModelTakenIds({ skip: isEditing });
  const { profilesPayload, effortLevels } = useLlmModelProfiles();
  const profile = useMemo(
    () => recognizeLlmModelProfile(settings.name, profilesPayload),
    [settings.name, profilesPayload],
  );
  const recognition = useMemo(() => getLlmModelRecognition(settings.name, profile), [settings.name, profile]);
  // A stored 'on' stays visible for a no-reasoning family so the admin can turn it off and see the server's rejection
  const isReasoningShown = !profile || profile.supports_reasoning || Boolean(settings.supports_reasoning);
  const isReasoningLocked = Boolean(profile?.locked && settings.supports_reasoning);
  const isReasoningConfigRequired = !isEditing || isLlmModelReasoningConfigured(settings);

  const isApiProtocolShown = isApiProtocolCredentialType(credentialType);
  const isStoredModelWithoutProtocol =
    isEditing &&
    !initialSettings?.api_protocol &&
    credentialKeyOf(settings.ai_credentials) === credentialKeyOf(initialSettings?.ai_credentials);
  const apiProtocol =
    settings.api_protocol || (isStoredModelWithoutProtocol ? LLM_MODEL_STORED_DIAL_PROTOCOL_FALLBACK : '');

  const errors = useMemo(
    () =>
      validateLlmModelSettings({
        settings,
        isEditing,
        takenIds,
        isApiProtocolShown,
        isCredentialTypePending,
        apiProtocol,
        isReasoningConfigRequired,
      }),
    [
      settings,
      isEditing,
      takenIds,
      isApiProtocolShown,
      isCredentialTypePending,
      apiProtocol,
      isReasoningConfigRequired,
    ],
  );

  useEffect(() => {
    setToolErrors(errors);
  }, [errors, setToolErrors]);

  useEffect(() => () => setToolErrors({}), [setToolErrors]);

  const visibleErrors = useMemo(
    () => ({
      ...pickVisibleLlmModelErrors({
        errors,
        settings,
        initialSettings,
        isEditing,
        showAll: showValidation,
      }),
      ...validationErrorMessages,
    }),
    [errors, settings, initialSettings, isEditing, showValidation, validationErrorMessages],
  );

  const hasVisibleErrorIn = section => section.fields.some(field => visibleErrors[field]);

  const editSetting = useCallback(
    (field, value) => {
      setValidationErrorMessages?.(serverErrors => omitLlmModelErrorsDependingOn(serverErrors, field));
      editField(`settings.${field}`, value);
    },
    [editField, setValidationErrorMessages],
  );

  const onDisplayNameChange = useCallback(
    event => {
      const displayName = event.target.value;
      const isIdFollowingDisplayName =
        !isEditing && settings.elitea_title === convertDisplayNameToLlmModelId(settings.label);
      editSetting(FIELDS.displayName, displayName);
      if (isIdFollowingDisplayName) editSetting(FIELDS.id, convertDisplayNameToLlmModelId(displayName));
    },
    [editSetting, isEditing, settings.elitea_title, settings.label],
  );

  const onIdChange = useCallback(event => editSetting(FIELDS.id, event.target.value), [editSetting]);

  const onDescriptionChange = useCallback(
    event => editSetting(FIELDS.description, event.target.value),
    [editSetting],
  );

  const onDescriptionBlur = useCallback(() => {
    const trimmedDescription = String(settings.description ?? '').trim();
    if (trimmedDescription !== (settings.description ?? ''))
      editSetting(FIELDS.description, trimmedDescription);
  }, [editSetting, settings.description]);

  const applyReasoningSettings = useCallback(
    reasoningSettings =>
      LLM_MODEL_REASONING_FIELDS.forEach(field => editSetting(field, reasoningSettings[field])),
    [editSetting],
  );

  const onModelNameChange = useCallback(
    event => editSetting(FIELDS.modelName, event.target.value),
    [editSetting],
  );

  // Typing within the same profile keeps the values; another profile (or none) resets them. Keyed on the
  // recognized profile rather than on keystrokes so a profile list that arrives after typing still applies.
  // A stored row keeps its values until its name is changed.
  const appliedProfileIdRef = useRef(profile?.id ?? null);
  const isModelNameEdited = settings.name !== initialSettings?.name;
  useEffect(() => {
    const profileId = profile?.id ?? null;
    if (profileId === appliedProfileIdRef.current) return;
    appliedProfileIdRef.current = profileId;
    if (!isEditing || isModelNameEdited) applyReasoningSettings(buildReasoningSettingsFromProfile(profile));
  }, [applyReasoningSettings, isEditing, isModelNameEdited, profile]);

  const onApplyProfile = useCallback(
    () => applyReasoningSettings(buildReasoningSettingsFromProfile(profile)),
    [applyReasoningSettings, profile],
  );

  const onReasoningChange = useCallback(
    (field, isChecked) => {
      if (!isChecked) {
        applyReasoningSettings(buildReasoningSettingsFromProfile(null));
        return;
      }
      editSetting(FIELDS.reasoning, true);
      if (profile?.supports_reasoning && !isLlmModelReasoningConfigured(settings)) {
        applyReasoningSettings(buildReasoningSettingsFromProfile(profile));
      }
    },
    [applyReasoningSettings, editSetting, profile, settings],
  );

  const onModelNameBlur = useCallback(() => {
    const trimmedModelName = String(settings.name ?? '').trim();
    if (trimmedModelName !== settings.name) editSetting(FIELDS.modelName, trimmedModelName);
  }, [editSetting, settings.name]);

  const onTokenLimitChange = useCallback(
    event => editSetting(event.target.name, parseLlmModelTokenLimitInput(event.target.value)),
    [editSetting],
  );

  const onSwitchChange = useCallback((field, isChecked) => editSetting(field, isChecked), [editSetting]);

  const onModelTierChange = useCallback(
    tier => {
      const tierFlags = getLlmModelTierFlags(tier);
      editSetting(FIELDS.lowTier, tierFlags.low_tier);
      editSetting(FIELDS.highTier, tierFlags.high_tier);
    },
    [editSetting],
  );

  const onCredentialsChange = useCallback(
    credential => {
      editSetting(FIELDS.credentials, credential);
      if (credentialKeyOf(credential) !== credentialKeyOf(settings.ai_credentials)) {
        editSetting(FIELDS.apiProtocol, undefined);
      }
    },
    [editSetting, settings.ai_credentials],
  );

  const onApiProtocolChange = useCallback(
    protocol => editSetting(FIELDS.apiProtocol, protocol),
    [editSetting],
  );

  return (
    <Box
      sx={styles.form}
      data-testid="llm-model-form"
    >
      <LlmModelFormSection
        title={SECTIONS.model.title}
        hasError={hasVisibleErrorIn(SECTIONS.model)}
      >
        <LlmModelField
          field={FIELDS.displayName}
          required
          error={visibleErrors[FIELDS.displayName]}
        >
          <Input.InputBase
            id={`llm-model-${FIELDS.displayName}`}
            value={settings.label ?? ''}
            onChange={onDisplayNameChange}
            error={Boolean(visibleErrors[FIELDS.displayName])}
            enableAutoBlur={false}
            autoComplete="off"
          />
        </LlmModelField>
        <LlmModelField
          field={FIELDS.id}
          required
          error={visibleErrors[FIELDS.id]}
        >
          <Box sx={styles.idRow}>
            <Input.InputBase
              id={`llm-model-${FIELDS.id}`}
              value={settings.elitea_title ?? ''}
              onChange={onIdChange}
              error={Boolean(visibleErrors[FIELDS.id])}
              inputProps={isEditing ? READ_ONLY_INPUT_PROPS : undefined}
              enableAutoBlur={false}
              autoComplete="off"
            />
            {isEditing && (
              <LockSimple
                aria-label="ID can't be changed"
                data-testid="llm-model-id-lock"
                sx={styles.lockIcon}
              />
            )}
          </Box>
        </LlmModelField>
        <LlmModelField
          field={FIELDS.description}
          error={visibleErrors[FIELDS.description]}
        >
          <Input.InputBase
            id={`llm-model-${FIELDS.description}`}
            value={settings.description ?? ''}
            onChange={onDescriptionChange}
            onBlur={onDescriptionBlur}
            error={Boolean(visibleErrors[FIELDS.description])}
            inputProps={DESCRIPTION_INPUT_PROPS}
            enableAutoBlur={false}
            autoComplete="off"
          />
          <Text.CharacterCounter
            value={settings.description ?? ''}
            maxLength={LLM_MODEL_DESCRIPTION_MAX_LENGTH}
            hideMaxLimitMessage
            data-testid="llm-model-description-counter"
          />
        </LlmModelField>
        <LlmModelField
          field={FIELDS.modelName}
          required
          error={visibleErrors[FIELDS.modelName]}
          helperText={LLM_MODEL_MODEL_NAME_HELPER_TEXT}
          status={recognition}
        >
          <Input.InputBase
            id={`llm-model-${FIELDS.modelName}`}
            value={settings.name ?? ''}
            onChange={onModelNameChange}
            onBlur={onModelNameBlur}
            error={Boolean(visibleErrors[FIELDS.modelName])}
            enableAutoBlur={false}
            autoComplete="off"
          />
        </LlmModelField>
      </LlmModelFormSection>

      <LlmModelFormSection
        title={SECTIONS.limits.title}
        hasError={hasVisibleErrorIn(SECTIONS.limits)}
      >
        <Box sx={styles.limitsRow}>
          {[FIELDS.contextWindow, FIELDS.maxOutputTokens].map(field => (
            <LlmModelField
              key={field}
              field={field}
              required
              error={visibleErrors[field]}
              sx={styles.limitField}
            >
              <Input.InputBase
                id={`llm-model-${field}`}
                name={field}
                value={settings[field] ?? ''}
                onChange={onTokenLimitChange}
                error={Boolean(visibleErrors[field])}
                inputProps={NUMERIC_INPUT_PROPS}
                enableAutoBlur={false}
                autoComplete="off"
              />
            </LlmModelField>
          ))}
        </Box>
      </LlmModelFormSection>

      <LlmModelFormSection
        title={SECTIONS.capabilities.title}
        hasError={hasVisibleErrorIn(SECTIONS.capabilities)}
      >
        <LlmModelSwitchField
          field={FIELDS.vision}
          checked={settings.supports_vision}
          onChange={onSwitchChange}
          error={visibleErrors[FIELDS.vision]}
        />
        {isReasoningShown && (
          <LlmModelSwitchField
            field={FIELDS.reasoning}
            checked={settings.supports_reasoning}
            onChange={onReasoningChange}
            error={visibleErrors[FIELDS.reasoning]}
            locked={isReasoningLocked}
            description={getLlmModelReasoningDescription(profile)}
          >
            {settings.supports_reasoning && (
              <LlmModelReasoningPanel
                settings={settings}
                initialSettings={initialSettings}
                isEditing={isEditing}
                profile={profile}
                effortLevels={effortLevels}
                visibleErrors={visibleErrors}
                editSetting={editSetting}
                onApplyProfile={onApplyProfile}
              />
            )}
          </LlmModelSwitchField>
        )}
      </LlmModelFormSection>

      <LlmModelFormSection
        title={SECTIONS.availability.title}
        hasError={hasVisibleErrorIn(SECTIONS.availability)}
      >
        <LlmModelField
          field={FIELDS.modelTier}
          error={visibleErrors[FIELDS.modelTier]}
          warning={hasConflictingLlmModelTiers(settings) ? LLM_MODEL_TIER_CONFLICT_WARNING : undefined}
        >
          <Select.SingleSelect
            id={`llm-model-${FIELDS.modelTier}`}
            data-testid="llm-model-tier-select"
            value={getLlmModelTier(settings)}
            options={LLM_MODEL_TIER_OPTIONS}
            onValueChange={onModelTierChange}
            error={Boolean(visibleErrors[FIELDS.modelTier])}
            showBorder
            displayEmpty
            showEmptyPlaceholder={false}
            customSelectedFontSize="0.875rem"
          />
        </LlmModelField>
        <LlmModelSwitchField
          field={FIELDS.shared}
          checked={settings.shared}
          onChange={onSwitchChange}
        />
      </LlmModelFormSection>

      <LlmModelFormSection
        title={SECTIONS.connection.title}
        hasError={hasVisibleErrorIn(SECTIONS.connection)}
      >
        <LlmModelField
          field={FIELDS.credentials}
          required
          error={visibleErrors[FIELDS.credentials] || visibleErrors[FIELDS.credentialsCheck]}
        >
          <CredentialsSelect
            label=""
            value={settings.ai_credentials}
            onSelectConfiguration={onCredentialsChange}
            error={Boolean(visibleErrors[FIELDS.credentials])}
            section={LLM_MODEL_CREDENTIALS_SECTION}
            getOptionTypeTag={getCredentialOptionTypeTag}
            propKey={FIELDS.credentials}
            sx={CREDENTIALS_SELECT_SX}
          />
        </LlmModelField>
        {isApiProtocolShown && (
          <LlmModelField
            field={FIELDS.apiProtocol}
            required
            error={visibleErrors[FIELDS.apiProtocol]}
          >
            <Select.SingleSelect
              id={`llm-model-${FIELDS.apiProtocol}`}
              data-testid="llm-model-api-protocol-select"
              value={apiProtocol}
              options={LLM_MODEL_API_PROTOCOL_OPTIONS}
              onValueChange={onApiProtocolChange}
              error={Boolean(visibleErrors[FIELDS.apiProtocol])}
              showBorder
              displayEmpty
              showEmptyPlaceholder={false}
              customSelectedFontSize="0.875rem"
            />
          </LlmModelField>
        )}
        <LlmModelSwitchField
          field={FIELDS.openaiCompatible}
          checked={settings.openai_compatible}
          onChange={onSwitchChange}
        />
      </LlmModelFormSection>
    </Box>
  );
});

LlmModelForm.displayName = 'LlmModelForm';

/** @type {MuiSx} */
const llmModelFormStyles = () => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    paddingBottom: '1rem',
  },
  idRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  lockIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  limitsRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  limitField: {
    flex: '1 1 12rem',
  },
});

export default LlmModelForm;
