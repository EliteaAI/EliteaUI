import { useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { ApiProtocolConstants, ApiProtocolHelpers } from '@/[fsd]/features/settings/lib';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useCredentialsData } from './useCredentialsData.hooks.js';

const { API_PROTOCOL_CREDENTIAL_FIELD, API_PROTOCOL_FIELD } = ApiProtocolConstants;
const { findCredentialType, isApiProtocolCredentialType, resolveApiProtocolForModel } = ApiProtocolHelpers;

const CREDENTIALS_SECTION = 'ai_credentials';
const noop = () => {};

// Hides api_protocol unless the credential supports it, and auto-suggests it from the model name.
export const useApiProtocolField = ({ schema, settings, editField }) => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);

  const hasField = !!schema?.properties?.[API_PROTOCOL_FIELD];
  const credentialValue = settings?.[API_PROTOCOL_CREDENTIAL_FIELD];

  const { configurations } = useCredentialsData({
    // only fetch while the field can actually be shown for this schema
    selectedProjectId: hasField ? selectedProjectId : undefined,
    personal_project_id: hasField ? personal_project_id : undefined,
    section: CREDENTIALS_SECTION,
    batchValidateCredentials: noop,
    resetStatuses: noop,
  });

  const isSupported = useMemo(() => {
    const eliteaTitle = credentialValue?.elitea_title;
    const resolvedType = findCredentialType(configurations, credentialValue, personal_project_id);
    // a credential is being picked/just created and not resolvable yet — don't assume it's unsupported
    if (eliteaTitle && !resolvedType) return true;
    return isApiProtocolCredentialType(resolvedType);
  }, [configurations, credentialValue, personal_project_id]);

  const isHidden = hasField && !isSupported;

  const schemaDefault = schema?.properties?.[API_PROTOCOL_FIELD]?.default;
  const rawProtocol = settings?.[API_PROTOCOL_FIELD];
  const modelName = settings?.name;
  // guards against re-suggesting for a name we already answered, editField being async
  const autoSelectedForRef = useRef(null);
  const autoSelectedValueRef = useRef(null);
  // seed the "already seen" name once settings actually load, so opening a saved model
  // whose stored protocol happens to equal the schema default doesn't get rewritten
  const hasSeededNameRef = useRef(false);

  useEffect(() => {
    if (hasSeededNameRef.current || modelName === undefined) return;
    hasSeededNameRef.current = true;
    autoSelectedForRef.current = modelName;
  }, [modelName]);

  // the form seeds the schema default, and our own suggestion is not a user choice either
  const isUserPicked =
    !!rawProtocol && rawProtocol !== schemaDefault && rawProtocol !== autoSelectedValueRef.current;

  useEffect(() => {
    if (isHidden || !hasField || isUserPicked || autoSelectedForRef.current === modelName) return;
    const suggested = resolveApiProtocolForModel(modelName);
    if (!suggested) return;
    autoSelectedForRef.current = modelName;
    autoSelectedValueRef.current = suggested;
    editField?.(`settings.${API_PROTOCOL_FIELD}`, suggested);
  }, [isHidden, hasField, isUserPicked, modelName, editField]);

  return { isApiProtocolHidden: isHidden };
};
