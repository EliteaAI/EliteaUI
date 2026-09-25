import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { Input, Select } from '@/[fsd]/shared/ui';
import LockSimple from '@/components/Icons/LockSimple';

import { LlmModelFormConstants } from '../../lib/constants';
import { credentialKeyOf, isApiProtocolCredentialType } from '../../lib/helpers/apiProtocol.helpers.js';
import {
  convertDisplayNameToLlmModelId,
  getLlmModelCredentialTypeTag,
  getLlmModelTier,
  getLlmModelTierFlags,
  hasConflictingLlmModelTiers,
  parseLlmModelTokenLimitInput,
  pickVisibleLlmModelErrors,
} from '../../lib/helpers/llmModelForm.helpers.js';
import { useLlmModelCredentialType, useLlmModelTakenIds } from '../../lib/hooks';
import { validateLlmModelSettings } from '../../lib/validation';
import CredentialsSelect from '../credentials-select/CredentialsSelect';
import LlmModelField from './LlmModelField';
import LlmModelFormSection from './LlmModelFormSection';
import LlmModelSwitchField from './LlmModelSwitchField';

const {
  LLM_MODEL_API_PROTOCOL_OPTIONS,
  LLM_MODEL_CREDENTIALS_SECTION,
  LLM_MODEL_FIELDS: FIELDS,
  LLM_MODEL_MODEL_NAME_HELPER_TEXT,
  LLM_MODEL_SECTIONS: SECTIONS,
  LLM_MODEL_STORED_DIAL_PROTOCOL_FALLBACK,
  LLM_MODEL_TIER_CONFLICT_WARNING,
  LLM_MODEL_TIER_OPTIONS,
} = LlmModelFormConstants;

const READ_ONLY_INPUT_PROPS = { readOnly: true };
const NUMERIC_INPUT_PROPS = { inputMode: 'numeric' };
const CREDENTIALS_SELECT_SX = { marginTop: 0 };

const getCredentialOptionTypeTag = configuration => getLlmModelCredentialTypeTag(configuration?.type);

const LlmModelForm = memo(props => {
  const { editToolDetail, editField, setToolErrors, showValidation, validationErrorMessages } = props;
  const settings = useMemo(() => editToolDetail?.settings || {}, [editToolDetail?.settings]);
  const isEditing = Boolean(editToolDetail?.id);
  const { initialValues } = useFormikContext();
  const initialSettings = initialValues?.settings;
  const [openInfoField, setOpenInfoField] = useState(null);
  const styles = llmModelFormStyles();

  const { credentialType, isCredentialTypePending } = useLlmModelCredentialType(settings.ai_credentials);
  const takenIds = useLlmModelTakenIds({ skip: isEditing });

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
      }),
    [settings, isEditing, takenIds, isApiProtocolShown, isCredentialTypePending, apiProtocol],
  );

  useEffect(() => {
    setToolErrors(errors);
  }, [errors, setToolErrors]);

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

  const onInfoToggle = useCallback(
    field => setOpenInfoField(current => (current === field ? null : field)),
    [],
  );

  const onInfoClose = useCallback(
    field => setOpenInfoField(current => (current === field ? null : current)),
    [],
  );

  const hasVisibleErrorIn = section => section.fields.some(field => visibleErrors[field]);

  const editSetting = useCallback((field, value) => editField(`settings.${field}`, value), [editField]);

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

  const onModelNameChange = useCallback(
    event => editSetting(FIELDS.modelName, event.target.value),
    [editSetting],
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
          isInfoOpen={openInfoField === FIELDS.displayName}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
          isInfoOpen={openInfoField === FIELDS.id}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
          field={FIELDS.modelName}
          required
          error={visibleErrors[FIELDS.modelName]}
          helperText={LLM_MODEL_MODEL_NAME_HELPER_TEXT}
          isInfoOpen={openInfoField === FIELDS.modelName}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
              isInfoOpen={openInfoField === field}
              onInfoToggle={onInfoToggle}
              onInfoClose={onInfoClose}
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
        {[FIELDS.vision, FIELDS.reasoning].map(field => (
          <LlmModelSwitchField
            key={field}
            field={field}
            checked={settings[field]}
            onChange={onSwitchChange}
            error={visibleErrors[field]}
            isInfoOpen={openInfoField === field}
            onInfoToggle={onInfoToggle}
            onInfoClose={onInfoClose}
          />
        ))}
      </LlmModelFormSection>

      <LlmModelFormSection
        title={SECTIONS.availability.title}
        hasError={hasVisibleErrorIn(SECTIONS.availability)}
      >
        <LlmModelField
          field={FIELDS.modelTier}
          error={visibleErrors[FIELDS.modelTier]}
          warning={hasConflictingLlmModelTiers(settings) ? LLM_MODEL_TIER_CONFLICT_WARNING : undefined}
          isInfoOpen={openInfoField === FIELDS.modelTier}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
          isInfoOpen={openInfoField === FIELDS.shared}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
          isInfoOpen={openInfoField === FIELDS.credentials}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
            isInfoOpen={openInfoField === FIELDS.apiProtocol}
            onInfoToggle={onInfoToggle}
            onInfoClose={onInfoClose}
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
          isInfoOpen={openInfoField === FIELDS.openaiCompatible}
          onInfoToggle={onInfoToggle}
          onInfoClose={onInfoClose}
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
